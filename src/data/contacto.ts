/**
 * DATOS DE CONTACTO — FUENTE ÚNICA
 *
 * Estaban escritos a mano en seis sitios distintos y los seis apuntaban a
 * `573000000000`, un número de relleno que no existe. Cualquiera que le diera
 * al botón de WhatsApp caía en la nada. De aquí en adelante se importan; no se
 * vuelven a escribir sueltos.
 */

/** Formato de wa.me: indicativo + número, sin +, sin espacios. */
export const WHATSAPP = "573008412677";

/** Como se le muestra a una persona. */
export const TELEFONO_VISIBLE = "+57 300 841 2677";

export const CORREO = "rafaelhf.realestate@gmail.com";

export const DIRECCION = "Carrera 14 # 45-27, Km 4, La Boquilla, Cartagena de Indias";

export const RESPONSABLE = "Medardo Rafael Hernández Franco";

/** Enlace de WhatsApp con el mensaje ya escrito. */
export function enlaceWhatsApp(mensaje: string): string {
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(mensaje)}`;
}

export const SALUDO_WHATSAPP = "Hola Rafael, vi tu página y me interesa: ";
