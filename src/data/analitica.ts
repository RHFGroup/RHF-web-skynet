/**
 * LA ANALÍTICA (29-sep-2026, informe de Luciano: «Data Layer, Pixel y GA4»).
 *
 * Se mide de UNA de dos maneras:
 *  · Con contenedor de Google Tag Manager (GTM_ID): la web solo carga GTM, y
 *    GA4 y el píxel de Meta se configuran DENTRO del contenedor (importable
 *    desde docs/analitica/gtm-contenedor-rhfliving.json): así se cambian sin
 *    tocar el código. GTM_ID se llena con el id («GTM-XXXXXXX») cuando exista.
 *  · Sin contenedor (1-oct-2026, pedido de Rafael): la web carga GA4 directo,
 *    con la etiqueta de Google (gtag.js) y GA4_ID, y le pasa los eventos de la
 *    capa de datos (src/components/Analitica.tsx). El día que GTM_ID tenga
 *    valor, GA4_ID se vacía y GA4 se configura en el contenedor: con los dos,
 *    cada visita se contaría dos veces.
 *
 * Mientras los dos estén vacíos no se carga nada: ni la medición, ni el aviso
 * de cookies.
 *
 * Las reglas:
 *  · Nada se carga sin autorización (Ley 1581 de 2012: previa, expresa e
 *    informada). El aviso de cookies pregunta; «Rechazar» vale igual que
 *    «Aceptar». La decisión se guarda en el navegador con su versión, y se
 *    cambia en «Preferencias de cookies», al pie.
 *  · Los eventos que la página empuja a la capa de datos (dataLayer), con los
 *    nombres y parámetros del informe:
 *      click_whatsapp      method, type = "lead_inmobiliario", link_url, page_path, ubicacion
 *      descarga_brochure   file_name, project_name, link_url, page_path
 *      click_quiero_vender ubicacion (menú, menú del teléfono, pie)
 *      lead_consignar      metodo (formulario | whatsapp), tipo_inmueble → el «Lead» de Meta
 *      generate_lead       formulario = "contacto", proyecto
 *      cambio_moneda       moneda
 *    En GTM, cada uno es un activador de «Evento personalizado». Con GA4
 *    directo, cada uno llega a GA4 como evento, con los mismos parámetros.
 */
export const GTM_ID = "";

/**
 * El flujo web de rhfliving.com en GA4. Se usa solo mientras GTM_ID esté vacío.
 * Desde el 1-oct-2026 es G-NVZVX1E69Q, el que pasó Rafael; antes era G-WPZ0XN2C6J.
 */
export const GA4_ID: string = "G-NVZVX1E69Q";

/** ¿Hay con qué medir? Sin GTM ni GA4 no se carga nada ni se pregunta por las cookies. */
export const HAY_ANALITICA = Boolean(GTM_ID || GA4_ID);

/** Versión del texto del aviso de cookies. Cambiarla al cambiar el texto. */
export const VERSION_AVISO_COOKIES = "2026-09-29";

export const CLAVE_CONSENTIMIENTO = "rhf-consentimiento";
