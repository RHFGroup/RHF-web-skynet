/**
 * Las etapas, las fuentes y las listas fijas del CRM (Prompt 3, §2.3 y §2.4).
 *
 * En esta primera versión van en el código. Editarlas desde «Ajustes» es de la
 * siguiente.
 */
import { PROYECTOS } from "@/data/proyectos";
import { INMUEBLES } from "@/data/inmuebles";

export { FUENTES, FUENTES_MANUALES, fuenteDeOrigen } from "./fuentes";

export type Tipo = "compra" | "venta";

export type Etapa = {
  id: string;
  nombre: string;
  /** Separó, Perdido, Vendido o Descartado: la oportunidad terminó. */
  cierra?: boolean;
  /** Pide motivo al pasar a esta etapa. */
  pideMotivo?: boolean;
  /** Color de la ficha de la etapa (clase CSS `etapa--…`). */
  tono: "nuevo" | "avance" | "caliente" | "gano" | "pausa" | "perdio";
};

export const ETAPAS: Record<Tipo, Etapa[]> = {
  compra: [
    { id: "nuevo", nombre: "Nuevo", tono: "nuevo" },
    { id: "contactado", nombre: "Contactado", tono: "avance" },
    { id: "calificado", nombre: "Calificado", tono: "avance" },
    { id: "recorrido_agendado", nombre: "Recorrido agendado", tono: "caliente" },
    { id: "recorrido_hecho", nombre: "Recorrido hecho", tono: "caliente" },
    { id: "propuesta", nombre: "Propuesta enviada", tono: "caliente" },
    { id: "separo", nombre: "Separó", tono: "gano", cierra: true },
    { id: "nutrir", nombre: "Nutrir", tono: "pausa" },
    { id: "perdido", nombre: "Perdido", tono: "perdio", cierra: true, pideMotivo: true },
  ],
  venta: [
    { id: "nuevo", nombre: "Nuevo", tono: "nuevo" },
    { id: "contactado", nombre: "Contactado", tono: "avance" },
    { id: "visita", nombre: "Visita al inmueble", tono: "avance" },
    { id: "consignado", nombre: "Consignado", tono: "caliente" },
    { id: "publicado", nombre: "Publicado", tono: "caliente" },
    { id: "negociacion", nombre: "En negociación", tono: "caliente" },
    { id: "vendido", nombre: "Vendido", tono: "gano", cierra: true },
    { id: "descartado", nombre: "Descartado", tono: "perdio", cierra: true, pideMotivo: true },
  ],
};

export function etapaDe(tipo: Tipo, id: string): Etapa | undefined {
  return ETAPAS[tipo].find((e) => e.id === id);
}

export const MOTIVOS_PERDIDA = ["Presupuesto", "Compró con otro", "No responde", "No califica", "Otro"];

export const PUNTAJES = [
  { id: "A", nombre: "A", ayuda: "Compra en 3 meses o menos, con forma de pago definida" },
  { id: "B", nombre: "B", ayuda: "Compra en 3 a 12 meses, o antes sin forma de pago definida" },
  { id: "C", nombre: "C", ayuda: "Compra en más de 12 meses" },
  { id: "sin", nombre: "Sin calificar", ayuda: "Todavía no se sabe" },
] as const;

export const PROPOSITOS: Record<string, string> = {
  vivir: "Vivir",
  renta_corta: "Renta corta",
  renta_tradicional: "Renta tradicional",
  patrimonio: "Patrimonio",
  retiro: "Retiro",
};

/** Cómo se obtuvo la autorización en un alta manual (Prompt 3, §2.7). */
export const CANALES_AUTORIZACION: Record<string, string> = {
  formato_feria: "Formato firmado en feria o evento",
  whatsapp: "Mensaje de WhatsApp",
  correo: "Correo electrónico",
  otro: "Otro",
};

/** Los proyectos y los inmuebles del sitio, de la misma fuente que usa la web. */
export const CATALOGO: { slug: string; nombre: string }[] = [
  ...PROYECTOS.map((p) => ({ slug: p.slug, nombre: p.nombre })),
  ...INMUEBLES.map((i) => ({ slug: i.slug, nombre: i.nombre })),
];

/** El nombre de un proyecto o inmueble por su slug; si no está, el texto tal cual. */
export function nombreDeInteres(v: string | null | undefined): string {
  if (!v) return "";
  return CATALOGO.find((c) => c.slug === v)?.nombre ?? v;
}

/** El único usuario por ahora (decisión de Rafael, 1-oct-2026). */
export const USUARIO = "rafael";
