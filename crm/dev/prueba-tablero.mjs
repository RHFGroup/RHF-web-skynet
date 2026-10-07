// Prueba de punta a punta de lo que agregó el tablero (7-oct-2026): el embudo
// que se arrastra, el intento de contacto, el SLA, la higiene, los chats de la
// IA, el tablero y la inversión. Contra el arnés de Node (crm/dev/servidor.ts),
// con los datos de crm/dev/semilla.sql:
//   PW=/ruta/a/playwright BASE=http://127.0.0.1:8790 node crm/dev/prueba-tablero.mjs [capturas/]
// MOTOR=webkit para correrla en el motor del iPhone.
import http from "node:http";

const PW = process.env.PW ?? "playwright";
const pw = await import(PW.endsWith(".mjs") || PW.endsWith(".js") ? PW : `${PW}/index.mjs`);
const MOTOR = process.env.MOTOR ?? "chromium";
const BASE = process.env.BASE ?? "http://127.0.0.1:8790";
const RUTA = process.env.RUTA ?? "/r/prueba-crm-0123456789abcdef";
const CLAVE = process.env.CLAVE ?? "clave de prueba del CRM";
const CRM = `${BASE}${RUTA}`;
const CAPTURAS = process.argv[2] ?? null;

const resultados = [];
function caso(nombre, ok, detalle) {
  resultados.push({ caso: nombre, ok: Boolean(ok), ...(detalle !== undefined ? { detalle } : {}) });
}
async function sql(q) {
  return (await fetch(`${BASE}/__dev/sql`, { method: "POST", body: q })).json();
}
async function minuto(ahora) {
  const r = await fetch(`${BASE}/__dev/minuto?ahora=${encodeURIComponent(ahora)}`);
  return { mensajes: await r.json(), sentencias: Number(r.headers.get("x-d1-sentencias")) };
}
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

const navegador = await pw[MOTOR].launch(process.env.CANAL ? { channel: process.env.CANAL } : {});
// Ancha, para que las 9 columnas del embudo quepan sin desplazarse.
const ctx = await navegador.newContext({ viewport: { width: 3000, height: 1000 }, locale: "es-CO" });
const page = await ctx.newPage();
// WhatsApp y el teléfono no salen de la prueba.
await ctx.route(/wa\.me|whatsapp\.com/, (r) => r.abort());
const erroresConsola = [];
page.on("console", (m) => m.type() === "error" && !m.text().startsWith("Failed to load resource") && erroresConsola.push(m.text().slice(0, 160)));
page.on("pageerror", (e) => erroresConsola.push(String(e)));
const captura = async (nombre, p = page) => CAPTURAS && p.screenshot({ path: `${CAPTURAS}/${nombre}.png`, fullPage: true, caret: "initial" });
const texto = async (p = page) => (await p.locator("main").innerText()).replace(/\s+/g, " ");

// ── Entrar ──────────────────────────────────────────────────────────────
await page.goto(`${CRM}/acceso`);
await page.fill("#clave", CLAVE);
await Promise.all([page.waitForURL(/\/hoy$/), page.click("button:has-text('Entrar')")]);
const csrf = await page.locator('meta[name="crm-csrf"]').getAttribute("content");
caso("la página trae el token y la ruta para crm.js", /^[0-9a-f]{32}$/.test(csrf ?? "") && (await page.locator('meta[name="crm-ruta"]').getAttribute("content")) === RUTA);

// ── Hoy: el SLA ─────────────────────────────────────────────────────────
caso("Hoy: 8 esperan respuesta, con su estado de SLA", (await page.locator("#esperan li").count()) === 8 && (await page.locator("#esperan .estado").count()) === 8);
caso("el nombre con <script> sigue siendo texto", (await texto()).includes("<script>alert(1)</script>"));

// ── El embudo ───────────────────────────────────────────────────────────
await page.goto(`${CRM}/embudo`);
caso("el embudo de compradores tiene 9 columnas", (await page.locator(".kanban .columna").count()) === 9);
const enNuevo = await page.locator('.columna[data-etapa="nuevo"] .tarjeta-lead').count();
caso("en «Nuevo» están los 7 compradores", enNuevo === 7, enNuevo);
await captura("t01-embudo");

