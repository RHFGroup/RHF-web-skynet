/**
 * El resumen del día por Telegram, a las 7:30 a. m. de Colombia (Prompt 3,
 * §2.6). Solo cifras y el enlace: los nombres se ven al entrar.
 *
 * Desde el 7-oct-2026 trae también la espera de la primera respuesta, la
 * higiene y lo de ayer; y los lunes, las 5 métricas de la semana pasada para
 * auditar los anuncios (crm/src/metricas.ts).
 *
 * Lo dispara el cron «30 12 * * *» del Worker del sitio (worker/index.ts).
 */
import type { Avisar, Env } from "./env";
import { existeTabla, rutaCRM } from "./base";
import { hoy, sumarDias, nombreSemana, inicioDelDiaIso } from "./tiempo";
import { minutosHabiles, SLA, duracion } from "./horario";
import { rangos, resumir, mediana, type Fila, type Inversion } from "./metricas";

function pesosCortos(n: number): string {
  return n >= 1_000_000 ? `$${Math.round(n / 1_000_000).toLocaleString("es-CO")} M` : `$${Math.round(n).toLocaleString("es-CO")}`;
}

export async function mandarResumen(env: Env, avisar: Avisar, ahora = new Date()): Promise<void> {
  const db = env.DB;
  const ruta = rutaCRM(env);
  try {
    // Sin la ruta o sin las tablas, el CRM todavía no está en marcha: nada que contar.
    if (!ruta || !(await existeTabla(db, "crm_contactos"))) {
      console.log(JSON.stringify({ resumen: "sin_crm" }));
      return;
    }
    const conTablero = await existeTabla(db, "crm_inversion");
    const hoyLocal = hoy(ahora);
    const ayer = sumarDias(hoyLocal, -1);
    const [esperan, tareas, vencidas, recorridos, quietas, deAyer, chats] = await Promise.all([
      conTablero
        ? db
            .prepare(
              `SELECT o.espera_desde FROM crm_oportunidades o JOIN crm_contactos c ON c.id = o.contacto_id
                WHERE o.espera_desde IS NOT NULL AND o.cerrada = 0 AND c.estado_datos != 'suprimido'`,
            )
            .all<{ espera_desde: string }>()
        : db
            .prepare(
              `SELECT c.creado_en AS espera_desde FROM crm_contactos c
                 JOIN crm_oportunidades o ON o.contacto_id = c.id AND o.cerrada = 0 AND o.etapa = 'nuevo'
                WHERE c.estado_datos != 'suprimido' AND c.ultimo_contacto_en IS NULL`,
            )
            .all<{ espera_desde: string }>(),
      db.prepare(`SELECT COUNT(*) AS n FROM crm_tareas WHERE hecha_en IS NULL AND vence_en = ?`).bind(hoyLocal).first<{ n: number }>(),
      db.prepare(`SELECT COUNT(*) AS n FROM crm_tareas WHERE hecha_en IS NULL AND vence_en < ?`).bind(hoyLocal).first<{ n: number }>(),
      db
        .prepare(
          `SELECT COUNT(*) AS n FROM crm_oportunidades
            WHERE recorrido_en IS NOT NULL AND cerrada = 0 AND substr(recorrido_en, 1, 10) BETWEEN ? AND ?`,
        )
        .bind(hoyLocal, sumarDias(hoyLocal, 1))
        .first<{ n: number }>(),
      conTablero
        ? db
            .prepare(
              `SELECT SUM(CASE WHEN higiene_nivel >= 7 THEN 1 ELSE 0 END) AS n,
                      SUM(CASE WHEN higiene_nivel >= 15 THEN 1 ELSE 0 END) AS riesgo
                 FROM crm_oportunidades WHERE cerrada = 0 AND etapa != 'nutrir'`,
            )
            .first<{ n: number | null; riesgo: number | null }>()
        : Promise.resolve(null),
      conTablero
        ? db
            .prepare(
              `SELECT COUNT(*) AS n, GROUP_CONCAT(minutos_respuesta) AS minutos FROM crm_oportunidades
                WHERE creado_en >= ? AND creado_en < ?`,
            )
            .bind(inicioDelDiaIso(ayer), inicioDelDiaIso(hoyLocal))
            .first<{ n: number; minutos: string | null }>()
        : Promise.resolve(null),
      conTablero
        ? db
            .prepare(`SELECT COUNT(*) AS n FROM agente_conversaciones WHERE ultimo_en >= ? AND ultimo_en < ?`)
            .bind(inicioDelDiaIso(ayer), inicioDelDiaIso(hoyLocal))
            .first<{ n: number }>()
        : Promise.resolve(null),
    ]);

    const vencidos = esperan.results.filter((e) => minutosHabiles(new Date(e.espera_desde), ahora) >= SLA.vence).length;
    const minutosAyer = (deAyer?.minutos ?? "").split(",").filter(Boolean).map(Number);
    const medianaAyer = mediana(minutosAyer);
    const lineas = [
      "☀️ <b>Tu día en el CRM</b>",
      "",
      `• Esperan respuesta: <b>${esperan.results.length}</b>${vencidos ? ` (${vencidos} con el SLA vencido)` : ""}`,
      `• Tareas de hoy: <b>${tareas?.n ?? 0}</b>${(vencidas?.n ?? 0) > 0 ? ` (+${vencidas?.n} atrasadas)` : ""}`,
      `• Recorridos hoy y mañana: <b>${recorridos?.n ?? 0}</b>`,
      quietas?.n ? `• Para retomar: <b>${quietas.n}</b>${quietas.riesgo ? ` (${quietas.riesgo} en riesgo, 15 días o más)` : ""}` : null,
      deAyer
        ? `• Ayer: <b>${deAyer.n}</b> leads nuevos${medianaAyer !== null ? ` · primera respuesta en ${duracion(medianaAyer)} (mediana)` : ""}`
        : null,
      chats?.n ? `• La IA conversó con <b>${chats.n}</b> ${chats.n === 1 ? "persona" : "personas"} ayer` : null,
    ];

    // Los lunes: las 5 métricas de la semana pasada.
    if (conTablero && new Date(ahora.getTime() - 5 * 3600_000).getUTCDay() === 1) {
      const { actual, anterior } = rangos("pasada", ahora);
      const filas = await db
        .prepare(
          `SELECT o.id, o.tipo, o.creado_en, o.canal, o.etapa, o.cerrada, o.puntaje, o.rango_presupuesto, o.pago, o.proposito,
                  o.valor_estimado, o.interes, o.primer_intento_en, o.minutos_respuesta, o.espera_desde,
                  o.fase_contactado_en, o.fase_presentacion_en, o.fase_cotizacion_en, o.fase_cierre_en
             FROM crm_oportunidades o JOIN crm_contactos c ON c.id = o.contacto_id
            WHERE o.tipo = 'compra' AND c.estado_datos != 'suprimido'
              AND (o.creado_en >= ?1 OR o.fase_presentacion_en >= ?1 OR o.fase_cierre_en >= ?1)
            LIMIT 3000`,
        )
        .bind(anterior.ini)
        .all<Fila>();
      const inversion = await db.prepare(`SELECT semana, canal, monto FROM crm_inversion WHERE semana >= ?`).bind(anterior.desde).all<Inversion>();
      const r = resumir(filas.results, inversion.results, actual);
      const a = resumir(filas.results, inversion.results, anterior);
      const flecha = (x: number, y: number) => (x > y ? "▲" : x < y ? "▼" : "=");
      lineas.push(
        "",
        `📊 <b>Semana del ${nombreSemana(actual.desde)}</b> (compradores)`,
        `1. Leads nuevos: <b>${r.leads}</b> ${flecha(r.leads, a.leads)} (antes ${a.leads}) · ${r.leadsAnuncios} de anuncios`,
        `2. Respuesta: <b>${r.respuestaMediana === null ? "sin datos" : duracion(r.respuestaMediana)}</b> de mediana${
          r.respuestasMedidas ? ` · ${Math.round((r.dentroSla / r.respuestasMedidas) * 100)} % en 15 min` : ""
        }`,
        `3. Presentaciones: <b>${r.presentaciones}</b> ${flecha(r.presentaciones, a.presentaciones)} (antes ${a.presentaciones})`,
        `4. Costo por lead calificado: <b>${r.costoLeadCalificado !== null ? pesosCortos(r.costoLeadCalificado) : r.hayInversion ? "sin calificados" : "falta cargar la inversión"}</b>`,
        `5. Pipeline generado: <b>${pesosCortos(r.pipeline)}</b>${r.inversionAnuncios ? ` · ${(r.pipeline / r.inversionAnuncios).toFixed(1).replace(".", ",")} veces la inversión` : ""}`,
        `<a href="https://rhfliving.com${ruta}/tablero">Abrir el tablero</a>`,
      );
    }

    lineas.push("", `<a href="https://rhfliving.com${ruta}/hoy">Abrir el CRM</a>`);
    const r = await avisar(lineas.filter((l) => l !== null).join("\n"));
    console.log(JSON.stringify({ resumen: r.ok ? "enviado" : "fallo", motivo: r.ok ? undefined : r.motivo }));
  } catch (e) {
    console.error(JSON.stringify({ resumen: "error", detalle: e instanceof Error ? e.message.slice(0, 200) : "?" }));
  }
}
