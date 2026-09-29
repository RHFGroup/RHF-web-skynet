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
 * Aquí viven también las etiquetas de los campos que son claves de lógica
 * (el estado de un proyecto, su tipo de inmueble, el estado de una obra…): el
 * dato no se traduce porque filtra, ordena o arma una clase; lo que cambia con
 * el idioma es cómo se muestra.
 *
 * Ojo en los componentes de cliente: este archivo trae los veinte módulos de
 * datos. Si un componente de cliente solo necesita uno, que reciba los datos
 * por props desde el servidor.
 */
import type { Idioma } from "@/i18n/idioma";
import * as proyectosEs from "@/data/proyectos";
import * as inmueblesEs from "@/data/inmuebles";
import * as noticiasEs from "@/data/noticias";
import * as zonaEs from "@/data/zona";
import * as procesoEs from "@/data/proceso";
import * as asesorEs from "@/data/asesor";
import * as desarrolladoresEs from "@/data/desarrolladores";
import * as resenasEs from "@/data/resenas";
import * as reelsEs from "@/data/reels";
import * as redesEs from "@/data/redes";
import { modulo as proyectosEn } from "@/data/en/proyectos";
import { modulo as inmueblesEn } from "@/data/en/inmuebles";
import { modulo as noticiasEn } from "@/data/en/noticias";
import { modulo as zonaEn } from "@/data/en/zona";
import { modulo as procesoEn } from "@/data/en/proceso";
import { modulo as asesorEn } from "@/data/en/asesor";
import { modulo as desarrolladoresEn } from "@/data/en/desarrolladores";
import { modulo as resenasEn } from "@/data/en/resenas";
import { modulo as reelsEn } from "@/data/en/reels";
import { modulo as redesEn } from "@/data/en/redes";
import type { Proyecto } from "@/data/proyectos";
import type { Inmueble } from "@/data/inmuebles";
import type { Estado } from "@/data/zona";

export function proyectos(idioma: Idioma): typeof proyectosEs {
  return idioma === "en" ? proyectosEn : proyectosEs;
}

export function inmuebles(idioma: Idioma): typeof inmueblesEs {
  return idioma === "en" ? inmueblesEn : inmueblesEs;
}

export function noticias(idioma: Idioma): typeof noticiasEs {
  return idioma === "en" ? noticiasEn : noticiasEs;
}

export function zona(idioma: Idioma): typeof zonaEs {
  return idioma === "en" ? zonaEn : zonaEs;
}

export function proceso(idioma: Idioma): typeof procesoEs {
  return idioma === "en" ? procesoEn : procesoEs;
}

export function asesor(idioma: Idioma): typeof asesorEs {
  return idioma === "en" ? asesorEn : asesorEs;
}

export function desarrolladores(idioma: Idioma): typeof desarrolladoresEs {
  return idioma === "en" ? desarrolladoresEn : desarrolladoresEs;
}

export function resenas(idioma: Idioma): typeof resenasEs {
  return idioma === "en" ? resenasEn : resenasEs;
}

export function reels(idioma: Idioma): typeof reelsEs {
  return idioma === "en" ? reelsEn : reelsEs;
}

export function redes(idioma: Idioma): typeof redesEs {
  return idioma === "en" ? redesEn : redesEs;
}

// ── Etiquetas de las claves de lógica ─────────────────────────────────────

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
 * Una amenidad en español, para elegir su ícono: `IconoAmenidad` busca
 * palabras en español («piscina», «gimnasio»…). Recibe el texto en cualquiera
 * de los dos idiomas: «Pool and sun deck» → «Piscina y solárium». Sirve para
 * las amenidades de los proyectos y para lo que tiene el conjunto de un
 * inmueble.
 *
 *   <IconoAmenidad nombre={amenidadEnEspanol(a)} />
 */
export function amenidadEnEspanol(texto: string): string {
  return AMENIDAD_ES.get(texto) ?? texto;
}

// Los módulos en inglés copian los arreglos del español en el mismo orden:
// la amenidad j del proyecto i es la misma en los dos.
const AMENIDAD_ES = new Map<string, string>();
proyectosEs.PROYECTOS.forEach((p, i) =>
  p.amenidades.forEach((a, j) => {
    const en = proyectosEn.PROYECTOS[i]?.amenidades[j];
    if (en !== undefined) AMENIDAD_ES.set(en, a);
  }),
);
inmueblesEs.INMUEBLES.forEach((x, i) =>
  x.conjunto?.items.forEach((a, j) => {
    const en = inmueblesEn.INMUEBLES[i]?.conjunto?.items[j];
    if (en !== undefined) AMENIDAD_ES.set(en, a);
  }),
);

/**
 * ¿El precio de una ficha es un «desde»? En español empieza con «desde», en
 * inglés con «from». La referencia en dólares lo repite (ReferenciaDolares.tsx
 * lee `data-desde`).
 */
export function precioEsDesde(precio: string): boolean {
  return /^(desde|from) /.test(precio);
}
