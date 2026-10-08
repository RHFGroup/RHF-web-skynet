/**
 * La puerta del CRM (6-oct-2026): una clave, en una ruta secreta de
 * rhfliving.com. Decisión de Rafael: «un link de rhfliving.com que pida clave».
 *
 * 1. En <ruta secreta>/acceso, Rafael escribe su clave. El Worker la compara
 *    con la huella del secreto `CRM_CLAVE` (src/clave.ts).
 * 2. Si coincide, abre una sesión de 30 días con una cookie que el JavaScript
 *    de ninguna página puede leer, y que el navegador solo manda a la ruta
 *    secreta.
 *
 * Topes: 5 claves equivocadas por conexión en 15 minutos; y si en una hora se
 * equivocan 20 veces, desde donde sea, la entrada se cierra por esa hora y
 * llega un aviso por Telegram.
 *
 * El CRM comparte el origen con el sitio público (rhfliving.com), donde corren
 * scripts de terceros: el chat, Google y Meta. Por eso, además de la sesión:
 *  - toda escritura exige el mismo origen y el token anti-CSRF de la sesión,
 *    que va escondido en cada formulario y que un script de otra página no
 *    puede leer;
 *  - las páginas solo se entregan a navegaciones de verdad (Fetch Metadata):
 *    un `fetch()` o un `<iframe>` desde otra página recibe 403;
 *  - la cookie lleva `Path` de la ruta secreta, y la política de referer manda
 *    solo el origen, así que la ruta no sale ni hacia las páginas públicas.
 */
import { ahoraIso, auditar, esLocal, type Ctx } from "./base";
import { claveCorrecta, huellaValida } from "./clave";
import { csrfDe, sha256 } from "./seguridad";

export { esNavegacion, iguales } from "./seguridad";

const COOKIE = "__Secure-crm_sesion";
/** En el Mac (http://127.0.0.1) la cookie no puede ser `Secure`, y `__Secure-` lo exige. */
const COOKIE_LOCAL = "crm_sesion";
const DIAS_SESION = 30;
/** La sesión anota su último uso como mucho cada 15 minutos (menos escrituras). */
const MINUTOS_ULTIMO_USO = 15;
export const FALLOS_POR_CONEXION = 5;
const MINUTOS_POR_CONEXION = 15;
export const FALLOS_POR_HORA = 20;

