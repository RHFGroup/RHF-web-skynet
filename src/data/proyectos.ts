/**
 * CAPA DE DATOS ÚNICA DE LA CARTERA
 * =================================
 *
 * Todo lo que se publica de un proyecto —la web, el feed del catálogo de
 * WhatsApp y lo que responde el agente— sale de aquí.
 *
 * REGLAS QUE NO SE NEGOCIAN
 *
 * 1. Cada dato lleva su FUENTE TEXTUAL y su FECHA.
 *
 * 2. EL ÁREA NO SE TRADUCE. Se publica con la etiqueta literal que usa la
 *    fuente. Si el brochure dice «área construida», se publica «área
 *    construida» — nunca «área privada construida», que es un concepto
 *    distinto del artículo 3 de la Ley 675 de 2001. Mientras el promotor no
 *    certifique la equivalencia, `area.certificadaComoPrivadaConstruida`
 *    queda en false y la pieza lo DECLARA a la vista, no lo esconde.
 *
 * 3. La Circular 004 de 2024 de la SIC separa dos momentos:
 *      · numeral 2.16.1 — LA PIEZA con precio lleva tres datos: área privada
 *        construida, precio de referencia en pesos y ubicación exacta.
 *      · numeral 2.16.2 — la INFORMACIÓN PRECONTRACTUAL (estrato, parqueadero,
 *        entrega, administración, acabados, etapas, desistimiento) se entrega
 *        al comprador antes de contratar. No va en la pieza y NO bloquea.
 *
 * 4. Si dos fuentes se contradicen, no se elige una en silencio: el dato entra
 *    en `conflictos` y la pieza muestra las dos versiones con su fuente.
 *
 * 5. Los precios salen del archivo fuente con su fecha de corte visible, y
 *    son de referencia sujetos a disponibilidad. Art. 26 de la Ley 1480 de
 *    2011: el precio informado vincula, por eso la fecha de corte va SIEMPRE
 *    junto a la cifra.
 */

export type Dato = { label: string; valor: string; fuente: string };

export type Conflicto = {
  dato: string;
  versiones: { valor: string; fuente: string }[];
};

/** El área, siempre con la etiqueta literal de quien la publicó. */
export type Area = {
  /** Literal: «Área construida», «Apartamentos de 70m²», «AREA CASA». */
  etiqueta: string;
  valor: string;
  fuente: string;
  /**
   * ¿El promotor certificó que esa cifra ES el área privada construida del
   * art. 3 de la Ley 675 de 2001? Hoy: ninguno. Mientras sea false, la pieza
   * publica la cifra con su etiqueta y declara la certificación pendiente.
   */
  certificadaComoPrivadaConstruida: boolean;
};

export type Tipologia = {
  titulo: string;
  detalle: string;
  fuente: string;
  area: Area;
  precio: {
    desde: number;
    hasta: number;
    unidades: number;
  } | null;
};

export type Precontractual = {
  estrato: string | null;
  parqueadero: string | null;
  fechaEntrega: string | null;
  administracion: string | null;
  acabados: string | null;
  planEtapas: string | null;
  desistimiento: string | null;
};

export type Proyecto = {
  slug: string;
  nombre: string;
  zona: string;
  promotor: string;
  estado: "en lanzamiento" | "en construcción" | "entrega inmediata";
  resumen: string;
  tipologias: Tipologia[];
  amenidades: string[];
  datos: Dato[];
  /** Ubicación exacta del PROYECTO (numeral 2.16.1), no de la sala de ventas. */
  ubicacion: string | null;
  ubicacionFuente: string;
  conflictos: Conflicto[];
  brochurePaginas: number;
  brochurePdf: string | null;
  precio: {
    desde: number;
    hasta: number;
    moneda: "COP";
    unidadesDisponibles: number;
    corte: string;
    fuente: string;
  } | null;
  precontractual: Precontractual;
  /** Unidades que la fuente registra pero que NO se ofrecen, y por qué. */
  reservas: string[];
};

const SIN_PRECONTRACTUAL: Precontractual = {
  estrato: null,
  parqueadero: null,
  fechaEntrega: null,
  administracion: null,
  acabados: null,
  planEtapas: null,
  desistimiento: null,
};

