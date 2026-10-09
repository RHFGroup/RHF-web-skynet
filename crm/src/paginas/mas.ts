/**
 * «Más»: alta manual, auditoría y sesiones.
 */
import { html, type Html } from "../html";
import type { Ctx } from "../base";
import { fechaCorta } from "../tiempo";
import { pagina, vacio } from "./comun";

const ACCIONES: Record<string, string> = {
  entrar: "Entró al CRM",
  salir: "Cerró la sesión",
  salir_de_todo: "Cerró todas las sesiones",
  ver: "Vio la ficha",
  crear: "Creó la ficha",
  editar: "Editó datos",
  nota: "Registró una actividad",
  tarea: "Creó una tarea",
  tarea_hecha: "Cerró una tarea",
  etapa: "Cambió la etapa",
  puntaje: "Cambió el puntaje",
  detalle: "Editó la oportunidad",
  oportunidad: "Creó una oportunidad",
  exportar: "Exportó los datos de la persona",
  reclamo: "Marcó reclamo en trámite",
  reclamo_cerrado: "Cerró el reclamo",
  suprimir: "Suprimió los datos de la persona",
  eliminar: "Eliminó el lead y todos sus datos",
  baja_boletin: "Dio de baja del boletín",
  reactivar_boletin: "Reactivó en el boletín",
  exportar_boletin: "Exportó los suscriptores activos",
  intento: "Tocó WhatsApp, Llamar o Correo",
  inversion: "Cargó la inversión en anuncios",
  ver_conversacion: "Vio una conversación con la IA",
};

export function paginaMas(c: Ctx, vistaPrevia: boolean): Html {
  return pagina({
    titulo: "Más",
    seccion: "mas",
    url: c.url,
    vistaPrevia,
    cuerpo: html`<h1 class="titulo">Más</h1>
<ul class="tarjetas tarjetas--rejilla">
  <li><a class="tarjeta lead" href="/nuevo"><span class="lead-nombre">Nuevo lead</span><span class="meta">Instagram, Facebook, ferias, referidos y llamadas</span></a></li>
  <li><a class="tarjeta lead" href="/leads"><span class="lead-nombre">Compradores en lista</span><span class="meta">Buscar y filtrar por etapa, puntaje, fuente o idioma</span></a></li>
  <li><a class="tarjeta lead" href="/propietarios"><span class="lead-nombre">Propietarios en lista</span><span class="meta">Quienes quieren vender o consignar</span></a></li>
  <li><a class="tarjeta lead" href="/boletin"><span class="lead-nombre">Boletín</span><span class="meta">Suscriptores, bajas y la exportación de los activos</span></a></li>
  <li><a class="tarjeta lead" href="/auditoria"><span class="lead-nombre">Auditoría</span><span class="meta">Quién vio, exportó, editó o suprimió qué, y cuándo</span></a></li>
</ul>
<section class="tarjeta">
  <h2>Sesión</h2>
  <form method="post" action="/salir"><button class="boton-sec" type="submit">Cerrar la sesión en este equipo</button></form>
  <form method="post" action="/salir/todo"><button class="boton-sec" type="submit" data-confirmar="¿Cerrar la sesión en todos los equipos? Vas a tener que volver a escribir la clave en cada uno.">Cerrar la sesión en todos los equipos</button></form>
</section>`,
  });
}

type Entrada = {
  id: number;
  creado_en: string;
  accion: string;
  entidad: string | null;
  entidad_id: number | null;
  detalle: string | null;
  /** 1 si la ficha todavía existe: las eliminadas no llevan enlace. */
  existe: number;
};

export async function paginaAuditoria(c: Ctx, vistaPrevia: boolean): Promise<Html> {
  const r = await c.db
    .prepare(
      `SELECT a.id, a.creado_en, a.accion, a.entidad, a.entidad_id, a.detalle, (c.id IS NOT NULL) AS existe
         FROM crm_auditoria a LEFT JOIN crm_contactos c ON a.entidad = 'contacto' AND c.id = a.entidad_id
        ORDER BY a.id DESC LIMIT 200`,
    )
    .all<Entrada>();
  const lista = r.results.length
    ? html`<ol class="lista">${r.results.map(
        (e) => html`<li class="fila"><span><strong>${ACCIONES[e.accion] ?? e.accion}</strong>${
          e.entidad === "contacto" && e.entidad_id
            ? e.existe
              ? html` · <a href="/contacto/${e.entidad_id}">ficha #${e.entidad_id}</a>`
              : ` · ficha #${e.entidad_id} (eliminada)`
            : ""
        }${e.entidad === "suscriptor" && e.entidad_id ? ` · suscriptor #${e.entidad_id}` : ""}
  <span class="meta">${fechaCorta(e.creado_en)}${e.detalle ? ` · ${e.detalle}` : ""}</span></span></li>`,
      )}</ol>`
    : vacio("Todavía no hay movimientos.");
  return pagina({
    titulo: "Auditoría",
    seccion: "mas",
    url: c.url,
    vistaPrevia,
    cuerpo: html`<h1 class="titulo">Auditoría</h1><p class="bajada">Los últimos 200 movimientos.</p><section class="tarjeta">${lista}</section>`,
  });
}
