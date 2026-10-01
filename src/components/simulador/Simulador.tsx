"use client";

/**
 * EL SIMULADOR DE COMPRA DE VIVIENDA (/simulador y /en/mortgage-calculator)
 * ========================================================================
 *
 * La página de la fase 4 del plan de los prompts de Luciano (30-sep-2026),
 * sobre el motor de src/lib/simulador. Dos trabajos: que la persona entienda
 * en minutos cuánto necesita, cuánto paga y qué le alcanza de la cartera, y
 * que ese entendimiento llegue a Rafael como un lead calificado.
 *
 * Reglas que no se mueven (docs/simulador/README.md):
 *  · El resultado nunca se esconde detrás de un formulario. Los datos
 *    personales se piden solo para guardar, enviar o pedir ayuda.
 *  · Cada cifra dice de dónde sale (Fuente, Supuesto o Tu dato). Una cifra de
 *    la configuración sin verificar sale como «Supuesto».
 *  · No es una oferta de crédito: ninguna tasa se presenta como la oferta de
 *    un banco, ni se promete aprobación.
 *  · Todo lo que depende de la fecha o de la dirección de la página se lee
 *    después de montar: el HTML del build no cambia al hidratar (error #418).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { simularCompra, type EntradaSimulador, type ResultadoSimulador } from "@/lib/simulador/simular";
import {
  capacidadDeCompra,
  primeraCuota,
  proyectosQueAlcanzan,
  type Condiciones,
  type ItemCartera,
  type Perfil,
} from "@/lib/simulador/cartera";
import { LIMITE, LIMITES, PARAMETROS, TARIFAS } from "@/components/simulador/parametros";
import type { Idioma } from "@/i18n/idioma";
import { Contexto, useSim, type ContextoSim } from "@/components/simulador/contexto";
import { TEXTOS } from "@/components/simulador/textos";
import type { EstadoSim, ItemSimulador, Pestana } from "@/components/simulador/tipos";
import { CampoDinero, Chips, Etiqueta, Ficha, Interruptor, origenDe } from "@/components/simulador/Campos";
import { anios, meses, mesDesdeHoy, pesos, pesosCorto, porcentaje, rangoAhorro, rangoIngreso } from "@/components/simulador/formato";
import { evento } from "@/components/simulador/analitica";
import Alcanzan from "@/components/simulador/Alcanzan";
import { Composicion, LineaTiempo, TablaAnual } from "@/components/simulador/Graficas";
import {
  PestanaBeneficios,
  PestanaCompra,
  PestanaEscenarios,
  PestanaFinanciacion,
  PestanaGastos,
  PestanaInversion,
  type EscenarioGuardado,
} from "@/components/simulador/Pestanas";
import Acciones from "@/components/simulador/Acciones";
import { escribirEnlace, leerEnlace } from "@/components/simulador/enlace";
import { Usd, useReferenciaUSD } from "@/components/simulador/Dolares";

const P = PARAMETROS;

function estadoInicial(items: ItemSimulador[]): EstadoSim {
  const primero = items.find((i) => i.precio != null);
  return {
    vista: "inicio",
    inicioPorCuota: false,
    proposito: "vivir",
    ingreso: 0,
    conCodeudor: false,
    ingresoCodeudor: 0,
    otrasDeudas: 0,
    ahorros: 0,
    cesantias: 0,
    ahorroMensual: 0,
    cuotaDeseada: 0,
    item: primero?.slug ?? "",
    precio: primero?.precio ?? 300_000_000,
    separacion: 0,
    meses: primero?.meses ?? P.mesesEntregaSupuesto.valor,
    esVIS: false,
    modalidad: "pesos",
    pctFinanciado: P.pctFinanciadoPorDefecto.valor,
    plazoAnios: P.plazoPorDefectoAnios.valor,
    tasa: P.tasaNoVISPesos.valor,
    tasaUVR: P.tasaRealUVR.valor,
    inflacion: P.inflacionProyectada.valor,
    opcionCompra: P.opcionCompraLeasing.valor,
    seguros: true,
    abonoAnual: 0,
    abonoMensual: 0,
    abonoDesde: 12,
    abonoReduce: "plazo",
    estudio: 0,
    tarifaMarginal: null,
    exterior: false,
    monedaExterior: "USD",
    ingresoExterior: 0,
    tasaCambio: P.trmReferencia.valor,
    tarifaNocheUSD: P.tarifaNocheUSD.valor,
    ocupacion: P.ocupacionRentaCorta.valor,
    comision: P.comisionOperador.valor,
    administracion: 0,
    predial: 0,
    servicios: 0,
    dotacion: 0,
    canon: 0,
    arriendo: 0,
    valorizacion: P.inflacionProyectada.valor,
    pestana: "compra",
    editados: [],
  };
}

/** La entrada del motor a partir de lo que la persona movió. */
export function entradaDe(e: EstadoSim): EntradaSimulador {
  return {
    precio: e.precio,
    modalidad: e.modalidad,
    pctFinanciado: e.pctFinanciado,
    plazoAnios: e.plazoAnios,
    tasaEA: e.modalidad === "uvr" ? (e.tasaUVR ?? 0) : e.tasa,
    inflacionEA: e.inflacion,
    opcionCompra: e.opcionCompra,
    esVIS: e.esVIS,
    exterior: e.exterior,
    separacion: e.separacion,
    ahorros: e.ahorros,
    cesantias: e.cesantias,
    ahorroMensual: e.ahorroMensual > 0 ? e.ahorroMensual : null,
    mesesHastaEntrega: e.meses,
    ingresoHogar: e.ingreso + (e.conCodeudor ? e.ingresoCodeudor : 0),
    otrasDeudas: e.otrasDeudas,
    seguros: e.seguros ? { vidaMensual: P.seguroVidaMensual.valor, incendioMensual: P.seguroIncendioMensual.valor } : null,
    abonos:
      e.abonoAnual > 0 || e.abonoMensual > 0
        ? {
            anual: e.abonoAnual > 0 ? e.abonoAnual : undefined,
            mensual: e.abonoMensual > 0 ? e.abonoMensual : undefined,
            desdeMes: Math.max(1, Math.round(e.abonoDesde)),
            reduce: e.abonoReduce,
          }
        : undefined,
    estudioTitulosYAvaluo: e.estudio,
  };
}

