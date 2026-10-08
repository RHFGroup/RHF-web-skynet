# CRM interno de RHF · rhfliving.com/‹ruta secreta›

El CRM privado de Rafael (Prompt 3 de Luciano, fase 2).

- **Dónde vive:** desde el 6-oct-2026, dentro del Worker del sitio (`rhf-web-skynet`), en una ruta secreta de rhfliving.com.
- **Cómo se entra:** con una clave.
- **El pedido de Rafael:** «un link de rhfliving.com que pida clave», sin pagar nada más.
- **La base:** la misma del sitio (`rhf-leads`).

La ruta y la clave **no van en el código**, porque el repo es público. Son dos secretos de Cloudflare:

| Secreto | Qué es |
|---|---|
| `CRM_RUTA` | La ruta, por ejemplo `/r/k3m9…`: `/r/` y de 16 a 64 letras, números, `-` o `_`. Sin ella, el CRM no existe y toda dirección sigue siendo del sitio. |
| `CRM_CLAVE` | La huella de la clave, `pbkdf2-sha256$<iteraciones>$<sal>$<hash>` (`src/clave.ts`). La clave misma no se guarda en ninguna parte. Sin la huella, nadie entra. |

## Qué hace

- **Una ficha por persona** con todo lo que llegó por el sitio:
  - el formulario de contacto, el de /vender, la guía y el simulador;
  - las llamadas que pide el agente de WhatsApp y del chat.
- **Deduplicación** por teléfono en E.164 (+573001234567) y por correo en minúsculas. Si alguien vuelve a escribir, su consulta se suma a la ficha que ya tiene.
- **Hoy:**
  - los leads sin contactar, con el tiempo que llevan esperando;
  - las tareas de hoy y las atrasadas;
  - las próximas acciones;
  - los recorridos de la semana;
  - los que llevan 60 días en «Nutrir».
- **Compradores y Propietarios:**
  - un embudo de etapas por cada uno (Prompt 3, §2.4);
  - búsqueda y filtros;
  - tarjetas en el celular.
- **La ficha:**
  - botones de WhatsApp, Llamar y Correo;
  - registrar lo que se hizo: el primer contacto mueve el lead a «Contactado»;
  - etapa, con motivo si se pierde o se descarta;
  - puntaje A/B/C, con motivo obligatorio;
  - interés, presupuesto, próxima acción y recorrido;
  - tareas y línea de tiempo;
  - la autorización de datos con su constancia.
- **Alta manual** para Instagram, Facebook, ferias, referidos y llamadas. Sin autorización no se guarda.
- **Boletín:**
  - lista aparte, con el contador de activos;
  - la baja de quien responde BAJA;
  - las reactivaciones que esperan confirmación;
  - el CSV de los activos.
- **Ley 1581:**
  - exportar los datos de una persona;
  - marcar un reclamo en trámite;
  - suprimir: borra los datos en el CRM, en `consultas` y en el boletín, y pide escribir el nombre para confirmar.
- **Auditoría:** quién entró, vio, exportó, editó o suprimió qué, y cuándo.

**Desde el 7-oct-2026 (el tablero):**

- **Embudo para arrastrar** (`/embudo`), de compradores y de propietarios: las tarjetas se mueven entre etapas, también de vuelta. En el teléfono se mantiene el dedo sobre la tarjeta; sin arrastrar, «Mover a…». Perdido y Descartado piden el motivo en un diálogo, y cancelar devuelve la tarjeta. Cada columna dice cuántos hay y cuántos llevan más días de la cuenta.
- **Velocidad de respuesta (SLA):** la espera de cada lead nuevo se cuenta en minutos hábiles (lunes a sábado, de 8 a 18, hora de Colombia, `src/horario.ts`). A los 10 minutos llega un aviso por Telegram y a los 15 otro, «se venció», sin el nombre del lead. Tocar WhatsApp, Llamar o Correo en el CRM anota el intento y cierra la espera. Una espera de más de 2 horas hábiles se marca sin avisar.
- **Higiene de la base:** tarea «Retomar» a los 7 y a los 15 días sin actividad; a los 30, el comprador pasa solo a Nutrir (`src/higiene.ts`).
- **Calificación:** presupuesto, forma de pago y para qué compra, en rangos (`src/data/calificacion.ts`), y el canal por el que llegó, deducido de la atribución del sitio (`src/canales.ts`).
- **Chats** (`/conversaciones`): lo que la IA conversó por WhatsApp y por el chat de la web, en una bandeja con filtros y búsqueda, y en la ficha de cada persona. Llegan de `agente/sincronizar_conversaciones.py` por `POST /api/conversaciones-agente` (`src/conversaciones.ts`). Si pasan 30 minutos sin el latido del sincronizador, la bandeja lo avisa.
- **Tablero** (`/tablero`), para revisar cada lunes si la inversión en anuncios se vuelve pipeline: las 5 métricas (leads nuevos, velocidad de respuesta, presentaciones, costo por lead calificado y pipeline), el embudo por etapa con sus tasas, la respuesta por tramos y los leads por canal. La inversión de cada semana se carga a mano. Las gráficas son SVG hecho en el servidor, cada una con su tabla.
- **Interfaz oscura** en todo el CRM.
- **Telegram:**
  - cada aviso de lead del sitio trae el enlace a su ficha (`<ruta>/c/<id de la consulta>`);
  - todos los días a las 7:30 a. m. llega un resumen (el cron `30 12 * * *` del sitio);
  - avisa cuando se abre una sesión nueva y cuando la entrada se cierra por claves equivocadas.

