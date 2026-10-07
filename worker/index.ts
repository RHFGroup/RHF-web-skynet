/**
 * El Worker de rhfliving.com.
 *
 * El sitio sigue siendo un export estático de Next servido como assets. Lo
 * único que pasa por acá es `/api/*` (ver `run_worker_first` en
 * wrangler.jsonc); cualquier otra ruta se sirve como antes.
 *
 * Hay tres endpoints: POST /api/consulta, que guarda lo que alguien escribe
 * en el formulario de contacto; POST /api/suscripcion (desde el
 * 28-sep-2026), que guarda el correo de quien se suscribe al boletín de
 * noticias de la Zona Norte, con la constancia de su autorización; y POST
 * /api/solicitud-agente (desde el 29-sep-2026), por donde el agente de
 * atención (WhatsApp y chat de la web) deja la llamada que alguien pidió con
 * Rafael. Los tres caen al mismo buzón de leads y al mismo aviso de Telegram.
 * Desde el 30-sep-2026, POST /api/suscripcion/confirmar: el enlace del correo
 * de confirmación del boletín (worker/boletin.ts).
 * Y GET /api/trm (desde el 29-sep-2026): la tasa representativa del mercado
 * del día, para la referencia en dólares que muestra la web junto al precio
 * en pesos. El cron la mantiene al día en D1.
 *
 * Desde el 6-oct-2026 también monta el CRM interno (crm/) en una ruta secreta
 * de rhfliving.com, con clave: los secretos `CRM_RUTA` y `CRM_CLAVE` (ver
 * crm/README.md). En wrangler.jsonc solo aparece el prefijo «/r/»
 * (`run_worker_first`): la ruta secreta que sigue no está en el código, porque
 * el repo es público. Cada aviso de lead trae el enlace a su ficha, y el cron
 * «30 12 * * *» manda el resumen del día del CRM.
 *
 * Y desde el 23-sep-2026, un cron: cada 5 minutos el vigía de worker/vigia.ts
 * mira que el agente (chat de la web y WhatsApp) responda, y avisa por
 * Telegram si deja de hacerlo. No toca nada de lo que está acá abajo.
 *
 * Desde el 7-oct-2026 (el tablero del CRM):
 *  - /api/consulta recibe además las tres preguntas que califican a un
 *    comprador (presupuesto, forma de pago y objetivo, en rangos) y de dónde
 *    llegó la persona (UTM y clic del anuncio), y guarda el canal;
 *  - POST /api/conversaciones-agente recibe, con el token del agente, las
 *    conversaciones de la IA (chat de la web y WhatsApp) para el CRM;
 *  - el cron corre cada minuto: el SLA de la primera respuesta y la higiene
 *    del CRM cada minuto; el vigía, los reintentos y la TRM, cada 5.
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
import {
  atenderCRM,
  mandarResumen,
  rutaCRM,
  trabajoDeCadaMinuto,
  leerLote,
  guardarLote,
  LIMITES_CONVERSACIONES,
} from "../crm/src/index";
import { canalDe, limpiarAtribucion, resumenAtribucion } from "../crm/src/canales";
import {
  FORMAS_PAGO,
  OBJETIVOS,
  RANGOS_PRESUPUESTO,
  formaPagoValida,
  nombreDe,
  objetivoValido,
  presupuestoValido,
  rangoDeTexto,
} from "../src/data/calificacion";
import { RECURSOS_CRM } from "./crm-recursos";
import { confirmarSuscripcion, guardarSuscripcion } from "./boletin";
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

export interface Env {
  DB: D1Database;
  /** La base de las vistas previas (30-sep-2026): `rhf-leads-preview`. Ver
   *  `baseDe` en worker/comun.ts. Si falta, todo va a `DB`. */
  DB_PREVIEW?: D1Database;
  /** Cloudflare Email Service (plan pago de Workers). Con él, el boletín pide
   *  confirmación por correo; sin él, la suscripción queda activa al
   *  instante, como antes. Ver worker/boletin.ts. */
  EMAIL?: SendEmail;
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
  /** Token que solo tiene el perfil del agente de atención (plugin
   *  `aviso-a-rafael`). Sin él, /api/solicitud-agente responde 503: el
   *  endpoint nunca queda abierto por omisión. Se carga con
   *  `wrangler secret put AGENTE_TOKEN`. */
  AGENTE_TOKEN?: string;
  /** La ruta secreta del CRM, por ejemplo «/r/k3m9…» (crm/README.md). Sin ella,
   *  el CRM no existe y toda dirección sigue siendo del sitio. */
  CRM_RUTA?: string;
  /** La huella de la clave del CRM (crm/src/clave.ts). La pone
   *  crm/dev/poner-clave.mjs; la clave misma no se guarda en ninguna parte. */
  CRM_CLAVE?: string;
}

/** El cron del resumen del día del CRM: 12:30 UTC, las 7:30 a. m. de Colombia. */
const CRON_RESUMEN_CRM = "30 12 * * *";

