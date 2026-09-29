/**
 * El idioma de cada página y el camino entre las dos versiones del sitio
 * (29-sep-2026, decisión de Rafael: «todo el sitio en inglés»).
 *
 * El español sigue en la raíz, con sus rutas de siempre. El inglés vive bajo
 * /en, con rutas en inglés. En el código las rutas se escriben en español y se
 * pasan por `ruta(idioma, …)`: así un enlace nunca queda apuntando a la
 * versión equivocada.
 *
 * Reglas que no cambian con el idioma (ver docs/i18n.md):
 *  · el precio oficial es en pesos colombianos (Ley 1480, art. 26); el inglés
 *    muestra la referencia en dólares por defecto, siempre como referencia;
 *  · la fuente y la fecha de corte de cada dato van igual que en español;
 *  · las páginas legales en inglés son una traducción de cortesía: prevalece
 *    la versión en español.
 */
export type Idioma = "es" | "en";

export const IDIOMAS: Idioma[] = ["es", "en"];

/** Rutas fijas: español → inglés. Las dinámicas van en `ruta()`. */
const FIJAS: Record<string, string> = {
  "/": "/en",
  "/vender": "/en/sell",
  "/asesor": "/en/advisor",
  "/inteligencia-de-mercado": "/en/market-intelligence",
  "/privacidad": "/en/privacy",
  "/terminos": "/en/terms",
};

const FIJAS_INVERSAS: Record<string, string> = Object.fromEntries(
  Object.entries(FIJAS).map(([es, en]) => [en, es]),
);

/** Las rutas con un slug: el slug es el mismo en los dos idiomas. */
const DINAMICAS: { es: string; en: string }[] = [
  { es: "/proyectos/", en: "/en/projects/" },
  { es: "/inmuebles/", en: "/en/properties/" },
];

function separar(href: string): { camino: string; resto: string } {
  const i = href.search(/[?#]/);
  return i === -1 ? { camino: href, resto: "" } : { camino: href.slice(0, i), resto: href.slice(i) };
}

/**
 * La ruta de una página en el idioma pedido, a partir de su ruta en español.
 *   ruta("en", "/vender")               → "/en/sell"
 *   ruta("en", "/#proyectos")            → "/en#proyectos"
 *   ruta("en", "/proyectos/doral-west")  → "/en/projects/doral-west"
 *   ruta("es", x)                        → x
 * Lo que no es una ruta interna (https://, mailto:, #ancla, /archivo.pdf…)
 * sale igual.
 */
export function ruta(idioma: Idioma, rutaEs: string): string {
  if (idioma === "es" || !rutaEs.startsWith("/")) return rutaEs;
  const { camino, resto } = separar(rutaEs);
  if (camino in FIJAS) return FIJAS[camino] + resto;
  for (const d of DINAMICAS) {
    if (camino.startsWith(d.es)) return d.en + camino.slice(d.es.length) + resto;
  }
  return rutaEs;
}

/** El idioma de una ruta: todo lo que está bajo /en es inglés. */
export function idiomaDeRuta(pathname: string): Idioma {
  return pathname === "/en" || pathname.startsWith("/en/") ? "en" : "es";
}

/** La ruta en español de una página, desde cualquiera de sus dos versiones. */
export function rutaEnEspanol(pathname: string): string {
  const { camino, resto } = separar(pathname);
  const limpio = camino.length > 1 ? camino.replace(/\/+$/, "") : camino;
  if (idiomaDeRuta(limpio) === "es") return limpio + resto;
  if (limpio in FIJAS_INVERSAS) return FIJAS_INVERSAS[limpio] + resto;
  for (const d of DINAMICAS) {
    if (limpio.startsWith(d.en)) return d.es + limpio.slice(d.en.length) + resto;
  }
  return "/" + resto;
}

/** Las dos versiones de la misma página, para el selector de idioma. */
export function equivalentes(pathname: string): Record<Idioma, string> {
  const es = rutaEnEspanol(pathname);
  return { es, en: ruta("en", es) };
}

export const SITIO = "https://rhfliving.com";

/**
 * Los enlaces alternos de una página para los buscadores (hreflang), a partir
 * de su ruta en español. Van en `metadata.alternates` de las dos versiones.
 */
export function alternos(rutaEs: string, idioma: Idioma): {
  canonical: string;
  languages: Record<string, string>;
} {
  const es = `${SITIO}${rutaEs === "/" ? "" : rutaEs}` || SITIO;
  const en = `${SITIO}${ruta("en", rutaEs)}`;
  return {
    canonical: idioma === "en" ? en : es,
    languages: { es: es, en: en, "x-default": es },
  };
}

const MESES: Record<Idioma, string[]> = {
  es: ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
};

/** «25 de junio de 2026» / «June 25, 2026», desde una fecha ISO (AAAA-MM-DD). */
export function fechaLarga(iso: string, idioma: Idioma): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return iso;
  const [, a, mes, d] = m;
  const nombre = MESES[idioma][Number(mes) - 1];
  return idioma === "en" ? `${nombre} ${Number(d)}, ${a}` : `${Number(d)} de ${nombre} de ${a}`;
}

/** «septiembre de 2026» / «September 2026». */
export function mesYAno(iso: string, idioma: Idioma): string {
  const m = iso.match(/^(\d{4})-(\d{2})/);
  if (!m) return iso;
  const nombre = MESES[idioma][Number(m[2]) - 1];
  return idioma === "en" ? `${nombre} ${m[1]}` : `${nombre} de ${m[1]}`;
}
