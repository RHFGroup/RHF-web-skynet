# Analítica de rhfliving.com: GTM, GA4 y píxel de Meta

La web mide con Google Tag Manager o, mientras no haya contenedor, con GA4 directo; en los dos casos, solo si la persona acepta el aviso de cookies. Con GTM, GA4 y el píxel de Meta viven **dentro** del contenedor, así que se cambian sin tocar el código. Mientras `GTM_ID` y `GA4_ID` estén vacíos en `src/data/analitica.ts` no se carga nada: ni la medición ni el aviso.

## Mientras no haya contenedor: GA4 directo (1-oct-2026)

Rafael creó la propiedad de GA4 antes que el contenedor de GTM. El flujo web es `G-NVZVX1E69Q`: el mismo 1-oct reemplazó al primero, `G-WPZ0XN2C6J`. Mientras `GTM_ID` esté vacío, la web carga GA4 directo con la etiqueta de Google (`gtag.js`) y `GA4_ID` (`src/data/analitica.ts`), con la misma regla: nada se carga sin «Aceptar» en el aviso de cookies.

- **Los eventos** de la capa de datos (`click_whatsapp`, `generate_lead`, `simulator_*`…) llegan a GA4 con los mismos nombres y parámetros: `src/components/Analitica.tsx` los pasa con `gtag("event", …)`.
- **Lo que GA4 mide solo** (medición mejorada): páginas vistas, también al navegar dentro del sitio, desplazamiento, clics salientes, descargas y formularios.
- **Lo que se probó el 1-oct**, en Chrome, interceptando cada envío a GA4 sin dejarlo salir:
  - la dirección (`page_location`) va sin el «#», y un cambio solo del «#» no es página vista: el escenario del simulador no sale;
  - los clics salientes llevan el enlace completo, con el texto de WhatsApp. Los enlaces de WhatsApp del simulador detienen el clic antes de que GA4 lo escuche (`sinClicSalienteDeGA4`);
  - el destino de un formulario sin `action` es la dirección con el «#». El formulario del simulador lleva `action` y `method` explícitos.
- **El día que exista el contenedor:** poner su ID en `GTM_ID` y vaciar `GA4_ID` en el mismo PR. Con los dos, cada visita se contaría dos veces.
- **En GA4**, *Administrar → Eventos*: marcar `generate_lead` y `lead_consignar` como eventos clave.

## Cómo dejarlo andando (una vez)

1. **GA4.** En analytics.google.com, crear la propiedad «RHF Living» (zona horaria Bogotá, moneda COP) y un flujo web para `https://rhfliving.com`. Anotar el **ID de medición** (`G-…`).
2. **Píxel de Meta.** En el Administrador de eventos del portafolio comercial de RHF Living, crear o elegir el conjunto de datos (píxel) y anotar su **ID**.
3. **GTM.** En tagmanager.google.com, crear el contenedor web «rhfliving.com». En *Administrar → Importar contenedor*, subir `gtm-contenedor-rhfliving.json`, elegir un espacio de trabajo nuevo y la opción **Combinar → Reemplazar lo que choque**.
4. En *Variables*, reemplazar las dos constantes:
   - `GA4 - ID de medición` → el `G-…`;
   - `Meta - ID del píxel` → el ID del píxel.
5. **Vista previa** de GTM con `https://rhfliving.com`. Aceptar las cookies y probar:
   - un botón de WhatsApp;
   - el brochure de un proyecto;
   - «Quiero vender / consignar»;
   - el formulario de /vender;
   - la suscripción al boletín (con un correo de prueba).
   Cada acción debe disparar su etiqueta.
6. **Publicar** el contenedor y poner su ID (`GTM-…`) en `GTM_ID`, en un PR. Al publicarse la web, aparece el aviso de cookies.
7. En GA4, *Administrar → Eventos*: marcar `lead_consignar` y `generate_lead` como **eventos clave**. Opcional: `click_whatsapp`.

## Lo que trae el contenedor

| Etiqueta | Cuándo corre | Qué manda |
|---|---|---|
| GA4 - Etiqueta de Google | Todas las páginas | Página vista |
| GA4 - click_whatsapp | Clic a wa.me | `method` = whatsapp, `type` = lead_inmobiliario, `link_url` (sin el texto), `page_path`, `ubicacion` |
| GA4 - descarga_brochure | Clic a un .pdf | `file_name`, `project_name`, `link_url`, `page_path` |
| GA4 - click_quiero_vender | Clic en «Quiero vender / consignar» | `ubicacion` (menú, menú del teléfono, pie) |
| GA4 - lead_consignar | Formulario de /vender enviado, o WhatsApp con el mensaje de consignar | `metodo`, `tipo_inmueble` |
| GA4 - generate_lead | Formulario de contacto enviado | `formulario`, `proyecto` |
| GA4 - cambio_moneda | Cambio COP/USD | `moneda` |
| GA4 - newsletter_signup | Suscripción al boletín enviada | `formulario` = boletin, `idioma`, `page_path` |
| Meta - Píxel base | Todas las páginas | PageView |
| Meta - Lead (consignar) | `lead_consignar` | Lead, con `content_name` = consignar |
| Meta - NewsletterSignup | `newsletter_signup` | Evento personalizado `NewsletterSignup`, con `idioma`. No es «Lead»: un suscriptor no es un lead de las campañas |

El «Lead» de Meta es solo para quien quiere vender o consignar, como pidió el informe de Luciano. Las consultas de compra quedan en GA4 (`generate_lead` y `click_whatsapp`).

## Lo que no se manda nunca

- El texto de los mensajes de WhatsApp: la web quita `?text=` de `link_url`.
- Nombres, teléfonos o correos de los formularios.
- Nada antes de «Aceptar»: GTM ni siquiera se descarga.

La política de privacidad (`/privacidad`) ya nombra a Google y a Meta como proveedores. La CSP (`public/_headers`) ya permite sus dominios.
