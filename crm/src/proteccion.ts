/**
 * Ley 1581 dentro del CRM (Prompt 3, §2.7): exportar los datos de una persona,
 * marcar un reclamo en trámite y suprimir sus datos. También la baja y la
 * reactivación en el boletín y su exportación.
 */
import { ahoraIso, auditar, existeTabla, sentenciaAuditoria, type Ctx } from "./base";
import { volverA } from "./acciones";
import type { Contacto } from "./paginas/ficha";

/** Exportar los datos de la persona, para responder una consulta del titular. */
export async function exportarContacto(c: Ctx, id: number): Promise<Response> {
  const contacto = await c.db.prepare(`SELECT * FROM crm_contactos WHERE id = ?`).bind(id).first<Contacto>();
  if (!contacto) return volverA("/hoy");
  const [ops, acts, tareas, consultas] = await Promise.all([
    c.db.prepare(`SELECT * FROM crm_oportunidades WHERE contacto_id = ? ORDER BY id`).bind(id).all(),
    c.db.prepare(`SELECT id, creado_en, tipo, texto, autor, consulta_id FROM crm_actividades WHERE contacto_id = ? ORDER BY id`).bind(id).all(),
    c.db.prepare(`SELECT id, creado_en, titulo, vence_en, hecha_en FROM crm_tareas WHERE contacto_id = ? ORDER BY id`).bind(id).all(),
    c.db
      .prepare(
        `SELECT * FROM consultas WHERE id IN
           (SELECT consulta_id FROM crm_actividades WHERE contacto_id = ? AND consulta_id IS NOT NULL) ORDER BY id`,
      )
      .bind(id)
      .all(),
  ]);
  let boletin: unknown[] = [];
  if (contacto.correo && (await existeTabla(c.db, "suscriptores"))) {
    boletin = (await c.db.prepare(`SELECT * FROM suscriptores WHERE correo = ?`).bind(contacto.correo).all()).results;
  }
  await auditar(c, "exportar", "contacto", id);
  const cuerpo = {
    exportado_en: ahoraIso(),
    responsable: "Medardo Rafael Hernández Franco",
    persona: contacto,
    oportunidades: ops.results,
    actividades: acts.results,
    tareas: tareas.results,
    consultas_del_sitio: consultas.results,
    boletin,
  };
  return new Response(JSON.stringify(cuerpo, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="datos-ficha-${id}.json"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function marcarReclamo(c: Ctx, id: number, f: FormData): Promise<Response> {
  const estado = f.get("estado") === "normal" ? "normal" : "reclamo";
  const r = await c.db
    .prepare(`SELECT id FROM crm_contactos WHERE id = ? AND estado_datos != 'suprimido'`)
    .bind(id)
    .first();
  if (!r) return volverA("/hoy");
  const ahora = ahoraIso();
  await c.db.batch([
    c.db.prepare(`UPDATE crm_contactos SET estado_datos = ?, actualizado_en = ? WHERE id = ?`).bind(estado, ahora, id),
    c.db
      .prepare(`INSERT INTO crm_actividades (contacto_id, creado_en, tipo, texto, autor) VALUES (?, ?, 'sistema', ?, ?)`)
      .bind(id, ahora, estado === "reclamo" ? "Reclamo en trámite (Ley 1581)" : "Reclamo cerrado", c.usuario),
    sentenciaAuditoria(c, estado === "reclamo" ? "reclamo" : "reclamo_cerrado", "contacto", id),
  ]);
  return volverA(`/contacto/${id}`, { ok: estado });
}

const SUPRIMIDO = "[suprimido]";

/**
 * Suprimir: borra los datos personales de la persona, en el CRM y en el buzón
 * del sitio (`consultas`), y su correo del boletín. Queda solo el registro de
 * la solicitud (auditoría y una línea en la ficha), con fechas y sin datos.
 * Pide escribir el nombre para confirmar. No se puede deshacer.
 */
export async function suprimir(c: Ctx, id: number, f: FormData): Promise<Response> {
  const contacto = await c.db
    .prepare(`SELECT * FROM crm_contactos WHERE id = ? AND estado_datos != 'suprimido'`)
    .bind(id)
    .first<Contacto>();
  if (!contacto) return volverA("/hoy");
  const esperado = (contacto.nombre || "SUPRIMIR").trim().toLowerCase();
  const escrito = String(f.get("confirmacion") ?? "").trim().toLowerCase();
  if (!escrito || escrito !== esperado) return volverA(`/contacto/${id}`, { error: "confirmacion" });

  const ahora = ahoraIso();
  const marcador = `suprimido-${id}@suprimido.invalid`;
  const sentencias: D1PreparedStatement[] = [
    // El buzón del sitio: queda la fila con su fecha, su origen y la versión del
    // aviso, sin nada que identifique a la persona.
    c.db
      .prepare(
        `UPDATE consultas
            SET nombre = ?, contacto = ?, proyecto = NULL, mensaje = NULL, ip = NULL, user_agent = NULL
          WHERE id IN (SELECT consulta_id FROM crm_actividades WHERE contacto_id = ? AND consulta_id IS NOT NULL)`,
      )
      .bind(SUPRIMIDO, SUPRIMIDO, id),
    c.db
      .prepare(
        `UPDATE crm_contactos
            SET nombre = NULL, telefono = NULL, telefono_crudo = NULL, correo = NULL, pais = NULL, ciudad = NULL,
                pagina_entrada = NULL, codigo_wa = NULL, utm_primero = NULL, utm_ultimo = NULL, gclid = NULL, fbclid = NULL,
                autorizacion_evidencia = NULL, estado_datos = 'suprimido', actualizado_en = ?
          WHERE id = ?`,
      )
      .bind(ahora, id),
    c.db
      .prepare(
        `UPDATE crm_oportunidades
            SET interes = NULL, proposito = NULL, presupuesto = NULL, forma_pago = NULL, plazo = NULL,
                proxima_accion = NULL, unidad = NULL, puntaje_motivo = NULL, cerrada = 1, actualizado_en = ?
          WHERE contacto_id = ?`,
      )
      .bind(ahora, id),
    c.db.prepare(`UPDATE crm_actividades SET texto = NULL WHERE contacto_id = ?`).bind(id),
    c.db.prepare(`UPDATE crm_tareas SET titulo = ?, hecha_en = COALESCE(hecha_en, ?) WHERE contacto_id = ?`).bind(SUPRIMIDO, ahora, id),
    c.db
      .prepare(`INSERT INTO crm_actividades (contacto_id, creado_en, tipo, texto, autor) VALUES (?, ?, 'sistema', ?, ?)`)
      .bind(id, ahora, "Datos suprimidos por solicitud del titular (Ley 1581)", c.usuario),
    sentenciaAuditoria(c, "suprimir", "contacto", id, "solicitud del titular"),
  ];

  if (contacto.correo && (await existeTabla(c.db, "suscriptores"))) {
    sentencias.push(
      c.db
        .prepare(
          `UPDATE suscriptores
              SET correo = ?, estado = 'baja', baja_en = COALESCE(baja_en, ?), ip = NULL, user_agent = NULL
            WHERE correo = ?`,
        )
        .bind(marcador, ahora, contacto.correo),
    );
    if (await existeTabla(c.db, "suscripcion_eventos")) {
      sentencias.push(
        c.db
          .prepare(`UPDATE suscripcion_eventos SET correo = ?, ip = NULL, user_agent = NULL WHERE correo = ?`)
          .bind(marcador, contacto.correo),
      );
    }
    if (await existeTabla(c.db, "suscripcion_confirmaciones")) {
      sentencias.push(
        c.db.prepare(`UPDATE suscripcion_confirmaciones SET correo = ? WHERE correo = ?`).bind(marcador, contacto.correo),
      );
    }
  }
  await c.db.batch(sentencias);
  return volverA(`/contacto/${id}`, { ok: "suprimido" });
}

/** La baja de quien respondió BAJA a un boletín. */
export async function bajaBoletin(c: Ctx, id: number): Promise<Response> {
  const s = await c.db
    .prepare(`SELECT id, correo FROM suscriptores WHERE id = ? AND estado = 'activa'`)
    .bind(id)
    .first<{ id: number; correo: string }>();
  if (!s) return volverA("/boletin");
  const ahora = ahoraIso();
  const sentencias: D1PreparedStatement[] = [
    c.db
      .prepare(`UPDATE suscriptores SET estado = 'baja', baja_en = ?, actualizado_en = ? WHERE id = ?`)
      .bind(ahora, ahora, id),
    sentenciaAuditoria(c, "baja_boletin", "suscriptor", id),
  ];
  if (await existeTabla(c.db, "suscripcion_eventos")) {
    sentencias.push(
      c.db
        .prepare(`INSERT INTO suscripcion_eventos (creado_en, correo, tipo, origen) VALUES (?, ?, 'baja', 'crm')`)
        .bind(ahora, s.correo),
    );
  }
  await c.db.batch(sentencias);
  return volverA("/boletin", { ok: "baja" });
}

/**
 * Reactivar a quien estaba de baja y volvió a suscribirse en el sitio, después
 * de confirmar con la persona (decisión de Rafael, 30-sep). La constancia es la
 * de su pedido en el sitio: la autorización nueva, con su fecha, IP y página.
 */
export async function reactivarBoletin(c: Ctx, id: number): Promise<Response> {
  if (!(await existeTabla(c.db, "suscripcion_eventos"))) return volverA("/boletin");
  const s = await c.db
    .prepare(`SELECT id, correo, baja_en FROM suscriptores WHERE id = ? AND estado = 'baja'`)
    .bind(id)
    .first<{ id: number; correo: string; baja_en: string | null }>();
  if (!s) return volverA("/boletin");
  const pedido = await c.db
    .prepare(
      `SELECT creado_en, version_aviso, ip, user_agent, origen FROM suscripcion_eventos
        WHERE correo = ? AND tipo = 'reactivacion' AND (? IS NULL OR creado_en > ?)
        ORDER BY id DESC LIMIT 1`,
    )
    .bind(s.correo, s.baja_en, s.baja_en)
    .first<{ creado_en: string; version_aviso: string | null; ip: string | null; user_agent: string | null; origen: string | null }>();
  if (!pedido) return volverA("/boletin");
  const ahora = ahoraIso();
  await c.db.batch([
    c.db
      .prepare(
        `UPDATE suscriptores
            SET estado = 'activa', baja_en = NULL, version_aviso = COALESCE(?, version_aviso),
                ip = ?, user_agent = ?, origen = ?, actualizado_en = ?
          WHERE id = ?`,
      )
      .bind(pedido.version_aviso, pedido.ip, pedido.user_agent, pedido.origen, ahora, id),
    c.db
      .prepare(
        `INSERT INTO suscripcion_eventos (creado_en, correo, tipo, autoriza, version_aviso, origen)
         VALUES (?, ?, 'confirmacion', 1, ?, 'crm')`,
      )
      .bind(ahora, s.correo, pedido.version_aviso),
    sentenciaAuditoria(c, "reactivar_boletin", "suscriptor", id),
  ]);
  return volverA("/boletin", { ok: "guardado" });
}

/** Una celda de CSV que una hoja de cálculo no pueda interpretar como fórmula. */
function celda(v: unknown): string {
  let s = v === null || v === undefined ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Los suscriptores activos, en CSV (Prompt 3, §2.5: solo los activos). */
export async function csvBoletin(c: Ctx): Promise<Response> {
  if (!(await existeTabla(c.db, "suscriptores"))) return volverA("/boletin");
  const r = await c.db
    .prepare(`SELECT correo, creado_en, origen FROM suscriptores WHERE estado = 'activa' ORDER BY creado_en`)
    .all<{ correo: string; creado_en: string; origen: string | null }>();
  await auditar(c, "exportar_boletin", null, null, `${r.results.length} activos`);
  const lineas = ["correo,suscrito_desde,pagina", ...r.results.map((f) => [f.correo, f.creado_en, f.origen].map(celda).join(","))];
  return new Response(`﻿${lineas.join("\r\n")}\r\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="boletin-activos.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