Quedan para la versión siguiente:

- las cadencias automáticas de seguimiento (21 días, día 60, confirmaciones de recorrido);
- los guiones de WhatsApp (Rafael pasa los textos);
- la importación CSV de Meta y la inversión leída de las cuentas de anuncios;
- unir dos fichas a mano;
- los Ajustes editables;
- la foto del formato de autorización;
- el plazo de conservación de 2 años.

## Seguridad

- **La clave:**
  - se compara con la huella PBKDF2-SHA256 del secreto `CRM_CLAVE`;
  - tiene topes: 5 claves equivocadas por conexión en 15 minutos;
  - si en una hora hay 20 equivocadas, desde donde sea, la entrada se cierra esa hora y llega un aviso por Telegram (tabla `crm_ingresos`, migración 0007).
- **La sesión:**
  - dura 30 días, en una cookie `__Secure-` con `HttpOnly`, `Secure` y `SameSite=Lax`;
  - lleva `Path` de la ruta secreta, así que el navegador no la manda a las páginas públicas;
  - en la base se guarda solo su huella;
  - «Más» → cerrar la sesión en este equipo o en todos.
- **Cada ruta exige sesión en el servidor,** también los archivos y las exportaciones. Sin sesión responde 403.

**Por compartir el origen con el sitio público.** En rhfliving.com corren scripts de terceros: el chat, Google y Meta. Por eso hay tres defensas más:

- **Toda escritura exige** el mismo origen y el token anti-CSRF de la sesión. El token va escondido en cada formulario, y un script de otra página no lo puede leer.
- **Solo navegaciones (Fetch Metadata).** Las páginas se entregan solo a la pestaña que navega: un `fetch()` o un `<iframe>` desde otra página reciben 403.
- **Ventanas y referer.** `Cross-Origin-Opener-Policy: same-origin`: una página pública que abra el CRM en otra ventana no puede leerla. `Referrer-Policy: strict-origin`: la ruta secreta no sale como referer, ni siquiera hacia las páginas del mismo sitio.

**Además:**

- **CSP estricta:** solo `crm.css` y `crm.js` propios, sin nada en línea, y sin marcos.
- **Fuera de los buscadores y sin analítica:** `noindex`, y ninguna etiqueta de GTM, GA4 ni el píxel.
- **Lo que escribe un lead se escapa siempre** (`src/html.ts`): su texto es un dato, no una instrucción.
- **Los registros** no llevan datos personales, y los registros automáticos de cada petición están apagados.
- **Las vistas previas** de Workers Builds usan la base de pruebas (`rhf-leads-preview`), con la misma ruta y la misma clave.

**Cómo llega el CRM al Worker.** Con `not_found_handling: "404-page"`, una dirección que no es un asset recibe la página 404 sin pasar por el Worker. Por eso `run_worker_first` incluye `/r/*`: es lo único de la ruta que aparece en `wrangler.jsonc`, y lo que sigue a `/r/` es el secreto. La hoja de estilos, el script y las fuentes van embebidos como módulos (`worker/crm-recursos.ts`, reglas `rules` de `wrangler.jsonc`), no en `out/`. Así solo existen bajo la ruta secreta.

## Plan gratis

- **Workers Free:** 100.000 peticiones al día, 10 ms de CPU y 50 sentencias de D1 por petición.
  - La ingesta procesa 5 consultas por petición. Si hay más, la página se vuelve a pedir sola hasta ponerse al día.
  - El servidor de pruebas avisa si alguna petición pasa de 50 (cabecera `X-D1-Sentencias`).
  - PBKDF2 con 20.000 iteraciones cabe en los 10 ms.
