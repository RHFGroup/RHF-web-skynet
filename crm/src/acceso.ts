/**
 * La puerta del CRM: un código de 6 dígitos que llega por Telegram (decisión
 * de Rafael, 1-oct-2026: gratis y sin tarjeta).
 *
 * 1. En /acceso, Rafael toca «Mandarme el código». El Worker genera un código,
 *    guarda solo su huella y se lo manda por el bot de avisos del sitio.
 * 2. Rafael escribe el código. Si coincide, el Worker abre una sesión de 30 días
 *    con una cookie que el JavaScript de la página no puede leer.
 *
 * Topes: un código por minuto, cinco por hora, cinco intentos por código, y el
 * código vence a los 5 minutos. Con eso, adivinar es inviable: 25 intentos por
 * hora contra un millón de combinaciones.
 *
 * Todo lo que no es /acceso exige sesión, en el servidor (ver src/index.ts).
 */
import { ahoraIso, auditar, esLocal, type Ctx } from "./base";

const COOKIE = "__Host-crm_sesion";
/** En el Mac (http://127.0.0.1) la cookie no puede ser `Secure`, y `__Host-` lo exige. */
const COOKIE_LOCAL = "crm_sesion";
const DIAS_SESION = 30;
const MINUTOS_CODIGO = 5;
const INTENTOS_POR_CODIGO = 5;
const CODIGOS_POR_HORA = 5;
const SEGUNDOS_ENTRE_CODIGOS = 60;
/** La sesión anota su último uso como mucho cada 15 minutos (menos escrituras). */
const MINUTOS_ULTIMO_USO = 15;

const cod = new TextEncoder();