/** Las condiciones de crédito para la capacidad y la lista de la cartera. */
export function condicionesDe(e: EstadoSim): Condiciones {
  const modalidad = e.modalidad === "contado" || (e.modalidad === "uvr" && e.tasaUVR == null) ? "pesos" : e.modalidad;
  return {
    modalidad,
    pctFinanciado: e.modalidad === "contado" ? P.pctFinanciadoPorDefecto.valor : e.pctFinanciado,
    tasaEA: modalidad === "uvr" ? (e.tasaUVR ?? 0) : e.tasa,
    plazoAnios: e.plazoAnios,
    opcionCompra: modalidad === "leasing" ? e.opcionCompra : 0,
    inflacionEA: e.inflacion,
    limiteCuotaIngreso: LIMITE,
  };
}

export function perfilDe(e: EstadoSim): Perfil {
  return {
    ingresoHogar: e.ingreso + (e.conCodeudor ? e.ingresoCodeudor : 0),
    ahorros: e.ahorros,
    cesantias: e.cesantias,
    ahorroMensual: e.ahorroMensual,
  };
}

export function carteraDe(items: ItemSimulador[]): ItemCartera[] {
  return items.map((i) => ({
    slug: i.slug,
    nombre: i.nombre,
    tipo: i.tipo,
    precio: i.precio,
    mesesHastaEntrega: i.meses,
    separacion: null,
    cuotaInicialPct: null,
  }));
}

// ── El componente ────────────────────────────────────────────────────────

