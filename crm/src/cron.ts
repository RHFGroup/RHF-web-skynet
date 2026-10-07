/**
 * Lo del CRM que corre cada minuto en el cron del sitio (worker/index.ts,
 * desde el 7-oct-2026):
 *  1. trae al CRM las consultas nuevas, para que el SLA corra aunque nadie
 *     abra el CRM;
 *  2. avisa por Telegram de los leads que llegan a 10 y a 15 minutos hábiles
 *     sin respuesta (crm/src/sla.ts);
 *  3. aplica la higiene de 7, 15 y 30 días (crm/src/higiene.ts).
 *
 * El plan gratis de Workers permite 50 sentencias de D1 por invocación. En
 * los minutos en que también corre el vigía (cada 5), solo va el SLA; y la
 * higiene espera a un minuto en que no haya entrado nada.
 */
import type { Avisar, Env } from "./env";
import { existeTabla, rutaCRM } from "./base";
import { ingerir } from "./ingesta";
import { vigilarSla } from "./sla";
import { aplicarHigiene } from "./higiene";

export async function trabajoDeCadaMinuto(env: Env, avisar: Avisar, ahora: Date, conVigia: boolean): Promise<void> {
  const db = env.DB;
  const ruta = rutaCRM(env);
  // Sin la ruta o sin la migración 0008, el CRM todavía no está en marcha.
  if (!ruta) return;
  try {
    if (!(await existeTabla(db, "crm_inversion"))) return;
    const leidas = conVigia ? 0 : await ingerir(db);
    const avisos = await vigilarSla(db, avisar, ruta, ahora);
    const higiene = !conVigia && leidas === 0 ? await aplicarHigiene(db, ahora) : 0;
    if (leidas || avisos || higiene) console.log(JSON.stringify({ crm_minuto: { leidas, avisos, higiene } }));
  } catch (e) {
    console.error(JSON.stringify({ crm_minuto: "error", detalle: e instanceof Error ? e.message.slice(0, 200) : "?" }));
  }
}
