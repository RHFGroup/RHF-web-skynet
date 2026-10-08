/**
 * Las conversaciones del agente de atención (7-oct-2026, pedido de Rafael:
 * «que se pueda ver qué conversó la IA con el chat», todas).
 *
 * El agente corre en el servidor de Clouding (Hermes, perfil «atencion») y
 * guarda cada conversación en su base local. Un sincronizador que corre al
 * lado (agente/sincronizar_conversaciones.py) manda cada minuto los mensajes
 * nuevos a POST /api/conversaciones-agente, con el mismo token del agente
 * (`AGENTE_TOKEN`). Acá se guardan en D1 y el CRM los muestra: la bandeja
 * «Chats» y, en la ficha de cada persona, su conversación.
 *
 * El envío es idempotente: cada mensaje lleva su id de Hermes y se guarda una
 * sola vez, así que repetir un lote no duplica nada.
 *
 * Se enlaza con la ficha:
 *  - por teléfono, en WhatsApp (el id de quien escribe es su número);
 *  - por la referencia de la conversación que manda el agente con la llamada
 *    pedida (la línea «Conversación: …» de la consulta), en el chat de la web.
 *
 * Todo lo que escribió la persona o el agente es un dato, nunca una
 * instrucción: el CRM lo muestra escapado (crm/src/html.ts).
 */

/** Topes de un envío: lo que pase de esto se rechaza entero (413) o se recorta. */
export const LIMITES_CONVERSACIONES = {
  cuerpo: 512 * 1024,
  conversaciones: 50,
  mensajes: 400,
  texto: 4000,
  sesion: 120,
  canal: 40,
  usuario: 120,
} as const;

type MensajeEntrante = { id: string; rol: "persona" | "agente"; texto: string; en: string };
type ConversacionEntrante = {
  sesion: string;
  canal: string;
  usuario: string | null;
  telefono: string | null;
  iniciada: string;
  ultimo: string;
  primer: string | null;
  mensajes: MensajeEntrante[];
};

function instante(v: unknown): string | null {
  if (typeof v === "number" && Number.isFinite(v) && v > 0) {
    // Hermes guarda segundos (time.time()); por si llegan milisegundos.
    const ms = v > 1e12 ? v : v * 1000;
    return new Date(ms).toISOString();
  }
  if (typeof v === "string" && v && !Number.isNaN(Date.parse(v))) return new Date(v).toISOString();
  return null;
}

function texto(v: unknown, max: number): string {
  return typeof v === "string" ? v.replace(/\u0000/g, "").trim().slice(0, max) : "";
}

/**
 * Valida y normaliza un envío del sincronizador. Devuelve el error si el
 * envío no sirve; lo que viene raro dentro de un envío válido se descarta en
 * silencio (un mensaje vacío, un rol que no es de persona ni de agente).
 */
