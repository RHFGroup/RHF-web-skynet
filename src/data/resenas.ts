/**
 * Las reseñas de clientes que se publican en la home.
 *
 * 28-sep-2026: Rafael pidió la sección. Todavía no hay reseñas publicables,
 * así que la sección invita a dejar una por WhatsApp y esta lista va vacía.
 *
 * Reglas:
 *  · Solo reseñas reales, de clientes que Rafael asesoró, con su autorización
 *    escrita para publicarla (fecha y medio en `autorizacion`). Una reseña
 *    inventada o retocada es publicidad engañosa (Ley 1480 de 2011) y la SIC
 *    la sanciona.
 *  · El texto va tal como lo escribió la persona; solo se corrigen tildes si
 *    ella lo aprueba.
 *  · El nombre, como la persona lo autorice: «María G.» o solo iniciales. Sin
 *    teléfonos, correos ni fotos sin permiso (Ley 1581 de 2012).
 *  · Apenas haya una, aparece sola en la sección, arriba de la invitación.
 */
export type Resena = {
  nombre: string;
  texto: string;
  /** AAAA-MM-DD, cuando la escribió. */
  fecha: string;
  /** El proyecto o el tipo de asesoría, si la persona lo menciona. */
  sobre?: string;
  autorizacion: { fecha: string; medio: string };
};

export const RESENAS: Resena[] = [];
