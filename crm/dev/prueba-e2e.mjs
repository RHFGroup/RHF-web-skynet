// Prueba de punta a punta del CRM, con los datos de crm/dev/semilla.sql.
//
// Contra el servidor de Node (crm/dev/servidor.ts):
//   PW=/ruta/a/playwright BASE=http://127.0.0.1:8790 node crm/dev/prueba-e2e.mjs [capturas/]
// Contra wrangler dev (el Worker del sitio con el CRM adentro; ver crm/README.md):
//   MODO=wrangler DEVLOG=<registro de wrangler dev> D1_SQLITE=<archivo .sqlite local> \
//   BASE=http://127.0.0.1:8798 MOTOR=webkit|chromium PW=… node crm/dev/prueba-e2e.mjs [capturas/]
// RUTA y CLAVE: las de prueba (por omisión, las de crm/dev/servidor.ts; en
// wrangler dev, las de .dev.vars).
// Imprime un JSON con el resultado de cada caso; sale con código 1 si alguno falla.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";

const PW = process.env.PW ?? "playwright";
const pw = await import(PW.endsWith(".mjs") || PW.endsWith(".js") ? PW : `${PW}/index.mjs`);
const { devices } = pw;
const MOTOR = process.env.MOTOR ?? "chromium";
const BASE = process.env.BASE ?? "http://127.0.0.1:8790";
const RUTA = process.env.RUTA ?? "/r/prueba-crm-0123456789abcdef";
const CLAVE = process.env.CLAVE ?? "clave de prueba del CRM";
const CRM = `${BASE}${RUTA}`;
const WRANGLER = process.env.MODO === "wrangler";
const CAPTURAS = process.argv[2] ?? null;

const resultados = [];
function caso(nombre, ok, detalle) {
  resultados.push({ caso: nombre, ok: Boolean(ok), ...(detalle !== undefined ? { detalle } : {}) });
}

/** Una consulta de solo lectura a la base de la prueba. */
async function sql(q) {
  if (WRANGLER) {
    const salida = execFileSync("sqlite3", ["-json", "-cmd", "PRAGMA query_only=1", process.env.D1_SQLITE, q], { encoding: "utf8" });
    return salida.trim() ? JSON.parse(salida) : [];
  }
  const r = await fetch(`${BASE}/__dev/sql`, { method: "POST", body: q });
  return r.json();
}

/** Lo que el CRM mandó por Telegram (solo en el arnés de Node: en wrangler dev no hay bot). */
async function telegram() {
  return WRANGLER ? [] : (await fetch(`${BASE}/__dev/telegram`)).json();
}

/** Corre el resumen del día y devuelve lo que se mandó (o la línea del registro). */
async function resumenDelDia() {
  if (WRANGLER) {
    // /cdn-cgi/handler/scheduled y no /__scheduled: con assets, el router
    // responde su 404 a /__scheduled sin llegar al Worker.
    await pedir(`${BASE}/cdn-cgi/handler/scheduled?cron=${encodeURIComponent("30 12 * * *")}`);
    await new Promise((r) => setTimeout(r, 2500));
    const log = fs.readFileSync(process.env.DEVLOG, "utf8");
    return [...log.matchAll(/\{"resumen":[^\n]*\}/g)].at(-1)?.[0] ?? null;
  }
  return (await fetch(`${BASE}/__dev/resumen`)).json();
}

/**
 * Una petición HTTP con exactamente estas cabeceras. No sirve el fetch() de
 * Node: le agrega «sec-fetch-mode: cors» a todo, y el CRM rechaza cualquier
 * fetch() (Fetch Metadata). Devuelve { status, headers, texto }.
 */
