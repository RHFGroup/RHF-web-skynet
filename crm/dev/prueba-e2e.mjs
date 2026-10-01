// Prueba de punta a punta del CRM, con los datos de crm/dev/semilla.sql.
//
// Contra el servidor de Node (crm/dev/servidor.ts):
//   PW=/ruta/a/playwright BASE=http://127.0.0.1:8790 node crm/dev/prueba-e2e.mjs [capturas/]
// Contra wrangler dev (los dos Workers juntos; ver crm/README.md):
//   MODO=wrangler DEVLOG=<registro de wrangler dev> D1_SQLITE=<archivo .sqlite local> \
//   BASE=http://127.0.0.1:8798 MOTOR=webkit|chromium PW=… node crm/dev/prueba-e2e.mjs [capturas/]
// Imprime un JSON con el resultado de cada caso; sale con código 1 si alguno falla.
import { execFileSync } from "node:child_process";
import fs from "node:fs";

const PW = process.env.PW ?? "playwright";
const pw = await import(PW.endsWith(".mjs") || PW.endsWith(".js") ? PW : `${PW}/index.mjs`);
const { devices } = pw;
const MOTOR = process.env.MOTOR ?? "chromium";
const BASE = process.env.BASE ?? "http://127.0.0.1:8790";
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

/** El último código de acceso que mandó el CRM. */
async function ultimoCodigo() {
  if (WRANGLER) {
    await new Promise((r) => setTimeout(r, 800));
    const log = fs.readFileSync(process.env.DEVLOG, "utf8");
    const todos = [...log.matchAll(/\[acceso\] código local: (\d{6})/g)];
    return todos.at(-1)?.[1] ?? "";
  }
  return (await fetch(`${BASE}/__dev/codigo`)).text();
}