/** Versión del texto de autorización, si el cliente no manda la suya. */
const AVISO_POR_DEFECTO = "2026-09-18";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // El CRM, en su ruta secreta. Si la dirección no es la suya, responde null
    // y todo sigue como antes.
    const crm = await atenderCRM(request, env, {
      avisar: (html) => enviarTelegram(env, html.slice(0, 4000)),
      recursos: RECURSOS_CRM,
      esperar: (p) => ctx.waitUntil(p),
    });
    if (crm) return crm;

    if (url.pathname === "/api/consulta") {
      return guardarConsulta(request, env, ctx);
    }

    if (url.pathname === "/api/suscripcion") {
      return guardarSuscripcion(request, env);
    }

    if (url.pathname === "/api/suscripcion/confirmar") {
      return confirmarSuscripcion(request, env);
    }

    if (url.pathname === "/api/solicitud-agente") {
      return guardarSolicitudAgente(request, env, ctx);
    }

    if (url.pathname === "/api/conversaciones-agente") {
      return guardarConversacionesAgente(request, env);
    }

    if (url.pathname === "/api/trm") {
      return trmDelDia(request, env, ctx);
    }

    if (url.pathname.startsWith("/api/")) {
      return json({ ok: false, error: "no_encontrado" }, 404);
    }

    // Cualquier otra cosa que llegue hasta acá se sirve como asset.
    return env.ASSETS.fetch(request);
  },

  // Los crons de wrangler.jsonc: el resumen del CRM a las 7:30 a. m. y otro
  // cada minuto (desde el 7-oct-2026; antes, cada 5). Cada minuto, el SLA y la
  // higiene del CRM; cada 5, como antes, el vigía (worker/vigia.ts), los
  // avisos pendientes y la TRM. En esos minutos el CRM hace solo el SLA: el
  // plan gratis permite 50 sentencias de D1 por invocación.
  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    const ahora = new Date(controller.scheduledTime);
    if (controller.cron === CRON_RESUMEN_CRM) {
      ctx.waitUntil(mandarResumen(env, (html) => enviarTelegram(env, html), ahora));
      return;
    }
    const conVigia = ahora.getUTCMinutes() % 5 === 0;
    if (conVigia) {
      ctx.waitUntil(vigilar(env, ahora));
      ctx.waitUntil(reintentarAvisos(env));
      ctx.waitUntil(refrescarTRMSiHaceFalta(env));
    }
    ctx.waitUntil(trabajoDeCadaMinuto(env, (html) => enviarTelegram(env, html), ahora, conVigia));
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
  // algo, no se guarda, pero se responde exactamente como un envío real (29-sep,
  // auditoría AS-8): antes respondía 200 y un envío real 201, y un bot podía
  // distinguirlos.
  if (texto(cuerpo.sitio)) {
    return json(respuestaConsulta(request, 0, { ok: true }), 201, request);
  }

  const nombre = texto(cuerpo.nombre).slice(0, LIMITES.nombre);
  const contacto = texto(cuerpo.contacto).slice(0, LIMITES.contacto);
  const proyecto = texto(cuerpo.proyecto).slice(0, LIMITES.proyecto);
  const mensaje = texto(cuerpo.mensaje).slice(0, LIMITES.mensaje);
  const origen = texto(cuerpo.origen).slice(0, LIMITES.origen);
  const versionAviso =
    texto(cuerpo.version_aviso).slice(0, LIMITES.version) || AVISO_POR_DEFECTO;
  // Desde el 29-sep-2026 el formulario de /vender manda `tipo: "consignar"`:
  // cambia el título del aviso, para que Rafael sepa de un vistazo que es un
  // propietario y no un comprador. Cualquier otro valor es una consulta.
  const consignar = texto(cuerpo.tipo) === "consignar";
  // Desde el 7-oct-2026: las tres preguntas del comprador (solo códigos de
  // src/data/calificacion.ts; cualquier otra cosa se descarta) y de dónde
  // llegó. Un formulario viejo, en caché, no las manda: se guarda igual.
  const presupuesto = consignar ? null : presupuestoValido(cuerpo.presupuesto);
  const formaPago = consignar ? null : formaPagoValida(cuerpo.forma_pago);
  const objetivo = consignar ? null : objetivoValido(cuerpo.objetivo);
  const atribucion = limpiarAtribucion(cuerpo.atribucion);
  const canal = canalDe(atribucion, origen);

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

  const db = baseDe(env, request);
  if (ip && (await demasiadosEnvios(db, ip, ahora))) {
    return json({ ok: false, error: "demasiados_envios" }, 429);
  }

  try {
    const fila = {
      creado_en: ahora.toISOString(),
      nombre,
      contacto,
      proyecto: proyecto || null,
      mensaje: mensaje || null,
      version_aviso: versionAviso,
      ip,
      user_agent: userAgent || null,
      origen: origen || null,
    };
    const id = await insertarConsulta(db, fila, {
      presupuesto,
      forma_pago: formaPago,
      objetivo,
      atribucion: atribucion ? JSON.stringify(atribucion) : null,
      canal,
    });
    const lineasExtra = [
      presupuesto ? `<b>Presupuesto:</b> ${esc(nombreDe(RANGOS_PRESUPUESTO, presupuesto))}` : null,
      formaPago ? `<b>Forma de pago:</b> ${esc(nombreDe(FORMAS_PAGO, formaPago))}` : null,
      objetivo ? `<b>Para qué:</b> ${esc(nombreDe(OBJETIVOS, objetivo))}` : null,
      canal !== "sin_dato" ? `<b>Canal:</b> ${esc(resumenAtribucion(canal, atribucion))}` : null,
    ].filter((x): x is string => x !== null);

    // El aviso se espera, a diferencia del guardado del lado del navegador:
    // la persona ya está viendo un spinner y Telegram responde en ~300 ms.
    // Si tarda más de 5 s se corta — vale más una respuesta rápida con el
    // dato guardado que una espera larga por una notificación.
    const aviso = await notificarTelegram(
      env,
      {
        id,
        nombre,
        contacto,
        proyecto,
        mensaje,
        origen,
        creado: ahora,
        vistaPrevia: esVistaPrevia(request),
        extra: lineasExtra,
      },
      consignar ? "🏷️ <b>Quiere consignar su inmueble</b> · formulario de la web" : undefined,
    );

    // La marca de que se avisó no bloquea la respuesta: si esta escritura
    // falla, el lead ya está guardado y Rafael ya recibió el mensaje.
    if (aviso.ok && id) {
      ctx.waitUntil(
        db.prepare(`UPDATE consultas SET notificado_en = ? WHERE id = ?`)
          .bind(new Date().toISOString(), id)
          .run()
          .then(() => undefined)
          .catch((e) => {
            console.error("[consulta] no se pudo marcar notificado_en:", e);
          }),
      );
    }

    if (!aviso.ok) console.error("[consulta] aviso pendiente", id, aviso.motivo);
    return json(respuestaConsulta(request, id ?? 0, aviso), 201, request);
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
    /** Vino de una vista previa (y quedó en su base): el aviso lo dice. */
    vistaPrevia?: boolean;
    /** Líneas más, ya en HTML de Telegram (las arma el código, escapadas). */
    extra?: string[];
  },
  /** Primera línea del aviso, ya en HTML de Telegram. La escribe el código,
   *  nunca sale de lo que mandó alguien. Por defecto, la de la consulta. */
  titulo = "🏠 <b>Consulta nueva en rhfliving.com</b>",
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
    c.vistaPrevia ? `🧪 <b>[VISTA PREVIA]</b> ${titulo}` : titulo,
    "",
    `<b>Nombre:</b> ${esc(c.nombre)}`,
    `<b>Contacto:</b> ${esc(c.contacto)}`,
    c.proyecto ? `<b>Proyecto:</b> ${esc(c.proyecto)}` : null,
    c.mensaje ? `<b>Mensaje:</b> ${esc(c.mensaje)}` : null,
    ...(c.extra ?? []),
    "",
    wa ? `<a href="${wa}">Responder por WhatsApp</a>` : null,
    // La ficha en el CRM (crm/, en su ruta secreta). Exige la clave. Las
    // vistas previas guardan en su propia base, que el CRM de producción no ve.
    c.id && !c.vistaPrevia && rutaCRM(env) ? `<a href="https://rhfliving.com${rutaCRM(env)}/c/${c.id}">Abrir en el CRM</a>` : null,
    `<i>${esc(fecha)} · ${c.origen ? esc(c.origen) + " · " : ""}#${c.id ?? "?"}</i>`,
  ].filter(Boolean);

  return enviarTelegram(env, lineas.join("\n"));
}