function pedir(url, { metodo = "GET", headers = {}, cuerpo } = {}) {
  return new Promise((resolver, rechazar) => {
    const u = new URL(url);
    const h = { ...headers };
    if (cuerpo !== undefined) h["Content-Length"] = Buffer.byteLength(cuerpo);
    const req = http.request({ hostname: u.hostname, port: u.port, path: `${u.pathname}${u.search}`, method: metodo, headers: h }, (res) => {
      const partes = [];
      res.on("data", (p) => partes.push(p));
      res.on("end", () => resolver({ status: res.statusCode, headers: res.headers, texto: Buffer.concat(partes).toString("utf8") }));
    });
    req.on("error", rechazar);
    if (cuerpo !== undefined) req.write(cuerpo);
    req.end();
  });
}

/** Las cabeceras de una navegación de verdad en la misma pestaña. */
const NAVEGACION = { "Sec-Fetch-Mode": "navigate", "Sec-Fetch-Dest": "document", "Sec-Fetch-Site": "same-origin", Accept: "text/html" };

/** Un POST como lo manda un formulario del navegador, desde la conexión `ip`. */
function postFormulario(ruta, campos, { cookie, origen = BASE, ip, navegacion = true } = {}) {
  const headers = { "Content-Type": "application/x-www-form-urlencoded" };
  if (cookie) headers.Cookie = cookie;
  if (origen) headers.Origin = origen;
  if (ip) headers["CF-Connecting-IP"] = ip;
  if (navegacion) Object.assign(headers, NAVEGACION);
  return pedir(`${CRM}${ruta}`, { metodo: "POST", headers, cuerpo: new URLSearchParams(campos).toString() });
}

// CANAL=chrome usa el Chrome instalado (en el Mac no hay Chromium de Playwright).
const navegador = await pw[MOTOR].launch(process.env.CANAL ? { channel: process.env.CANAL } : {});
const iphone = { ...devices["iPhone 13"] };
delete iphone.defaultBrowserType;
const ctx = await navegador.newContext({ ...iphone, locale: "es-CO" });
const page = await ctx.newPage();
const dialogos = [];
page.on("dialog", async (d) => {
  dialogos.push(d.message());
  await d.accept();
});
const erroresConsola = [];
// Los 403 a propósito (el fetch y el iframe de la prueba de seguridad) se anotan aparte.
page.on("console", (m) => m.type() === "error" && !m.text().startsWith("Failed to load resource") && !/X-Frame-Options|frame-ancestors|Refused to display/.test(m.text()) && erroresConsola.push(`${new URL(page.url()).pathname}${new URL(page.url()).search}: ${m.text().slice(0, 120)}`));
page.on("pageerror", (e) => erroresConsola.push(String(e)));
// Las respuestas con error que no son las esperadas (la página de acceso sin
// sesión responde 403 a propósito, y los errores de formulario 401/422).
const recursosConError = [];
let anotarRecursos = true;
page.on("response", (r) => {
  const u = new URL(r.url());
  if (anotarRecursos && r.status() >= 400 && r.request().resourceType() !== "document") recursosConError.push(`${r.status()} ${u.pathname}`);
});
// caret: "initial" para que Playwright no inyecte un estilo (la CSP lo bloquea y ensucia la consola).
const captura = async (nombre) => CAPTURAS && page.screenshot({ path: `${CAPTURAS}/${nombre}.png`, fullPage: true, caret: "initial" });
const texto = async () => (await page.locator("main").innerText()).replace(/\s+/g, " ");
const form = (accion) => `form[action='${RUTA}${accion}']`;

// 1. Fuera de la ruta secreta, el CRM no existe.
let x = await pedir(`${BASE}/hoy`, { headers: NAVEGACION });
caso("fuera de la ruta secreta el CRM no existe (404 del sitio)", x.status === 404, x.status);
x = await pedir(`${BASE}/r/otra-ruta-cualquiera-123456/acceso`, { headers: NAVEGACION });
caso("otra ruta bajo /r/ tampoco es el CRM", x.status === 404 && !x.texto.includes('name="clave"'), x.status);

// 2. Sin sesión: la página de acceso, con 403.
let r = await page.goto(`${CRM}/hoy`);
caso("sin sesión, la ruta secreta pide la clave (403)", r.status() === 403 && (await page.locator("#clave").count()) === 1);
await captura("01-acceso");

