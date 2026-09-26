/**
 * INMUEBLES DISPONIBLES — FUENTE ÚNICA
 *
 * Apartamentos puntuales que se venden fuera de la cartera de proyectos
 * nuevos. Pedido de Rafael del 25-sep-2026: una sección aparte debajo de la
 * cartera, cada uno con su ficha y su página, sin decir de quién son.
 *
 * REGLAS (las mismas de la cartera)
 *  · El precio sale solo donde está escrito, con su fecha de corte. Hoy solo
 *    Doral Suites 320 tiene precio (confirmado el 25 de septiembre de 2026;
 *    reemplaza el de la ficha de venta del 6 de marzo de 2026).
 *  · Cada área lleva la etiqueta literal de su fuente: la escritura pública,
 *    el plano oficial o la presentación de venta. Nunca una cifra de la
 *    publicidad cuando el documento dice otra: la ficha de venta de Cavana
 *    decía 167 m²; la escritura dice 120,30 m² de área privada y 136,08 m²
 *    construidos, y eso es lo que se publica.
 *  · Ni matrículas, ni números de escritura, ni datos del propietario.
 *  · Fotos: las propias de cada apartamento, con su fecha. Morros Park solo
 *    tiene material del promotor (renders y planos), y así se rotula. Las
 *    imágenes de las fichas de venta de Cavana y Morros Park no se usan: no
 *    son fotos del apartamento.
 *  · Palabra que no va en el sitio: «fiducia».
 *
 * De dónde sale cada dato: ORGANIZADO_PC/01_PROYECTOS/PROYECTO_INMUEBLES en
 * el Mac de Rafael (inventario del 24-sep-2026) y la nota del vault
 * research/inmuebles-disponibles-en-la-web-que-se-publica-de-cada-
 * apartamento-y-de-donde-sale.
 */
import { formatoPesos, type Foto } from "@/data/proyectos";

export type AreaInmueble = {
  /** La etiqueta tal como la escribe la fuente. */
  etiqueta: string;
  valor: string;
  fuente: string;
};

export type Inmueble = {
  slug: string;
  /** «Doral Suites · apto 320» */
  nombre: string;
  /** El conjunto o proyecto al que pertenece. */
  proyecto: string;
  /** «Zona Norte de Cartagena», «Juan de Acosta, Atlántico»… */
  zona: string;
  /** La ubicación que se publica, sin nomenclatura provisional ni matrícula. */
  ubicacion: string;
  ubicacionFuente: string;
  estado: "Terminado" | "En construcción";
  piso: string;
  /** Como lo dice la fuente: «1», «1 alcoba + estudio», «3». */
  habitaciones: string;
  /** Para la tarjeta: solo el número, si la fuente lo da limpio. */
  habitacionesTarjeta: string | null;
  banos: string;
  banosTarjeta: string | null;
  areas: AreaInmueble[];
  parqueadero: string | null;
  /** La línea de producto de la tarjeta. */
  linea: string;
  /** La frase del reverso de la tarjeta. */
  frase: string;
  descripcion: string[];
  /** Lo que tiene el apartamento, según su documento. */
  dependencias: { texto: string; fuente: string };
  /** Lo que tiene el conjunto, con su fuente. Vacío: el bloque no aparece. */
  conjunto: { items: string[]; fuente: string } | null;
  precio: { valor: number; corte: string; fuente: string } | null;
  /** Foto de la tarjeta (800 px) y galería de la página (1600 px). */
  fotos: (Foto & { tarjeta: string })[];
  plano: (Foto & { fuente: string }) | null;
  /** De dónde sale cada dato, para el bloque «De dónde salen los datos». */
  fuentes: string[];
  /** Imagen para compartir en WhatsApp y redes. */
  compartir: string;
};

const FOTO_PROPIA_FEB = "Foto del apartamento · 28 de febrero de 2026";
const RENDER_MORROS = "Render del promotor · Morros Park, 2023";
const FOTO_AGUAMARINA = "Foto del apartamento · presentación de venta de 2023";

