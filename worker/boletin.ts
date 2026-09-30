/**
 * El boletín de noticias de la Zona Norte: la suscripción y su confirmación.
 *
 * 30-sep-2026 (Prompt 3 de Luciano, fase 1). Lo que cambió y por qué:
 *
 *  · La suscripción de Luciano del 29-sep quedó guardada, pero no le llegó
 *    nada: ni una confirmación ni un boletín. Del otro lado, eso se ve como
 *    «no funciona». Desde ahora quien se suscribe recibe un correo para
 *    confirmar que la dirección es suya (decisión de Rafael, 30-sep), y hasta
 *    que confirma no entra a la lista.
 *  · Cada autorización queda con su propia constancia en `suscripcion_eventos`
 *    (Ley 1581): la primera, las repetidas, las reactivaciones y la
 *    confirmación. Ninguna reemplaza a otra.
 *  · Quien se dio de baja y vuelve queda pendiente hasta confirmar por el
 *    enlace (decisión de Rafael, 30-sep): nadie puede volver a suscribir a
 *    quien pidió salir.
 *  · La respuesta es la misma para todos y no dice si un correo ya estaba en
 *    la lista (auditoría del 29-sep, AS-4). Al buzón le llega lo que
 *    corresponde: la confirmación, o el aviso de que ya estaba suscrito.
 *  · Cada resultado queda en el registro del Worker, sin el correo ni la IP:
 *    si alguien vuelve a decir «no funciona», se sabe qué pasó.
 *
 * El correo sale por el binding `EMAIL` (Cloudflare Email Service, plan pago
 * de Workers). Mientras no exista, la suscripción queda activa al instante,
 * como hasta el 30-sep, y el formulario dice cuándo llega el boletín.
 *
 * Para leer la lista (solo las confirmadas están activas):
 *   wrangler d1 execute rhf-leads --remote --command "SELECT correo, creado_en, estado FROM suscriptores"
 */
import type { Env } from "./index";
import {
  baseDe,
  cabecerasCors,
  esc,
  esVistaPrevia,
  json,
  LIMITES,
  origenPermitido,
  texto,
  TOPE_POR_IP,
  VENTANA_MINUTOS,
  verificarTurnstile,
} from "./comun";

type Idioma = "es" | "en";

/** Versión del texto de autorización, si el cliente no manda la suya. */
const AVISO_BOLETIN_POR_DEFECTO = "2026-09-28-boletin";

/** Un correo con forma de correo. La verificación de verdad es la confirmación. */
const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** El enlace de confirmación vale siete días. */
const DIAS_ENLACE = 7;

/** Correos al mismo buzón en 24 horas, como máximo: nadie puede usar el formulario para llenarle el buzón a otro. */
const CORREOS_POR_DIA = 3;

/**
 * Quién escribe. Las respuestas van al correo de Rafael, el que nombra la
 * autorización: ahí llegan los BAJA, como dice la política de datos.
 */
const REMITENTE = { name: "RHF Living", email: "boletin@rhfliving.com" };
const RESPONDER_A = "rafaelhf.realestate@gmail.com";
const RESPONSABLE = "Medardo Rafael Hernández Franco";

/** Las páginas de confirmación, en cada idioma. */
const PAGINA_CONFIRMAR: Record<Idioma, string> = {
  es: "/boletin/confirmar",
  en: "/en/newsletter/confirm",
};
const POLITICA: Record<Idioma, string> = {
  es: "/privacidad#boletin",
  en: "/en/privacy#boletin",
};

/**
 * Las tablas del boletín. El Worker las crea solas si no existen (la base de
 * las vistas previas empieza vacía); las migraciones 0003 y 0005 dejan el
 * mismo esquema escrito.
 */