// 3. La clave.
await page.fill("#clave", "esta no es la clave");
await page.click("button:has-text('Entrar')");
caso("una clave equivocada no entra", (await page.locator(".error").innerText()).includes("no coincide"));
await page.fill("#clave", CLAVE);
await page.click("button:has-text('Entrar')");
await page.waitForURL(/\/hoy$/);
caso("con la clave entra a Hoy", page.url() === `${CRM}/hoy`, page.url());
const cookies = await ctx.cookies();
const sesion = cookies.find((c) => c.name === "crm_sesion");
caso(
  "la sesión es HttpOnly, SameSite=Lax y solo para la ruta secreta",
  sesion && sesion.httpOnly && sesion.sameSite === "Lax" && sesion.path === RUTA,
  sesion && { httpOnly: sesion.httpOnly, sameSite: sesion.sameSite, path: sesion.path },
);
if (!WRANGLER) {
  const t = await telegram();
  caso("la sesión nueva avisa por Telegram", t.some((m) => m.includes("Se abrió una sesión nueva")));
}
await captura("02-hoy");

// 4. Hoy: los ocho nuevos sin contactar (la prueba del agente no entra).
const sinContactar = await page.locator("#sin-contactar li").count();
caso("Hoy muestra los 8 leads sin contactar", sinContactar === 8, sinContactar);
caso("el nombre con <script> se ve como texto y no corre", (await texto()).includes("<script>alert(1)</script>") && dialogos.length === 0);
const enlaces = await page.locator("a[href^='/']").evaluateAll((as) => as.map((a) => a.getAttribute("href")));
caso("todos los enlaces internos llevan la ruta secreta", enlaces.length > 0 && enlaces.every((h) => h.startsWith(`${RUTA}/`)), enlaces.filter((h) => !h.startsWith(`${RUTA}/`)).slice(0, 5));

// 5. Listas.
await page.goto(`${CRM}/leads`);
const compradores = await page.locator(".tarjetas > li").count();
caso("Compradores: 7 tarjetas", compradores === 7, compradores);
await captura("03-compradores");
await page.goto(`${CRM}/propietarios`);
caso("Propietarios: 1 tarjeta (el de /vender)", (await page.locator(".tarjetas > li").count()) === 1);
await page.goto(`${CRM}/leads?q=3001234`);
caso("la búsqueda por teléfono encuentra a Ana", (await page.locator(".tarjetas > li").count()) === 1 && (await texto()).includes("Ana Prueba"));

// 6. La ficha de Ana: dos consultas (deduplicada) y su constancia.
await page.goto(`${CRM}/contacto/1`);
const t1 = await texto();
caso("la ficha de Ana junta sus dos consultas", (t1.match(/Escribió por el sitio/g) ?? []).length === 2);
caso("la ficha muestra las dos constancias de autorización", t1.includes("Consulta #1") && t1.includes("Consulta #8"));
const formularios = await page.locator("form[method=post]").count();
const tokens = await page.locator("form[method=post] > input[name=_csrf]:first-child").count();
caso("cada formulario que escribe lleva el token anti-CSRF", formularios > 5 && tokens === formularios, { formularios, tokens });
const wa = await page.locator("a:has-text('WhatsApp')").first().getAttribute("href");
caso("el botón de WhatsApp abre wa.me con el número", wa === "https://wa.me/573001234567", wa);
await captura("04-ficha");

// 7. Registrar el primer contacto: pasa a Contactado y sale de «sin contactar».
await page.selectOption("#tipo-nota-1", "whatsapp");
await page.fill("#texto-nota-1", "Le mandé la ficha de Doral West.");
await page.click(`${form("/contacto/1/nota")} button[type=submit]`);
await page.waitForURL(/ok=nota/);
caso("registrar el WhatsApp mueve a Contactado", (await texto()).includes("Nuevo → Contactado"));

