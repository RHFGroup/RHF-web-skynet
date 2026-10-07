/**
 * De qué canal llega cada lead (7-oct-2026): lo que necesita el tablero para
 * responder cada lunes si los anuncios de Meta y de YouTube se convierten en
 * oportunidades de verdad.
 *
 * El sitio guarda, solo en la pestaña de quien navega (sessionStorage, sin
 * cookies), por dónde entró la primera vez: las UTM, el identificador del
 * clic del anuncio si lo hay (gclid, gbraid, wbraid, fbclid), la página de
 * entrada y el sitio que lo trajo (solo el dominio). Lo manda junto con la
 * consulta (src/lib/atribucion.ts). El Worker lo limpia con `limpiarAtribucion`
 * y deduce el canal con `canalDe`.
 *
 * Va aparte y sin importar nada, para usarlo desde el Worker y desde el CRM y
 * para probarlo con `node --test` (crm/test/).
 */

export type Atribucion = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  gclid?: string;
  gbraid?: string;
  wbraid?: string;
  fbclid?: string;
  /** La primera página que vio: solo la ruta, sin dominio ni parámetros. */
  landing?: string;
  /** El dominio del sitio que lo trajo, sin la ruta (por ejemplo «l.instagram.com»). */
  referente?: string;
  /** Cuándo entró por primera vez (ISO 8601). */
  t?: string;
};

const CLAVES_UTM = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;
const CLAVES_CLIC = ["gclid", "gbraid", "wbraid", "fbclid"] as const;

function recortar(v: unknown, max: number): string | undefined {
  if (typeof v !== "string") return undefined;
  // Sin caracteres de control ni espacios de más; nunca más largo que el tope.
  const s = v.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, max);
  return s || undefined;
}

/**
 * Lo que llega del navegador, limpio: solo las claves conocidas, recortadas.
 * Devuelve null si no queda nada (por ejemplo, un formulario viejo en caché).
 */
