/**
 * Los datos del sitio en el idioma de la página (29-sep-2026, sitio en inglés).
 *
 * Cada función devuelve el módulo de `src/data/` (español) o su versión de
 * `src/data/en/` (inglés), con los mismos nombres:
 *
 *   const { NOTICIAS, TEMAS, fechaNoticia } = noticias(idioma);
 *
 * Los tipos se siguen importando de `src/data/*.ts`: son los mismos en los dos
 * idiomas.
 *
 * Este archivo junta los veinte módulos, para el servidor. Un componente de
 * cliente importa solo el que usa, desde `@/i18n/modulos/<módulo>`, y las
 * etiquetas desde `@/i18n/etiquetas`: así no carga en el navegador los datos
 * que no muestra.
 */
import type { Idioma } from "@/i18n/idioma";
import * as proyectosEs from "@/data/proyectos";
import * as inmueblesEs from "@/data/inmuebles";
import { modulo as proyectosEn } from "@/data/en/proyectos";
import { modulo as inmueblesEn } from "@/data/en/inmuebles";

export { proyectos } from "@/i18n/modulos/proyectos";
export { inmuebles } from "@/i18n/modulos/inmuebles";
export { noticias } from "@/i18n/modulos/noticias";
export { zona } from "@/i18n/modulos/zona";
export { proceso } from "@/i18n/modulos/proceso";
export { asesor } from "@/i18n/modulos/asesor";
export { desarrolladores } from "@/i18n/modulos/desarrolladores";
export { resenas } from "@/i18n/modulos/resenas";
export { reels } from "@/i18n/modulos/reels";
export { redes } from "@/i18n/modulos/redes";
export {
  etiquetaEstado,
  etiquetaTipo,
  etiquetaEstadoInmueble,
  etiquetaEstadoObra,
  precioEsDesde,
} from "@/i18n/etiquetas";

/**
 * Una amenidad en español, para elegir su ícono: `IconoAmenidad` busca
 * palabras en español («piscina», «gimnasio»…). Recibe el texto en cualquiera
 * de los dos idiomas: «Pool and sun deck» → «Piscina y solárium». Sirve para
 * las amenidades de los proyectos y para lo que tiene el conjunto de un
 * inmueble.
 *
 *   <IconoAmenidad nombre={amenidadEnEspanol(a)} />
 */
export function amenidadEnEspanol(texto: string): string {
  return mapaAmenidades().get(texto) ?? texto;
}

// Los módulos en inglés copian los arreglos del español en el mismo orden:
// la amenidad j del proyecto i es la misma en los dos. El mapa se arma la
// primera vez que se pide, no al cargar el archivo.
let AMENIDAD_ES: Map<string, string> | null = null;
function mapaAmenidades(): Map<string, string> {
  if (AMENIDAD_ES) return AMENIDAD_ES;
  const mapa = new Map<string, string>();
  proyectosEs.PROYECTOS.forEach((p, i) =>
    p.amenidades.forEach((a, j) => {
      const en = proyectosEn.PROYECTOS[i]?.amenidades[j];
      if (en !== undefined) mapa.set(en, a);
    }),
  );
  inmueblesEs.INMUEBLES.forEach((x, i) =>
    x.conjunto?.items.forEach((a, j) => {
      const en = inmueblesEn.INMUEBLES[i]?.conjunto?.items[j];
      if (en !== undefined) mapa.set(en, a);
    }),
  );
  AMENIDAD_ES = mapa;
  return mapa;
}

/**
 * Los nombres de los proyectos y de los inmuebles en el idioma de la página,
 * por slug, para el selector del formulario (ContactForm). En español no hace
 * falta: el formulario ya tiene los nombres de los datos en español.
 */
export function nombresDeCartera(idioma: Idioma): Record<string, string> | undefined {
  if (idioma === "es") return undefined;
  return Object.fromEntries([
    ...proyectosEn.PROYECTOS.map((p) => [p.slug, p.nombre] as const),
    ...inmueblesEn.INMUEBLES.map((i) => [i.slug, i.nombre] as const),
  ]);
}
