/**
 * Lo del CRM que corre cada minuto en el cron del sitio (worker/index.ts,
 * desde el 7-oct-2026):
 *  1. trae al CRM las consultas nuevas, para que el SLA corra aunque nadie
 *     abra el CRM;
 *  2. en horario hábil, avisa por Telegram de los leads que llegan a 10 y a
 *     15 minutos hábiles sin respuesta (crm/src/sla.ts). Fuera de horario el
 *     reloj del SLA no corre, así que no hay nada que mirar;
 *  3. dos veces por hora, la higiene de 7, 15 y 30 días (crm/src/higiene.ts):
 *     cuenta días, y correrla cada minuto solo gastaba lecturas.
 *
 * Todo dentro del plan gratis: 50 sentencias de D1 por invocación (en los
 * minutos del vigía, cada 5, no se trae nada ni corre la higiene) y 5
 * millones de filas leídas al día para todo el sitio. Cada consulta de acá va
 * por un índice y mira solo lo reciente, para que el gasto no crezca con la
 * base.
 */
import type { Avisar, Env } from "./env";
import { existeTabla, rutaCRM } from "./base";
import { ingerir } from "./ingesta";
import { vigilarSla } from "./sla";
import { aplicarHigiene } from "./higiene";
import { enHorario } from "./horario";

/** Los minutos de cada hora (UTC) en que corre la higiene; ninguno es del vigía. */
export const MINUTOS_HIGIENE = [7, 37];

export async function trabajoDeCadaMinuto(env: Env, avisar: Avisar, ahora: Date, conVigia: boolean): Promise<void> {
  const db = env.DB;
  const ruta = rutaCRM(env);
  // Sin la ruta o sin la migración 0008, el CRM todavía no está en marcha.
  if (!ruta) return;
  try {
    if (!(await existeTabla(db, "crm_inversion"))) return;
    const leidas = conVigia ? 0 : await ingerir(db);
    const avisos = enHorario(ahora) ? await vigilarSla(db, avisar, ruta, ahora) : 0;
    const tocaHigiene = MINUTOS_HIGIENE.includes(ahora.getUTCMinutes());
    const higiene = tocaHigiene && !conVigia && leidas === 0 ? await aplicarHigiene(db, ahora) : 0;
    if (leidas || avisos || higiene) console.log(JSON.stringify({ crm_minuto: { leidas, avisos, higiene } }));
  } catch (e) {
    console.error(JSON.stringify({ crm_minuto: "error", detalle: e instanceof Error ? e.message.slice(0, 200) : "?" }));
  }
}