// 8. Puntaje con motivo.
await page.selectOption("#puntaje-1", "B");
await page.fill("#motivo-puntaje-1", "Compra en 6 meses, crédito por definir");
await page.click(`${form("/oportunidad/1/puntaje")} button[type=submit]`);
await page.waitForURL(/ok=puntaje/);
caso("el puntaje cambia con su motivo", (await texto()).includes("Sin calificar → B: Compra en 6 meses"));

// 9. Perdido sin motivo: el servidor no lo guarda. En la página, el motivo
// aparece y se vuelve obligatorio al elegir Perdido.
await page.goto(`${CRM}/contacto/3`);
caso("el motivo está escondido mientras la etapa no lo pide", await page.locator("#motivo-3").isHidden());
const csrf = await page.locator("input[name=_csrf]").first().getAttribute("value");
const sinMotivo = await page.request.post(`${CRM}/oportunidad/3/etapa`, {
  headers: { Origin: BASE },
  form: { etapa: "perdido", _csrf: csrf },
  maxRedirects: 0,
});
caso("Perdido sin motivo no se guarda (servidor)", sinMotivo.status() === 303 && (sinMotivo.headers()["location"] ?? "") === `${RUTA}/contacto/3?error=motivo`, sinMotivo.headers()["location"]);
await page.selectOption("#etapa-3", "perdido");
caso("al elegir Perdido aparece el motivo, obligatorio", (await page.locator("#motivo-3").isVisible()) && (await page.locator("#motivo-3").evaluate((e) => e.required)));
await page.selectOption("#motivo-3", "No responde");
await page.click(`${form("/oportunidad/3/etapa")} button[type=submit]`);
await page.waitForURL(/ok=etapa/);
caso("Perdido con motivo cierra la oportunidad", (await sql("SELECT cerrada, motivo_perdida FROM crm_oportunidades WHERE id = 3"))[0].cerrada === 1);

// 10. Tarea para hoy y recorrido: aparecen en Hoy.
await page.goto(`${CRM}/contacto/1`);
await page.fill("#titulo-tarea-1", "Llamar a Ana para confirmar el sábado");
await page.click(`${form("/contacto/1/tarea")} button[type=submit]`);
await page.waitForURL(/ok=tarea/);
await page.click("text=Detalle, próxima acción y recorrido");
const manana = new Date(Date.now() - 5 * 3600_000 + 86_400_000).toISOString().slice(0, 10);
await page.fill("#recorrido-1", `${manana}T10:00`);
await page.fill("#proxima-1", "Confirmar recorrido");
await page.click(`${form("/oportunidad/1/detalle")} button[type=submit]`);
await page.waitForURL(/ok=guardado/);
await page.goto(`${CRM}/hoy`);
const hoyTexto = await texto();
caso("Hoy muestra la tarea y el recorrido", hoyTexto.includes("Llamar a Ana para confirmar el sábado") && hoyTexto.includes("10:00"));
const quedan = await page.locator("#sin-contactar li").count();
caso("Ana (contactada) y Lucía (perdida) salen de los sin contactar", quedan === 6, quedan);
await page.click("#tareas form button[type=submit]");
await page.waitForURL(/ok=hecha/);
caso("la tarea se marca como hecha", (await sql("SELECT hecha_en FROM crm_tareas WHERE id = 1"))[0].hecha_en !== null);

