/**
 * La cartera que conoce el simulador, armada en el servidor (en el build)
 * desde la capa de datos. Nada se escribe a mano aquí: precio, corte, estado
 * y renta corta salen de src/data/proyectos.ts y src/data/inmuebles.ts.
 *
 *  · El precio entra solo si se puede publicar (`precioDe`, Circular 004). Sin
 *    él, el inmueble va a la lista «Consultar» y no se evalúa.
 *  · Los meses a la entrega: 0 si la entrega es inmediata o el inmueble está
 *    terminado. Ningún proyecto en obra publica hoy una fecha que se pueda
 *    contar en meses, así que llegan en null y la página usa el supuesto de
 *    la configuración, marcado.
 */
import { precioDe, proyectosEnOrden } from "@/lib/ficha";
import { inmuebles } from "@/i18n/datos";
import { etiquetaEstado, etiquetaEstadoInmueble } from "@/i18n/etiquetas";
import { ruta, type Idioma } from "@/i18n/idioma";
import type { ItemSimulador } from "@/components/simulador/tipos";

export function itemsDelSimulador(idioma: Idioma): ItemSimulador[] {
  // Los nombres en español, para el aviso que recibe Rafael (como ContactForm).
  const nombresEs = new Map<string, string>([
    ...proyectosEnOrden("es").map((p) => [p.slug, p.nombre] as [string, string]),
    ...inmuebles("es").INMUEBLES.map((i) => [i.slug, i.nombre] as [string, string]),
  ]);
  const proyectos: ItemSimulador[] = proyectosEnOrden(idioma).map((p) => {
    const precio = precioDe(p, idioma);
    return {
      slug: p.slug,
      nombre: p.nombre,
      nombreEs: nombresEs.get(p.slug) ?? p.nombre,
      tipo: "proyecto",
      href: ruta(idioma, `/proyectos/${p.slug}`),
      zona: p.zona,
      estado: etiquetaEstado(p.estado, idioma),
      precio: precio.muestra ? precio.desde : null,
      corte: precio.corte,
      meses: p.estado === "entrega inmediata" ? 0 : null,
      rentaCorta: p.rentaCorta?.fuente ?? null,
    };
  });
  const { INMUEBLES } = inmuebles(idioma);
  const disponibles: ItemSimulador[] = INMUEBLES.map((i) => ({
    slug: i.slug,
    nombre: i.nombre,
    nombreEs: nombresEs.get(i.slug) ?? i.nombre,
    tipo: "inmueble",
    href: ruta(idioma, `/inmuebles/${i.slug}`),
    zona: i.zona,
    estado: etiquetaEstadoInmueble(i.estado, idioma),
    precio: i.precio ? i.precio.valor : null,
    corte: i.precio ? i.precio.corte : null,
    meses: i.estado === "Terminado" ? 0 : null,
    rentaCorta: i.rentaCorta?.fuente ?? null,
  }));
  return [...proyectos, ...disponibles];
}
