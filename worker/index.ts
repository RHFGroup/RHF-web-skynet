/**
 * El Worker de rhfliving.com.
 *
 * El sitio sigue siendo un export estático de Next servido como assets. Lo
 * único que pasa por acá es `/api/*` (ver `run_worker_first` en
 * wrangler.jsonc); cualquier otra ruta se sirve como antes.
 *
 * Hoy hay un solo endpoint: POST /api/consulta, que guarda lo que alguien
 * escribe en el formulario de contacto.
 *
 * REGLA DE ORO: guardar es la red DEBAJO de WhatsApp, nunca su reemplazo. El
 * formulario dispara este endpoint sin esperar la respuesta y abre WhatsApp
 * igual. Si este Worker falla, se cae la red — el lead sigue llegando a donde
 * Rafael atiende. Por eso acá no hay nada que pueda bloquear al navegador.
 */

export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  /** Secreto de Turnstile. Mientras no exista, la verificación se salta y
   *  quedan las defensas de abajo. Se agrega con `wrangler secret put`. */
  TURNSTILE_SECRET?: string;
}

/**
 * Orígenes que pueden postear, ADEMÁS del propio.
 *
 * La regla principal es «mismo origen que esta petición», que cubre sola
 * producción, cada preview de Cloudflare y cualquier servidor local en
 * cualquier puerto. Una lista blanca de dominios y puertos parece más estricta
 * pero envejece mal: el primer preview con un hash nuevo, o un `wrangler dev`
 * en otro puerto, quedan afuera y el formulario devuelve 403 en silencio —
 * pasó en la prueba del 18-sep con el puerto 8787.
 *
 * Esta lista queda solo para el par apex/www, que son orígenes distintos para
 * el navegador aunque sirvan la misma página.
 */
const ORIGENES_EXTRA = new Set([
  "https://rhfliving.com",
  "https://www.rhfliving.com",
]);

/** Versión del texto de autorización, si el cliente no manda la suya. */
const AVISO_POR_DEFECTO = "2026-09-18";

/** Topes de tamaño. Un campo más largo que esto es ruido o ataque. */
const LIMITES = {
  cuerpo: 16 * 1024,
  nombre: 120,
  contacto: 160,
  proyecto: 80,
  mensaje: 2000,
  origen: 200,
  userAgent: 400,
  version: 32,
} as const;

/** Envíos permitidos desde una misma IP en la ventana de abajo. */
const TOPE_POR_IP = 5;
const VENTANA_MINUTOS = 10;

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/consulta") {
      return guardarConsulta(request, env, ctx);
    }

    if (url.pathname.startsWith("/api/")) {
      return json({ ok: false, error: "no_encontrado" }, 404);
    }

    // Cualquier otra cosa que llegue hasta acá se sirve como asset.
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;

