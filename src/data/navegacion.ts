/**
 * Las secciones de la home, en su orden, para el menú, el menú del teléfono
 * y el pie. Un solo lugar: si cambia el orden de la home (page.tsx), cambia
 * aquí y todos los menús lo siguen.
 *
 * `proyectos` y `apartamentos` llevan a la cartera ya filtrada (Cartera.tsx).
 * 25-sep-2026: orden nuevo, según el de las inmobiliarias que más venden:
 * primero la oferta, después quién asesora, el territorio, cómo se compra, las
 * redes y el contacto.
 */
export type Seccion = { ancla: string; texto: string; soloMovil?: boolean };

export const SECCIONES_HOME: Seccion[] = [
  { ancla: "proyectos", texto: "Proyectos" },
  { ancla: "apartamentos", texto: "Apartamentos" },
  { ancla: "asesor", texto: "Quién te asesora" },
  { ancla: "mapa", texto: "El territorio" },
  { ancla: "paso-a-paso", texto: "Cómo comprar" },
  { ancla: "redes", texto: "Nuestras redes", soloMovil: true },
  { ancla: "contacto", texto: "Contacto" },
];