/**
 * Manda un mensaje (HTML de Telegram) al chat de los avisos. Nunca lanza:
 * devuelve el motivo si falla, y nunca incluye el token.
 */
async function enviarTelegram(env: Env, texto: string): Promise<{ ok: boolean; motivo?: string }> {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    console.error("[telegram] SIN CONFIGURAR: faltan TELEGRAM_BOT_TOKEN y/o TELEGRAM_CHAT_ID.");
    return { ok: false, motivo: "sin_configurar" };
  }
  try {
    const r = await fetch(
      `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: env.TELEGRAM_CHAT_ID,
          text: texto,
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

// ── Las solicitudes del agente de atención ───────────────────────────────

/**
 * POST /api/solicitud-agente — la llamada que alguien pidió con Rafael por
 * WhatsApp o por el chat de la web (29-sep-2026).
 *
 * Hasta hoy el agente decía «un asesor te contacta» y nadie se enteraba: las
 * conversaciones quedaban solo en el servidor del agente. El informe de
 * Luciano (28-sep) cierra cada conversación con una llamada agendada con
 * Rafael, así que la llamada entra al mismo buzón del formulario —la tabla
 * `consultas`— y avisa por el mismo Telegram.
 *
 * La petición no viene de un navegador: la hace el plugin `aviso-a-rafael` del
 * perfil `atencion`, de servidor a servidor. Por eso acá no hay Origin ni
 * Turnstile, sino un token propio (`AGENTE_TOKEN`) que solo tiene ese perfil.
 * Sin el secreto cargado el endpoint responde 503: nunca queda abierto por
 * omisión.
 *
 * El número de teléfono lo pone el plugin: en WhatsApp sale de la plataforma,
 * no del modelo. Acá solo se valida que tenga forma de número.
 *
 * Autorización (Ley 1581): desde el 29-sep (auditoría AS-3) el agente le da a
 * la persona el aviso de datos, con el enlace a /privacidad, en el mensaje en
 * que le propone la llamada: antes de que ella dé el día, la hora o el número.
 * Es la persona la que pide la llamada. `version_aviso` dice qué texto vio.
 */
const TIPOS_SOLICITUD = new Set(["llamada_compra", "consignar"]);
const CANALES_AGENTE = new Set(["whatsapp_cloud", "webchat", "api_server"]);
const AVISO_AGENTE_POR_DEFECTO = "agente-2026-09-29";

/**
 * Topes por hora (29-sep-2026, auditoría AS-2). Antes había uno solo para
 * todos los canales: el chat de la web no lleva autenticación por mensaje, así
 * que con 20 sesiones inventadas se llenaba el tope y también se bloqueaban
 * las llamadas pedidas por WhatsApp. Ahora cada canal tiene su cupo, y un
 * mismo número no puede pedir más de dos llamadas en una hora.
 */
const TOPE_AGENTE_POR_HORA: Record<string, number> = { whatsapp_cloud: 60, webchat: 15, api_server: 15 };
const TOPE_AGENTE_POR_TELEFONO = 2;

const LIMITES_AGENTE = {
  nombre: 120,
  nombrePerfil: 120,
  ciudad: 80,
  interes: 160,
  rango: 80,
  diaHora: 120,
  resumen: 600,
  conversacion: 32,
} as const;

async function guardarSolicitudAgente(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
): Promise<Response> {
  if (request.method !== "POST") {
    return json({ ok: false, error: "metodo_no_permitido" }, 405);
  }
  if (!env.AGENTE_TOKEN) {
    console.error("[agente] falta el secreto AGENTE_TOKEN: el endpoint está cerrado");
    return json({ ok: false, error: "sin_configurar" }, 503);
  }
  const auth = request.headers.get("Authorization") ?? "";
  const presentado = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!presentado || !(await iguales(presentado, env.AGENTE_TOKEN))) {
    return json({ ok: false, error: "no_autorizado" }, 401);
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

  const tipo = texto(cuerpo.tipo);
  const canal = texto(cuerpo.canal);
  const nombre = texto(cuerpo.nombre).slice(0, LIMITES_AGENTE.nombre);
  const telefono = texto(cuerpo.telefono).replace(/\D/g, "");
  const diaHora = texto(cuerpo.dia_hora).slice(0, LIMITES_AGENTE.diaHora);
  if (!TIPOS_SOLICITUD.has(tipo) || !CANALES_AGENTE.has(canal)) {
    return json({ ok: false, error: "tipo_o_canal_invalido" }, 422);
  }
  if (nombre.length < 2 || diaHora.length < 2 || telefono.length < 7 || telefono.length > 15) {
    return json({ ok: false, error: "datos_incompletos" }, 422);
  }
  const nombrePerfil = texto(cuerpo.nombre_perfil).slice(0, LIMITES_AGENTE.nombrePerfil);
  const ciudad = texto(cuerpo.ciudad).slice(0, LIMITES_AGENTE.ciudad);
  const interes = texto(cuerpo.interes).slice(0, LIMITES_AGENTE.interes);
  const rango = texto(cuerpo.rango_inversion).slice(0, LIMITES_AGENTE.rango);
  const resumen = texto(cuerpo.resumen).slice(0, LIMITES_AGENTE.resumen);
  const idioma = texto(cuerpo.idioma) === "en" ? "en" : "es";
  const conversacion = texto(cuerpo.conversacion).slice(0, LIMITES_AGENTE.conversacion);
  const versionAviso =
    texto(cuerpo.version_aviso).slice(0, LIMITES.version) || AVISO_AGENTE_POR_DEFECTO;
  const prueba = cuerpo.prueba === true;

  const ahora = new Date();
  const db = baseDe(env, request);
  try {
    const desde = new Date(ahora.getTime() - 60 * 60_000).toISOString();
    const fila = await db.prepare(
      `SELECT SUM(CASE WHEN origen = ?1 THEN 1 ELSE 0 END) AS canal,
              SUM(CASE WHEN contacto = ?2 THEN 1 ELSE 0 END) AS tel
         FROM consultas WHERE origen LIKE 'agente:%' AND creado_en > ?3`,
    )
      .bind(`agente:${canal}`, `+${telefono}`, desde)
      .first<{ canal: number | null; tel: number | null }>();
    if (
      (fila?.canal ?? 0) >= (TOPE_AGENTE_POR_HORA[canal] ?? 15) ||
      (fila?.tel ?? 0) >= TOPE_AGENTE_POR_TELEFONO
    ) {
      return json({ ok: false, error: "demasiadas_solicitudes" }, 429);
    }
  } catch {
    // Si el freno no se puede consultar, no se bloquea: perder una llamada
    // pedida cuesta más que un falso negativo del tope.
  }

  const canalVisible = canal === "whatsapp_cloud" ? "WhatsApp" : canal === "webchat" ? "chat de la web" : "API";
  const mensaje = [
    tipo === "consignar" ? "Quiere vender o consignar su inmueble." : "Quiere comprar o invertir.",
    `Llamada: ${diaHora}`,
    interes ? `Interés: ${interes}` : null,
    rango ? `Rango: ${rango}` : null,
    ciudad ? `Escribe desde: ${ciudad}` : null,
    nombrePerfil && nombrePerfil !== nombre ? `Nombre en WhatsApp: ${nombrePerfil}` : null,
    `Idioma: ${idioma === "en" ? "inglés" : "español"}`,
    resumen ? `Resumen: ${resumen}` : null,
    conversacion ? `Conversación: ${conversacion}` : null,
  ]
    .filter(Boolean)
    .join("\n")
    .slice(0, LIMITES.mensaje);

  try {
    const id = await insertarConsulta(
      db,
      {
        creado_en: ahora.toISOString(),
        nombre,
        contacto: `+${telefono}`,
        proyecto: interes ? interes.slice(0, LIMITES.proyecto) : null,
        mensaje,
        version_aviso: versionAviso,
        ip: null,
        user_agent: `agente-atencion (${canal})`,
        origen: `agente:${canal}`,
        estado: prueba ? "prueba" : "nueva",
      },
      {
        // El rango que cuenta el agente, llevado a los rangos del formulario
        // cuando se puede (src/data/calificacion.ts). Si no, queda en el texto.
        presupuesto: tipo === "consignar" ? null : rangoDeTexto(rango),
        forma_pago: null,
        objetivo: null,
        atribucion: null,
        canal: canalDe(null, `agente:${canal}`),
      },
    );

    const titulo =
      (prueba ? "🧪 <b>[PRUEBA]</b> " : "") +
      (tipo === "consignar"
        ? `🏷️ <b>Quiere consignar su inmueble</b> · ${esc(canalVisible)}`
        : `📞 <b>Llamada pedida con Rafael</b> · ${esc(canalVisible)}`);
    const aviso = await notificarTelegram(
      env,
      {
        id,
        nombre,
        contacto: `+${telefono}`,
        proyecto: interes,
        mensaje,
        origen: `agente:${canal}`,
        creado: ahora,
        vistaPrevia: esVistaPrevia(request),
      },
      titulo,
    );
    if (aviso.ok && id) {
      ctx.waitUntil(
        db.prepare(`UPDATE consultas SET notificado_en = ? WHERE id = ?`)
          .bind(new Date().toISOString(), id)
          .run()
          .then(() => undefined)
          .catch((e) => console.error("[agente] no se pudo marcar notificado_en:", e)),
      );
    }
    // Si el aviso falló, se dice qué bot es el que avisa: con «chat not found»
    // la persona que debe recibir los avisos tiene que abrir ESE bot y darle
    // /start. Solo sale en esta respuesta, que exige el token del agente.
    const bot = aviso.ok ? null : await nombreDelBot(env);
    return json(
      {
        ok: true,
        guardado: true,
        id,
        notificado: aviso.ok,
        ...(aviso.motivo ? { motivo_aviso: aviso.motivo } : {}),
        ...(bot ? { bot_de_avisos: bot } : {}),
      },
      201,
    );
  } catch (e) {
    console.error("[agente] fallo al guardar:", e);
    return json({ ok: false, error: "fallo_al_guardar" }, 500);
  }
}

/** El @usuario del bot de avisos, o null. Nunca devuelve el token. */
async function nombreDelBot(env: Env): Promise<string | null> {
  if (!env.TELEGRAM_BOT_TOKEN) return null;
  try {
    const r = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getMe`, {
      signal: AbortSignal.timeout(4000),
    });
    const j = (await r.json()) as { ok?: boolean; result?: { username?: string } };
    return j.ok && j.result?.username ? `@${j.result.username}` : null;
  } catch {
    return null;
  }
}

