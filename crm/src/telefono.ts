/**
 * Teléfonos y correos, para reconocer a la misma persona aunque escriba distinto.
 *
 * El teléfono se lleva a E.164 (+573001234567): «300 123 4567», «3001234567»,
 * «+57 300 1234567» y «573001234567» son el mismo número. El correo va en
 * minúsculas y sin espacios.
 */

/** Lleva un teléfono a E.164, o null si no hay cómo saber de qué país es. */
export function telefonoE164(texto: string | null | undefined): string | null {
  if (!texto) return null;
  const t = texto.trim();
  if (!t || t.includes("@")) return null;
  const conMas = t.startsWith("+") || t.startsWith("00");
  let d = t.replace(/\D/g, "");
  if (t.startsWith("00")) d = d.slice(2);
  if (conMas) return d.length >= 8 && d.length <= 15 ? `+${d}` : null;
  // Colombia sin indicativo: celulares (3xx) y fijos nuevos (60x), 10 dígitos.
  if (d.length === 10 && (d.startsWith("3") || d.startsWith("60"))) return `+57${d}`;
  // Colombia con indicativo, sin el «+».
  if (d.length === 12 && d.startsWith("57")) return `+${d}`;
  // Más de 10 dígitos sin «+»: casi siempre trae el indicativo del país.
  if (d.length >= 11 && d.length <= 15) return `+${d}`;
  return null;
}

/** El correo en minúsculas y sin espacios, o null si no parece un correo. */
export function correoNormal(texto: string | null | undefined): string | null {
  if (!texto) return null;
  const c = texto.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c) ? c : null;
}

/** Separa el campo «contacto» de una consulta en teléfono y correo. */
export function separarContacto(texto: string | null | undefined): {
  telefono: string | null;
  correo: string | null;
  crudo: string | null;
} {
  const t = (texto ?? "").trim();
  const correo = correoNormal(t);
  if (correo) return { telefono: null, correo, crudo: null };
  const telefono = telefonoE164(t);
  return { telefono, correo: null, crudo: telefono ? null : t || null };
}

/** El enlace de WhatsApp para un teléfono E.164: https://wa.me/573001234567. */
export function enlaceWhatsApp(telefono: string | null, texto?: string): string | null {
  if (!telefono) return null;
  const base = `https://wa.me/${telefono.replace(/\D/g, "")}`;
  return texto ? `${base}?text=${encodeURIComponent(texto)}` : base;
}
