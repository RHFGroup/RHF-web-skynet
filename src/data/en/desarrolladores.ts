/**
 * LAS EMPRESAS DETRÁS DE LA CARTERA, EN INGLÉS
 *
 * Encima de `src/data/desarrolladores.ts`: nombres, logos y proyectos salen
 * del español. Solo se traduce el papel de cada empresa.
 */
import * as es from "@/data/desarrolladores";
import { traductor, type Diccionario } from "@/data/en/traducir";

const TEXTOS: Diccionario = {
  "Comercializa": "Sales and marketing",
  "Desarrolla": "Developer",
  "Gerencia y construcción": "Project management and construction",
};

const t = traductor(TEXTOS);

export const modulo: typeof import("@/data/desarrolladores") = {
  ...es,
  DESARROLLADORES: es.DESARROLLADORES.map((d) => ({ ...d, papel: t(d.papel) })),
};
