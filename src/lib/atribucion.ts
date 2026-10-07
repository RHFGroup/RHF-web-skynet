/**
 * Por dónde llegó quien nos escribe (7-oct-2026, tablero del CRM): lo que
 * hace falta para responder cada lunes si los anuncios de Meta y de YouTube
 * se convierten en consultas de verdad.
 *
 * Qué se guarda y dónde:
 *  · Solo en la pestaña de quien navega (sessionStorage): sin cookies, sin
 *    nada que sobreviva al cerrar la pestaña y sin nada que salga del
 *    navegador por su cuenta.
 *  · Las etiquetas del enlace por el que entró (utm_source, utm_medium,
 *    utm_campaign, utm_content, utm_term), el identificador del clic que
 *    Google o Meta le agregan a sus anuncios (gclid, gbraid, wbraid, fbclid),
 *    la primera página que vio (solo la ruta) y el dominio del sitio que lo
 *    trajo (sin la ruta).
 *  · Viaja únicamente junto con un formulario que la persona envía con su
 *    autorización (ContactForm, FormularioGuia, el simulador). El Worker lo
 *    limpia (`limpiarAtribucion`, crm/src/canales.ts) y deduce el canal.
 *
 * La primera entrada de la pestaña es la que cuenta («primer toque»). La
 * única excepción: si esa primera entrada no traía etiquetas y después la
 * persona entra por un enlace que sí las trae (un anuncio), manda el anuncio.
 *
 * Nada de esto va a GA4 ni al píxel: es de la consulta, no de la analítica.
 */

const CLAVE = "rhf-atribucion";

const PARAMETROS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "gclid",
  "gbraid",
  "wbraid",
  "fbclid",
] as const;

type Parametro = (typeof PARAMETROS)[number];

export type Atribucion = Partial<Record<Parametro, string>> & {
  landing?: string;
  referente?: string;
  t?: string;
};

/**
 * Solo si el navegador no deja guardar en sessionStorage: vale para esta carga
 * de la página (y sus navegaciones internas). Si guardar funciona, queda en
 * null, para que nunca haya dos versiones distintas.
 */
let enMemoria: Atribucion | null = null;

function leerGuardada(): Atribucion | null {
  try {
    const v = sessionStorage.getItem(CLAVE);
    if (v) return JSON.parse(v) as Atribucion;
  } catch {
    /* navegación privada, almacenamiento bloqueado o un valor que no se entiende */
  }
  return enMemoria;
}

function guardar(a: Atribucion): void {
  try {
    sessionStorage.setItem(CLAVE, JSON.stringify(a));
    enMemoria = null;
  } catch {
    enMemoria = a;
  }
}

const conEtiquetas = (a: Atribucion | null) => !!a && PARAMETROS.some((k) => a[k]);

/** Lo que dice la dirección de esta carga de la página. */
function deEstaEntrada(): Atribucion {
  const u = new URL(window.location.href);
  const a: Atribucion = {};
  for (const k of PARAMETROS) {
    const v = u.searchParams.get(k);
    if (v) a[k] = v.slice(0, k.startsWith("utm_") ? 120 : 300);
  }
  a.landing = u.pathname.slice(0, 200);
  try {
    if (document.referrer) {
      const r = new URL(document.referrer);
      // Solo el dominio, y solo si es otro sitio: la navegación interna no es un canal.
      if (r.hostname && r.hostname !== u.hostname) a.referente = r.hostname.slice(0, 120);
    }
  } catch {
    /* un referente que no se entiende no se guarda */
  }
  a.t = new Date().toISOString();
  return a;
}

/**
 * Se llama una vez por cada carga completa de la página (CapturaAtribucion,
 * en el layout raíz). Las navegaciones internas de Next no la repiten.
 */
export function capturarAtribucion(): void {
  if (typeof window === "undefined") return;
  const ahora = deEstaEntrada();
  const antes = leerGuardada();
  if (antes && (conEtiquetas(antes) || !conEtiquetas(ahora))) return;
  guardar(ahora);
}

/** Lo que viaja con el formulario, o null si no hay nada (el Worker lo acepta igual). */
export function atribucionParaEnviar(): Atribucion | null {
  if (typeof window === "undefined") return null;
  return leerGuardada();
}
