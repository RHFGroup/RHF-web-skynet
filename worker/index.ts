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
 * Y desde el 23-sep-2026, un cron: cada 5 minutos el vigía de worker/vigia.ts
 * mira que el agente (chat de la web y WhatsApp) responda, y avisa por
 * Telegram si deja de hacerlo. No toca nada de lo que está acá abajo.
 *
 * REGLA DE ORO — cambió el 2026-09-19, y es el cambio más importante de este
 * archivo. Antes el formulario abría WhatsApp y guardar era la red debajo:
 * si el Worker fallaba, el lead llegaba igual porque la persona mandaba el
 * mensaje ella misma. Ahora **este endpoint es el único camino**. El
 * formulario espera su respuesta y le dice a la persona «mensaje enviado»,
 * así que lo que acá se pierda, se pierde de verdad.
 *
 * De ahí las dos obligaciones nuevas:
 *
 *  1. **Avisar.** Guardar en una base que nadie consulta es perder el lead con
 *     más pasos. Cada consulta dispara un mensaje al grupo de Telegram; sin
 *     ese aviso el dato queda esperando a que alguien se acuerde de mirarlo.
 *  2. **Decir la verdad al navegador.** Si algo falla acá, la respuesta lo
 *     dice y el formulario le ofrece WhatsApp a la persona. Nunca se responde
 *     «ok» sobre algo que no se guardó.
 */

import { vigilar } from "./vigia";

export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  /** Secreto de Turnstile. Mientras no exista, la verificación se salta y
   *  quedan las defensas de abajo. Se agrega con `wrangler secret put`. */
  TURNSTILE_SECRET?: string;
  /** Bot de Telegram que avisa de cada consulta. Ver `notificarTelegram`. */
  TELEGRAM_BOT_TOKEN?: string;
  /** Id del grupo de Telegram al que se avisa (empieza con `-100`). */
  TELEGRAM_CHAT_ID?: string;
  /** Opcional: otro chat para los avisos del vigía (worker/vigia.ts). Si no
   *  existe, el vigía avisa al mismo grupo de las consultas. */
  TELEGRAM_ALERTAS_CHAT_ID?: string;
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

  // El cron de wrangler.jsonc. Ver worker/vigia.ts.
  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(vigilar(env, new Date(controller.scheduledTime)));
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

    const id = (r.meta?.last_row_id as number | undefined) ?? null;

    // El aviso se espera, a diferencia del guardado del lado del navegador:
    // la persona ya está viendo un spinner y Telegram responde en ~300 ms.
    // Si tarda más de 5 s se corta — vale más una respuesta rápida con el
    // dato guardado que una espera larga por una notificación.
    const aviso = await notificarTelegram(env, {
      id,
      nombre,
      contacto,
      proyecto,
      mensaje,
      origen,
      creado: ahora,
    });

    // La marca de que se avisó no bloquea la respuesta: si esta escritura
    // falla, el lead ya está guardado y Rafael ya recibió el mensaje.
    if (aviso.ok && id) {
      ctx.waitUntil(
        env.DB.prepare(`UPDATE consultas SET notificado_en = ? WHERE id = ?`)
          .bind(new Date().toISOString(), id)
          .run()
          .then(() => undefined)
          .catch((e) => {
            console.error("[consulta] no se pudo marcar notificado_en:", e);
          }),
      );
    }

    return json(
      {
        ok: true,
        guardado: true,
        id,
        notificado: aviso.ok,
        ...(aviso.motivo ? { motivo_aviso: aviso.motivo } : {}),
      },
      201,
      request,
    );
  } catch (e) {
    // Ahora el navegador SÍ está esperando: devolver 500 hace que el
    // formulario muestre el error y le ofrezca WhatsApp a la persona, en vez
    // de decirle «enviado» sobre algo que no se guardó.
    console.error("[consulta] fallo al guardar:", e);
    return json({ ok: false, error: "fallo_al_guardar" }, 500, request);
  }
}