- **D1 Free:** hasta 500 MB por base.
- **Cron:** el sitio usa dos de los 5 de la cuenta. Desde el 7-oct-2026, uno corre cada minuto y el otro manda el resumen del día. El de cada minuto trae las consultas nuevas y, solo en horario hábil, vigila el SLA; la higiene corre dos veces por hora (minutos 7 y 37), y cada 5 minutos corren el vigía, los reintentos de avisos y la TRM. Son 1.440 corridas al día, lejos de las 100.000 peticiones del plan, y cada una cabe en 50 sentencias (la prueba lo mide).
- **Lecturas de D1:** el plan gratis permite 5 millones de filas leídas al día para todo el sitio; si se pasa, D1 deja de responder hasta la medianoche UTC, también al formulario. Por eso las consultas del cron van por índices y miran solo lo reciente: el SLA, las esperas de la última semana; la higiene, dos veces por hora y no cada minuto. Así el gasto no crece con la base.
- **Los chats** llegan en lotes de hasta 50 conversaciones y 400 mensajes, guardados en 5 sentencias con `json_each`. El latido del sincronizador es una sentencia cada 5 minutos.

## Puesta en marcha (una sola vez)

1. **La ruta y la clave,** desde el Mac, en la carpeta del repo, con wrangler logueado:
   - `node crm/dev/poner-clave.mjs ruta` genera una ruta al azar (`/r/…`), la guarda en `CRM_RUTA` y la muestra.
   - `node crm/dev/poner-clave.mjs clave` pide la clave en un cuadro del Mac, dos veces, y guarda su huella en `CRM_CLAVE`. La clave no pasa por la Terminal.
   - Los dos usan `wrangler versions secret put`: crean una versión con el secreto sin publicarla, y el próximo deploy lo lleva. Nunca por el panel de Cloudflare, que publica la última versión subida.
2. **Los merges:** primero el #51, y después el PR del CRM (#55).
3. **Las migraciones en producción:** `npx wrangler d1 migrations apply rhf-leads --remote`.
   - Crea las tablas `crm_*` (0006 y 0007).
   - La 0008 (7-oct-2026) agrega las columnas de la calificación, la atribución, el SLA y las fases, y las tablas de la inversión y de los chats. Solo agrega: no cambia ni borra nada.
   - Corre también de la 0002 a la 0005, que son `IF NOT EXISTS`.
   - Sin ellas, el CRM responde «Falta aplicar las migraciones».
4. **Los chats de la IA,** con el OK de Rafael: instalar el sincronizador en el servidor del agente (`agente/LEEME.md`). Usa el mismo token del agente (`AGENTE_TOKEN`), que ya existe.

**Para cambiar la clave,** se corre de nuevo `node crm/dev/poner-clave.mjs clave`. La nueva vale desde el próximo deploy.

## Probar en local

**Rápido, en Node y sin wrangler.** Base en memoria con las migraciones y `crm/dev/semilla.sql`. La ruta y la clave de prueba están en `crm/dev/servidor.ts`.

```sh
npx tsx --tsconfig crm/tsconfig.json crm/dev/servidor.ts      # http://127.0.0.1:8790/r/prueba-crm-0123456789abcdef
PW=<ruta de playwright> node crm/dev/prueba-e2e.mjs <carpeta de capturas>
PW=<ruta de playwright> node crm/dev/prueba-tablero.mjs <carpeta de capturas>   # embudo, SLA, higiene, chats y tablero
node --test "crm/test/*.test.ts"                              # Node 23.6+ (en Node 22: --experimental-strip-types)
```

Con `SEMILLA_DEMO=1`, el arnés carga además `crm/dev/semilla-demo.sql`: leads de mentira en todas las etapas, para ver el embudo y el tablero con datos. Las dos pruebas de punta a punta se corren cada una con el arnés recién arrancado.

En WebKit, las capturas de Playwright (`caret`, `animations`) inyectan un `<style>` que la CSP del CRM bloquea: la revisión de la consola se corre sin capturas.

**De verdad, con wrangler** (el Worker del sitio con el CRM adentro). En `.dev.vars` de la raíz van `CRM_RUTA` y `CRM_CLAVE` de prueba:

```sh
npx wrangler d1 migrations apply rhf-leads --local --persist-to /tmp/rhf-crm-local
npx wrangler d1 execute rhf-leads --local --persist-to /tmp/rhf-crm-local --file crm/dev/semilla.sql
npx wrangler dev --persist-to /tmp/rhf-crm-local --port 8798 --test-scheduled
```

## Las fuentes

`public/fuentes/` tiene Cormorant Garamond y Montserrat: el subconjunto latino, variables de 300 a 700. Son las mismas que usa el sitio, copiadas de su build de Next (`next/font/google`). Las dos tienen la licencia [SIL Open Font License 1.1](https://openfontlicense.org), que permite usarlas y redistribuirlas.
