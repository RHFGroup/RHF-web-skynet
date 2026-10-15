/**
 * El módulo `src/data/mercado.ts` en el idioma de la página. Va en su propio
 * archivo para que un componente de cliente cargue solo los datos que usa.
 */
import type { Idioma } from "@/i18n/idioma";
import * as es from "@/data/mercado";
import { modulo as en } from "@/data/en/mercado";

export function mercado(idioma: Idioma): typeof es {
  return idioma === "en" ? en : es;
}
