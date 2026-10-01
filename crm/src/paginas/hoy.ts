/**
 * Hoy: a quién escribirle primero (Prompt 3, §2.5).
 */
import { html, type Html } from "../html";
import type { Ctx } from "../base";
import { hoy, sumarDias, hace, fechaLocal, fechaLarga } from "../tiempo";
import { nombreDeInteres, type Tipo } from "../datos";
import { pagina, vacio, nombreFuente } from "./comun";

type SinContactar = { id: number; nombre: string | null; creado_en: string; fuente: string; tipo: Tipo; interes: string | null };
type Tarea = { id: number; titulo: string; vence_en: string; contacto_id: number; nombre: string | null };
type Recorrido = { id: number; recorrido_en: string; contacto_id: number; nombre: string | null; interes: string | null };
type Proxima = { id: number; proxima_accion: string | null; proxima_accion_en: string; contacto_id: number; nombre: string | null };
type Reactivar = { id: number; contacto_id: number; nombre: string | null; etapa_desde: string };

export async function paginaHoy(c: Ctx, vistaPrevia: boolean): Promise<Html> {
  const hoyLocal = hoy();
  const semana = sumarDias(hoyLocal, 7);
  const hace60 = new Date(Date.now() - 60 * 86_400_000).toISOString();

  const [sin, tareas, recorridos, proximas, reactivar] = await Promise.all([
    c.db
      .prepare(
        `SELECT c.id, c.nombre, c.creado_en, c.fuente, o.tipo, o.interes
           FROM crm_contactos c
           JOIN crm_oportunidades o ON o.id = (
             SELECT id FROM crm_oportunidades
              WHERE contacto_id = c.id AND cerrada = 0 AND etapa = 'nuevo'
              ORDER BY id DESC LIMIT 1)
          WHERE c.estado_datos != 'suprimido' AND c.ultimo_contacto_en IS NULL
          ORDER BY c.creado_en ASC LIMIT 30`,
      )
      .all<SinContactar>(),
    c.db
      .prepare(
        `SELECT t.id, t.titulo, t.vence_en, t.contacto_id, c.nombre
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
        `SELECT o.id, o.contacto_id, c.nombre, o.etapa_desde
           FROM crm_oportunidades o JOIN crm_contactos c ON c.id = o.contacto_id
          WHERE o.etapa = 'nutrir' AND o.etapa_desde <= ? AND c.estado_datos != 'suprimido'
          ORDER BY o.etapa_desde ASC LIMIT 30`,
      )
      .bind(hace60)
      .all<Reactivar>(),
  ]);

  const nombre = (n: string | null) => n || "Sin nombre";

  const bloqueSin = sin.results.length
    ? html`<ol class="lista">${sin.results.map(
        (f) => html`<li><a class="fila" href="/contacto/${f.id}">
  <strong>${nombre(f.nombre)}</strong>
  <span class="meta">${nombreFuente(f.fuente)}${f.interes ? ` · ${nombreDeInteres(f.interes)}` : ""}${f.tipo === "venta" ? " · propietario" : ""}</span>
  <span class="espera">Espera desde ${hace(f.creado_en)}</span>
</a></li>`,
      )}</ol>`
    : vacio("Todos los leads nuevos ya tienen un primer contacto.");

  const bloqueTareas = tareas.results.length
    ? html`<ul class="lista">${tareas.results.map(
        (t) => html`<li class="fila fila--tarea">
  <a href="/contacto/${t.contacto_id}"><strong>${t.titulo}</strong>
  <span class="meta">${nombre(t.nombre)} · ${t.vence_en < hoyLocal ? html`<span class="vencida">venció ${fechaLocal(t.vence_en)}</span>` : "hoy"}</span></a>
  <form method="post" action="/tarea/${t.id}/hecha"><input type="hidden" name="volver" value="/hoy"><button class="boton-sec" type="submit">Hecha</button></form>
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

  const cuerpo = html`<h1 class="titulo">Hoy</h1>
<p class="bajada">${fechaLocal(hoyLocal)}</p>
<div class="resumen">
  <a href="#sin-contactar" class="cifra"><b>${sin.results.length}</b><span>sin contactar</span></a>
  <a href="#tareas" class="cifra"><b>${tareas.results.length}</b><span>tareas</span></a>
  <a href="#recorridos" class="cifra"><b>${recorridos.results.length}</b><span>recorridos</span></a>
</div>
<section class="tarjeta" id="sin-contactar" aria-labelledby="t-sin">
  <h2 id="t-sin"><span class="paso">1</span> Leads nuevos sin contactar</h2>
  <p class="nota">La meta es responder en menos de 5 minutos. Los que más esperan van primero.</p>
  ${bloqueSin}
</section>
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
${reactivar.results.length
  ? html`<section class="tarjeta" aria-labelledby="t-reactivar">
  <h2 id="t-reactivar"><span class="paso">5</span> Para reactivar</h2>
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
    accion: html`<a class="boton-barra" href="/nuevo">+ Lead</a>`,
  });
}
