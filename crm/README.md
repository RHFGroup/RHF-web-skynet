# CRM interno de RHF · crm.rhfliving.com

El CRM privado de Rafael (Prompt 3 de Luciano, fase 2, 1-oct-2026). Es un Worker aparte del sitio (`rhf-crm`), con su propia dirección. Usa la misma base D1 que el sitio (`rhf-leads`).

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
- **Auditoría:** quién vio, exportó, editó o suprimió qué, y cuándo.
- **Telegram:**
  - cada aviso de lead del sitio trae el enlace a su ficha (`/c/<id de la consulta>`);
  - todos los días a las 7:30 a. m. llega un resumen.

Quedan para la versión siguiente:

- las cadencias automáticas de seguimiento (21 días, día 60, confirmaciones de recorrido);
- las métricas y el costo por lead;
- los guiones de WhatsApp (Rafael pasa los textos);
- la importación CSV de Meta;
- el tablero para arrastrar entre etapas;
- unir dos fichas a mano;
- los Ajustes editables;
- la foto del formato de autorización;
- el plazo de conservación de 2 años.

## Seguridad

- **Acceso:** un código de 6 dígitos que llega por Telegram, al chat de Rafael con el bot de avisos (decisión de Rafael: gratis y sin tarjeta).
  - Vence en 5 minutos y sirve una vez.
  - Topes: 5 intentos por código, un código por minuto, 5 por hora.
  - En la base se guarda solo la huella SHA-256.
- **Sesión:** 30 días, en una cookie `__Host-` con `HttpOnly`, `Secure` y `SameSite=Lax`.
  - En la base, solo su huella.
  - «Más» → cerrar la sesión en este equipo o en todos.
- **Cada ruta exige sesión en el servidor**, también los archivos y las exportaciones. Sin sesión responde 403.
- **Cada escritura exige el mismo origen** (`Origin`, o `Sec-Fetch-Site: same-origin`).
- **CSP estricta:** solo `crm.css` y `crm.js` propios, sin nada en línea.
- **Fuera de los buscadores y sin analítica:** `noindex`, `robots.txt` que bloquea todo y ninguna etiqueta de GTM, GA4 ni el píxel.
- **Lo que escribe un lead se escapa siempre** (`src/html.ts`): su texto es un dato, no una instrucción.
- **Los registros** no llevan datos personales. Los registros automáticos de cada petición están apagados.
- **Las vistas previas** de Workers Builds usan la base de pruebas (`rhf-leads-preview`) y piden el mismo código.

**Sin secretos nuevos.** Los mensajes de Telegram salen por el Worker del sitio: la clase `Avisos` de `worker/index.ts`, enlazada como servicio.

## Plan gratis

- **Workers Free:** 100.000 peticiones al día, 10 ms de CPU y 50 sentencias de D1 por petición.
  - La ingesta procesa 5 consultas por petición. Si hay más, la página se vuelve a pedir sola hasta ponerse al día.
  - El servidor de pruebas avisa si alguna petición pasa de 50 (cabecera `X-D1-Sentencias`).
- **D1 Free:** hasta 500 MB por base.
- **Cron:** el CRM usa uno de los 5 que permite la cuenta.

## Puesta en marcha (una sola vez, en el panel de Cloudflare)

1. **Workers Builds** para este Worker: Workers & Pages → Create → Import a repository → `RHFGroup/RHF-web-skynet`.
   - Nombre del proyecto: `rhf-crm`.
   - Build command: vacío.
   - Deploy command: `npx wrangler deploy -c crm/wrangler.jsonc`.
   - Non-production branch deploy command: `npx wrangler versions upload -c crm/wrangler.jsonc`.
   - Root directory: `/`.
2. **Migración:** `npx wrangler d1 migrations apply rhf-leads --remote`.
   - Crea las tablas `crm_*` (0006).
   - Corre también de la 0002 a la 0005, que son `IF NOT EXISTS`.
   - Sin ella, el CRM responde «Falta aplicar la migración 0006».
3. **La dirección.** En el Worker `rhf-crm`: Settings → Domains & Routes → Add → Custom Domain → `crm.rhfliving.com`.
4. **Ruta sin Worker** para `crm.rhfliving.com/*`. Sin ella, la ruta comodín `*.rhfliving.com/*` del sitio se come el subdominio (igual que pasó con `a2a`).
   - Con el OAuth de wrangler: `POST /zones/<zona>/workers/routes` con `{"pattern":"crm.rhfliving.com/*","script":null}`.
5. **Rafael toca «Iniciar»** en @Skynet_dsh_bot. Si no, Telegram responde «chat not found» y el código no llega.

El orden de los merges: #46, #51 y después el PR del CRM. El Worker del sitio tiene que estar publicado con la clase `Avisos` para que el código llegue.

## Probar en local

**Rápido, en Node y sin wrangler.** Base en memoria con las migraciones y `crm/dev/semilla.sql`; el código de acceso sale en `GET /__dev/codigo`:

```sh
npx tsx --tsconfig crm/tsconfig.json crm/dev/servidor.ts      # http://127.0.0.1:8790
PW=<ruta de playwright> node crm/dev/prueba-e2e.mjs <carpeta de capturas>
node --test "crm/test/*.test.ts"                              # Node 23.6+ (en Node 22: --experimental-strip-types)
```

**De verdad, con wrangler** (los dos Workers juntos, para que funcione el servicio `AVISOS`):

```sh
echo "CRM_CODIGO_EN_CONSOLA=1" > crm/.dev.vars
npx wrangler d1 migrations apply rhf-leads --local -c crm/wrangler.jsonc --persist-to /tmp/rhf-crm-local
npx wrangler d1 execute rhf-leads --local -c crm/wrangler.jsonc --persist-to /tmp/rhf-crm-local --file crm/dev/semilla.sql
npx wrangler dev -c crm/wrangler.jsonc -c wrangler.jsonc --persist-to /tmp/rhf-crm-local --port 8798
```

El código sale en la consola de wrangler: `[acceso] código local: …`. `CRM_CODIGO_EN_CONSOLA` solo funciona en 127.0.0.1 y localhost.

## Las fuentes

`public/fuentes/` tiene Cormorant Garamond y Montserrat: el subconjunto latino, variables de 300 a 700. Son las mismas que usa el sitio, copiadas de su build de Next (`next/font/google`). Las dos tienen la licencia [SIL Open Font License 1.1](https://openfontlicense.org), que permite usarlas y redistribuirlas.