const op = async (nombre) => (await sql(`SELECT o.* FROM crm_oportunidades o JOIN crm_contactos c ON c.id = o.contacto_id WHERE c.nombre = '${nombre}' AND o.tipo = 'compra'`))[0];
async function arrastrar(nombre, etapa) {
  const tarjeta = page.locator(".tarjeta-lead", { hasText: nombre }).first();
  const destino = page.locator(`.columna[data-etapa="${etapa}"]`);
  await destino.scrollIntoViewIfNeeded();
  await tarjeta.scrollIntoViewIfNeeded();
  const a = await tarjeta.boundingBox();
  const b = await destino.boundingBox();
  await page.mouse.move(a.x + 30, a.y + 12);
  await page.mouse.down();
  await page.mouse.move(a.x + 60, a.y + 30, { steps: 4 });
  await page.mouse.move(b.x + b.width / 2, b.y + 60, { steps: 12 });
  await page.mouse.up();
}

const antes = await op("Ana Prueba");
await arrastrar("Ana Prueba", "contactado");
await page.waitForSelector(".toast:not([hidden])");
const toast1 = await page.locator(".toast").innerText();
await page.waitForTimeout(300);
const ana = await op("Ana Prueba");
caso("arrastrar a «Contactado» guarda la etapa sin recargar", ana.etapa === "contactado" && toast1.includes("Contactado") && page.url().endsWith("/embudo"), { etapa: ana.etapa, toast: toast1 });
caso("mover la etapa marca la fase, cierra la espera y mide la respuesta", ana.fase_contactado_en && ana.espera_desde === null && ana.primer_intento_en && antes.espera_desde, {
  fase: ana.fase_contactado_en,
  espera: ana.espera_desde,
  minutos: ana.minutos_respuesta,
});
caso("la tarjeta quedó en la columna nueva", (await page.locator('.columna[data-etapa="contactado"] .tarjeta-lead', { hasText: "Ana Prueba" }).count()) === 1);
caso("los conteos de las columnas se actualizan", (await page.locator('.columna[data-etapa="nuevo"] [data-cuenta]').innerText()) === "6");
const totalContactado = await page.locator('.columna[data-etapa="contactado"] [data-total]').innerText();
caso("y el valor de la columna se mueve con la tarjeta, como en GHL", /^\$[\d.,]+ M$/.test(totalContactado), totalContactado);

// Perdido pide el motivo; cancelar deja todo como estaba.
await arrastrar("Simón Simulador", "perdido");
await page.waitForSelector("#dialogo-motivo[open]");
await page.click("#dialogo-motivo button[value=cancelar]");
await page.waitForTimeout(300);
caso("cancelar el motivo devuelve la tarjeta", (await op("Simón Simulador")).etapa === "nuevo" && (await page.locator('.columna[data-etapa="nuevo"] .tarjeta-lead', { hasText: "Simón" }).count()) === 1);
await arrastrar("Simón Simulador", "perdido");
await page.waitForSelector("#dialogo-motivo[open]");
await page.selectOption("#dialogo-motivo-select", "Presupuesto");
await page.click("#dialogo-motivo button[value=confirmar]");
await page.waitForSelector(".toast:not([hidden])");
await page.waitForTimeout(300);
const simon = await op("Simón Simulador");
caso("Perdido con el motivo del diálogo se guarda y cierra", simon.etapa === "perdido" && simon.motivo_perdida === "Presupuesto" && simon.cerrada === 1, simon.etapa);
caso("descartar sin haberle escrito no cuenta como respuesta", simon.primer_intento_en === null && simon.minutos_respuesta === null);

// Cerca del borde, el embudo se desplaza solo mientras se arrastra.
await page.setViewportSize({ width: 1200, height: 900 });
await page.goto(`${CRM}/embudo`);
const kanbanAntes = await page.evaluate(() => document.querySelector(".kanban").scrollLeft);
const t0 = await page.locator(".tarjeta-lead", { hasText: "Lucía Guía" }).boundingBox();
await page.mouse.move(t0.x + 30, t0.y + 12);
await page.mouse.down();
await page.mouse.move(t0.x + 60, t0.y + 30, { steps: 4 });
await page.mouse.move(1185, t0.y + 40, { steps: 8 });
await page.waitForTimeout(900);
const kanbanDespues = await page.evaluate(() => document.querySelector(".kanban").scrollLeft);
await page.keyboard.press("Escape");
await page.mouse.up();
caso("arrastrando cerca del borde, el embudo se desplaza solo", kanbanDespues > kanbanAntes + 100, { kanbanAntes, kanbanDespues });
caso("Escape cancela el arrastre sin mover nada", (await op("Lucía Guía")).etapa === "nuevo");
await page.setViewportSize({ width: 3000, height: 1000 });