/**
 * Avisa al grupo de Telegram que entró una consulta.
 *
 * Telegram porque cumple las tres condiciones que pedía el caso: llega al
 * teléfono al instante, es gratis y no depende de infraestructura de nadie
 * más. El bot se crea con @BotFather y se mete al grupo; el Worker solo
 * necesita su token y el id del grupo, los dos como secretos.
 *
 * **Falla en silencio a propósito.** Si el bot no está configurado, o
 * Telegram no responde, la consulta YA está guardada en D1: devolver el
 * motivo deja constancia (`notificado_en` queda vacío y la respuesta lo
 * dice) sin romperle el envío a quien escribió. Lo que no se hace nunca es
 * reventar acá y perder el dato.
 *
 * **Devuelve el motivo, no solo un `false`.** Lo aprendimos el 2026-09-19:
 * con los secretos ya cargados el aviso falló, y `notificado: false` no
 * decía si el problema era el token, el id del grupo o el bot fuera del
 * grupo. `wrangler tail` no sirve para diagnosticarlo porque sigue a la
 * versión de producción, no a los previews. El motivo viaja en la respuesta
 * —que solo puede leer quien puede postear desde un origen permitido— y
 * nunca incluye el token.
 */
async function notificarTelegram(
  env: Env,
  c: {
    id: number | null;
    nombre: string;
    contacto: string;
    proyecto: string;
    mensaje: string;
    origen: string;
    creado: Date;
  },
): Promise<{ ok: boolean; motivo?: string }> {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    // A gritos en el log, porque este es EL fallo silencioso del diseño
    // nuevo: la persona ve «mensaje enviado», el dato queda guardado, y a
    // Rafael no le llega nada. Visible con `wrangler tail`.
    console.error(
      "[telegram] SIN CONFIGURAR — la consulta se guardó y NADIE fue avisado." +
        " Faltan los secretos TELEGRAM_BOT_TOKEN y/o TELEGRAM_CHAT_ID.",
    );
    return { ok: false, motivo: "sin_configurar" };
  }

  const fecha = c.creado.toLocaleString("es-CO", {
    timeZone: "America/Bogota",
    dateStyle: "medium",
    timeStyle: "short",
  });

  // Si el contacto trae un teléfono, se arma el enlace para responderle de un
  // toque. Colombia sin indicativo son 10 dígitos: se le antepone el 57.
  const digitos = c.contacto.replace(/\D/g, "");
  const wa =
    digitos.length >= 10
      ? `https://wa.me/${digitos.length === 10 ? "57" + digitos : digitos}`
      : null;

  const lineas = [
    "🏠 <b>Consulta nueva en rhfliving.com</b>",
    "",
    `<b>Nombre:</b> ${esc(c.nombre)}`,
    `<b>Contacto:</b> ${esc(c.contacto)}`,
    c.proyecto ? `<b>Proyecto:</b> ${esc(c.proyecto)}` : null,
    c.mensaje ? `<b>Mensaje:</b> ${esc(c.mensaje)}` : null,
    "",
    wa ? `<a href="${wa}">Responder por WhatsApp</a>` : null,
    `<i>${esc(fecha)} · ${c.origen ? esc(c.origen) + " · " : ""}#${c.id ?? "?"}</i>`,
  ].filter(Boolean);

  try {
    const r = await fetch(
      `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: env.TELEGRAM_CHAT_ID,
          text: lineas.join("\n"),
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
        signal: AbortSignal.timeout(5000),
      },
    );
    if (!r.ok) {
      // El cuerpo de Telegram dice exactamente qué pasó («chat not found»,
      // «Unauthorized», «bot was kicked»…). Sin esto, diagnosticar cuesta el
      // triple. Nunca trae el token: es la descripción del error, nada más.
      const cuerpo = await r.text();
      console.error("[telegram] respondió", r.status, cuerpo);
      let desc = cuerpo.slice(0, 200);
      try {
        desc = (JSON.parse(cuerpo) as { description?: string }).description ?? desc;
      } catch {
        /* respuesta que no es JSON: queda el texto crudo recortado */
      }
      return { ok: false, motivo: `telegram_${r.status}: ${desc}` };
    }
    return { ok: true };
  } catch (e) {
    console.error("[telegram] no se pudo avisar:", e);
    return { ok: false, motivo: `red: ${e instanceof Error ? e.message : "desconocido"}` };
  }
}

/** Escapa lo que Telegram interpreta como HTML. */
function esc(v: string): string {
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
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
