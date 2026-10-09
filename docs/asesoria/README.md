# La página de captación (`/asesoria` y `/en/lets-talk`)

7-oct-2026. Rafael la pidió así: «una sección específica para que la persona que, por ejemplo, viene de un video de YouTube tenga una sección entera para dejarnos sus datos, con una thank you page adicional. Algo rápido, dinámico y convincente, sin mostrar ni nombrar proyectos».

## Decisiones de Rafael (7-oct-2026)

| Pregunta | Respuesta |
|---|---|
| Dirección | `/asesoria`, y en inglés `/en/lets-talk` |
| Formulario | Tres toques y los datos: para qué, para cuándo, presupuesto, y después nombre y WhatsApp |
| Promesa de la página de gracias | Sin plazo de respuesta, con botón de WhatsApp |
| Inglés | Sí |

## Cómo funciona

- **Las páginas:** `/asesoria` y `/en/lets-talk`, con su gracias en `/asesoria/gracias` y `/en/lets-talk/thank-you`.
  - Son páginas de campaña: `noindex`, fuera del menú y fuera del sitemap.
  - No llevan la cabecera ni el pie del sitio, ni el chat (`data-sin-chat`): una sola acción.
- **Sin proyectos ni precios.** Por eso no son piezas publicitarias de un proyecto en el sentido de la Circular 004.
- **El envío** va al mismo buzón: `POST /api/consulta`, con trampa, Turnstile y la autorización de la Ley 1581 (`AVISO_VERSION` 2026-10-07, el mismo texto del formulario de contacto). Desde el 9-oct-2026 la casilla suma «y para saber por qué medio llegué a esta página», porque la consulta viaja con su atribución; antes era la 2026-09-18.
  - `proyecto`: «Asesoría · página de captación».
  - `mensaje`: de dónde llegó (UTM o referer) y las tres respuestas, en español.
  - `origen`: la ruta con sus UTM. Llega en el aviso de Telegram.
- **La página de gracias** lee de `sessionStorage` (`rhf-asesoria-lead`) solo el primer nombre y las tres respuestas. El teléfono nunca va en la dirección.

## El enlace para la descripción del video

```
https://rhfliving.com/asesoria?utm_source=youtube&utm_medium=video&utm_campaign=<nombre-del-video>
```

Con `utm_campaign` distinto por video, cada lead dice qué video lo trajo («Llegó por: youtube · video · campaña doral-recorrido»). El CRM lo cuenta como YouTube orgánico.

**En los anuncios**, el mismo enlace con `utm_medium=paid`, para que el tablero los cuente como pauta:

- en Meta: `utm_source=facebook` o `utm_source=instagram`;
- en YouTube Ads: `utm_source=youtube`.

Por ejemplo: `https://rhfliving.com/asesoria?utm_source=instagram&utm_medium=paid&utm_campaign=<nombre-del-anuncio>`.

## Analítica

Va a `dataLayer`, como el resto del sitio, solo con cookies aceptadas:

| Evento | Cuándo | Datos |
|---|---|---|
| `form_start` | Al primer toque | `formulario: "asesoria"` |
| `asesoria_paso` | En cada respuesta | `paso`, `respuesta` |
| `generate_lead` | En la página de gracias, una sola vez por lead | `formulario: "asesoria"` y `fuente` (`utm_source`) |

La conversión se mide en la página de gracias porque la navegación corta los envíos que salen justo antes de irse. Recargar no la duplica, y quien entra directo a la página de gracias no la dispara. Nunca viajan el nombre ni el teléfono.

## Lo que dice de Rafael

Sale de `projects/inmobiliaria/copy-del-bloque-quien-te-asesora-que-podemos-afirmar-de-rafael`:

- vive y trabaja en la Zona Norte;
- compró donde asesora;
- asesora proyectos de varias constructoras.

No lleva años ni número de operaciones, ni superlativos.

## Conexión con el CRM (8-oct-2026)

Rafael eligió «3 toques alineados» con el CRM y, para el primer paso, «Vivir, Airbnb, Arriendo, Valorizar».

- **Para qué** viaja como `objetivo`, con los códigos de `OBJETIVOS` del CRM: `vivir`, `renta_corta`, `renta_tradicional`, `patrimonio` y `no_se`.
- **Presupuesto** viaja como `presupuesto`, con los códigos de `RANGOS_PRESUPUESTO`: `hasta_250`, `250_400`, `400_600`, `600_900`, `mas_900` y `no_se`.
- **Atribución.** `atribucion` lleva las UTM, los identificadores de clic, la página de entrada y el dominio que trajo la visita. Con eso el CRM calcula el canal (`crm/src/canales.ts`): `utm_source=youtube&utm_medium=video` queda como YouTube orgánico, y con `utm_medium=paid`, como YouTube Ads.
- **Cuándo** no tiene campo en el CRM: queda en el `mensaje`.
- **El Worker** guarda esos campos desde el tablero del CRM (#60, 8-oct-2026), y el CRM los cuenta en el embudo y en las 5 métricas del lunes.
- **Calificado.** El tablero cuenta un lead como calificado si tiene presupuesto y forma de pago, puntaje A o B, o si ya llegó a la presentación. Esta página no pregunta la forma de pago: sus leads se califican con el puntaje en la ficha.
- **Si cambian los códigos** en `src/data/calificacion.ts`, se cambian también en `textos.ts`. Si se vuelve a tocar esta página, conviene importarlos de ahí y usar `atribucionParaEnviar()` (primer toque).