export function limpiarAtribucion(v: unknown): Atribucion | null {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  const o = v as Record<string, unknown>;
  const a: Atribucion = {};
  for (const k of CLAVES_UTM) {
    const x = recortar(o[k], 120);
    if (x) a[k] = x;
  }
  for (const k of CLAVES_CLIC) {
    // Los identificadores de clic son largos pero de caracteres simples.
    const x = recortar(o[k], 300);
    if (x && /^[A-Za-z0-9._~-]+$/.test(x)) a[k] = x;
  }
  const landing = recortar(o.landing, 200);
  if (landing && landing.startsWith("/") && !landing.startsWith("//")) a.landing = landing.split(/[?#]/)[0];
  const referente = recortar(o.referente, 120);
  if (referente && /^[a-z0-9.-]+$/i.test(referente)) a.referente = referente.toLowerCase();
  const t = recortar(o.t, 40);
  if (t && !Number.isNaN(Date.parse(t))) a.t = new Date(t).toISOString();
  // La marca de tiempo sola no dice nada del canal.
  const util = Object.keys(a).filter((k) => k !== "t");
  return util.length || a.t ? a : null;
}

/** Los canales que entiende el CRM, con el grupo en que los suma el tablero. */
export const CANALES: Record<string, { nombre: string; grupo: Grupo }> = {
  meta_ads: { nombre: "Meta Ads", grupo: "meta_ads" },
  google_ads: { nombre: "Google Ads", grupo: "google_ads" },
  youtube_ads: { nombre: "YouTube Ads", grupo: "youtube_ads" },
  otros_ads: { nombre: "Otros anuncios", grupo: "otros" },
  buscadores: { nombre: "Google y buscadores", grupo: "organico" },
  perfil_google: { nombre: "Perfil de Google", grupo: "organico" },
  redes: { nombre: "Redes sociales", grupo: "organico" },
  youtube: { nombre: "YouTube", grupo: "organico" },
  correo: { nombre: "Correo o boletín", grupo: "organico" },
  referencia: { nombre: "Otro sitio web", grupo: "organico" },
  directo: { nombre: "Directo", grupo: "directo" },
  whatsapp_ia: { nombre: "WhatsApp (IA)", grupo: "ia" },
  chat_ia: { nombre: "Chat de la web (IA)", grupo: "ia" },
  // Los que se cargan a mano (FUENTES_MANUALES de crm/src/fuentes.ts).
  instagram: { nombre: "Instagram", grupo: "organico" },
  facebook: { nombre: "Facebook", grupo: "organico" },
  feria: { nombre: "Feria o evento", grupo: "otros" },
  referido: { nombre: "Referido", grupo: "otros" },
  llamada: { nombre: "Llamada", grupo: "directo" },
  whatsapp_directo: { nombre: "WhatsApp directo", grupo: "directo" },
  otro: { nombre: "Otro", grupo: "otros" },
  sin_dato: { nombre: "Sin dato", grupo: "otros" },
};

export type Grupo = "meta_ads" | "google_ads" | "youtube_ads" | "organico" | "ia" | "directo" | "otros";

/**
 * Los grupos del tablero, en el orden fijo de sus colores (crm.css,
 * --serie-1 a --serie-7): el color sigue al grupo, nunca a su posición en una
 * lista filtrada.
 */
export const GRUPOS: { id: Grupo; nombre: string; anuncios: boolean }[] = [
  { id: "meta_ads", nombre: "Meta Ads", anuncios: true },
  { id: "google_ads", nombre: "Google Ads", anuncios: true },
  { id: "youtube_ads", nombre: "YouTube Ads", anuncios: true },
  { id: "organico", nombre: "Orgánico", anuncios: false },
  { id: "ia", nombre: "WhatsApp y chat (IA)", anuncios: false },
  { id: "directo", nombre: "Directo", anuncios: false },
  { id: "otros", nombre: "Otros", anuncios: false },
];

/** Los canales de anuncios a los que se les carga la inversión de la semana. */
export const CANALES_INVERSION: { id: string; nombre: string }[] = [
  { id: "meta_ads", nombre: "Meta Ads (Facebook e Instagram)" },
  { id: "google_ads", nombre: "Google Ads (búsqueda)" },
  { id: "youtube_ads", nombre: "YouTube Ads" },
  { id: "otros_ads", nombre: "Otros anuncios" },
];

export function nombreCanal(canal: string | null | undefined): string {
  return CANALES[canal ?? "sin_dato"]?.nombre ?? CANALES.sin_dato.nombre;
}

export function grupoDe(canal: string | null | undefined): Grupo {
  return CANALES[canal ?? "sin_dato"]?.grupo ?? "otros";
}

const META = /^(facebook|fb|instagram|ig|meta|messenger|whatsapp_ads|audience[_-]?network)$/;
const PAGO = /^(cpc|ppc|paid|paid[_ -]?social|paidsocial|social[_ -]?paid|ads?|cpm|cpv|cpa|display|video|pago|pagado|pauta)$/;

/**
 * El canal de una consulta, por su `origen` (la ruta de la página, o
 * «agente:<canal>») y su atribución. Sin atribución (formularios de antes del
 * 7-oct-2026, o un navegador que la bloquea), «sin_dato»: no se adivina.
 */
export function canalDe(a: Atribucion | null, origen?: string | null): string {
  const o = (origen ?? "").trim().toLowerCase();
  if (o.startsWith("agente:whatsapp")) return "whatsapp_ia";
  if (o.startsWith("agente:")) return "chat_ia";
  if (!a) return "sin_dato";

  const fuente = (a.utm_source ?? "").toLowerCase().trim();
  const medio = (a.utm_medium ?? "").toLowerCase().trim();
  const esYoutube = fuente.includes("youtube") || fuente === "yt";
  const esMeta = META.test(fuente) || fuente.includes("facebook") || fuente.includes("instagram");
  const esGoogle = !esYoutube && (fuente.includes("google") || fuente === "adwords");

  // El clic de Google Ads trae su identificador aunque falten las UTM.
  if (a.gclid || a.gbraid || a.wbraid) return esYoutube ? "youtube_ads" : "google_ads";
  if (PAGO.test(medio)) {
    if (esMeta) return "meta_ads";
    if (esYoutube) return "youtube_ads";
    if (esGoogle) return "google_ads";
    return "otros_ads";
  }
  if (fuente === "gmb" || fuente === "gbp" || fuente.includes("business") || medio === "gbp" || medio === "local") {
    return "perfil_google";
  }
  if (fuente) {
    if (medio === "email" || medio === "correo" || fuente.includes("boletin") || fuente.includes("newsletter")) return "correo";
    if (esMeta || /tiktok|linkedin|twitter|^x$|threads|pinterest/.test(fuente)) return "redes";
    if (esYoutube) return "youtube";
    if (esGoogle || /bing|duckduckgo|yahoo/.test(fuente)) return "buscadores";
    return "referencia";
  }
  // fbclid sin UTM: un clic desde Facebook o Instagram. Puede ser un anuncio
  // sin etiquetar; se cuenta como red social y el informe pide etiquetar los
  // anuncios con utm_medium=paid.
  if (a.fbclid) return "redes";
  const r = a.referente ?? "";
  if (r) {
    if (/(^|\.)(mail\.google\.com|outlook\.(live|office)\.com|mail\.yahoo\.com)$/.test(r)) return "correo";
    if (/(^|\.)(google|bing|duckduckgo|yahoo|ecosia|yandex)\./.test(r) || r.startsWith("search.")) return "buscadores";
    if (/(^|\.)(facebook|instagram|fb|t|twitter|x|linkedin|tiktok|pinterest|threads)\.(com|me|co|net)$/.test(r) || r === "lnkd.in") {
      return "redes";
    }
    if (/(^|\.)(youtube\.com|youtu\.be)$/.test(r)) return "youtube";
    return "referencia";
  }
  return "directo";
}

/** «Meta Ads · campaña doral-oct» para la ficha y el aviso: el canal y la campaña. */
export function resumenAtribucion(canal: string | null | undefined, a: Atribucion | null): string {
  const partes = [nombreCanal(canal)];
  if (a?.utm_campaign) partes.push(`campaña ${a.utm_campaign}`);
  if (a?.utm_content) partes.push(`anuncio ${a.utm_content}`);
  return partes.join(" · ");
}

/** La atribución guardada en la base (JSON), leída sin romper si viene mal. */
export function leerAtribucion(json: string | null | undefined): Atribucion | null {
  if (!json) return null;
  try {
    return limpiarAtribucion(JSON.parse(json));
  } catch {
    return null;
  }
}