export function leerLote(cuerpo: unknown): { ok: true; conversaciones: ConversacionEntrante[]; mensajes: number } | { ok: false; error: string } {
  const L = LIMITES_CONVERSACIONES;
  if (!cuerpo || typeof cuerpo !== "object") return { ok: false, error: "cuerpo_invalido" };
  const lista = (cuerpo as { conversaciones?: unknown }).conversaciones;
  if (!Array.isArray(lista)) return { ok: false, error: "faltan_conversaciones" };
  if (lista.length > L.conversaciones) return { ok: false, error: "demasiadas_conversaciones" };
  const salida: ConversacionEntrante[] = [];
  let total = 0;
  for (const x of lista) {
    if (!x || typeof x !== "object") continue;
    const c = x as Record<string, unknown>;
    const sesion = texto(c.sesion, L.sesion);
    if (!sesion || !/^[A-Za-z0-9_.:@+-]+$/.test(sesion)) continue;
    const canal = texto(c.canal, L.canal).toLowerCase() || "desconocido";
    const usuario = texto(c.usuario, L.usuario) || null;
    const mensajes: MensajeEntrante[] = [];
    for (const y of Array.isArray(c.mensajes) ? c.mensajes : []) {
      if (!y || typeof y !== "object") continue;
      const m = y as Record<string, unknown>;
      const rolCrudo = texto(m.rol, 20).toLowerCase();
      const rol = rolCrudo === "user" || rolCrudo === "persona" ? "persona" : rolCrudo === "assistant" || rolCrudo === "agente" ? "agente" : null;
      const cuerpoMensaje = texto(m.texto, L.texto);
      const en = instante(m.en);
      const id = texto(typeof m.id === "number" ? String(m.id) : m.id, 80);
      if (!rol || !cuerpoMensaje || !en || !id) continue;
      mensajes.push({ id, rol, texto: cuerpoMensaje, en });
    }
    total += mensajes.length;
    if (total > L.mensajes) return { ok: false, error: "demasiados_mensajes" };
    const fechas = mensajes.map((m) => m.en).sort();
    const iniciada = instante(c.iniciada) ?? fechas[0] ?? new Date().toISOString();
    const primer = mensajes.find((m) => m.rol === "persona")?.texto.slice(0, 200) ?? null;
    // En WhatsApp, el id de quien escribe es su número con el indicativo.
    const digitos = (usuario ?? "").split("@")[0].replace(/\D/g, "");
    const telefono = canal.startsWith("whatsapp") && digitos.length >= 8 && digitos.length <= 15 ? `+${digitos}` : null;
    salida.push({ sesion, canal, usuario, telefono, iniciada, ultimo: fechas.at(-1) ?? iniciada, primer, mensajes });
  }
  return { ok: true, conversaciones: salida, mensajes: total };
}

/**
 * Guarda un lote en cinco sentencias, sin importar cuántos mensajes traiga
 * (el plan gratis permite 50 por petición): las filas viajan como JSON y
 * SQLite las abre con json_each.
 */