// 11. Alta manual: sin autorización no se guarda; un teléfono existente va a su ficha.
await page.goto(`${CRM}/nuevo`);
await page.fill("#campo-nombre", "Carla Feria");
await page.fill("#campo-telefono", "315 222 3344");
await page.selectOption("#campo-fuente", "feria");
await page.selectOption("#campo-autorizacion_canal", "formato_feria");
await page.fill("#campo-autorizacion_evidencia", "Formato firmado en la feria Sábado Zona Norte, carpeta de octubre.");
await page.click("button:has-text('Guardar lead')");
caso("sin la casilla de autorización el navegador no envía", page.url().endsWith("/nuevo"));
await page.check("#autoriza");
await page.click("button:has-text('Guardar lead')");
await page.waitForURL(/ok=creado/);
caso("el alta manual crea la ficha", (await texto()).includes("Carla Feria"));
await page.goto(`${CRM}/nuevo`);
await page.fill("#campo-nombre", "Lucía G.");
await page.fill("#campo-telefono", "3015550001");
await page.selectOption("#campo-fuente", "referido");
await page.selectOption("#campo-autorizacion_canal", "whatsapp");
await page.fill("#campo-autorizacion_evidencia", "Mensaje de WhatsApp del 1-oct.");
await page.check("#autoriza");
await page.click("button:has-text('Guardar lead')");
await page.waitForURL(/ok=existia/);
caso("un teléfono que ya existe va a la ficha que ya tenía", page.url().includes(`${RUTA}/contacto/3`));
await captura("05-alta-sobre-ficha");

// 12. Boletín: baja, reactivación pendiente y CSV.
await page.goto(`${CRM}/boletin`);
caso("el boletín cuenta 2 activos", (await page.locator(".resumen .cifra b").first().innerText()) === "2");
caso("aparece la reactivación pendiente", (await texto()).includes("volver@example.com"));
await captura("06-boletin");
await page.click(`${form("/boletin/1/baja")} button`);
await page.waitForURL(/ok=baja/);
caso("dar de baja pide confirmación y funciona", dialogos.some((d) => d.includes("lector@example.com")) && (await sql("SELECT estado FROM suscriptores WHERE id = 1"))[0].estado === "baja");
await page.click(`${form("/boletin/3/reactivar")} button`);
await page.waitForURL(/ok=guardado/);
const reactivado = (await sql("SELECT estado, ip, origen FROM suscriptores WHERE id = 3"))[0];
caso("reactivar usa la constancia del pedido", reactivado.estado === "activa" && reactivado.origen === "/inteligencia-de-mercado", reactivado);
const csv = await (await page.request.get(`${CRM}/boletin/activos.csv`)).text();
caso("el CSV trae solo los activos", csv.includes("emily@example.com") && csv.includes("volver@example.com") && !csv.includes("lector@example.com"));

// 13. Ley 1581: exportar, reclamo y suprimir.
const exp = await page.request.get(`${CRM}/contacto/7/exportar`);
const datos = await exp.json();
caso("exportar trae persona, consultas y boletín", datos.persona.correo === "emily@example.com" && datos.consultas_del_sitio.length === 1 && datos.boletin.length === 1);
await page.goto(`${CRM}/contacto/7`);
await page.click("text=Protección de datos (Ley 1581)");
await page.click("button:has-text('Marcar reclamo en trámite')");
await page.waitForURL(/ok=reclamo/);
caso("el reclamo en trámite se marca", (await texto()).includes("Reclamo en trámite"));
await page.click("text=Protección de datos (Ley 1581)");
await page.fill("#confirmar-7", "Otra Persona");
await page.click("button:has-text('Suprimir sus datos')");
await page.waitForURL(/error=confirmacion/);
caso("suprimir con otro nombre no borra nada", (await sql("SELECT estado_datos FROM crm_contactos WHERE id = 7"))[0].estado_datos === "reclamo");
await page.click("text=Protección de datos (Ley 1581)");
await page.fill("#confirmar-7", "emily form");
await page.click("button:has-text('Suprimir sus datos')");
await page.waitForURL(/ok=suprimido/);
const q9 = (await sql("SELECT nombre, contacto, mensaje, ip, version_aviso, creado_en FROM consultas WHERE id = 9"))[0];
const s2 = (await sql("SELECT correo, estado FROM suscriptores WHERE id = 2"))[0];
caso("suprimir borra los datos en el CRM, en el buzón y en el boletín",
  (await texto()).includes("Datos suprimidos") && q9.nombre === "[suprimido]" && q9.contacto === "[suprimido]" && q9.mensaje === null && q9.ip === null && s2.correo.startsWith("suprimido-") && s2.estado === "baja",
  { consulta: q9, boletin: s2 });

