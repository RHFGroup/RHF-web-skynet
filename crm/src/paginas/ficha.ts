/**
 * La ficha de una persona (Prompt 3, §2.5 y §2.7): quién es, qué quiere, todo
 * lo que ha pasado, qué sigue, su autorización de datos y los botones de la
 * Ley 1581.
 */
import { html, type Html } from "../html";
import { auditar, existeTabla, type Ctx } from "../base";
import {
  ETAPAS,
  MOTIVOS_PERDIDA,
  PUNTAJES,
  PROPOSITOS,
  CANALES_AUTORIZACION,
  nombreDeInteres,
  CATALOGO,
  type Tipo,
} from "../datos";
import { fechaCorta, fechaLarga, fechaLocal, hace, hoy } from "../tiempo";
import { enlaceWhatsApp } from "../telefono";
import { pagina, chipEtapa, chipPuntaje, nombreFuente, selector, campo, areaTexto, vacio } from "./comun";

export type Contacto = {
  id: number;
  creado_en: string;
  actualizado_en: string;
  ultimo_contacto_en: string | null;
  nombre: string | null;
  telefono: string | null;
  telefono_crudo: string | null;
  correo: string | null;
  pais: string | null;
  ciudad: string | null;
  idioma: string | null;
  fuente: string;
  fuente_ultima: string | null;
  pagina_entrada: string | null;
  autorizacion_fecha: string | null;
  autorizacion_version: string | null;
  autorizacion_canal: string | null;
  autorizacion_evidencia: string | null;
  estado_datos: "normal" | "reclamo" | "suprimido";
};

export type Oportunidad = {
  id: number;
  contacto_id: number;
  creado_en: string;
  actualizado_en: string;
  tipo: Tipo;
  etapa: string;
  etapa_desde: string;
  motivo_perdida: string | null;
  puntaje: string;
  puntaje_motivo: string | null;
  interes: string | null;
  proposito: string | null;
  presupuesto: string | null;
  forma_pago: string | null;
  plazo: string | null;
  proxima_accion: string | null;
  proxima_accion_en: string | null;
  recorrido_en: string | null;
  unidad: string | null;
  separacion_en: string | null;
  cerrada: number;
};

type Actividad = { id: number; creado_en: string; tipo: string; texto: string | null; autor: string; consulta_id: number | null };
type Tarea = { id: number; titulo: string; vence_en: string; hecha_en: string | null; origen: string };
type Constancia = { id: number; creado_en: string; version_aviso: string; ip: string | null; origen: string | null; user_agent: string | null };

const TIPOS_ACTIVIDAD: Record<string, string> = {
  formulario: "Escribió por el sitio",
  agente: "Pidió una llamada al agente",
  nota: "Nota",
  llamada: "Llamada",
  whatsapp: "WhatsApp",
  correo: "Correo",
  visita: "Visita",
  etapa: "Cambio de etapa",
  puntaje: "Puntaje",
  datos: "Datos",
  sistema: "Sistema",
};