/**
 * Comparación de secretos en tiempo constante. Si los largos difieren se
 * compara igual contra sí mismo, para no delatar el largo por el tiempo.
 */
async function iguales(a: string, b: string): Promise<boolean> {
  const cod = new TextEncoder();
  const x = cod.encode(a);
  const y = cod.encode(b);
  if (x.byteLength !== y.byteLength) {
    crypto.subtle.timingSafeEqual(y, y);
    return false;
  }
  return crypto.subtle.timingSafeEqual(x, y);
}

// ── Guardar una consulta ──────────────────────────────────────────────────

type FilaConsulta = {
  creado_en: string;
  nombre: string;
  contacto: string;
  proyecto: string | null;
  mensaje: string | null;
  version_aviso: string;
  ip: string | null;
  user_agent: string | null;
  origen: string | null;
  estado?: string;
};

type ExtraConsulta = {
  presupuesto: string | null;
  forma_pago: string | null;
  objetivo: string | null;
  atribucion: string | null;
  canal: string | null;
};

/**
 * Guarda la consulta. Las columnas del 7-oct-2026 (migración 0008) van si la
 * base las tiene; si todavía no se aplicó la migración, se guarda como antes:
 * perder un lead por una columna nueva sería el peor error posible (la regla
 * de oro de arriba).
 */
