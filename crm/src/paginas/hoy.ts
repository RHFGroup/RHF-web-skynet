/**
 * Hoy: a quién escribirle primero (Prompt 3, §2.5), con el SLA y la higiene
 * del 7-oct-2026.
 *
 *  1. Esperan respuesta: la meta es 15 minutos hábiles (aviso a los 10).
 *  2. Tareas de hoy y atrasadas (también las que pone la higiene).
 *  3. Próximas acciones.
 *  4. Recorridos de esta semana.
 *  5. Para retomar: 7, 15 o 30 días sin actividad.
 *  6. Para reactivar: 60 días o más en «Nutrir».
 */
import { html, type Html } from "../html";
import type { Ctx } from "../base";
import { hoy, sumarDias, hace, fechaLocal, fechaLarga, horaCorta, fechaCorta, fechaDe } from "../tiempo";
import { nombreDeInteres, type Tipo } from "../datos";
import { minutosHabiles, SLA, enHorario } from "../horario";
import { nombreCanal } from "../canales";
import { pagina, vacio, chipSla, botonesContacto, iniciales, icono } from "./comun";

type Espera = {
  id: number;
  contacto_id: number;
  nombre: string | null;
  telefono: string | null;
  telefono_crudo: string | null;
  correo: string | null;
  tipo: Tipo;
  interes: string | null;
  canal: string | null;
  espera_desde: string;
};
type Tarea = { id: number; titulo: string; vence_en: string; contacto_id: number; nombre: string | null; origen: string };
type Recorrido = { id: number; recorrido_en: string; contacto_id: number; nombre: string | null; interes: string | null };
type Proxima = { id: number; proxima_accion: string | null; proxima_accion_en: string; contacto_id: number; nombre: string | null };
type Quieta = { id: number; contacto_id: number; nombre: string | null; etapa: string; tipo: Tipo; higiene_nivel: number; ultima_actividad_en: string };
type Reactivar = { id: number; contacto_id: number; nombre: string | null; etapa_desde: string };

