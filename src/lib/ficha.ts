/**
 * Lo que se muestra de un proyecto, ya armado y en texto.
 *
 * Todo sale de `src/data/proyectos.ts`: aquí solo se ordena. Se arma en el
 * servidor (en el build) y llega a los componentes de cliente como texto, así
 * que la cifra que ve el navegador es exactamente la del HTML.
 *
 * Las reglas de la capa de datos siguen mandando:
 *  · el precio sale solo si `puedePublicarPrecio` y siempre con su corte;
 *  · el área va con la etiqueta literal de la fuente;
 *  · si las fuentes no coinciden en el área, la ficha lo dice;
 *  · un dato que la fuente no da no se muestra, ni se reemplaza por relleno.
 */
import {
  PROYECTOS,
  puedePublicarPrecio,
  rangoPrecio,
  type Proyecto,
} from "@/data/proyectos";

export type Ficha = {
  slug: string;
  nombre: string;
  zona: string;
  estado: Proyecto["estado"];
  tipoInmueble: Proyecto["tipoInmueble"] | null;
  href: string;
  foto: { src: string; alt: string; credito: string } | null;
  /** «desde $311.500.000» o «Consultar». */
  precio: string;
  muestraPrecio: boolean;
  /** Fecha de corte del precio; null si el precio no se publica. */
  corte: string | null;
  /** Para filtrar por precio. null si el precio no es publicable. */
  precioDesde: number | null;
  /** «1 – 3», o null si alguna tipología no lo dice. */
  alcobas: string | null;
  banos: string | null;
  area: {
    /** «42 – 70 m²» */
    texto: string;
    /** Las etiquetas literales de la fuente, sin repetir. */
    etiquetas: string[];
    /** Las fuentes del promotor publican cifras distintas de área. */
    conflicto: boolean;
  } | null;
  /** Línea de producto: «Apartamentos en torres · 6 torres · ascensor». */
  linea: string | null;
  /** La frase del reverso: destacada, la de la cartera o el resumen. */
  frase: string;
  nuevo: boolean;
  revisionJuridica: boolean;
  entrega: string | null;
  /** Dos o tres datos clave para el reverso de la tarjeta. */
  destacados: { titulo: string; texto: string }[];
};

/** Números de un texto de área: «33 – 35 m²» → [33, 35]. */
function metros(valor: string): number[] {
  const encontrados = valor.match(/\d+(?:,\d+)?(?=\s*(?:m²|m2|–|-))/g) ?? [];
  return encontrados.map((n) => Number(n.replace(",", ".")));
}

/** Números enteros de un texto corto: «2 o 3» → [2, 3]. */
function enteros(valor: string): number[] {
  return (valor.match(/\d+/g) ?? []).map(Number);
}

function rango(valores: number[], sufijo = ""): string | null {
  if (valores.length === 0) return null;
  const min = Math.min(...valores);
  const max = Math.max(...valores);
  const f = (n: number) => String(n).replace(".", ",");
  return (min === max ? f(min) : `${f(min)} – ${f(max)}`) + sufijo;
}

/**
 * Habitaciones o baños de todo el proyecto, solo si TODAS las tipologías lo
 * dicen. Si una calla, mostrar el dato de las demás sugeriría que vale para
 * todas.
 */
function deTodas(p: Proyecto, campo: "alcobas" | "banos"): string | null {
  const valores = p.tipologias.map((t) => t[campo]);
  if (valores.some((v) => !v)) return null;
  return rango(valores.flatMap((v) => enteros(v!)));
}

export function areaDe(p: Proyecto): Ficha["area"] {
  const numeros = p.tipologias.flatMap((t) => metros(t.area.valor));
  const texto = rango(numeros, " m²");
  if (!texto) return null;
  // Cuando la fuente rotula con la cifra misma («39 m2»), la etiqueta no dice
  // nada que el número no diga: se omite para no repetir.
  const etiquetas = [
    ...new Set(
      p.tipologias
        .map((t) => t.area.etiqueta)
        .filter((e) => !/^\d+([.,]\d+)?\s*m[²2]$/i.test(e.trim())),
    ),
  ];
  const conflicto = p.conflictos.some((c) => /área|area/i.test(c.dato));
  return { texto, etiquetas, conflicto };
}

export function precioDe(p: Proyecto) {
  const muestra = puedePublicarPrecio(p) && p.precio !== null;
  return {
    texto: muestra && p.precio ? rangoPrecio(p.precio.desde, p.precio.hasta) : "Consultar",
    muestra,
    corte: muestra && p.precio ? p.precio.corte : null,
    desde: muestra && p.precio ? p.precio.desde : null,
  };
}

export function fichaDe(p: Proyecto): Ficha {
  const precio = precioDe(p);
  const destacados = p.datos
    // La disponibilidad no va suelta: sin su fecha de corte es urgencia sin
    // respaldo. Y habitaciones o baños ya están en la cara frontal.
    .filter((d) => !/disponib|alcoba|baño/i.test(d.label))
    .slice(0, 3)
    .map((d) => ({ titulo: d.label, texto: d.valor }));

  return {
    slug: p.slug,
    nombre: p.nombre,
    zona: p.zona,
    estado: p.estado,
    tipoInmueble: p.tipoInmueble ?? null,
    href: `/proyectos/${p.slug}`,
    foto: p.fotos
      ? { src: p.fotos.tarjeta.src, alt: p.fotos.tarjeta.alt, credito: p.fotos.tarjeta.credito }
      : null,
    precio: precio.texto,
    muestraPrecio: precio.muestra,
    corte: precio.corte,
    precioDesde: precio.desde,
    alcobas: deTodas(p, "alcobas"),
    banos: deTodas(p, "banos"),
    area: areaDe(p),
    linea: p.presentacion?.linea ?? null,
    frase: p.fraseDestacada ?? p.presentacion?.frase ?? p.resumen,
    nuevo: p.presentacion?.nuevo ?? false,
    revisionJuridica: p.revisionJuridica === true,
    entrega: p.precontractual.fechaEntrega,
    destacados,
  };
}

/** El orden en que la cartera presenta los proyectos. */
export const ORDEN_CARTERA = [
  "doral-country",
  "doral-suite",
  "doral-west",
  "acacias-campestre",
  "blue-garden",
];

/** Todos los proyectos en el orden de la cartera; los nuevos, al final. */
export function proyectosEnOrden(): Proyecto[] {
  const conocidos = ORDEN_CARTERA.map((s) => PROYECTOS.find((p) => p.slug === s)).filter(
    (p): p is Proyecto => p !== undefined,
  );
  const nuevos = PROYECTOS.filter((p) => !ORDEN_CARTERA.includes(p.slug));
  return [...conocidos, ...nuevos];
}

/** «en la Zona Norte de Cartagena», para títulos y descripciones. */
export function dondeQueda(p: Proyecto): string {
  switch (p.zona) {
    case "Zona Norte":
      return "en la Zona Norte de Cartagena";
    case "Vía Turbaco":
      return "en la vía a Turbaco";
    case "Cartagena":
      return "en Cartagena";
    default:
      return `en ${p.zona}`;
  }
}