async function guardarConsulta(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cabecerasCors(request) });
  }
  if (request.method !== "POST") {
    return json({ ok: false, error: "metodo_no_permitido" }, 405);
  }
  if (!origenPermitido(request)) {
    return json({ ok: false, error: "origen_no_permitido" }, 403);
  }

  let cuerpo: Record<string, unknown>;
  try {
    const crudo = await request.text();
    if (crudo.length > LIMITES.cuerpo) {
      return json({ ok: false, error: "cuerpo_demasiado_grande" }, 413);
    }
    cuerpo = JSON.parse(crudo) as Record<string, unknown>;
  } catch {
    return json({ ok: false, error: "json_invalido" }, 400);
  }

  // Trampa para bots: un campo que una persona nunca ve ni llena. Si viene con
  // algo, se responde 200 sin guardar — que el bot crea que funcionó y no
  // pruebe otra cosa.
  if (texto(cuerpo.sitio)) {
    return json({ ok: true, guardado: false }, 200);
  }

  const nombre = texto(cuerpo.nombre).slice(0, LIMITES.nombre);
  const contacto = texto(cuerpo.contacto).slice(0, LIMITES.contacto);
  const proyecto = texto(cuerpo.proyecto).slice(0, LIMITES.proyecto);
  const mensaje = texto(cuerpo.mensaje).slice(0, LIMITES.mensaje);
  const origen = texto(cuerpo.origen).slice(0, LIMITES.origen);
  const versionAviso =
    texto(cuerpo.version_aviso).slice(0, LIMITES.version) || AVISO_POR_DEFECTO;

  // Sin autorización no se guarda. Es la condición de la Ley 1581 y también la
  // del CHECK de la tabla: acá se rechaza con un mensaje claro en vez de
  // dejar que reviente la inserción.
  if (cuerpo.autoriza !== true) {
    return json({ ok: false, error: "falta_autorizacion" }, 422);
  }
  if (nombre.length < 2 || contacto.length < 5) {
    return json({ ok: false, error: "datos_incompletos" }, 422);
  }

  if (env.TURNSTILE_SECRET) {
    const valido = await verificarTurnstile(
      env.TURNSTILE_SECRET,
      texto(cuerpo.turnstile),
      request.headers.get("CF-Connecting-IP"),
    );
    if (!valido) {
      return json({ ok: false, error: "verificacion_fallida" }, 403);
    }
  }

  const ip = request.headers.get("CF-Connecting-IP") ?? null;
  const userAgent = (request.headers.get("User-Agent") ?? "").slice(
    0,
    LIMITES.userAgent,
  );
  const ahora = new Date();

  if (ip && (await demasiadosEnvios(env.DB, ip, ahora))) {
    return json({ ok: false, error: "demasiados_envios" }, 429);
  }

  try {
    const r = await env.DB.prepare(
      `INSERT INTO consultas
         (creado_en, nombre, contacto, proyecto, mensaje,
          autoriza, version_aviso, ip, user_agent, origen)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?)`,
    )
      .bind(
        ahora.toISOString(),
        nombre,
        contacto,
        proyecto || null,
        mensaje || null,
        versionAviso,
        ip,
        userAgent || null,
        origen || null,
      )
      .run();

    return json(
      { ok: true, guardado: true, id: r.meta?.last_row_id ?? null },
      201,
      request,
    );
  } catch (e) {
    // El navegador ya abrió WhatsApp y no está esperando esta respuesta, así
    // que un error acá no le cuesta el lead a nadie. Queda en el log.
    console.error("[consulta] fallo al guardar:", e);
    return json({ ok: false, error: "fallo_al_guardar" }, 500, request);
  }
}

/** ¿Cuántos envíos hizo esta IP en los últimos minutos? */
async function demasiadosEnvios(
  db: D1Database,
  ip: string,
  ahora: Date,
): Promise<boolean> {
  const desde = new Date(ahora.getTime() - VENTANA_MINUTOS * 60_000).toISOString();
  try {
    const fila = await db
      .prepare(
        `SELECT COUNT(*) AS n FROM consultas WHERE ip = ? AND creado_en > ?`,
      )
      .bind(ip, desde)
      .first<{ n: number }>();
    return (fila?.n ?? 0) >= TOPE_POR_IP;
  } catch {
    // Si el freno no se puede consultar, no se bloquea a nadie: el costo de un
    // falso positivo acá es perder una consulta real.
    return false;
  }
}

async function verificarTurnstile(
  secreto: string,
  token: string,
  ip: string | null,
): Promise<boolean> {
  if (!token) return false;
  const datos = new FormData();
  datos.append("secret", secreto);
  datos.append("response", token);
  if (ip) datos.append("remoteip", ip);
  try {
    const r = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body: datos },
    );
    const j = (await r.json()) as { success?: boolean };
    return j.success === true;
  } catch {
    return false;
  }
}

function origenPermitido(request: Request): boolean {
  const origen = request.headers.get("Origin");
  // Sin cabecera Origin no es un envío del formulario desde un navegador: los
  // navegadores la mandan siempre en un POST, también cuando es del mismo sitio.
  if (!origen) return false;
  try {
    if (origen === new URL(request.url).origin) return true;
  } catch {
    /* url rara: cae a la lista de abajo */
  }
  return ORIGENES_EXTRA.has(origen);
}

function cabecerasCors(request: Request): Record<string, string> {
  const origen = request.headers.get("Origin");
  if (!origen || !origenPermitido(request)) return {};
  return {
    "Access-Control-Allow-Origin": origen,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

function texto(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function json(
  cuerpo: unknown,
  status: number,
  request?: Request,
): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...(request ? cabecerasCors(request) : {}),
    },
  });
}
