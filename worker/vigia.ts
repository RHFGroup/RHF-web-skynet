/**
 * El vigía de los agentes.
 *
 * POR QUÉ EXISTE. El 23-sep-2026 el servidor de los agentes (el chat de esta
 * web, WhatsApp y Telegram) se apagó a las 08:22 porque se acabó el saldo
 * prepago de Clouding. Nadie se enteró hasta las 14:13, y fue de casualidad:
 * una prueba del chat que buscaba otra cosa. Clouding había avisado tres
 * veces, a un correo que nadie lee.
 *
 * QUÉ HACE. Cada 5 minutos (ver `triggers` en wrangler.jsonc) pide las dos
 * direcciones públicas del agente. Si dejan de responder, avisa por Telegram
 * con el mismo bot que avisa de las consultas. Avisa también cuando vuelven.
 *
 * POR QUÉ ACÁ. Un vigía no puede vivir en el servidor que vigila: se apagaría
 * con él. Este Worker corre en Cloudflare y ya tiene el bot. Y es código, no
 * un agente: lo que se revisa cada N minutos va en código.
 *
 * QUÉ CUENTA COMO CAÍDO. Solo lo que prueba que el servicio no contesta:
 *  - 530 con «error 1033»: el túnel no tiene conector, así que el servidor o
 *    cloudflared están apagados. Es lo que se vio el 23-sep.
 *  - 502, 503, 504 y los 52x de Cloudflare: el túnel llega, pero el servicio
 *    de atrás no contesta o tarda demasiado.
 *  - Que no responda en 10 s, o un error de red.
 *  - Que Cloudflare desafíe al vigía (cabecera `cf-mitigated`). Eso no prueba
 *    que el servicio esté caído, pero sí que el vigía quedó ciego, y un vigía
 *    ciego que calla es peor que uno que avisa de más.
 *
 * EL CHAT se prueba como lo abre la web: un WebSocket de verdad, con el origen
 * rhfliving.com, un `ping` y su `pong`. El agente no abre sesión hasta el
 * primer mensaje con `sessionId`, y el ping lo contesta sin llamar al modelo:
 * no crea conversaciones ni gasta saldo. Además de lo de arriba, en el chat
 * cuenta como caído:
 *  - Que conteste sin abrir el WebSocket (200, 400, 404, 426…): el túnel y el
 *    servidor están, pero la web no podría conversar.
 *  - Que cierre con 1008: el agente rechaza el origen de la web (su lista
 *    `allowed_origins`), y en la web el chat no conectaría.
 *  - Que abra y no conteste el ping en 5 s.
 * Hasta el 25-sep el chat se pedía con un GET simple. El agente lo anotaba como
 * ERROR, con la traza completa, cada 5 minutos (290 al día), y tapaba los
 * errores de verdad en el log.
 *
 * EL WEBHOOK de WhatsApp se pide con un GET simple, que no deja rastro en el
 * log del agente. Cualquier respuesta que no sea de caída (200, 400, 403,
 * 404…) es el servicio contestando, aunque sea para decir que la petición no
 * le sirve: el webhook espera a Meta.
 *
 * CUÁNDO AVISA.
 *  - Al segundo chequeo fallido seguido (≈10 min). Uno solo puede ser un
 *    tropiezo de la red.
 *  - Mientras siga caído, un recordatorio cada 6 horas. El 23-sep había 72
 *    horas antes del borrado del servidor, y un solo aviso se pierde en el chat.
 *  - Cuando vuelve, con cuánto tiempo estuvo caído.
 * Si caen los dos a la vez, que es lo normal cuando el que cae es el
 * servidor, va un solo mensaje con los dos.
 *
 * Si el aviso no sale (Telegram caído, secretos sin cargar), no se marca como
 * enviado y el chequeo siguiente lo reintenta.
 *
 * EL RASTRO. La tabla `vigia` de D1 guarda una fila por dirección, con lo que
 * respondió en el último chequeo:
 *   wrangler d1 execute rhf-leads --remote --command "SELECT * FROM vigia"
 */

import type { Env } from "./index";

/** Lo que se vigila. `clave` es la fila en la tabla `vigia`. */
const OBJETIVOS = [
  {
    clave: "chat-web",
    nombre: "Chat de la web",
    url: "https://atencion-hrf.syberloop.com/",
    sondeo: "websocket",
  },
  {
    clave: "whatsapp",
    nombre: "WhatsApp",
    url: "https://wa-hrf.syberloop.com/whatsapp/webhook",
    sondeo: "http",
  },
] as const;

export type Objetivo = { clave: string; nombre: string; url: string };

