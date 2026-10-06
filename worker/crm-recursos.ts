/**
 * La hoja de estilos, el script y las fuentes del CRM (crm/public), embebidos
 * en el Worker con las reglas de módulos de wrangler.jsonc («Text» y «Data»).
 *
 * No van en `out/` con el resto del sitio: ahí serían públicos en una
 * dirección conocida. Embebidos, solo existen bajo la ruta secreta del CRM.
 */
import css from "../crm/public/crm.css";
import js from "../crm/public/crm.js";
import cormorant from "../crm/public/fuentes/cormorant-garamond.woff2";
import montserrat from "../crm/public/fuentes/montserrat.woff2";
import type { Recursos } from "../crm/src/env";

export const RECURSOS_CRM: Recursos = {
  css,
  js,
  fuentes: { "cormorant-garamond": cormorant, montserrat },
};
