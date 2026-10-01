/**
 * Tipos compartidos del simulador.
 *
 * Los avisos viajan como código y números, no como texto: la página los
 * escribe en español o en inglés, con la norma que corresponde.
 */

export type CodigoAviso =
  /** Se marcó VIS pero el precio pasa del tope VIS del municipio. */
  | "vis-supera-tope"
  /** El crédito hipotecario pasa del tope legal de financiación. Sugerencia: leasing. */
  | "credito-financiacion-max"
  /** El leasing pasa del máximo que ofrecen hoy las entidades. */
  | "leasing-financiacion-max"
  /** El plazo pasa del máximo que ofrecen hoy las entidades. */
  | "plazo-max"
  /** El plazo pasa del máximo para colombianos en el exterior (referencia de una entidad). */
  | "plazo-max-exterior"
  /** El plazo es menor que el mínimo legal de 5 años. */
  | "plazo-min";

export type Aviso = {
  codigo: CodigoAviso;
  /** El campo corregido. */
  campo: string;
  antes: number;
  despues: number;
  limite: number;
  /** Qué probar en su lugar. */
  sugerencia?: "leasing";
};
