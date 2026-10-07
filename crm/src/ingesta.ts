/**
 * Los leads del sitio entran solos al CRM.
 *
 * Todo lo que llega por el sitio cae en `consultas`: el formulario de contacto,
 * el de /vender, la guía, el simulador y las llamadas que pide el agente de
 * WhatsApp y del chat. La ingesta lee las consultas nuevas, en orden, y por
 * cada una:
 *
 *  1. busca a la persona por teléfono (E.164) o correo, o crea su ficha;
 *  2. busca su oportunidad abierta del mismo tipo (compra o venta), o la crea
 *     en la etapa «Nuevo»;
 *  3. agrega la consulta a su línea de tiempo.
 *
 * La consulta no se copia ni se mueve: sigue en `consultas` como constancia de
 * la autorización, y la actividad la enlaza. Las marcadas «prueba» (las del
 * agente) no entran.
 *
 * Es idempotente: si se corta a la mitad, la próxima vez retoma sin duplicar
 * (cada consulta entra una sola vez, por `idx_crm_actividades_consulta`).
 *
 * Corre cada vez que Rafael abre el CRM, de a pocas consultas, porque el plan
 * gratis de Workers permite 50 consultas a la base por petición.
 */
import { FUENTES, fuenteDeOrigen, nombreDeInteres, type Tipo } from "./datos";
import { separarContacto } from "./telefono";
import { canalDe, leerAtribucion, resumenAtribucion } from "./canales";
import { referenciaDeMensaje, sentenciaEnlazar } from "./conversaciones";
import {
  FORMAS_PAGO,
  NO_SE,
  OBJETIVOS,
  RANGOS_PRESUPUESTO,
  formaPagoValida,
  nombreDe,
  objetivoValido,
  presupuestoValido,
  rangoDeTexto,
} from "@/data/calificacion";

type Consulta = {
  id: number;
  creado_en: string;
  nombre: string;
  contacto: string;
  proyecto: string | null;
  mensaje: string | null;
  version_aviso: string;
  origen: string | null;
  estado: string;
  /** Desde la migración 0008 (7-oct-2026): las tres preguntas y el canal. */
  presupuesto: string | null;
  forma_pago: string | null;
  objetivo: string | null;
  atribucion: string | null;
  canal: string | null;
};

/**
 * Cuántas consultas se procesan por petición (6 sentencias cada una). El
 * plan gratis permite 50 por petición, y la página que se abre después de la
 * ingesta usa las suyas.
 */
export const POR_PETICION = 4;

/** Procesa las consultas nuevas. Devuelve cuántas leyó (entren o no). */
export async function ingerir(db: D1Database, limite = POR_PETICION): Promise<number> {
  const cursor = await db
    .prepare(`SELECT ultimo_id FROM crm_ingesta WHERE fuente = 'consultas'`)
    .first<{ ultimo_id: number }>();
  const desde = cursor?.ultimo_id ?? 0;
  const r = await db
    .prepare(
      `SELECT id, creado_en, nombre, contacto, proyecto, mensaje, version_aviso, origen, estado,
              presupuesto, forma_pago, objetivo, atribucion, canal
         FROM consultas WHERE id > ? ORDER BY id LIMIT ?`,
    )
    .bind(desde, limite)
    .all<Consulta>();
  if (!r.results.length) return 0;

  let ultimo = desde;
  for (const q of r.results) {
    if (q.estado !== "prueba") await ingerirUna(db, q);
    ultimo = q.id;
  }
  await db
    .prepare(
      `INSERT INTO crm_ingesta (fuente, ultimo_id, actualizado_en) VALUES ('consultas', ?, ?)
       ON CONFLICT(fuente) DO UPDATE SET ultimo_id = excluded.ultimo_id, actualizado_en = excluded.actualizado_en`,
    )
    .bind(ultimo, new Date().toISOString())
    .run();
  return r.results.length;
}

/** La línea «Etiqueta: valor» del mensaje que arma el agente. */
function lineaDe(mensaje: string | null, etiqueta: string): string | null {
  const m = (mensaje ?? "").match(new RegExp(`^${etiqueta}:\\s*(.+)$`, "m"));
  return m ? m[1].trim().slice(0, 120) : null;
}