/** Chequeos fallidos seguidos antes de avisar. Con el cron cada 5 min, ≈10 min. */
export const FALLOS_PARA_AVISAR = 2;
/** Cada cuánto se recuerda que algo sigue caído. */
export const RECORDATORIO_HORAS = 6;
/** Lo que se le espera a cada dirección antes de darla por muda. */
const ESPERA_MS = 10_000;
/** Lo que se le espera al `pong` del chat, ya abierta la conexión. */
const ESPERA_PONG_MS = 5_000;
/** El origen con el que la web abre el chat; el agente solo acepta los de su lista. */
const ORIGEN_WEB = "https://rhfliving.com";
/** Cómo se presenta el vigía en cada petición. */
const IDENTIDAD = "rhfliving-vigia/1 (+https://rhfliving.com)";

/** Respuestas que prueban que el servicio no contesta. Ver arriba. */
const CODIGOS_DE_CAIDA = new Set([
  502, 503, 504, 520, 521, 522, 523, 524, 525, 526, 530,
]);

/**
 * La tabla se crea sola en el primer chequeo, así el vigía no depende de que
 * alguien corra una migración. migrations/0002_vigia.sql es la misma.
 */
const CREAR_TABLA = `CREATE TABLE IF NOT EXISTS vigia (
  clave          TEXT    PRIMARY KEY,
  estado         TEXT    NOT NULL CHECK (estado IN ('arriba', 'abajo')),
  fallos         INTEGER NOT NULL DEFAULT 0,
  desde          TEXT    NOT NULL,
  primer_fallo   TEXT,
  ultimo_aviso   TEXT,
  ultimo_chequeo TEXT    NOT NULL,
  detalle        TEXT    NOT NULL
)`;

/**
 * Qué se sabe de una caída, para decir qué mirar primero:
 *  - `tunel`: 530/1033, el servidor o cloudflared están apagados.
 *  - `servicio`: el túnel llega pero el servicio no contesta.
 *  - `ciego`: Cloudflare no deja pasar al vigía.
 *  - `red`: error de red, sin más datos.
 */
export type Pista = "tunel" | "servicio" | "ciego" | "red";

export type Sondeo = { ok: boolean; detalle: string; pista?: Pista };

export type Fila = {
  clave: string;
  estado: "arriba" | "abajo";
  /** Chequeos fallidos seguidos. */
  fallos: number;
  /** Desde cuándo está en este estado. Si está abajo, desde el primer fallo. */
  desde: string;
  /** Primer fallo de la racha actual; null si el último chequeo salió bien. */
  primer_fallo: string | null;
  /** Último aviso que SALIÓ por Telegram para esta dirección. */
  ultimo_aviso: string | null;
  ultimo_chequeo: string;
  /** Qué respondió en el último chequeo, dicho en castellano. */
  detalle: string;
};

export type Evento = "cayo" | "sigue" | "volvio" | null;

/**
 * El corazón del vigía, sin red ni base: con la fila anterior y lo que
 * respondió ahora, decide la fila nueva y si hay que avisar. Es una función
 * pura para poder probarla sin esperar a que algo se caiga.
 *
 * Marca `ultimo_aviso` como si el aviso fuera a salir; si no sale, `vigilar`
 * lo deshace para que el chequeo siguiente lo reintente.
 */
export function decidir(
  clave: string,
  previa: Fila | null,
  s: Sondeo,
  ahora: Date,
): { fila: Fila; evento: Evento } {
  const iso = ahora.toISOString();
  const antes: Fila = previa ?? {
    clave,
    estado: "arriba",
    fallos: 0,
    desde: iso,
    primer_fallo: null,
    ultimo_aviso: null,
    ultimo_chequeo: iso,
    detalle: "",
  };
  const comun = { ultimo_chequeo: iso, detalle: s.detalle };

  if (s.ok) {
    if (antes.estado === "abajo") {
      return {
        fila: {
          ...antes,
          ...comun,
          estado: "arriba",
          fallos: 0,
          desde: iso,
          primer_fallo: null,
          ultimo_aviso: iso,
        },
        evento: "volvio",
      };
    }
    return { fila: { ...antes, ...comun, fallos: 0, primer_fallo: null }, evento: null };
  }

  const fallos = antes.fallos + 1;
  const primer_fallo = antes.primer_fallo ?? iso;

  if (antes.estado === "arriba") {
    if (fallos < FALLOS_PARA_AVISAR) {
      return { fila: { ...antes, ...comun, fallos, primer_fallo }, evento: null };
    }
    return {
      fila: {
        ...antes,
        ...comun,
        estado: "abajo",
        fallos,
        primer_fallo,
        desde: primer_fallo,
        ultimo_aviso: iso,
      },
      evento: "cayo",
    };
  }

  // Ya estaba abajo. Si el aviso anterior no salió, `ultimo_aviso` quedó en
  // null y se reintenta ahora mismo.
  const pasado =
    antes.ultimo_aviso === null
      ? Infinity
      : ahora.getTime() - Date.parse(antes.ultimo_aviso);
  if (pasado >= RECORDATORIO_HORAS * 3_600_000) {
    return {
      fila: { ...antes, ...comun, fallos, primer_fallo, ultimo_aviso: iso },
      evento: "sigue",
    };
  }
  return { fila: { ...antes, ...comun, fallos, primer_fallo }, evento: null };
}