function tokenNuevo(): string {
  const b = new Uint8Array(32);
  crypto.getRandomValues(b);
  let s = "";
  for (const x of b) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
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
 * ¿El formulario se envió desde el mismo sitio? Toda escritura lo exige. Los
 * navegadores mandan `Origin` en cada POST. Si no lo mandan, o lo mandan como
 * «null», se acepta solo con `Sec-Fetch-Site: same-origin`, que el navegador
 * pone y una página ajena no puede falsificar. Como el sitio público comparte
 * el origen, esto no alcanza solo: las escrituras con sesión exigen además el
 * token anti-CSRF (src/index.ts).
 */
export function mismoOrigen(c: Ctx): boolean {
  const origen = c.request.headers.get("Origin");
  if (origen && origen !== "null") return origen === c.url.origin;
  return c.request.headers.get("Sec-Fetch-Site") === "same-origin";
}

/** ¿Hay una sesión válida? Devuelve el usuario y el token anti-CSRF, o null. */
export async function sesionDe(c: Ctx): Promise<{ usuario: string; csrf: string } | null> {
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
  return { usuario: fila.usuario, csrf: await csrfDe(token) };
}

/** ¿Está configurada la clave? Sin ella, la página de acceso lo dice y no hay formulario. */
export function hayClave(c: Ctx): boolean {
  return huellaValida(c.env.CRM_CLAVE);
}

export type Entrada = { ok: true; cookie: string } | { ok: false; error: string; estado: number };

/** Revisa la clave y, si está bien, abre la sesión. Devuelve la cabecera Set-Cookie. */
export async function entrarConClave(c: Ctx, clave: string): Promise<Entrada> {
  if (!hayClave(c)) return { ok: false, estado: 503, error: "La clave del CRM todavía no está configurada." };
  const ip = c.ip ?? "sin-ip";
  const ahora = new Date();
  const desdeConexion = new Date(ahora.getTime() - MINUTOS_POR_CONEXION * 60_000).toISOString();
  const desdeHora = new Date(ahora.getTime() - 3600_000).toISOString();
  const fallos = await c.db
    .prepare(
      `SELECT COALESCE(SUM(CASE WHEN ip = ? AND creado_en > ? THEN 1 ELSE 0 END), 0) AS conexion,
              COUNT(*) AS hora
         FROM crm_ingresos WHERE resultado = 'fallo' AND creado_en > ?`,
    )
    .bind(ip, desdeConexion, desdeHora)
    .first<{ conexion: number; hora: number }>();
  const anotar = (resultado: "ok" | "fallo" | "bloqueado") =>
    c.db.prepare(`INSERT INTO crm_ingresos (creado_en, ip, resultado) VALUES (?, ?, ?)`).bind(ahora.toISOString(), ip, resultado);

  if ((fallos?.hora ?? 0) >= FALLOS_POR_HORA) {
    await anotar("bloqueado").run();
    return {
      ok: false,
      estado: 429,
      error: "La entrada quedó cerrada por una hora: hubo demasiadas claves equivocadas. Te avisé por Telegram.",
    };
  }
  if ((fallos?.conexion ?? 0) >= FALLOS_POR_CONEXION) {
    await anotar("bloqueado").run();
    return { ok: false, estado: 429, error: "Demasiadas claves equivocadas desde esta conexión. Espera 15 minutos." };
  }

  if (!(await claveCorrecta(clave, c.env.CRM_CLAVE))) {
    await anotar("fallo").run();
    const total = (fallos?.hora ?? 0) + 1;
    if (total === FALLOS_POR_HORA) {
      c.esperar(
        c.avisar(
          [
            "⚠️ <b>El CRM cerró la entrada por una hora</b>",
            "",
            `Hubo ${FALLOS_POR_HORA} claves equivocadas en la última hora. Si no fuiste tú, alguien está intentando entrar: la clave sigue a salvo, pero conviene cambiarla.`,
          ].join("\n"),
        ),
      );
    }
    const quedan = FALLOS_POR_CONEXION - ((fallos?.conexion ?? 0) + 1);
    return {
      ok: false,
      estado: 401,
      error: quedan > 0 ? "La clave no coincide." : "La clave no coincide. Espera 15 minutos para volver a intentarlo.",
    };
  }

  const token = tokenNuevo();
  const ahoraIsoTexto = ahora.toISOString();
  const expira = new Date(ahora.getTime() + DIAS_SESION * 86_400_000).toISOString();
  await c.db.batch([
    anotar("ok"),
    c.db
      .prepare(
        `INSERT INTO crm_sesiones (token_hash, usuario, creado_en, expira_en, ultimo_uso_en, ip, user_agent)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        await sha256(token),
        c.usuario,
        ahoraIsoTexto,
        expira,
        ahoraIsoTexto,
        c.ip,
        (c.request.headers.get("User-Agent") ?? "").slice(0, 300),
      ),
  ]);
  await auditar(c, "entrar", null, null);
  // Una sesión nueva es rara (duran 30 días): si no fue Rafael, se entera.
  c.esperar(
    c.avisar(
      [
        "🔓 <b>Se abrió una sesión nueva en el CRM</b>",
        "",
        "Si no fuiste tú, entra al CRM, toca «Más» → «Cerrar la sesión en todos los equipos» y cambia la clave.",
      ].join("\n"),
    ),
  );
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
  // Path: el navegador solo la manda a la ruta secreta, nunca a las páginas
  // públicas. Lax y no Strict: así el enlace del aviso de Telegram abre la
  // ficha sin volver a pedir la clave. Las escrituras igual exigen el mismo
  // origen y el token anti-CSRF.
  const partes = [`${nombreCookie(c)}=${valor}`, `Path=${c.ruta}`, "HttpOnly", "SameSite=Lax", `Max-Age=${maxAge}`];
  if (!esLocal(c.url)) partes.push("Secure");
  return partes.join("; ");
}
