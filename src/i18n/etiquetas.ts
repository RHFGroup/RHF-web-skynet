/**
 * Las etiquetas de los campos que son claves de lógica (el estado de un
 * proyecto, su tipo de inmueble, el estado de una obra…), en el idioma de la
 * página. El dato no se traduce porque filtra, ordena o arma una clase; lo que
 * cambia es cómo se muestra.
 *
 * Este archivo no importa datos, solo tipos: los componentes de cliente lo
 * pueden usar sin cargar los módulos de datos (29-sep-2026).
 */
import type { Idioma } from "@/i18n/idioma";
import type { Proyecto } from "@/data/proyectos";
import type { Inmueble } from "@/data/inmuebles";
import type { Estado } from "@/data/zona";

const ESTADO_EN: Record<Proyecto["estado"], string> = {
  "en lanzamiento": "Launching",
  "en construcción": "Under construction",
  "entrega inmediata": "Ready to move in",
};

/**
 * El estado de un proyecto (o de una ficha) para mostrar. En español, el
 * valor tal cual («en lanzamiento»); en inglés, «Launching», «Under
 * construction», «Ready to move in».
 */
export function etiquetaEstado(estado: Proyecto["estado"], idioma: Idioma): string {
  return idioma === "en" ? (ESTADO_EN[estado] ?? estado) : estado;
}

const TIPO_EN: Record<NonNullable<Proyecto["tipoInmueble"]>, string> = {
  apartamentos: "apartments",
  casas: "houses",
  apartaestudios: "studio apartments",
};

/**
 * Qué se vende, en plural y en minúscula, como va en los títulos («Doral
 * Country, apartments in Cartagena's Zona Norte»). En español, el valor tal
 * cual.
 */
export function etiquetaTipo(tipo: NonNullable<Proyecto["tipoInmueble"]>, idioma: Idioma): string {
  return idioma === "en" ? (TIPO_EN[tipo] ?? tipo) : tipo;
}

const ESTADO_INMUEBLE_EN: Record<Inmueble["estado"], string> = {
  Terminado: "Completed",
  "En construcción": "Under construction",
};

/** El estado de un inmueble disponible: «Terminado» / «Completed». */
export function etiquetaEstadoInmueble(estado: Inmueble["estado"], idioma: Idioma): string {
  return idioma === "en" ? (ESTADO_INMUEBLE_EN[estado] ?? estado) : estado;
}

const ESTADO_OBRA_EN: Record<Estado, string> = {
  Entregado: "Completed",
  "En obra": "Under construction",
  "En estudio": "Under study",
};

/**
 * El estado de una obra o un hecho de la Zona Norte (zona.ts): «Entregado» /
 * «Completed». El valor en español sigue armando la clase CSS.
 */
export function etiquetaEstadoObra(estado: Estado, idioma: Idioma): string {
  return idioma === "en" ? (ESTADO_OBRA_EN[estado] ?? estado) : estado;
}

/**
 * ¿El precio de una ficha es un «desde»? En español empieza con «desde», en
 * inglés con «from». La referencia en dólares lo repite (ReferenciaDolares.tsx
 * lee `data-desde`).
 */
export function precioEsDesde(precio: string): boolean {
  return /^(desde|from) /.test(precio);
}
