/**
 * El tablero (7-oct-2026, pedido de Rafael): el control rígido del embudo y
 * las 5 métricas para auditar cada lunes si la inversión en anuncios de
 * YouTube y Meta se vuelve pipeline real. Las definiciones están en
 * crm/src/metricas.ts y, para Rafael, en «Cómo se calcula», al final.
 *
 * El filtro de arriba (período y tipo) manda sobre todo lo de abajo, salvo la
 * higiene, que es el estado de hoy. Por defecto, la semana pasada completa:
 * lo que se revisa el lunes.
 */
import { html, crudo, type Html } from "../html";
import type { Ctx } from "../base";
import { ETAPAS, FASES, type Tipo } from "../datos";
import { GRUPOS, CANALES_INVERSION } from "../canales";
import { duracion } from "../horario";
import {
  rangos,
  resumir,
  porCanal,
  embudo,
  semanasHasta,
  serieSemanal,
  leadsPorSemanaYGrupo,
  tramosRespuesta,
  TRAMOS_RESPUESTA,
  PERIODOS,
  type Fila,
  type Inversion,
  type Periodo,
  type Resumen,
} from "../metricas";
import { sparkline, barra, columnasApiladas, columnas, tablaDatos, numero, porcentaje } from "../graficas";
import { diaMes, nombreSemana, lunesDe, hoy, sumarDias } from "../tiempo";
import { pagina, pesosCortos, pesos, icono, vacio } from "./comun";

/**
 * Los puntos de partida de las tasas por fase, con su fuente (investigados el
 * 6-oct-2026; ver el informe). Solo se muestran los que tienen una fuente con
 * método publicado; donde no la hay, se dice.
 */
const REFERENCIAS: Record<string, { texto: string; fuente: string } | null> = {
  "0-1": null,
  "1-2": null,
  "0-2": { texto: "40 a 49 % (20 % en promedio)", fuente: "Do You Convert 2025–2026 y Bokka Group: constructoras de EE. UU." },
  "2-3": null,
  "2-4": { texto: "18 a 22 %", fuente: "Do You Convert 2025–2026 (cita → venta) y Bokka Group (20 %)" },
  "0-4": { texto: "1 a 4 %", fuente: "CINC (≈1 %, leads online de agentes) y Bokka Group (4 %, constructoras)" },
};

const FUENTES_REFERENCIA: { nombre: string; url: string; dice: string }[] = [
  {
    nombre: "Oldroyd y Elkington, Lead Response Management Study (MIT e InsideSales, 2007)",
    url: "https://www.mortech.com/hs-fs/hub/25649/file-13535879-pdf/docs/mit_study.pdf",
    dice: "Llamar a los 30 minutos en vez de a los 5 reduce 100 veces las probabilidades de contactar al lead y 21 veces las de calificarlo. Es correlacional y sin revisión por pares.",
  },
  {
    nombre: "Oldroyd, McElheran y Elkington, «The Short Life of Online Sales Leads», Harvard Business Review (marzo de 2011)",
    url: "https://hbr.org/2011/03/the-short-life-of-online-sales-leads",
    dice: "Intentar el contacto en la primera hora dio casi 7 veces más probabilidad de calificar que hacerlo una hora después (1,25 millones de leads de 42 empresas).",
  },
  {
    nombre: "Mike DelPrete, compras encubiertas a corredoras de EE. UU. (13-ago-2024)",
    url: "https://www.mikedp.com/articles/2024/8/13/secret-shopping-47-of-online-property-inquiries-are-ignored",
    dice: "El 47 % de las consultas por las webs quedó sin respuesta; mediana de 39 minutos y promedio de 8 h 17 min.",
  },
  {
    nombre: "Do You Convert, benchmarks de venta online de constructoras (Q2-2026)",
    url: "https://www.doyouconvert.com/blog/q2-2026-online-sales-benchmarks/",
    dice: "Lead → cita: 49 % (40 % en el Q2-2025). Cita → venta: 22 % (18 %).",
  },
  {
    nombre: "Bokka Group, tasas de conversión de constructoras (2017, actualizado en 2024)",
    url: "https://bokkagroup.com/articles/average-conversion-rates-home-builder-sales/",
    dice: "Lead → cita: 20 %. Cita o visita → contrato: 20 %. 25 leads por venta.",
  },
  {
    nombre: "CINC, 10 millones de leads online en 7 años (1-dic-2023)",
    url: "https://www.cincpro.com/blog/hunker-down-or-double-down-how-to-wisely-invest-in-online-real-estate-leads",
    dice: "Los leads online de agentes convierten cerca del 1 %; los mejores, entre 2,5 y 3 %.",
  },
  {
    nombre: "Camacol, Datos que construyen (14-oct-2025)",
    url: "https://camacol.co/sites/default/files/descargables/Datos%20que%20construyen%20-%2014oct2025.pdf",
    dice: "De enero a septiembre de 2025 hubo 28.933 desistimientos frente a 128.543 ventas de vivienda nueva: cerca del 22,5 % (cálculo propio). Es la única cifra colombiana del embudo que encontramos.",
  },
];

