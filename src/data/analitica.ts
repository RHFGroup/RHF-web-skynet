/**
 * LA ANALÍTICA (29-sep-2026, informe de Luciano: «Data Layer, Pixel y GA4»).
 *
 * La web solo carga Google Tag Manager. GA4 y el píxel de Meta se configuran
 * DENTRO del contenedor de GTM (importable desde
 * docs/analitica/gtm-contenedor-rhfliving.json), no aquí: así se cambian sin
 * tocar el código.
 *
 * Mientras GTM_ID esté vacío no se carga nada: ni GTM, ni el aviso de cookies.
 * Se llena con el id del contenedor («GTM-XXXXXXX») cuando exista.
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
 *    En GTM, cada uno es un activador de «Evento personalizado».
 */
export const GTM_ID = "";

/** Versión del texto del aviso de cookies. Cambiarla al cambiar el texto. */
export const VERSION_AVISO_COOKIES = "2026-09-29";

export const CLAVE_CONSENTIMIENTO = "rhf-consentimiento";