function serie(
  slug: string,
  credito: string,
  fotos: { alt: string; ancho?: number; alto?: number }[],
): (Foto & { tarjeta: string })[] {
  return fotos.map((f, i) => {
    const n = String(i + 1).padStart(2, "0");
    return {
      src: `/inmuebles/${slug}/${n}.jpg`,
      tarjeta: `/inmuebles/${slug}/${n}-800.jpg`,
      alt: f.alt,
      credito,
      ancho: f.ancho ?? 1600,
      alto: f.alto ?? 900,
    };
  });
}

const RENDERS_MORROS = serie("morros-park", RENDER_MORROS, [
  { alt: "Morros Park — vista aérea de los edificios, la piscina y la vegetación (render)", alto: 855 },
  { alt: "Morros Park — piscina entre jardines y palmeras (render)", alto: 855 },
  { alt: "Morros Park — piscina al atardecer frente a los edificios (render)", alto: 855 },
  { alt: "Morros Park — balcón con vista al mar (render)", alto: 855 },
  { alt: "Morros Park — sala con salida al jardín (render)", alto: 855 },
]);

const DESCRIPCION_MORROS =
  "Morros Park es un proyecto de Novus Civitas y Epic diseño+construcción en Serena del Mar, la ciudad planeada de la Zona Norte donde ya funcionan el Hospital Serena del Mar y la sede Caribe de la Universidad de los Andes.";