/** Lo que corre el cron. Nunca lanza: un vigía que revienta, calla. */
export async function vigilar(env: Env, ahora: Date): Promise<void> {
  try {
    await env.DB.prepare(CREAR_TABLA).run();
    const { results } = await env.DB.prepare(`SELECT * FROM vigia`).all<Fila>();
    const previas = new Map((results ?? []).map((f) => [f.clave, f]));

    const sondeos = await Promise.all(
      OBJETIVOS.map((o) => (o.sondeo === "websocket" ? sondearChat(o.url) : sondear(o.url))),
    );
    const decisiones = OBJETIVOS.map((objetivo, i) => {
      const previa = previas.get(objetivo.clave) ?? null;
      const sondeo = sondeos[i];
      return { objetivo, previa, sondeo, ...decidir(objetivo.clave, previa, sondeo, ahora) };
    });

    const conAviso = decisiones.filter((d) => d.evento !== null);
    let salio = true;
    if (conAviso.length > 0) {
      salio = await avisar(env, redactar(conAviso, ahora));
      if (!salio) {
        // Una caída sin avisar se reintenta en el chequeo siguiente; una
        // vuelta sin avisar no, porque ya no hay nada que atender.
        for (const d of conAviso) {
          d.fila.ultimo_aviso =
            d.evento === "volvio" ? (d.previa?.ultimo_aviso ?? null) : null;
        }
      }
    }

    await env.DB.batch(decisiones.map((d) => guardar(env.DB, d.fila)));
    for (const d of decisiones) {
      console.log(
        `[vigia] ${d.objetivo.clave}: ${d.fila.estado} · ${d.fila.detalle}` +
          (d.evento ? ` · aviso: ${d.evento}${salio ? "" : " (NO SALIÓ)"}` : ""),
      );
    }
  } catch (e) {
    console.error("[vigia] el chequeo falló:", e);
  }
}

/** Pide la dirección y traduce la respuesta. Ver «qué cuenta como caído». */
export async function sondear(url: string): Promise<Sondeo> {
  let r: Response;
  try {
    r = await fetch(url, {
      redirect: "manual",
      headers: { Accept: "*/*", "User-Agent": IDENTIDAD },
      signal: AbortSignal.timeout(ESPERA_MS),
    });
  } catch (e) {
    return sinRespuesta(e);
  }
  const caida = await leerCaida(r);
  if (caida) return caida;
  await r.body?.cancel();
  return { ok: true, detalle: `responde (${r.status})` };
}

/**
 * Abre el chat como lo abre la web y le manda un `ping`. Ver «el chat».
 * La conexión se cierra siempre, conteste o no.
 */
export async function sondearChat(url: string): Promise<Sondeo> {
  let r: Response;
  try {
    r = await fetch(url, {
      headers: { Upgrade: "websocket", Origin: ORIGEN_WEB, "User-Agent": IDENTIDAD },
      signal: AbortSignal.timeout(ESPERA_MS),
    });
  } catch (e) {
    return sinRespuesta(e);
  }

  const ws = r.webSocket;
  if (!ws) {
    const caida = await leerCaida(r);
    if (caida) return caida;
    await r.body?.cancel();
    return { ok: false, pista: "servicio", detalle: `contesta (${r.status}) pero no abre el chat` };
  }

  ws.accept();
  const sondeo = await new Promise<Sondeo>((resolver) => {
    let listo = false;
    const fin = (s: Sondeo) => {
      if (listo) return;
      listo = true;
      clearTimeout(reloj);
      resolver(s);
    };
    const reloj = setTimeout(
      () =>
        fin({
          ok: false,
          pista: "servicio",
          detalle: `abre la conexión pero no contesta el ping en ${ESPERA_PONG_MS / 1000} s`,
        }),
      ESPERA_PONG_MS,
    );
    ws.addEventListener("message", (ev) => {
      if (tipoDeMensaje(ev.data) === "pong") {
        fin({ ok: true, detalle: "abre el chat y contesta el ping (101)" });
      }
    });
    ws.addEventListener("close", (ev) => {
      fin(
        ev.code === 1008
          ? {
              ok: false,
              pista: "servicio",
              detalle: `el agente rechaza el origen ${ORIGEN_WEB} (1008): revisar allowed_origins`,
            }
          : {
              ok: false,
              pista: "servicio",
              detalle: `el chat cerró la conexión sin contestar el ping (${ev.code})`,
            },
      );
    });
    ws.addEventListener("error", () => {
      fin({ ok: false, pista: "servicio", detalle: "el chat abrió la conexión y falló" });
    });
    try {
      ws.send(JSON.stringify({ type: "ping" }));
    } catch {
      fin({ ok: false, pista: "servicio", detalle: "el chat abrió la conexión pero no recibió el ping" });
    }
  });

  try {
    ws.close(1000, "vigia");
  } catch {
    // Ya estaba cerrada (por ejemplo, el 1008).
  }
  return sondeo;
}

