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

/**
 * Una imagen publicada, siempre con su crédito y su tamaño real.
 *
 * El crédito no es decorativo: dice si la imagen es material del promotor o
 * foto propia. Una foto afirma igual que una frase.
 */
export type Foto = {
  src: string;
  alt: string;
  /** «Material del promotor», «Foto propia»… */
  credito: string;
  ancho: number;
  alto: number;
  /**
   * La misma imagen en 1200 px, cuando la original es más grande. La usan la
   * tarjeta de la cartera y las pantallas angostas: no descargan 2400 px para
   * mostrar 400.
   */
  src1200?: string;
};

/** Un plano tal como lo publica la fuente, con la página de donde sale. */
export type Plano = Foto & { fuente: string };

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
  /**
   * Habitaciones y baños tal como los dice `detalle`, con la misma fuente.
   * Texto y no número a propósito: la fuente a veces dice «2 o 3».
   * Si la fuente no lo dice, el campo no existe y la pieza no lo muestra.
   */
  alcobas?: string;
  banos?: string;
  /** Balcón, terraza, patio o lote, como lo dice `detalle`. */
  exterior?: string;
  /** Los planos que publica la fuente para esta tipología. */
  planos?: Plano[];
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

  // ── Campos opcionales de la página propia y la tarjeta ──────────────────
  // Regla de todos: si el campo no existe, el bloque que lo usa NO aparece.
  // Nunca se reemplaza por un marcador ni por texto de relleno.

  /** Qué se vende, en plural: arma el título para buscadores y el filtro. */
  tipoInmueble?: "apartamentos" | "casas" | "apartaestudios";
  /**
   * Dónde queda el proyecto DENTRO de la foto del hero de la home
   * (public/zona-norte/corredor-2400.jpg), en porcentaje del ancho y el alto
   * de la foto: `{ top: "42%", left: "63%", fuente: "…" }`. Solo con la
   * posición verificada sobre esa toma. Los proyectos que no están en la
   * foto —Blue Garden, Acacias— nunca llevan pin: el hero los ignora.
   */
  heroPin?: { top: string; left: string; fuente: string };

  /**
   * Cómo se presenta en la cartera: una línea de producto y una frase corta.
   * Antes vivía en un arreglo aparte dentro de `src/app/page.tsx`.
   */
  presentacion?: {
    linea: string;
    frase: string;
    /** La etiqueta «Nuevo» de la tarjeta. */
    nuevo?: boolean;
  };
  /** La frase del reverso de la tarjeta. Si falta, se usa `resumen`. */
  fraseDestacada?: string;
  /**
   * Las imágenes del proyecto: la de la tarjeta, la galería de la portada (la
   * primera es la que abre) y la imagen para compartir en WhatsApp y redes.
   */
  fotos?: {
    tarjeta: Foto;
    galeria: Foto[];
    compartir: string;
    /**
     * La imagen del proyecto en la portada de la home, a pantalla completa,
     * con su versión de 1200 px. `enfoque` es el `object-position` del recorte
     * («50% 60%»): qué parte de la imagen se conserva cuando la pantalla la
     * corta. `mini` es la miniatura de 168 × 120 px para elegirla en la
     * portada. Si falta el escaparate, la portada usa la primera de la galería.
     */
    escaparate?: Foto & { enfoque?: string; mini?: string };
  };
  /**
   * ¿El estudio jurídico de RHF Living ya revisó este proyecto? Lo confirma
   * Rafael, proyecto por proyecto. Mientras no lo haga, no existe o es false,
   * y el sello «Revisado por nuestro estudio jurídico» no aparece.
   */
  revisionJuridica?: boolean;
  /**
   * Coordenada del PROYECTO, solo si se verificó en fuente. Nunca una posición
   * aproximada: un pin mal puesto es un dato falso con mejor diseño.
   */
  coordenada?: { lat: number; lon: number; fuente: string };
  /** Tiempos reales de trayecto, medidos y entregados por Rafael. */
  tiempos?: {
    destino: "playa" | "aeropuerto" | "hospital" | "centro";
    minutos: number;
    fuente: string;
  }[];
  /**
   * «Lo que debes saber antes de separar», en primera persona. Solo con el
   * texto que Rafael entregue, con su fecha.
   */
  opinionRafael?: {
    paraQuien: string;
    fuertes: string[];
    tenerEnCuenta: string[];
    fecha: string;
  };
  /** Preguntas frecuentes con respuestas validadas por Rafael. */
  faq?: { pregunta: string; respuesta: string }[];
  /** La página de avance de obra de la constructora, si existe. */
  avanceObra?: { url: string; fuente: string };
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
const HOJA_COUNTRY_SEP =
  "Hoja «Disponibilidad y precios Doral Cartagena — Doral Country» del constructor, exportada el 23 de septiembre de 2026, con su tabla de precios por piso «TORRE 1-5»";