function delta(actual: number | null, anterior: number | null, opciones: { menosEsMejor?: boolean; formato?: (n: number) => string } = {}): Html {
  if (actual === null || anterior === null) return html`<span class="kpi-delta">sin comparación</span>`;
  const d = actual - anterior;
  if (d === 0) return html`<span class="kpi-delta">igual que el período anterior</span>`;
  const mejor = opciones.menosEsMejor ? d < 0 : d > 0;
  const f = opciones.formato ?? ((n: number) => numero(n));
  return html`<span class="kpi-delta kpi-delta--${mejor ? "bien" : "mal"}"><span aria-hidden="true">${d > 0 ? "▲" : "▼"}</span> ${f(Math.abs(d))} ${
    d > 0 ? "más" : "menos"
  } que el período anterior</span>`;
}

export async function paginaTablero(c: Ctx, vistaPrevia: boolean): Promise<Html> {
  const p = c.url.searchParams;
  const periodo = (PERIODOS.some((x) => x.id === p.get("periodo")) ? p.get("periodo") : "pasada") as Periodo;
  const tipoFiltro = p.get("tipo") === "venta" ? "venta" : p.get("tipo") === "todos" ? "todos" : "compra";
  const ahora = new Date();
  const { actual, anterior } = rangos(periodo, ahora);
  const semanas = semanasHasta(actual, 12);
  const desde = sumarDias(semanas[0], -7 * 12);

  const [filasR, inversionR, higieneR, estancadasR] = await Promise.all([
    c.db
      .prepare(
        `SELECT o.id, o.tipo, o.creado_en, o.canal, o.etapa, o.cerrada, o.puntaje, o.rango_presupuesto, o.pago, o.proposito,
                o.valor_estimado, o.interes, o.primer_intento_en, o.minutos_respuesta, o.espera_desde,
                o.fase_contactado_en, o.fase_presentacion_en, o.fase_cotizacion_en, o.fase_cierre_en
           FROM crm_oportunidades o JOIN crm_contactos c ON c.id = o.contacto_id
          WHERE c.estado_datos != 'suprimido' AND (?1 = 'todos' OR o.tipo = ?1)
            AND (o.creado_en >= ?2 OR o.fase_presentacion_en >= ?2 OR o.fase_cierre_en >= ?2)
          LIMIT 5000`,
      )
      .bind(tipoFiltro, `${desde}T05:00:00.000Z`)
      .all<Fila>(),
    c.db.prepare(`SELECT semana, canal, monto FROM crm_inversion WHERE semana >= ? ORDER BY semana`).bind(desde).all<Inversion>(),
    c.db
      .prepare(
        `SELECT o.higiene_nivel AS nivel, COUNT(*) AS n FROM crm_oportunidades o JOIN crm_contactos c ON c.id = o.contacto_id
          WHERE o.cerrada = 0 AND o.etapa != 'nutrir' AND c.estado_datos != 'suprimido' AND (?1 = 'todos' OR o.tipo = ?1)
          GROUP BY o.higiene_nivel`,
      )
      .bind(tipoFiltro)
      .all<{ nivel: number; n: number }>(),
    c.db
      .prepare(
        `SELECT o.tipo, o.etapa, o.etapa_desde, o.proxima_accion_en, o.recorrido_en, o.espera_desde
           FROM crm_oportunidades o JOIN crm_contactos c ON c.id = o.contacto_id
          WHERE o.cerrada = 0 AND o.etapa != 'nutrir' AND c.estado_datos != 'suprimido' AND (?1 = 'todos' OR o.tipo = ?1)
          LIMIT 2000`,
      )
      .bind(tipoFiltro)
      .all<{ tipo: Tipo; etapa: string; etapa_desde: string; proxima_accion_en: string | null; recorrido_en: string | null; espera_desde: string | null }>(),
  ]);

  const filas = filasR.results;
  const inversion = inversionR.results;
  const r = resumir(filas, inversion, actual);
  const a = resumir(filas, inversion, anterior);
  const serie = (f: (x: Resumen) => number | null) => serieSemanal(filas, inversion, semanas, f);

  const enlace = (cambios: Record<string, string>) => {
    const u = new URLSearchParams(p);
    for (const k of ["ok", "error", "semana"]) u.delete(k);
    for (const [k, v] of Object.entries(cambios)) v ? u.set(k, v) : u.delete(k);
    const s = u.toString();
    return s ? `/tablero?${s}` : "/tablero";
  };

  const nombrePeriodo = periodo === "pasada" || periodo === "semana"
    ? `semana del ${nombreSemana(actual.desde)}`
    : `${diaMes(actual.desde)} al ${diaMes(sumarDias(actual.hasta, -1))}`;

  // ── Los filtros ────────────────────────────────────────────────────────
  const filtros = html`<div class="filtros-fila">
  <nav class="segmentado" aria-label="Período">${PERIODOS.map(
    (x) => html`<a href="${enlace({ periodo: x.id === "pasada" ? "" : x.id })}"${periodo === x.id ? crudo(' aria-current="true"') : ""}>${x.nombre}</a>`,
  )}</nav>
  <nav class="segmentado" aria-label="Tipo">${[
    { id: "compra", nombre: "Compradores" },
    { id: "venta", nombre: "Propietarios" },
    { id: "todos", nombre: "Todos" },
  ].map((x) => html`<a href="${enlace({ tipo: x.id === "compra" ? "" : x.id })}"${tipoFiltro === x.id ? crudo(' aria-current="true"') : ""}>${x.nombre}</a>`)}</nav>
</div>`;

  // ── Las 5 métricas del lunes ──────────────────────────────────────────
  const estadoRespuesta = r.respuestaMediana === null ? null : r.respuestaMediana <= 5 ? "bueno" : r.respuestaMediana <= 15 ? "aviso" : "critico";
  const kpis = html`<section class="kpis kpis--cinco" aria-label="Las cinco métricas del lunes">
  <article class="kpi">
    <h2 class="kpi-etiqueta"><span class="kpi-numero">1</span> Leads nuevos</h2>
    <p class="kpi-valor">${numero(r.leads)}</p>
    ${delta(r.leads, a.leads)}
    ${sparkline(serie((x) => x.leads), "Leads nuevos por semana, últimas 12 semanas")}
    <p class="kpi-nota">${r.leadsAnuncios} de anuncios</p>
  </article>
  <article class="kpi">
    <h2 class="kpi-etiqueta"><span class="kpi-numero">2</span> Velocidad de respuesta</h2>
    <p class="kpi-valor">${r.respuestaMediana === null ? "—" : duracion(r.respuestaMediana)}</p>
    ${estadoRespuesta
      ? html`<span class="chip estado estado--${estadoRespuesta === "bueno" ? "a_tiempo" : estadoRespuesta === "aviso" ? "por_vencer" : "vencido"}">${icono(estadoRespuesta === "bueno" ? "ok" : "alerta")}${
          estadoRespuesta === "bueno" ? "Excelente: 5 min o menos" : estadoRespuesta === "aviso" ? "Dentro del SLA de 15 min" : "Fuera del SLA de 15 min"
        }</span>`
      : html`<span class="kpi-delta">sin respuestas medidas</span>`}
    ${sparkline(serie((x) => x.respuestaMediana), "Mediana de la respuesta por semana, en minutos hábiles")}
    <p class="kpi-nota">mediana · ${r.respuestasMedidas ? `${porcentaje(r.dentroSla, r.respuestasMedidas)} en 15 min` : "sin datos"}${r.sinRespuesta ? ` · ${r.sinRespuesta} sin respuesta` : ""}</p>
  </article>
  <article class="kpi">
    <h2 class="kpi-etiqueta"><span class="kpi-numero">3</span> Presentaciones</h2>
    <p class="kpi-valor">${numero(r.presentaciones)}</p>
    ${delta(r.presentaciones, a.presentaciones)}
    ${sparkline(serie((x) => x.presentaciones), "Presentaciones por semana")}
    <p class="kpi-nota">recorridos o Zoom agendados</p>
  </article>
  <article class="kpi">
    <h2 class="kpi-etiqueta"><span class="kpi-numero">4</span> Costo por lead calificado</h2>
    <p class="kpi-valor">${r.costoLeadCalificado !== null ? pesosCortos(r.costoLeadCalificado) : r.hayInversion ? "—" : html`<a href="#inversion">Falta la inversión</a>`}</p>
    ${r.costoLeadCalificado !== null ? delta(r.costoLeadCalificado, a.costoLeadCalificado, { menosEsMejor: true, formato: pesosCortos }) : html`<span class="kpi-delta">${r.hayInversion ? "sin leads calificados de anuncios" : "cárgala abajo, en pesos"}</span>`}
    ${sparkline(serie((x) => x.costoLeadCalificado), "Costo por lead calificado de anuncios, por semana")}
    <p class="kpi-nota">${r.hayInversion ? `${pesosCortos(r.inversionAnuncios)} en anuncios · ${r.calificadosAnuncios} de ${r.leadsAnuncios} calificados` : "anuncios de Meta, Google y YouTube"}</p>
  </article>
  <article class="kpi kpi--destacado">
    <h2 class="kpi-etiqueta"><span class="kpi-numero">5</span> Pipeline generado</h2>
    <p class="kpi-valor">${pesosCortos(r.pipeline)}</p>
    ${delta(r.pipeline, a.pipeline, { formato: pesosCortos })}
    ${sparkline(serie((x) => x.pipeline), "Pipeline generado por semana")}
    <p class="kpi-nota">${r.inversionAnuncios ? `$${numero(r.pipeline / r.inversionAnuncios)} de pipeline por cada $1 en anuncios` : "valor de lo que llegó a presentación"}${r.pipelineSinValor ? ` · ${r.pipelineSinValor} sin valor` : ""}</p>
  </article>
</section>`;

  // ── Por canal: ¿la inversión se vuelve pipeline? ─────────────────────
  const canales = porCanal(filas, inversion, actual).filter((f) => f.anuncios || f.leads || f.presentaciones || f.cierres);
  const maxLeads = Math.max(...canales.map((f) => f.leads), 1);
  const tablaCanal = html`<section class="tarjeta" aria-labelledby="t-canal">
  <h2 id="t-canal">¿La inversión se vuelve pipeline?</h2>
  <p class="nota">Por canal, ${nombrePeriodo}. Las presentaciones, el pipeline y los cierres cuentan lo que pasó en el período, venga de leads nuevos o de antes.</p>
  <div class="tabla-contenedor"><table class="tabla-datos tabla-canal">
    <thead><tr>
      <th scope="col">Canal</th><th scope="col" class="num">Inversión</th><th scope="col">Leads</th><th scope="col" class="num">Costo por lead</th>
      <th scope="col" class="num">Calificados</th><th scope="col" class="num">Respuesta</th><th scope="col" class="num">Presentaciones</th>
      <th scope="col" class="num">Costo por presentación</th><th scope="col" class="num">Pipeline</th><th scope="col" class="num">Cierres</th>
    </tr></thead>
    <tbody>${canales.map(
      (f) => html`<tr>
      <th scope="row"><i class="muestra serie--${f.grupo}" aria-hidden="true"></i>${f.nombre}</th>
      <td class="num" data-etiqueta="Inversión">${f.anuncios ? (f.inversion === null ? html`<span class="falta">sin cargar</span>` : pesosCortos(f.inversion)) : "—"}</td>
      <td class="celda-barra" data-etiqueta="Leads"><span class="num">${numero(f.leads)}</span>${barra(f.leads / maxLeads, `serie--${f.grupo}`)}</td>
      <td class="num" data-etiqueta="Costo por lead">${f.anuncios && f.inversion !== null && f.leads ? pesosCortos(f.inversion / f.leads) : "—"}</td>
      <td class="num" data-etiqueta="Calificados">${f.leads ? porcentaje(f.calificados, f.leads) : "—"}</td>
      <td class="num" data-etiqueta="Respuesta">${f.respuestaMediana === null ? "—" : duracion(f.respuestaMediana)}</td>
      <td class="num" data-etiqueta="Presentaciones">${numero(f.presentaciones)}</td>
      <td class="num" data-etiqueta="Costo por presentación">${f.anuncios && f.inversion !== null && f.presentaciones ? pesosCortos(f.inversion / f.presentaciones) : "—"}</td>
      <td class="num" data-etiqueta="Pipeline">${f.pipeline ? pesosCortos(f.pipeline) : "—"}</td>
      <td class="num" data-etiqueta="Cierres">${numero(f.cierres)}</td>
    </tr>`,
    )}</tbody>
  </table></div>
  ${canales.some((f) => f.grupo === "otros" && f.leads) ? html`<p class="nota">«Otros» incluye los leads sin dato de canal: los que llegaron antes del 7-oct-2026 o desde un navegador que no deja guardar la atribución.</p>` : ""}
</section>`;

  // ── El embudo de la cohorte ─────────────────────────────────────────
  const conteo = embudo(filas, actual);
  const fasesEmbudo = tipoFiltro === "venta"
    ? ["Lead entrante", "Contactado", "Visita al inmueble", "Consignado o en negociación", "Vendido"]
    : FASES.map((f) => f.nombre);
  const pasos = fasesEmbudo.map((nombre, i) => {
    const n = conteo[i];
    const ref = i > 0 ? REFERENCIAS[`${i - 1}-${i}`] : null;
    return html`<li class="embudo-fase">
  <div class="embudo-linea">
    <span class="embudo-nombre">${nombre}</span>
    <span class="embudo-cifra"><b>${numero(n)}</b>${i > 0 ? html` · ${porcentaje(n, conteo[0])} del total` : ""}</span>
  </div>
  ${barra(conteo[0] ? n / conteo[0] : 0, `fase--${i}`, `${nombre}: ${numero(n)}`)}
  ${i > 0
    ? html`<p class="embudo-paso">De ${fasesEmbudo[i - 1].toLowerCase()} a ${nombre.toLowerCase()}: <b>${porcentaje(n, conteo[i - 1])}</b>${
        ref ? html` · referencia ${ref.texto}` : ""
      }</p>`
    : ""}
</li>`;
  });
  const referenciasEmbudo = (["0-2", "2-4", "0-4"] as const).map((k) => {
    const [de, a2] = k.split("-").map(Number);
    const ref = REFERENCIAS[k]!;
    return html`<li><b>${fasesEmbudo[de]} → ${fasesEmbudo[a2].toLowerCase()}:</b> aquí ${porcentaje(conteo[a2], conteo[de])}; referencia ${ref.texto} <span class="meta">(${ref.fuente})</span></li>`;
  });
  const bloqueEmbudo = html`<section class="tarjeta" aria-labelledby="t-embudo">
  <h2 id="t-embudo">Embudo: de lead a cierre</h2>
  <p class="nota">De los ${numero(conteo[0])} leads que entraron en la ${nombrePeriodo}, cuántos llegaron a cada fase.${
    periodo === "semana" || periodo === "pasada" ? " Una semana es poco tiempo para avanzar: para leer las tasas, mira 12 semanas." : ""
  }</p>
  ${conteo[0] ? html`<ol class="embudo-fases">${pasos}</ol>` : vacio("No entraron leads en este período.")}
  ${tipoFiltro !== "venta" && conteo[0]
    ? html`<h3 class="subtitulo-chico">Contra las referencias publicadas</h3><ul class="referencias">${referenciasEmbudo}</ul>
<p class="nota">Son constructoras y corredoras de EE. UU.: sirven de punto de partida, no de meta. Para Colombia no hay tasas públicas de lead a separación; la única cifra local es la de desistimientos (cerca de 1 de cada 4 ventas en 2025, Camacol).</p>`
    : ""}
  ${tablaDatos("Embudo por fase", ["Fase", "Leads", "Del total", "Del paso anterior"], fasesEmbudo.map((nombre, i) => [
    nombre,
    numero(conteo[i]),
    porcentaje(conteo[i], conteo[0]),
    i ? porcentaje(conteo[i], conteo[i - 1]) : "—",
  ]))}
</section>`;

  // ── Leads por semana y canal ─────────────────────────────────────────
  const porSemana = leadsPorSemanaYGrupo(filas, semanas);
  const visibles = GRUPOS.filter((g) => porSemana.some((s) => s.grupos[g.id] > 0));
  const bloqueSemanas = html`<section class="tarjeta" aria-labelledby="t-semanas">
  <h2 id="t-semanas">Leads por semana y canal</h2>
  <p class="nota">Las 12 semanas que terminan en la ${nombreSemana(semanas[semanas.length - 1])}.</p>
  ${porSemana.some((s) => s.total)
    ? columnasApiladas({
        titulo: "Leads por semana, apilados por canal",
        columnas: porSemana.map((s) => ({
          etiqueta: diaMes(s.semana),
          destacada: periodo !== "12s" && s.semana >= actual.desde && s.semana < actual.hasta,
          tip: `Semana del ${nombreSemana(s.semana)}: ${s.total} leads${visibles.filter((g) => s.grupos[g.id]).map((g) => ` · ${g.nombre} ${s.grupos[g.id]}`).join("")}`,
          segmentos: visibles.map((g) => ({ clase: `serie--${g.id}`, valor: s.grupos[g.id], nombre: g.nombre })),
        })),
        leyenda: visibles.map((g) => ({ clase: `serie--${g.id}`, nombre: g.nombre })),
      })
    : vacio("Todavía no hay leads en estas 12 semanas.")}
  ${tablaDatos("Leads por semana y canal", ["Semana", ...visibles.map((g) => g.nombre), "Total"], porSemana.map((s) => [
    nombreSemana(s.semana),
    ...visibles.map((g) => numero(s.grupos[g.id])),
    numero(s.total),
  ]))}
</section>`;

  // ── La velocidad de respuesta ───────────────────────────────────────
  const tramos = tramosRespuesta(filas, actual);
  const clasesTramo: Record<string, string> = { bueno: "estado-relleno--bueno", aviso: "estado-relleno--aviso", serio: "estado-relleno--serio", critico: "estado-relleno--critico" };
  const datosTramos = [
    ...TRAMOS_RESPUESTA.map((t, i) => ({ etiqueta: t.nombre, valor: tramos.conteos[i], clase: clasesTramo[t.estado], tip: `${t.nombre}: ${tramos.conteos[i]} leads` })),
    { etiqueta: "Sin respuesta aún", valor: tramos.sinRespuesta, clase: "estado-relleno--critico", tip: `Sin respuesta aún: ${tramos.sinRespuesta} leads` },
  ];
  const bloqueRespuesta = html`<section class="tarjeta" aria-labelledby="t-respuesta">
  <h2 id="t-respuesta">Velocidad de respuesta</h2>
  <p class="nota">Minutos hábiles hasta el primer intento de contacto, de los leads de la ${nombrePeriodo}. El estudio del MIT (2007) encontró que responder a los 30 minutos en vez de a los 5 baja 100 veces las probabilidades de contactar.</p>
  ${datosTramos.some((d) => d.valor) ? columnas({ titulo: "Leads por tramo de tiempo de respuesta", datos: datosTramos }) : vacio("No hay respuestas medidas en este período.")}
  <ul class="leyenda"><li><i class="muestra estado-relleno--bueno" aria-hidden="true"></i>Dentro del SLA</li><li><i class="muestra estado-relleno--aviso" aria-hidden="true"></i>Hasta 1 h</li><li><i class="muestra estado-relleno--serio" aria-hidden="true"></i>Hasta 4 h</li><li><i class="muestra estado-relleno--critico" aria-hidden="true"></i>Más, o sin respuesta</li></ul>
  ${tablaDatos("Leads por tramo de respuesta", ["Tramo", "Leads"], datosTramos.map((d) => [d.etiqueta, numero(d.valor)]))}
</section>`;

  // ── La higiene, hoy ──────────────────────────────────────────────────
  const higiene = new Map(higieneR.results.map((f) => [f.nivel, f.n]));
  const hoyLocal = hoy(ahora);
  const estancadas = new Map<string, number>();
  for (const o of estancadasR.results) {
    const e = ETAPAS[o.tipo].find((x) => x.id === o.etapa);
    if (!e?.metaDias || o.espera_desde) continue;
    const dias = (ahora.getTime() - new Date(o.etapa_desde).getTime()) / 86_400_000;
    const programado = (o.proxima_accion_en ?? "") >= hoyLocal || (o.recorrido_en ?? "").slice(0, 10) >= hoyLocal;
    if (dias > e.metaDias && !programado) estancadas.set(`${o.tipo}:${e.id}`, (estancadas.get(`${o.tipo}:${e.id}`) ?? 0) + 1);
  }
  const listaEstancadas = [...estancadas.entries()].map(([k, n]) => {
    const [t, id] = k.split(":") as [Tipo, string];
    const e = ETAPAS[t].find((x) => x.id === id)!;
    return html`<li><span>${tipoFiltro === "todos" ? `${t === "compra" ? "Compra" : "Venta"} · ` : ""}${e.nombre}</span><b>${n}</b><span class="meta">más de ${e.metaDias} días sin moverse</span></li>`;
  });
  const bloqueHigiene = html`<section class="tarjeta" aria-labelledby="t-higiene">
  <h2 id="t-higiene">Higiene de la base, hoy</h2>
  <div class="kpis kpis--tres">
    ${[7, 15, 30].map(
      (nivel) => html`<a class="kpi kpi--chico" href="/hoy#retomar"><span class="kpi-etiqueta">${nivel} días sin actividad</span><span class="kpi-valor">${numero(higiene.get(nivel) ?? 0)}</span><span class="kpi-nota">${
        nivel === 7 ? "tarea para retomar" : nivel === 15 ? "en riesgo" : "propietarios por decidir"
      }</span></a>`,
    )}
  </div>
  <h3 class="subtitulo-chico">Estancadas por etapa</h3>
  ${listaEstancadas.length ? html`<ul class="lista-cifras">${listaEstancadas}</ul>` : vacio("Ninguna oportunidad pasa más tiempo del normal en su etapa.")}
  <p class="nota">Reglas: a los 7 días sin actividad ni nada programado sale una tarea; a los 15 queda en riesgo y sale en el resumen; a los 30 el comprador pasa solo a «Nutrir». Cualquier actividad reinicia la cuenta.</p>
</section>`;

  // ── La inversión de la semana ───────────────────────────────────────
  const semanaElegida = p.get("semana") && /^\d{4}-\d{2}-\d{2}$/.test(p.get("semana")!) ? lunesDe(p.get("semana")!) : actual.desde;
  const opcionesSemana = Array.from({ length: 10 }, (_, i) => sumarDias(lunesDe(hoyLocal), -7 * i));
  const montos = new Map(inversion.filter((i) => i.semana === semanaElegida).map((i) => [i.canal, i.monto]));
  const bloqueInversion = html`<section class="tarjeta" id="inversion" aria-labelledby="t-inversion">
  <h2 id="t-inversion">Inversión en anuncios</h2>
  <p class="nota">Cópiala cada lunes del administrador de anuncios de Meta y de Google Ads (YouTube va en Google Ads, en sus campañas de video). En pesos, lo gastado en la semana. Un 0 dice que esa semana no hubo pauta.</p>
  <form method="post" action="/inversion" class="rejilla">
    <label class="campo" for="inv-semana"><span>Semana</span>
    <select id="inv-semana" name="semana">${opcionesSemana.map(
      (s) => html`<option value="${s}"${s === semanaElegida ? crudo(" selected") : ""}>${nombreSemana(s)}</option>`,
    )}</select></label>
    ${CANALES_INVERSION.map(
      (k) => html`<label class="campo" for="inv-${k.id}"><span>${k.nombre}</span>
<input id="inv-${k.id}" name="monto_${k.id}" inputmode="numeric" maxlength="20" value="${montos.has(k.id) ? numero(montos.get(k.id)!) : ""}" placeholder="$ 0"></label>`,
    )}
    <div class="acciones"><button class="boton" type="submit">Guardar la inversión</button><span class="meta">${montos.size ? `Cargado: ${pesos([...montos.values()].reduce((n, x) => n + x, 0))}` : "Esta semana todavía no tiene inversión cargada."}</span></div>
  </form>
</section>`;

  // ── Cómo se calcula y de dónde salen las referencias ──────────────────
  const notas = html`<section class="tarjeta" aria-labelledby="t-calculo">
  <details>
  <summary id="t-calculo">Cómo se calcula cada cifra</summary>
  <dl class="definiciones">
    <dt>Leads nuevos</dt><dd>Oportunidades que se abrieron en el período: las del sitio, las del agente y las que cargas a mano. Si alguien escribe dos veces, cuenta una.</dd>
    <dt>Velocidad de respuesta</dt><dd>La mediana de los minutos hábiles (lunes a sábado, 8 a. m. a 6 p. m.) entre la consulta y el primer intento de contacto: tocar WhatsApp, Llamar o Correo en el CRM, registrar un contacto o mover la etapa. La mediana, no el promedio: un lead olvidado no esconde a los demás.</dd>
    <dt>Presentaciones</dt><dd>Oportunidades que llegaron por primera vez a «Recorrido agendado» (o más allá) en el período: el recorrido o el Zoom.</dd>
    <dt>Costo por lead calificado</dt><dd>La inversión en anuncios del período dividida por los leads de anuncios calificados: con presupuesto y forma de pago definidos en el formulario, o con puntaje A o B, o que ya llegaron a la presentación.</dd>
    <dt>Pipeline generado</dt><dd>La suma del valor de referencia de lo que llegó a la presentación en el período: el valor que anotes en la ficha; si no hay, el punto medio del rango de presupuesto; si tampoco, el del proyecto que le interesa. Es una estimación para comparar semanas, no una venta.</dd>
    <dt>Canal</dt><dd>Sale de la primera página que vio la persona: las etiquetas UTM y el identificador del clic del anuncio. Para que Meta Ads y YouTube Ads se separen bien, cada anuncio debe llevar utm_source (facebook, instagram o youtube) y utm_medium=paid.</dd>
  </dl>
  </details>
  <details>
  <summary>De dónde salen las referencias</summary>
  <ul class="fuentes">${FUENTES_REFERENCIA.map(
    (f) => html`<li><a href="${f.url}" target="_blank" rel="noopener noreferrer">${f.nombre}</a><span class="meta">${f.dice}</span></li>`,
  )}</ul>
  </details>
</section>`;

  const cuerpo = html`<div class="cabeza-pagina">
  <div>
    <h1 class="titulo">Tablero</h1>
    <p class="bajada">${tipoFiltro === "venta" ? "Propietarios" : tipoFiltro === "todos" ? "Compradores y propietarios" : "Compradores"} · ${nombrePeriodo}</p>
  </div>
</div>
${filtros}
${kpis}
${tablaCanal}
<div class="dos-columnas">
${bloqueEmbudo}
${bloqueRespuesta}
</div>
${bloqueSemanas}
<div class="dos-columnas">
${bloqueHigiene}
${bloqueInversion}
</div>
${notas}`;

  return pagina({ titulo: "Tablero", seccion: "tablero", url: c.url, vistaPrevia, ancho: true, cuerpo });
}