/** El `type` de un mensaje del chat, o "" si no es JSON con `type`. */
function tipoDeMensaje(dato: unknown): string {
  if (typeof dato !== "string") return "";
  try {
    const m = JSON.parse(dato) as { type?: unknown } | null;
    return typeof m?.type === "string" ? m.type : "";
  } catch {
    return "";
  }
}

/** La dirección ni siquiera respondió: tardó demasiado o falló la red. */
function sinRespuesta(e: unknown): Sondeo {
  const nombre = e instanceof Error ? e.name : "";
  if (nombre === "TimeoutError" || nombre === "AbortError") {
    return { ok: false, pista: "servicio", detalle: `no respondió en ${ESPERA_MS / 1000} s` };
  }
  return {
    ok: false,
    pista: "red",
    detalle: `error de red: ${e instanceof Error ? e.message : "desconocido"}`,
  };
}

/**
 * Si la respuesta prueba una caída, o deja ciego al vigía, dice cuál. Si no,
 * devuelve null y deja el cuerpo sin leer.
 */
async function leerCaida(r: Response): Promise<Sondeo | null> {
  if (r.headers.get("cf-mitigated")) {
    await r.body?.cancel();
    return {
      ok: false,
      pista: "ciego",
      detalle: `Cloudflare frenó al vigía (${r.status}); no se puede ver si el servicio contesta`,
    };
  }

  if (!CODIGOS_DE_CAIDA.has(r.status)) return null;

  const cuerpo = (await r.text().catch(() => "")).slice(0, 8000);
  const codigo = /error code:?\s*(\d{4})|cf-error-code[^>]*>\s*(\d{4})/i.exec(cuerpo);
  const error = codigo?.[1] ?? codigo?.[2];
  if (r.status === 530 && error === "1033") {
    return {
      ok: false,
      pista: "tunel",
      detalle: "túnel sin conector (530 · error 1033): el servidor o cloudflared están apagados",
    };
  }
  if (r.status === 504 || r.status === 524) {
    return { ok: false, pista: "servicio", detalle: `el servicio tardó demasiado (${r.status})` };
  }
  return {
    ok: false,
    pista: "servicio",
    detalle: `el túnel llega pero el servicio no contesta (${r.status}${error ? ` · error ${error}` : ""})`,
  };
}

function guardar(db: D1Database, f: Fila): D1PreparedStatement {
  return db
    .prepare(
      `INSERT INTO vigia
         (clave, estado, fallos, desde, primer_fallo, ultimo_aviso, ultimo_chequeo, detalle)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(clave) DO UPDATE SET
         estado = excluded.estado,
         fallos = excluded.fallos,
         desde = excluded.desde,
         primer_fallo = excluded.primer_fallo,
         ultimo_aviso = excluded.ultimo_aviso,
         ultimo_chequeo = excluded.ultimo_chequeo,
         detalle = excluded.detalle`,
    )
    .bind(
      f.clave,
      f.estado,
      f.fallos,
      f.desde,
      f.primer_fallo,
      f.ultimo_aviso,
      f.ultimo_chequeo,
      f.detalle,
    );
}

export type ConAviso = {
  objetivo: Objetivo;
  previa: Fila | null;
  sondeo: Sondeo;
  fila: Fila;
  evento: Evento;
};

