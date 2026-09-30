"use client";

/**
 * Las pestañas del detalle: compra, financiación, gastos, beneficios,
 * inversión y escenarios (M2 a M18 del prompt del simulador).
 *
 * Todas mueven el mismo estado (contexto.ts) y el tablero se recalcula con
 * cada cambio. Cada cifra que no escribió la persona dice de dónde sale, con
 * su etiqueta («Fuente», «Supuesto» o «Tu dato»), y lo que es estimación lo
 * dice junto a la cifra: «no es una oferta», «consulta a tu contador»,
 * «no es garantía de ingresos».
 */
import { useEffect, useId, useMemo, useState } from "react";
import { compararEscenarios, pruebasDeEstres, type ResultadoSimulador } from "@/lib/simulador/simular";
import { arrendarOComprar, beneficioTributario, rentaCorta, rentaTradicional, sensibilidadTRM } from "@/lib/simulador/inversion";
import { cuotaFija, cuotaLeasing, tasaMensual } from "@/lib/simulador/financiero";
import type { Modalidad } from "@/lib/simulador/compra";
import { obtenerTRM, type TRM } from "@/lib/moneda";
import { useSim } from "@/components/simulador/contexto";
import { CampoDinero, CampoNumero, Chips, Etiqueta, Interruptor, origenDe, type Origen } from "@/components/simulador/Campos";
import { anios, meses, mesDesdeHoy, pesos, porcentaje } from "@/components/simulador/formato";
import { evento } from "@/components/simulador/analitica";
import { LIMITE, LIMITES, PARAMETROS, TARIFAS } from "@/components/simulador/parametros";
import type { ItemSimulador } from "@/components/simulador/tipos";

const P = PARAMETROS;
const MODALIDADES: Modalidad[] = ["pesos", "uvr", "leasing", "contado"];
const TU_DATO: Origen = { tipo: "tu-dato" };
const URL_TRM = "https://www.datos.gov.co/Econom-a-y-Finanzas/Tasa-de-Cambio-Representativa-del-Mercado-TRM/32sa-8pi3";

/** La TRM del día (la misma que usa la referencia en dólares del sitio), o null si no llega. */
function useTRM(): TRM | null {
  const [trm, setTrm] = useState<TRM | null>(null);
  useEffect(() => {
    let vivo = true;
    obtenerTRM().then((x) => {
      if (vivo) setTrm(x);
    });
    return () => {
      vivo = false;
    };
  }, []);
  return trm;
}

/** Una cifra de resultado: nombre, valor y, si hace falta, una nota. */
function Dato({ nombre, valor, nota, clase }: { nombre: string; valor: string; nota?: string; clase?: string }) {
  return (
    <div className={clase ? `sim-dato ${clase}` : "sim-dato"}>
      <dt>{nombre}</dt>
      <dd>
        {valor}
        {nota && <small>{nota}</small>}
      </dd>
    </div>
  );
}

// ── Compra (M1, M2) ──────────────────────────────────────────────────────

