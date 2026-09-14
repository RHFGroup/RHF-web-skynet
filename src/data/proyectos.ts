/**
 * CAPA DE DATOS ÚNICA DE LA CARTERA
 * =================================
 *
 * Todo lo que se publica de un proyecto —la web, el feed del catálogo de
 * WhatsApp y lo que responde el agente— sale de aquí. Actualizar un proyecto
 * es editar un objeto, no cinco archivos.
 *
 * REGLAS QUE NO SE NEGOCIAN
 *
 * 1. Cada dato lleva su FUENTE TEXTUAL y su FECHA. Un área se cita con la
 *    etiqueta que usa la fuente ("Área construida", "Área de ocupación"),
 *    nunca traducida a "área privada construida", que es un concepto legal
 *    distinto (art. 3, Ley 675 de 2001).
 *
 * 2. `precio` existe pero NO se renderiza mientras `circular004.completo`
 *    sea false. Decisión del vault `bloque-legal-circular-004-obligatorio-en-
 *    piezas-publicas` (aplicada, 1-sep-2026): toda pieza pública CON precio
 *    exige los diez datos de la Circular 004 de 2024 de la SIC. Hoy ningún
 *    proyecto los tiene. El día que estén, se pone `completo: true` y el
 *    precio aparece solo — en la web y en el catálogo a la vez.
 *
 * 3. Si dos fuentes se contradicen, NO se elige una en silencio: el dato
 *    queda en `conflictos` y no se publica hasta que la constructora aclare.
 */

export type Dato = {
  label: string;
  valor: string;
  /** De dónde salió, textual. Sin esto el dato no se publica. */
  fuente: string;
};

export type Conflicto = {
  dato: string;
  versiones: { valor: string; fuente: string }[];
};

/** Los diez datos que exige el numeral 2.16 de la Circular 004 de 2024 (SIC). */
export type Circular004 = {
  direccionExacta: boolean;
  estrato: boolean;
  parqueadero: boolean;
  fechaEntrega: boolean;
  areaPrivadaConstruida: boolean;
  precioReferencia: boolean;
  administracion: boolean;
  acabados: boolean;
  planEtapas: boolean;
  desistimiento: boolean;
};

export type Proyecto = {
  slug: string;
  nombre: string;
  zona: string;
  promotor: string;
  estado: "en lanzamiento" | "en construcción" | "entrega inmediata";
  resumen: string;
  tipologias: { titulo: string; detalle: string; fuente: string }[];
  amenidades: string[];
  datos: Dato[];
  ubicacion: string;
  ubicacionFuente: string;
  conflictos: Conflicto[];
  /** Páginas del brochure como imágenes web, en orden. */
  brochurePaginas: number;
  brochurePdf: string | null;
  /** Precio: cargado, pero bloqueado hasta completar la Circular 004. */
  precio: {
    desde: number;
    hasta: number;
    moneda: "COP";
    unidadesDisponibles: number;
    corte: string;
    fuente: string;
  } | null;
  circular004: Circular004 & { completo: boolean; faltan: string[] };
};

const SIN_CUMPLIR: Circular004 = {
  direccionExacta: false,
  estrato: false,
  parqueadero: false,
  fechaEntrega: false,
  areaPrivadaConstruida: false,
  precioReferencia: false,
  administracion: false,
  acabados: false,
  planEtapas: false,
  desistimiento: false,
};

function evaluar(c: Circular004): Circular004 & { completo: boolean; faltan: string[] } {
  const etiquetas: Record<keyof Circular004, string> = {
    direccionExacta: "dirección exacta",
    estrato: "estrato",
    parqueadero: "naturaleza del parqueadero",
    fechaEntrega: "fecha estimada de entrega",
    areaPrivadaConstruida: "área privada construida",
    precioReferencia: "precio de referencia",
    administracion: "cuota de administración estimada",
    acabados: "muebles, equipos y acabados",
    planEtapas: "plan de etapas y zonas comunes",
    desistimiento: "valor de desistimiento",
  };
  const faltan = (Object.keys(etiquetas) as (keyof Circular004)[])
    .filter((k) => !c[k])
    .map((k) => etiquetas[k]);
  return { ...c, completo: faltan.length === 0, faltan };
}

export const PROYECTOS: Proyecto[] = [
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
          "3 alcobas, 2 baños, sala, comedor, cocina y zona de labores. Lote de 250 m² y 75 m² de área construida, con opción de ampliación a segundo piso y terraza.",
        fuente: "Brochure oficial Blue Garden 2026, pág. 12",
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
      { label: "Área construida", valor: "75 m²", fuente: "Brochure oficial, pág. 12" },
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
      fuente: "LISTADO DE PRECIO Y DISPONIBILIDAD, hoja «Blue Garden Disponibilidades»",
    },
    circular004: evaluar({
      ...SIN_CUMPLIR,
      precioReferencia: true,
      acabados: true,
      parqueadero: true,
    }),
  },
  {
    slug: "doral-country",
    nombre: "Doral Country",
    zona: "Zona Norte",
    promotor: "Doral Cartagena · Grupo Brieva en alianza con Grupo Rincón",
    estado: "en lanzamiento",
    resumen:
      "Seis torres de conjunto cerrado sobre la Vía al Mar, con cuatro tipologías entre 42 y 70 m², ascensor por torre y diez unidades por piso. Es el lanzamiento más reciente de la cartera.",
    tipologias: [
      {
        titulo: "Tipología A — primer piso",
        detalle: "2 habitaciones, 2 baños y terraza. «ÁREA: 50 m²».",
        fuente: "doralcartagena.com/country, consultada el 14-sep-2026",
      },
      {
        titulo: "Tipología B — primer piso",
        detalle: "3 habitaciones, 2 baños y terraza. «ÁREA: 70 m²».",
        fuente: "doralcartagena.com/country, consultada el 14-sep-2026",
      },
      {
        titulo: "Tipología C — pisos 2 al 5",
        detalle: "2 habitaciones, 2 baños y balcón. «ÁREA: 42 m²».",
        fuente: "doralcartagena.com/country, consultada el 14-sep-2026",
      },
      {
        titulo: "Tipología D — pisos 2 al 5",
        detalle: "3 habitaciones, 2 baños y balcón. «ÁREA: 63 m²».",
        fuente: "doralcartagena.com/country, consultada el 14-sep-2026",
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
      { label: "Rango de áreas", valor: "42 – 70 m²", fuente: "doralcartagena.com/country" },
      { label: "Parqueadero", valor: "Comunal", fuente: "doralcartagena.com/country" },
    ],
    ubicacion: "Vía al mar 90A, Cartagena de Indias",
    ubicacionFuente: "doralcartagena.com/country, consultada el 14-sep-2026",
    conflictos: [],
    brochurePaginas: 15,
    brochurePdf: "/proyectos/doral-country/brochure.pdf",
    precio: null,
    circular004: evaluar({
      ...SIN_CUMPLIR,
      direccionExacta: true,
      parqueadero: true,
    }),
  },
];

export function getProyecto(slug: string): Proyecto | undefined {
  return PROYECTOS.find((p) => p.slug === slug);
}

/** Un proyecto solo muestra precio cuando los diez datos están completos. */
export function puedePublicarPrecio(p: Proyecto): boolean {
  return p.precio !== null && p.circular004.completo;
}