/** Corre el resumen del día y devuelve lo que se mandó (o la línea del registro). */
async function resumenDelDia() {
  if (WRANGLER) {
    await fetch(`${BASE}/__scheduled?cron=${encodeURIComponent("30 12 * * *")}`);
    await new Promise((r) => setTimeout(r, 2500));
    const log = fs.readFileSync(process.env.DEVLOG, "utf8");
    return [...log.matchAll(/\{"resumen":[^\n]*\}/g)].at(-1)?.[0] ?? null;
  }
  return (await fetch(`${BASE}/__dev/resumen`)).json();
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
page.on("console", (m) => m.type() === "error" && !m.text().startsWith("Failed to load resource") && erroresConsola.push(`${new URL(page.url()).pathname}${new URL(page.url()).search}: ${m.text().slice(0, 120)}`));
page.on("pageerror", (e) => erroresConsola.push(String(e)));
// Las respuestas con error que no son las esperadas (la página de acceso sin
// sesión responde 403 a propósito, y los errores de formulario 401/422).
const recursosConError = [];
page.on("response", (r) => {
  const u = new URL(r.url());
  if (r.status() >= 400 && r.request().resourceType() !== "document") recursosConError.push(`${r.status()} ${u.pathname}`);
});
// caret: "initial" para que Playwright no inyecte un estilo (la CSP lo bloquea y ensucia la consola).
const captura = async (nombre) => CAPTURAS && page.screenshot({ path: `${CAPTURAS}/${nombre}.png`, fullPage: true, caret: "initial" });
const texto = async () => (await page.locator("main").innerText()).replace(/\s+/g, " ");

// 1. Sin sesión: la página de acceso, con 403.
let r = await page.goto(`${BASE}/hoy`);
caso("sin sesión, /hoy responde 403 con la página de acceso", r.status() === 403 && (await page.locator("text=Mandarme el código").count()) === 1);
await captura("01-acceso");

// 2. El código por Telegram.
await page.click("text=Mandarme el código");
await page.waitForURL(/paso=codigo/);
const codigo = await ultimoCodigo();
caso("el código llega a Telegram (6 dígitos)", /^\d{6}$/.test(codigo));
await page.fill("#codigo", codigo === "000000" ? "111111" : "000000");
await page.click("button:has-text('Entrar')");
caso("un código equivocado no entra", (await page.locator(".error").innerText()).includes("no coincide"));
await page.fill("#codigo", codigo);
await page.click("button:has-text('Entrar')");
await page.waitForURL(/\/hoy$/);
const cookies = await ctx.cookies();
const sesion = cookies.find((c) => c.name === "crm_sesion");
caso("la sesión es HttpOnly y SameSite=Lax", sesion && sesion.httpOnly && sesion.sameSite === "Lax", sesion && { httpOnly: sesion.httpOnly, sameSite: sesion.sameSite });
await captura("02-hoy");

// 3. Hoy: los ocho nuevos sin contactar (la prueba del agente no entra).
const sinContactar = await page.locator("#sin-contactar li").count();
caso("Hoy muestra los 8 leads sin contactar", sinContactar === 8, sinContactar);
caso("el nombre con <script> se ve como texto y no corre", (await texto()).includes("<script>alert(1)</script>") && dialogos.length === 0);

// 4. Listas.
await page.goto(`${BASE}/leads`);
const compradores = await page.locator(".tarjetas > li").count();
caso("Compradores: 7 tarjetas", compradores === 7, compradores);
await captura("03-compradores");
await page.goto(`${BASE}/propietarios`);
caso("Propietarios: 1 tarjeta (el de /vender)", (await page.locator(".tarjetas > li").count()) === 1);
await page.goto(`${BASE}/leads?q=3001234`);
caso("la búsqueda por teléfono encuentra a Ana", (await page.locator(".tarjetas > li").count()) === 1 && (await texto()).includes("Ana Prueba"));

// 5. La ficha de Ana: dos consultas (deduplicada) y su constancia.
await page.goto(`${BASE}/contacto/1`);
const t1 = await texto();
caso("la ficha de Ana junta sus dos consultas", (t1.match(/Escribió por el sitio/g) ?? []).length === 2);
caso("la ficha muestra las dos constancias de autorización", t1.includes("Consulta #1") && t1.includes("Consulta #8"));
const wa = await page.locator("a:has-text('WhatsApp')").first().getAttribute("href");
caso("el botón de WhatsApp abre wa.me con el número", wa === "https://wa.me/573001234567", wa);
await captura("04-ficha");

// 6. Registrar el primer contacto: pasa a Contactado y sale de «sin contactar».
await page.selectOption("#tipo-nota-1", "whatsapp");
await page.fill("#texto-nota-1", "Le mandé la ficha de Doral West.");
await page.click("form[action='/contacto/1/nota'] button[type=submit]");
await page.waitForURL(/ok=nota/);
caso("registrar el WhatsApp mueve a Contactado", (await texto()).includes("Nuevo → Contactado"));

// 7. Puntaje con motivo.
await page.selectOption("#puntaje-1", "B");
await page.fill("#motivo-puntaje-1", "Compra en 6 meses, crédito por definir");
await page.click("form[action='/oportunidad/1/puntaje'] button[type=submit]");
await page.waitForURL(/ok=puntaje/);
caso("el puntaje cambia con su motivo", (await texto()).includes("Sin calificar → B: Compra en 6 meses"));

// 8. Perdido sin motivo: el servidor no lo guarda. En la página, el motivo
// aparece y se vuelve obligatorio al elegir Perdido.
await page.goto(`${BASE}/contacto/3`);
caso("el motivo está escondido mientras la etapa no lo pide", await page.locator("#motivo-3").isHidden());
const sinMotivo = await page.request.post(`${BASE}/oportunidad/3/etapa`, {
  headers: { Origin: BASE },
  form: { etapa: "perdido" },
  maxRedirects: 0,
});
caso("Perdido sin motivo no se guarda (servidor)", sinMotivo.status() === 303 && (sinMotivo.headers()["location"] ?? "").includes("error=motivo"));
await page.selectOption("#etapa-3", "perdido");
caso("al elegir Perdido aparece el motivo, obligatorio", (await page.locator("#motivo-3").isVisible()) && (await page.locator("#motivo-3").evaluate((e) => e.required)));
await page.selectOption("#motivo-3", "No responde");
await page.click("form[action='/oportunidad/3/etapa'] button[type=submit]");
await page.waitForURL(/ok=etapa/);
caso("Perdido con motivo cierra la oportunidad", (await sql("SELECT cerrada, motivo_perdida FROM crm_oportunidades WHERE id = 3"))[0].cerrada === 1);

// 9. Tarea para hoy y recorrido: aparecen en Hoy.
await page.goto(`${BASE}/contacto/1`);
await page.fill("#titulo-tarea-1", "Llamar a Ana para confirmar el sábado");
await page.click("form[action='/contacto/1/tarea'] button[type=submit]");
await page.waitForURL(/ok=tarea/);
await page.click("text=Detalle, próxima acción y recorrido");
const manana = new Date(Date.now() - 5 * 3600_000 + 86_400_000).toISOString().slice(0, 10);
await page.fill("#recorrido-1", `${manana}T10:00`);
await page.fill("#proxima-1", "Confirmar recorrido");
await page.click("form[action='/oportunidad/1/detalle'] button[type=submit]");
await page.waitForURL(/ok=guardado/);
await page.goto(`${BASE}/hoy`);
const hoyTexto = await texto();
caso("Hoy muestra la tarea y el recorrido", hoyTexto.includes("Llamar a Ana para confirmar el sábado") && hoyTexto.includes("10:00"));
const quedan = await page.locator("#sin-contactar li").count();
caso("Ana (contactada) y Lucía (perdida) salen de los sin contactar", quedan === 6, quedan);
await page.click("#tareas form button[type=submit]");
await page.waitForURL(/ok=hecha/);
caso("la tarea se marca como hecha", (await sql("SELECT hecha_en FROM crm_tareas WHERE id = 1"))[0].hecha_en !== null);

// 10. Alta manual: sin autorización no se guarda; un teléfono existente va a su ficha.
await page.goto(`${BASE}/nuevo`);
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
await page.goto(`${BASE}/nuevo`);
await page.fill("#campo-nombre", "Lucía G.");
await page.fill("#campo-telefono", "3015550001");
await page.selectOption("#campo-fuente", "referido");
await page.selectOption("#campo-autorizacion_canal", "whatsapp");
await page.fill("#campo-autorizacion_evidencia", "Mensaje de WhatsApp del 1-oct.");
await page.check("#autoriza");
await page.click("button:has-text('Guardar lead')");
await page.waitForURL(/ok=existia/);
caso("un teléfono que ya existe va a la ficha que ya tenía", page.url().includes("/contacto/3"));
await captura("05-alta-sobre-ficha");

// 11. Boletín: baja, reactivación pendiente y CSV.
await page.goto(`${BASE}/boletin`);
caso("el boletín cuenta 2 activos", (await page.locator(".resumen .cifra b").first().innerText()) === "2");
caso("aparece la reactivación pendiente", (await texto()).includes("volver@example.com"));
await captura("06-boletin");
await page.click("form[action^='/boletin/1/baja'] button");
await page.waitForURL(/ok=baja/);
caso("dar de baja pide confirmación y funciona", dialogos.some((d) => d.includes("lector@example.com")) && (await sql("SELECT estado FROM suscriptores WHERE id = 1"))[0].estado === "baja");
await page.click("form[action='/boletin/3/reactivar'] button");
await page.waitForURL(/ok=guardado/);
const reactivado = (await sql("SELECT estado, ip, origen FROM suscriptores WHERE id = 3"))[0];
caso("reactivar usa la constancia del pedido", reactivado.estado === "activa" && reactivado.origen === "/inteligencia-de-mercado", reactivado);
const csv = await (await page.request.get(`${BASE}/boletin/activos.csv`)).text();
caso("el CSV trae solo los activos", csv.includes("emily@example.com") && csv.includes("volver@example.com") && !csv.includes("lector@example.com"));

// 12. Ley 1581: exportar, reclamo y suprimir.
const exp = await page.request.get(`${BASE}/contacto/7/exportar`);
const datos = await exp.json();
caso("exportar trae persona, consultas y boletín", datos.persona.correo === "emily@example.com" && datos.consultas_del_sitio.length === 1 && datos.boletin.length === 1);
await page.goto(`${BASE}/contacto/7`);
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

// 13. Auditoría.
await page.goto(`${BASE}/auditoria`);
const aud = await texto();
caso("la auditoría registra ver, exportar y suprimir", aud.includes("Vio la ficha") && aud.includes("Exportó los datos de la persona") && aud.includes("Suprimió los datos de la persona"));

// 14. El enlace del aviso de Telegram.
await page.goto(`${BASE}/c/10`);
caso("/c/<consulta> abre la ficha de esa consulta", page.url().endsWith("/contacto/8"));

// 15. Resumen del día.
const resumen = await resumenDelDia();
if (WRANGLER) {
  // En local el Worker del sitio no tiene el bot: llegar hasta su envío (y que
  // falle ahí) prueba el cron y el servicio AVISOS de punta a punta.
  caso("el resumen del día corre y llega al Worker del sitio por el servicio AVISOS", typeof resumen === "string" && resumen.includes('"resumen":"fallo"') && /sin_configurar|telegram_4\d\d/.test(resumen), resumen);
} else {
  caso("el resumen del día sale por Telegram con cifras y enlace", typeof resumen === "string" && resumen.includes("Tu día en el CRM") && resumen.includes("crm.rhfliving.com/hoy"), resumen);
}

// 16. Seguridad de las escrituras.
const cookie = `crm_sesion=${sesion.value}`;
let x = await fetch(`${BASE}/contacto/1/nota`, { method: "POST", headers: { Cookie: cookie, "Content-Type": "application/x-www-form-urlencoded" }, body: "tipo=nota&texto=x", redirect: "manual" });
caso("una escritura sin Origin responde 403", x.status === 403);
x = await fetch(`${BASE}/contacto/1/nota`, { method: "POST", headers: { Cookie: cookie, Origin: "https://otro.example", "Content-Type": "application/x-www-form-urlencoded" }, body: "tipo=nota&texto=x", redirect: "manual" });
caso("una escritura desde otro origen responde 403", x.status === 403);
x = await fetch(`${BASE}/contacto/1`, { redirect: "manual" });
caso("la ficha sin sesión responde 403", x.status === 403);
x = await fetch(`${BASE}/contacto/1/exportar`, { redirect: "manual" });
caso("exportar sin sesión responde 403", x.status === 403);
x = await fetch(`${BASE}/crm.js`, { redirect: "manual" });
caso("el script del CRM sin sesión responde 403", x.status === 403);
const h = (await fetch(`${BASE}/hoy`, { headers: { Cookie: cookie } })).headers;
caso("cabeceras: CSP estricta, noindex, sin caché", (h.get("content-security-policy") ?? "").includes("default-src 'none'") && h.get("x-robots-tag")?.includes("noindex") && h.get("cache-control") === "no-store");

// 17. Salir: la cookie vieja ya no sirve.
await page.goto(`${BASE}/mas`);
await captura("07-mas");
await page.click("button:has-text('Cerrar la sesión en este equipo')");
await page.waitForURL(/\/acceso$/);
x = await fetch(`${BASE}/hoy`, { headers: { Cookie: cookie } });
caso("después de salir, la sesión vieja responde 403", x.status === 403);

caso("sin errores de JavaScript en la consola", erroresConsola.length === 0, erroresConsola.slice(0, 5));
caso("todos los recursos de las páginas cargan (CSS, JS y fuentes)", recursosConError.length === 0, recursosConError.slice(0, 8));
await navegador.close();

const fallas = resultados.filter((x) => !x.ok);
console.log(JSON.stringify({ total: resultados.length, fallas: fallas.length, resultados }, null, 1));
process.exit(fallas.length ? 1 : 0);