const LISTA_INVERCOLOMBIA =
  "LISTADO DE PRECIO Y DISPONIBILIDAD (Invercolombia), archivo del 12 de agosto de 2026";
const LISTA_DORAL =
  "«Disponibilidad y precios Doral Cartagena.xlsx», archivo original del constructor, modificado el 25 de junio de 2026";
const DIRECCION_DORAL = "Vía al mar 90A, Cartagena de Indias";
const FUENTE_DIRECCION_DORAL =
  "Brochure oficial Doral Cartagena y doralcartagena.com/country, verificados el 7-sep-2026";

export const PROYECTOS: Proyecto[] = [
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: "blue-garden",
    nombre: "Blue Garden Condominio",
    zona: "Vía Turbaco",
    promotor: "Invercolombia MB S.A.S. (comercializa) · Promotora BG",
    estado: "en construcción",
    resumen:
      "Condominio campestre sobre la vía a Turbaco, con casas de una planta ampliables a segundo piso dentro de un club con más de cincuenta amenidades ya construidas. Es el proyecto de la cartera con el inventario mejor documentado.",
    tipologias: [
      {
        titulo: "Casa de una planta",
        detalle:
          "3 alcobas, 2 baños, sala, comedor, cocina y zona de labores, sobre lote de 250 m², con opción de ampliación a segundo piso y terraza.",
        fuente: "Brochure oficial Blue Garden 2026, pág. 12",
        area: {
          etiqueta: "Área construida",
          valor: "75 m²",
          fuente: "Brochure oficial Blue Garden 2026, pág. 12",
          certificadaComoPrivadaConstruida: false,
        },
        precio: { desde: 403_000_000, hasta: 486_000_000, unidades: 83 },
      },
    ],
    amenidades: [
      "Club campestre con más de 50 amenidades",
      "Piscina y solárium",
      "Cancha múltiple",
      "Coworking",
      "Zona de meditación",
      "Mini golf",
      "Lago y senderos",
      "Parque infantil",
    ],
    datos: [
      { label: "Área del lote", valor: "250 m²", fuente: "Brochure oficial, pág. 12" },
      { label: "Alcobas", valor: "3", fuente: "Brochure oficial" },
      { label: "Baños", valor: "2", fuente: "Brochure oficial" },
      { label: "Parqueaderos", valor: "2", fuente: "Brochure oficial, pág. 12" },
      { label: "Ampliación", valor: "Segundo piso y terraza", fuente: "Brochure oficial" },
    ],
    ubicacion: "Vía Turbaco Km 1, Cartagena de Indias, Bolívar",
    ubicacionFuente: "invercolombia.com.co/blue-garden, consultada el 14-sep-2026",
    conflictos: [],
    brochurePaginas: 24,
    brochurePdf: "/proyectos/blue-garden/brochure.pdf",
    precio: {
      desde: 403_000_000,
      hasta: 486_000_000,
      moneda: "COP",
      unidadesDisponibles: 83,
      corte: "12 de agosto de 2026",
      fuente: LISTA_INVERCOLOMBIA + ", hoja «Blue Garden Disponibilidades»",
    },
    precontractual: {
      ...SIN_PRECONTRACTUAL,
      parqueadero: "2 parqueaderos por casa",
      acabados: "Ver brochure oficial, págs. 13 a 24",
    },
    reservas: [],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: "acacias-campestre",
    nombre: "Acacias Campestre",
    zona: "Cartagena",
    promotor: "Invercolombia (vende) · MB Gerencia y Construcciones · Promotora AC",
    estado: "en construcción",
    resumen:
      "Veintidós torres y 904 apartamentos desarrollados en cinco etapas, con apartamentos de una, dos y tres alcobas. No es VIS: el promotor lo plantea como proyecto de inversión.",
    tipologias: [
      {
        titulo: "1 alcoba",
        detalle: "Sala-comedor, cocina, 1 habitación, 1 baño y zona de labores. Bloques 1, 2, 3 y 10 al 23 (piso 5).",
        fuente: "Brochure oficial Acacias 2026, pág. 13",
        area: {
          etiqueta: "Apartamentos de 33m² a 35m²",
          valor: "33 – 35 m²",
          fuente: "Brochure oficial Acacias 2026, pág. 13 (cita literal)",
          certificadaComoPrivadaConstruida: false,
        },
        precio: { desde: 172_270_000, hasta: 186_180_000, unidades: 14 },
      },
      {
        titulo: "2 y 3 alcobas",
        detalle: "Balcón, sala-comedor, cocina, 2 o 3 habitaciones y 2 baños. Área interna 65,3 m² y externa 4,7 m².",
        fuente: "Brochure oficial Acacias 2026, pág. 13",
        area: {
          etiqueta: "Apartamentos de 70m²",
          valor: "70 m²",
          fuente: "Brochure oficial Acacias 2026, pág. 13 (cita literal)",
          certificadaComoPrivadaConstruida: false,
        },
        precio: { desde: 229_000_000, hasta: 376_640_000, unidades: 97 },
      },
    ],
    amenidades: [
      "Boulevard de acceso",
      "Piscina y solárium",
      "Cancha múltiple",
      "Coworking",
      "Salón social",
      "Gimnasio",
      "Jacuzzi",
      "Zona BBQ",
      "Parque infantil",
      "Zona pet",
      "Parqueaderos privados",
    ],
    datos: [
      { label: "Torres", valor: "22", fuente: "Brochure oficial" },
      { label: "Apartamentos", valor: "904", fuente: "Brochure oficial" },
      { label: "Etapas", valor: "5", fuente: "Brochure oficial" },
      { label: "VIS", valor: "No es VIS", fuente: "Brochure oficial (cita literal)" },
    ],
    // El promotor no publica la ubicación del proyecto: solo la sala de ventas.
    ubicacion: null,
    ubicacionFuente:
      "invercolombia.com.co/acacias-campestre publica únicamente la sala de ventas («Troncal Caribe, frente al SENA de Ternera»), no la ubicación del proyecto. Consultada el 14-sep-2026",
    conflictos: [
      {
        dato: "Área de la tipología pequeña",
        versiones: [
          { valor: "33 a 35 m²", fuente: "Brochure oficial, pág. 13" },
          { valor: "32 a 35 m²", fuente: "Brochure oficial, págs. 24-28 (rótulo de fotos)" },
        ],
      },
      {
        dato: "Área de 2 y 3 alcobas",
        versiones: [
          { valor: "70 m² las dos", fuente: "Brochure oficial, pág. 13" },
        ],
      },
    ],
    brochurePaginas: 30,
    brochurePdf: null,
    precio: {
      desde: 172_270_000,
      hasta: 376_640_000,
      moneda: "COP",
      unidadesDisponibles: 111,
      corte: "12 de agosto de 2026",
      fuente: LISTA_INVERCOLOMBIA + ", hoja «Acacias Disponibilidades»",
    },
    precontractual: {
      ...SIN_PRECONTRACTUAL,
      parqueadero: "Parqueaderos privados",
      planEtapas: "Entrega por etapas, sin fechas publicadas",
    },
    reservas: [
      "El listado registra un apartamento 503 de 35 m² a un precio muy por debajo del resto de su tipología. Es una duplicidad de numeración sin resolver: esa unidad no se cotiza hasta que el promotor la confirme.",
      "El brochure anuncia un precio de arranque inferior al mínimo disponible hoy. No se usa el brochure como fuente de precio.",
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: "doral-west",
    nombre: "Doral West",
    zona: "Zona Norte",
    promotor: "Doral West S.A.S. · NIT 901.641.288 · Grupo Brieva en alianza con Grupo Rincón",
    estado: "en construcción",
    resumen:
      "Casas de uno y dos pisos con estructura preparada para crecer hasta un tercer nivel, dentro del desarrollo Doral sobre la Vía al Mar. Es el proyecto de la cartera con fechas de entrega documentadas por manzana.",
    tipologias: [
      {
        titulo: "Casa de un piso — lote de 150 m²",
        detalle:
          "2 habitaciones, 2 baños, sala-comedor, cocina integral, patio interno, zona de labores y parqueadero privado. Entregas entre abril y noviembre de 2028.",
        fuente: "Brochure oficial Doral Cartagena · " + LISTA_DORAL,
        area: {
          etiqueta: "Área construida",
          valor: "53 m²",
          fuente: "Brochure oficial Doral Cartagena (cita literal)",
          certificadaComoPrivadaConstruida: false,
        },
        precio: { desde: 525_000_000, hasta: 525_000_000, unidades: 25 },
      },
      {
        titulo: "Casa de un piso — lote de 160 m²",
        detalle: "Misma distribución sobre lote más amplio. Entrega en noviembre de 2028.",
        fuente: LISTA_DORAL + ", hoja «Lista de precios West»",
        area: {
          etiqueta: "AREA CASA",
          valor: "64 m²",
          fuente: LISTA_DORAL + " (encabezado literal de la columna)",
          certificadaComoPrivadaConstruida: false,
        },
        precio: { desde: 605_000_000, hasta: 605_000_000, unidades: 2 },
      },
      {
        titulo: "Casa de dos pisos — lote de 128 m²",
        detalle:
          "Dos niveles con estructura para ampliar hasta un tercero. Entregas entre noviembre de 2026 y octubre de 2028.",
        fuente: "Brochure oficial Doral Cartagena · " + LISTA_DORAL,
        area: {
          etiqueta: "Área construida",
          valor: "100 m²",
          fuente: "Brochure oficial Doral Cartagena (cita literal)",
          certificadaComoPrivadaConstruida: false,
        },
        precio: { desde: 630_000_000, hasta: 700_000_000, unidades: 21 },
      },
      {
        titulo: "Casa de dos pisos — lote de 288 m²",
        detalle: "Unidad única sobre lote esquinero. Entrega en abril de 2027.",
        fuente: LISTA_DORAL + ", hoja «Lista de precios West»",
        area: {
          etiqueta: "AREA CASA",
          valor: "100 m²",
          fuente: LISTA_DORAL + " (encabezado literal de la columna)",
          certificadaComoPrivadaConstruida: false,
        },
        precio: { desde: 835_000_000, hasta: 835_000_000, unidades: 1 },
      },
    ],
    amenidades: [
      "Conjunto cerrado",
      "Parqueadero privado por casa",
      "Estructura preparada para ampliación",
      "Zonas verdes",
    ],
    datos: [
      { label: "Casas disponibles", valor: "49", fuente: LISTA_DORAL },
      { label: "Lotes", valor: "128, 150, 160 y 288 m²", fuente: LISTA_DORAL },
      { label: "Parqueadero", valor: "Privado", fuente: "Brochure oficial Doral Cartagena" },
      { label: "Entregas", valor: "Noviembre 2026 a noviembre 2028", fuente: LISTA_DORAL + ", columna «fecha entrega»" },
    ],
    ubicacion: DIRECCION_DORAL,
    ubicacionFuente: FUENTE_DIRECCION_DORAL,
    conflictos: [
      {
        dato: "Área construida de la casa de un piso sobre lote de 150 m²",
        versiones: [
          { valor: "53 m²", fuente: "Brochure oficial e Instagram @doralcartagena" },
          { valor: "64 m²", fuente: LISTA_DORAL + " — registra ambas cifras sobre el mismo lote y al mismo precio" },
        ],
      },
    ],
    brochurePaginas: 0,
    brochurePdf: null,
    precio: {
      desde: 525_000_000,
      hasta: 835_000_000,
      moneda: "COP",
      unidadesDisponibles: 49,
      corte: "25 de junio de 2026",
      fuente: LISTA_DORAL + ", hoja «Lista de precios West»",
    },
    precontractual: {
      ...SIN_PRECONTRACTUAL,
      parqueadero: "Privado, uno por casa",
      fechaEntrega: "Por manzana, entre noviembre de 2026 y noviembre de 2028",
      planEtapas: "Etapas 1 y 2; zonas comunes sin detallar",
    },
    reservas: [],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: "doral-country",
    nombre: "Doral Country",
    zona: "Zona Norte",
    promotor: "Doral Cartagena · Grupo Brieva en alianza con Grupo Rincón",
    estado: "en lanzamiento",
    resumen:
      "Conjunto cerrado de seis torres sobre la Vía al Mar, con ascensor por torre y diez unidades por piso. Es el lanzamiento más reciente del desarrollo Doral.",
    tipologias: [
      {
        titulo: "Apartamento de 2 alcobas",
        detalle: "2 habitaciones y 2 baños, con balcón o terraza según el piso.",
        fuente: LISTA_DORAL + ", hoja «Lista de precios Country»",
        area: {
          etiqueta: "m2",
          valor: "40 m²",
          fuente: LISTA_DORAL + " (encabezado literal de la columna)",
          certificadaComoPrivadaConstruida: false,
        },
        precio: { desde: 259_500_000, hasta: 279_500_000, unidades: 32 },
      },
      {
        titulo: "Apartamento de 3 alcobas",
        detalle: "3 habitaciones y 2 baños, con balcón o terraza según el piso.",
        fuente: LISTA_DORAL + ", hoja «Lista de precios Country»",
        area: {
          etiqueta: "m2",
          valor: "62 m²",
          fuente: LISTA_DORAL + " (encabezado literal de la columna)",
          certificadaComoPrivadaConstruida: false,
        },
        precio: { desde: 370_000_000, hasta: 410_000_000, unidades: 26 },
      },
    ],
    amenidades: [
      "Conjunto residencial cerrado",
      "Seis torres",
      "Ascensor por torre",
      "Piscina",
      "Gimnasio",
      "Parqueadero comunal",
    ],
    datos: [
      { label: "Torres", valor: "6", fuente: "doralcartagena.com/country" },
      { label: "Pisos por torre", valor: "5 + altillo", fuente: "doralcartagena.com/country" },
      { label: "Unidades por piso", valor: "10", fuente: "doralcartagena.com/country" },
      { label: "Parqueadero", valor: "Comunal", fuente: "Brochure del constructor, pág. 13" },
    ],
    ubicacion: DIRECCION_DORAL,
    ubicacionFuente: FUENTE_DIRECCION_DORAL,
    conflictos: [
      {
        dato: "Áreas de las tipologías",
        versiones: [
          { valor: "40 y 62 m²", fuente: LISTA_DORAL + ", de donde salen los precios" },
          { valor: "42, 50, 63 y 70 m²", fuente: "doralcartagena.com/country, consultada el 14-sep-2026" },
        ],
      },
    ],
    brochurePaginas: 15,
    brochurePdf: "/proyectos/doral-country/brochure.pdf",
    precio: {
      desde: 259_500_000,
      hasta: 410_000_000,
      moneda: "COP",
      unidadesDisponibles: 58,
      corte: "25 de junio de 2026",
      fuente: LISTA_DORAL + ", hoja «Lista de precios Country»",
    },
    precontractual: {
      ...SIN_PRECONTRACTUAL,
      parqueadero: "Comunal",
      planEtapas: "Torres 1 a 6, sin fechas publicadas",
    },
    reservas: [
      "Nueve apartamentos de 40 m² figuran en la fuente con el precio de los de 62 m² (T2 104/107/108 y T3 303 a 308). Es una anomalía conocida y sin resolver: esas unidades no se ofrecen hasta que el constructor confirme.",
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: "doral-suite",
    nombre: "Doral Suite",
    zona: "Zona Norte",
    promotor: "Doral Cartagena · Grupo Brieva en alianza con Grupo Rincón",
    estado: "entrega inmediata",
    resumen:
      "Apartaestudios aprobados para renta corta dentro del desarrollo Doral. Quedan siete unidades de sesenta y seis: es inventario final.",
    tipologias: [
      {
        titulo: "Apartaestudio — piso 3",
        detalle:
          "1 alcoba y 1 baño. Área interna de 32,52 m² más balcón de 6,92 m².",
        fuente: LISTA_DORAL + ", hoja «Doral suite»",
        area: {
          etiqueta: "39 m2",
          valor: "39 m²",
          fuente: LISTA_DORAL + " (rótulo literal de la hoja)",
          certificadaComoPrivadaConstruida: false,
        },
        precio: { desde: 295_000_000, hasta: 327_000_000, unidades: 3 },
      },
      {
        titulo: "Apartaestudio — piso 4",
        detalle:
          "El mismo apartaestudio del piso 3 —área interna de 32,35 m²— con terraza de 30,92 m² en vez de balcón. No es más grande por dentro: la diferencia está afuera.",
        fuente: LISTA_DORAL + ", hoja «Doral suite»",
        area: {
          etiqueta: "63 m2",
          valor: "63 m²",
          fuente: LISTA_DORAL + " (rótulo literal de la hoja)",
          certificadaComoPrivadaConstruida: false,
        },
        precio: { desde: 395_000_000, hasta: 429_000_000, unidades: 4 },
      },
    ],
    amenidades: [
      "Aprobado para rentas cortas",
      "Acabados premium",
      "Mall comercial en el mismo desarrollo",
      "Zona Norte, cerca del aeropuerto",
    ],
    datos: [
      { label: "Unidades totales", valor: "66", fuente: LISTA_DORAL },
      { label: "Disponibles", valor: "7", fuente: LISTA_DORAL },
      { label: "Alcobas", valor: "1", fuente: LISTA_DORAL },
      { label: "Uso", valor: "Aprobado para renta corta", fuente: "doralcartagena.com/doral-suites" },
    ],
    ubicacion: DIRECCION_DORAL,
    ubicacionFuente: FUENTE_DIRECCION_DORAL,
    conflictos: [],
    brochurePaginas: 0,
    brochurePdf: null,
    precio: {
      desde: 295_000_000,
      hasta: 429_000_000,
      moneda: "COP",
      unidadesDisponibles: 7,
      corte: "25 de junio de 2026",
      fuente: LISTA_DORAL + ", hoja «Doral suite»",
    },
    precontractual: {
      ...SIN_PRECONTRACTUAL,
      acabados: "Acabados premium, según doralcartagena.com/doral-suites",
    },
    reservas: ["No hay fotos ni video de la tipología del piso 4."],
  },
];

export function getProyecto(slug: string): Proyecto | undefined {
  return PROYECTOS.find((p) => p.slug === slug);
}

/** Los tres datos del numeral 2.16.1, con lo que falta de cada uno. */
export function datosDePieza(p: Proyecto): {
  completo: boolean;
  faltan: string[];
  areas: Area[];
  certificacionPendiente: boolean;
} {
  const areas = p.tipologias.map((t) => t.area);
  const faltan: string[] = [];
  if (areas.length === 0) faltan.push("área");
  if (p.precio === null) faltan.push("precio de referencia");
  if (p.ubicacion === null) faltan.push("ubicación exacta del proyecto");
  return {
    completo: faltan.length === 0,
    faltan,
    areas,
    certificacionPendiente: areas.some((a) => !a.certificadaComoPrivadaConstruida),
  };
}

/**
 * El precio sale cuando están los tres datos de la pieza. El área se publica
 * con la etiqueta de la fuente; que su equivalencia con el área privada
 * construida esté pendiente de certificación se DECLARA, no bloquea.
 */
export function puedePublicarPrecio(p: Proyecto): boolean {
  return datosDePieza(p).completo;
}

/** Lo que el asesor debe tener a la mano antes de contratar. Nunca bloquea. */
export function faltaPrecontractual(p: Proyecto): string[] {
  const ETIQUETAS: Record<keyof Precontractual, string> = {
    estrato: "estrato",
    parqueadero: "naturaleza del parqueadero",
    fechaEntrega: "fecha estimada de entrega",
    administracion: "cuota de administración estimada",
    acabados: "muebles, equipos y acabados",
    planEtapas: "plan de etapas y zonas comunes",
    desistimiento: "valor de desistimiento",
  };
  return (Object.keys(ETIQUETAS) as (keyof Precontractual)[])
    .filter((k) => p.precontractual[k] === null)
    .map((k) => ETIQUETAS[k]);
}

export function formatoPesos(n: number): string {
  return "$" + n.toLocaleString("es-CO");
}

/** «desde $403.000.000» o «$525.000.000» si no hay rango. */
export function rangoPrecio(desde: number, hasta: number): string {
  return desde === hasta
    ? formatoPesos(desde)
    : `desde ${formatoPesos(desde)}`;
}
