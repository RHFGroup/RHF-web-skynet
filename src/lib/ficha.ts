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
  type Foto,
  type Proyecto,
} from "@/data/proyectos";
import { LUGARES } from "@/data/zona";
import { precioInmueble, type Inmueble } from "@/data/inmuebles";
import type { PinProyecto } from "@/components/MapaIlustrado";

export type Ficha = {
  slug: string;
  nombre: string;
  zona: string;
  estado: Proyecto["estado"];
  tipoInmueble: Proyecto["tipoInmueble"] | null;
  href: string;
  foto: { src: string; alt: string; credito: string } | null;
  /**
   * Las fotos que rotan en la tarjeta: la de la tarjeta primero y después las
   * horizontales de la galería, en 1200 px cuando existe esa versión. Hasta 4.
   */
  fotos: { src: string; alt: string; credito: string }[];
  /** La imagen a pantalla completa de la portada de la home. */
  escaparate: {
    src: string;
    src1200: string;
    alt: string;
    credito: string;
    enfoque: string;
    /** Miniatura para elegirla en la portada. */
    mini: string;
    /** Ancho real de `src`, para el `srcset`. */
    ancho: number;
  } | null;
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
  /**
   * El estado en texto cuando no es uno de proyecto nuevo: los inmuebles
   * disponibles dicen «Terminado» o «En construcción».
   */
  estadoTexto?: string;
  /** El texto del enlace a la página propia: «Ver proyecto» o «Ver inmueble». */
  verTexto?: string;
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

/** Fotos para la tarjeta que rota: horizontales, livianas y sin repetir. */
function fotosDeTarjeta(p: Proyecto): Ficha["fotos"] {
  if (!p.fotos) return [];
  const vistas = new Set<string>();
  const salida: Ficha["fotos"] = [];
  const candidatas = [p.fotos.tarjeta, ...p.fotos.galeria.filter((f) => f.ancho >= f.alto)];
  for (const f of candidatas) {
    const src = f.src1200 ?? f.src;
    if (vistas.has(src)) continue;
    vistas.add(src);
    salida.push({ src, alt: f.alt, credito: f.credito });
    if (salida.length === 4) break;
  }
  return salida;
}

/** La imagen de la portada: la del escaparate o, si falta, la primera de la galería. */
function escaparateDe(p: Proyecto): Ficha["escaparate"] {
  const e: (Foto & { enfoque?: string; mini?: string }) | undefined =
    p.fotos?.escaparate ?? p.fotos?.galeria[0];
  if (!e) return null;
  return {
    src: e.src,
    src1200: e.src1200 ?? e.src,
    alt: e.alt,
    credito: e.credito,
    enfoque: e.enfoque ?? "50% 50%",
    mini: e.mini ?? e.src1200 ?? e.src,
    ancho: e.ancho,
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
    fotos: fotosDeTarjeta(p),
    escaparate: escaparateDe(p),
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

/**
 * La ficha de un inmueble disponible, para la misma tarjeta que gira. El
 * precio sale solo si está escrito, con su corte; el área, con la etiqueta
 * literal de su documento (la primera de la lista).
 */
export function fichaDeInmueble(i: Inmueble): Ficha {
  const precio = precioInmueble(i);
  const area = i.areas[0];
  const destacados = [
    { titulo: "Piso", texto: i.piso },
    ...(i.areas[1] ? [{ titulo: i.areas[1].etiqueta, texto: i.areas[1].valor }] : []),
    ...(i.parqueadero ? [{ titulo: "Parqueadero", texto: i.parqueadero }] : []),
  ].slice(0, 3);
  return {
    slug: i.slug,
    nombre: i.nombre,
    zona: i.zona,
    estado: i.estado === "En construcción" ? "en construcción" : "entrega inmediata",
    estadoTexto: i.estado,
    tipoInmueble: "apartamentos",
    href: `/inmuebles/${i.slug}`,
    foto: i.fotos[0] ? { src: i.fotos[0].tarjeta, alt: i.fotos[0].alt, credito: i.fotos[0].credito } : null,
    fotos: i.fotos.slice(0, 4).map((f) => ({ src: f.tarjeta, alt: f.alt, credito: f.credito })),
    escaparate: null,
    precio: precio.texto,
    muestraPrecio: i.precio !== null,
    corte: precio.corte,
    precioDesde: i.precio?.valor ?? null,
    alcobas: i.habitacionesTarjeta,
    banos: i.banosTarjeta,
    area: area ? { texto: area.valor, etiquetas: [area.etiqueta], conflicto: false } : null,
    linea: i.linea,
    frase: i.frase,
    nuevo: false,
    revisionJuridica: false,
    entrega: null,
    destacados,
    verTexto: "Ver inmueble",
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

// ── El pin de un proyecto en el mapa ilustrado de la Zona Norte ────────────

/**
 * Los tiempos de `proyectos.ts` se llevan a lugares del mapa: el aeropuerto,
 * el hospital de Serena del Mar y la playa con coordenada más cercana. El
 * Centro no tiene punto en el encuadre del corredor, así que su tiempo no
 * dibuja línea (sigue en la página del proyecto).
 */
const LUGAR_DE_DESTINO: Partial<Record<NonNullable<Proyecto["tiempos"]>[number]["destino"], string>> = {
  aeropuerto: "aeropuerto",
  hospital: "serena-del-mar",
};
const PLAYAS = ["la-boquilla", "manzanillo", "punta-canoa"];

/**
 * El pin del proyecto, SOLO si tiene coordenada verificada en proyectos.ts.
 * Sin coordenada devuelve null y el proyecto no se marca: sigue en la fila de
 * proyectos debajo del mapa.
 */
export function pinDelMapa(p: Proyecto): PinProyecto | null {
  if (!p.coordenada) return null;
  const { lat, lon, fuente } = p.coordenada;
  const f = fichaDe(p);
  const playaCercana = LUGARES.filter((l) => PLAYAS.includes(l.id) && l.coordenada)
    .map((l) => ({ id: l.id, d: Math.hypot(l.coordenada!.lat - lat, l.coordenada!.lon - lon) }))
    .sort((a, b) => a.d - b.d)[0]?.id;
  const tiempos = (p.tiempos ?? []).flatMap((t) => {
    const lugar = t.destino === "playa" ? playaCercana : LUGAR_DE_DESTINO[t.destino];
    return lugar ? [{ lugar, minutos: t.minutos, fuente: t.fuente }] : [];
  });
  return {
    slug: p.slug,
    nombre: p.nombre,
    lat,
    lon,
    fuente,
    precio: f.precio,
    corte: f.corte,
    linea: f.linea,
    foto: f.foto?.src ?? null,
    tiempos,
  };
}