// «Mover a…»: el formulario de siempre, sin arrastrar.
await page.goto(`${CRM}/embudo`);
const tarjetaLucia = page.locator(".tarjeta-lead", { hasText: "Lucía Guía" });
await tarjetaLucia.locator("summary").click();
await tarjetaLucia.locator("select[name=etapa]").selectOption("calificado");
await Promise.all([page.waitForURL(/embudo\?ok=etapa/), tarjetaLucia.locator("button[type=submit]").click()]);
caso("«Mover a…» funciona sin arrastrar y vuelve al embudo", (await op("Lucía Guía")).etapa === "calificado");

// ── Seguridad de las acciones por fetch ─────────────────────────────────
const id = (await op("María WhatsApp")).id;
const pruebaFetch = (url, opciones) =>
  page.evaluate(async ([u, o]) => {
    const f = new FormData();
    for (const [k, v] of Object.entries(o.datos ?? {})) f.append(k, v);
    const r = await fetch(u, { method: o.metodo ?? "POST", body: o.metodo === "GET" ? undefined : f, headers: o.headers ?? {} });
    return { status: r.status, cuerpo: (await r.text()).slice(0, 120) };
  }, [url, opciones]);
let x = await pruebaFetch(`${CRM}/oportunidad/${id}/etapa`, { datos: { _csrf: csrf, etapa: "contactado" }, headers: { "X-CRM": "1" } });
caso("fetch con X-CRM y el token mueve la etapa (JSON)", x.status === 200 && x.cuerpo === '{"ok":true}', x);
x = await pruebaFetch(`${CRM}/oportunidad/${id}/etapa`, { datos: { _csrf: csrf, etapa: "calificado" } });
caso("sin X-CRM, un fetch no escribe (403)", x.status === 403, x.status);
x = await pruebaFetch(`${CRM}/oportunidad/${id}/etapa`, { datos: { _csrf: "0".repeat(32), etapa: "calificado" }, headers: { "X-CRM": "1" } });
caso("con otro token, tampoco (403)", x.status === 403, x.status);
x = await pruebaFetch(`${CRM}/contacto/1/nota`, { datos: { _csrf: csrf, tipo: "nota", texto: "x" }, headers: { "X-CRM": "1" } });
caso("X-CRM solo abre las dos acciones de crm.js (403 en las demás)", x.status === 403, x.status);
x = await pruebaFetch(`${CRM}/hoy`, { metodo: "GET", headers: { "X-CRM": "1" } });
caso("las lecturas por fetch siguen cerradas aunque lleven X-CRM", x.status === 403, x.status);
x = await pruebaFetch(`${CRM}/oportunidad/${id}/etapa`, { datos: { _csrf: csrf, etapa: "perdido" }, headers: { "X-CRM": "1" } });
caso("una acción incompleta responde el código del error, sin datos", x.status === 422 && x.cuerpo === '{"ok":false,"error":"motivo"}', x);

// ── El intento de contacto ──────────────────────────────────────────────
await page.goto(`${CRM}/hoy`);
const filaJohn = page.locator("#esperan li", { hasText: "John Chat" });
const [emergente] = await Promise.all([page.waitForEvent("popup").catch(() => null), filaJohn.locator("a[data-intento=whatsapp]").click()]);
if (emergente) await emergente.close();
await page.waitForTimeout(600);
const john = await op("John Chat");
const intento = await sql(`SELECT texto FROM crm_actividades WHERE tipo = 'intento' AND contacto_id = ${john.contacto_id}`);
caso("tocar WhatsApp anota el intento y cierra la espera", intento.length === 1 && john.espera_desde === null && john.primer_intento_en !== null, { intento, espera: john.espera_desde });
await page.goto(`${CRM}/hoy`);
caso("John sale de «Esperan respuesta»", (await page.locator("#esperan li", { hasText: "John Chat" }).count()) === 0);

