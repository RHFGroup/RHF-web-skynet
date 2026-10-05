/**
 * Las opciones que conoce el comparador, armadas en el servidor (en el build)
 * desde la capa de datos. Nada se escribe a mano aquí: precio, corte, área,
 * entrega, parqueadero y zonas comunes salen de src/data/proyectos.ts y
 * src/data/inmuebles.ts, con su fuente.
 *
 * Dos grupos, pedido de Rafael del 5-oct-2026 («uno para proyectos y otro
 * para las entregas inmediatas»):
 *  · «planos»: lo que se entrega más adelante (proyectos en lanzamiento o en
 *    construcción y apartamentos en construcción).
 *  · «inmediata»: lo que se puede usar ya (proyectos de entrega inmediata y
 *    apartamentos terminados).
 *
 * Igual que en ficha.ts, lo que decide (las notas del motor) se calcula sobre
 * el dato en español, que es la fuente; lo que se muestra sale del idioma de
 * la página.
 */
import type { Proyecto } from "@/data/proyectos";
import type { Inmueble } from "@/data/inmuebles";
import type { DatosOpcion, Exterior, Parqueadero } from "@/lib/comparar/evaluar";
import { areaDe, precioDe, proyectosEnOrden } from "@/lib/ficha";
import { etiquetaEstado, etiquetaEstadoInmueble, inmuebles, proyectos } from "@/i18n/datos";
import { ruta, type Idioma } from "@/i18n/idioma";

export type Grupo = "planos" | "inmediata";

/** Una opción del comparador, ya en texto y números. */
export type Opcion = {
  slug: string;
  nombre: string;
  tipo: "proyecto" | "inmueble";
  grupo: Grupo;
  href: string;
  /** /simulador?p=slug, en el idioma de la página. */
  simular: string;
  zona: string;
  estado: string;
  /** La ubicación que se publica, o null si la fuente no da la del proyecto. */
  ubicacion: string | null;
  ubicacionFuente: string;
  precio: { desde: number; hasta: number; corte: string; fuente: string } | null;
  /** Unidades disponibles, con el corte del precio. Solo proyectos. */
  unidades: number | null;
  area: { texto: string; etiquetas: string[]; conflicto: boolean } | null;
  /**
   * Precio por m² de la opción base (la más barata), solo si su área es una
   * sola cifra y las fuentes no se contradicen en el área del proyecto.
   */
  precioM2: { valor: number; area: string; etiqueta: string } | null;
  alcobas: string | null;
  banos: string | null;
  exterior: string[];
  parqueadero: string | null;
  /** Lo que lista la fuente, tal cual. */
  amenidades: string[];
  amenidadesFuente: string;
  /** Texto de la entrega: «Por manzana, entre noviembre de 2026…», «Entrega inmediata»… */
  entregaTexto: string;
  rentaCorta: string | null;
  datos: DatosOpcion;
};

/** Las zonas comunes que cuenta el criterio. Lo demás de la lista se muestra pero no suma. */
const ZONA_COMUN =
  /piscina|jacuzzi|lago|solárium|solarium|gimnasio|cancha|golf|cowork|infantil|pet|salón|salon|bbq|club|verde|sender|boulevard|meditación|meditacion|húmeda|humeda|minimarket|restaurante/i;

function zonasComunes(lista: string[] | null): number | null {
  if (lista == null) return null;
  return lista.filter((a) => ZONA_COMUN.test(a)).length;
}

function enteros(texto: string | undefined | null): number[] {
  return (texto?.match(/\d+/g) ?? []).map(Number);
}

/** El mejor exterior propio que nombra la fuente. */
function exteriorDe(textos: string[]): Exterior | null {
  if (textos.length === 0) return null;
  const t = textos.join(" ").toLowerCase();
  if (/lote|patio/.test(t)) return "lote";
  if (/terraza/.test(t)) return "terraza";
  if (/balc/.test(t)) return "balcon";
  return "ninguno";
}

function parqueaderoDe(texto: string | null): Parqueadero | null {
  if (!texto) return null;
  if (/comunal/i.test(texto)) return "comunal";
  if (/privad|exclusiv|por casa/i.test(texto)) return "privado";
  return "sin-precisar";
}