export async function paginaHoy(c: Ctx, vistaPrevia: boolean): Promise<Html> {
  const ahora = new Date();
  const hoyLocal = hoy(ahora);
  const semana = sumarDias(hoyLocal, 7);
  const hace60 = new Date(ahora.getTime() - 60 * 86_400_000).toISOString();
  const hace24h = new Date(ahora.getTime() - 86_400_000).toISOString();

  const [esperan, tareas, recorridos, proximas, quietas, reactivar, chats] = await Promise.all([
    c.db
      .prepare(
        `SELECT o.id, o.contacto_id, c.nombre, c.telefono, c.telefono_crudo, c.correo, o.tipo, o.interes, o.canal, o.espera_desde
           FROM crm_oportunidades o JOIN crm_contactos c ON c.id = o.contacto_id
          WHERE o.espera_desde IS NOT NULL AND o.cerrada = 0 AND c.estado_datos != 'suprimido'
          ORDER BY o.espera_desde ASC LIMIT 30`,
      )
      .all<Espera>(),
    c.db
      .prepare(
        `SELECT t.id, t.titulo, t.vence_en, t.contacto_id, c.nombre, t.origen
           FROM crm_tareas t JOIN crm_contactos c ON c.id = t.contacto_id
          WHERE t.hecha_en IS NULL AND t.vence_en <= ? AND c.estado_datos != 'suprimido'
          ORDER BY t.vence_en ASC, t.id ASC LIMIT 50`,
      )
      .bind(hoyLocal)
      .all<Tarea>(),
    c.db
      .prepare(
        `SELECT o.id, o.recorrido_en, o.contacto_id, c.nombre, o.interes
           FROM crm_oportunidades o JOIN crm_contactos c ON c.id = o.contacto_id
          WHERE o.recorrido_en IS NOT NULL AND o.cerrada = 0
            AND substr(o.recorrido_en, 1, 10) BETWEEN ? AND ?
          ORDER BY o.recorrido_en ASC LIMIT 30`,
      )
      .bind(hoyLocal, semana)
      .all<Recorrido>(),
    c.db
      .prepare(
        `SELECT o.id, o.proxima_accion, o.proxima_accion_en, o.contacto_id, c.nombre
           FROM crm_oportunidades o JOIN crm_contactos c ON c.id = o.contacto_id
          WHERE o.cerrada = 0 AND o.proxima_accion_en IS NOT NULL AND o.proxima_accion_en <= ?
            AND c.estado_datos != 'suprimido'
          ORDER BY o.proxima_accion_en ASC LIMIT 30`,
      )
      .bind(hoyLocal)
      .all<Proxima>(),
    c.db
      .prepare(
        `SELECT o.id, o.contacto_id, c.nombre, o.etapa, o.tipo, o.higiene_nivel, o.ultima_actividad_en
           FROM crm_oportunidades o JOIN crm_contactos c ON c.id = o.contacto_id
          WHERE o.cerrada = 0 AND o.higiene_nivel > 0 AND o.etapa != 'nutrir' AND c.estado_datos != 'suprimido'
          ORDER BY o.higiene_nivel DESC, o.ultima_actividad_en ASC LIMIT 30`,
      )
      .all<Quieta>(),
    c.db
      .prepare(
        `SELECT o.id, o.contacto_id, c.nombre, o.etapa_desde
           FROM crm_oportunidades o JOIN crm_contactos c ON c.id = o.contacto_id
          WHERE o.etapa = 'nutrir' AND o.etapa_desde <= ? AND c.estado_datos != 'suprimido'
          ORDER BY o.etapa_desde ASC LIMIT 30`,
      )
      .bind(hace60)
      .all<Reactivar>(),
    c.db
      .prepare(
        `SELECT COUNT(*) AS n, SUM(CASE WHEN contacto_id IS NULL THEN 1 ELSE 0 END) AS sin_ficha
           FROM agente_conversaciones WHERE ultimo_en >= ?`,
      )
      .bind(hace24h)
      .first<{ n: number; sin_ficha: number | null }>(),
  ]);

  const nombre = (n: string | null) => n || "Sin nombre";
  const vencidos = esperan.results.filter((e) => minutosHabiles(new Date(e.espera_desde), ahora) >= SLA.vence).length;

  const bloqueEsperan = esperan.results.length
    ? html`<ol class="lista lista--tarjetas">${esperan.results.map((e) => {
        const minutos = minutosHabiles(new Date(e.espera_desde), ahora);
        return html`<li class="fila fila--lead">
  <span class="avatar" aria-hidden="true">${iniciales(e.nombre)}</span>
  <a class="fila-cuerpo" href="/contacto/${e.contacto_id}">
    <strong>${nombre(e.nombre)}</strong>
    <span class="meta">${e.tipo === "venta" ? "Propietario" : "Comprador"}${e.canal && e.canal !== "sin_dato" ? ` · ${nombreCanal(e.canal)}` : ""}${e.interes ? ` · ${nombreDeInteres(e.interes)}` : ""} · llegó ${fechaDe(e.espera_desde) === hoyLocal ? horaCorta(e.espera_desde) : fechaCorta(e.espera_desde)}</span>
    <span class="chips">${chipSla(minutos, e.espera_desde)}</span>
  </a>
  <span class="acciones-rapidas">${botonesContacto({ id: e.contacto_id, telefono: e.telefono, telefono_crudo: e.telefono_crudo, correo: e.correo }, { compacto: true })}</span>
</li>`;
      })}</ol>`
    : vacio("Nadie espera respuesta. Todos los leads tienen su primer contacto.");

  const bloqueTareas = tareas.results.length
    ? html`<ul class="lista">${tareas.results.map(
        (t) => html`<li class="fila fila--tarea">
  <a href="/contacto/${t.contacto_id}"><strong>${t.titulo}</strong>
  <span class="meta">${nombre(t.nombre)} · ${t.vence_en < hoyLocal ? html`<span class="vencida">venció ${fechaLocal(t.vence_en)}</span>` : "hoy"}${t.origen === "sistema" ? " · regla de higiene" : ""}</span></a>
  <form method="post" action="/tarea/${t.id}/hecha"><input type="hidden" name="volver" value="/hoy"><button class="boton-sec boton--chico" type="submit">Hecha</button></form>
</li>`,
      )}</ul>`
    : vacio("No hay tareas para hoy ni atrasadas.");

  const bloqueRecorridos = recorridos.results.length
    ? html`<ul class="lista">${recorridos.results.map(
        (r) => html`<li><a class="fila" href="/contacto/${r.contacto_id}">
  <strong>${fechaLocal(r.recorrido_en)}</strong>
  <span class="meta">${nombre(r.nombre)}${r.interes ? ` · ${nombreDeInteres(r.interes)}` : ""}</span>
</a></li>`,
      )}</ul>`
    : vacio("No hay recorridos agendados esta semana.");

  const bloqueProximas = proximas.results.length
    ? html`<ul class="lista">${proximas.results.map(
        (p) => html`<li><a class="fila" href="/contacto/${p.contacto_id}">
  <strong>${p.proxima_accion || "Próxima acción"}</strong>
  <span class="meta">${nombre(p.nombre)} · ${p.proxima_accion_en < hoyLocal ? html`<span class="vencida">era para ${fechaLocal(p.proxima_accion_en)}</span>` : "hoy"}</span>
</a></li>`,
      )}</ul>`
    : vacio("No hay próximas acciones para hoy.");

  const bloqueQuietas = quietas.results.length
    ? html`<ul class="lista">${quietas.results.map(
        (q) => html`<li><a class="fila" href="/contacto/${q.contacto_id}">
  <strong>${nombre(q.nombre)}</strong>
  <span class="meta">${q.tipo === "venta" ? "Propietario" : "Comprador"} · sin actividad ${hace(q.ultima_actividad_en)}</span>
  <span class="chips"><span class="chip estado estado--${q.higiene_nivel >= 15 ? "vencido" : "por_vencer"}">${icono("reloj")}${q.higiene_nivel} días quieto</span></span>
</a></li>`,
      )}</ul>`
    : vacio("Ningún lead lleva 7 días o más quieto.");

  const n = (x: number) => html`<b>${x}</b>`;
  const cuerpo = html`<div class="cabeza-pagina">
  <div>
    <h1 class="titulo">Hoy</h1>
    <p class="bajada">${fechaLocal(hoyLocal)}${enHorario(ahora) ? " · el reloj del SLA corre" : " · fuera del horario: el reloj del SLA está quieto"}</p>
  </div>
</div>
<div class="kpis kpis--hoy">
  <a href="#esperan" class="kpi${vencidos ? " kpi--alerta" : ""}"><span class="kpi-etiqueta">Esperan respuesta</span><span class="kpi-valor">${n(esperan.results.length)}</span><span class="kpi-nota">${vencidos ? `${vencidos} con el SLA vencido` : "meta: 15 min hábiles"}</span></a>
  <a href="#tareas" class="kpi"><span class="kpi-etiqueta">Tareas</span><span class="kpi-valor">${n(tareas.results.length)}</span><span class="kpi-nota">hoy y atrasadas</span></a>
  <a href="#recorridos" class="kpi"><span class="kpi-etiqueta">Recorridos</span><span class="kpi-valor">${n(recorridos.results.length)}</span><span class="kpi-nota">próximos 7 días</span></a>
  <a href="#retomar" class="kpi"><span class="kpi-etiqueta">Para retomar</span><span class="kpi-valor">${n(quietas.results.length)}</span><span class="kpi-nota">7 días o más quietos</span></a>
</div>
${chats && chats.n
  ? html`<a class="franja" href="/conversaciones">${icono("ia")}<span>La IA conversó con <b>${chats.n}</b> ${chats.n === 1 ? "persona" : "personas"} en las últimas 24 horas${
      chats.sin_ficha ? html` · ${chats.sin_ficha} sin ficha` : ""
    }</span>${icono("flecha")}</a>`
  : ""}
<section class="tarjeta" id="esperan" aria-labelledby="t-esperan">
  <h2 id="t-esperan"><span class="paso">1</span> Esperan respuesta</h2>
  <p class="nota">Responde en menos de 15 minutos hábiles (lunes a sábado, de 8 a. m. a 6 p. m.). A los 10 te llega un aviso por Telegram. Tocar WhatsApp o Llamar aquí ya cuenta como respuesta.</p>
  ${bloqueEsperan}
</section>
<div class="dos-columnas">
<section class="tarjeta" id="tareas" aria-labelledby="t-tareas">
  <h2 id="t-tareas"><span class="paso">2</span> Tareas de hoy y atrasadas</h2>
  ${bloqueTareas}
</section>
<section class="tarjeta" aria-labelledby="t-proximas">
  <h2 id="t-proximas"><span class="paso">3</span> Próximas acciones</h2>
  ${bloqueProximas}
</section>
<section class="tarjeta" id="recorridos" aria-labelledby="t-recorridos">
  <h2 id="t-recorridos"><span class="paso">4</span> Recorridos de esta semana</h2>
  ${bloqueRecorridos}
</section>
<section class="tarjeta" id="retomar" aria-labelledby="t-retomar">
  <h2 id="t-retomar"><span class="paso">5</span> Para retomar</h2>
  <p class="nota">Sin actividad ni nada programado: a los 7 días sale una tarea, a los 15 queda en riesgo y a los 30 el comprador pasa solo a «Nutrir».</p>
  ${bloqueQuietas}
</section>
</div>
${reactivar.results.length
  ? html`<section class="tarjeta" aria-labelledby="t-reactivar">
  <h2 id="t-reactivar"><span class="paso">6</span> Para reactivar</h2>
  <p class="nota">Llevan 60 días o más en «Nutrir».</p>
  <ul class="lista">${reactivar.results.map(
    (r) => html`<li><a class="fila" href="/contacto/${r.contacto_id}"><strong>${nombre(r.nombre)}</strong>
  <span class="meta">En Nutrir desde ${fechaLarga(r.etapa_desde)}</span></a></li>`,
  )}</ul>
</section>`
  : ""}`;

  return pagina({
    titulo: "Hoy",
    seccion: "hoy",
    cuerpo,
    url: c.url,
    vistaPrevia,
    accion: html`<a class="boton-barra" href="/nuevo">${icono("mas_uno")}<span>Lead</span></a>`,
  });
}
