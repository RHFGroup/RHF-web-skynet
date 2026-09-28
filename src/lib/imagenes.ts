/**
 * Las variantes livianas de las fotos grandes (las genera
 * scripts/imagenes-webp.py y las anota en src/data/imagenes.json):
 *
 *  - WebP de 640 y 1080 px para las tarjetas de la cartera, que miden unos
 *    350 px en el teléfono y 380 en el escritorio;
 *  - AVIF al tamaño original para la portada, que sí necesita la foto grande;
 *  - el recorte del teléfono (28-sep-2026) para la portada de proyectos y
 *    apartamentos: el centro de la foto en vertical, en AVIF. Es lo único que
 *    se ve de la foto en un teléfono vertical, con la misma nitidez.
 *
 * El JPG sigue siendo el `src` de cada imagen: es el respaldo para el
 * navegador que no lea esos formatos. Si una foto no tiene variantes (porque
 * es chica o porque todavía no se corrió el script), todo sigue como antes.
 */
import MAPA from "@/data/imagenes.json";

type Variantes = {
  ancho: number;
  alto: number;
  webp640?: string;
  webp1080?: string;
  avif?: string;
  movilAvif?: string;
};
const VARIANTES = MAPA as Record<string, Variantes>;

/** El srcset de una foto de tarjeta: WebP de 640 y 1080 px, y el JPG como el más grande. */
export function srcSetTarjeta(src: string): string | undefined {
  const v = VARIANTES[src];
  if (!v) return undefined;
  const partes: string[] = [];
  if (v.webp640) partes.push(`${v.webp640} 640w`);
  if (v.webp1080) partes.push(`${v.webp1080} 1080w`);
  if (partes.length === 0) return undefined;
  partes.push(`${src} ${v.ancho}w`);
  return partes.join(", ");
}

/** Cuánto mide una tarjeta en pantalla, para que el navegador elija bien. */
export const SIZES_TARJETA = "(max-width: 640px) 86vw, (max-width: 1080px) 46vw, 400px";

/** El AVIF de una foto de la portada, o null si no lo tiene. */
export function avifDe(src: string): string | null {
  return VARIANTES[src]?.avif ?? null;
}

/** El recorte vertical (AVIF) de una foto de portada para el teléfono, o null. */
export function movilDe(src: string): string | null {
  return VARIANTES[src]?.movilAvif ?? null;
}

/** Cuándo se usa el recorte del teléfono: pantalla angosta y vertical. */
export const MEDIA_MOVIL = "(max-width: 700px) and (orientation: portrait)";