async function ingerirUna(db: D1Database, q: Consulta): Promise<void> {
  // Las fechas de la ficha son las de la consulta, no las de la ingesta: así
  // «movido hace…» y el orden de las listas dicen cuándo escribió la persona.
  const { telefono, correo, crudo } = separarContacto(q.contacto);
  const fuente = fuenteDeOrigen(q.origen);
  const mensaje = q.mensaje ?? "";
  const idioma = (q.origen ?? "").startsWith("/en") || /^Idioma: inglés$/m.test(mensaje) ? "en" : "es";
  const tipo: Tipo = fuente === "vender" || mensaje.startsWith("Quiere vender o consignar") ? "venta" : "compra";
  const pagina = q.origen && q.origen.startsWith("/") ? q.origen : null;
  const ciudad = lineaDe(mensaje, "Escribe desde");

  // El canal y la calificación (7-oct-2026). Las consultas de antes no traen
  // atribución: quedan «sin dato», nunca se adivina.
  const atribucion = leerAtribucion(q.atribucion);
  const canal = q.canal ?? canalDe(atribucion, q.origen);
  const utm = atribucion
    ? JSON.stringify(
        Object.fromEntries(Object.entries(atribucion).filter(([k]) => k.startsWith("utm_"))),
      )
    : null;
  const utmGuardada = utm && utm !== "{}" ? utm : null;
  const rango = presupuestoValido(q.presupuesto) ?? (fuente === "whatsapp" || fuente === "chat" || fuente === "agente" ? rangoDeTexto(lineaDe(mensaje, "Rango")) : null);
  const pago = formaPagoValida(q.forma_pago);
  const objetivo = objetivoValido(q.objetivo);
  const proposito = objetivo && objetivo !== NO_SE ? objetivo : null;

  // 1. La persona.
  let contactoId: number | null = null;
  if (telefono || correo || crudo) {
    const existente = await db
      .prepare(
        `SELECT id FROM crm_contactos
          WHERE estado_datos != 'suprimido'
            AND ((?1 IS NOT NULL AND telefono = ?1)
              OR (?2 IS NOT NULL AND correo = ?2)
              OR (?3 IS NOT NULL AND telefono_crudo = ?3))
          ORDER BY id LIMIT 1`,
      )
      .bind(telefono, correo, crudo)
      .first<{ id: number }>();
    contactoId = existente?.id ?? null;
  }
  if (contactoId) {
    await db
      .prepare(
        `UPDATE crm_contactos
            SET actualizado_en = MAX(actualizado_en, ?), fuente_ultima = ?,
                nombre = COALESCE(nombre, ?), telefono = COALESCE(telefono, ?),
                correo = COALESCE(correo, ?), ciudad = COALESCE(ciudad, ?),
                canal = CASE WHEN canal IS NULL OR canal = 'sin_dato' THEN ? ELSE canal END, canal_ultimo = ?,
                utm_primero = COALESCE(utm_primero, ?), utm_ultimo = COALESCE(?, utm_ultimo),
                gclid = COALESCE(?, gclid), fbclid = COALESCE(?, fbclid)
          WHERE id = ?`,
      )
      .bind(
        q.creado_en,
        fuente,
        q.nombre || null,
        telefono,
        correo,
        ciudad,
        canal,
        canal,
        utmGuardada,
        utmGuardada,
        atribucion?.gclid ?? atribucion?.gbraid ?? atribucion?.wbraid ?? null,
        atribucion?.fbclid ?? null,
        contactoId,
      )
      .run();
  } else {
    const r = await db
      .prepare(
        `INSERT INTO crm_contactos
           (creado_en, actualizado_en, nombre, telefono, telefono_crudo, correo, ciudad, idioma,
            fuente, fuente_ultima, pagina_entrada, canal, canal_ultimo, utm_primero, utm_ultimo, gclid, fbclid,
            autorizacion_fecha, autorizacion_version, autorizacion_canal, autorizacion_evidencia)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        q.creado_en,
        q.creado_en,
        q.nombre || null,
        telefono,
        crudo,
        correo,
        ciudad,
        idioma,
        fuente,
        fuente,
        atribucion?.landing ?? pagina,
        canal,
        canal,
        utmGuardada,
        utmGuardada,
        atribucion?.gclid ?? atribucion?.gbraid ?? atribucion?.wbraid ?? null,
        atribucion?.fbclid ?? null,
        q.creado_en,
        q.version_aviso,
        fuente,
        `Consulta #${q.id} del sitio`,
      )
      .run();
    contactoId = Number(r.meta.last_row_id);
  }

  // 2. Su oportunidad abierta del mismo tipo. Una consulta nueva abre la
  // espera de la primera respuesta (crm/src/sla.ts) y cuenta como actividad.
  const abierta = await db
    .prepare(
      `SELECT id FROM crm_oportunidades WHERE contacto_id = ? AND tipo = ? AND cerrada = 0 ORDER BY id DESC LIMIT 1`,
    )
    .bind(contactoId, tipo)
    .first<{ id: number }>();
  let oportunidadId: number;
  if (abierta) {
    oportunidadId = abierta.id;
    await db
      .prepare(
        `UPDATE crm_oportunidades
            SET actualizado_en = MAX(actualizado_en, ?1), interes = COALESCE(interes, ?2),
                rango_presupuesto = COALESCE(?3, rango_presupuesto), pago = COALESCE(?4, pago),
                proposito = COALESCE(proposito, ?5),
                sla_aviso_en = CASE WHEN espera_desde IS NULL THEN NULL ELSE sla_aviso_en END,
                sla_vencido_en = CASE WHEN espera_desde IS NULL THEN NULL ELSE sla_vencido_en END,
                espera_desde = COALESCE(espera_desde, ?1),
                ultima_actividad_en = MAX(COALESCE(ultima_actividad_en, ''), ?1),
                higiene_nivel = 0, higiene_en = NULL
          WHERE id = ?6`,
      )
      .bind(q.creado_en, q.proyecto || null, rango, pago, proposito, oportunidadId)
      .run();
  } else {
    const r = await db
      .prepare(
        `INSERT INTO crm_oportunidades
           (contacto_id, creado_en, actualizado_en, tipo, etapa, etapa_desde, interes, canal,
            rango_presupuesto, pago, proposito, espera_desde, ultima_actividad_en)
         VALUES (?1, ?2, ?2, ?3, 'nuevo', ?2, ?4, ?5, ?6, ?7, ?8, ?2, ?2)`,
      )
      .bind(contactoId, q.creado_en, tipo, q.proyecto || null, canal, rango, pago, proposito)
      .run();
    oportunidadId = Number(r.meta.last_row_id);
  }

  // 3. La consulta en su línea de tiempo, con lo que respondió y de dónde vino.
  const calificacion = [
    q.presupuesto ? `Presupuesto: ${nombreDe(RANGOS_PRESUPUESTO, q.presupuesto)}` : null,
    q.forma_pago ? `Forma de pago: ${nombreDe(FORMAS_PAGO, q.forma_pago)}` : null,
    q.objetivo ? `Para qué: ${nombreDe(OBJETIVOS, q.objetivo)}` : null,
  ].filter(Boolean);
  const texto = [
    FUENTES[fuente] ?? fuente,
    pagina ? `Página: ${pagina}` : null,
    q.proyecto ? `Interés: ${nombreDeInteres(q.proyecto)}` : null,
    ...calificacion,
    canal !== "sin_dato" ? `Canal: ${resumenAtribucion(canal, atribucion)}` : null,
    mensaje || null,
  ]
    .filter(Boolean)
    .join("\n");
  await db
    .prepare(
      `INSERT INTO crm_actividades (contacto_id, oportunidad_id, creado_en, tipo, texto, autor, consulta_id)
       VALUES (?, ?, ?, ?, ?, 'sitio', ?)
       ON CONFLICT DO NOTHING`,
    )
    .bind(contactoId, oportunidadId, q.creado_en, fuente.startsWith("agente") || fuente === "whatsapp" || fuente === "chat" ? "agente" : "formulario", texto, q.id)
    .run();

  // 4. Su conversación con el agente, si la hay (crm/src/conversaciones.ts).
  const enlazar = sentenciaEnlazar(db, contactoId, telefono, referenciaDeMensaje(mensaje));
  if (enlazar) await enlazar.run();
}

/** La ficha a la que fue a dar una consulta del sitio, o null. */
export async function contactoDeConsulta(db: D1Database, consultaId: number): Promise<number | null> {
  const f = await db
    .prepare(`SELECT contacto_id FROM crm_actividades WHERE consulta_id = ?`)
    .bind(consultaId)
    .first<{ contacto_id: number }>();
  return f?.contacto_id ?? null;
}