export default function Simulador({ idioma, items }: { idioma: Idioma; items: ItemSimulador[] }) {
  const t = TEXTOS[idioma];
  const [estado, setEstado] = useState<EstadoSim>(() => estadoInicial(items));
  const [hoy, setHoy] = useState<string | null>(null);
  const [escenarios, setEscenarios] = useState<EscenarioGuardado[]>([]);
  const interactuo = useRef(false);
  const trmUSD = useReferenciaUSD();
  const avisos = useRef({ inicio: false, lista: false, completo: false });

  const set = useCallback<ContextoSim["set"]>((cambios, opciones) => {
    const marcar = opciones?.marcar ?? true;
    if (marcar) interactuo.current = true;
    setEstado((e) => {
      const n = { ...e, ...cambios };
      if (marcar) {
        const nuevos = Object.keys(cambios).filter((k) => !e.editados.includes(k));
        if (nuevos.length) n.editados = [...e.editados, ...nuevos];
      }
      return n;
    });
  }, []);
  const editado = useCallback((k: keyof EstadoSim) => estado.editados.includes(k), [estado.editados]);

  // Al montar: la fecha de hoy, el enlace con el escenario y el evento de la visita.
  useEffect(() => {
    setHoy(new Date().toISOString().slice(0, 10));
    const { estado: desdeEnlace, hubo, deHash } = leerEnlace(items, estadoInicial(items));
    if (hubo) setEstado(desdeEnlace);
    const q = new URLSearchParams(window.location.search);
    evento("simulator_view", {
      entrada: deHash ? "enlace" : q.has("p") ? "proyecto" : q.has("utm_source") || q.has("gclid") || q.has("fbclid") ? "anuncio" : "directa",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // La dirección de la página sigue al escenario, para compartirlo tal cual.
  // Después del «#»: ahí van el ingreso y los ahorros (enlace.ts).
  useEffect(() => {
    if (!interactuo.current) return;
    const id = window.setTimeout(() => {
      const url = `${window.location.pathname}${window.location.search}#${escribirEnlace(estado)}`;
      window.history.replaceState(window.history.state, "", url);
    }, 400);
    return () => window.clearTimeout(id);
  }, [estado]);

  const itemSel = items.find((i) => i.slug === estado.item) ?? null;
  const perfil = perfilDe(estado);
  const cond = condicionesDe(estado);
  const cartera = useMemo(() => carteraDe(items), [items]);
  const mesesSupuesto = P.mesesEntregaSupuesto.valor;
  const r = useMemo(() => simularCompra(entradaDe(estado), { limites: LIMITES, tarifas: TARIFAS }), [estado]);
  const rSinAbonos = useMemo(
    () => (estado.abonoAnual > 0 || estado.abonoMensual > 0 ? simularCompra({ ...entradaDe(estado), abonos: undefined }, { limites: LIMITES, tarifas: TARIFAS }) : null),
    [estado],
  );
  const capacidad = useMemo(() => capacidadDeCompra(perfil, cond, mesesSupuesto), [perfil.ingresoHogar, perfil.ahorros, perfil.cesantias, perfil.ahorroMensual, cond.modalidad, cond.pctFinanciado, cond.tasaEA, cond.plazoAnios, cond.opcionCompra]); // eslint-disable-line react-hooks/exhaustive-deps
  const alcanzan = useMemo(() => proyectosQueAlcanzan(cartera, perfil, cond, mesesSupuesto), [cartera, estado]); // eslint-disable-line react-hooks/exhaustive-deps

  const ingresoHogar = perfil.ingresoHogar;
  const recursos = estado.ahorros + estado.cesantias;
  const listo = estado.inicioPorCuota ? estado.cuotaDeseada > 0 : ingresoHogar > 0 && recursos + estado.ahorroMensual > 0;
  const faltaTasaUVR = estado.modalidad === "uvr" && estado.tasaUVR == null;

  // Los eventos de «terminó el inicio rápido» y «vio la lista», una vez cada uno.
  useEffect(() => {
    if (!listo || avisos.current.inicio) return;
    avisos.current.inicio = true;
    evento("simulator_quickstart_complete", {
      proposito: estado.proposito,
      rango_ingreso: rangoIngreso(ingresoHogar),
      rango_ahorro: rangoAhorro(recursos),
    });
    if (!avisos.current.lista) {
      avisos.current.lista = true;
      evento("simulator_matches_view", { n_alcanzan: alcanzan.evaluados.filter((x) => x.estado === "alcanza").length });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listo]);

  // «Simulación completa»: en el modo detallado, cuando la persona deja de mover por un momento.
  useEffect(() => {
    if (estado.vista !== "experto" || avisos.current.completo || !r.credito || !interactuo.current) return;
    const id = window.setTimeout(() => {
      avisos.current.completo = true;
      evento("simulator_complete", {
        proyecto: estado.item || "otro",
        modalidad: estado.modalidad,
        plazo_anios: estado.plazoAnios,
        rango_ingreso: rangoIngreso(ingresoHogar),
        cumple_limite: r.estadoLegal !== "supera",
      });
    }, 1500);
    return () => window.clearTimeout(id);
  }, [estado, r, ingresoHogar]);

  const ctx: ContextoSim = { idioma, t, estado, set, editado, hoy, trmUSD };

  const elegirItem = (slug: string) => {
    const it = items.find((i) => i.slug === slug);
    set({ item: slug }, { marcar: true });
    if (it) {
      set(
        {
          precio: it.precio ?? estado.precio,
          meses: it.meses ?? mesesSupuesto,
          separacion: 0,
        },
        { marcar: false },
      );
      setEstado((e) => ({ ...e, editados: e.editados.filter((k) => k !== "precio" && k !== "meses" && k !== "separacion") }));
    }
  };

  const abrirDetalle = (slug?: string) => {
    if (slug) elegirItem(slug);
    set({ vista: "experto" }, { marcar: false });
    interactuo.current = true;
    window.requestAnimationFrame(() => document.getElementById("sim-detalle")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  /** Una palanca sugerida: se aplica al detalle con ese inmueble elegido. */
  const aplicarPalanca = (slug: string, cambios: Partial<EstadoSim>) => {
    elegirItem(slug);
    set(cambios);
    abrirDetalle();
  };

  const guardarEscenario = () => {
    if (escenarios.length >= 3) return;
    const nombre = t.nombreEscenario(itemSel?.nombre ?? t.otroPrecio, estado.modalidad, estado.pctFinanciado, estado.plazoAnios);
    const nuevos = [...escenarios, { nombre, resultado: r }];
    setEscenarios(nuevos);
    evento("simulator_scenario_save", { n_escenarios: nuevos.length });
  };

  return (
    <Contexto.Provider value={ctx}>
      <div className="sim">
        {/* ── Inicio rápido (M1) ───────────────────────────────── */}
        <section className="sim-inicio" aria-labelledby="sim-inicio-titulo">
          <div className="sim-inicio-cabeza">
            <h2 id="sim-inicio-titulo">{t.inicioTitulo}</h2>
            <div className="sim-alternar" role="group" aria-label={t.comoEmpezar}>
              <button type="button" aria-pressed={!estado.inicioPorCuota} onClick={() => set({ inicioPorCuota: false }, { marcar: false })}>
                {t.desdeIngreso}
              </button>
              <button type="button" aria-pressed={estado.inicioPorCuota} onClick={() => set({ inicioPorCuota: true }, { marcar: false })}>
                {t.desdeCuota}
              </button>
            </div>
          </div>

          {estado.inicioPorCuota ? (
            <div className="sim-preguntas">
              <CampoDinero
                etiqueta={t.cuotaComoda}
                valor={estado.cuotaDeseada}
                onChange={(v) => set({ cuotaDeseada: v })}
                max={15_000_000}
                paso={100_000}
                ayuda={t.cuotaComodaAyuda}
              />
            </div>
          ) : (
            <div className="sim-preguntas">
              <Chips
                leyenda={t.paraQue}
                nombre="sim-proposito"
                valor={estado.proposito}
                onChange={(v) => set({ proposito: v })}
                opciones={[
                  { valor: "vivir", texto: t.propositoVivir },
                  { valor: "invertir", texto: t.propositoInvertir },
                  { valor: "ambas", texto: t.propositoAmbas },
                ]}
              />
              <div className="sim-pregunta">
                <CampoDinero
                  etiqueta={t.ingresoHogar}
                  valor={estado.ingreso}
                  onChange={(v) => set({ ingreso: v })}
                  max={60_000_000}
                  paso={250_000}
                  ayuda={t.ingresoHogarAyuda}
                />
                <Interruptor texto={t.sumarCodeudor} valor={estado.conCodeudor} onChange={(v) => set({ conCodeudor: v })} />
                {estado.conCodeudor && (
                  <CampoDinero
                    etiqueta={t.ingresoCodeudor}
                    valor={estado.ingresoCodeudor}
                    onChange={(v) => set({ ingresoCodeudor: v })}
                    max={60_000_000}
                    paso={250_000}
                  />
                )}
              </div>
              <div className="sim-pregunta">
                <p className="sim-pregunta-titulo">{t.paraLaCuotaInicial}</p>
                <CampoDinero etiqueta={t.ahorros} valor={estado.ahorros} onChange={(v) => set({ ahorros: v })} max={600_000_000} paso={1_000_000} />
                <CampoDinero etiqueta={t.cesantias} valor={estado.cesantias} onChange={(v) => set({ cesantias: v })} max={200_000_000} paso={500_000} />
                <CampoDinero
                  etiqueta={t.ahorroMensual}
                  valor={estado.ahorroMensual}
                  onChange={(v) => set({ ahorroMensual: v })}
                  max={30_000_000}
                  paso={100_000}
                  ayuda={t.ahorroMensualAyuda}
                />
              </div>
            </div>
          )}

          <div className="sim-respuesta" aria-live="polite">
            {!listo ? (
              <p className="sim-respuesta-vacia">{estado.inicioPorCuota ? t.vacioCuota : t.vacioIngreso}</p>
            ) : estado.inicioPorCuota ? (
              <ResultadoPorCuota cuota={estado.cuotaDeseada} cond={cond} />
            ) : (
              <>
                <p className="sim-alcance">
                  <span>{t.teAlcanzaHasta}</span>
                  <strong>{pesos(capacidad.precioMaximo, idioma)}</strong>
                  <Usd cop={capacidad.precioMaximo} />
                </p>
                <p className="sim-alcance-detalle">
                  {capacidad.limita === "ingreso"
                    ? t.limitaIngreso(pesos(capacidad.cuotaMaxima, idioma), porcentaje(LIMITE, idioma))
                    : t.limitaCuotaInicial(porcentaje(1 - cond.pctFinanciado, idioma), meses(mesesSupuesto, idioma))}{" "}
                  <Etiqueta
                    origen={origenDe(
                      capacidad.limita === "ingreso"
                        ? P.cuotaIngresoMax
                        : cond.modalidad === "leasing"
                          ? P.financiacionMaxLeasing
                          : P.financiacionMaxNoVIS,
                    )}
                  />
                </p>
                <Alcanzan
                  resultado={alcanzan}
                  items={items}
                  perfil={perfil}
                  cond={cond}
                  alSimular={(slug) => abrirDetalle(slug)}
                  alAplicar={aplicarPalanca}
                />
              </>
            )}
            {estado.vista === "inicio" && (
              <button type="button" className="btn-primary sim-abrir" onClick={() => abrirDetalle()}>
                {t.ajustarDetalle}
              </button>
            )}
          </div>
        </section>

        {/* ── El detalle (M2 a M18) ─────────────────────────────── */}
        {estado.vista === "experto" && (
          <section className="sim-detalle" id="sim-detalle" aria-labelledby="sim-detalle-titulo">
            <h2 id="sim-detalle-titulo" className="sr-only">
              {t.detalleTitulo}
            </h2>
            <Frase r={r} items={items} faltaTasaUVR={faltaTasaUVR} />

            <div className="sim-grid">
              <div className="sim-controles">
                <div className="sim-pestanas" role="tablist" aria-label={t.detalleTitulo}>
                  {(Object.keys(t.pestanas) as Pestana[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      role="tab"
                      id={`sim-tab-${p}`}
                      aria-selected={estado.pestana === p}
                      aria-controls={`sim-panel-${p}`}
                      tabIndex={estado.pestana === p ? 0 : -1}
                      onClick={() => set({ pestana: p }, { marcar: false })}
                      onKeyDown={(ev) => {
                        const orden = Object.keys(t.pestanas) as Pestana[];
                        const i = orden.indexOf(estado.pestana);
                        const sig = ev.key === "ArrowRight" ? orden[(i + 1) % orden.length] : ev.key === "ArrowLeft" ? orden[(i - 1 + orden.length) % orden.length] : null;
                        if (sig) {
                          ev.preventDefault();
                          set({ pestana: sig }, { marcar: false });
                          document.getElementById(`sim-tab-${sig}`)?.focus();
                        }
                      }}
                    >
                      {t.pestanas[p]}
                    </button>
                  ))}
                </div>
                <div className="sim-panel" role="tabpanel" id={`sim-panel-${estado.pestana}`} aria-labelledby={`sim-tab-${estado.pestana}`}>
                  {estado.pestana === "compra" && <PestanaCompra items={items} r={r} alElegir={elegirItem} />}
                  {estado.pestana === "financiacion" && <PestanaFinanciacion r={r} rSinAbonos={rSinAbonos} faltaTasaUVR={faltaTasaUVR} />}
                  {estado.pestana === "gastos" && <PestanaGastos r={r} />}
                  {estado.pestana === "beneficios" && <PestanaBeneficios r={r} />}
                  {estado.pestana === "inversion" && <PestanaInversion r={r} item={itemSel} items={items} />}
                  {estado.pestana === "escenarios" && (
                    <PestanaEscenarios
                      escenarios={escenarios}
                      alGuardar={guardarEscenario}
                      alQuitar={(i) => setEscenarios(escenarios.filter((_, k) => k !== i))}
                    />
                  )}
                </div>
              </div>

              <Tablero r={r} faltaTasaUVR={faltaTasaUVR} />
            </div>

            {r.credito && !faltaTasaUVR && (
              <>
                <LineaTiempo r={r} />
                <Composicion r={r} />
                <TablaAnual r={r} />
              </>
            )}

            <section className="sim-bloque" aria-labelledby="sim-cartera-titulo">
              <h3 id="sim-cartera-titulo">{t.carteraConEstas}</h3>
              <Alcanzan resultado={alcanzan} items={items} perfil={perfil} cond={cond} alSimular={(slug) => abrirDetalle(slug)} alAplicar={aplicarPalanca} compacto />
            </section>

            <Acciones r={r} item={itemSel} alcanzan={alcanzan} faltaTasaUVR={faltaTasaUVR} />
          </section>
        )}

        <p className="sim-aviso-final">{t.avisoFinal}</p>
      </div>
    </Contexto.Provider>
  );
}

/** «Parto de la cuota que quiero pagar» (como la calculadora de Zillow). */
function ResultadoPorCuota({ cond, cuota }: { cond: Condiciones; cuota: number }) {
  const { t, idioma } = useSim();
  const porPeso = primeraCuota(1, cond);
  const precio = porPeso > 0 ? cuota / porPeso : 0;
  return (
    <>
      <p className="sim-alcance">
        <span>{t.conEsaCuota}</span>
        <strong>{pesos(precio, idioma)}</strong>
        <Usd cop={precio} />
      </p>
      <p className="sim-alcance-detalle">
        {t.conEsaCuotaDetalle(
          porcentaje(cond.pctFinanciado, idioma),
          anios(cond.plazoAnios, idioma),
          pesos(cuota / LIMITE, idioma),
          porcentaje(LIMITE, idioma),
        )}
      </p>
    </>
  );
}

/**
 * La frase resumen, con cifras que se tocan (o se arrastran con el mouse):
 * «Si en tu hogar ganan [X] al mes y tienes [Y] para la cuota inicial,
 * [proyecto] te alcanza con una cuota de $C a [N] años.»
 */
function Frase({ r, items, faltaTasaUVR }: { r: ResultadoSimulador; items: ItemSimulador[]; faltaTasaUVR: boolean }) {
  const { t, idioma, estado, set } = useSim();
  const ingresoHogar = estado.ingreso + (estado.conCodeudor ? estado.ingresoCodeudor : 0);
  const recursosHoy = estado.ahorros + estado.cesantias;
  const cuota = r.credito?.cuota ?? 0;
  const faltaIngreso = r.credito ? Math.max(0, r.ingresoRequerido - ingresoHogar) : 0;
  const faltaCI = Math.max(0, r.obra.pendiente - estado.ahorroMensual * Math.max(0, estado.meses));
  const conPrecio = items.filter((i) => i.precio != null);
  const nombre = items.find((i) => i.slug === estado.item)?.nombre ?? t.esteInmueble;
  const fmt = (v: number) => pesos(v, idioma);

  return (
    <p className="sim-frase">
      {t.fraseSi}{" "}
      <Ficha etiqueta={t.ingresoHogar} valor={ingresoHogar} onChange={(v) => set({ ingreso: Math.max(0, v - (estado.conCodeudor ? estado.ingresoCodeudor : 0)) })} min={0} max={80_000_000} paso={250_000} formato={fmt} anchoCh={15} />{" "}
      {t.fraseAlMes}{" "}
      <Ficha etiqueta={t.paraLaCuotaInicial} valor={recursosHoy} onChange={(v) => set({ ahorros: Math.max(0, v - estado.cesantias) })} min={0} max={1_000_000_000} paso={1_000_000} formato={fmt} anchoCh={15} />{" "}
      {t.fraseParaCI}{" "}
      <select
        className="sim-ficha sim-ficha-lista"
        aria-label={t.inmueble}
        value={estado.item}
        onChange={(e) => {
          const it = items.find((i) => i.slug === e.target.value);
          set({ item: e.target.value, ...(it?.precio ? { precio: it.precio } : {}), meses: it?.meses ?? PARAMETROS.mesesEntregaSupuesto.valor }, { marcar: true });
        }}
      >
        {conPrecio.map((i) => (
          <option key={i.slug} value={i.slug}>
            {i.nombre}
          </option>
        ))}
        <option value="">{t.otroPrecio}</option>
      </select>{" "}
      {estado.modalidad === "contado" ? (
        t.fraseContado(fmt(estado.precio))
      ) : faltaTasaUVR ? (
        t.fraseFaltaTasa
      ) : (
        <>
          {ingresoHogar > 0 && faltaIngreso === 0 && faltaCI === 0 ? t.fraseTeAlcanza : t.frasePide} <strong>{fmt(cuota)}</strong> {t.fraseA}{" "}
          <Ficha
            etiqueta={t.plazo}
            valor={estado.plazoAnios}
            onChange={(v) => set({ plazoAnios: v })}
            min={LIMITES.plazoMinAnios}
            max={estado.exterior ? LIMITES.plazoMaxAniosExterior : LIMITES.plazoMaxAnios}
            paso={1}
            formato={(v) => String(Math.round(v))}
            anchoCh={3}
          />{" "}
          {t.fraseAnios}
          {ingresoHogar > 0 && (faltaIngreso > 0 || faltaCI > 0) && <>{t.fraseFalta(faltaIngreso > 0 ? fmt(faltaIngreso) : null, faltaCI > 0 ? fmt(faltaCI) : null)}</>}
          .
        </>
      )}
    </p>
  );
}

/** El tablero vivo: tres cifras grandes, el indicador legal y lo que cambió. */
function Tablero({ r, faltaTasaUVR }: { r: ResultadoSimulador; faltaTasaUVR: boolean }) {
  const { t, idioma, estado, set, hoy } = useSim();
  const ingresoHogar = estado.ingreso + (estado.conCodeudor ? estado.ingresoCodeudor : 0);
  const cuota = r.credito?.cuota ?? 0;
  const anterior = useRef<{ cuota: number; obra: number; meses: number } | null>(null);
  const [cambio, setCambio] = useState<string | null>(null);

  // «+$124.000 al mes» o «−3 años» durante dos segundos, cuando algo cambia.
  useEffect(() => {
    const ahora = { cuota, obra: r.obra.pagoMensual, meses: r.credito?.mesesPagados ?? 0 };
    const a = anterior.current;
    anterior.current = ahora;
    if (!a) return;
    let texto: string | null = null;
    if (Math.abs(ahora.cuota - a.cuota) >= 1000) texto = t.cambioCuota((ahora.cuota > a.cuota ? "+" : "−") + pesos(Math.abs(ahora.cuota - a.cuota), idioma));
    else if (Math.abs(ahora.meses - a.meses) >= 12) {
      const d = Math.round((ahora.meses - a.meses) / 12);
      texto = t.cambioAnios((d > 0 ? "+" : "−") + Math.abs(d));
    } else if (Math.abs(ahora.obra - a.obra) >= 1000) texto = t.cambioObra((ahora.obra > a.obra ? "+" : "−") + pesos(Math.abs(ahora.obra - a.obra), idioma));
    if (!texto) return;
    setCambio(texto);
    const id = window.setTimeout(() => setCambio(null), 2000);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cuota, r.obra.pagoMensual, r.credito?.mesesPagados]);

  const legal = r.credito && !faltaTasaUVR && ingresoHogar > 0 ? r.estadoLegal : null;
  const inicio = hoy ?? "2026-10-01";

  return (
    <aside className="sim-tablero" aria-label={t.tableroTitulo}>
      <div className="sim-tablero-caja" aria-live="polite">
        {/* Lo que falta de la cuota inicial (de contado, del precio): a la firma
            si la entrega es inmediata; si no, repartido en los meses de obra. */}
        <div className="sim-cifra">
          <span>{r.obra.alaFirma ? t.pagasALaFirma : t.pagasEnObra}</span>
          <strong>{pesos(r.obra.alaFirma ? r.obra.pendiente : r.obra.pagoMensual, idioma)}</strong>
          <Usd cop={r.obra.alaFirma ? r.obra.pendiente : r.obra.pagoMensual} />
          <small>
            {r.obra.pendiente <= 0.5 ? t.ciCubierta : r.obra.alaFirma ? t.enUnSoloPago : t.alMesDurante(meses(estado.meses, idioma))}
          </small>
        </div>
        {estado.modalidad !== "contado" && (
          <div className="sim-cifra">
            <span>{estado.modalidad === "leasing" ? t.canonLeasing : estado.modalidad === "uvr" ? t.primeraCuotaUVR : t.cuotaCredito}</span>
            {faltaTasaUVR ? (
              <small>{t.escribeTasaUVR}</small>
            ) : (
              <>
                <strong>{pesos(cuota, idioma)}</strong>
                <Usd cop={cuota} />
                <small>
                  {t.alMes}
                  {r.credito && r.credito.segurosMes1 > 0 ? ` · ${t.conSeguros} ${pesos(r.credito.cuotaConSeguros, idioma)}` : ""}
                </small>
              </>
            )}
          </div>
        )}
        {estado.modalidad !== "contado" && !faltaTasaUVR && (
          <div className="sim-cifra">
            <span>{t.ingresoRequerido}</span>
            <strong>{pesos(r.ingresoRequerido, idioma)}</strong>
            <Usd cop={r.ingresoRequerido} />
            <small>{t.ingresoRequeridoDetalle(porcentaje(r.limiteCuotaIngreso, idioma))}</small>
          </div>
        )}
        {legal && (
          <p className={`sim-legal sim-legal-${legal}`}>
            <span aria-hidden="true">{legal === "cumple" ? "✓" : legal === "cerca" ? "!" : "✕"}</span>
            {legal === "cumple"
              ? t.legalCumple(porcentaje(r.limiteCuotaIngreso, idioma))
              : legal === "cerca"
                ? t.legalCerca(porcentaje(r.limiteCuotaIngreso, idioma))
                : t.legalSupera(porcentaje(r.limiteCuotaIngreso, idioma))}
          </p>
        )}
        {cambio && (
          <p className="sim-cambio" role="status">
            {cambio}
          </p>
        )}
        {r.credito && !faltaTasaUVR && (
          <dl className="sim-totales">
            <div>
              <dt>{t.interesesTotales}</dt>
              <dd>{pesos(r.credito.totalIntereses, idioma)}</dd>
            </div>
            <div>
              <dt>{t.gastosCierre}</dt>
              <dd>{pesos(r.gastos.total, idioma)}</dd>
            </div>
            <div>
              <dt>{t.ultimoPago}</dt>
              <dd>{mesDesdeHoy(inicio, r.mesUltimoPago, idioma)}</dd>
            </div>
          </dl>
        )}
        {r.avisos.length > 0 && (
          <ul className="sim-avisos">
            {r.avisos.map((a) => (
              <li key={a.codigo}>
                {t.aviso(a, idioma)}
                {a.sugerencia === "leasing" && (
                  <button
                    type="button"
                    className="sim-boton sim-boton-texto"
                    onClick={() => {
                      set({ modalidad: "leasing", pctFinanciado: Math.min(a.antes, LIMITES.financiacionMaxLeasing) });
                      evento("simulator_mode_change", { modalidad: "leasing" });
                    }}
                  >
                    {t.probarLeasing}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      {/* En el teléfono, la hoja fija de abajo con lo esencial. */}
      <div className="sim-hoja" aria-hidden="true">
        <span>
          {r.obra.alaFirma ? t.hojaFirma : t.hojaObra} <b>{pesosCorto(r.obra.alaFirma ? r.obra.pendiente : r.obra.pagoMensual, idioma)}</b>
        </span>
        {estado.modalidad !== "contado" && !faltaTasaUVR && (
          <span>
            {t.hojaCuota} <b>{pesosCorto(cuota, idioma)}</b>
          </span>
        )}
        {estado.modalidad !== "contado" && !faltaTasaUVR && (
          <span>
            {t.hojaIngreso} <b>{pesosCorto(r.ingresoRequerido, idioma)}</b>
          </span>
        )}
      </div>
    </aside>
  );
}