export async function paginaFicha(c: Ctx, id: number, vistaPrevia: boolean): Promise<Html | null> {
  const contacto = await c.db.prepare(`SELECT * FROM crm_contactos WHERE id = ?`).bind(id).first<Contacto>();
  if (!contacto) return null;

  const [ops, acts, tareas, constancias] = await Promise.all([
    c.db
      .prepare(`SELECT * FROM crm_oportunidades WHERE contacto_id = ? ORDER BY cerrada ASC, id DESC`)
      .bind(id)
      .all<Oportunidad>(),
    c.db
      .prepare(
        `SELECT id, creado_en, tipo, texto, autor, consulta_id FROM crm_actividades
          WHERE contacto_id = ? ORDER BY creado_en DESC, id DESC LIMIT 100`,
      )
      .bind(id)
      .all<Actividad>(),
    c.db
      .prepare(
        `SELECT id, titulo, vence_en, hecha_en, origen FROM crm_tareas
          WHERE contacto_id = ? ORDER BY (hecha_en IS NOT NULL), vence_en ASC, id ASC LIMIT 50`,
      )
      .bind(id)
      .all<Tarea>(),
    c.db
      .prepare(
        `SELECT q.id, q.creado_en, q.version_aviso, q.ip, q.origen, q.user_agent FROM consultas q
          WHERE q.id IN (SELECT consulta_id FROM crm_actividades WHERE contacto_id = ? AND consulta_id IS NOT NULL)
          ORDER BY q.id`,
      )
      .bind(id)
      .all<Constancia>(),
  ]);

  let boletin: { estado: string; creado_en: string; baja_en: string | null } | null = null;
  if (contacto.correo && (await existeTabla(c.db, "suscriptores"))) {
    boletin = await c.db
      .prepare(`SELECT estado, creado_en, baja_en FROM suscriptores WHERE correo = ?`)
      .bind(contacto.correo)
      .first();
  }

  // Quién vio qué (Prompt 3, §2.1).
  await auditar(c, "ver", "contacto", id);

  const titulo = contacto.nombre || "Sin nombre";
  if (contacto.estado_datos === "suprimido") {
    return pagina({
      titulo: "Datos suprimidos",
      seccion: null,
      url: c.url,
      vistaPrevia,
      cuerpo: html`<h1 class="titulo">Datos suprimidos</h1>
<section class="tarjeta"><p>Los datos personales de esta ficha se suprimieron por solicitud del titular. Queda solo el registro de la solicitud, en la auditoría.</p>
<p class="meta">Ficha #${contacto.id} · suprimida el ${fechaLarga(contacto.actualizado_en)}</p></section>`,
    });
  }

  const abiertas = ops.results.filter((o) => !o.cerrada);
  const wa = enlaceWhatsApp(contacto.telefono);
  const telefonoVisible = contacto.telefono ?? contacto.telefono_crudo;

  const cabecera = html`<section class="tarjeta ficha-cabecera">
  <h1>${titulo}</h1>
  <p class="chips">${abiertas.map((o) => html`${chipEtapa(o.tipo, o.etapa)}${o.tipo === "compra" ? chipPuntaje(o.puntaje) : ""}`)}${
    contacto.estado_datos === "reclamo" ? html`<span class="chip chip--alerta">Reclamo en trámite</span>` : ""
  }</p>
  <p class="meta">${nombreFuente(contacto.fuente)} · llegó ${hace(contacto.creado_en)}${
    contacto.ultimo_contacto_en ? ` · último contacto ${hace(contacto.ultimo_contacto_en)}` : " · sin contactar"
  }</p>
  <div class="botones-contacto">
    ${wa ? html`<a class="boton" href="${wa}" target="_blank" rel="noopener noreferrer">WhatsApp</a>` : ""}
    ${telefonoVisible ? html`<a class="boton-sec" href="tel:${contacto.telefono ?? telefonoVisible.replace(/[^\d+]/g, "")}">Llamar</a>` : ""}
    ${contacto.correo ? html`<a class="boton-sec" href="mailto:${contacto.correo}">Correo</a>` : ""}
  </div>
</section>`;

  const registrar = html`<section class="tarjeta" aria-labelledby="t-registrar">
  <h2 id="t-registrar">Registrar lo que hiciste</h2>
  <form method="post" action="/contacto/${id}/nota" class="rejilla">
    ${selector("tipo", "Qué fue", [
      { valor: "whatsapp", texto: "Le escribí por WhatsApp" },
      { valor: "llamada", texto: "Lo llamé" },
      { valor: "correo", texto: "Le mandé un correo" },
      { valor: "visita", texto: "Nos vimos (visita o recorrido)" },
      { valor: "nota", texto: "Solo una nota" },
    ], "whatsapp", { id: `tipo-nota-${id}` })}
    ${areaTexto("texto", "Detalle (opcional)", "", { max: 2000, id: `texto-nota-${id}` })}
    ${abiertas.length > 1
      ? selector("oportunidad", "De qué oportunidad", abiertas.map((o) => ({ valor: String(o.id), texto: o.tipo === "compra" ? "Compra" : "Venta" })), String(abiertas[0].id))
      : abiertas.length === 1
        ? html`<input type="hidden" name="oportunidad" value="${abiertas[0].id}">`
        : ""}
    <div class="acciones"><button class="boton" type="submit">Guardar</button></div>
  </form>
</section>`;

  const bloqueOps = ops.results.length
    ? ops.results.map((o) => bloqueOportunidad(o))
    : vacio("Todavía no tiene oportunidades.");

  const tiposConOp = new Set(abiertas.map((o) => o.tipo));
  const agregarOp = (["compra", "venta"] as Tipo[])
    .filter((t) => !tiposConOp.has(t))
    .map(
      (t) => html`<form method="post" action="/contacto/${id}/oportunidad" class="en-linea">
  <input type="hidden" name="tipo" value="${t}">
  <button class="boton-sec" type="submit">+ Oportunidad de ${t === "compra" ? "compra" : "venta o consignación"}</button>
</form>`,
    );

  const hoyLocal = hoy();
  const pendientes = tareas.results.filter((t) => !t.hecha_en);
  const hechas = tareas.results.filter((t) => t.hecha_en);
  const bloqueTareas = html`<section class="tarjeta" aria-labelledby="t-tareas">
  <h2 id="t-tareas">Tareas</h2>
  ${pendientes.length
    ? html`<ul class="lista">${pendientes.map(
        (t) => html`<li class="fila fila--tarea"><span><strong>${t.titulo}</strong>
  <span class="meta">${t.vence_en < hoyLocal ? html`<span class="vencida">venció ${fechaLocal(t.vence_en)}</span>` : t.vence_en === hoyLocal ? "hoy" : fechaLocal(t.vence_en)}</span></span>
  <form method="post" action="/tarea/${t.id}/hecha"><input type="hidden" name="volver" value="/contacto/${id}"><button class="boton-sec" type="submit">Hecha</button></form></li>`,
      )}</ul>`
    : vacio("No tiene tareas pendientes.")}
  <form method="post" action="/contacto/${id}/tarea" class="rejilla">
    ${campo("titulo", "Nueva tarea", "", { requerido: true, max: 200, id: `titulo-tarea-${id}` })}
    ${campo("vence_en", "Para cuándo", hoyLocal, { tipo: "date", requerido: true, id: `vence-tarea-${id}` })}
    ${abiertas.length === 1 ? html`<input type="hidden" name="oportunidad" value="${abiertas[0].id}">` : ""}
    <div class="acciones"><button class="boton-sec" type="submit">Crear tarea</button></div>
  </form>
  ${hechas.length ? html`<details><summary>Hechas (${hechas.length})</summary><ul class="lista lista--hechas">${hechas.map(
    (t) => html`<li><s>${t.titulo}</s> <span class="meta">${fechaCorta(t.hecha_en)}</span></li>`,
  )}</ul></details>` : ""}
</section>`;

  const linea = html`<section class="tarjeta" aria-labelledby="t-linea">
  <h2 id="t-linea">Línea de tiempo</h2>
  ${acts.results.length
    ? html`<ol class="linea">${acts.results.map(
        (a) => html`<li class="linea-item linea--${a.autor === "sitio" ? "sitio" : a.tipo}">
  <span class="meta">${TIPOS_ACTIVIDAD[a.tipo] ?? a.tipo} · ${fechaCorta(a.creado_en)}${a.autor === "sitio" ? " · llegó solo" : ""}</span>
  ${a.texto ? html`<p class="texto-libre">${a.texto}</p>` : ""}
</li>`,
      )}</ol>`
    : vacio("Todavía no hay nada registrado.")}
</section>`;

  const datos = html`<section class="tarjeta" aria-labelledby="t-datos">
  <details>
  <summary id="t-datos">Datos de contacto</summary>
  <form method="post" action="/contacto/${id}/datos" class="rejilla">
    ${campo("nombre", "Nombre", contacto.nombre, { max: 120, autocomplete: "off" })}
    ${campo("telefono", "Teléfono (con indicativo si no es de Colombia)", telefonoVisible, { tipo: "tel", max: 30, autocomplete: "off" })}
    ${campo("correo", "Correo", contacto.correo, { tipo: "email", max: 160, autocomplete: "off" })}
    ${campo("ciudad", "Ciudad", contacto.ciudad, { max: 80 })}
    ${campo("pais", "País", contacto.pais, { max: 80 })}
    ${selector("idioma", "Idioma", [{ valor: "es", texto: "Español" }, { valor: "en", texto: "Inglés" }], contacto.idioma ?? "es")}
    <div class="acciones"><button class="boton-sec" type="submit">Guardar datos</button></div>
  </form>
  <p class="meta">Página de entrada: ${contacto.pagina_entrada ?? "—"} · Última fuente: ${nombreFuente(contacto.fuente_ultima)}</p>
  </details>
</section>`;

  const autorizacion = html`<section class="tarjeta" aria-labelledby="t-autorizacion">
  <h2 id="t-autorizacion">Autorización de datos</h2>
  ${constancias.results.length
    ? html`<ul class="lista">${constancias.results.map(
        (q) => html`<li class="constancia"><strong>Consulta #${q.id} · ${fechaCorta(q.creado_en)}</strong>
  <span class="meta">Texto aceptado: versión ${q.version_aviso} · página ${q.origen ?? "—"}${q.ip ? ` · IP ${q.ip}` : ""}</span></li>`,
      )}</ul>`
    : ""}
  ${contacto.autorizacion_canal && !constancias.results.length
    ? html`<p><strong>${CANALES_AUTORIZACION[contacto.autorizacion_canal] ?? contacto.autorizacion_canal}</strong> · ${contacto.autorizacion_fecha ? fechaLocal(contacto.autorizacion_fecha.slice(0, 10)) : ""}</p>
<p class="texto-libre">${contacto.autorizacion_evidencia ?? ""}</p>`
    : ""}
  ${!constancias.results.length && !contacto.autorizacion_canal ? vacio("No hay constancia registrada.") : ""}
  ${boletin ? html`<p class="meta">Boletín: ${boletin.estado === "activa" ? `suscrito desde ${fechaLarga(boletin.creado_en)}` : `de baja desde ${fechaLarga(boletin.baja_en)}`}</p>` : ""}
</section>`;

  const proteccion = html`<section class="tarjeta" aria-labelledby="t-proteccion">
  <details>
  <summary id="t-proteccion">Protección de datos (Ley 1581)</summary>
  <p>Para responder una consulta, un reclamo o una solicitud de supresión del titular.</p>
  <p><a class="boton-sec" href="/contacto/${id}/exportar">Exportar sus datos</a></p>
  <form method="post" action="/contacto/${id}/reclamo">
    <input type="hidden" name="estado" value="${contacto.estado_datos === "reclamo" ? "normal" : "reclamo"}">
    <button class="boton-sec" type="submit">${contacto.estado_datos === "reclamo" ? "Cerrar el reclamo en trámite" : "Marcar reclamo en trámite"}</button>
  </form>
  <form method="post" action="/contacto/${id}/suprimir" class="zona-peligro rejilla">
    <h3>Suprimir sus datos</h3>
    <p>Borra el nombre, el teléfono, el correo y lo que escribió, aquí y en el buzón del sitio. Queda solo el registro de la solicitud. No se puede deshacer.</p>
    ${campo("confirmacion", `Para confirmar, escribe: ${contacto.nombre || "SUPRIMIR"}`, "", { requerido: true, max: 120, autocomplete: "off", id: `confirmar-${id}` })}
    <div class="acciones"><button class="boton-peligro" type="submit">Suprimir sus datos</button></div>
  </form>
  </details>
</section>`;

  return pagina({
    titulo,
    seccion: abiertas[0]?.tipo ?? ops.results[0]?.tipo ?? "compra",
    url: c.url,
    vistaPrevia,
    cuerpo: html`${cabecera}${registrar}<h2 class="subtitulo">Oportunidades</h2>${bloqueOps}${agregarOp}${bloqueTareas}${linea}${datos}${autorizacion}${proteccion}`,
  });
}