function metros(valor: string): number[] {
  return (valor.match(/\d+(?:,\d+)?(?=\s*(?:m²|m2|–|-))/g) ?? []).map((n) => Number(n.replace(",", ".")));
}

const TXT = {
  es: { parcial: "en las tipologías que lo dicen", inmediata: "Entrega inmediata", terminado: "Terminado", sinFecha: "Sin fecha de entrega publicada", fuenteLista: "Brochure y página del promotor", conjunto: "Sin lista del conjunto" },
  en: { parcial: "in the unit types that state it", inmediata: "Ready to move in", terminado: "Completed", sinFecha: "No published delivery date", fuenteLista: "Developer's brochure and website", conjunto: "No list for the complex" },
} satisfies Record<Idioma, Record<string, string>>;

function deProyecto(p: Proyecto, idioma: Idioma): Opcion {
  const q = proyectos(idioma).getProyecto(p.slug) ?? p;
  const t = TXT[idioma];
  const precio = precioDe(p, idioma);
  const area = areaDe(q, idioma);
  const conflictoArea = p.conflictos.some((c) => /área|area/i.test(c.dato));

  // La opción base: la tipología más barata con precio.
  const conPrecio = p.tipologias.map((tp, i) => ({ tp, i })).filter((x) => x.tp.precio);
  const base = conPrecio.sort((x, y) => x.tp.precio!.desde - y.tp.precio!.desde)[0];
  let precioM2: Opcion["precioM2"] = null;
  if (precio.muestra && base && !conflictoArea) {
    const m = metros(base.tp.area.valor);
    if (m.length === 1 && m[0] > 0) {
      const etiqueta = q.tipologias[base.i]?.area.etiqueta ?? base.tp.area.etiqueta;
      precioM2 = { valor: base.tp.precio!.desde / m[0], area: base.tp.area.valor, etiqueta };
    }
  }

  const alcobas = p.tipologias.flatMap((tp) => enteros(tp.alcobas));
  const todasDicenAlcobas = p.tipologias.every((tp) => tp.alcobas);
  const banos = p.tipologias.flatMap((tp) => enteros(tp.banos));
  const rango = (v: number[]) => (v.length ? (Math.min(...v) === Math.max(...v) ? String(v[0]) : `${Math.min(...v)} – ${Math.max(...v)}`) : null);
  const exterioresEs = p.tipologias.map((tp) => tp.exterior).filter((x): x is string => !!x);
  const exteriores = q.tipologias.map((tp) => tp.exterior).filter((x): x is string => !!x);

  const inmediata = p.estado === "entrega inmediata";
  const conFecha = !inmediata && !!p.precontractual.fechaEntrega;
  const parqueadero = q.precontractual.parqueadero;

  return {
    slug: p.slug,
    nombre: q.nombre,
    tipo: "proyecto",
    grupo: inmediata ? "inmediata" : "planos",
    href: ruta(idioma, `/proyectos/${p.slug}`),
    simular: `${ruta(idioma, "/simulador")}?p=${p.slug}`,
    zona: q.zona,
    estado: etiquetaEstado(p.estado, idioma),
    ubicacion: q.ubicacion,
    ubicacionFuente: q.ubicacionFuente,
    precio:
      precio.muestra && q.precio && precio.corte
        ? { desde: q.precio.desde, hasta: q.precio.hasta, corte: precio.corte, fuente: q.precio.fuente }
        : null,
    unidades: precio.muestra && q.precio ? q.precio.unidadesDisponibles : null,
    area,
    precioM2,
    // Si una tipología no lo dice, la cifra va con su aviso: mostrarla sola
    // sugeriría que vale para todas (la misma regla de la ficha).
    alcobas: rango(alcobas) == null ? null : todasDicenAlcobas ? rango(alcobas) : `${rango(alcobas)} (${t.parcial})`,
    banos: rango(banos) == null ? null : p.tipologias.every((tp) => tp.banos) ? rango(banos) : `${rango(banos)} (${t.parcial})`,
    exterior: [...new Set(exteriores)],
    parqueadero,
    amenidades: q.amenidades,
    amenidadesFuente: t.fuenteLista,
    entregaTexto: inmediata ? t.inmediata : q.precontractual.fechaEntrega ?? t.sinFecha,
    rentaCorta: q.rentaCorta?.fuente ?? null,
    datos: {
      precio: precio.muestra ? precio.desde : null,
      entrega: inmediata ? "inmediata" : conFecha ? "con-fecha" : "sin-fecha",
      rentaCorta: !!p.rentaCorta,
      alcobasMax: alcobas.length ? Math.max(...alcobas) : null,
      exterior: exteriorDe(exterioresEs),
      parqueadero: parqueaderoDe(p.precontractual.parqueadero),
      zonasComunes: p.amenidades.length ? zonasComunes(p.amenidades) : null,
      documentado: {
        precio: precio.muestra,
        ubicacion: p.ubicacion !== null,
        areaSinConflicto: !conflictoArea,
        entrega: inmediata || conFecha,
        parqueadero: !!p.precontractual.parqueadero,
      },
    },
  };
}

