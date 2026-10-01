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
 *
 * En inglés (29-sep-2026, sitio en inglés): cada función recibe `idioma`, "es"
 * por defecto. El texto sale del módulo de ese idioma (src/i18n/datos.ts); lo
 * que decide —qué dato va al reverso, las cifras del área, la zona del
 * filtro— se calcula sobre el proyecto en español, que es la fuente. Llegue el
 * proyecto en español o en inglés, la ficha sale en el idioma pedido. Con
 * "es", la salida es la de siempre, carácter por carácter.
 */
import type { Foto, Proyecto } from "@/data/proyectos";
import type { Inmueble } from "@/data/inmuebles";
import type { PinProyecto } from "@/components/MapaIlustrado";
import { etiquetaEstadoInmueble, inmuebles, proyectos, zona } from "@/i18n/datos";
import { ruta, type Idioma } from "@/i18n/idioma";

export type Ficha = {
  slug: string;
  nombre: string;
  zona: string;
  /**
   * De dónde sale la tarjeta: un proyecto de la cartera o un apartamento
   * disponible. Desde el 25-sep-2026 los dos van en la misma cartera, con un
   * filtro para verlos por separado.
   */
  origen: "proyecto" | "apartamento";
  /**
   * La zona para el filtro: «Zona Norte», «Cartagena», «Vía Turbaco»,
   * «Atlántico». Es la misma en los dos idiomas: es la clave del filtro.
   */
  zonaFiltro: string;
  estado: Proyecto["estado"];
  tipoInmueble: Proyecto["tipoInmueble"] | null;
  /** La ruta de la página propia, ya en el idioma de la ficha (/en/projects/…). */
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
  /**
   * «desde $311.500.000» o «Consultar». En inglés, «from COP 311,500,000» o
   * «Price on request».
   */
  precio: string;
  muestraPrecio: boolean;
  /**
   * Fecha de corte del precio; null si el precio no se publica. Solo la fecha,
   * en el idioma de la ficha: «25 de junio de 2026» / «June 25, 2026». El
   * «corte» o el «as of» los pone el componente.
   */
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
   * disponibles dicen «Terminado» o «En construcción» («Completed», «Under
   * construction»).
   */
  estadoTexto?: string;
  /** El texto del enlace a la página propia: «Ver proyecto» o «Ver inmueble». */
  verTexto?: string;
};

/** Los textos que arma la ficha. El resto lo traen los datos, ya traducidos. */
const TEXTOS = {
  es: { consultar: "Consultar", piso: "Piso", parqueadero: "Parqueadero", verInmueble: "Ver inmueble" },
  en: { consultar: "Price on request", piso: "Floor", parqueadero: "Parking", verInmueble: "View property" },
} satisfies Record<Idioma, Record<string, string>>;

/**
 * El idioma, a prueba de `.map(fichaDe)`: `map` pasa el índice como segundo
 * argumento, y un número nunca debe sacar una ficha en inglés ni una ruta /en.
 */
function cual(idioma: Idioma | undefined): Idioma {
  return idioma === "en" ? "en" : "es";
}

/** El mismo proyecto en inglés (por su slug). En español, el que llega, tal cual. */
function enIdioma(p: Proyecto, idioma: Idioma): Proyecto {
  return idioma === "en" ? (proyectos("en").getProyecto(p.slug) ?? p) : p;
}

/** El proyecto en español, que es la fuente de la lógica. */
function enEspanol(p: Proyecto): Proyecto {
  return proyectos("es").getProyecto(p.slug) ?? p;
}

/** Números de un texto de área: «33 – 35 m²» → [33, 35]. */
function metros(valor: string): number[] {
  const encontrados = valor.match(/\d+(?:,\d+)?(?=\s*(?:m²|m2|–|-))/g) ?? [];
  return encontrados.map((n) => Number(n.replace(",", ".")));
}

/** Números enteros de un texto corto: «2 o 3» → [2, 3]. */
function enteros(valor: string): number[] {
  return (valor.match(/\d+/g) ?? []).map(Number);
}

