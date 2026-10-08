/**
 * De dónde llega cada persona. Va aparte, sin importar nada, para poder
 * probarlo con `node --test` (crm/test/).
 */

/** Las primeras siete llegan solas desde el sitio; las demás se cargan a mano. */
export const FUENTES: Record<string, string> = {
  formulario: "Formulario de la web",
  vender: "Formulario de /vender",
  guia: "Guía de la web",
  simulador: "Simulador",
  whatsapp: "WhatsApp (agente)",
  chat: "Chat de la web (agente)",
  agente: "Agente (otro canal)",
  instagram: "Instagram",
  facebook: "Facebook",
  feria: "Feria o evento",
  referido: "Referido",
  llamada: "Llamada",
  whatsapp_directo: "WhatsApp directo",
  otro: "Otro",
};

/** Las fuentes que se cargan a mano (alta manual). */
export const FUENTES_MANUALES = ["instagram", "facebook", "feria", "referido", "llamada", "whatsapp_directo", "otro"];

/**
 * La fuente de una consulta del sitio, por su `origen`: la ruta de la página
 * del formulario, «guia-…» en la guía, o «agente:<canal>» en las llamadas que
 * pide el agente.
 */
export function fuenteDeOrigen(origen: string | null | undefined): string {
  const o = (origen ?? "").trim().toLowerCase();
  if (o.startsWith("agente:whatsapp")) return "whatsapp";
  if (o.startsWith("agente:webchat")) return "chat";
  if (o.startsWith("agente:")) return "agente";
  if (o.startsWith("guia-")) return "guia";
  if (o.startsWith("/vender") || o.startsWith("/en/sell")) return "vender";
  if (o.includes("simulador") || o.includes("mortgage-calculator")) return "simulador";
  return "formulario";
}
