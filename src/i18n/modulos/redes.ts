/**
 * El módulo `src/data/redes.ts` en el idioma de la página. Va en su propio
 * archivo para que un componente de cliente cargue solo los datos que usa
 * (src/i18n/datos.ts los junta todos, para el servidor).
 */
import type { Idioma } from "@/i18n/idioma";
import * as es from "@/data/redes";
import { modulo as en } from "@/data/en/redes";

export function redes(idioma: Idioma): typeof es {
  return idioma === "en" ? en : es;
}