export function PestanaCompra({
  items,
  r,
  alElegir,
}: {
  items: ItemSimulador[];
  r: ResultadoSimulador;
  alElegir: (slug: string) => void;
}) {
  const { t, idioma, estado, set, editado } = useSim();
  const idInmueble = useId();
  const conPrecio = items.filter((i) => i.precio != null);
  const item = items.find((i) => i.slug === estado.item) ?? null;
  const contado = estado.modalidad === "contado";

  const origenPrecio: Origen =
    editado("precio") || !item?.precio
      ? TU_DATO
      : { tipo: "fuente", fuente: t.fuentePrecio(item.nombre), fecha: item.corte ?? undefined };
  const origenMeses: Origen = editado("meses")
    ? TU_DATO
    : item && item.meses != null
      ? { tipo: "fuente", fuente: t.fuenteEntregaInmediata(item.nombre) }
      : origenDe(P.mesesEntregaSupuesto);
  const yaTienes = Math.min(r.obra.cuotaInicial, estado.separacion + estado.ahorros + estado.cesantias);

  return (
    <div className="sim-pestana">
      <fieldset className="sim-grupo">
        <legend>{t.grupoInmueble}</legend>
        <div className="sim-campo">
          <div className="sim-campo-cabeza">
            <label htmlFor={idInmueble}>{t.inmueble}</label>
          </div>
          <select
            id={idInmueble}
            className="sim-select"
            value={estado.item}
            onChange={(e) => (e.target.value ? alElegir(e.target.value) : set({ item: "" }))}
          >
            {conPrecio.map((i) => (
              <option key={i.slug} value={i.slug}>
                {i.nombre}
              </option>
            ))}
            <option value="">{t.otroPrecio}</option>
          </select>
        </div>
        <CampoDinero
          etiqueta={t.precio}
          valor={estado.precio}
          onChange={(v) => set({ precio: v })}
          max={2_500_000_000}
          paso={5_000_000}
          origen={origenPrecio}
          ayuda={item?.precio && !editado("precio") ? t.precioAyudaCartera : t.precioAyudaPropio}
        />
        <CampoDinero
          etiqueta={t.separacion}
          valor={estado.separacion}
          onChange={(v) => set({ separacion: v })}
          max={50_000_000}
          paso={500_000}
          ayuda={t.separacionAyuda}
        />
        <CampoNumero
          etiqueta={t.mesesEntrega}
          valor={estado.meses}
          onChange={(v) => set({ meses: Math.round(v) })}
          min={0}
          max={48}
          paso={1}
          sufijo={t.sufijoMeses}
          origen={origenMeses}
          ayuda={estado.meses === 0 ? t.mesesCeroAyuda : t.mesesAyuda}
        />
        <div className="sim-fila-etq">
          <Interruptor texto={t.esVIS} valor={estado.esVIS} onChange={(v) => set({ esVIS: v })} ayuda={t.esVISAyuda(P.topeVISSmmlv.valor, pesos(LIMITES.topeVIS, idioma))} />
          <Etiqueta origen={origenDe(P.topeVISSmmlv)} />
        </div>
      </fieldset>

      <fieldset className="sim-grupo">
        <legend>{t.grupoHogar}</legend>
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
        <CampoDinero
          etiqueta={t.otrasDeudas}
          valor={estado.otrasDeudas}
          onChange={(v) => set({ otrasDeudas: v })}
          max={20_000_000}
          paso={100_000}
          ayuda={t.otrasDeudasAyuda}
        />
        {estado.otrasDeudas > 0 && r.pctIngresoComprometido != null && (
          <p className="sim-nota">{t.comprometido(porcentaje(r.pctIngresoComprometido, idioma))}</p>
        )}
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
      </fieldset>

      <div className="sim-caja">
        <h4>{contado ? t.ciContadoTitulo : t.ciTitulo}</h4>
        <dl className="sim-datos">
          <Dato
            nombre={contado ? t.ciContado : t.ciTotal(porcentaje(1 - r.entrada.pctFinanciado, idioma))}
            valor={pesos(r.obra.cuotaInicial, idioma)}
          />
          <Dato nombre={t.ciYaTienes} valor={pesos(yaTienes, idioma)} nota={t.ciYaTienesNota} />
          <Dato nombre={t.ciPendiente} valor={pesos(r.obra.pendiente, idioma)} />
          {r.obra.alaFirma ? (
            <Dato nombre={t.ciALaFirma} valor={pesos(r.obra.pendiente, idioma)} />
          ) : (
            <Dato nombre={t.ciPorMes(meses(estado.meses, idioma))} valor={pesos(r.obra.pagoMensual, idioma)} clase="sim-dato-fuerte" />
          )}
        </dl>
        {r.obra.holguraMensual != null && (
          <p className={r.obra.holguraMensual >= 0 ? "sim-nota sim-nota-bien" : "sim-nota sim-nota-mal"}>
            {r.obra.holguraMensual >= 0
              ? t.ciSobra(pesos(estado.ahorroMensual, idioma), pesos(r.obra.holguraMensual, idioma))
              : t.ciFalta(pesos(estado.ahorroMensual, idioma), pesos(-r.obra.holguraMensual, idioma))}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Financiación (M3 a M5, M7, M10, M11, M17) ────────────────────────────

export function PestanaFinanciacion({
  r,
  rSinAbonos,
  faltaTasaUVR,
}: {
  r: ResultadoSimulador;
  rSinAbonos: ResultadoSimulador | null;
  faltaTasaUVR: boolean;
}) {
  const { t, idioma, estado, set, editado } = useSim();
  const contado = estado.modalidad === "contado";

  return (
    <div className="sim-pestana">
      <Chips
        leyenda={t.modalidad}
        nombre="sim-modalidad"
        valor={estado.modalidad}
        onChange={(v) => {
          set({ modalidad: v });
          evento("simulator_mode_change", { modalidad: v });
        }}
        opciones={MODALIDADES.map((m) => ({ valor: m, texto: t.modalidadTitulo[m], detalle: t.modalidadDetalle[m] }))}
      />

      {contado ? (
        <p className="sim-nota">{t.contadoNota}</p>
      ) : (
        <>
          <fieldset className="sim-grupo">
            <legend>{t.grupoCredito}</legend>
            <CampoNumero
              etiqueta={t.pctFinanciado}
              valor={estado.pctFinanciado}
              onChange={(v) => set({ pctFinanciado: v })}
              min={0}
              max={LIMITES.financiacionMaxLeasing}
              paso={0.05}
              porcentaje
              sufijo="%"
              origen={editado("pctFinanciado") ? TU_DATO : origenDe(P.pctFinanciadoPorDefecto)}
              ayuda={
                <>
                  {t.pctFinanciadoAyuda(
                    porcentaje(LIMITES.financiacionMaxNoVIS, idioma),
                    porcentaje(LIMITES.financiacionMaxVIS, idioma),
                    porcentaje(LIMITES.financiacionMaxLeasing, idioma),
                  )}{" "}
                  <Etiqueta origen={origenDe(estado.modalidad === "leasing" ? P.financiacionMaxLeasing : P.financiacionMaxNoVIS)} />
                </>
              }
            />
            <CampoNumero
              etiqueta={t.plazo}
              valor={estado.plazoAnios}
              onChange={(v) => set({ plazoAnios: Math.round(v) })}
              min={1}
              max={40}
              paso={1}
              sufijo={t.sufijoAnios}
              origen={editado("plazoAnios") ? TU_DATO : origenDe(P.plazoPorDefectoAnios)}
              ayuda={
                <>
                  {t.plazoAyuda(LIMITES.plazoMinAnios, estado.exterior ? LIMITES.plazoMaxAniosExterior : LIMITES.plazoMaxAnios)}{" "}
                  <Etiqueta origen={origenDe(P.plazoMinAnios)} />
                </>
              }
            />
            {estado.modalidad === "uvr" ? (
              <>
                <CampoNumero
                  etiqueta={t.tasaRealUVR}
                  valor={estado.tasaUVR ?? 0}
                  onChange={(v) => set({ tasaUVR: v > 0 ? v : null })}
                  min={0}
                  max={0.2}
                  paso={0.0025}
                  porcentaje
                  decimales={2}
                  sufijo={t.sufijoUVR}
                  origen={estado.tasaUVR == null ? undefined : TU_DATO}
                  ayuda={faltaTasaUVR ? t.tasaUVRFalta : t.tasaUVRAyuda}
                />
                <CampoNumero
                  etiqueta={t.inflacionSupuesta}
                  valor={estado.inflacion}
                  onChange={(v) => set({ inflacion: v })}
                  min={0}
                  max={0.2}
                  paso={0.0025}
                  porcentaje
                  decimales={2}
                  sufijo="%"
                  origen={origenDe(P.inflacionProyectada, editado("inflacion"))}
                  ayuda={t.inflacionAyuda(porcentaje(P.inflacionAnual.valor, idioma, 2))}
                />
              </>
            ) : (
              <CampoNumero
                etiqueta={estado.modalidad === "leasing" ? t.tasaLeasing : t.tasa}
                valor={estado.tasa}
                onChange={(v) => set({ tasa: v })}
                min={0.05}
                max={0.3}
                paso={0.0025}
                porcentaje
                decimales={2}
                sufijo={t.sufijoEA}
                origen={origenDe(P.tasaNoVISPesos, editado("tasa"))}
                ayuda={estado.modalidad === "leasing" ? t.tasaLeasingAyuda : t.tasaAyuda}
              />
            )}
            {estado.modalidad === "leasing" && (
              <CampoNumero
                etiqueta={t.opcionCompra}
                valor={estado.opcionCompra}
                onChange={(v) => set({ opcionCompra: v })}
                min={0}
                max={0.3}
                paso={0.01}
                porcentaje
                sufijo="%"
                origen={origenDe(P.opcionCompraLeasing, editado("opcionCompra"))}
                ayuda={t.opcionCompraAyuda(pesos(r.credito?.opcionCompra ?? estado.precio * estado.opcionCompra, idioma))}
              />
            )}
          </fieldset>

          {r.credito && (estado.modalidad === "pesos" || estado.modalidad === "leasing") && <Entidades r={r} />}

          <fieldset className="sim-grupo">
            <legend>{t.grupoSeguros}</legend>
            <div className="sim-fila-etq">
              <Interruptor
                texto={t.incluirSeguros}
                valor={estado.seguros}
                onChange={(v) => set({ seguros: v })}
                ayuda={t.segurosAyuda(porcentaje(P.seguroVidaMensual.valor, idioma, 4), porcentaje(P.seguroIncendioMensual.valor, idioma, 4))}
              />
              <Etiqueta origen={origenDe(P.seguroVidaMensual)} />
            </div>
            {r.credito && estado.seguros && !faltaTasaUVR && (
              <p className="sim-nota">{t.segurosResultado(pesos(r.credito.segurosMes1, idioma), pesos(r.credito.totalSeguros, idioma))}</p>
            )}
          </fieldset>

          <Abonos r={r} rSinAbonos={rSinAbonos} />
          {r.credito && !faltaTasaUVR && <Estres r={r} />}
        </>
      )}
    </div>
  );
}

/** Las tasas promedio de cada entidad (M10): referencia, nunca oferta. */
function Entidades({ r }: { r: ResultadoSimulador }) {
  const { t, idioma, estado, set } = useSim();
  const credito = r.credito;
  if (!credito) return null;
  const n = Math.round(r.entrada.plazoAnios * 12);
  const cuotaCon = (tasa: number) =>
    credito.modalidad === "leasing"
      ? cuotaLeasing(credito.montoFinanciado, credito.opcionCompra, tasaMensual(tasa), n)
      : cuotaFija(credito.montoFinanciado, tasaMensual(tasa), n);
  return (
    <details className="sim-grupo sim-entidades">
      <summary>{t.entidadesTitulo}</summary>
      <p className="sim-campo-ayuda">
        {t.entidadesLede(t.fechaDato(P.tasasPorEntidad.fecha.slice(0, 7)))} <Etiqueta origen={origenDe(P.tasasPorEntidad)} />
      </p>
      <div className="sim-tabla-scroll">
        <table>
          <thead>
            <tr>
              <th scope="col">{t.colEntidad}</th>
              <th scope="col">{t.colTasa}</th>
              <th scope="col">{t.colCuota}</th>
              <th scope="col">
                <span className="sr-only">{t.usarTasa}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {P.tasasPorEntidad.valor.map((x) => (
              <tr key={x.entidad} className={Math.abs(x.tasaEA - estado.tasa) < 1e-6 ? "sim-fila-activa" : undefined}>
                <th scope="row">{x.entidad}</th>
                <td>{porcentaje(x.tasaEA, idioma, 1)}</td>
                <td>{pesos(cuotaCon(x.tasaEA), idioma)}</td>
                <td>
                  <button type="button" className="sim-boton sim-boton-texto" onClick={() => set({ tasa: x.tasaEA })}>
                    {t.usarTasa}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

/** Abonos extraordinarios (M11): la prima o las cesantías, o un extra cada mes. */
function Abonos({ r, rSinAbonos }: { r: ResultadoSimulador; rSinAbonos: ResultadoSimulador | null }) {
  const { t, idioma, estado, set } = useSim();
  const antes = rSinAbonos?.credito;
  const ahora = r.credito;
  let resultado: string | null = null;
  if (antes && ahora) {
    const ahorro = antes.totalIntereses - ahora.totalIntereses;
    if (estado.abonoReduce === "plazo") {
      const menos = antes.mesesPagados - ahora.mesesPagados;
      resultado = t.abonoResultadoPlazo(menos >= 12 ? anios(menos / 12, idioma) : meses(menos, idioma), pesos(ahorro, idioma));
    } else {
      // La cuota recalculada: la del mes siguiente al primer abono.
      const despues = ahora.meses.find((m) => m.mes === Math.max(1, Math.round(estado.abonoDesde)) + 1);
      resultado = t.abonoResultadoCuota(pesos(despues?.cuota ?? ahora.cuota, idioma), pesos(ahorro, idioma));
    }
  }
  return (
    <fieldset className="sim-grupo">
      <legend>{t.grupoAbonos}</legend>
      <p className="sim-campo-ayuda">{estado.modalidad === "leasing" ? t.abonosLedeLeasing : t.abonosLede}</p>
      <CampoDinero
        etiqueta={t.abonoAnual}
        valor={estado.abonoAnual}
        onChange={(v) => set({ abonoAnual: v })}
        max={100_000_000}
        paso={1_000_000}
        ayuda={t.abonoAnualAyuda}
      />
      <CampoDinero etiqueta={t.abonoMensual} valor={estado.abonoMensual} onChange={(v) => set({ abonoMensual: v })} max={10_000_000} paso={100_000} />
      {(estado.abonoAnual > 0 || estado.abonoMensual > 0) && (
        <>
          <CampoNumero
            etiqueta={t.abonoDesde}
            valor={estado.abonoDesde}
            onChange={(v) => set({ abonoDesde: Math.max(1, Math.round(v)) })}
            min={1}
            max={360}
            paso={1}
            sufijo={t.sufijoMesCredito}
            sinDeslizador
          />
          <Chips
            leyenda={t.abonoReduce}
            nombre="sim-abono-reduce"
            valor={estado.abonoReduce}
            onChange={(v) => set({ abonoReduce: v })}
            opciones={[
              { valor: "plazo", texto: t.reducePlazo },
              { valor: "cuota", texto: t.reduceCuota },
            ]}
          />
        </>
      )}
      {resultado && <p className="sim-nota sim-nota-bien">{resultado}</p>}
    </fieldset>
  );
}

/** Pruebas de estrés (M17): ¿y si la tasa o la inflación suben 2 puntos? */
function Estres({ r }: { r: ResultadoSimulador }) {
  const { t, idioma, estado } = useSim();
  const [cual, setCual] = useState<"tasa" | "inflacion" | null>(null);
  const pruebas = useMemo(() => (cual ? pruebasDeEstres(r.entrada, { limites: LIMITES, tarifas: TARIFAS }) : null), [cual, r.entrada]);
  const dif = cual === "tasa" ? pruebas?.tasa : cual === "inflacion" ? pruebas?.inflacion : null;
  const signo = (v: number) => (v >= 0 ? "+" : "−") + pesos(Math.abs(v), idioma);
  return (
    <div className="sim-grupo sim-estres">
      <h4>{t.estresTitulo}</h4>
      <div className="sim-estres-botones">
        <button type="button" className="sim-boton" aria-pressed={cual === "tasa"} onClick={() => setCual(cual === "tasa" ? null : "tasa")}>
          {t.estresTasa}
        </button>
        {estado.modalidad === "uvr" && (
          <button
            type="button"
            className="sim-boton"
            aria-pressed={cual === "inflacion"}
            onClick={() => setCual(cual === "inflacion" ? null : "inflacion")}
          >
            {t.estresInflacion}
          </button>
        )}
      </div>
      {dif && (
        <p className="sim-nota" role="status">
          {t.estresResultado(signo(dif.cuota), signo(dif.ingresoRequerido), signo(dif.totalIntereses))}
        </p>
      )}
    </div>
  );
}

// ── Gastos de escritura y registro (M6) ──────────────────────────────────

export function PestanaGastos({ r }: { r: ResultadoSimulador }) {
  const { t, idioma, estado, set } = useSim();
  const g = r.gastos;
  const filas: { texto: string; valor: number; origen: Origen }[] = [
    { texto: t.gNotarialCompraventa(porcentaje(P.parteCompradorNotarial.valor, idioma)), valor: g.notarialCompraventa, origen: origenDe(P.notarial) },
    { texto: t.gRegistroCompraventa, valor: g.registroCompraventa, origen: origenDe(P.registro) },
    { texto: t.gImpuestoCompraventa, valor: g.impuestoRegistroCompraventa, origen: origenDe(P.impuestoRegistro) },
  ];
  if (g.notarialHipoteca > 0) filas.push({ texto: t.gNotarialHipoteca, valor: g.notarialHipoteca, origen: origenDe(P.notarial) });
  if (g.registroHipoteca > 0) filas.push({ texto: t.gRegistroHipoteca, valor: g.registroHipoteca, origen: origenDe(P.registro) });
  if (g.impuestoRegistroHipoteca > 0) filas.push({ texto: t.gImpuestoHipoteca, valor: g.impuestoRegistroHipoteca, origen: origenDe(P.impuestoRegistro) });
  if (g.estudioTitulosYAvaluo > 0) filas.push({ texto: t.gEstudio, valor: g.estudioTitulosYAvaluo, origen: TU_DATO });

  return (
    <div className="sim-pestana">
      <p className="sim-campo-ayuda">{t.gastosLede}</p>
      <div className="sim-tabla-scroll">
        <table className="sim-tabla-gastos">
          <caption className="sr-only">{t.gastosTitulo}</caption>
          <tbody>
            {filas.map((f) => (
              <tr key={f.texto}>
                <th scope="row">
                  {f.texto} <Etiqueta origen={f.origen} />
                </th>
                <td>{pesos(f.valor, idioma)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">{t.gTotal}</th>
              <td>
                {pesos(g.total, idioma)}
                <small>{t.gDelPrecio(porcentaje(g.pctPrecio, idioma, 1))}</small>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      <CampoDinero
        etiqueta={t.gEstudio}
        valor={estado.estudio}
        onChange={(v) => set({ estudio: v })}
        max={6_000_000}
        paso={50_000}
        ayuda={t.gEstudioAyuda}
      />
      <ul className="sim-notas">
        {estado.modalidad === "leasing" && <li>{t.gNotaLeasing}</li>}
        {estado.modalidad === "contado" && <li>{t.gNotaContado}</li>}
        {r.entrada.esVIS && <li>{t.gNotaVIS}</li>}
        <li>{t.gNotaReparto}</li>
        <li>{t.gNotaAvaluo}</li>
      </ul>
    </div>
  );
}

// ── Beneficios: renta, subsidios, exterior, arrendar o comprar (M12, M14, M15) ─

export function PestanaBeneficios({ r }: { r: ResultadoSimulador }) {
  return (
    <div className="sim-pestana">
      <BeneficioTributario r={r} />
      <Subsidios />
      <Exterior r={r} />
      <ArrendarOComprar r={r} />
    </div>
  );
}

function BeneficioTributario({ r }: { r: ResultadoSimulador }) {
  const { t, idioma, estado, set } = useSim();
  const tarifas = [...new Set(P.tarifasRenta.valor.map((x) => x.tarifa).filter((x) => x > 0))];
  const intereses = (r.credito?.meses ?? []).slice(0, 12).reduce((s, m) => s + m.interes, 0);
  const b = beneficioTributario({
    interesesAnio: intereses,
    tarifaMarginal: estado.tarifaMarginal ?? 0,
    uvt: P.uvt.valor,
    topeUVT: P.deduccionInteresesUVT.valor,
  });
  return (
    <section className="sim-grupo" aria-labelledby="sim-renta-titulo">
      <h4 id="sim-renta-titulo">{t.rentaTitulo}</h4>
      {!r.credito ? (
        <p className="sim-nota">{t.rentaSinCredito}</p>
      ) : (
        <>
          <Chips
            leyenda={t.tarifaMarginal}
            nombre="sim-tarifa"
            valor={estado.tarifaMarginal == null ? "nose" : String(estado.tarifaMarginal)}
            onChange={(v) => set({ tarifaMarginal: v === "nose" ? null : Number(v) })}
            opciones={[{ valor: "nose", texto: t.noSe }, ...tarifas.map((x) => ({ valor: String(x), texto: porcentaje(x, idioma) }))]}
          />
          <dl className="sim-datos">
            <Dato nombre={t.rentaIntereses} valor={pesos(intereses, idioma)} />
            <Dato nombre={t.rentaDeducible} valor={pesos(b.deducible, idioma)} nota={t.rentaTope(P.deduccionInteresesUVT.valor, pesos(b.tope, idioma))} />
            {estado.tarifaMarginal != null && <Dato nombre={t.rentaAhorro} valor={pesos(b.ahorro, idioma)} clase="sim-dato-fuerte" />}
          </dl>
          {estado.tarifaMarginal == null && <p className="sim-campo-ayuda">{t.rentaElige}</p>}
          <p className="sim-campo-ayuda">
            {estado.modalidad === "leasing" ? t.rentaCondicionesLeasing : t.rentaCondiciones} <Etiqueta origen={origenDe(P.deduccionInteresesUVT)} />{" "}
            {t.rentaTopeConjunto(porcentaje(P.limiteRentasExentas.valor.pct, idioma), P.limiteRentasExentas.valor.uvt)}{" "}
            <Etiqueta origen={origenDe(P.limiteRentasExentas)} /> {t.rentaEstimacion}
          </p>
        </>
      )}
    </section>
  );
}

function Subsidios() {
  const { t } = useSim();
  return (
    <section className="sim-grupo" aria-labelledby="sim-subsidios-titulo">
      <h4 id="sim-subsidios-titulo">{t.subsidiosTitulo}</h4>
      <ul className="sim-notas">
        <li>
          {P.miCasaYa.valor.disponible ? t.miCasaYaSi : t.miCasaYaNo} <Etiqueta origen={origenDe(P.miCasaYa)} />
        </li>
        <li>
          {P.frech.valor.disponible ? t.frechSi : t.frechNo} <Etiqueta origen={origenDe(P.frech)} />
        </li>
      </ul>
    </section>
  );
}

function Exterior({ r }: { r: ResultadoSimulador }) {
  const { t, idioma, estado, set, editado } = useSim();
  const trm = useTRM();
  const ext = P.exterior.valor;

  // La TRM del día reemplaza la de respaldo, mientras la persona no escriba la suya.
  useEffect(() => {
    if (trm && estado.monedaExterior === "USD" && !editado("tasaCambio")) set({ tasaCambio: trm.valor }, { marcar: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trm, estado.monedaExterior]);

  const origenCambio: Origen = editado("tasaCambio")
    ? TU_DATO
    : estado.monedaExterior === "USD"
      ? trm
        ? { tipo: "fuente", fuente: t.fuenteTRM, fecha: trm.vigente, url: URL_TRM }
        : origenDe(P.trmReferencia)
      : TU_DATO;
  const cuota = r.credito?.cuota ?? 0;
  const filas =
    estado.ingresoExterior > 0 && estado.tasaCambio > 0 && cuota > 0
      ? sensibilidadTRM({ cuota, ingresoMonedaExtranjera: estado.ingresoExterior, tasaCambio: estado.tasaCambio })
      : [];

  return (
    <section className="sim-grupo" aria-labelledby="sim-exterior-titulo">
      <h4 id="sim-exterior-titulo">{t.exteriorTitulo}</h4>
      <Interruptor texto={t.vivoFuera} valor={estado.exterior} onChange={(v) => set({ exterior: v })} />
      {estado.exterior && (
        <>
          <p className="sim-campo-ayuda">
            {t.exteriorCondiciones(porcentaje(ext.financiacionMaxNoVIS, idioma), porcentaje(ext.financiacionMaxVIS, idioma), ext.plazoMaxAnios, ext.ingresoMinSmmlv)}{" "}
            <Etiqueta origen={origenDe(P.exterior)} />
          </p>
          <p className="sim-campo-ayuda">{t.exteriorPaises(ext.paises.map((p) => t.pais(p)).join(", "))}</p>
          <Chips
            leyenda={t.moneda}
            nombre="sim-moneda"
            valor={estado.monedaExterior}
            onChange={(v) => {
              if (v === "EUR") set({ monedaExterior: v, tasaCambio: 0 }, { marcar: false });
              else set({ monedaExterior: v, tasaCambio: trm?.valor ?? P.trmReferencia.valor }, { marcar: false });
              set({ editados: estado.editados.filter((k) => k !== "tasaCambio") }, { marcar: false });
            }}
            opciones={[
              { valor: "USD", texto: "USD" },
              { valor: "EUR", texto: "EUR" },
            ]}
          />
          <CampoDinero
            etiqueta={t.ingresoExterior(estado.monedaExterior)}
            valor={estado.ingresoExterior}
            onChange={(v) => set({ ingresoExterior: v })}
            max={30_000}
            paso={100}
            prefijo={estado.monedaExterior}
          />
          <CampoNumero
            etiqueta={t.tasaCambio(estado.monedaExterior)}
            valor={estado.tasaCambio}
            onChange={(v) => set({ tasaCambio: v })}
            min={0}
            max={10_000}
            paso={1}
            decimales={2}
            sufijo="COP"
            sinDeslizador
            origen={origenCambio}
            ayuda={estado.monedaExterior === "EUR" && estado.tasaCambio <= 0 ? t.tasaCambioEUR : undefined}
          />
          {estado.ingresoExterior > 0 && estado.tasaCambio > 0 && (
            <button
              type="button"
              className="sim-boton"
              onClick={() => set({ ingreso: Math.round(estado.ingresoExterior * estado.tasaCambio), conCodeudor: false })}
            >
              {t.usarComoIngreso(pesos(estado.ingresoExterior * estado.tasaCambio, idioma))}
            </button>
          )}
          {filas.length > 0 && (
            <>
              <p className="sim-campo-ayuda">{t.trmLede}</p>
              <div className="sim-tabla-scroll">
                <table className="sim-tabla-trm">
                  <thead>
                    <tr>
                      <th scope="col">{t.colVariacion}</th>
                      <th scope="col">{t.colTasaCambio}</th>
                      <th scope="col">{t.colIngresoPesos}</th>
                      <th scope="col">{t.colCuotaIngreso}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filas.map((f) => (
                      <tr key={f.variacion} className={f.pctCuota > LIMITE ? "sim-fila-mal" : f.variacion === 0 ? "sim-fila-activa" : undefined}>
                        <th scope="row">{f.variacion === 0 ? t.hoy : (f.variacion > 0 ? "+" : "−") + porcentaje(Math.abs(f.variacion), idioma)}</th>
                        <td>{pesos(f.tasaCambio, idioma)}</td>
                        <td>{pesos(f.ingresoPesos, idioma)}</td>
                        <td>{porcentaje(f.pctCuota, idioma, 1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}

function ArrendarOComprar({ r }: { r: ResultadoSimulador }) {
  const { t, idioma, estado, set, editado } = useSim();
  const aniosTotales = Math.max(10, Math.ceil(r.entrada.plazoAnios));
  const ac = useMemo(
    () =>
      estado.arriendo > 0
        ? arrendarOComprar({
            precio: r.entrada.precio,
            cuotaInicial: r.obra.cuotaInicial,
            gastosCierre: r.gastos.total,
            credito: r.credito?.meses ?? [],
            costosPropietarioMensual: estado.administracion + estado.predial,
            arriendoMensual: estado.arriendo,
            incrementoArriendo: estado.inflacion,
            valorizacion: estado.valorizacion,
            anios: aniosTotales,
          })
        : null,
    [r, estado.arriendo, estado.administracion, estado.predial, estado.inflacion, estado.valorizacion, aniosTotales],
  );
  const hitos = ac ? ac.anios.filter((a) => a.anio === 1 || a.anio % 5 === 0 || a.anio === aniosTotales) : [];
  return (
    <section className="sim-grupo" aria-labelledby="sim-arrendar-titulo">
      <h4 id="sim-arrendar-titulo">{t.arrendarTitulo}</h4>
      <p className="sim-campo-ayuda">{t.arrendarLede}</p>
      <CampoDinero etiqueta={t.arriendoActual} valor={estado.arriendo} onChange={(v) => set({ arriendo: v })} max={20_000_000} paso={100_000} />
      {estado.arriendo > 0 && (
        <>
          <CampoDinero
            etiqueta={t.administracion}
            valor={estado.administracion}
            onChange={(v) => set({ administracion: v })}
            max={3_000_000}
            paso={10_000}
            sinDeslizador
          />
          <CampoDinero etiqueta={t.predialMensual} valor={estado.predial} onChange={(v) => set({ predial: v })} max={3_000_000} paso={10_000} sinDeslizador />
          <CampoNumero
            etiqueta={t.incrementoArriendo}
            valor={estado.inflacion}
            onChange={(v) => set({ inflacion: v })}
            min={0}
            max={0.2}
            paso={0.0025}
            porcentaje
            decimales={2}
            sufijo="%"
            sinDeslizador
            origen={origenDe(P.inflacionProyectada, editado("inflacion"))}
          />
          <CampoNumero
            etiqueta={t.valorizacion}
            valor={estado.valorizacion}
            onChange={(v) => set({ valorizacion: v })}
            min={-0.05}
            max={0.2}
            paso={0.0025}
            porcentaje
            decimales={2}
            sufijo="%"
            sinDeslizador
            origen={origenDe(P.inflacionProyectada, editado("valorizacion"))}
            ayuda={t.valorizacionAyuda}
          />
        </>
      )}
      {ac && (
        <>
          <p className="sim-nota sim-nota-fuerte">
            {ac.anioEnQueComprarSupera != null ? t.comprarSupera(ac.anioEnQueComprarSupera) : t.arrendarSigue(aniosTotales)}
          </p>
          <div className="sim-tabla-scroll">
            <table className="sim-tabla-arrendar">
              <thead>
                <tr>
                  <th scope="col">{t.colAnio}</th>
                  <th scope="col">{t.colSalidaComprar}</th>
                  <th scope="col">{t.colArriendo}</th>
                  <th scope="col">{t.colPatrimonio}</th>
                </tr>
              </thead>
              <tbody>
                {hitos.map((a) => (
                  <tr key={a.anio}>
                    <th scope="row">{t.anioN(a.anio)}</th>
                    <td>{pesos(a.salidaComprar, idioma)}</td>
                    <td>{pesos(a.salidaArrendar, idioma)}</td>
                    <td>{pesos(a.patrimonio, idioma)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="sim-campo-ayuda">{t.arrendarNota}</p>
        </>
      )}
    </section>
  );
}

// ── Inversión: renta corta o tradicional (M13) ───────────────────────────

export function PestanaInversion({ r, item, items }: { r: ResultadoSimulador; item: ItemSimulador | null; items: ItemSimulador[] }) {
  const { t } = useSim();
  const conRentaCorta = items.filter((i) => i.rentaCorta);
  return (
    <div className="sim-pestana">
      {item?.rentaCorta ? (
        <RentaCorta r={r} fuente={item.rentaCorta} />
      ) : (
        <>
          {conRentaCorta.length > 0 && <p className="sim-campo-ayuda">{t.rentaCortaSolo(conRentaCorta.map((i) => i.nombre).join(", "))}</p>}
          <RentaTradicional r={r} />
        </>
      )}
    </div>
  );
}

function capitalPropio(r: ResultadoSimulador, dotacion: number): number {
  return r.obra.cuotaInicial + r.gastos.total + dotacion;
}

function RentaCorta({ r, fuente }: { r: ResultadoSimulador; fuente: string }) {
  const { t, idioma, estado, set, editado } = useSim();
  const trm = useTRM();
  const valorTRM = trm?.valor ?? P.trmReferencia.valor;
  const origenTRM: Origen = trm ? { tipo: "fuente", fuente: t.fuenteTRM, fecha: trm.vigente, url: URL_TRM } : origenDe(P.trmReferencia);
  const rc = rentaCorta({
    precio: r.entrada.precio,
    trm: valorTRM,
    tarifaNocheUSD: estado.tarifaNocheUSD,
    ocupacion: estado.ocupacion,
    comisionOperador: estado.comision,
    contribucionTurismo: P.contribucionTurismo.valor,
    administracion: estado.administracion,
    predialMensual: estado.predial,
    servicios: estado.servicios,
    seguros: r.credito?.segurosMes1 ?? 0,
    cuotaCredito: r.credito?.cuota ?? 0,
    capitalPropio: capitalPropio(r, estado.dotacion),
  });
  return (
    <section className="sim-grupo" aria-labelledby="sim-rc-titulo">
      <h4 id="sim-rc-titulo">{t.rentaCortaTitulo}</h4>
      <p className="sim-aviso-fijo">{t.rentaCortaAviso(fuente)}</p>
      <CampoNumero
        etiqueta={t.tarifaNoche}
        valor={estado.tarifaNocheUSD}
        onChange={(v) => set({ tarifaNocheUSD: v })}
        min={20}
        max={400}
        paso={1}
        sufijo="USD"
        origen={origenDe(P.tarifaNocheUSD, editado("tarifaNocheUSD"))}
        ayuda={
          <>
            {t.tarifaNocheAyuda(pesos(rc.tarifaNoche, idioma))} <Etiqueta origen={origenTRM} />
          </>
        }
      />
      <CampoNumero
        etiqueta={t.ocupacion}
        valor={estado.ocupacion}
        onChange={(v) => set({ ocupacion: v })}
        min={0.1}
        max={1}
        paso={0.01}
        porcentaje
        sufijo="%"
        origen={origenDe(P.ocupacionRentaCorta, editado("ocupacion"))}
      />
      <CampoNumero
        etiqueta={t.comisionOperador}
        valor={estado.comision}
        onChange={(v) => set({ comision: v })}
        min={0}
        max={0.4}
        paso={0.01}
        porcentaje
        sufijo="%"
        origen={origenDe(P.comisionOperador, editado("comision"))}
      />
      <CampoDinero etiqueta={t.administracion} valor={estado.administracion} onChange={(v) => set({ administracion: v })} max={3_000_000} paso={10_000} sinDeslizador />
      <CampoDinero etiqueta={t.predialMensual} valor={estado.predial} onChange={(v) => set({ predial: v })} max={3_000_000} paso={10_000} sinDeslizador />
      <CampoDinero etiqueta={t.servicios} valor={estado.servicios} onChange={(v) => set({ servicios: v })} max={3_000_000} paso={10_000} sinDeslizador />
      <CampoDinero
        etiqueta={t.dotacion}
        valor={estado.dotacion}
        onChange={(v) => set({ dotacion: v })}
        max={100_000_000}
        paso={500_000}
        sinDeslizador
        ayuda={t.dotacionAyuda}
      />
      <dl className="sim-datos">
        <Dato nombre={t.nochesMes} valor={rc.nochesMes.toFixed(1).replace(".", idioma === "en" ? "." : ",")} />
        <Dato nombre={t.ingresoBruto} valor={pesos(rc.ingresoBruto, idioma)} />
        <Dato nombre={t.gastosOperacion} valor={pesos(rc.operador + rc.contribucionTurismo + rc.fijos + rc.seguros, idioma)} nota={t.gastosOperacionNota(porcentaje(P.contribucionTurismo.valor, idioma, 2))} />
        <Dato nombre={t.flujoAntes} valor={pesos(rc.flujoAntesCuota, idioma)} />
        <Dato nombre={t.flujoDespues} valor={pesos(rc.flujoDespuesCuota, idioma)} clase={rc.flujoDespuesCuota >= 0 ? "sim-dato-fuerte" : "sim-dato-fuerte sim-dato-mal"} />
        <Dato
          nombre={t.ocupacionEquilibrio}
          valor={rc.ocupacionEquilibrio != null ? porcentaje(rc.ocupacionEquilibrio, idioma) : t.ningunaOcupacion}
        />
        <Dato nombre={t.rentabilidadBruta} valor={porcentaje(rc.rentabilidadBruta, idioma, 1)} />
        <Dato nombre={t.rentabilidadNeta} valor={porcentaje(rc.rentabilidadNeta, idioma, 1)} />
        {rc.retornoCapital != null && <Dato nombre={t.retornoCapital} valor={porcentaje(rc.retornoCapital, idioma, 1)} nota={t.retornoCapitalNota} />}
      </dl>
    </section>
  );
}

function RentaTradicional({ r }: { r: ResultadoSimulador }) {
  const { t, idioma, estado, set } = useSim();
  const rt =
    estado.canon > 0
      ? rentaTradicional({
          precio: r.entrada.precio,
          canon: estado.canon,
          administracion: estado.administracion,
          predialMensual: estado.predial,
          mesesVacancia: P.mesesVacancia.valor,
          seguros: r.credito?.segurosMes1 ?? 0,
          cuotaCredito: r.credito?.cuota ?? 0,
          capitalPropio: capitalPropio(r, 0),
        })
      : null;
  return (
    <section className="sim-grupo" aria-labelledby="sim-rt-titulo">
      <h4 id="sim-rt-titulo">{t.rentaTradicionalTitulo}</h4>
      <p className="sim-aviso-fijo">{t.rentaTradicionalAviso}</p>
      <CampoDinero etiqueta={t.canon} valor={estado.canon} onChange={(v) => set({ canon: v })} max={20_000_000} paso={100_000} ayuda={t.canonAyuda} />
      <CampoDinero etiqueta={t.administracion} valor={estado.administracion} onChange={(v) => set({ administracion: v })} max={3_000_000} paso={10_000} sinDeslizador />
      <CampoDinero etiqueta={t.predialMensual} valor={estado.predial} onChange={(v) => set({ predial: v })} max={3_000_000} paso={10_000} sinDeslizador />
      <p className="sim-campo-ayuda">
        {t.vacancia(P.mesesVacancia.valor)} <Etiqueta origen={origenDe(P.mesesVacancia)} />
      </p>
      {rt && (
        <dl className="sim-datos">
          <Dato nombre={t.ingresoAnual} valor={pesos(rt.ingresoAnual, idioma)} />
          <Dato nombre={t.flujoAntes} valor={pesos(rt.flujoMensualAntesCuota, idioma)} />
          <Dato
            nombre={t.flujoDespues}
            valor={pesos(rt.flujoMensualDespuesCuota, idioma)}
            clase={rt.flujoMensualDespuesCuota >= 0 ? "sim-dato-fuerte" : "sim-dato-fuerte sim-dato-mal"}
          />
          <Dato nombre={t.rentabilidadBruta} valor={porcentaje(rt.rentabilidadBruta, idioma, 1)} />
          <Dato nombre={t.rentabilidadNeta} valor={porcentaje(rt.rentabilidadNeta, idioma, 1)} />
          {rt.retornoCapital != null && <Dato nombre={t.retornoCapital} valor={porcentaje(rt.retornoCapital, idioma, 1)} nota={t.retornoCapitalNota} />}
        </dl>
      )}
    </section>
  );
}

// ── Escenarios (M18) ─────────────────────────────────────────────────────

export type EscenarioGuardado = { nombre: string; resultado: ResultadoSimulador };

export function PestanaEscenarios({
  escenarios,
  alGuardar,
  alQuitar,
}: {
  escenarios: EscenarioGuardado[];
  alGuardar: () => void;
  alQuitar: (i: number) => void;
}) {
  const { t, idioma, hoy } = useSim();
  const filas = escenarios.length ? compararEscenarios(escenarios.map((e) => e.resultado)) : [];
  const inicio = hoy ?? "2026-10-01";
  return (
    <div className="sim-pestana">
      <p className="sim-campo-ayuda">{t.escenariosLede}</p>
      <button type="button" className="sim-boton" onClick={alGuardar} disabled={escenarios.length >= 3}>
        {escenarios.length >= 3 ? t.maximoEscenarios : t.guardarEscenario}
      </button>
      {escenarios.length > 0 && (
        <div className="sim-tabla-scroll">
          <table className="sim-comparar">
            <thead>
              <tr>
                <th scope="col">
                  <span className="sr-only">{t.concepto}</span>
                </th>
                {escenarios.map((e, i) => (
                  <th scope="col" key={`${e.nombre}-${i}`}>
                    {e.nombre}{" "}
                    <button type="button" className="sim-quitar" onClick={() => alQuitar(i)} aria-label={t.quitarEscenario(e.nombre)}>
                      ×
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => (
                <tr key={f.clave}>
                  <th scope="row">{t.filaComparada[f.clave]}</th>
                  {f.valores.map((v, i) => {
                    const mejor = escenarios.length > 1 && i === f.mejor;
                    return (
                      <td key={i} className={mejor ? "sim-mejor" : undefined}>
                        {f.clave === "mesUltimoPago" ? mesDesdeHoy(inicio, v, idioma) : pesos(v, idioma)}
                        {mejor && <span className="sr-only"> ({t.mejor})</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