// 14. Auditoría.
await page.goto(`${CRM}/auditoria`);
const aud = await texto();
caso("la auditoría registra entrar, ver, exportar y suprimir", aud.includes("Entró al CRM") && aud.includes("Vio la ficha") && aud.includes("Exportó los datos de la persona") && aud.includes("Suprimió los datos de la persona"));

// 15. El enlace del aviso de Telegram.
await page.goto(`${CRM}/c/10`);
caso("/c/<consulta> abre la ficha de esa consulta", page.url().endsWith(`${RUTA}/contacto/8`), page.url());

// 16. Resumen del día.
const resumen = await resumenDelDia();
if (WRANGLER) {
  // En local el Worker no tiene el bot: llegar hasta el envío (y que falle
  // ahí) prueba el cron «30 12 * * *» y el resumen de punta a punta.
  caso("el cron de las 7:30 corre el resumen del día", typeof resumen === "string" && resumen.includes('"resumen":"fallo"') && /sin_configurar|telegram_4\d\d/.test(resumen), resumen);
} else {
  caso("el resumen del día sale por Telegram con cifras y el enlace a la ruta secreta", typeof resumen === "string" && resumen.includes("Tu día en el CRM") && resumen.includes(`https://rhfliving.com${RUTA}/hoy`), resumen);
}

// 17. Seguridad: el CRM comparte el origen con el sitio público.
const cookie = `crm_sesion=${sesion.value}`;
x = await postFormulario("/contacto/1/nota", { tipo: "nota", texto: "x", _csrf: csrf }, { cookie, origen: null, navegacion: false });
caso("una escritura sin Origin responde 403", x.status === 403);
x = await postFormulario("/contacto/1/nota", { tipo: "nota", texto: "x", _csrf: csrf }, { cookie, origen: "https://otro.example" });
caso("una escritura desde otro origen responde 403", x.status === 403);
x = await postFormulario("/contacto/1/nota", { tipo: "nota", texto: "x" }, { cookie });
caso("una escritura sin el token anti-CSRF responde 403", x.status === 403);
x = await postFormulario("/contacto/1/nota", { tipo: "nota", texto: "x", _csrf: "0".repeat(32) }, { cookie });
caso("una escritura con otro token anti-CSRF responde 403", x.status === 403);
x = await postFormulario("/contacto/1/nota", { tipo: "nota", texto: "Prueba del formulario con todo en regla.", _csrf: csrf }, { cookie });
caso("con el mismo origen, una navegación y el token, la escritura pasa", x.status === 303 && (x.headers.location ?? "").startsWith(`${RUTA}/contacto/1`), x.status);
anotarRecursos = false;
const desdeUnScript = await page.evaluate(async (u) => (await fetch(u)).status, `${CRM}/hoy`);
caso("un fetch() desde una página del sitio recibe 403 (Fetch Metadata)", desdeUnScript === 403, desdeUnScript);
x = await pedir(`${CRM}/hoy`, { headers: { Cookie: cookie, ...NAVEGACION, "Sec-Fetch-Dest": "iframe" } });
caso("una página del CRM dentro de un iframe recibe 403", x.status === 403);
anotarRecursos = true;
x = await pedir(`${CRM}/contacto/1`, { headers: NAVEGACION });
caso("la ficha sin sesión responde 403 con la página de la clave", x.status === 403 && x.texto.includes('name="clave"'));
x = await pedir(`${CRM}/contacto/1/exportar`, { headers: NAVEGACION });
caso("exportar sin sesión responde 403", x.status === 403 && !x.texto.includes("emily"));
x = await pedir(`${CRM}/crm.js`, { headers: { "Sec-Fetch-Mode": "no-cors", "Sec-Fetch-Dest": "script", "Sec-Fetch-Site": "same-origin" } });
caso("el script del CRM sin sesión responde 403", x.status === 403);
x = await pedir(`${CRM}/hoy`, { headers: { Cookie: cookie, ...NAVEGACION } });
const h = x.headers;
caso(
  "cabeceras: CSP estricta, noindex, sin caché, ventana aislada y referer solo con el origen",
  x.status === 200 &&
    (h["content-security-policy"] ?? "").includes("default-src 'none'") &&
    (h["x-robots-tag"] ?? "").includes("noindex") &&
    h["cache-control"] === "no-store" &&
    h["cross-origin-opener-policy"] === "same-origin" &&
    h["referrer-policy"] === "strict-origin",
  { status: x.status, ...Object.fromEntries(Object.entries(h).filter(([k]) => /policy|robots|cache/.test(k))) },
);