export const INMUEBLES: Inmueble[] = [
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: "doral-suites-320",
    nombre: "Doral Suites · apto 320",
    proyecto: "Doral Suites",
    zona: "Zona Norte de Cartagena",
    ubicacion: "Doral Suites, Vía al Mar 90A, Zona Norte de Cartagena de Indias",
    ubicacionFuente: "Brochure oficial Doral Cartagena y doralcartagena.com",
    estado: "Terminado",
    piso: "3",
    habitaciones: "1",
    habitacionesTarjeta: "1",
    banos: "1",
    banosTarjeta: "1",
    areas: [
      { etiqueta: "Área privada construida", valor: "35,26 m²", fuente: "Escritura pública del apartamento, julio de 2025" },
      { etiqueta: "Área construida", valor: "39,17 m²", fuente: "Escritura pública del apartamento, julio de 2025" },
    ],
    parqueadero: "Uso exclusivo de un parqueadero asignado",
    linea: "1 habitación · balcón · piso 3",
    frase: "Terminado, con balcón y parqueadero de uso exclusivo, en un proyecto aprobado para renta corta.",
    descripcion: [
      "Apartamento terminado en el piso 3 de Doral Suites, dentro del desarrollo Doral sobre la Vía al Mar: una habitación, un baño, cocina integral, sala-comedor y balcón.",
      "Doral Suites está aprobado para renta corta, según su constructor: sirve para vivir o para rentar por días.",
    ],
    dependencias: {
      texto: "Habitación, baño, cocina integral, sala-comedor, balcón y parqueadero de uso exclusivo",
      fuente: "Plano oficial del apartamento tipo 5 y escritura pública",
    },
    conjunto: {
      items: ["Aprobado para renta corta", "Dentro del desarrollo Doral, sobre la Vía al Mar"],
      fuente: "doralcartagena.com/doral-suites",
    },
    precio: {
      valor: 330_000_000,
      corte: "25 de septiembre de 2026",
      fuente: "Precio de venta confirmado el 25 de septiembre de 2026",
    },
    fotos: serie("doral-suites-320", FOTO_PROPIA_FEB, [
      { alt: "Doral Suites 320 — sala-comedor con la puerta al balcón" },
      { alt: "Doral Suites 320 — balcón con vista a la Vía al Mar" },
      { alt: "Doral Suites 320 — cocina integral" },
      { alt: "Doral Suites 320 — habitación con ventana" },
      { alt: "Doral Suites 320 — clóset de la habitación" },
      { alt: "Doral Suites 320 — baño con ducha en vidrio" },
    ]),
    plano: {
      src: "/inmuebles/doral-suites-320/plano.jpg",
      alt: "Plano del apartamento tipo 5 de Doral Suites: habitación, baño, cocina, sala-comedor y balcón",
      credito: "Plano del constructor · doralcartagena.com",
      fuente: "Plano oficial del apartamento tipo 5 (doralcartagena.com)",
      ancho: 935,
      alto: 898,
    },
    fuentes: [
      "Piso, áreas y parqueadero: escritura pública del apartamento (julio de 2025).",
      "Distribución y balcón: plano oficial del apartamento tipo 5 (doralcartagena.com).",
      "Precio: vigente al 25 de septiembre de 2026.",
      "Renta corta: doralcartagena.com/doral-suites.",
      "Fotos del apartamento: 28 de febrero de 2026.",
    ],
    compartir: "/inmuebles/doral-suites-320/01.jpg",
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: "cavana-303-torre-10",
    nombre: "Cavana · apto 303, torre 10",
    proyecto: "Conjunto Residencial Cavana",
    zona: "Serena del Mar · Zona Norte",
    ubicacion: "Conjunto Residencial Cavana, Serena del Mar, Zona Norte de Cartagena de Indias",
    ubicacionFuente: "Escritura pública del apartamento",
    estado: "Terminado",
    piso: "3",
    habitaciones: "3",
    habitacionesTarjeta: "3",
    banos: "5",
    banosTarjeta: "5",
    areas: [
      { etiqueta: "Área privada", valor: "120,30 m²", fuente: "Escritura pública del apartamento" },
      { etiqueta: "Área construida", valor: "136,08 m²", fuente: "Escritura pública del apartamento" },
    ],
    parqueadero: "Parqueadero privado",
    linea: "3 alcobas · 5 baños · vista al lago · piso 3",
    frase: "Amplio y terminado, con balcones hacia el lago, en Serena del Mar.",
    descripcion: [
      "Apartamento en el piso 3 de la torre 10 del Conjunto Residencial Cavana, en Serena del Mar: salón-comedor, cocina, zona de labores, alacena, hall, tres alcobas, cinco baños y vestier.",
      "Los balcones miran al lago, y el apartamento tiene aire acondicionado. Serena del Mar reúne el Hospital Serena del Mar y la sede Caribe de la Universidad de los Andes.",
    ],
    dependencias: {
      texto: "Salón-comedor, cocina, zona de labores, alacena, hall, tres alcobas, cinco baños, vestier y balcones",
      fuente: "Escritura pública del apartamento",
    },
    conjunto: null,
    precio: null,
    fotos: serie("cavana-303-torre-10", FOTO_PROPIA_FEB, [
      { alt: "Cavana 303 — balcón con vista al lago" },
      { alt: "Cavana 303 — sala con el ventanal hacia el lago" },
      { alt: "Cavana 303 — sala y cocina con isla" },
      { alt: "Cavana 303 — cocina integral" },
      { alt: "Cavana 303 — vista del lago desde el balcón" },
      { alt: "Cavana 303 — alcoba con clóset" },
      { alt: "Cavana 303 — vestier" },
      { alt: "Cavana 303 — baño" },
    ]),
    plano: null,
    fuentes: [
      "Piso, torre, dependencias y áreas: escritura pública del apartamento.",
      "Vista al lago y aire acondicionado: fotos del apartamento del 28 de febrero de 2026.",
    ],
    compartir: "/inmuebles/cavana-303-torre-10/01.jpg",
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: "morros-park-421",
    nombre: "Morros Park · apto 421",
    proyecto: "Morros Park",
    zona: "Serena del Mar · Zona Norte",
    ubicacion: "Morros Park, Serena del Mar, Zona Norte de Cartagena de Indias",
    ubicacionFuente: "Book digital de Morros Park (enero de 2023)",
    estado: "En construcción",
    piso: "4",
    habitaciones: "1 alcoba + estudio (el estudio puede ser la alcoba 2)",
    habitacionesTarjeta: null,
    banos: "2",
    banosTarjeta: "2",
    areas: [
      { etiqueta: "Área Privada construida", valor: "67,20 m²", fuente: "Plano oficial del apartamento 421, diciembre de 2022" },
      { etiqueta: "Área Total", valor: "81,00 m²", fuente: "Plano oficial: área interna de 71,80 m² y balcón de 9,20 m²" },
    ],
    parqueadero: "Un parqueadero, por asignar",
    linea: "1 alcoba + estudio · 2 baños · balcón · piso 4",
    frase: "En construcción en Serena del Mar, con balcón y un estudio que puede ser la segunda alcoba.",
    descripcion: [
      "Apartamento en construcción en el piso 4 de Morros Park: una alcoba más estudio —que puede ser la segunda alcoba—, dos baños y balcón.",
      DESCRIPCION_MORROS,
    ],
    dependencias: {
      texto: "Una alcoba, estudio, dos baños, sala-comedor, cocina y balcón",
      fuente: "Plano oficial del apartamento 421 (diciembre de 2022)",
    },
    conjunto: null,
    precio: null,
    fotos: RENDERS_MORROS,
    plano: {
      src: "/inmuebles/morros-park-421/plano.jpg",
      alt: "Plano del apartamento 421 de Morros Park: alcoba, estudio, dos baños y balcón",
      credito: "Plano oficial del promotor · diciembre de 2022",
      fuente: "Plano oficial del apartamento 421 (diciembre de 2022)",
      ancho: 1600,
      alto: 1042,
    },
    fuentes: [
      "Distribución y áreas: plano oficial del apartamento 421 (diciembre de 2022).",
      "Parqueadero: documento de compra del apartamento.",
      "Promotores e imágenes: book digital de Morros Park (enero de 2023). Las imágenes son renders.",
    ],
    compartir: "/inmuebles/morros-park/01.jpg",
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: "morros-park-519",
    nombre: "Morros Park · apto 519",
    proyecto: "Morros Park",
    zona: "Serena del Mar · Zona Norte",
    ubicacion: "Morros Park, Serena del Mar, Zona Norte de Cartagena de Indias",
    ubicacionFuente: "Book digital de Morros Park (enero de 2023)",
    estado: "En construcción",
    piso: "5",
    habitaciones: "1 alcoba + estudio (el estudio puede ser la alcoba 2)",
    habitacionesTarjeta: null,
    banos: "2",
    banosTarjeta: "2",
    areas: [
      { etiqueta: "Área Privada construida", valor: "66,70 m²", fuente: "Plano oficial del apartamento 519, diciembre de 2022" },
      { etiqueta: "Área Total", valor: "82,00 m²", fuente: "Plano oficial: área interna de 71,80 m² y balcón de 10,20 m²" },
    ],
    parqueadero: null,
    linea: "1 alcoba + estudio · 2 baños · balcón · piso 5",
    frase: "En construcción en Serena del Mar, en el piso 5, con balcón de 10,20 m².",
    descripcion: [
      "Apartamento en construcción en el piso 5 de Morros Park: una alcoba más estudio —que puede ser la segunda alcoba—, dos baños y balcón de 10,20 m².",
      DESCRIPCION_MORROS,
    ],
    dependencias: {
      texto: "Una alcoba, estudio, dos baños, sala-comedor, cocina y balcón",
      fuente: "Plano oficial del apartamento 519 (diciembre de 2022)",
    },
    conjunto: null,
    precio: null,
    fotos: RENDERS_MORROS,
    plano: {
      src: "/inmuebles/morros-park-519/plano.jpg",
      alt: "Plano del apartamento 519 de Morros Park: alcoba, estudio, dos baños y balcón",
      credito: "Plano oficial del promotor · diciembre de 2022",
      fuente: "Plano oficial del apartamento 519 (diciembre de 2022)",
      ancho: 1600,
      alto: 1042,
    },
    fuentes: [
      "Distribución y áreas: plano oficial del apartamento 519 (diciembre de 2022).",
      "Promotores e imágenes: book digital de Morros Park (enero de 2023). Las imágenes son renders.",
    ],
    compartir: "/inmuebles/morros-park/01.jpg",
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: "aguamarina-803",
    nombre: "Agua Marina Beach Resort · apto 803",
    proyecto: "Agua Marina Beach Resort",
    zona: "Juan de Acosta, Atlántico",
    ubicacion: "Agua Marina Beach Resort, Juan de Acosta, Atlántico",
    ubicacionFuente: "Presentación de venta del apartamento (octubre de 2023)",
    estado: "Terminado",
    piso: "8, con ascensor",
    habitaciones: "3",
    habitacionesTarjeta: "3",
    banos: "2 baños y 1 baño social",
    banosTarjeta: "3",
    areas: [{ etiqueta: "Área", valor: "167,30 m²", fuente: "Presentación de venta del apartamento, octubre de 2023" }],
    parqueadero: "Parqueadero privado",
    linea: "3 habitaciones · estudio · terraza con vista al mar · piso 8",
    frase: "En un condominio privado frente al mar, con una gran terraza que mira al Caribe desde el piso 8.",
    descripcion: [
      "Apartamento en el piso 8, con ascensor, en Agua Marina Beach Resort: un condominio privado frente al mar en Juan de Acosta, Atlántico.",
      "Tiene tres habitaciones, dos baños más baño social, estudio, sala-comedor, cocina tipo americana, zona de labores y una gran terraza con vista al mar.",
    ],
    dependencias: {
      texto:
        "Tres habitaciones, dos baños y baño social, estudio, sala-comedor, cocina tipo americana, zona de labores, terraza con vista al mar y parqueadero privado",
      fuente: "Presentación de venta del apartamento (octubre de 2023)",
    },
    conjunto: {
      items: [
        "Condominio privado frente al mar",
        "Vigilancia privada con CCTV",
        "Piscinas y jacuzzis",
        "Zonas húmedas",
        "Gimnasios",
        "Minimarket y restaurante",
        "Zonas infantiles",
        "Senderos para caminar",
      ],
      fuente: "Presentación de venta del apartamento (octubre de 2023)",
    },
    precio: null,
    fotos: serie("aguamarina-803", FOTO_AGUAMARINA, [
      { alt: "Agua Marina 803 — terraza con vista al mar y a las piscinas del condominio" },
      { alt: "Agua Marina 803 — atardecer desde la terraza" },
      { alt: "Agua Marina 803 — sala-comedor", ancho: 1383, alto: 778 },
      { alt: "Agua Marina 803 — cocina tipo americana", ancho: 1350, alto: 895 },
      { alt: "Agua Marina 803 — habitación principal" },
      { alt: "Agua Marina Beach Resort — edificios del condominio", alto: 1067 },
    ]),
    plano: null,
    fuentes: [
      "Piso, área, dependencias y condominio: presentación de venta del apartamento (octubre de 2023).",
      "Fotos: presentación de venta de 2023.",
    ],
    compartir: "/inmuebles/aguamarina-803/01.jpg",
  },
];

export function getInmueble(slug: string): Inmueble | undefined {
  return INMUEBLES.find((i) => i.slug === slug);
}

/** «$330.000.000» o «Consultar». */
export function precioInmueble(i: Inmueble): { texto: string; corte: string | null } {
  return i.precio ? { texto: formatoPesos(i.precio.valor), corte: i.precio.corte } : { texto: "Consultar", corte: null };
}