/** Crédito de renders y fotos que entrega el promotor o la constructora. */
const DEL_PROMOTOR = "Material del promotor";
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
      "Condominio campestre sobre la vía a Turbaco, con casas de una planta ampliables a segundo piso dentro de un club campestre con más de veinte amenidades ya construidas. Es el proyecto de la cartera con el inventario mejor documentado.",
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
        alcobas: "3",
        banos: "2",
        exterior: "Lote de 250 m²; terraza en la opción de ampliación a segundo piso",
        planos: [
          {
            src: "/proyectos/blue-garden/brochure/p12.jpg",
            alt: "Plano de la casa de una planta de Blue Garden, con lote de 250 m² y área construida de 75 m²",
            credito: DEL_PROMOTOR,
            ancho: 1200,
            alto: 960,
            fuente: "Brochure oficial Blue Garden 2026, pág. 12",
          },
        ],
      },
    ],
    amenidades: [
      "Club campestre con más de 20 amenidades",
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
    ubicacion: "Vía Turbaco Km 1, Turbaco, Bolívar",
    ubicacionFuente: "invercolombia.com.co/blue-garden (Vía Turbaco Km 1), consultada el 14-sep-2026 · municipio: ficha de la Feria de Vivienda de El Universal",
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
    tipoInmueble: "casas",
    // Pasa a true cuando Rafael confirme que el estudio jurídico lo revisó.
    revisionJuridica: false,
    presentacion: {
      linea: "Casas ampliables · 3 habitaciones · jardín",
      frase: "Casa familiar con lote generoso y posibilidad de ampliación.",
    },
    fotos: {
      tarjeta: {
        src: "/proyectos/blue-garden/home.jpg",
        alt: "Blue Garden — terraza de una casa del condominio",
        credito: DEL_PROMOTOR,
        ancho: 1200,
        alto: 1200,
      },
      galeria: [
        { src: "/proyectos/blue-garden/escaparate-2400.jpg", src1200: "/proyectos/blue-garden/escaparate-1200.jpg", alt: "Blue Garden — casas del condominio con su jardín y parqueadero", credito: DEL_PROMOTOR + " · brochure oficial, pág. 20", ancho: 2400, alto: 1350 },
        { src: "/proyectos/blue-garden/home.jpg", alt: "Blue Garden — terraza de una casa del condominio", credito: DEL_PROMOTOR, ancho: 1200, alto: 1200 },
        { src: "/proyectos/blue-garden/brochure/p05.jpg", alt: "Blue Garden — vista aérea del club campestre", credito: DEL_PROMOTOR + " · brochure oficial, pág. 5", ancho: 1200, alto: 960 },
        { src: "/proyectos/blue-garden/brochure/p06.jpg", alt: "Blue Garden — lago del club campestre", credito: DEL_PROMOTOR + " · brochure oficial, pág. 6", ancho: 1200, alto: 960 },
        { src: "/proyectos/blue-garden/brochure/p09.jpg", alt: "Blue Garden — piscina del club", credito: DEL_PROMOTOR + " · brochure oficial, pág. 9", ancho: 1200, alto: 960 },
        { src: "/proyectos/blue-garden/brochure/p08.jpg", alt: "Blue Garden — parque infantil del club", credito: DEL_PROMOTOR + " · brochure oficial, pág. 8", ancho: 1200, alto: 960 },
        { src: "/proyectos/blue-garden/brochure/p14.jpg", alt: "Blue Garden — sala de la casa modelo", credito: DEL_PROMOTOR + " · brochure oficial, pág. 14", ancho: 1200, alto: 960 },
        { src: "/proyectos/blue-garden/brochure/p16.jpg", alt: "Blue Garden — cocina y comedor de la casa modelo", credito: DEL_PROMOTOR + " · brochure oficial, pág. 16", ancho: 1200, alto: 960 },
      ],
      compartir: "/proyectos/blue-garden/og.jpg",
      escaparate: {
        src: "/proyectos/blue-garden/escaparate-2400.jpg",
        mini: "/proyectos/blue-garden/mini.jpg",
        src1200: "/proyectos/blue-garden/escaparate-1200.jpg",
        alt: "Blue Garden — casas del condominio con su jardín y parqueadero",
        credito: DEL_PROMOTOR + " · brochure oficial, pág. 20",
        ancho: 2400,
        alto: 1350,
        enfoque: "58% 60%",
      },
    },
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
        alcobas: "1",
        banos: "1",
        planos: [
          {
            src: "/proyectos/acacias-campestre/brochure/p13.jpg",
            alt: "Plano del apartamento de 1 alcoba de Acacias Campestre",
            credito: DEL_PROMOTOR,
            ancho: 1200,
            alto: 705,
            fuente: "Brochure oficial Acacias 2026, pág. 13",
          },
        ],
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
        alcobas: "2 o 3",
        banos: "2",
        exterior: "Balcón · área externa de 4,7 m²",
        planos: [
          {
            src: "/proyectos/acacias-campestre/brochure/p14.jpg",
            alt: "Plano del apartamento de 2 alcobas de Acacias Campestre",
            credito: DEL_PROMOTOR,
            ancho: 1200,
            alto: 705,
            fuente: "Brochure oficial Acacias 2026, pág. 14",
          },
          {
            src: "/proyectos/acacias-campestre/brochure/p15.jpg",
            alt: "Plano del apartamento de 3 alcobas de Acacias Campestre",
            credito: DEL_PROMOTOR,
            ancho: 1200,
            alto: 705,
            fuente: "Brochure oficial Acacias 2026, pág. 15",
          },
        ],
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
    // El PDF del sitio es el brochure oficial sin la página de precios (la 29
    // del original, con cifras que ya no corresponden a la lista): por eso
    // tiene 29 páginas y no 30. Autorizado por Rafael el 23-sep-2026 (#21).
    brochurePaginas: 29,
    brochurePdf: "/proyectos/acacias-campestre/brochure.pdf",
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
    tipoInmueble: "apartamentos",
    // Pasa a true cuando Rafael confirme que el estudio jurídico lo revisó.
    revisionJuridica: false,
    presentacion: {
      linea: "22 torres · 904 apartamentos · 5 etapas",
      // Hasta el 24-sep-2026 decía «Entrada económica con valorización a
      // mediano plazo». La valorización es una promesa sin fuente; lo que sí
      // dice el promotor es que lo plantea como proyecto de inversión.
      frase: "Apartamentos de 1, 2 y 3 alcobas. El promotor lo plantea como proyecto de inversión.",
    },
    fotos: {
      tarjeta: {
        src: "/proyectos/acacias-campestre/home.jpg",
        alt: "Acacias Campestre — piscina y solárium frente a las torres",
        credito: DEL_PROMOTOR,
        ancho: 1600,
        alto: 799,
      },
      galeria: [
        { src: "/proyectos/acacias-campestre/home.jpg", src1200: "/proyectos/acacias-campestre/escaparate-1200.jpg", alt: "Acacias Campestre — piscina y solárium frente a las torres", credito: DEL_PROMOTOR + " · brochure oficial, pág. 10", ancho: 1600, alto: 799 },
        { src: "/proyectos/acacias-campestre/galeria-1.jpg", alt: "Acacias Campestre — vista aérea de la piscina y las torres", credito: DEL_PROMOTOR + " · brochure oficial, pág. 9", ancho: 1600, alto: 799 },
        { src: "/proyectos/acacias-campestre/galeria-2.jpg", alt: "Acacias Campestre — cancha múltiple y parque infantil", credito: DEL_PROMOTOR + " · brochure oficial, pág. 11", ancho: 1600, alto: 799 },
        { src: "/proyectos/acacias-campestre/galeria-3.jpg", alt: "Acacias Campestre — parqueaderos junto a las torres", credito: DEL_PROMOTOR + " · brochure oficial, pág. 12", ancho: 1600, alto: 799 },
        { src: "/proyectos/acacias-campestre/galeria-4.jpg", alt: "Acacias Campestre — sala, cocina y comedor del apartamento modelo de 70 m²", credito: DEL_PROMOTOR + " · brochure oficial, pág. 17", ancho: 1600, alto: 771 },
        { src: "/proyectos/acacias-campestre/galeria-5.jpg", alt: "Acacias Campestre — habitación principal del apartamento modelo de 70 m²", credito: DEL_PROMOTOR + " · brochure oficial, pág. 20", ancho: 1600, alto: 771 },
      ],
      compartir: "/proyectos/acacias-campestre/og.jpg",
      escaparate: {
        src: "/proyectos/acacias-campestre/home.jpg",
        mini: "/proyectos/acacias-campestre/mini.jpg",
        src1200: "/proyectos/acacias-campestre/escaparate-1200.jpg",
        alt: "Acacias Campestre — piscina y solárium frente a las torres",
        credito: DEL_PROMOTOR + " · brochure oficial, pág. 10",
        ancho: 1600,
        alto: 799,
        enfoque: "55% 50%",
      },
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: "doral-west",
    nombre: "Doral West",
    zona: "Zona Norte",
    promotor: "Doral West S.A.S. · NIT 901.641.288-2",
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
        alcobas: "2",
        banos: "2",
        exterior: "Patio interno · lote de 150 m²",
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
        // «Misma distribución» que la casa de 150 m²: 2 y 2, con patio.
        alcobas: "2",
        banos: "2",
        exterior: "Patio interno · lote de 160 m²",
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
        // La fuente no dice cuántas habitaciones ni baños: no se publican.
        exterior: "Lote de 128 m²",
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
        exterior: "Lote esquinero de 288 m²",
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
    tipoInmueble: "casas",
    // Pasa a true cuando Rafael confirme que el estudio jurídico lo revisó.
    revisionJuridica: false,
    presentacion: {
      linea: "Casas de 1 y 2 pisos · lote propio · parqueadero privado",
      frase: "Estructura preparada para crecer hasta un tercer nivel. Entregas documentadas por manzana.",
    },
    fotos: {
      tarjeta: {
        src: "/proyectos/doral-west/home.jpg",
        alt: "Doral West — vista aérea del condominio de casas",
        credito: DEL_PROMOTOR,
        ancho: 1400,
        alto: 888,
      },
      galeria: [
        { src: "/proyectos/doral-west/hero.jpg", src1200: "/proyectos/doral-west/escaparate-1200.jpg", alt: "Doral West — vista aérea del condominio de casas junto a la Vía al Mar", credito: DEL_PROMOTOR, ancho: 1920, alto: 1218 },
        { src: "/proyectos/doral-west/fotos/01.jpg", alt: "Doral West — vista aérea del condominio y la zona de piscina", credito: DEL_PROMOTOR, ancho: 1600, alto: 1015 },
        { src: "/proyectos/doral-west/fotos/02.jpg", alt: "Doral West — canchas y casas del condominio", credito: DEL_PROMOTOR, ancho: 1600, alto: 1015 },
        { src: "/proyectos/doral-west/galeria-3.jpg", alt: "Doral West — senderos y zonas verdes del condominio", credito: DEL_PROMOTOR, ancho: 1100, alto: 698 },
        { src: "/proyectos/doral-west/fotos/03.jpg", alt: "Doral West — fachada de casa de un piso con parqueadero privado", credito: DEL_PROMOTOR, ancho: 1600, alto: 739 },
        { src: "/proyectos/doral-west/fotos/04.jpg", alt: "Doral West — cocina de la casa modelo", credito: DEL_PROMOTOR, ancho: 960, alto: 1280 },
        { src: "/proyectos/doral-west/fotos/05.jpg", alt: "Doral West — habitación de la casa modelo", credito: DEL_PROMOTOR, ancho: 960, alto: 1280 },
      ],
      compartir: "/proyectos/doral-west/og.jpg",
      escaparate: {
        src: "/proyectos/doral-west/hero.jpg",
        mini: "/proyectos/doral-west/mini.jpg",
        src1200: "/proyectos/doral-west/escaparate-1200.jpg",
        alt: "Doral West — vista aérea del condominio de casas junto a la Vía al Mar",
        credito: DEL_PROMOTOR,
        ancho: 1920,
        alto: 1218,
        enfoque: "55% 45%",
      },
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: "doral-country",
    nombre: "Doral Country",
    zona: "Zona Norte",
    promotor: "Doral Cartagena",
    estado: "en lanzamiento",
    resumen:
      "Conjunto cerrado de seis torres sobre la Vía al Mar, con ascensor por torre y diez unidades por piso. Es el lanzamiento más reciente del desarrollo Doral.",
    tipologias: [
      {
        titulo: "Apartamento de 2 alcobas",
        detalle: "2 habitaciones y 2 baños. En el piso 1 con terraza, en los pisos 2 a 5 con balcón.",
        fuente: HOJA_COUNTRY_SEP,
        area: {
          etiqueta: "Area",
          valor: "42 m² (pisos 2 a 5) · 50 m² (piso 1)",
          fuente: "Tabla de precios «TORRE 1-5» del constructor (encabezado literal «Area»), septiembre de 2026",
          certificadaComoPrivadaConstruida: false,
        },
        precio: { desde: 311_500_000, hasta: 341_500_000, unidades: 37 },
        alcobas: "2",
        banos: "2",
        exterior: "Terraza en el piso 1 · balcón en los pisos 2 a 5",
        planos: [
          {
            src: "/proyectos/doral-country/brochure/p09.jpg",
            alt: "Plano del apartamento de 2 habitaciones de Doral Country; el brochure lo rotula 40 m²",
            credito: DEL_PROMOTOR,
            ancho: 1200,
            alto: 900,
            fuente: "Brochure del constructor, pág. 9 (rotula 40 m²)",
          },
        ],
      },
      {
        titulo: "Apartamento de 3 alcobas",
        detalle: "3 habitaciones y 2 baños. En el piso 1 con terraza, en los pisos 2 a 5 con balcón.",
        fuente: HOJA_COUNTRY_SEP,
        area: {
          etiqueta: "Area",
          valor: "62 m² (pisos 2 a 5) · 70 m² (piso 1)",
          fuente: "Tabla de precios «TORRE 1-5» del constructor (encabezado literal «Area»), septiembre de 2026",
          certificadaComoPrivadaConstruida: false,
        },
        precio: { desde: 464_000_000, hasta: 494_000_000, unidades: 23 },
        alcobas: "3",
        banos: "2",
        exterior: "Terraza en el piso 1 · balcón en los pisos 2 a 5",
        planos: [
          {
            src: "/proyectos/doral-country/brochure/p10.jpg",
            alt: "Plano del apartamento de 3 habitaciones de Doral Country; el brochure lo rotula 62 m²",
            credito: DEL_PROMOTOR,
            ancho: 1200,
            alto: 900,
            fuente: "Brochure del constructor, pág. 10 (rotula 62 m²)",
          },
        ],
      },
    ],
    // Las siete del brochure del constructor, pág. 13. Hasta el 24-sep-2026
    // esta lista traía «Gimnasio», que no aparece en ninguna fuente (ya lo
    // advertía la landing anterior), y le faltaban cancha, parque y salón.
    amenidades: [
      "Ascensor",
      "Parqueadero comunal",
      "Piscina",
      "Cancha múltiple",
      "Parque infantil",
      "Salón social",
      "Condominio cerrado",
    ],
    datos: [
      { label: "Torres", valor: "6", fuente: "doralcartagena.com/country" },
      { label: "Pisos por torre", valor: "5 + altillo", fuente: "doralcartagena.com/country" },
      { label: "Unidades por piso", valor: "10 (12 en la Torre 5)", fuente: "doralcartagena.com/country · " + HOJA_COUNTRY_SEP },
      { label: "Torres en venta", valor: "1 a 5", fuente: HOJA_COUNTRY_SEP },
      { label: "Parqueadero", valor: "Comunal", fuente: "Brochure del constructor, pág. 13" },
    ],
    ubicacion: DIRECCION_DORAL,
    ubicacionFuente: FUENTE_DIRECCION_DORAL,
    conflictos: [
      {
        dato: "Áreas de las tipologías",
        versiones: [
          { valor: "42 y 62 m² en los pisos 2 a 5 · 50 y 70 m² en el piso 1", fuente: "Tabla de precios «TORRE 1-5» del constructor, septiembre de 2026, de donde salen los precios" },
          { valor: "40 m² en las torres 1, 2, 3 y 5 · 42 m² en la Torre 4 · 62 m²", fuente: HOJA_COUNTRY_SEP + " (encabezados de la grilla)" },
          { valor: "42, 50, 63 y 70 m²", fuente: "doralcartagena.com/country, consultada el 23-sep-2026" },
        ],
      },
    ],
    brochurePaginas: 15,
    brochurePdf: "/proyectos/doral-country/brochure.pdf",
    precio: {
      desde: 311_500_000,
      hasta: 494_000_000,
      moneda: "COP",
      unidadesDisponibles: 60,
      corte: "23 de septiembre de 2026",
      fuente: HOJA_COUNTRY_SEP,
    },
    precontractual: {
      ...SIN_PRECONTRACTUAL,
      parqueadero: "Comunal",
      planEtapas: "Seis torres; las torres 1 a 5 en venta, sin fechas de entrega publicadas",
    },
    reservas: [],
    tipoInmueble: "apartamentos",
    // Pasa a true cuando Rafael confirme que el estudio jurídico lo revisó.
    revisionJuridica: false,
    presentacion: {
      linea: "Apartamentos en torres · 6 torres · ascensor",
      frase: "El lanzamiento más reciente del desarrollo Doral, sobre la Vía al Mar.",
      nuevo: true,
    },
    fotos: {
      tarjeta: {
        src: "/proyectos/doral-country/home.jpg",
        alt: "Doral Country — torres y zona de piscina del condominio",
        credito: DEL_PROMOTOR,
        ancho: 1600,
        alto: 738,
      },
      galeria: [
        { src: "/proyectos/doral-country/hero.jpg", src1200: "/proyectos/doral-country/escaparate-1200.jpg", alt: "Doral Country — torres, piscina y parqueadero del condominio", credito: DEL_PROMOTOR, ancho: 1920, alto: 886 },
        { src: "/proyectos/doral-country/galeria-1.jpg", alt: "Doral Country — vista aérea del condominio con la piscina y el parque infantil", credito: DEL_PROMOTOR, ancho: 1100, alto: 506 },
        { src: "/proyectos/doral-country/galeria-2.jpg", alt: "Doral Country — parque infantil y zonas verdes entre las torres", credito: DEL_PROMOTOR, ancho: 1100, alto: 507 },
        { src: "/proyectos/doral-country/galeria-3.jpg", alt: "Doral Country — fachada de las torres con la piscina y la zona social", credito: DEL_PROMOTOR, ancho: 1100, alto: 506 },
        { src: "/proyectos/doral-country/galeria-4.jpg", alt: "Doral Country — fachada de las torres desde el acceso al condominio", credito: DEL_PROMOTOR, ancho: 1100, alto: 506 },
      ],
      compartir: "/proyectos/doral-country/og.jpg",
      escaparate: {
        src: "/proyectos/doral-country/hero.jpg",
        mini: "/proyectos/doral-country/mini.jpg",
        src1200: "/proyectos/doral-country/escaparate-1200.jpg",
        alt: "Doral Country — torres, piscina y parqueadero del condominio",
        credito: DEL_PROMOTOR,
        ancho: 1920,
        alto: 886,
        enfoque: "50% 55%",
      },
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: "doral-suite",
    nombre: "Doral Suite",
    zona: "Zona Norte",
    promotor: "Doral Suites S.A.S. · NIT 901.602.295-8",
    estado: "entrega inmediata",
    resumen:
      "Apartaestudios aprobados para renta corta dentro del desarrollo Doral. Al corte del 25 de junio de 2026 quedaban siete unidades de sesenta y seis: es inventario final.",
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
        alcobas: "1",
        banos: "1",
        exterior: "Balcón de 6,92 m²",
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
        alcobas: "1",
        banos: "1",
        exterior: "Terraza de 30,92 m²",
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
    tipoInmueble: "apartaestudios",
    // Pasa a true cuando Rafael confirme que el estudio jurídico lo revisó.
    revisionJuridica: false,
    presentacion: {
      linea: "Apartaestudios · aprobados para renta corta",
      // Las cifras y la fecha salen de la misma hoja que `precio`: si cambia
      // la hoja, se cambian aquí también. La escasez va siempre con su corte.
      frase: "Inventario final: 7 de 66 unidades disponibles al corte del 25 de junio de 2026.",
    },
    fotos: {
      tarjeta: {
        src: "/proyectos/doral-suite/escaparate-1200.jpg",
        alt: "Doral Suite — vista aérea del edificio entregado, con los condominios vecinos",
        credito: DEL_PROMOTOR + " · doralcartagena.com",
        ancho: 1200,
        alto: 544,
      },
      galeria: [
        { src: "/proyectos/doral-suite/escaparate-2400.jpg", src1200: "/proyectos/doral-suite/escaparate-1200.jpg", alt: "Doral Suite — vista aérea del edificio entregado, con los condominios vecinos", credito: DEL_PROMOTOR + " · doralcartagena.com", ancho: 2400, alto: 1088 },
        { src: "/proyectos/doral-suite/piscina-2400.jpg", src1200: "/proyectos/doral-suite/piscina-1200.jpg", alt: "Doral Suite — vista aérea del edificio y su piscina junto a la Vía al Mar", credito: DEL_PROMOTOR + " · doralcartagena.com", ancho: 2400, alto: 847 },
        { src: "/proyectos/doral-suite/home.jpg", alt: "Doral Suite — vista aérea del edificio sobre la Vía al Mar", credito: DEL_PROMOTOR + " · brochure Doral Cartagena, pág. 4", ancho: 912, alto: 518 },
        { src: "/proyectos/doral-suite/fotos/01.jpg", alt: "Doral Suite — cocina de un apartaestudio", credito: DEL_PROMOTOR, ancho: 1200, alto: 1600 },
        { src: "/proyectos/doral-suite/fotos/04.jpg", alt: "Doral Suite — espacio principal de un apartaestudio con ventana", credito: DEL_PROMOTOR, ancho: 1200, alto: 1600 },
        { src: "/proyectos/doral-suite/fotos/03.jpg", alt: "Doral Suite — balcón de un apartaestudio con vista a la vía", credito: DEL_PROMOTOR, ancho: 1200, alto: 1600 },
        { src: "/proyectos/doral-suite/fotos/05.jpg", alt: "Doral Suite — alcoba con clóset", credito: DEL_PROMOTOR, ancho: 1600, alto: 900 },
        { src: "/proyectos/doral-suite/fotos/06.jpg", alt: "Doral Suite — baño", credito: DEL_PROMOTOR, ancho: 1600, alto: 900 },
      ],
      compartir: "/proyectos/doral-suite/og.jpg",
      escaparate: {
        src: "/proyectos/doral-suite/escaparate-2400.jpg",
        mini: "/proyectos/doral-suite/mini.jpg",
        src1200: "/proyectos/doral-suite/escaparate-1200.jpg",
        alt: "Doral Suite — vista aérea del edificio entregado, con los condominios vecinos",
        credito: DEL_PROMOTOR + " · doralcartagena.com",
        ancho: 2400,
        alto: 1088,
        enfoque: "48% 55%",
      },
    },
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

/**
 * «$403.000.000». Agrupa a mano, sin `toLocaleString`: el ICU de Node (que
 * arma el HTML en el build) y el del navegador pueden no coincidir, y un
 * precio que cambia al hidratar rompe React (error #418). Mismo resultado
 * que es-CO para enteros.
 */
export function formatoPesos(n: number): string {
  const entero = String(Math.round(n));
  return "$" + entero.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

/**
 * «12 de agosto de 2026» → «2026-08-12». Para los datos estructurados, que
 * piden la fecha en ISO. Si el texto no tiene esa forma, devuelve null y el
 * dato no se publica: una fecha mal leída es una fecha inventada.
 */
export function fechaISO(texto: string): string | null {
  const m = texto.trim().match(/^(\d{1,2}) de ([a-záéíóú]+) de (\d{4})$/i);
  if (!m) return null;
  const mes = MESES.indexOf(m[2].toLowerCase());
  if (mes < 0) return null;
  return `${m[3]}-${String(mes + 1).padStart(2, "0")}-${m[1].padStart(2, "0")}`;
}

/** «desde $403.000.000» o «$525.000.000» si no hay rango. */
export function rangoPrecio(desde: number, hasta: number): string {
  return desde === hasta
    ? formatoPesos(desde)
    : `desde ${formatoPesos(desde)}`;
}
