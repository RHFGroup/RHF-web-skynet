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
import { ruta, type Idioma } from "@/i18n/idioma";

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
  id: "inicio" | "proyectos" | "simulador" | "vender" | "mercado";
  texto: string;
  href: string;
  enHome?: string;
  destacado?: boolean;
};

export const MENU_PRINCIPAL: EntradaMenu[] = [
  { id: "inicio", texto: "Inicio", href: "/", enHome: "#inicio" },
  { id: "proyectos", texto: "Proyectos", href: "/#proyectos", enHome: "#proyectos" },
  // 30-sep-2026 (fase 4 de los prompts de Luciano): el simulador de compra.
  { id: "simulador", texto: "Simulador", href: "/simulador" },
  { id: "vender", texto: "Quiero vender / consignar", href: "/vender", destacado: true },
  { id: "mercado", texto: "Inteligencia de mercado", href: "/inteligencia-de-mercado" },
];

/**
 * Las mismas listas en el idioma de la página (29-sep-2026, sitio en inglés).
 * En español devuelven los arreglos de arriba sin tocarlos; en inglés, los
 * textos traducidos y las rutas de /en (docs/i18n.md).
 */
const SECCIONES_EN: Record<string, string> = {
  proyectos: "Projects",
  apartamentos: "Apartments",
  asesor: "Your advisor",
  mapa: "The area",
  "paso-a-paso": "How to buy",
  noticias: "Market intelligence",
  redes: "Follow us",
  contacto: "Contact",
};

const MENU_EN: Record<EntradaMenu["id"], string> = {
  inicio: "Home",
  proyectos: "Projects",
  // Corto en el menú, donde caben cinco entradas; la página se llama «Mortgage calculator».
  simulador: "Calculator",
  vender: "Sell or list your property",
  mercado: "Market intelligence",
};

export function seccionesHome(idioma: Idioma): Seccion[] {
  if (idioma === "es") return SECCIONES_HOME;
  return SECCIONES_HOME.map((s) => ({ ...s, texto: SECCIONES_EN[s.ancla] ?? s.texto }));
}

export function menuPrincipal(idioma: Idioma): EntradaMenu[] {
  if (idioma === "es") return MENU_PRINCIPAL;
  return MENU_PRINCIPAL.map((e) => ({ ...e, texto: MENU_EN[e.id], href: ruta(idioma, e.href) }));
}