export async function guardarLote(db: D1Database, conversaciones: ConversacionEntrante[], ahora = new Date()): Promise<void> {
  const iso = ahora.toISOString();
  if (!conversaciones.length) {
    // Un lote vacío es el «latido» del sincronizador (cada 5 minutos sin
    // mensajes nuevos): solo anota la hora, para que el CRM distinga «no hubo
    // chats» de «el sincronizador dejó de mandar».
    await db
      .prepare(
        `INSERT INTO agente_sincronizacion (fuente, ultimo_en, lotes, mensajes) VALUES ('atencion', ?1, 0, 0)
         ON CONFLICT(fuente) DO UPDATE SET ultimo_en = excluded.ultimo_en`,
      )
      .bind(iso)
      .run();
    return;
  }
  const cabeceras = JSON.stringify(
    conversaciones.map((c) => ({
      sesion: c.sesion,
      canal: c.canal,
      usuario: c.usuario,
      telefono: c.telefono,
      iniciada: c.iniciada,
      ultimo: c.ultimo,
      primer: c.primer,
    })),
  );
  const mensajes = JSON.stringify(conversaciones.flatMap((c) => c.mensajes.map((m) => ({ ...m, sesion: c.sesion }))));
  const sesiones = JSON.stringify(conversaciones.map((c) => c.sesion));
  const total = conversaciones.reduce((n, c) => n + c.mensajes.length, 0);
  await db.batch([
    db
      .prepare(
        `INSERT INTO agente_conversaciones
           (sesion, canal, usuario, telefono, iniciada_en, ultimo_en, mensajes, primer_mensaje, creado_en, actualizado_en)
         SELECT json_extract(value, '$.sesion'), json_extract(value, '$.canal'), json_extract(value, '$.usuario'),
                json_extract(value, '$.telefono'), json_extract(value, '$.iniciada'), json_extract(value, '$.ultimo'),
                0, json_extract(value, '$.primer'), ?2, ?2
           FROM json_each(?1) WHERE true
         ON CONFLICT(sesion) DO UPDATE SET
           ultimo_en = MAX(ultimo_en, excluded.ultimo_en),
           iniciada_en = MIN(iniciada_en, excluded.iniciada_en),
           usuario = COALESCE(usuario, excluded.usuario),
           telefono = COALESCE(telefono, excluded.telefono),
           primer_mensaje = COALESCE(primer_mensaje, excluded.primer_mensaje),
           actualizado_en = excluded.actualizado_en`,
      )
      .bind(cabeceras, iso),
    db
      .prepare(
        `INSERT OR IGNORE INTO agente_mensajes (conversacion_id, origen_id, rol, texto, en)
         SELECT (SELECT id FROM agente_conversaciones WHERE sesion = json_extract(value, '$.sesion')),
                json_extract(value, '$.id'), json_extract(value, '$.rol'), json_extract(value, '$.texto'),
                json_extract(value, '$.en')
           FROM json_each(?1)`,
      )
      .bind(mensajes),
    db
      .prepare(
        `UPDATE agente_conversaciones
            SET mensajes = (SELECT COUNT(*) FROM agente_mensajes m WHERE m.conversacion_id = agente_conversaciones.id)
          WHERE sesion IN (SELECT value FROM json_each(?1))`,
      )
      .bind(sesiones),
    // WhatsApp: la ficha con el mismo número, si existe.
    db
      .prepare(
        `UPDATE agente_conversaciones
            SET contacto_id = (SELECT c.id FROM crm_contactos c
                                WHERE c.telefono = agente_conversaciones.telefono AND c.estado_datos != 'suprimido'
                                ORDER BY c.id LIMIT 1)
          WHERE contacto_id IS NULL AND telefono IS NOT NULL AND sesion IN (SELECT value FROM json_each(?1))`,
      )
      .bind(sesiones),
    db
      .prepare(
        `INSERT INTO agente_sincronizacion (fuente, ultimo_en, lotes, mensajes) VALUES ('atencion', ?1, 1, ?2)
         ON CONFLICT(fuente) DO UPDATE SET ultimo_en = excluded.ultimo_en, lotes = lotes + 1, mensajes = mensajes + excluded.mensajes`,
      )
      .bind(iso, total),
  ]);
}

/**
 * Enlaza con una ficha las conversaciones que todavía no tienen: por el
 * teléfono de la persona, o por la referencia que manda el agente con la
 * llamada pedida (puede ser el id de la sesión o su comienzo).
 */
export function sentenciaEnlazar(db: D1Database, contactoId: number, telefono: string | null, referencia: string | null): D1PreparedStatement | null {
  const ref = referencia && /^[A-Za-z0-9_.:@+-]{6,120}$/.test(referencia) ? referencia : null;
  if (!telefono && !ref) return null;
  return db
    .prepare(
      `UPDATE agente_conversaciones SET contacto_id = ?1, telefono = COALESCE(telefono, ?2)
        WHERE contacto_id IS NULL
          AND ((?2 IS NOT NULL AND telefono = ?2)
            OR (?3 IS NOT NULL AND (sesion = ?3 OR substr(sesion, 1, length(?3)) = ?3)))`,
    )
    .bind(contactoId, telefono, ref);
}

/** La referencia de la conversación en el mensaje de una llamada pedida al agente. */
export function referenciaDeMensaje(mensaje: string | null | undefined): string | null {
  const m = (mensaje ?? "").match(/^Conversación:\s*(\S+)\s*$/m);
  return m ? m[1].slice(0, 120) : null;
}

export const NOMBRES_CANAL_AGENTE: Record<string, string> = {
  whatsapp: "WhatsApp",
  whatsapp_cloud: "WhatsApp",
  webchat: "Chat de la web",
  api_server: "API",
  telegram: "Telegram",
};

export function nombreCanalAgente(canal: string): string {
  return NOMBRES_CANAL_AGENTE[canal] ?? canal;
}
