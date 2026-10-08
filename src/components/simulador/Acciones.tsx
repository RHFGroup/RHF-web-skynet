"use client";

/**
 * Lo que la persona se lleva de su simulación (M19 a M21 del prompt):
 *
 *  · El resumen por WhatsApp, con el código WEB-SIM-{slug} para saber de
 *    dónde llega la conversación. Sin formulario: la persona lo manda.
 *  · El enlace que reconstruye el escenario (enlace.ts).
 *  · El plan en PDF: el navegador lo guarda con «Imprimir → Guardar como PDF»
 *    a partir de una hoja propia (la clase `sim-plan`, solo para imprimir).
 *    Se pide nombre y contacto antes, porque el plan le llega también a
 *    Rafael.
 *  · «Quiero ayuda con mi crédito»: la precalificación, con un puntaje A/B/C
 *    que ordena la respuesta de Rafael (no decide nada del crédito).
 *
 * Los dos formularios van a POST /api/consulta, el mismo endpoint del
 * formulario de contacto, con las mismas garantías: sin la casilla de
 * autorización no se envía nada (Ley 1581 de 2012), trampa para bots y
 * Turnstile. El texto de la autorización es el mismo del formulario de
 * contacto, por eso viaja con su versión («2026-10-07»). Si el envío falla se
 * dice, y WhatsApp queda como salida. Lo que se envía a Rafael va en español
 * desde cualquier idioma, como en ContactForm.
 *
 * La analítica recibe el puntaje y un id de evento, nunca el ingreso, el
 * nombre ni el teléfono. `generate_lead` es el evento que GTM ya convierte
 * en «Lead»; `simulator_pdf_lead` y `simulator_prequal_lead` son para medir
 * el embudo del simulador y no se deben mapear a «Lead» (se contaría dos
 * veces).
 */
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Script from "next/script";
import type { ResultadoSimulador } from "@/lib/simulador/simular";
import type { ItemCartera, ResultadoItem } from "@/lib/simulador/cartera";
import { CORREO, RESPONSABLE, TELEFONO_VISIBLE, enlaceWhatsApp } from "@/data/contacto";
import { fechaLarga, ruta } from "@/i18n/idioma";
import { useSim } from "@/components/simulador/contexto";
import { evento, idDeEvento, sinClicSalienteDeGA4 } from "@/components/simulador/analitica";
import { enlaceDelEscenario } from "@/components/simulador/enlace";
import { anios, meses, mesDesdeHoy, pesos, porcentaje } from "@/components/simulador/formato";
import { atribucionParaEnviar } from "@/lib/atribucion";
import { PARAMETROS } from "@/components/simulador/parametros";
import type { Cuando, EstadoSim, ItemSimulador, TipoIngreso } from "@/components/simulador/tipos";

/**
 * La misma versión del texto de autorización de ContactForm (AVISO_VERSION):
 * el texto es el mismo (src/components/simulador/textos.ts). 7-oct-2026: suma
 * «y para saber por qué medio llegué a esta página», aprobado por Rafael el
 * 8-oct-2026. La anterior era «2026-09-18».
 */
const AVISO_VERSION = "2026-10-07";
/** La site key pública de Turnstile, la misma de ContactForm. */
const TURNSTILE_SITE_KEY = "0x4AAAAAAE8W_1D4uDCgIB5S";

type Turnstile = {
  render: (contenedor: HTMLElement, opciones: Record<string, unknown>) => string;
  reset: (contenedor?: HTMLElement) => void;
};
const turnstile = () => (window as unknown as { turnstile?: Turnstile }).turnstile;

type Tipo = "plan" | "ayuda";

/** Lo que Rafael lee, siempre en español. */
const MODALIDAD_ES = { pesos: "crédito en pesos", uvr: "crédito en UVR", leasing: "leasing habitacional", contado: "de contado" } as const;
const CUANDO_ES: Record<Cuando, string> = { "0-3": "en menos de 3 meses", "3-6": "de 3 a 6 meses", "6-12": "de 6 a 12 meses", "12+": "en más de un año" };
const INGRESO_ES: Record<TipoIngreso, string> = {
  empleado: "empleo",
  independiente: "trabajo independiente",
  pensionado: "pensión",
  exterior: "trabajo fuera de Colombia",
};

