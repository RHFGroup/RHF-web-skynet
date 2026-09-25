/**
 * Modo revisión: lo que está propuesto y todavía no confirmado.
 *
 * Varias piezas del sitio esperan la confirmación de Rafael: los servicios
 * del estudio jurídico, los pasos de compra, la frase de propuesta de valor.
 * No se publican sin su OK, pero él tiene que VERLAS para darlo.
 *
 * La salida: las vistas previas de Cloudflare (cualquier rama que no sea
 * master) se arman en modo revisión y muestran lo propuesto con una etiqueta
 * «Propuesta · por confirmar». El build de master —el que publica— lo deja
 * fuera. Así, si una propuesta llega a master sin confirmar, no sale.
 *
 * La señal es `WORKERS_CI_BRANCH`, que Workers Builds define en cada build
 * (ver next.config.ts). En local no existe: para ver las propuestas se arma
 * con `MODO_REVISION=1 npm run build`.
 */
export const MODO_REVISION = process.env.NEXT_PUBLIC_MODO_REVISION === "1";

/** ¿Se muestra este elemento? Confirmado, siempre; propuesto, solo en revisión. */
export function seMuestra(item: { confirmado: boolean }): boolean {
  return item.confirmado || MODO_REVISION;
}