// ── El SLA en el cron de cada minuto ────────────────────────────────────
// Miércoles 7-oct-2026, 10:08 a. m. de Colombia: llega un lead.
await sql(`INSERT INTO consultas (creado_en, nombre, contacto, proyecto, mensaje, autoriza, version_aviso, origen, presupuesto, forma_pago, objetivo, atribucion, canal)
  VALUES ('2026-10-07T15:08:00.000Z', 'Rita Reloj', '3005559999', 'doral-west', 'Quiero información', 1, '2026-09-18', '/proyectos/doral-west',
          '400_600', 'credito', 'renta_corta', '{"utm_source":"instagram","utm_medium":"paid","utm_campaign":"doral-oct","landing":"/proyectos/doral-west"}', 'meta_ads')`);
let m = await minuto("2026-10-07T15:14:00Z");
caso("a los 6 minutos hábiles no avisa", m.mensajes.length === 0, m.mensajes);
m = await minuto("2026-10-07T15:18:30Z");
const aviso10 = m.mensajes.join("\n");
caso("a los 10 minutos avisa por Telegram, sin el nombre", m.mensajes.length === 1 && aviso10.includes("espera respuesta hace 10 minutos") && !aviso10.includes("Rita") && aviso10.includes(`${RUTA}/contacto/`) && aviso10.includes("Meta Ads"), aviso10);
m = await minuto("2026-10-07T15:19:30Z");
caso("no repite el aviso de los 10", m.mensajes.length === 0, m.mensajes);
m = await minuto("2026-10-07T15:23:30Z");
caso("a los 15 avisa que se venció", m.mensajes.length === 1 && m.mensajes[0].includes("Se venció el SLA"), m.mensajes);
caso("el cron de cada minuto no pasa de 50 sentencias", m.sentencias > 0 && m.sentencias <= 50, m.sentencias);
const rita = await op("Rita Reloj");
caso("la consulta con las tres preguntas y el canal llega calificada", rita.rango_presupuesto === "400_600" && rita.pago === "credito" && rita.proposito === "renta_corta" && rita.canal === "meta_ads", rita);

// Un lead del 6-oct a las 9 a. m.: en el arranque del SLA no dispara avisos viejos.
await sql(`INSERT INTO consultas (creado_en, nombre, contacto, mensaje, autoriza, version_aviso, origen) VALUES ('2026-10-06T14:00:00.000Z', 'Viejo Lead', '3005558888', 'Hola', 1, '2026-09-18', '/')`);
m = await minuto("2026-10-07T15:30:00Z");
const viejo = await op("Viejo Lead");
caso("una espera de más de 2 horas hábiles se marca sin avisar", m.mensajes.length === 0 && viejo.sla_vencido_en !== null, m.mensajes);

// ── La higiene ──────────────────────────────────────────────────────────
const emily = await op("Emily Form");
await sql(`UPDATE crm_oportunidades SET espera_desde = NULL, ultima_actividad_en = '2026-09-29T15:00:00.000Z' WHERE id = ${emily.id}`);
// La higiene corre dos veces por hora (minutos 7 y 37, crm/src/cron.ts).
m = await minuto("2026-10-07T15:36:00Z");
caso("fuera de sus minutos la higiene no corre", (await sql(`SELECT COUNT(*) AS n FROM crm_tareas WHERE oportunidad_id = ${emily.id} AND hecha_en IS NULL`))[0].n === 0);
m = await minuto("2026-10-07T15:37:00Z");
const tareaEmily = await sql(`SELECT titulo, regla, vence_en FROM crm_tareas WHERE oportunidad_id = ${emily.id} AND hecha_en IS NULL`);
caso("7 días sin actividad: tarea «Retomar» para hoy", tareaEmily.length === 1 && tareaEmily[0].regla === "higiene_7" && tareaEmily[0].vence_en === "2026-10-07", tareaEmily);
await sql(`UPDATE crm_oportunidades SET ultima_actividad_en = '2026-09-01T15:00:00.000Z' WHERE id = ${emily.id}`);
m = await minuto("2026-10-07T16:07:00Z");
const emily30 = await op("Emily Form");
caso("30 días sin actividad: el comprador pasa solo a Nutrir", emily30.etapa === "nutrir" && emily30.higiene_nivel === 30);
caso("y su tarea de higiene queda hecha", (await sql(`SELECT COUNT(*) AS n FROM crm_tareas WHERE oportunidad_id = ${emily.id} AND hecha_en IS NULL`))[0].n === 0);

