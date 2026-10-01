/**
 * El boletín (Prompt 3, §2.5): una lista aparte, porque un suscriptor no es un
 * lead. Estado y fecha de cada uno, el contador de activos, la baja de quien
 * responde BAJA, las reactivaciones que esperan confirmación y la exportación
 * CSV de los activos.
 */
import { html, type Html } from "../html";
import { existeTabla, type Ctx } from "../base";
import { fechaCorta, fechaLarga } from "../tiempo";
import { pagina, selector, vacio } from "./comun";

type Fila = {
  id: number;
  correo: string;
  estado: string;
  creado_en: string;
  baja_en: string | null;
  origen: string | null;
  contacto_id: number | null;
};

type Pendiente = { id: number; correo: string; pedido_en: string; origen: string | null };

export async function paginaBoletin(c: Ctx, vistaPrevia: boolean): Promise<Html> {
  if (!(await existeTabla(c.db, "suscriptores"))) {
    return pagina({ titulo: "Boletín", seccion: "boletin", url: c.url, vistaPrevia, cuerpo: html`<h1 class="titulo">Boletín</h1>${vacio("Todavía no hay suscriptores.")}` });
  }
  const p = c.url.searchParams;
  const estado = p.get("estado") ?? "activa";
  const q = (p.get("q") ?? "").trim().toLowerCase().slice(0, 80);

  const condiciones: string[] = [];
  const valores: unknown[] = [];
  if (estado === "activa" || estado === "baja") {
    condiciones.push("s.estado = ?");
    valores.push(estado);
  }
  if (q) {
    condiciones.push("s.correo LIKE ? ESCAPE '\\'");
    valores.push(`%${q.replace(/[\\%_]/g, (x) => `\\${x}`)}%`);
  }
  const donde = condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "";

  const conEventos = await existeTabla(c.db, "suscripcion_eventos");
  const [conteo, filas, pendientes] = await Promise.all([
    c.db
      .prepare(`SELECT estado, COUNT(*) AS n FROM suscriptores GROUP BY estado`)
      .all<{ estado: string; n: number }>(),
    c.db
      .prepare(
        `SELECT s.id, s.correo, s.estado, s.creado_en, s.baja_en, s.origen,
                (SELECT id FROM crm_contactos WHERE correo = s.correo AND estado_datos != 'suprimido' LIMIT 1) AS contacto_id
           FROM suscriptores s ${donde}
          ORDER BY COALESCE(s.baja_en, s.creado_en) DESC LIMIT 200`,
      )
      .bind(...valores)
      .all<Fila>(),
    conEventos
      ? c.db
          .prepare(
            `SELECT s.id, s.correo, MAX(e.creado_en) AS pedido_en, e.origen
               FROM suscriptores s
               JOIN suscripcion_eventos e ON e.correo = s.correo AND e.tipo = 'reactivacion'
              WHERE s.estado = 'baja' AND (s.baja_en IS NULL OR e.creado_en > s.baja_en)
              GROUP BY s.id ORDER BY pedido_en DESC LIMIT 50`,
          )
          .all<Pendiente>()
      : Promise.resolve({ results: [] as Pendiente[] }),
  ]);

  const n = new Map(conteo.results.map((f) => [f.estado, f.n]));
  const activos = n.get("activa") ?? 0;

  const bloquePendientes = pendientes.results.length
    ? html`<section class="tarjeta" aria-labelledby="t-pendientes">
  <h2 id="t-pendientes">Pidieron volver a suscribirse</h2>
  <p class="nota">Estaban de baja y se volvieron a suscribir en el sitio. Antes de reactivarlos, confirma con la persona que fue ella.</p>
  <ul class="lista">${pendientes.results.map(
    (f) => html`<li class="fila fila--tarea"><span><strong>${f.correo}</strong>
  <span class="meta">Lo pidió el ${fechaCorta(f.pedido_en)}${f.origen ? ` desde ${f.origen}` : ""}</span></span>
  <form method="post" action="/boletin/${f.id}/reactivar"><button class="boton-sec" type="submit" data-confirmar="¿Confirmaste con la persona que quiere volver a recibir el boletín?">Reactivar</button></form></li>`,
  )}</ul>
</section>`
    : "";

  const lista = filas.results.length
    ? html`<ul class="lista">${filas.results.map(
        (f) => html`<li class="fila fila--tarea"><span>
  ${f.contacto_id ? html`<a href="/contacto/${f.contacto_id}"><strong>${f.correo}</strong></a>` : html`<strong>${f.correo}</strong>`}
  <span class="meta">${f.estado === "activa" ? `Activo desde ${fechaLarga(f.creado_en)}` : `De baja desde ${fechaLarga(f.baja_en)}`}${f.origen ? ` · ${f.origen}` : ""}${f.contacto_id ? " · también es lead" : ""}</span></span>
  ${f.estado === "activa"
    ? html`<form method="post" action="/boletin/${f.id}/baja"><button class="boton-sec" type="submit" data-confirmar="¿Dar de baja a ${f.correo}? Para volver tendría que suscribirse otra vez.">Dar de baja</button></form>`
    : ""}
</li>`,
      )}</ul>`
    : vacio(q ? "Ningún correo coincide." : estado === "baja" ? "Nadie se ha dado de baja." : "Todavía no hay suscriptores activos.");

  const cuerpo = html`<h1 class="titulo">Boletín</h1>
<div class="resumen">
  <span class="cifra"><b>${activos}</b><span>activos</span></span>
  <span class="cifra"><b>${n.get("baja") ?? 0}</b><span>de baja</span></span>
</div>
<p><a class="boton-sec" href="/boletin/activos.csv">Exportar los activos (CSV)</a></p>
${bloquePendientes}
<section class="tarjeta">
<form method="get" action="/boletin" class="rejilla">
  <label class="campo" for="q"><span>Buscar un correo</span><input id="q" name="q" type="search" value="${q}" maxlength="80"></label>
  ${selector("estado", "Mostrar", [
    { valor: "activa", texto: "Activos" },
    { valor: "baja", texto: "De baja" },
    { valor: "todas", texto: "Todos" },
  ], estado)}
  <div class="acciones"><button class="boton-sec" type="submit">Buscar</button></div>
</form>
${lista}
</section>
<p class="nota">Quien responde BAJA a un boletín se da de baja aquí, con «Dar de baja».</p>`;

  return pagina({ titulo: "Boletín", seccion: "boletin", url: c.url, vistaPrevia, cuerpo });
}