const ingresoDelHogar = (e: EstadoSim) => e.ingreso + (e.conCodeudor ? e.ingresoCodeudor : 0);

/**
 * El puntaje de la precalificación. Ordena a quién responder primero; no
 * dice nada de la aprobación, que es del banco.
 *   A: la cuota cabe en el límite legal, la cuota inicial está cubierta y
 *      (si lo dijo) compra en los próximos seis meses.
 *   C: ni la cuota cabe ni la cuota inicial está cubierta.
 *   B: lo demás.
 */
export function puntajeDe(r: ResultadoSimulador, e: EstadoSim, cuando?: Cuando): { letra: "A" | "B" | "C"; motivo: string } {
  const hogar = ingresoDelHogar(e);
  const cumple = e.modalidad === "contado" || (hogar > 0 && r.credito != null && r.estadoLegal !== "supera");
  const ciCubierta = r.obra.pendiente - e.ahorroMensual * Math.max(0, Math.round(e.meses)) <= 0.5;
  const pronto = cuando === undefined || cuando === "0-3" || cuando === "3-6";
  const letra = cumple && ciCubierta && pronto ? "A" : !cumple && !ciCubierta ? "C" : "B";
  const motivo = [
    e.modalidad === "contado" ? "compra de contado" : hogar <= 0 ? "no escribió su ingreso" : cumple ? `la cuota cabe en el ${Math.round(r.limiteCuotaIngreso * 100)} % del ingreso` : "la cuota pasa del límite del ingreso",
    ciCubierta ? "cuota inicial cubierta" : "le falta cuota inicial",
    cuando ? `compraría ${CUANDO_ES[cuando]}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  return { letra, motivo };
}

/** El número en pesos como lo lee Rafael. */
const cop = (n: number) => pesos(n, "es");

function mensajeParaRafael(o: {
  tipo: Tipo;
  r: ResultadoSimulador;
  e: EstadoSim;
  item: ItemSimulador | null;
  puntaje: { letra: string; motivo: string };
  cuando?: Cuando;
  tipoIngreso?: TipoIngreso;
  alcanzan: string[];
  enlace: string;
  idioma: string;
}): string {
  const { r, e, item } = o;
  const hogar = ingresoDelHogar(e);
  const c = r.credito;
  const tasa = e.modalidad === "uvr" ? (e.tasaUVR == null ? "sin tasa" : `UVR + ${(e.tasaUVR * 100).toFixed(2).replace(".", ",")} %`) : `${(e.tasa * 100).toFixed(2).replace(".", ",")} % E.A.`;
  const lineas = [
    o.tipo === "plan" ? "Descargó su plan de compra (PDF) desde el simulador." : "Pide ayuda con su crédito desde el simulador.",
    `Puntaje: ${o.puntaje.letra} (${o.puntaje.motivo})`,
    `Inmueble: ${item ? item.nombreEs : "otro precio"} · ${cop(e.precio)}${item?.corte && !e.editados.includes("precio") ? ` (corte ${item.corte})` : ""}`,
    e.modalidad === "contado"
      ? "Financiación: de contado"
      : `Financiación: ${MODALIDAD_ES[e.modalidad]} · ${Math.round(r.entrada.pctFinanciado * 100)} % financiado · ${r.entrada.plazoAnios} años · ${tasa}${e.editados.includes("tasa") || e.editados.includes("tasaUVR") ? " (la escribió)" : " (supuesto)"}`,
    `Cuota inicial: ${cop(r.obra.cuotaInicial)} · pendiente ${cop(r.obra.pendiente)} · ${r.obra.alaFirma ? "a la firma" : `${cop(r.obra.pagoMensual)} al mes por ${Math.round(e.meses)} meses`}`,
    c ? `Primera cuota: ${cop(c.cuota)} (con seguros ${cop(c.cuotaConSeguros)})` : null,
    hogar > 0
      ? `Ingreso del hogar: ${cop(hogar)}${e.conCodeudor ? " (con codeudor)" : ""}${c ? ` · ingreso requerido ${cop(r.ingresoRequerido)} · la cuota es el ${Math.round((c.cuota / hogar) * 100)} % del ingreso` : ""}`
      : "Ingreso del hogar: no lo escribió",
    `Para la cuota inicial: ahorros ${cop(e.ahorros)} · cesantías ${cop(e.cesantias)} · ahorro mensual ${cop(e.ahorroMensual)}`,
    e.otrasDeudas > 0 ? `Otras deudas: ${cop(e.otrasDeudas)} al mes` : null,
    e.exterior ? `Vive fuera de Colombia (ingreso en ${e.monedaExterior})` : null,
    o.cuando ? `Compraría: ${CUANDO_ES[o.cuando]}` : null,
    o.tipoIngreso ? `Sus ingresos: ${INGRESO_ES[o.tipoIngreso]}` : null,
    o.alcanzan.length ? `Le alcanzan: ${o.alcanzan.join(", ")}` : null,
    `Escenario: ${o.enlace}`,
    `Código: WEB-SIM-${item?.slug ?? "otro"}`,
    o.idioma === "en" ? "Escribió desde la página en inglés." : null,
  ];
  return lineas.filter(Boolean).join("\n").slice(0, 2000);
}

export default function Acciones({
  r,
  item,
  alcanzan,
  faltaTasaUVR,
}: {
  r: ResultadoSimulador;
  item: ItemSimulador | null;
  alcanzan: { evaluados: ResultadoItem[]; consultar: ItemCartera[] };
  faltaTasaUVR: boolean;
}) {
  const { t, idioma, estado, hoy } = useSim();
  const [abierto, setAbierto] = useState<Tipo | null>(null);
  const [listo, setListo] = useState<Tipo | null>(null);
  const [copiado, setCopiado] = useState<"si" | "manual" | null>(null);
  const enlace = hoy ? enlaceDelEscenario(estado) : "";
  const codigo = `WEB-SIM-${item?.slug ?? "otro"}`;
  const nombresQueAlcanzan = alcanzan.evaluados.filter((x) => x.estado === "alcanza").map((x) => x.item.nombre);

  const resumen = [
    t.waIntro,
    `• ${item?.nombre ?? t.otroPrecio}: ${pesos(estado.precio, idioma)}`,
    estado.modalidad === "contado"
      ? `• ${t.modalidadTitulo.contado}`
      : `• ${t.waCondiciones(t.modalidadTitulo[estado.modalidad], porcentaje(r.entrada.pctFinanciado, idioma), anios(r.entrada.plazoAnios, idioma))}`,
    r.obra.alaFirma ? `• ${t.waALaFirma(pesos(r.obra.pendiente, idioma))}` : `• ${t.waEnObra(pesos(r.obra.pagoMensual, idioma), meses(estado.meses, idioma))}`,
    r.credito && !faltaTasaUVR ? `• ${t.waCuota(pesos(r.credito.cuota, idioma))}` : null,
    r.credito && !faltaTasaUVR ? `• ${t.waIngreso(pesos(r.ingresoRequerido, idioma))}` : null,
    `${t.waCierre} (${codigo})`,
    enlace,
  ]
    .filter(Boolean)
    .join("\n");

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(enlace);
      setCopiado("si");
      window.setTimeout(() => setCopiado(null), 2500);
    } catch {
      setCopiado("manual");
    }
  };

  const imprimir = () => {
    document.body.classList.add("sim-imprimiendo");
    const quitar = () => {
      document.body.classList.remove("sim-imprimiendo");
      window.removeEventListener("afterprint", quitar);
    };
    window.addEventListener("afterprint", quitar);
    window.print();
  };

  return (
    <section className="sim-bloque sim-acciones" aria-labelledby="sim-acciones-titulo">
      <h3 id="sim-acciones-titulo">{t.accionesTitulo}</h3>
      <p className="sim-bloque-lede">{t.accionesLede}</p>
      <div className="sim-acciones-botones">
        <a
          className="btn-whatsapp"
          href={enlaceWhatsApp(resumen)}
          target="_blank"
          rel="noopener noreferrer"
          data-ubicacion="simulador-resumen"
          onClick={(e) => {
            evento("simulator_whatsapp", { proyecto: item?.slug ?? "otro" });
            sinClicSalienteDeGA4(e);
          }}
        >
          {t.enviarWhatsApp}
        </a>
        <button type="button" className="sim-boton" onClick={copiar}>
          {copiado === "si" ? t.enlaceCopiado : t.copiarEnlace}
        </button>
        <button type="button" className="sim-boton" aria-expanded={abierto === "plan"} onClick={() => setAbierto(abierto === "plan" ? null : "plan")}>
          {t.descargarPlan}
        </button>
        <button type="button" className="btn-primary" aria-expanded={abierto === "ayuda"} onClick={() => setAbierto(abierto === "ayuda" ? null : "ayuda")}>
          {t.quieroAyuda}
        </button>
      </div>
      {copiado === "manual" && (
        <label className="sim-copia-manual">
          {t.copiaManual}
          <input type="text" readOnly value={enlace} onFocus={(e) => e.currentTarget.select()} />
        </label>
      )}

      {abierto && listo !== abierto && (
        <Formulario
          key={abierto}
          tipo={abierto}
          r={r}
          item={item}
          alcanzan={nombresQueAlcanzan}
          enlace={enlace}
          resumen={resumen}
          alCerrar={() => setAbierto(null)}
          alListo={() => {
            setListo(abierto);
            if (abierto === "plan") imprimir();
          }}
        />
      )}
      {abierto && listo === abierto && (
        <div className="sim-form sim-form-listo" role="status">
          <span className="sim-form-marca" aria-hidden="true">
            ✓
          </span>
          <p>{abierto === "plan" ? t.okPlan : t.okAyuda}</p>
          {abierto === "plan" && (
            <button type="button" className="sim-boton" onClick={imprimir}>
              {t.abrirOtraVez}
            </button>
          )}
        </div>
      )}

      <Plan r={r} item={item} enlace={enlace} faltaTasaUVR={faltaTasaUVR} />
    </section>
  );
}

function Formulario({
  tipo,
  r,
  item,
  alcanzan,
  enlace,
  resumen,
  alCerrar,
  alListo,
}: {
  tipo: Tipo;
  r: ResultadoSimulador;
  item: ItemSimulador | null;
  alcanzan: string[];
  enlace: string;
  resumen: string;
  alCerrar: () => void;
  alListo: () => void;
}) {
  const { t, idioma, estado } = useSim();
  const [nombre, setNombre] = useState("");
  const [contacto, setContacto] = useState("");
  const [cuando, setCuando] = useState<Cuando | "">("");
  const [tipoIngreso, setTipoIngreso] = useState<TipoIngreso | "">("");
  const [autoriza, setAutoriza] = useState(false);
  const [sitio, setSitio] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [fallo, setFallo] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const turnstileRef = useRef<HTMLDivElement>(null);

  // Si el script de Turnstile ya estaba cargado (se abrió el otro formulario
  // antes), no vuelve a buscar el widget solo: se le pide que lo pinte.
  useEffect(() => {
    const ts = turnstile();
    if (ts && turnstileRef.current && !turnstileRef.current.hasChildNodes()) {
      try {
        ts.render(turnstileRef.current, { sitekey: TURNSTILE_SITE_KEY, appearance: "interaction-only", language: idioma, theme: "light" });
      } catch {
        /* sin widget: el Worker decide */
      }
    }
  }, [idioma]);

  async function enviar(ev: React.FormEvent) {
    ev.preventDefault();
    if (!autoriza) {
      setError(t.faltaAutorizacion);
      return;
    }
    setError("");
    setFallo(false);
    setEnviando(true);
    const token = formRef.current?.querySelector<HTMLInputElement>('input[name="cf-turnstile-response"]')?.value ?? "";
    const puntaje = puntajeDe(r, estado, tipo === "ayuda" && cuando ? cuando : undefined);
    const idEvento = idDeEvento();
    try {
      const resp = await fetch("/api/consulta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          contacto: contacto.trim(),
          proyecto: `Simulador · ${item?.nombreEs ?? "otro precio"}`.slice(0, 80),
          mensaje: mensajeParaRafael({
            tipo,
            r,
            e: estado,
            item,
            puntaje,
            cuando: tipo === "ayuda" && cuando ? cuando : undefined,
            tipoIngreso: tipo === "ayuda" && tipoIngreso ? tipoIngreso : undefined,
            alcanzan,
            enlace,
            idioma,
          }),
          tipo: "simulador",
          autoriza: true,
          version_aviso: AVISO_VERSION,
          // Solo la ruta: el escenario (con el ingreso) va en el mensaje, que la persona autorizó.
          origen: window.location.pathname,
          // Por dónde llegó, si el navegador lo anotó (src/lib/atribucion.ts).
          atribucion: atribucionParaEnviar(),
          sitio,
          turnstile: token,
        }),
      });
      if (!resp.ok) throw new Error(String(resp.status));
      evento(tipo === "plan" ? "simulator_pdf_lead" : "simulator_prequal_lead", { puntaje: puntaje.letra, event_id: idEvento });
      evento("generate_lead", {
        formulario: tipo === "plan" ? "simulador_plan" : "simulador_precalificacion",
        proyecto: item?.slug ?? "otro",
        puntaje: puntaje.letra,
        event_id: idEvento,
      });
      alListo();
    } catch {
      setFallo(true);
    } finally {
      setEnviando(false);
      // Cada token sirve una sola vez.
      if (turnstileRef.current) turnstile()?.reset(turnstileRef.current);
    }
  }

  // `action` y `method` explícitos (1-oct-2026): sin ellos, el destino del
  // formulario es la dirección de la página con el «#» del escenario (ingreso y
  // ahorros), y GA4 lo manda como `form_destination` en cuanto se escribe. El
  // envío real lo hace `enviar`, con fetch; esto solo cuenta si no cargó el JS.
  return (
    <form className="sim-form" action="/api/consulta" method="post" onSubmit={enviar} ref={formRef}>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />
      <div className="sim-form-cabeza">
        <h4>{tipo === "plan" ? t.formPlanTitulo : t.formAyudaTitulo}</h4>
        <button type="button" className="sim-quitar" onClick={alCerrar} aria-label={t.cerrar}>
          ×
        </button>
      </div>
      <p className="sim-campo-ayuda">{tipo === "plan" ? t.formPlanLede : t.formAyudaLede}</p>
      <label className="sim-form-campo">
        {t.nombre}
        <input type="text" name="nombre" autoComplete="name" value={nombre} onChange={(e) => setNombre(e.target.value)} required minLength={2} />
      </label>
      <label className="sim-form-campo">
        {t.contacto}
        <input
          type="text"
          name="contacto"
          autoComplete="tel"
          placeholder={t.contactoPlaceholder}
          value={contacto}
          onChange={(e) => setContacto(e.target.value)}
          required
          minLength={5}
        />
      </label>
      {tipo === "ayuda" && (
        <>
          <fieldset className="sim-chips">
            <legend>{t.cuandoCompras}</legend>
            <div className="sim-chips-lista">
              {(Object.keys(t.cuando) as Cuando[]).map((k) => (
                <label key={k} className={cuando === k ? "sim-chip sim-chip-activo" : "sim-chip"}>
                  <input type="radio" name="sim-cuando" value={k} checked={cuando === k} onChange={() => setCuando(k)} />
                  <span>{t.cuando[k]}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="sim-chips">
            <legend>{t.tusIngresos}</legend>
            <div className="sim-chips-lista">
              {(Object.keys(t.tipoIngreso) as TipoIngreso[]).map((k) => (
                <label key={k} className={tipoIngreso === k ? "sim-chip sim-chip-activo" : "sim-chip"}>
                  <input type="radio" name="sim-ingreso" value={k} checked={tipoIngreso === k} onChange={() => setTipoIngreso(k)} />
                  <span>{t.tipoIngreso[k]}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </>
      )}

      {/* Trampa para bots: fuera de la vista y fuera del tabulador. */}
      <input
        type="text"
        name="sitio"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={sitio}
        onChange={(e) => setSitio(e.target.value)}
        className="sim-trampa"
      />

      <label className="form-consentimiento">
        <input type="checkbox" name="autoriza" checked={autoriza} onChange={(e) => setAutoriza(e.target.checked)} />
        <span>
          {t.autorizo}
          {RESPONSABLE}
          {t.tratar}
          {t.conforme}{" "}
          <a href={ruta(idioma, "/privacidad")} target="_blank" rel="noopener noreferrer">
            {t.politica}
          </a>
          {t.derechos}
          {CORREO}.
        </span>
      </label>

      <div
        ref={turnstileRef}
        className="cf-turnstile"
        data-sitekey={TURNSTILE_SITE_KEY}
        data-appearance="interaction-only"
        data-language={idioma}
        data-theme="light"
      />

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button className="btn-primary" type="submit" disabled={enviando}>
        {enviando ? t.enviando : tipo === "plan" ? t.prepararPlan : t.pedirAyuda}
      </button>
      {fallo && (
        <div className="form-fallo" role="alert">
          <p>
            <strong>{t.falloTitulo}</strong> {t.falloTexto}
          </p>
          <a className="btn-whatsapp" href={enlaceWhatsApp(resumen)} target="_blank" rel="noopener noreferrer" data-ubicacion="simulador-fallo" onClick={sinClicSalienteDeGA4}>
            {t.enviarWhatsApp}
          </a>
        </div>
      )}
      <p className="form-disclaimer">{t.disclaimer}</p>
    </form>
  );
}

/**
 * La hoja del plan, para imprimir o guardar como PDF. Vive fuera del árbol de
 * la página (un portal al final de <body>): al imprimir, el CSS esconde todo
 * lo demás (simulador.css, «body.sim-imprimiendo»).
 */
function Plan({ r, item, enlace, faltaTasaUVR }: { r: ResultadoSimulador; item: ItemSimulador | null; enlace: string; faltaTasaUVR: boolean }) {
  const { t, idioma, estado, hoy } = useSim();
  if (!hoy) return null;
  const c = r.credito;
  const hogar = ingresoDelHogar(estado);
  const mesEntrega = Math.max(0, Math.round(estado.meses));
  const supuestos = [
    !estado.editados.includes("tasa") && (estado.modalidad === "pesos" || estado.modalidad === "leasing") ? t.planSupuestoTasa(porcentaje(estado.tasa, idioma, 2)) : null,
    item && item.meses == null && !estado.editados.includes("meses") ? t.planSupuestoMeses(meses(estado.meses, idioma)) : null,
    PARAMETROS.impuestoRegistro.verificado ? null : t.planSupuestoImpuesto(porcentaje(PARAMETROS.impuestoRegistro.valor.compraventa, idioma, 1)),
    estado.seguros && c ? t.planSupuestoSeguros : null,
    estado.modalidad === "uvr" ? t.planSupuestoInflacion(porcentaje(estado.inflacion, idioma, 1)) : null,
  ].filter((x): x is string => Boolean(x));

  return createPortal(
    <article className="sim-plan" aria-hidden="true">
      <header className="sim-plan-cabeza">
        <img src="/marca/rhf-living-oscuro.svg" alt="RHF Living" width={180} height={40} />
        <div>
          <h1>{t.planTitulo}</h1>
          <p>{t.planFecha(fechaLarga(hoy, idioma))}</p>
        </div>
      </header>

      <section>
        <h2>{t.planInmueble}</h2>
        <p>
          <strong>{item?.nombre ?? t.otroPrecio}</strong> · {pesos(estado.precio, idioma)}
          {item?.corte && !estado.editados.includes("precio") ? ` · ${t.corte(item.corte)}` : ""}
        </p>
      </section>

      <section>
        <h2>{t.planComoPagas}</h2>
        <dl>
          <div>
            <dt>{estado.modalidad === "contado" ? t.ciContado : t.ciTotal(porcentaje(1 - r.entrada.pctFinanciado, idioma))}</dt>
            <dd>{pesos(r.obra.cuotaInicial, idioma)}</dd>
          </div>
          <div>
            <dt>{t.ciPendiente}</dt>
            <dd>{pesos(r.obra.pendiente, idioma)}</dd>
          </div>
          <div>
            <dt>{r.obra.alaFirma ? t.ciALaFirma : t.ciPorMes(meses(estado.meses, idioma))}</dt>
            <dd>
              {pesos(r.obra.alaFirma ? r.obra.pendiente : r.obra.pagoMensual, idioma)}
              {r.obra.pendiente <= 0.5 ? ` · ${t.ciCubierta}` : ""}
            </dd>
          </div>
          <div>
            <dt>{t.gastosCierre}</dt>
            <dd>{pesos(r.gastos.total, idioma)}</dd>
          </div>
        </dl>
      </section>

      {c && !faltaTasaUVR && (
        <section>
          <h2>{t.planCredito}</h2>
          <dl>
            <div>
              <dt>{t.modalidad}</dt>
              <dd>
                {t.modalidadTitulo[estado.modalidad]} · {porcentaje(r.entrada.pctFinanciado, idioma)} · {anios(r.entrada.plazoAnios, idioma)}
              </dd>
            </div>
            <div>
              <dt>{t.montoFinanciado}</dt>
              <dd>{pesos(c.montoFinanciado, idioma)}</dd>
            </div>
            <div>
              <dt>{estado.modalidad === "leasing" ? t.canonLeasing : estado.modalidad === "uvr" ? t.primeraCuotaUVR : t.cuotaCredito}</dt>
              <dd>
                {pesos(c.cuota, idioma)}
                {c.segurosMes1 > 0 ? ` · ${t.conSeguros} ${pesos(c.cuotaConSeguros, idioma)}` : ""}
              </dd>
            </div>
            <div>
              <dt>{t.ingresoRequerido}</dt>
              <dd>
                {pesos(r.ingresoRequerido, idioma)}
                {hogar > 0 ? ` · ${t.planTuIngreso(pesos(hogar, idioma), porcentaje(c.cuota / hogar, idioma))}` : ""}
              </dd>
            </div>
            <div>
              <dt>{t.interesesTotales}</dt>
              <dd>{pesos(c.totalIntereses, idioma)}</dd>
            </div>
            {c.opcionCompra > 0 && (
              <div>
                <dt>{t.opcionCompra}</dt>
                <dd>{pesos(c.opcionCompra, idioma)}</dd>
              </div>
            )}
          </dl>
        </section>
      )}

      <section>
        <h2>{t.planFechas}</h2>
        <dl>
          <div>
            <dt>{t.marcaEntrega}</dt>
            <dd>{mesDesdeHoy(hoy, mesEntrega, idioma)}</dd>
          </div>
          {c && !faltaTasaUVR && (
            <div>
              <dt>{t.ultimoPago}</dt>
              <dd>{mesDesdeHoy(hoy, r.mesUltimoPago, idioma)}</dd>
            </div>
          )}
        </dl>
      </section>

      {supuestos.length > 0 && (
        <section>
          <h2>{t.planSupuestos}</h2>
          <ul>
            {supuestos.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </section>
      )}

      <footer className="sim-plan-pie">
        <p>{t.avisoFinal}</p>
        {enlace && (
          <p>
            {t.planEnlace} <span className="sim-plan-enlace">{enlace}</span>
          </p>
        )}
        <p>{t.planContacto(TELEFONO_VISIBLE)}</p>
      </footer>
    </article>,
    document.body,
  );
}
