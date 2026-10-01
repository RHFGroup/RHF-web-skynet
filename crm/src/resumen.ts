/**
 * El resumen del día por Telegram, a las 7:30 a. m. de Colombia (Prompt 3,
 * §2.6). Solo cifras y el enlace: los nombres se ven al entrar.
 */
import type { Env } from "./env";
import { ingerir } from "./ingesta";
import { hoy, sumarDias } from "./tiempo";

export async function mandarResumen(env: Env): Promise<void> {
  const db = env.DB;
  try {
    // Primero, lo que haya llegado por el sitio desde la última vez.
    await ingerir(db);
    const hoyLocal = hoy();
    const [sin, tareas, vencidas, recorridos] = await Promise.all([
      db
        .prepare(
          `SELECT COUNT(DISTINCT c.id) AS n FROM crm_contactos c
             JOIN crm_oportunidades o ON o.contacto_id = c.id AND o.cerrada = 0 AND o.etapa = 'nuevo'
            WHERE c.estado_datos != 'suprimido' AND c.ultimo_contacto_en IS NULL`,
        )
        .first<{ n: number }>(),
      db.prepare(`SELECT COUNT(*) AS n FROM crm_tareas WHERE hecha_en IS NULL AND vence_en = ?`).bind(hoyLocal).first<{ n: number }>(),
      db.prepare(`SELECT COUNT(*) AS n FROM crm_tareas WHERE hecha_en IS NULL AND vence_en < ?`).bind(hoyLocal).first<{ n: number }>(),
      db
        .prepare(
          `SELECT COUNT(*) AS n FROM crm_oportunidades
            WHERE recorrido_en IS NOT NULL AND cerrada = 0 AND substr(recorrido_en, 1, 10) BETWEEN ? AND ?`,
        )
        .bind(hoyLocal, sumarDias(hoyLocal, 1))
        .first<{ n: number }>(),
    ]);
    const lineas = [
      "☀️ <b>Tu día en el CRM</b>",
      "",
      `• Leads sin contactar: <b>${sin?.n ?? 0}</b>`,
      `• Tareas de hoy: <b>${tareas?.n ?? 0}</b>${(vencidas?.n ?? 0) > 0 ? ` (+${vencidas?.n} atrasadas)` : ""}`,
      `• Recorridos hoy y mañana: <b>${recorridos?.n ?? 0}</b>`,
      "",
      `<a href="https://crm.rhfliving.com/hoy">Abrir el CRM</a>`,
    ];
    const r = await env.AVISOS.telegram(lineas.join("\n"));
    console.log(JSON.stringify({ resumen: r.ok ? "enviado" : "fallo", motivo: r.ok ? undefined : r.motivo }));
  } catch (e) {
    console.error(JSON.stringify({ resumen: "error", detalle: e instanceof Error ? e.message.slice(0, 200) : "?" }));
  }
}
