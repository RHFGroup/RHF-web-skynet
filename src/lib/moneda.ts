/**
 * La moneda en que la persona quiere ver la referencia de precio (29-sep-2026,
 * informe de Luciano: «selector de moneda en el header, USD/COP»).
 *
 * La regla que no se mueve: **el precio se publica en pesos colombianos**
 * (Ley 1480 de 2011, art. 26, y el precio de referencia de la Circular 004).
 * El dólar es una referencia aproximada que se suma al lado, con la TRM del
 * día; nunca reemplaza a los pesos. Por eso el selector no cambia el precio:
 * decide si se muestra la referencia en dólares.
 *
 * La elección vive en `<html data-moneda="COP|USD">`, que un script en <head>
 * pone antes de pintar (MONEDA_ANTES_DE_PINTAR), y en localStorage para la
 * próxima visita. En las páginas en inglés, sin elección guardada, arranca en
 * dólares.
 */
export type Moneda = "COP" | "USD";

export const CLAVE_MONEDA = "rhf-moneda";

/** Evento que avisa a la página que cambió la moneda. */
export const EVENTO_MONEDA = "rhf-moneda";

export const MONEDA_ANTES_DE_PINTAR = `try{var m=localStorage.getItem("${CLAVE_MONEDA}");if(m!=="USD"&&m!=="COP")m=location.pathname.indexOf("/en")===0?"USD":"COP";document.documentElement.setAttribute("data-moneda",m)}catch(e){document.documentElement.setAttribute("data-moneda",location.pathname.indexOf("/en")===0?"USD":"COP")}`;

export function monedaActual(): Moneda {
  if (typeof document === "undefined") return "COP";
  return document.documentElement.getAttribute("data-moneda") === "USD" ? "USD" : "COP";
}

export function fijarMoneda(m: Moneda): void {
  document.documentElement.setAttribute("data-moneda", m);
  try {
    localStorage.setItem(CLAVE_MONEDA, m);
  } catch {
    /* navegación privada o almacenamiento bloqueado: vale para esta página */
  }
  window.dispatchEvent(new CustomEvent<Moneda>(EVENTO_MONEDA, { detail: m }));
  const w = window as unknown as { dataLayer?: unknown[] };
  (w.dataLayer ||= []).push({ event: "cambio_moneda", moneda: m });
}

// ── La TRM ────────────────────────────────────────────────────────────────

export type TRM = { valor: number; vigente: string; fuente: string };

const CLAVE_TRM = "rhf-trm";
const VIGENCIA_CACHE_MS = 6 * 3600 * 1000;
let enCurso: Promise<TRM | null> | null = null;

/**
 * La TRM vigente, de /api/trm (el Worker la toma de datos.gov.co y la guarda
 * 6 horas). Una sola petición por página, y 6 horas en sessionStorage. Si no
 * está disponible, devuelve null y la web muestra solo pesos.
 */
export function obtenerTRM(): Promise<TRM | null> {
  try {
    const guardada = JSON.parse(sessionStorage.getItem(CLAVE_TRM) ?? "null") as
      | (TRM & { t: number })
      | null;
    if (guardada && Date.now() - guardada.t < VIGENCIA_CACHE_MS && guardada.valor > 0) {
      return Promise.resolve({ valor: guardada.valor, vigente: guardada.vigente, fuente: guardada.fuente });
    }
  } catch {
    /* sin almacenamiento: se pide */
  }
  enCurso ||= fetch("/api/trm", { headers: { Accept: "application/json" } })
    .then((r) => (r.ok ? r.json() : null))
    .then((j: { ok?: boolean; valor?: number; vigente_desde?: string; fuente?: string } | null) => {
      if (!j?.ok || !j.valor || j.valor < 1000 || j.valor > 20000) return null;
      const trm: TRM = { valor: j.valor, vigente: j.vigente_desde ?? "", fuente: j.fuente ?? "" };
      try {
        sessionStorage.setItem(CLAVE_TRM, JSON.stringify({ ...trm, t: Date.now() }));
      } catch {
        /* sin almacenamiento */
      }
      return trm;
    })
    .catch(() => null)
    .finally(() => {
      enCurso = null;
    });
  return enCurso;
}

/**
 * «US$120.300» (español) o «US$120,300» (inglés). Se redondea a centenas: es
 * una referencia, y una cifra exacta al dólar sugeriría una precisión que la
 * TRM del día no tiene.
 */
export function formatoDolares(usd: number, idioma: "es" | "en" = "es"): string {
  const redondo = Math.round(usd / 100) * 100;
  const sep = idioma === "en" ? "," : ".";
  return "US$" + String(redondo).replace(/\B(?=(\d{3})+(?!\d))/g, sep);
}

/** «$3.349,63» (es) o «COP 3,349.63» (en), para la nota de la TRM. */
export function formatoTRM(valor: number, idioma: "es" | "en" = "es"): string {
  const [ent, dec = "00"] = valor.toFixed(2).split(".");
  return idioma === "en"
    ? `COP ${ent.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${dec}`
    : `$${ent.replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${dec}`;
}