function bloqueOportunidad(o: Oportunidad): Html {
  const etapas = ETAPAS[o.tipo];
  const cerrada = Boolean(o.cerrada);
  const opcionesInteres = CATALOGO.map((x) => ({ valor: x.slug, texto: x.nombre }));
  const interesLibre = o.interes && !CATALOGO.some((x) => x.slug === o.interes) ? o.interes : "";
  return html`<section class="tarjeta oportunidad${cerrada ? " oportunidad--cerrada" : ""}" aria-label="Oportunidad de ${o.tipo}">
  <h3>${o.tipo === "compra" ? "Compra" : "Venta o consignación"} ${chipEtapa(o.tipo, o.etapa)}${o.tipo === "compra" ? chipPuntaje(o.puntaje) : ""}</h3>
  <p class="meta">En esta etapa desde ${fechaLarga(o.etapa_desde)}${o.motivo_perdida ? ` · motivo: ${o.motivo_perdida}` : ""}${
    o.interes ? ` · interés: ${nombreDeInteres(o.interes)}` : ""
  }</p>
  ${o.proxima_accion || o.proxima_accion_en
    ? html`<p class="proxima"><strong>Próxima acción:</strong> ${o.proxima_accion ?? ""}${o.proxima_accion_en ? ` · ${fechaLocal(o.proxima_accion_en)}` : ""}</p>`
    : ""}
  ${o.recorrido_en ? html`<p class="proxima"><strong>Recorrido:</strong> ${fechaLocal(o.recorrido_en)}${o.unidad ? ` · unidad ${o.unidad}` : ""}</p>` : ""}

  <form method="post" action="/oportunidad/${o.id}/etapa" class="rejilla">
    <div data-etapas-con-motivo="${etapas.filter((e) => e.pideMotivo).map((e) => e.id).join(",")}">
    ${selector("etapa", "Etapa", etapas.map((e, i) => ({ valor: e.id, texto: `${i + 1}. ${e.nombre}` })), o.etapa, { id: `etapa-${o.id}` })}
    ${selector("motivo", "Motivo", MOTIVOS_PERDIDA.map((m) => ({ valor: m, texto: m })), o.motivo_perdida, { vacio: "—", id: `motivo-${o.id}` })}
    </div>
    <div class="acciones"><button class="boton-sec" type="submit">Cambiar etapa</button></div>
  </form>

  ${o.tipo === "compra"
    ? html`<form method="post" action="/oportunidad/${o.id}/puntaje" class="rejilla">
    ${selector("puntaje", "Puntaje", PUNTAJES.map((x) => ({ valor: x.id, texto: `${x.nombre} — ${x.ayuda}` })), o.puntaje, { id: `puntaje-${o.id}` })}
    ${campo("motivo", "Por qué (obligatorio)", "", { requerido: true, max: 300, id: `motivo-puntaje-${o.id}` })}
    <div class="acciones"><button class="boton-sec" type="submit">Cambiar puntaje</button></div>
  </form>`
    : ""}

  <details>
  <summary>Detalle, próxima acción y recorrido</summary>
  <form method="post" action="/oportunidad/${o.id}/detalle" class="rejilla">
    ${selector("interes", "Proyecto o inmueble", opcionesInteres, CATALOGO.some((x) => x.slug === o.interes) ? o.interes : "", { vacio: "—", id: `interes-${o.id}` })}
    ${campo("interes_otro", "Otro interés (texto)", interesLibre, { max: 160, id: `interes-otro-${o.id}` })}
    ${o.tipo === "compra"
      ? selector("proposito", "Para qué compra", Object.entries(PROPOSITOS).map(([valor, texto]) => ({ valor, texto })), o.proposito, { vacio: "—", id: `proposito-${o.id}` })
      : ""}
    ${campo("presupuesto", o.tipo === "compra" ? "Presupuesto" : "Precio esperado", o.presupuesto, { max: 80, id: `presupuesto-${o.id}` })}
    ${o.tipo === "compra" ? campo("forma_pago", "Forma de pago", o.forma_pago, { max: 120, id: `forma-${o.id}` }) : ""}
    ${campo("plazo", o.tipo === "compra" ? "Plazo para comprar" : "Cuándo quiere vender", o.plazo, { max: 80, id: `plazo-${o.id}` })}
    ${campo("proxima_accion", "Próxima acción", o.proxima_accion, { max: 200, id: `proxima-${o.id}` })}
    ${campo("proxima_accion_en", "Fecha de la próxima acción", o.proxima_accion_en, { tipo: "date", id: `proxima-en-${o.id}` })}
    ${campo("recorrido_en", o.tipo === "compra" ? "Recorrido (fecha y hora)" : "Visita al inmueble (fecha y hora)", o.recorrido_en, { tipo: "datetime-local", id: `recorrido-${o.id}` })}
    ${o.tipo === "compra" ? campo("unidad", "Unidad", o.unidad, { max: 80, id: `unidad-${o.id}` }) : ""}
    ${o.tipo === "compra" ? campo("separacion_en", "Fecha de separación", o.separacion_en, { tipo: "date", id: `separacion-${o.id}` }) : ""}
    <div class="acciones"><button class="boton-sec" type="submit">Guardar detalle</button></div>
  </form>
  </details>
</section>`;
}
