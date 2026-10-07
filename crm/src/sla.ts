/**
 * Speed to lead (7-oct-2026, pedido de Rafael): medir el tiempo exacto de la
 * primera respuesta y avisar cuando un lead lleva más de 10 o 15 minutos sin
 * ella.
 *
 * Cómo se mide:
 *  - Desde: `espera_desde`, cuando llegó la consulta (la del sitio o la del
 *    agente). Una consulta nueva de alguien que ya tenía ficha vuelve a abrir
 *    la espera.
 *  - Hasta: el primer intento de contacto. Cuenta lo primero que pase de esto:
 *     · tocar WhatsApp, Llamar o Correo en el CRM (crm.js lo anota en el
 *       momento, sin que Rafael registre nada);
 *     · registrar una llamada, un WhatsApp, un correo o una visita;
 *     · mover la oportunidad a otra etapa.
 *  - En minutos hábiles (crm/src/horario.ts): lunes a sábado, 8 a 18 h.
 *
 * Los avisos los manda el cron de cada minuto del Worker (`vigilarSla`): uno a
 * los 10 minutos hábiles y otro a los 15. Sin nombres: el tipo, el canal y el
 * proyecto, y el enlace a la ficha. Una espera de más de dos horas hábiles no
 * avisa (el lead ya está atrasado y aparece arriba en «Hoy»): así, al encender
 * el SLA, los leads viejos no disparan una tanda de mensajes.
 */
import type { Avisar } from "./env";
import { cuandoSeCumplen, minutosHabiles, SLA } from "./horario";
import { nombreCanal } from "./canales";
import { nombreDeInteres } from "./datos";
import { horaCorta } from "./tiempo";

/** Más de esto, en minutos hábiles, ya no avisa: se marca y se sigue. */
export const SIN_AVISO_DESDE = 120;
/** Avisos por corrida del cron (uno por minuto): Telegram y el tope de 50 sentencias. */
const AVISOS_POR_CORRIDA = 5;

export type OpEspera = {
  id: number;
  creado_en: string;
  espera_desde: string | null;
  primer_intento_en: string | null;
};

/**
 * Lo que cambia cuando Rafael intenta el contacto: cierra la espera, anota el
 * primer intento (una sola vez, con sus minutos hábiles) y reinicia la
 * higiene. Las tareas de higiene abiertas se dan por hechas.
 */
export function sentenciasDeActividad(db: D1Database, op: OpEspera, ahora: Date, intento: boolean): D1PreparedStatement[] {
  const iso = ahora.toISOString();
  const st: D1PreparedStatement[] = [];
  if (intento && !op.primer_intento_en) {
    const minutos = op.espera_desde ? minutosHabiles(new Date(op.espera_desde), ahora) : null;
    st.push(
      db
        .prepare(
          `UPDATE crm_oportunidades SET primer_intento_en = ?, minutos_respuesta = ?
            WHERE id = ? AND primer_intento_en IS NULL`,
        )
        .bind(iso, minutos, op.id),
    );
  }
  st.push(
    db
      .prepare(
        `UPDATE crm_oportunidades
            SET ultima_actividad_en = ?, higiene_nivel = 0, higiene_en = NULL${intento ? ", espera_desde = NULL" : ""}
          WHERE id = ?`,
      )
      .bind(iso, op.id),
    db
      .prepare(
        `UPDATE crm_tareas SET hecha_en = ?
          WHERE oportunidad_id = ? AND hecha_en IS NULL AND regla LIKE 'higiene_%'`,
      )
      .bind(iso, op.id),
  );
  return st;
}

type Pendiente = {
  id: number;
  contacto_id: number;
  tipo: string;
  canal: string | null;
  interes: string | null;
  espera_desde: string;
  sla_aviso_en: string | null;
  sla_vencido_en: string | null;
};

/**
 * Lo que corre cada minuto: avisa por Telegram de los leads que llegaron a 10
 * o a 15 minutos hábiles sin respuesta. Devuelve cuántos avisos salieron.
 */
export async function vigilarSla(db: D1Database, avisar: Avisar, ruta: string, ahora = new Date()): Promise<number> {
  const r = await db
    .prepare(
      `SELECT o.id, o.contacto_id, o.tipo, o.canal, o.interes, o.espera_desde, o.sla_aviso_en, o.sla_vencido_en
         FROM crm_oportunidades o JOIN crm_contactos c ON c.id = o.contacto_id
        WHERE o.espera_desde IS NOT NULL AND o.cerrada = 0
          AND (o.sla_aviso_en IS NULL OR o.sla_vencido_en IS NULL)
          AND c.estado_datos != 'suprimido'
        ORDER BY o.espera_desde ASC LIMIT 20`,
    )
    .all<Pendiente>();
  let enviados = 0;
  const iso = ahora.toISOString();
  // Los atrasados de antes se marcan sin avisar, todos en una sola sentencia.
  const viejos = r.results.filter((p) => minutosHabiles(new Date(p.espera_desde), ahora) >= SIN_AVISO_DESDE).map((p) => p.id);
  if (viejos.length) {
    await db
      .prepare(
        `UPDATE crm_oportunidades SET sla_aviso_en = COALESCE(sla_aviso_en, ?1), sla_vencido_en = COALESCE(sla_vencido_en, ?1)
          WHERE id IN (${viejos.map((_, i) => `?${i + 2}`).join(", ")})`,
      )
      .bind(iso, ...viejos)
      .run();
  }
  for (const p of r.results) {
    if (viejos.includes(p.id)) continue;
    const desde = new Date(p.espera_desde);
    const minutos = minutosHabiles(desde, ahora);
    if (minutos < SLA.aviso) continue;
    if (enviados >= AVISOS_POR_CORRIDA) break;
    const vencido = minutos >= SLA.vence;
    if (vencido ? p.sla_vencido_en : p.sla_aviso_en) continue;
    const enlace = `https://rhfliving.com${ruta}/contacto/${p.contacto_id}`;
    const linea = [
      p.tipo === "venta" ? "Propietario" : "Comprador",
      nombreCanal(p.canal),
      p.interes ? nombreDeInteres(p.interes) : null,
    ]
      .filter(Boolean)
      .join(" · ");
    const texto = vencido
      ? [
          `🔴 <b>Se venció el SLA: ${minutos} minutos sin respuesta</b>`,
          esc(linea),
          `Llegó a las ${horaCorta(p.espera_desde)}.`,
          `<a href="${enlace}">Abrir la ficha</a>`,
        ]
      : [
          `⏱️ <b>Un lead espera respuesta hace ${minutos} minutos</b>`,
          esc(linea),
          `Los ${SLA.vence} minutos se cumplen a las ${horaCorta(cuandoSeCumplen(desde, SLA.vence).toISOString())}.`,
          `<a href="${enlace}">Abrir la ficha</a>`,
        ];
    const envio = await avisar(texto.join("\n"));
    if (!envio.ok) {
      // Telegram no respondió: el próximo minuto se reintenta.
      console.error(JSON.stringify({ sla: "aviso_fallido", motivo: envio.motivo }));
      break;
    }
    enviados++;
    await (vencido
      ? db
          .prepare(`UPDATE crm_oportunidades SET sla_vencido_en = ?, sla_aviso_en = COALESCE(sla_aviso_en, ?) WHERE id = ?`)
          .bind(iso, iso, p.id)
      : db.prepare(`UPDATE crm_oportunidades SET sla_aviso_en = ? WHERE id = ?`).bind(iso, p.id)
    ).run();
  }
  return enviados;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
