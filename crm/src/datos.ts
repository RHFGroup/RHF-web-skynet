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
  /**
   * La fase del embudo del tablero (7-oct-2026): 0 Lead entrante,
   * 1 Contactado, 2 Presentación, 3 Cotización o reservación, 4 Cierre.
   * Nutrir, Perdido y Descartado no tienen: quedan en la más alta a la que
   * llegó la oportunidad.
   */
  fase?: Fase;
  /**
   * Cuántos días es normal pasar en esta etapa. Pasado eso, sin una próxima
   * acción programada, el tablero la muestra como estancada.
   */
  metaDias?: number;
};

export const ETAPAS: Record<Tipo, Etapa[]> = {
  compra: [
    { id: "nuevo", nombre: "Nuevo", tono: "nuevo", fase: 0, metaDias: 1 },
    { id: "contactado", nombre: "Contactado", tono: "avance", fase: 1, metaDias: 3 },
    { id: "calificado", nombre: "Calificado", tono: "avance", fase: 1, metaDias: 5 },
    { id: "recorrido_agendado", nombre: "Recorrido agendado", tono: "caliente", fase: 2, metaDias: 7 },
    { id: "recorrido_hecho", nombre: "Recorrido hecho", tono: "caliente", fase: 2, metaDias: 3 },
    { id: "propuesta", nombre: "Propuesta enviada", tono: "caliente", fase: 3, metaDias: 7 },
    { id: "separo", nombre: "Separó", tono: "gano", cierra: true, fase: 4 },
    { id: "nutrir", nombre: "Nutrir", tono: "pausa" },
    { id: "perdido", nombre: "Perdido", tono: "perdio", cierra: true, pideMotivo: true },
  ],
  venta: [
    { id: "nuevo", nombre: "Nuevo", tono: "nuevo", fase: 0, metaDias: 1 },
    { id: "contactado", nombre: "Contactado", tono: "avance", fase: 1, metaDias: 3 },
    { id: "visita", nombre: "Visita al inmueble", tono: "avance", fase: 2, metaDias: 7 },
    { id: "consignado", nombre: "Consignado", tono: "caliente", fase: 3, metaDias: 14 },
    { id: "publicado", nombre: "Publicado", tono: "caliente", fase: 3, metaDias: 45 },
    { id: "negociacion", nombre: "En negociación", tono: "caliente", fase: 3, metaDias: 10 },
    { id: "vendido", nombre: "Vendido", tono: "gano", cierra: true, fase: 4 },
    { id: "descartado", nombre: "Descartado", tono: "perdio", cierra: true, pideMotivo: true },
  ],
};

/** Las cinco fases del embudo del tablero, como las pidió Rafael (7-oct-2026). */
export type Fase = 0 | 1 | 2 | 3 | 4;
export const FASES: { id: Fase; nombre: string; columna: string | null }[] = [
  { id: 0, nombre: "Lead entrante", columna: null },
  { id: 1, nombre: "Contactado", columna: "fase_contactado_en" },
  { id: 2, nombre: "Presentación o Zoom", columna: "fase_presentacion_en" },
  { id: 3, nombre: "Cotización o reservación", columna: "fase_cotizacion_en" },
  { id: 4, nombre: "Cierre", columna: "fase_cierre_en" },
];

/**
 * Las columnas de fase que hay que marcar al llegar a una etapa: la suya y
 * las anteriores (quien separó también pasó por la presentación, aunque no
 * se haya registrado). Nunca se borran al retroceder.
 */
export function columnasDeFase(tipo: Tipo, etapa: string): string[] {
  const f = etapaDe(tipo, etapa)?.fase;
  if (f === undefined) return [];
  return FASES.filter((x) => x.columna && x.id <= f).map((x) => x.columna as string);
}

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
