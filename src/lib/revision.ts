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

/**
 * ¿Se muestra este elemento? Solo si está confirmado, en producción y en las
 * vistas previas.
 *
 * 25-sep-2026: Rafael pidió sacar la marca «Propuesta · por confirmar» y dejar
 * la web lista. Desde entonces las vistas previas muestran lo mismo que se
 * publica: lo que no está confirmado no sale en ninguna parte, y la marca ya
 * no aparece. `MODO_REVISION` queda para quien quiera volver a usarlo.
 */
export function seMuestra(item: { confirmado: boolean }): boolean {
  return item.confirmado;
}