/** Qué mirar primero, según lo que se sabe de la caída. */
const PISTAS: Record<Pista, string[]> = {
  tunel: [
    "1. El saldo de Clouding (portal.clouding.io). La caída del 23-sep fue eso.",
    "2. Que el servidor vpskynet esté encendido.",
    "3. Si lo está: el túnel (cloudflared-skynet) y el contenedor hermes-skynet.",
  ],
  servicio: [
    "El túnel llega al servidor, así que está encendido: el que no contesta es el servicio.",
    "Revisar el contenedor hermes-skynet (docker compose ps) y reiniciar lo que falle.",
  ],
  ciego: [
    "Cloudflare no deja pasar al vigía. No significa que el agente esté caído:",
    "probar el chat a mano y revisar las reglas de seguridad de syberloop.com.",
  ],
  red: ["Error de red desde Cloudflare. Si se repite, probar el chat a mano."],
};

/** Arma el mensaje de Telegram. Pura, como `decidir`, para poder probarla. */
export function redactar(avisos: ConAviso[], ahora: Date): string {
  const caidos = avisos.filter((a) => a.evento === "cayo" || a.evento === "sigue");
  const vueltos = avisos.filter((a) => a.evento === "volvio");
  const lineas: string[] = [];

  if (caidos.length > 0) {
    const soloRecordatorio = caidos.every((a) => a.evento === "sigue");
    lineas.push(
      soloRecordatorio
        ? "🔴 <b>El agente sigue sin responder</b>"
        : "🔴 <b>El agente no responde</b>",
      "",
    );
    for (const a of caidos) {
      const hace = duracion(ahora.getTime() - Date.parse(a.fila.desde));
      lineas.push(
        `• <b>${esc(a.objetivo.nombre)}</b>: ${esc(a.fila.detalle)}.`,
        `  Desde ${esc(fecha(a.fila.desde))} (hace ${hace}).`,
      );
    }
    const pistas = new Set(caidos.map((a) => a.sondeo.pista ?? "red"));
    lineas.push("", "<b>Qué mirar primero</b>");
    for (const p of ["tunel", "servicio", "ciego", "red"] as const) {
      if (pistas.has(p)) lineas.push(...PISTAS[p]);
    }
  }

  if (vueltos.length > 0) {
    if (lineas.length > 0) lineas.push("");
    lineas.push("🟢 <b>El agente volvió</b>", "");
    for (const a of vueltos) {
      const inicio = a.previa?.desde;
      const tramo = inicio
        ? ` Estuvo caído ${duracion(ahora.getTime() - Date.parse(inicio))}.`
        : "";
      lineas.push(`• <b>${esc(a.objetivo.nombre)}</b> responde otra vez.${tramo}`);
    }
    if (vueltos.some((a) => a.objetivo.clave === "whatsapp")) {
      lineas.push(
        "",
        "Los mensajes de WhatsApp que no se entregaron durante la caída llegan solos: Meta los reintenta hasta 7 días.",
      );
    }
  }

  lineas.push("", `<i>Vigía de rhfliving.com · ${esc(fecha(ahora.toISOString()))}</i>`);
  return lineas.join("\n");
}

/**
 * Manda el mensaje. Si no hay destino configurado, lo deja a gritos en el
 * log con el texto completo: es el fallo silencioso de este diseño.
 */
async function avisar(env: Env, texto: string): Promise<boolean> {
  const chat = env.TELEGRAM_ALERTAS_CHAT_ID || env.TELEGRAM_CHAT_ID;
  if (!env.TELEGRAM_BOT_TOKEN || !chat) {
    console.error(
      "[vigia] SIN CONFIGURAR — el agente cambió de estado y NADIE fue avisado." +
        " Faltan TELEGRAM_BOT_TOKEN y/o el id del chat.\n" +
        texto,
    );
    return false;
  }
  try {
    const r = await fetch(
      `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chat,
          text: texto,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (!r.ok) {
      // La descripción de Telegram dice qué pasó; nunca trae el token.
      console.error("[vigia] Telegram respondió", r.status, (await r.text()).slice(0, 300));
      return false;
    }
    return true;
  } catch (e) {
    console.error("[vigia] no se pudo avisar por Telegram:", e);
    return false;
  }
}

/** «23 sept 2026, 8:22 a. m.», en hora de Bogotá. */
function fecha(iso: string): string {
  return new Date(iso).toLocaleString("es-CO", {
    timeZone: "America/Bogota",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/** «7 min», «2 h 35 min», «3 d 4 h». */
export function duracion(ms: number): string {
  const min = Math.max(0, Math.round(ms / 60_000));
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h < 24) return m ? `${h} h ${m} min` : `${h} h`;
  const d = Math.floor(h / 24);
  const hr = h % 24;
  return hr ? `${d} d ${hr} h` : `${d} d`;
}

/** Escapa lo que Telegram interpreta como HTML. */
function esc(v: string): string {
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
