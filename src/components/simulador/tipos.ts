/**
 * Los tipos de la página del simulador: lo que llega del servidor y el
 * estado de la persona. Sin lógica.
 */
import type { Modalidad } from "@/lib/simulador/compra";

/**
 * Un proyecto o inmueble de la cartera, ya armado en el servidor desde
 * src/data (ver cartera.ts). Llega al navegador como texto y números.
 */
export type ItemSimulador = {
  slug: string;
  nombre: string;
  /** El nombre en español: es el que Rafael lee en el aviso de un lead, desde cualquier idioma. */
  nombreEs: string;
  tipo: "proyecto" | "inmueble";
  /** La página propia, ya en el idioma de la página. */
  href: string;
  zona: string;
  /** El estado para mostrar: «en construcción», «Terminado», «Ready to move in»… */
  estado: string;
  /** Precio desde, solo si se puede publicar (Circular 004). null: «Consultar». */
  precio: number | null;
  /** Fecha de corte del precio, en texto del idioma de la página. */
  corte: string | null;
  /**
   * Meses hasta la entrega: 0 si la entrega es inmediata o el inmueble está
   * terminado; null si la fuente no publica la fecha (el simulador usa un
   * supuesto y lo marca).
   */
  meses: number | null;
  /** Fuente de la renta corta aprobada, o null si no la tiene. */
  rentaCorta: string | null;
};

export type Proposito = "vivir" | "invertir" | "ambas";
/** Cuándo piensa comprar (precalificación). */
export type Cuando = "0-3" | "3-6" | "6-12" | "12+";
/** De dónde vienen sus ingresos (precalificación). */
export type TipoIngreso = "empleado" | "independiente" | "pensionado" | "exterior";
export type Pestana = "compra" | "financiacion" | "gastos" | "beneficios" | "inversion" | "escenarios";

/** Todo lo que la persona puede mover. Las cifras en pesos; las tasas como fracción. */
export type EstadoSim = {
  vista: "inicio" | "experto";
  inicioPorCuota: boolean;
  proposito: Proposito;
  ingreso: number;
  conCodeudor: boolean;
  ingresoCodeudor: number;
  otrasDeudas: number;
  ahorros: number;
  cesantias: number;
  ahorroMensual: number;
  cuotaDeseada: number;
  /** Slug del inmueble elegido; "" = otro precio. */
  item: string;
  precio: number;
  separacion: number;
  meses: number;
  esVIS: boolean;
  modalidad: Modalidad;
  pctFinanciado: number;
  plazoAnios: number;
  tasa: number;
  /** Tasa real del crédito en UVR. null: la persona todavía no la escribe. */
  tasaUVR: number | null;
  inflacion: number;
  opcionCompra: number;
  seguros: boolean;
  abonoAnual: number;
  abonoMensual: number;
  abonoDesde: number;
  abonoReduce: "plazo" | "cuota";
  estudio: number;
  /** null = «No sé». */
  tarifaMarginal: number | null;
  exterior: boolean;
  monedaExterior: "USD" | "EUR";
  ingresoExterior: number;
  /** Pesos por unidad de la moneda del exterior. */
  tasaCambio: number;
  tarifaNocheUSD: number;
  ocupacion: number;
  comision: number;
  administracion: number;
  predial: number;
  servicios: number;
  dotacion: number;
  canon: number;
  arriendo: number;
  valorizacion: number;
  pestana: Pestana;
  /** Las claves que la persona cambió: su etiqueta pasa a «Tu dato». */
  editados: string[];
};