const ESQUEMA = [
  `CREATE TABLE IF NOT EXISTS suscriptores (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    creado_en      TEXT    NOT NULL,
    correo         TEXT    NOT NULL UNIQUE,
    autoriza       INTEGER NOT NULL CHECK (autoriza = 1),
    version_aviso  TEXT    NOT NULL,
    ip             TEXT,
    user_agent     TEXT,
    origen         TEXT,
    estado         TEXT    NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'baja')),
    actualizado_en TEXT,
    baja_en        TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS idx_suscriptores_ip_creado ON suscriptores(ip, actualizado_en DESC)`,
  `CREATE TABLE IF NOT EXISTS suscripcion_eventos (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    creado_en      TEXT    NOT NULL,
    correo         TEXT    NOT NULL,
    tipo           TEXT    NOT NULL CHECK (tipo IN ('solicitud', 'repetida', 'reactivacion', 'confirmacion', 'baja')),
    autoriza       INTEGER CHECK (autoriza IN (0, 1)),
    version_aviso  TEXT,
    ip             TEXT,
    user_agent     TEXT,
    origen         TEXT,
    idioma         TEXT,
    utm_source     TEXT,
    utm_medium     TEXT,
    utm_campaign   TEXT,
    utm_content    TEXT,
    utm_term       TEXT,
    correo_enviado INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE INDEX IF NOT EXISTS idx_susc_eventos_correo ON suscripcion_eventos(correo, creado_en DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_susc_eventos_ip ON suscripcion_eventos(ip, creado_en DESC)`,
  `CREATE TABLE IF NOT EXISTS suscripcion_confirmaciones (
    token_hash TEXT    PRIMARY KEY,
    correo     TEXT    NOT NULL,
    evento_id  INTEGER NOT NULL,
    creado_en  TEXT    NOT NULL,
    expira_en  TEXT    NOT NULL,
    usado_en   TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS idx_susc_conf_correo ON suscripcion_confirmaciones(correo, creado_en DESC)`,
];
const basesListas = new WeakSet<D1Database>();

async function prepararTablas(db: D1Database): Promise<void> {
  if (basesListas.has(db)) return;
  await db.batch(ESQUEMA.map((q) => db.prepare(q)));
  basesListas.add(db);
}

/**
 * Una línea en el registro del Worker por cada intento, con el resultado y
 * nada que identifique a la persona: ni el correo ni la IP.
 */
function registrar(resultado: string, request: Request, extra: Record<string, string> = {}): void {
  const host = new URL(request.url).hostname;
  const entorno = esVistaPrevia(request) ? "vista_previa" : host === "localhost" || host === "127.0.0.1" ? "local" : "produccion";
  console.log(JSON.stringify({ boletin: resultado, entorno, ...extra }));
}

type Constancia = {
  version: string;
  ip: string | null;
  ua: string | null;
  origen: string | null;
  idioma: Idioma;
  utm: Record<"source" | "medium" | "campaign" | "content" | "term", string | null>;
};

type Suscriptor = {
  estado: "activa" | "baja";
  creado_en: string;
  baja_en: string | null;
};