// ── El SLA fuera de horario y las esperas viejas (plan gratis) ─────────────
// Llega a las 6:10 p. m. del miércoles: el reloj no corre de noche, y el
// aviso de los 10 minutos sale el jueves a las 8:10 a. m.
await sql(`INSERT INTO consultas (creado_en, nombre, contacto, mensaje, autoriza, version_aviso, origen) VALUES ('2026-10-07T23:10:00.000Z', 'Noche Lead', '3005557777', 'Hola', 1, '2026-10-07', '/')`);
m = await minuto("2026-10-08T01:00:00Z");
caso("de noche el SLA no corre ni avisa", m.mensajes.length === 0 && (await op("Noche Lead")).sla_aviso_en === null, m.mensajes);
m = await minuto("2026-10-08T13:10:30Z");
caso("al día siguiente, a los 10 minutos hábiles, avisa", m.mensajes.length === 1 && m.mensajes[0].includes("hace 10 minutos"), m.mensajes);
// Una espera de hace más de una semana ya no se lee cada minuto.
await sql(`INSERT INTO consultas (creado_en, nombre, contacto, mensaje, autoriza, version_aviso, origen) VALUES ('2026-09-28T14:00:00.000Z', 'Antiguo Lead', '3005556666', 'Hola', 1, '2026-09-18', '/')`);
m = await minuto("2026-10-08T13:11:30Z");
const antiguo = await op("Antiguo Lead");
caso("una espera de hace más de 7 días queda fuera del SLA", m.mensajes.length === 0 && antiguo.espera_desde !== null && antiguo.sla_vencido_en === null, antiguo.sla_vencido_en);

// ── Los chats de la IA ──────────────────────────────────────────────────
const lote = {
  conversaciones: [
    {
      sesion: "20261007_090000_prueba01",
      canal: "whatsapp",
      usuario: "573001234567",
      mensajes: [
        { id: 101, rol: "user", texto: "Hola, ¿siguen las casas de Doral West? <img src=x onerror=alert(3)>", en: 1791378000 },
        { id: 102, rol: "assistant", texto: "¡Hola! Sí, desde $525.000.000, con corte de septiembre.", en: 1791378060 },
      ],
    },
    { sesion: "20261007_091000_prueba02", canal: "webchat", usuario: null, mensajes: [{ id: 201, rol: "user", texto: "¿Aceptan permuta?", en: 1791378600 }] },
  ],
};
const enviar = async () => (await fetch(`${BASE}/__dev/conversaciones`, { method: "POST", body: JSON.stringify(lote) })).json();
let rc = await enviar();
rc = await enviar();
const nMensajes = (await sql("SELECT COUNT(*) AS n FROM agente_mensajes"))[0].n;
caso("repetir el mismo lote no duplica mensajes", rc.ok && nMensajes === 3, { rc, nMensajes });
const conv = (await sql("SELECT contacto_id, telefono, mensajes FROM agente_conversaciones WHERE sesion = '20261007_090000_prueba01'"))[0];
caso("la conversación de WhatsApp se enlaza con la ficha por el teléfono", conv.contacto_id === ana.contacto_id && conv.telefono === "+573001234567", conv);
await page.goto(`${CRM}/conversaciones`);
caso("la bandeja muestra las dos conversaciones", (await page.locator(".bandeja-item").count()) === 2);
await page.goto(`${CRM}/conversaciones?ficha=sin`);
caso("el filtro «Sin ficha» deja solo la del visitante", (await page.locator(".bandeja-item").count()) === 1 && (await texto()).includes("Visitante de la web"));
await page.goto(`${CRM}/conversaciones?q=permuta`);
caso("la búsqueda encuentra lo que escribieron", (await page.locator(".bandeja-item").count()) === 1);
await page.goto(`${CRM}/conversaciones`);
await page.locator(".bandeja-item", { hasText: "Ana Prueba" }).click();
caso("la conversación se ve en burbujas, con el texto escapado", (await page.locator(".burbuja").count()) === 2 && (await texto()).includes("<img src=x onerror=alert(3)>"));
await captura("t02-conversacion");
await page.goto(`${CRM}/contacto/${ana.contacto_id}`);
caso("la ficha de Ana muestra lo que conversó con la IA", (await texto()).includes("Lo que conversó con la IA") && (await page.locator(".conversacion--ficha .burbuja").count()) === 2);

// ── La ficha: calificación y origen ─────────────────────────────────────
await page.goto(`${CRM}/contacto/${rita.contacto_id}`);
const tRita = await texto();
caso("la ficha muestra las tres respuestas y el canal con la campaña", tRita.includes("3 de 3 respuestas") && tRita.includes("De 400 a 600 millones") && tRita.includes("Meta Ads") && tRita.includes("doral-oct"), tRita.slice(0, 200));
await captura("t03-ficha");

