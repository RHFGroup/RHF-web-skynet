/**
 * El valor de referencia de una oportunidad, para sumar el embudo y el
 * «pipeline» del tablero (7-oct-2026). En orden:
 *  1. el que Rafael anotó en la ficha (`valor_estimado`);
 *  2. el punto medio del rango de presupuesto que respondió la persona;
 *  3. el punto medio del rango de precios del proyecto que le interesa, o el
 *     precio del inmueble, según la cartera publicada (src/data/).
 * Si no hay nada de eso, no suma: nunca se inventa un valor.
 */
import { PROYECTOS } from "@/data/proyectos";
import { INMUEBLES } from "@/data/inmuebles";
import { valorDeRango } from "@/data/calificacion";

const PRECIOS = new Map<string, number>();
for (const p of PROYECTOS) if (p.precio) PRECIOS.set(p.slug, Math.round((p.precio.desde + p.precio.hasta) / 2));
for (const i of INMUEBLES) if (i.precio) PRECIOS.set(i.slug, i.precio.valor);

export type FuenteValor = "anotado" | "rango" | "cartera" | null;

export function valorDe(o: {
  valor_estimado?: number | null;
  rango_presupuesto?: string | null;
  interes?: string | null;
}): { valor: number | null; fuente: FuenteValor } {
  if (o.valor_estimado && o.valor_estimado > 0) return { valor: o.valor_estimado, fuente: "anotado" };
  const r = valorDeRango(o.rango_presupuesto);
  if (r) return { valor: r, fuente: "rango" };
  const c = o.interes ? PRECIOS.get(o.interes) : undefined;
  if (c) return { valor: c, fuente: "cartera" };
  return { valor: null, fuente: null };
}