function rango(valores: number[], sufijo = "", idioma: Idioma = "es"): string | null {
  if (valores.length === 0) return null;
  const min = Math.min(...valores);
  const max = Math.max(...valores);
  // En inglés el decimal va con punto.
  const f = (n: number) => (idioma === "en" ? String(n) : String(n).replace(".", ","));
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

export function areaDe(p: Proyecto, idioma: Idioma = "es"): Ficha["area"] {
  const lang = cual(idioma);
  const q = enIdioma(p, lang);
  // Las cifras y el conflicto, del español (la fuente); las etiquetas, del
  // idioma pedido.
  const base = lang === "en" ? enEspanol(p) : p;
  const numeros = base.tipologias.flatMap((t) => metros(t.area.valor));
  const texto = rango(numeros, " m²", lang);
  if (!texto) return null;
  // Cuando la fuente rotula con la cifra misma («39 m2»), la etiqueta no dice
  // nada que el número no diga: se omite para no repetir.
  const etiquetas = [
    ...new Set(
      q.tipologias
        .map((t) => t.area.etiqueta)
        .filter((e) => !/^\d+([.,]\d+)?\s*m[²2]$/i.test(e.trim())),
    ),
  ];
  const conflicto = base.conflictos.some((c) => /área|area/i.test(c.dato));
  return { texto, etiquetas, conflicto };
}

export function precioDe(p: Proyecto, idioma: Idioma = "es") {
  const lang = cual(idioma);
  const q = enIdioma(p, lang);
  const { puedePublicarPrecio, rangoPrecio } = proyectos(lang);
  const muestra = puedePublicarPrecio(q) && q.precio !== null;
  return {
    texto: muestra && q.precio ? rangoPrecio(q.precio.desde, q.precio.hasta) : TEXTOS[lang].consultar,
    muestra,
    corte: muestra && q.precio ? q.precio.corte : null,
    desde: muestra && q.precio ? q.precio.desde : null,
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

export function fichaDe(p: Proyecto, idioma: Idioma = "es"): Ficha {
  const lang = cual(idioma);
  const q = enIdioma(p, lang);
  const base = lang === "en" ? enEspanol(p) : p;
  const precio = precioDe(q, lang);
  const destacados = base.datos
    .map((d, i) => ({ d, i }))
    // La disponibilidad no va suelta: sin su fecha de corte es urgencia sin
    // respaldo. Y habitaciones o baños ya están en la cara frontal. El filtro
    // lee los rótulos en español; el texto sale del idioma pedido, en la
    // misma posición.
    .filter(({ d }) => !/disponib|alcoba|baño/i.test(d.label))
    .slice(0, 3)
    .map(({ d, i }) => {
      const x = q.datos[i] ?? d;
      return { titulo: x.label, texto: x.valor };
    });

  return {
    slug: q.slug,
    nombre: q.nombre,
    zona: q.zona,
    origen: "proyecto",
    zonaFiltro: base.zona,
    estado: base.estado,
    tipoInmueble: base.tipoInmueble ?? null,
    href: ruta(lang, `/proyectos/${q.slug}`),
    foto: q.fotos
      ? { src: q.fotos.tarjeta.src, alt: q.fotos.tarjeta.alt, credito: q.fotos.tarjeta.credito }
      : null,
    fotos: fotosDeTarjeta(q),
    escaparate: escaparateDe(q),
    precio: precio.texto,
    muestraPrecio: precio.muestra,
    corte: precio.corte,
    precioDesde: precio.desde,
    alcobas: deTodas(base, "alcobas"),
    banos: deTodas(base, "banos"),
    area: areaDe(q, lang),
    linea: q.presentacion?.linea ?? null,
    frase: q.fraseDestacada ?? q.presentacion?.frase ?? q.resumen,
    nuevo: q.presentacion?.nuevo ?? false,
    revisionJuridica: q.revisionJuridica === true,
    entrega: q.precontractual.fechaEntrega,
    destacados,
  };
}

/** El mismo inmueble en inglés (por su slug). En español, el que llega, tal cual. */
function inmuebleEnIdioma(i: Inmueble, idioma: Idioma): Inmueble {
  return idioma === "en" ? (inmuebles("en").getInmueble(i.slug) ?? i) : i;
}

/**
 * La ficha de un inmueble disponible, para la misma tarjeta que gira. El
 * precio sale solo si está escrito, con su corte; el área, con la etiqueta
 * literal de su documento (la primera de la lista).
 */
export function fichaDeInmueble(i: Inmueble, idioma: Idioma = "es"): Ficha {
  const lang = cual(idioma);
  const t = TEXTOS[lang];
  const x = inmuebleEnIdioma(i, lang);
  // La zona del filtro y el estado, del español: son claves.
  const base = lang === "en" ? (inmuebles("es").getInmueble(i.slug) ?? i) : i;
  const precio = inmuebles(lang).precioInmueble(x);
  const area = x.areas[0];
  const destacados = [
    { titulo: t.piso, texto: x.piso },
    ...(x.areas[1] ? [{ titulo: x.areas[1].etiqueta, texto: x.areas[1].valor }] : []),
    ...(x.parqueadero ? [{ titulo: t.parqueadero, texto: x.parqueadero }] : []),
  ].slice(0, 3);
  return {
    slug: x.slug,
    nombre: x.nombre,
    zona: x.zona,
    origen: "apartamento",
    // «Serena del Mar · Zona Norte» filtra con la Zona Norte; Agua Marina, con el Atlántico.
    zonaFiltro: /Zona Norte/.test(base.zona) ? "Zona Norte" : /Atlántico/.test(base.zona) ? "Atlántico" : base.zona,
    estado: base.estado === "En construcción" ? "en construcción" : "entrega inmediata",
    estadoTexto: etiquetaEstadoInmueble(base.estado, lang),
    tipoInmueble: "apartamentos",
    href: ruta(lang, `/inmuebles/${x.slug}`),
    foto: x.fotos[0] ? { src: x.fotos[0].tarjeta, alt: x.fotos[0].alt, credito: x.fotos[0].credito } : null,
    fotos: x.fotos.slice(0, 4).map((f) => ({ src: f.tarjeta, alt: f.alt, credito: f.credito })),
    escaparate: null,
    precio: precio.texto,
    muestraPrecio: x.precio !== null,
    corte: precio.corte,
    precioDesde: x.precio?.valor ?? null,
    alcobas: x.habitacionesTarjeta,
    banos: x.banosTarjeta,
    area: area ? { texto: area.valor, etiquetas: [area.etiqueta], conflicto: false } : null,
    linea: x.linea,
    frase: x.frase,
    nuevo: false,
    revisionJuridica: false,
    entrega: null,
    destacados,
    verTexto: t.verInmueble,
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
export function proyectosEnOrden(idioma: Idioma = "es"): Proyecto[] {
  const { PROYECTOS } = proyectos(cual(idioma));
  const conocidos = ORDEN_CARTERA.map((s) => PROYECTOS.find((p) => p.slug === s)).filter(
    (p): p is Proyecto => p !== undefined,
  );
  const nuevos = PROYECTOS.filter((p) => !ORDEN_CARTERA.includes(p.slug));
  return [...conocidos, ...nuevos];
}

/**
 * «en la Zona Norte de Cartagena», para títulos y descripciones. En inglés,
 * «in Cartagena's Zona Norte».
 */
export function dondeQueda(p: Proyecto, idioma: Idioma = "es"): string {
  if (cual(idioma) === "en") {
    switch (p.zona) {
      case "Zona Norte":
        return "in Cartagena's Zona Norte";
      case "Vía Turbaco":
        return "on the road to Turbaco";
      case "Cartagena":
        return "in Cartagena";
      default:
        return `in ${p.zona}`;
    }
  }
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
export function pinDelMapa(p: Proyecto, idioma: Idioma = "es"): PinProyecto | null {
  const lang = cual(idioma);
  const q = enIdioma(p, lang);
  if (!q.coordenada) return null;
  const { lat, lon, fuente } = q.coordenada;
  const f = fichaDe(q, lang);
  const playaCercana = zona(lang).LUGARES.filter((l) => PLAYAS.includes(l.id) && l.coordenada)
    .map((l) => ({ id: l.id, d: Math.hypot(l.coordenada!.lat - lat, l.coordenada!.lon - lon) }))
    .sort((a, b) => a.d - b.d)[0]?.id;
  const tiempos = (q.tiempos ?? []).flatMap((t) => {
    const lugar = t.destino === "playa" ? playaCercana : LUGAR_DE_DESTINO[t.destino];
    return lugar ? [{ lugar, minutos: t.minutos, fuente: t.fuente }] : [];
  });
  return {
    slug: q.slug,
    nombre: q.nombre,
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
