/**
 * LAS REDES, EN INGLÉS
 *
 * Nada que traducir: el nombre de la red, el usuario y el enlace son los
 * mismos en los dos idiomas. El módulo existe para que `redes(idioma)` tenga
 * su par, como los demás.
 */
import * as es from "@/data/redes";

export const modulo: typeof import("@/data/redes") = {
  ...es,
  REDES: es.REDES.map((r) => ({ ...r })),
};
