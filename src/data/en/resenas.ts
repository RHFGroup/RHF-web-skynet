/**
 * LAS RESEÑAS DE CLIENTES, EN INGLÉS
 *
 * Una reseña son las palabras de la persona: en inglés va la traducción
 * revisada, marcada como traducida del español. Sin traducción revisada, la
 * reseña sale en su idioma original, tal como la escribió (Ley 1480: una
 * reseña retocada es publicidad engañosa).
 *
 * Hoy `RESENAS` está vacío. Para traducir una: su texto exacto en español
 * como clave en `TRADUCCIONES`, con el texto en inglés y, si la reseña dice
 * sobre qué es, `sobre` en inglés.
 */
import * as es from "@/data/resenas";

const TRADUCCIONES: Record<string, { texto: string; sobre?: string }> = {};

const MARCA = " (Translated from Spanish.)";

export const modulo: typeof import("@/data/resenas") = {
  ...es,
  RESENAS: es.RESENAS.map((r) => {
    const tr = Object.prototype.hasOwnProperty.call(TRADUCCIONES, r.texto) ? TRADUCCIONES[r.texto] : undefined;
    if (!tr) return r;
    const x = { ...r, texto: tr.texto + MARCA };
    if (r.sobre !== undefined && tr.sobre !== undefined) x.sobre = tr.sobre;
    return x;
  }),
};