if (WRANGLER) {
  // El sitio público, en el mismo Worker: sigue igual.
  x = await pedir(`${BASE}/`, { headers: NAVEGACION });
  caso("la portada del sitio sigue respondiendo", x.status === 200 && (x.headers["content-type"] ?? "").includes("text/html"));
  x = await pedir(`${BASE}/api/consulta`);
  caso("la API del sitio sigue respondiendo", x.status === 405);
  // Una ventana del CRM que abre un script de una página pública no se deja
  // leer. En otra pestaña, para no mezclar su consola con la del CRM.
  const publica = await ctx.newPage();
  await publica.goto(`${BASE}/`);
  const ventana = await publica.evaluate(async (u) => {
    const w = window.open(u);
    await new Promise((res) => setTimeout(res, 2500));
    try {
      return { cerrada: w ? w.closed : null, texto: w.document.body.innerText.slice(0, 40) };
    } catch (e) {
      return { cerrada: w ? w.closed : null, error: String(e).slice(0, 80) };
    }
  }, `${CRM}/hoy`);
  caso("una página pública que abre el CRM en otra ventana no puede leerlo (COOP)", !ventana.texto, ventana);
  for (const p of ctx.pages()) if (p !== page) await p.close();
}

// 18. Salir: la cookie vieja ya no sirve.
await page.goto(`${CRM}/mas`);
await captura("07-mas");
await page.click("button:has-text('Cerrar la sesión en este equipo')");
await page.waitForURL(/\/acceso$/);
x = await pedir(`${CRM}/hoy`, { headers: { Cookie: cookie, ...NAVEGACION } });
caso("después de salir, la sesión vieja responde 403", x.status === 403);

// 19. Los topes de la clave (al final: pueden dejar la conexión de la prueba
// esperando 15 minutos).
const ipPrueba = "203.0.113.77";
const estados = [];
for (let i = 0; i < 6; i++) estados.push((await postFormulario("/acceso", { clave: `no-es-${i}` }, { ip: ipPrueba })).status);
caso("5 claves equivocadas desde una conexión cierran la entrada 15 minutos", estados.slice(0, 5).every((s) => s === 401) && estados[5] === 429, estados);
if (!WRANGLER) {
  // 20 fallos en una hora, desde varias conexiones: se cierra la entrada para todos y avisa.
  for (let i = 0; i < 3; i++) for (let j = 0; j < 5; j++) await postFormulario("/acceso", { clave: "no" }, { ip: `198.51.100.${i + 1}` });
  x = await postFormulario("/acceso", { clave: CLAVE }, { ip: "192.0.2.50" });
  const t = await telegram();
  caso("20 claves equivocadas en una hora cierran la entrada para todos y avisan por Telegram", x.status === 429 && t.some((m) => m.includes("cerró la entrada")), x.status);
}

caso("sin errores de JavaScript en la consola", erroresConsola.length === 0, erroresConsola.slice(0, 5));
caso("todos los recursos de las páginas cargan (CSS, JS y fuentes)", recursosConError.length === 0, recursosConError.slice(0, 8));
await navegador.close();

const fallas = resultados.filter((x) => !x.ok);
console.log(JSON.stringify({ total: resultados.length, fallas: fallas.length, resultados }, null, 1));
process.exit(fallas.length ? 1 : 0);