/** Guarda un evento con su constancia y devuelve su id. */
async function registrarEvento(
  db: D1Database,
  correo: string,
  tipo: "solicitud" | "repetida" | "reactivacion" | "confirmacion",
  cuando: string,
  c: Constancia,
): Promise<number> {
  const r = await db
    .prepare(
      `INSERT INTO suscripcion_eventos
         (creado_en, correo, tipo, autoriza, version_aviso, ip, user_agent, origen, idioma,
          utm_source, utm_medium, utm_campaign, utm_content, utm_term)
       VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      cuando,
      correo,
      tipo,
      c.version,
      c.ip,
      c.ua,
      c.origen,
      c.idioma,
      c.utm.source,
      c.utm.medium,
      c.utm.campaign,
      c.utm.content,
      c.utm.term,
    )
    .run();
  return Number(r.meta?.last_row_id ?? 0);
}

/**
 * Las suscripciones de antes del 30-sep no tienen eventos: su constancia está
 * solo en la fila de `suscriptores`. Antes de sumarle un evento nuevo, se copia
 * esa constancia como la «solicitud» original, y la baja si la hubo. Así la
 * historia queda completa y nada se pierde al reactivar.
 */
async function completarHistoria(db: D1Database, correo: string): Promise<void> {
  await db.batch([
    db
      .prepare(
        `INSERT INTO suscripcion_eventos (creado_en, correo, tipo, autoriza, version_aviso, ip, user_agent, origen)
         SELECT creado_en, correo, 'solicitud', 1, version_aviso, ip, user_agent, origen
           FROM suscriptores
          WHERE correo = ?1
            AND NOT EXISTS (SELECT 1 FROM suscripcion_eventos WHERE correo = ?1 AND tipo = 'solicitud')`,
      )
      .bind(correo),
    db
      .prepare(
        `INSERT INTO suscripcion_eventos (creado_en, correo, tipo)
         SELECT baja_en, correo, 'baja'
           FROM suscriptores
          WHERE correo = ?1 AND estado = 'baja' AND baja_en IS NOT NULL
            AND NOT EXISTS (SELECT 1 FROM suscripcion_eventos WHERE correo = ?1 AND tipo = 'baja' AND creado_en = suscriptores.baja_en)`,
      )
      .bind(correo),
  ]);
}

/** ¿Se le puede escribir hoy a este buzón? */
async function puedeEscribir(db: D1Database, correo: string, ahora: Date): Promise<boolean> {
  const desde = new Date(ahora.getTime() - 86_400_000).toISOString();
  const fila = await db
    .prepare(`SELECT COUNT(*) AS n FROM suscripcion_eventos WHERE correo = ? AND correo_enviado = 1 AND creado_en > ?`)
    .bind(correo, desde)
    .first<{ n: number }>();
  return (fila?.n ?? 0) < CORREOS_POR_DIA;
}

/** 32 bytes al azar en base64url (43 caracteres): el token del enlace. */
function tokenNuevo(): string {
  const b = crypto.getRandomValues(new Uint8Array(32));
  let s = "";
  for (const x of b) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** La huella del token: en la base se guarda esto, nunca el token. */
async function huella(token: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return [...new Uint8Array(d)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

// ── Los correos ────────────────────────────────────────────────────────

type Correo = { subject: string; text: string; html: string };

const TEXTOS_CORREO = {
  es: {
    asuntoConfirmar: "Confirma tu suscripción al boletín de la Zona Norte",
    asuntoYaEstas: "Ya estás en la lista del boletín de la Zona Norte",
    hola: "Hola:",
    pedidoAlta:
      "Recibimos una solicitud para suscribir este correo al boletín de noticias de la Zona Norte de RHF Living.",
    pedidoReactivacion:
      "Recibimos una solicitud para volver a suscribir este correo al boletín de noticias de la Zona Norte de RHF Living. Te habías dado de baja: sin tu confirmación no te volvemos a escribir.",
    paraConfirmar: "Para confirmarla, abre este enlace y toca «Confirmar»:",
    boton: "Confirmar mi suscripción",
    vale: `El enlace vale por ${DIAS_ENLACE} días. Si no fuiste tú, ignora este mensaje: sin confirmación no te llega ningún boletín.`,
    yaEstas:
      "Alguien, probablemente tú, volvió a suscribir este correo al boletín de noticias de la Zona Norte de RHF Living. Ya estabas en la lista: no tienes que hacer nada.",
    siNoFuiste: "Si no fuiste tú, ignora este mensaje.",
    baja: `Cuando quieras darte de baja, responde BAJA a cualquier boletín o escribe a ${RESPONDER_A}.`,
    firma: "Rafael Hernández Franco · RHF Living",
    responsable: `Responsable del tratamiento: ${RESPONSABLE}. Política de tratamiento de datos:`,
  },
  en: {
    asuntoConfirmar: "Confirm your subscription to the Zona Norte newsletter",
    asuntoYaEstas: "You're already on the Zona Norte newsletter list",
    hola: "Hello,",
    pedidoAlta:
      "We received a request to subscribe this email address to the RHF Living newsletter with news from the Zona Norte.",
    pedidoReactivacion:
      "We received a request to subscribe this email address again to the RHF Living newsletter with news from the Zona Norte. You had unsubscribed: we won't write to you again without your confirmation.",
    paraConfirmar: "To confirm it, open this link and tap “Confirm”:",
    boton: "Confirm my subscription",
    vale: `The link is valid for ${DIAS_ENLACE} days. If this wasn't you, ignore this message: without confirmation you won't receive any newsletter.`,
    yaEstas:
      "Someone, probably you, subscribed this email address again to the RHF Living newsletter with news from the Zona Norte. You were already on the list: there's nothing you need to do.",
    siNoFuiste: "If this wasn't you, ignore this message.",
    baja: `Whenever you want to unsubscribe, reply BAJA to any newsletter or write to ${RESPONDER_A}.`,
    firma: "Rafael Hernández Franco · RHF Living",
    responsable: `Data controller: ${RESPONSABLE}. Personal data processing policy:`,
  },
} as const;

/** El marco del correo en HTML: sobrio, con los colores de la marca y legible sin imágenes. */
function envolver(
  idioma: Idioma,
  politica: string,
  antes: string[],
  boton?: { texto: string; enlace: string },
  despues: string[] = [],
): string {
  const t = TEXTOS_CORREO[idioma];
  const p = (x: string) => `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#1f2a3d">${esc(x)}</p>`;
  const nota = (x: string) => `<p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#5e594f">${esc(x)}</p>`;
  return [
    `<!doctype html><html lang="${idioma}"><body style="margin:0;padding:24px;background:#f3efe6;font-family:Helvetica,Arial,sans-serif">`,
    `<div style="max-width:560px;margin:0 auto;padding:32px 28px;background:#ffffff;border-radius:16px">`,
    `<p style="margin:0 0 24px;font-family:Georgia,serif;font-size:22px;color:#1f2a3d">RHF Living</p>`,
    ...antes.map(p),
    boton
      ? `<p style="margin:8px 0 16px"><a href="${esc(boton.enlace)}" style="display:inline-block;padding:12px 22px;border-radius:9999px;background:#c2a578;color:#1c2738;font-weight:bold;text-decoration:none">${esc(boton.texto)}</a></p>` +
        `<p style="margin:0 0 16px;font-size:13px;line-height:1.6;word-break:break-all"><a href="${esc(boton.enlace)}" style="color:#6b4a2f">${esc(boton.enlace)}</a></p>`
      : "",
    ...despues.map(p),
    `<hr style="border:none;border-top:1px solid #e9e2d3;margin:24px 0">`,
    nota(t.baja),
    nota(t.firma),
    `<p style="margin:0;font-size:12px;line-height:1.6;color:#8a8376">${esc(t.responsable)} <a href="${esc(politica)}" style="color:#6b4a2f">${esc(politica)}</a></p>`,
    `</div></body></html>`,
  ].join("");
}

function correoConfirmar(idioma: Idioma, enlace: string, politica: string, reactivacion: boolean): Correo {
  const t = TEXTOS_CORREO[idioma];
  const pedido = reactivacion ? t.pedidoReactivacion : t.pedidoAlta;
  const text = [t.hola, "", pedido, "", t.paraConfirmar, enlace, "", t.vale, "", t.baja, "", t.firma, `${t.responsable} ${politica}`].join("\n");
  const html = envolver(idioma, politica, [t.hola, pedido, t.paraConfirmar], { texto: t.boton, enlace }, [t.vale]);
  return { subject: t.asuntoConfirmar, text, html };
}

function correoYaEstas(idioma: Idioma, politica: string): Correo {
  const t = TEXTOS_CORREO[idioma];
  const text = [t.hola, "", t.yaEstas, "", t.siNoFuiste, "", t.baja, "", t.firma, `${t.responsable} ${politica}`].join("\n");
  return { subject: t.asuntoYaEstas, text, html: envolver(idioma, politica, [t.hola, t.yaEstas, t.siNoFuiste]) };
}

/** Un fallo al mandar el correo, para distinguirlo de uno de la base. */
class FalloDeCorreo extends Error {}

async function enviar(env: Env, para: string, correo: Correo): Promise<void> {
  if (!env.EMAIL) throw new FalloDeCorreo("sin binding EMAIL");
  try {
    await env.EMAIL.send({
      from: REMITENTE,
      to: para,
      replyTo: RESPONDER_A,
      subject: correo.subject,
      text: correo.text,
      html: correo.html,
    });
  } catch (e) {
    throw new FalloDeCorreo(e instanceof Error ? e.message : "el envío falló");
  }
}

/**
 * Crea el enlace de confirmación de una solicitud y lo manda. El token viaja
 * en el fragmento (`#t=…`): los fragmentos no llegan a ningún servidor, así que
 * no queda en registros ni en analítica.
 */
async function mandarConfirmacion(
  env: Env,
  db: D1Database,
  request: Request,
  correo: string,
  eventoId: number,
  idioma: Idioma,
  reactivacion: boolean,
  ahora: Date,
): Promise<void> {
  const token = tokenNuevo();
  const expira = new Date(ahora.getTime() + DIAS_ENLACE * 86_400_000).toISOString();
  await db
    .prepare(
      `INSERT INTO suscripcion_confirmaciones (token_hash, correo, evento_id, creado_en, expira_en) VALUES (?, ?, ?, ?, ?)`,
    )
    .bind(await huella(token), correo, eventoId, ahora.toISOString(), expira)
    .run();
  const origen = new URL(request.url).origin;
  const enlace = `${origen}${PAGINA_CONFIRMAR[idioma]}#t=${token}`;
  await enviar(env, correo, correoConfirmar(idioma, enlace, origen + POLITICA[idioma], reactivacion));
  await db.prepare(`UPDATE suscripcion_eventos SET correo_enviado = 1 WHERE id = ?`).bind(eventoId).run();
}

// ── POST /api/suscripcion ─────────────────────────────────────────────

export async function guardarSuscripcion(request: Request, env: Env): Promise<Response> {
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

  const conConfirmacion = Boolean(env.EMAIL);
  const idioma: Idioma = texto(cuerpo.idioma) === "en" ? "en" : "es";
  const origen = texto(cuerpo.origen).slice(0, LIMITES.origen);
  const log = { idioma, origen: origen || "-" };
  // La misma respuesta para todos los casos que salen bien (AS-4).
  const listo = () => json({ ok: true, confirmacion: conConfirmacion }, 201, request);

  // La trampa para bots responde igual que una suscripción real (AS-8), pero
  // deja rastro: si el autocompletar de un navegador la llena, se va a ver.
  if (texto(cuerpo.sitio)) {
    registrar("trampa", request, log);
    return listo();
  }

  // Sin autorización no se guarda (Ley 1581).
  if (cuerpo.autoriza !== true) {
    registrar("sin_autorizacion", request, log);
    return json({ ok: false, error: "falta_autorizacion" }, 422, request);
  }
  const correo = texto(cuerpo.correo).toLowerCase();
  if (correo.length > LIMITES.contacto || !CORREO_VALIDO.test(correo)) {
    registrar("correo_invalido", request, log);
    return json({ ok: false, error: "correo_invalido" }, 422, request);
  }

  const ip = request.headers.get("CF-Connecting-IP") ?? null;
  if (env.TURNSTILE_SECRET) {
    const valido = await verificarTurnstile(env.TURNSTILE_SECRET, texto(cuerpo.turnstile), ip, "boletin");
    if (!valido) {
      registrar("turnstile_fallido", request, log);
      return json({ ok: false, error: "verificacion_fallida" }, 403, request);
    }
  }

  const utmCrudo = (typeof cuerpo.utm === "object" && cuerpo.utm !== null ? cuerpo.utm : {}) as Record<string, unknown>;
  const utm = (k: string) => texto(utmCrudo[k]).slice(0, 100) || null;
  const constancia: Constancia = {
    version: texto(cuerpo.version_aviso).slice(0, LIMITES.version) || AVISO_BOLETIN_POR_DEFECTO,
    ip,
    ua: (request.headers.get("User-Agent") ?? "").slice(0, LIMITES.userAgent) || null,
    origen: origen || null,
    idioma,
    utm: { source: utm("source"), medium: utm("medium"), campaign: utm("campaign"), content: utm("content"), term: utm("term") },
  };
  const db = baseDe(env, request);
  const ahora = new Date();
  const ahoraIso = ahora.toISOString();

  try {
    await prepararTablas(db);

    // El freno por IP, contado sobre todos los intentos de la ventana.
    if (ip) {
      const desde = new Date(ahora.getTime() - VENTANA_MINUTOS * 60_000).toISOString();
      const fila = await db
        .prepare(`SELECT COUNT(*) AS n FROM suscripcion_eventos WHERE ip = ? AND creado_en > ?`)
        .bind(ip, desde)
        .first<{ n: number }>();
      if ((fila?.n ?? 0) >= TOPE_POR_IP) {
        registrar("tope_ip", request, log);
        return json({ ok: false, error: "demasiados_envios" }, 429, request);
      }
    }

    const actual = await db
      .prepare(`SELECT estado, creado_en, baja_en FROM suscriptores WHERE correo = ?`)
      .bind(correo)
      .first<Suscriptor>();

    if (!actual) {
      const eventoId = await registrarEvento(db, correo, "solicitud", ahoraIso, constancia);
      if (!conConfirmacion) {
        // Sin servicio de correo, como hasta el 30-sep: activa al instante.
        await db
          .prepare(
            `INSERT INTO suscriptores
               (creado_en, correo, autoriza, version_aviso, ip, user_agent, origen, estado, actualizado_en)
             VALUES (?, ?, 1, ?, ?, ?, ?, 'activa', ?)
             ON CONFLICT(correo) DO NOTHING`,
          )
          .bind(ahoraIso, correo, constancia.version, ip, constancia.ua, constancia.origen, ahoraIso)
          .run();
        registrar("activa_sin_confirmacion", request, log);
        return listo();
      }
      if (!(await puedeEscribir(db, correo, ahora))) {
        registrar("tope_correos", request, log);
        return listo();
      }
      await mandarConfirmacion(env, db, request, correo, eventoId, idioma, false, ahora);
      registrar("confirmacion_enviada", request, log);
      return listo();
    }

    await completarHistoria(db, correo);

    if (actual.estado === "activa") {
      const eventoId = await registrarEvento(db, correo, "repetida", ahoraIso, constancia);
      if (conConfirmacion && (await puedeEscribir(db, correo, ahora))) {
        await enviar(env, correo, correoYaEstas(idioma, new URL(request.url).origin + POLITICA[idioma]));
        await db.prepare(`UPDATE suscripcion_eventos SET correo_enviado = 1 WHERE id = ?`).bind(eventoId).run();
      }
      registrar("repetida", request, log);
      return listo();
    }

    // Estaba de baja: la reactivación queda pendiente hasta que confirme.
    const eventoId = await registrarEvento(db, correo, "reactivacion", ahoraIso, constancia);
    if (conConfirmacion && (await puedeEscribir(db, correo, ahora))) {
      await mandarConfirmacion(env, db, request, correo, eventoId, idioma, true, ahora);
      registrar("reactivacion_enviada", request, log);
    } else {
      registrar("reactivacion_pendiente", request, log);
    }
    return listo();
  } catch (e) {
    const deCorreo = e instanceof FalloDeCorreo;
    console.error(
      JSON.stringify({
        boletin: deCorreo ? "fallo_correo" : "fallo_al_guardar",
        ...log,
        detalle: e instanceof Error ? e.message.slice(0, 200) : "error",
      }),
    );
    return json({ ok: false, error: deCorreo ? "correo_no_enviado" : "fallo_al_guardar" }, deCorreo ? 502 : 500, request);
  }
}

// ── POST /api/suscripcion/confirmar ───────────────────────────────────

/**
 * La página de confirmación (/boletin/confirmar) manda aquí el token del
 * enlace cuando la persona toca «Confirmar». Es un POST a propósito: los
 * programas que revisan los enlaces de los correos los abren con GET, y una
 * confirmación no puede pasar sin que la persona la pida.
 */
export async function confirmarSuscripcion(request: Request, env: Env): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cabecerasCors(request) });
  }
  if (request.method !== "POST") {
    return json({ ok: false, error: "metodo_no_permitido" }, 405);
  }
  if (!origenPermitido(request)) {
    return json({ ok: false, error: "origen_no_permitido" }, 403);
  }

  let token = "";
  let idiomaPedido: Idioma = "es";
  try {
    const crudo = await request.text();
    if (crudo.length > 1024) return json({ ok: false, error: "cuerpo_demasiado_grande" }, 413);
    const cuerpo = JSON.parse(crudo) as Record<string, unknown>;
    token = texto(cuerpo.t);
    idiomaPedido = texto(cuerpo.idioma) === "en" ? "en" : "es";
  } catch {
    return json({ ok: false, error: "json_invalido" }, 400);
  }
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) {
    registrar("enlace_invalido", request, { idioma: idiomaPedido });
    return json({ ok: false, error: "enlace_invalido" }, 400, request);
  }

  const db = baseDe(env, request);
  const ahora = new Date().toISOString();
  try {
    await prepararTablas(db);
    const pedido = await db
      .prepare(
        `SELECT c.correo, c.expira_en, c.usado_en,
                e.creado_en AS pedido_en, e.version_aviso, e.ip, e.user_agent, e.origen, e.idioma
           FROM suscripcion_confirmaciones c
           JOIN suscripcion_eventos e ON e.id = c.evento_id
          WHERE c.token_hash = ?`,
      )
      .bind(await huella(token))
      .first<{
        correo: string;
        expira_en: string;
        usado_en: string | null;
        pedido_en: string;
        version_aviso: string;
        ip: string | null;
        user_agent: string | null;
        origen: string | null;
        idioma: string | null;
      }>();

    if (!pedido) {
      registrar("enlace_invalido", request, { idioma: idiomaPedido });
      return json({ ok: false, error: "enlace_invalido" }, 404, request);
    }
    const idioma: Idioma = pedido.idioma === "en" ? "en" : "es";
    if (pedido.usado_en) {
      registrar("ya_confirmada", request, { idioma });
      return json({ ok: true, ya: true }, 200, request);
    }
    if (pedido.expira_en < ahora) {
      registrar("enlace_vencido", request, { idioma });
      return json({ ok: false, error: "enlace_vencido" }, 410, request);
    }

    const actual = await db
      .prepare(`SELECT estado FROM suscriptores WHERE correo = ?`)
      .bind(pedido.correo)
      .first<{ estado: "activa" | "baja" }>();

    const pasos: D1PreparedStatement[] = [];
    if (!actual) {
      // Entra a la lista con la constancia de su solicitud.
      pasos.push(
        db
          .prepare(
            `INSERT INTO suscriptores
               (creado_en, correo, autoriza, version_aviso, ip, user_agent, origen, estado, actualizado_en)
             VALUES (?, ?, 1, ?, ?, ?, ?, 'activa', ?)
             ON CONFLICT(correo) DO NOTHING`,
          )
          .bind(pedido.pedido_en, pedido.correo, pedido.version_aviso, pedido.ip, pedido.user_agent, pedido.origen, ahora),
      );
    } else if (actual.estado === "baja") {
      // Vuelve con la autorización nueva. La anterior y la baja siguen en los eventos.
      pasos.push(
        db
          .prepare(
            `UPDATE suscriptores
                SET estado = 'activa', version_aviso = ?, ip = ?, user_agent = ?, origen = ?,
                    actualizado_en = ?, baja_en = NULL
              WHERE correo = ?`,
          )
          .bind(pedido.version_aviso, pedido.ip, pedido.user_agent, pedido.origen, ahora, pedido.correo),
      );
    }
    // La confirmación también es una constancia: quién tocó «Confirmar», cuándo y desde dónde.
    pasos.push(
      db
        .prepare(
          `INSERT INTO suscripcion_eventos (creado_en, correo, tipo, autoriza, version_aviso, ip, user_agent, origen, idioma)
           VALUES (?, ?, 'confirmacion', 1, ?, ?, ?, ?, ?)`,
        )
        .bind(
          ahora,
          pedido.correo,
          pedido.version_aviso,
          request.headers.get("CF-Connecting-IP") ?? null,
          (request.headers.get("User-Agent") ?? "").slice(0, LIMITES.userAgent) || null,
          pedido.origen,
          idioma,
        ),
    );
    // Todos los enlaces pendientes de ese correo quedan usados.
    pasos.push(
      db.prepare(`UPDATE suscripcion_confirmaciones SET usado_en = ? WHERE correo = ? AND usado_en IS NULL`).bind(ahora, pedido.correo),
    );
    await db.batch(pasos);

    registrar(actual?.estado === "baja" ? "reactivada" : actual ? "ya_estaba_activa" : "confirmada", request, { idioma });
    return json({ ok: true }, 200, request);
  } catch (e) {
    console.error(JSON.stringify({ boletin: "fallo_al_confirmar", detalle: e instanceof Error ? e.message.slice(0, 200) : "error" }));
    return json({ ok: false, error: "fallo_al_confirmar" }, 500, request);
  }
}