async function sha256(texto: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", cod.encode(texto));
  return [...new Uint8Array(d)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

function aleatorioHex(bytes: number): string {
  const b = new Uint8Array(bytes);
  crypto.getRandomValues(b);
  return [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

/** Un código de 6 dígitos, sin sesgo (se descartan los valores del borde). */
function codigoNuevo(): string {
  const buf = new Uint32Array(1);
  const limite = Math.floor(0x1_0000_0000 / 1_000_000) * 1_000_000;
  for (;;) {
    crypto.getRandomValues(buf);
    if (buf[0] < limite) return String(buf[0] % 1_000_000).padStart(6, "0");
  }
}

function tokenNuevo(): string {
  const b = new Uint8Array(32);
  crypto.getRandomValues(b);
  let s = "";
  for (const x of b) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Comparación en tiempo constante. */
function iguales(a: string, b: string): boolean {
  const x = cod.encode(a);
  const y = cod.encode(b);
  if (x.byteLength !== y.byteLength) return false;
  let r = 0;
  for (let i = 0; i < x.byteLength; i++) r |= x[i] ^ y[i];
  return r === 0;
}

function nombreCookie(c: Ctx): string {
  return esLocal(c.url) ? COOKIE_LOCAL : COOKIE;
}

function leerCookie(request: Request, nombre: string): string | null {
  const h = request.headers.get("Cookie") ?? "";
  for (const parte of h.split(";")) {
    const i = parte.indexOf("=");
    if (i > 0 && parte.slice(0, i).trim() === nombre) return parte.slice(i + 1).trim();
  }
  return null;
}

/**
 * ¿El formulario se envió desde el mismo CRM? Toda escritura lo exige. Los
 * navegadores mandan `Origin` en cada POST. Si no lo mandan, o lo mandan como
 * «null» (pasa con algunas políticas de referer), se acepta solo con
 * `Sec-Fetch-Site: same-origin`, que el navegador pone y una página ajena no
 * puede falsificar.
 */
export function mismoOrigen(c: Ctx): boolean {
  const origen = c.request.headers.get("Origin");
  if (origen && origen !== "null") return origen === c.url.origin;
  return c.request.headers.get("Sec-Fetch-Site") === "same-origin";
}

/** ¿Hay una sesión válida? Devuelve el usuario, o null. */
export async function sesionDe(c: Ctx): Promise<string | null> {
  const token = leerCookie(c.request, nombreCookie(c));
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const hash = await sha256(token);
  const ahora = ahoraIso();
  const fila = await c.db
    .prepare(
      `SELECT usuario, ultimo_uso_en FROM crm_sesiones
        WHERE token_hash = ? AND revocada_en IS NULL AND expira_en > ?`,
    )
    .bind(hash, ahora)
    .first<{ usuario: string; ultimo_uso_en: string | null }>();
  if (!fila) return null;
  const viejo = !fila.ultimo_uso_en || Date.now() - new Date(fila.ultimo_uso_en).getTime() > MINUTOS_ULTIMO_USO * 60_000;
  if (viejo) {
    await c.db.prepare(`UPDATE crm_sesiones SET ultimo_uso_en = ? WHERE token_hash = ?`).bind(ahora, hash).run();
  }
  return fila.usuario;
}

export type Resultado = { ok: true } | { ok: false; error: string };

/** Genera un código y lo manda por Telegram. */
export async function pedirCodigo(c: Ctx): Promise<Resultado> {
  const ahora = new Date();
  const haceUnaHora = new Date(ahora.getTime() - 3600_000).toISOString();
  const recientes = await c.db
    .prepare(`SELECT COUNT(*) AS n, MAX(creado_en) AS ultimo FROM crm_codigos WHERE creado_en > ?`)
    .bind(haceUnaHora)
    .first<{ n: number; ultimo: string | null }>();
  if ((recientes?.n ?? 0) >= CODIGOS_POR_HORA) {
    return { ok: false, error: "Ya se pidieron cinco códigos en la última hora. Espera un rato y vuelve a intentarlo." };
  }
  if (recientes?.ultimo && ahora.getTime() - new Date(recientes.ultimo).getTime() < SEGUNDOS_ENTRE_CODIGOS * 1000) {
    return { ok: false, error: "Ya te mandé un código hace menos de un minuto. Revisa Telegram." };
  }

  const codigo = codigoNuevo();
  const sal = aleatorioHex(16);
  const huella = `${sal}.${await sha256(`${sal}:${codigo}`)}`;
  const expira = new Date(ahora.getTime() + MINUTOS_CODIGO * 60_000).toISOString();

  // Un solo código vivo a la vez: el nuevo anula los anteriores.
  await c.db.batch([
    c.db
      .prepare(`UPDATE crm_codigos SET anulado_en = ? WHERE usado_en IS NULL AND anulado_en IS NULL`)
      .bind(ahora.toISOString()),
    c.db
      .prepare(`INSERT INTO crm_codigos (creado_en, expira_en, codigo_hash, ip) VALUES (?, ?, ?, ?)`)
      .bind(ahora.toISOString(), expira, huella, c.ip),
  ]);

  if (c.env.CRM_CODIGO_EN_CONSOLA && esLocal(c.url)) {
    console.log(`[acceso] código local: ${codigo}`);
  }

  const aviso = await c.env.AVISOS.telegram(
    [
      "🔐 <b>Tu código para entrar al CRM</b>",
      "",
      `<code>${codigo}</code>`,
      "",
      `Vence en ${MINUTOS_CODIGO} minutos. Si no lo pediste tú, no hagas nada: sin este código nadie entra.`,
    ].join("\n"),
  );
  if (!aviso.ok) {
    console.error(JSON.stringify({ acceso: "codigo_no_enviado", motivo: aviso.motivo ?? "?" }));
    if (c.env.CRM_CODIGO_EN_CONSOLA && esLocal(c.url)) return { ok: true };
    const motivo = aviso.motivo ?? "";
    if (motivo.includes("chat not found")) {
      return {
        ok: false,
        error: "Telegram no encuentra tu chat con el bot. Abre @Skynet_dsh_bot, toca «Iniciar» y vuelve a pedir el código.",
      };
    }
    return { ok: false, error: "No pude mandarte el código por Telegram. Intenta de nuevo en un momento." };
  }
  return { ok: true };
}

/** Revisa el código y, si está bien, abre la sesión. Devuelve la cabecera Set-Cookie. */
export async function entrar(
  c: Ctx,
  codigo: string,
): Promise<{ ok: true; cookie: string } | { ok: false; error: string }> {
  const limpio = codigo.replace(/\D/g, "");
  if (limpio.length !== 6) return { ok: false, error: "El código tiene 6 números." };

  const ahora = ahoraIso();
  const fila = await c.db
    .prepare(
      `SELECT id, codigo_hash, intentos FROM crm_codigos
        WHERE usado_en IS NULL AND anulado_en IS NULL AND expira_en > ?
        ORDER BY id DESC LIMIT 1`,
    )
    .bind(ahora)
    .first<{ id: number; codigo_hash: string; intentos: number }>();
  if (!fila) return { ok: false, error: "El código venció o ya se usó. Pide otro." };

  const intentos = fila.intentos + 1;
  if (intentos > INTENTOS_POR_CODIGO) {
    await c.db.prepare(`UPDATE crm_codigos SET anulado_en = ? WHERE id = ?`).bind(ahora, fila.id).run();
    return { ok: false, error: "Demasiados intentos con este código. Pide otro." };
  }
  const [sal, huella] = fila.codigo_hash.split(".");
  const correcto = iguales(await sha256(`${sal}:${limpio}`), huella);
  if (!correcto) {
    await c.db.prepare(`UPDATE crm_codigos SET intentos = ? WHERE id = ?`).bind(intentos, fila.id).run();
    const quedan = INTENTOS_POR_CODIGO - intentos;
    return {
      ok: false,
      error: quedan > 0 ? `El código no coincide. Te quedan ${quedan} intentos.` : "El código no coincide. Pide otro.",
    };
  }

  const token = tokenNuevo();
  const expira = new Date(Date.now() + DIAS_SESION * 86_400_000).toISOString();
  await c.db.batch([
    c.db.prepare(`UPDATE crm_codigos SET usado_en = ?, intentos = ? WHERE id = ?`).bind(ahora, intentos, fila.id),
    c.db
      .prepare(
        `INSERT INTO crm_sesiones (token_hash, usuario, creado_en, expira_en, ultimo_uso_en, ip, user_agent)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        await sha256(token),
        c.usuario,
        ahora,
        expira,
        ahora,
        c.ip,
        (c.request.headers.get("User-Agent") ?? "").slice(0, 300),
      ),
  ]);
  await auditar(c, "entrar", null, null);
  return { ok: true, cookie: cookieDeSesion(c, token, DIAS_SESION * 86_400) };
}

/** Cierra la sesión de este navegador. Devuelve la cabecera que borra la cookie. */
export async function salir(c: Ctx): Promise<string> {
  const token = leerCookie(c.request, nombreCookie(c));
  if (token) {
    await c.db
      .prepare(`UPDATE crm_sesiones SET revocada_en = ? WHERE token_hash = ? AND revocada_en IS NULL`)
      .bind(ahoraIso(), await sha256(token))
      .run();
  }
  await auditar(c, "salir", null, null);
  return cookieDeSesion(c, "", 0);
}

/** Cierra todas las sesiones abiertas, en todos los equipos. */
export async function salirDeTodo(c: Ctx): Promise<string> {
  await c.db.prepare(`UPDATE crm_sesiones SET revocada_en = ? WHERE revocada_en IS NULL`).bind(ahoraIso()).run();
  await auditar(c, "salir_de_todo", null, null);
  return cookieDeSesion(c, "", 0);
}

function cookieDeSesion(c: Ctx, valor: string, maxAge: number): string {
  // Lax y no Strict: así el enlace del aviso de Telegram abre la ficha sin
  // volver a pedir el código. Las escrituras igual exigen el mismo origen.
  const partes = [`${nombreCookie(c)}=${valor}`, "Path=/", "HttpOnly", "SameSite=Lax", `Max-Age=${maxAge}`];
  if (!esLocal(c.url)) partes.push("Secure");
  return partes.join("; ");
}