function deInmueble(i: Inmueble, idioma: Idioma): Opcion {
  const x = inmuebles(idioma).getInmueble(i.slug) ?? i;
  const t = TXT[idioma];
  const terminado = i.estado === "Terminado";
  const area = x.areas[0];
  const m = area ? metros(area.valor) : [];
  // «1 alcoba + estudio (el estudio puede ser la alcoba 2)»: cuenta la primera cifra.
  const alcobasMax = i.habitacionesTarjeta ? Number(i.habitacionesTarjeta) : enteros(i.habitaciones)[0] ?? null;
  const textoExterior = `${i.linea} ${i.dependencias.texto}`;
  const exteriorEs = exteriorDe([textoExterior]);
  // Lo que se muestra: el trozo de la línea o de las dependencias que nombra el exterior.
  const trozos = `${x.linea} · ${x.dependencias.texto}`.split(/ · |, | y | and /);
  const visto = trozos.find((s) => /balc|terra|lote|patio/i.test(s))?.trim();
  const exterior = exteriorEs && exteriorEs !== "ninguno" && visto ? [visto] : [];

  return {
    slug: i.slug,
    nombre: x.nombre,
    tipo: "inmueble",
    grupo: terminado ? "inmediata" : "planos",
    href: ruta(idioma, `/inmuebles/${i.slug}`),
    simular: `${ruta(idioma, "/simulador")}?p=${i.slug}`,
    zona: x.zona,
    estado: etiquetaEstadoInmueble(i.estado, idioma),
    ubicacion: x.ubicacion,
    ubicacionFuente: x.ubicacionFuente,
    precio: x.precio ? { desde: x.precio.valor, hasta: x.precio.valor, corte: x.precio.corte, fuente: x.precio.fuente } : null,
    unidades: null,
    area: area ? { texto: area.valor, etiquetas: [area.etiqueta], conflicto: false } : null,
    precioM2: x.precio && area && m.length === 1 && m[0] > 0 ? { valor: x.precio.valor / m[0], area: area.valor, etiqueta: area.etiqueta } : null,
    alcobas: x.habitacionesTarjeta ?? x.habitaciones,
    banos: x.banosTarjeta ?? x.banos,
    exterior,
    parqueadero: x.parqueadero,
    amenidades: x.conjunto?.items ?? [],
    amenidadesFuente: x.conjunto?.fuente ?? t.conjunto,
    entregaTexto: terminado ? t.terminado : t.sinFecha,
    rentaCorta: x.rentaCorta?.fuente ?? null,
    datos: {
      precio: i.precio ? i.precio.valor : null,
      entrega: terminado ? "inmediata" : "sin-fecha",
      rentaCorta: !!i.rentaCorta,
      alcobasMax: Number.isFinite(alcobasMax) ? alcobasMax : null,
      exterior: exteriorEs,
      parqueadero: parqueaderoDe(i.parqueadero),
      zonasComunes: zonasComunes(i.conjunto?.items ?? null),
      documentado: {
        precio: i.precio !== null,
        ubicacion: true,
        areaSinConflicto: true,
        entrega: terminado,
        parqueadero: !!i.parqueadero,
      },
    },
  };
}

/** Todas las opciones, en el orden de la cartera: primero los proyectos, después los apartamentos. */
export function opcionesDelComparador(idioma: Idioma): Opcion[] {
  return [
    ...proyectosEnOrden("es").map((p) => deProyecto(p, idioma)),
    ...inmuebles("es").INMUEBLES.map((i) => deInmueble(i, idioma)),
  ];
}
