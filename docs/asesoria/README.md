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
- **El envío** va al mismo buzón: `POST /api/consulta`, con trampa, Turnstile y la autorización de la Ley 1581 (`AVISO_VERSION` 2026-09-18, el mismo texto del formulario de contacto). El Worker no cambió.
  - `proyecto`: «Asesoría · página de captación».
  - `mensaje`: de dónde llegó (UTM o referer) y las tres respuestas, en español.
  - `origen`: la ruta con sus UTM. Llega en el aviso de Telegram.
- **La página de gracias** lee de `sessionStorage` (`rhf-asesoria-lead`) solo el primer nombre y las tres respuestas. El teléfono nunca va en la dirección.

## El enlace para la descripción del video

```
https://rhfliving.com/asesoria?utm_source=youtube&utm_medium=video&utm_campaign=<nombre-del-video>
```

Con `utm_campaign` distinto por video, cada lead dice qué video lo trajo («Llegó por: youtube · video · campaña doral-recorrido»).

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
