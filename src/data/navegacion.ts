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
  // 28-sep-2026: las noticias tienen su bloque en la home y su página.
  // 29-sep-2026 (informe de Luciano): la sección se llama «Inteligencia de
  // mercado» y su página es /inteligencia-de-mercado (/noticias redirige).
  { ancla: "noticias", texto: "Inteligencia de mercado", soloMovil: true },
  { ancla: "redes", texto: "Nuestras redes", soloMovil: true },
  { ancla: "contacto", texto: "Contacto" },
];

/**
 * EL MENÚ PRINCIPAL (29-sep-2026, informe de Luciano).
 *
 * La barra de arriba ya no repite las secciones de la home: lleva cuatro
 * entradas, en este orden, y a la derecha el selector de moneda.
 *
 *  1. Inicio.
 *  2. Proyectos: la cartera de la home (los precios en pesos, con la
 *     referencia en dólares si la persona la pide).
 *  3. Quiero vender / consignar: botón destacado, en otro color, a /vender
 *     (formulario y WhatsApp con el mensaje ya escrito).
 *  4. Inteligencia de mercado: la sección de noticias, con otro nombre.
 *     Cada noticia sigue con su fuente y su fecha: el nombre cambia, la
 *     atribución no.
 *
 * Las secciones de la home siguen en SECCIONES_HOME, para el pie de página.
 * `enHome` es el destino cuando la persona ya está en la home.
 */
export type EntradaMenu = {
  id: "inicio" | "proyectos" | "vender" | "mercado";
  texto: string;
  href: string;
  enHome?: string;
  destacado?: boolean;
};

export const MENU_PRINCIPAL: EntradaMenu[] = [
  { id: "inicio", texto: "Inicio", href: "/", enHome: "#inicio" },
  { id: "proyectos", texto: "Proyectos", href: "/#proyectos", enHome: "#proyectos" },
  { id: "vender", texto: "Quiero vender / consignar", href: "/vender", destacado: true },
  { id: "mercado", texto: "Inteligencia de mercado", href: "/inteligencia-de-mercado" },
];