async function insertarConsulta(db: D1Database, f: FilaConsulta, extra: ExtraConsulta): Promise<number | null> {
  const base = [f.creado_en, f.nombre, f.contacto, f.proyecto, f.mensaje, f.version_aviso, f.ip, f.user_agent, f.origen, f.estado ?? "nueva"];
  try {
    const r = await db
      .prepare(
        `INSERT INTO consultas
           (creado_en, nombre, contacto, proyecto, mensaje, autoriza, version_aviso, ip, user_agent, origen, estado,
            presupuesto, forma_pago, objetivo, atribucion, canal)
         VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(...base, extra.presupuesto, extra.forma_pago, extra.objetivo, extra.atribucion, extra.canal)
      .run();
    return (r.meta?.last_row_id as number | undefined) ?? null;
  } catch (e) {
    if (!/no such column|has no column/i.test(String(e))) throw e;
    console.error("[consulta] falta la migración 0008: se guarda sin las columnas nuevas");
    const r = await db
      .prepare(
        `INSERT INTO consultas
           (creado_en, nombre, contacto, proyecto, mensaje, autoriza, version_aviso, ip, user_agent, origen, estado)
         VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)`,
      )
      .bind(...base)
      .run();
    return (r.meta?.last_row_id as number | undefined) ?? null;
  }
}

// ── Las conversaciones del agente ─────────────────────────────────────────

/**
 * POST /api/conversaciones-agente — las conversaciones de la IA para el CRM
 * (7-oct-2026, pedido de Rafael: verlas todas). Las manda el sincronizador que
 * corre junto al agente (agente/sincronizar_conversaciones.py), de servidor a
 * servidor, con el mismo token del agente (`AGENTE_TOKEN`). El formato y lo
 * que se guarda están en crm/src/conversaciones.ts.
 *
 * Responde cuántas conversaciones y mensajes recibió; nunca devuelve datos.
 */
async function guardarConversacionesAgente(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") return json({ ok: false, error: "metodo_no_permitido" }, 405);
  if (!env.AGENTE_TOKEN) {
    console.error("[conversaciones] falta el secreto AGENTE_TOKEN: el endpoint está cerrado");
    return json({ ok: false, error: "sin_configurar" }, 503);
  }
  const auth = request.headers.get("Authorization") ?? "";
  const presentado = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!presentado || !(await iguales(presentado, env.AGENTE_TOKEN))) {
    return json({ ok: false, error: "no_autorizado" }, 401);
  }
  let cuerpo: unknown;
  try {
    const crudo = await request.text();
    if (crudo.length > LIMITES_CONVERSACIONES.cuerpo) return json({ ok: false, error: "cuerpo_demasiado_grande" }, 413);
    cuerpo = JSON.parse(crudo);
  } catch {
    return json({ ok: false, error: "json_invalido" }, 400);
  }
  const lote = leerLote(cuerpo);
  if (!lote.ok) return json({ ok: false, error: lote.error }, 422);
  const db = baseDe(env, request);
  try {
    await guardarLote(db, lote.conversaciones);
  } catch (e) {
    const sinTablas = /no such table/i.test(String(e));
    console.error("[conversaciones] no se pudo guardar:", sinTablas ? "falta la migración 0008" : e);
    return json({ ok: false, error: sinTablas ? "falta_migracion" : "fallo_al_guardar" }, sinTablas ? 503 : 500);
  }
  console.log(JSON.stringify({ conversaciones: lote.conversaciones.length, mensajes: lote.mensajes }));
  return json({ ok: true, conversaciones: lote.conversaciones.length, mensajes: lote.mensajes }, 200);
}

// ── Reintentos de avisos ──────────────────────────────────────────────────

/** Cuántos días hacia atrás se reintenta un aviso que no salió. */
const DIAS_REINTENTO = 7;
/** Cuántos avisos pendientes se mandan por corrida del cron (cada 5 min). */
const REINTENTOS_POR_CORRIDA = 5;

/**
 * Reintenta, en cada corrida del cron, los avisos de Telegram que no salieron
 * (29-sep-2026).
 *
 * Desde el 19-sep el aviso respondía `chat not found` y ningún lead le llegó a
 * Rafael: la consulta #6 del 24-sep (Doral West) quedó guardada sin que nadie
 * se enterara. Con esto, lo que se guardó sin aviso sale solo cuando el aviso
 * vuelve a funcionar, con su fecha original. Se reintenta solo lo de los
 * últimos 7 días y nunca lo marcado como prueba. Si el primer envío de la
 * corrida falla, se corta: si Telegram sigue caído, no tiene sentido insistir.
 */
async function reintentarAvisos(env: Env): Promise<void> {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return;
  const desde = new Date(Date.now() - DIAS_REINTENTO * 86_400_000).toISOString();
  let filas: {
    id: number;
    creado_en: string;
    nombre: string;
    contacto: string;
    proyecto: string | null;
    mensaje: string | null;
    origen: string | null;
  }[] = [];
  try {
    const r = await env.DB.prepare(
      `SELECT id, creado_en, nombre, contacto, proyecto, mensaje, origen
         FROM consultas
        WHERE notificado_en IS NULL AND estado != 'prueba' AND creado_en > ?
        ORDER BY id
        LIMIT ?`,
    )
      .bind(desde, REINTENTOS_POR_CORRIDA)
      .all();
    filas = (r.results ?? []) as typeof filas;
  } catch (e) {
    console.error("[reintentos] no se pudo leer la tabla de consultas:", e);
    return;
  }

  for (const f of filas) {
    const deAgente = (f.origen ?? "").startsWith("agente:");
    const titulo = deAgente
      ? "📞 <b>Llamada pedida con Rafael</b> · aviso atrasado"
      : "🏠 <b>Consulta en rhfliving.com</b> · aviso atrasado";
    const aviso = await notificarTelegram(
      env,
      {
        id: f.id,
        nombre: f.nombre,
        contacto: f.contacto,
        proyecto: f.proyecto ?? "",
        mensaje: f.mensaje ?? "",
        origen: f.origen ?? "",
        creado: new Date(f.creado_en),
      },
      titulo,
    );
    if (!aviso.ok) {
      console.error("[reintentos] el aviso sigue sin salir:", aviso.motivo);
      return;
    }
    try {
      await env.DB.prepare(`UPDATE consultas SET notificado_en = ? WHERE id = ?`)
        .bind(new Date().toISOString(), f.id)
        .run();
    } catch (e) {
      console.error("[reintentos] se avisó pero no se pudo marcar:", e);
      return;
    }
  }
}

// ── La TRM del día ────────────────────────────────────────────────────────

/**
 * GET /api/trm — la tasa representativa del mercado vigente (29-sep-2026).
 *
 * La web muestra el precio en pesos colombianos (Ley 1480, art. 26: el precio
 * se informa en pesos) y, si la persona lo pide con el selector de moneda, una
 * referencia aproximada en dólares. Esa referencia sale de la TRM que certifica
 * la Superintendencia Financiera y publica datos.gov.co (conjunto 32sa-8pi3).
 *
 * datos.gov.co es inestable: medido el 29-sep, de cuatro consultas seguidas
 * una tardó 8 s y otra respondió 503. Por eso la web NO depende de él en cada
 * visita:
 *  · El cron (cada 5 min) la refresca en D1 (tabla `trm`, una fila) cuando la
 *    guardada tiene más de 6 horas, con dos intentos cortos.
 *  · /api/trm lee de D1 y la respuesta se guarda 1 hora en la caché de
 *    Cloudflare. Solo si D1 todavía no tiene ninguna (el primer uso), la pide
 *    en el momento.
 *  · Si nunca se pudo leer, responde 503 y la web muestra solo pesos. La
 *    respuesta lleva la fecha de vigencia, y la web la dice junto al dólar: una
 *    TRM de ayer se ve como de ayer.
 */
const URL_TRM =
  "https://www.datos.gov.co/resource/32sa-8pi3.json?$order=vigenciadesde%20DESC&$limit=1";
const HORAS_REFRESCO_TRM = 6;
const CREAR_TRM = `CREATE TABLE IF NOT EXISTS trm (
  id             INTEGER PRIMARY KEY CHECK (id = 1),
  valor          REAL    NOT NULL,
  vigente_desde  TEXT    NOT NULL,
  vigente_hasta  TEXT,
  actualizado_en TEXT    NOT NULL
)`;
let trmLista = false;

type FilaTRM = { valor: number; vigente_desde: string; vigente_hasta: string | null; actualizado_en: string };

async function tablaTRM(env: Env): Promise<void> {
  if (trmLista) return;
  await env.DB.prepare(CREAR_TRM).run();
  trmLista = true;
}

async function leerTRMGuardada(env: Env): Promise<FilaTRM | null> {
  await tablaTRM(env);
  return env.DB.prepare(`SELECT valor, vigente_desde, vigente_hasta, actualizado_en FROM trm WHERE id = 1`).first<FilaTRM>();
}

/** Consulta datos.gov.co (dos intentos cortos) y guarda la TRM en D1. */
async function refrescarTRM(env: Env): Promise<FilaTRM | null> {
  for (let intento = 0; intento < 2; intento++) {
    try {
      const r = await fetch(URL_TRM, { signal: AbortSignal.timeout(5000) });
      if (!r.ok) throw new Error(`datos.gov.co respondió ${r.status}`);
      const filas = (await r.json()) as { valor?: string; vigenciadesde?: string; vigenciahasta?: string }[];
      const fila = filas[0];
      const valor = Number(fila?.valor);
      // Una TRM fuera de este rango es un dato roto, no una devaluación.
      if (!fila || !Number.isFinite(valor) || valor < 1000 || valor > 20000 || !fila.vigenciadesde) {
        throw new Error("TRM fuera de rango o vacía");
      }
      const nueva: FilaTRM = {
        valor,
        vigente_desde: fila.vigenciadesde.slice(0, 10),
        vigente_hasta: fila.vigenciahasta ? fila.vigenciahasta.slice(0, 10) : null,
        actualizado_en: new Date().toISOString(),
      };
      await tablaTRM(env);
      await env.DB.prepare(
        `INSERT INTO trm (id, valor, vigente_desde, vigente_hasta, actualizado_en) VALUES (1, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET valor = excluded.valor, vigente_desde = excluded.vigente_desde,
           vigente_hasta = excluded.vigente_hasta, actualizado_en = excluded.actualizado_en`,
      )
        .bind(nueva.valor, nueva.vigente_desde, nueva.vigente_hasta, nueva.actualizado_en)
        .run();
      return nueva;
    } catch (e) {
      console.error(`[trm] intento ${intento + 1} fallido:`, e);
      if (intento === 0) await new Promise((ok) => setTimeout(ok, 800));
    }
  }
  return null;
}

/** Desde el cron: refresca solo si la guardada tiene más de 6 horas. */
async function refrescarTRMSiHaceFalta(env: Env): Promise<void> {
  try {
    const guardada = await leerTRMGuardada(env);
    const edad = guardada ? Date.now() - Date.parse(guardada.actualizado_en) : Infinity;
    if (edad > HORAS_REFRESCO_TRM * 3600_000) await refrescarTRM(env);
  } catch (e) {
    console.error("[trm] el cron no pudo refrescar la TRM:", e);
  }
}

async function trmDelDia(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return json({ ok: false, error: "metodo_no_permitido" }, 405);
  }
  const cache = caches.default;
  const clave = new Request(new URL("/api/trm?v=2", request.url).toString(), { method: "GET" });
  const enCache = await cache.match(clave);
  if (enCache) return enCache;

  let fila: FilaTRM | null = null;
  try {
    fila = (await leerTRMGuardada(env)) ?? (await refrescarTRM(env));
  } catch (e) {
    console.error("[trm] no se pudo leer la TRM:", e);
  }
  if (!fila) return json({ ok: false, error: "trm_no_disponible" }, 503);

  const respuesta = new Response(
    JSON.stringify({
      ok: true,
      valor: fila.valor,
      vigente_desde: fila.vigente_desde,
      vigente_hasta: fila.vigente_hasta,
      fuente: "Superintendencia Financiera de Colombia (datos.gov.co)",
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    },
  );
  ctx.waitUntil(cache.put(clave, respuesta.clone()));
  return respuesta;
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

/**
 * Lo que devuelve /api/consulta (29-sep-2026, auditoría AS-8).
 *
 * En rhfliving.com, solo `{ ok: true }`: el id secuencial dejaba medir el
 * volumen de consultas y `motivo_aviso` decía si Rafael se había enterado, a
 * cualquiera que fijara un Origin permitido. En las vistas previas
 * (*.workers.dev) sigue el diagnóstico completo, que es donde hace falta: la
 * lección del 19-sep (`wrangler tail` no sigue a los previews) sigue en pie.
 */
function respuestaConsulta(
  request: Request,
  id: number,
  aviso: { ok: boolean; motivo?: string },
): Record<string, unknown> {
  const host = new URL(request.url).hostname;
  if (!host.endsWith(".workers.dev") && host !== "localhost" && host !== "127.0.0.1") {
    return { ok: true };
  }
  return { ok: true, guardado: id > 0, id, notificado: aviso.ok, ...(aviso.motivo ? { motivo_aviso: aviso.motivo } : {}) };
}