// ── El tablero y la inversión ───────────────────────────────────────────
await page.goto(`${CRM}/tablero?periodo=semana`);
caso("el tablero muestra las 5 métricas", (await page.locator(".kpis--cinco .kpi").count()) === 5);
await page.fill("#inv-meta_ads", "1.500.000");
await page.fill("#inv-google_ads", "$ 800.000");
await Promise.all([page.waitForURL(/ok=inversion/), page.click("button:has-text('Guardar la inversión')")]);
const inv = await sql("SELECT canal, monto FROM crm_inversion ORDER BY canal");
caso("la inversión de la semana se guarda en pesos", inv.length === 2 && inv.find((f) => f.canal === "meta_ads").monto === 1500000 && inv.find((f) => f.canal === "google_ads").monto === 800000, inv);
await page.goto(`${CRM}/tablero?periodo=semana`);
const tTablero = await texto();
caso("con la inversión cargada sale el costo por lead calificado", !tTablero.includes("Falta la inversión"), tTablero.slice(0, 300));
caso("cada gráfica tiene su tabla", (await page.locator(".ver-tabla").count()) >= 3);
await captura("t04-tablero");
await page.fill("#inv-meta_ads", "mil pesos");
await Promise.all([page.waitForURL(/error=monto/), page.click("button:has-text('Guardar la inversión')")]);
caso("un monto que no se entiende no se guarda", (await sql("SELECT monto FROM crm_inversion WHERE canal = 'meta_ads'"))[0].monto === 1500000);

// ── Ley 1581: suprimir también borra sus conversaciones ─────────────────
await page.goto(`${CRM}/contacto/${ana.contacto_id}`);
await page.click("text=Protección de datos (Ley 1581)");
await page.fill(`#confirmar-${ana.contacto_id}`, "Ana Prueba");
await Promise.all([page.waitForURL(/ok=suprimido/), page.click("button:has-text('Suprimir sus datos')")]);
caso("suprimir borra sus conversaciones con la IA", (await sql("SELECT COUNT(*) AS n FROM agente_conversaciones WHERE telefono = '+573001234567'"))[0].n === 0);

// ── En el teléfono ──────────────────────────────────────────────────────
const iphone = { ...pw.devices["iPhone 13"] };
delete iphone.defaultBrowserType;
const movil = await navegador.newContext({ ...iphone, locale: "es-CO" });
const pm = await movil.newPage();
pm.on("pageerror", (e) => erroresConsola.push(String(e)));
await pm.goto(`${CRM}/acceso`);
await pm.fill("#clave", CLAVE);
await Promise.all([pm.waitForURL(/\/hoy$/), pm.click("button:has-text('Entrar')")]);
await pm.goto(`${CRM}/embudo`);
const anchoPagina = await pm.evaluate(() => document.documentElement.scrollWidth);
caso("en el teléfono la página no se desborda a lo ancho (el embudo se desliza adentro)", anchoPagina <= 390, anchoPagina);
caso("en el teléfono se ven las pestañas de abajo y no la barra lateral", (await pm.locator(".pestanas").isVisible()) && !(await pm.locator(".lateral").isVisible()));
await captura("t05-embudo-telefono", pm);
await pm.goto(`${CRM}/tablero`);
const anchoTablero = await pm.evaluate(() => ({
  ancho: document.documentElement.scrollWidth,
  // Qué se sale, para saber dónde mirar si falla.
  afuera: [...document.querySelectorAll("main *")]
    .filter((n) => n.getBoundingClientRect().right > 391 && !n.closest(".tabla-desliza, .kanban, figure .desliza"))
    .slice(0, 6)
    .map((n) => `${n.tagName.toLowerCase()}.${[...n.classList].join(".")} → ${Math.round(n.getBoundingClientRect().right)}`),
}));
caso("el tablero en el teléfono tampoco se desborda", anchoTablero.ancho <= 390, anchoTablero);
await captura("t06-tablero-telefono", pm);

caso("sin errores de JavaScript", erroresConsola.length === 0, erroresConsola.slice(0, 5));
await navegador.close();
const fallas = resultados.filter((r) => !r.ok);
console.log(JSON.stringify({ total: resultados.length, fallas: fallas.length, resultados }, null, 1));
process.exit(fallas.length ? 1 : 0);
