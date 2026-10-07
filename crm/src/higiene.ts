/**
 * La higiene de la base (7-oct-2026, pedido de Rafael): identificar y
 * reclasificar solos los leads que quedan quietos 7, 15 y 30 días.
 *
 * Una oportunidad abierta está quieta cuando no tiene actividad (ni de Rafael
 * ni de la persona) y tampoco una próxima acción o un recorrido programados
 * para hoy o después: si Rafael dejó anotado «la llamo el 20», esperar no es
 * descuido. «Nutrir» tiene su propia regla (reactivar a los 60 días, en
 * «Hoy»), y lo que espera la primera respuesta lo cuida el SLA.
 *
 * Las reglas. Rafael trabaja solo por ahora («Solo tú, por ahora»), así que
 * reasignar es devolver el lead a su cola de «Hoy» con una tarea; con más
 * asesores, la misma regla lo pasaría a otro (ver el informe):
 *
 *   7 días   → tarea «Retomar» para hoy y el lead sube en «Hoy».
 *   15 días  → tarea «En riesgo: llamar o pasar a Nutrir»; sale en el resumen
 *              del día.
 *   30 días  → compradores: pasan solos a «Nutrir», con una línea en la ficha.
 *              Propietarios (no tienen «Nutrir»): tarea «Decidir si sigue».
 *
 * Cualquier actividad nueva (registrar algo, mover la etapa, tocar WhatsApp o
 * Llamar en el CRM, una consulta nueva de la persona) reinicia la cuenta y da
 * por hechas las tareas de higiene abiertas (crm/src/sla.ts).
 */
import { hoy } from "./tiempo";

export const NIVELES = [7, 15, 30] as const;
/**
 * Oportunidades por corrida: corre cada minuto, y el plan gratis de Workers
 * permite 50 sentencias por invocación (cada una usa 4).
 */
const POR_CORRIDA = 3;

const TITULOS: Record<number, string> = {
  7: "Retomar: 7 días sin actividad",
  15: "En riesgo: 15 días sin actividad. Llámalo o pásalo a Nutrir",
  30: "30 días sin actividad: decide si sigue o se descarta",
};

type Quieta = {
  id: number;
  contacto_id: number;
  tipo: string;
  etapa: string;
  ultima_actividad_en: string;
  higiene_nivel: number;
};

/** El nivel que le toca a una oportunidad quieta desde esa fecha (0, 7, 15 o 30). */
export function nivelDe(ultimaActividad: string, ahora: Date): number {
  const dias = (ahora.getTime() - new Date(ultimaActividad).getTime()) / 86_400_000;
  return [...NIVELES].reverse().find((n) => dias >= n) ?? 0;
}

/** Aplica las reglas a las oportunidades que subieron de nivel. Devuelve cuántas tocó. */
export async function aplicarHigiene(db: D1Database, ahora = new Date()): Promise<number> {
  const iso = ahora.toISOString();
  const hoyLocal = hoy(ahora);
  const hace = (dias: number) => new Date(ahora.getTime() - dias * 86_400_000).toISOString();
  const r = await db
    .prepare(
      `SELECT o.id, o.contacto_id, o.tipo, o.etapa, o.ultima_actividad_en, o.higiene_nivel
         FROM crm_oportunidades o JOIN crm_contactos c ON c.id = o.contacto_id
        WHERE o.cerrada = 0 AND o.etapa != 'nutrir' AND o.espera_desde IS NULL
          AND c.estado_datos != 'suprimido'
          AND o.ultima_actividad_en <= ?1
          AND (o.proxima_accion_en IS NULL OR o.proxima_accion_en < ?2)
          AND (o.recorrido_en IS NULL OR substr(o.recorrido_en, 1, 10) < ?2)
          AND o.higiene_nivel < CASE WHEN o.ultima_actividad_en <= ?3 THEN 30
                                     WHEN o.ultima_actividad_en <= ?4 THEN 15 ELSE 7 END
        ORDER BY o.ultima_actividad_en ASC LIMIT ?5`,
    )
    .bind(hace(7), hoyLocal, hace(30), hace(15), POR_CORRIDA)
    .all<Quieta>();

  for (const o of r.results) {
    const nivel = nivelDe(o.ultima_actividad_en, ahora);
    if (!nivel || nivel <= o.higiene_nivel) continue;
    const st: D1PreparedStatement[] = [
      db.prepare(`UPDATE crm_oportunidades SET higiene_nivel = ?, higiene_en = ? WHERE id = ?`).bind(nivel, iso, o.id),
    ];
    if (nivel === 30 && o.tipo === "compra") {
      st.push(
        db
          .prepare(`UPDATE crm_oportunidades SET etapa = 'nutrir', etapa_desde = ?, actualizado_en = ? WHERE id = ?`)
          .bind(iso, iso, o.id),
        db
          .prepare(
            `INSERT INTO crm_actividades (contacto_id, oportunidad_id, creado_en, tipo, texto, autor)
             VALUES (?, ?, ?, 'sistema', ?, 'sistema')`,
          )
          .bind(o.contacto_id, o.id, iso, "Pasó solo a Nutrir: 30 días sin actividad (regla de higiene)"),
        // Las tareas de higiene anteriores ya no aplican: el lead está en Nutrir.
        db
          .prepare(`UPDATE crm_tareas SET hecha_en = ? WHERE oportunidad_id = ? AND hecha_en IS NULL AND regla LIKE 'higiene_%'`)
          .bind(iso, o.id),
      );
    } else {
      st.push(
        // Una sola tarea de higiene abierta por oportunidad: la del nivel nuevo
        // reemplaza a la anterior.
        db
          .prepare(`UPDATE crm_tareas SET hecha_en = ? WHERE oportunidad_id = ? AND hecha_en IS NULL AND regla LIKE 'higiene_%'`)
          .bind(iso, o.id),
        db
          .prepare(
            `INSERT INTO crm_tareas (contacto_id, oportunidad_id, creado_en, titulo, vence_en, origen, regla)
             VALUES (?, ?, ?, ?, ?, 'sistema', ?)`,
          )
          .bind(o.contacto_id, o.id, iso, TITULOS[nivel], hoyLocal, `higiene_${nivel}`),
        db
          .prepare(
            `INSERT INTO crm_actividades (contacto_id, oportunidad_id, creado_en, tipo, texto, autor)
             VALUES (?, ?, ?, 'sistema', ?, 'sistema')`,
          )
          .bind(o.contacto_id, o.id, iso, `Higiene: ${nivel} días sin actividad`),
      );
    }
    await db.batch(st);
  }
  return r.results.length;
}

/** Para mostrar: cuántos días lleva quieta, o null si no aplica. */
export function diasQuieta(o: { ultima_actividad_en: string | null; cerrada: number; etapa: string }, ahora = new Date()): number | null {
  if (o.cerrada || o.etapa === "nutrir" || !o.ultima_actividad_en) return null;
  return Math.floor((ahora.getTime() - new Date(o.ultima_actividad_en).getTime()) / 86_400_000);
}

