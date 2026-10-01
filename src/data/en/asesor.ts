/**
 * «QUIÉN TE ASESORA», EN INGLÉS
 *
 * Encima de `src/data/asesor.ts`: `confirmado`, ids, íconos y fotos salen del
 * español; lo propuesto sigue sin salir en producción hasta que Rafael lo
 * confirme, en los dos idiomas. El nombre completo no se traduce.
 *
 * Mismo tono que en español: en afirmativo y en primera persona.
 *
 * Cada traducción se busca por el texto exacto en español; si el español
 * cambia, sale el español nuevo hasta que se traduzca aquí.
 */
import * as es from "@/data/asesor";
import { traductor, type Diccionario } from "@/data/en/traducir";

const TEXTOS: Diccionario = {
  // ── La propuesta de valor (Rafael elige una) ─────────────────────────────
  "Te ayudo a comprar en la Zona Norte con la información completa, antes de separar.":
    "I help you buy in the Zona Norte with complete information, before you reserve.",
  "Comparo proyectos de distintas constructoras para que elijas con los datos en la mano.":
    "I compare projects from different builders so you can choose with the facts in hand.",

  // ── Los tres pilares ─────────────────────────────────────────────────────
  "Comparo por ti": "I compare for you",
  "Proyectos de varias constructoras, lado a lado.": "Projects from several builders, side by side.",
  "Respaldo jurídico": "Legal support",
  "Nuestro estudio jurídico revisa antes de que firmes.": "A review by our own legal team, before you sign.",
  "Datos con fuente": "Sourced data",
  "Cada precio, con su fuente y su fecha de corte.": "Every price, with its source and its as-of date.",
};

const t = traductor(TEXTOS);

export const modulo: typeof import("@/data/asesor") = {
  ...es,
  PROPUESTA_VALOR: es.PROPUESTA_VALOR.map((p) => ({ ...p, texto: t(p.texto) })),
  PILARES: es.PILARES.map((p) => ({ ...p, titulo: t(p.titulo), texto: t(p.texto) })),
  // Hoy vacíos. Si vuelven, su texto pasa por el mismo diccionario.
  PERFILES: es.PERFILES.map((p) => ({ ...p, titulo: t(p.titulo), texto: t(p.texto), mensaje: t(p.mensaje) })),
  EQUIPO: es.EQUIPO.map((m) => {
    const x = { ...m, rol: t(m.rol) };
    if (m.texto !== undefined) x.texto = t(m.texto);
    return x;
  }),
};
