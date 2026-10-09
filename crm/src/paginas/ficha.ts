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
import { leerAtribucion, nombreCanal } from "../canales";
import { minutosHabiles, duracion } from "../horario";
import { valorDe } from "../valor";
import {
  RANGOS_PRESUPUESTO,
  FORMAS_PAGO,
  NO_SE,
  nombreDe,
  respuestasDefinidas,
} from "@/data/calificacion";
import { burbujas } from "./conversaciones";
import { nombreCanalAgente } from "../conversaciones";
import {
  pagina,
  chipEtapa,
  chipPuntaje,
  chipCanal,
  chipSla,
  botonesContacto,
  iniciales,
  icono,
  nombreFuente,
  selector,
  campo,
  areaTexto,
  vacio,
  pesos,
  pesosCortos,
} from "./comun";

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
  utm_primero: string | null;
  utm_ultimo: string | null;
  gclid: string | null;
  fbclid: string | null;
  canal: string | null;
  canal_ultimo: string | null;
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
  canal: string | null;
  rango_presupuesto: string | null;
  pago: string | null;
  valor_estimado: number | null;
  espera_desde: string | null;
  sla_aviso_en: string | null;
  sla_vencido_en: string | null;
  primer_intento_en: string | null;
  minutos_respuesta: number | null;
  ultima_actividad_en: string | null;
  higiene_nivel: number;
  higiene_en: string | null;
  fase_contactado_en: string | null;
  fase_presentacion_en: string | null;
  fase_cotizacion_en: string | null;
  fase_cierre_en: string | null;
};

type Actividad = { id: number; creado_en: string; tipo: string; texto: string | null; autor: string; consulta_id: number | null };
type Tarea = { id: number; titulo: string; vence_en: string; hecha_en: string | null; origen: string };
type Constancia = { id: number; creado_en: string; version_aviso: string; ip: string | null; origen: string | null; user_agent: string | null };

const TIPOS_ACTIVIDAD: Record<string, string> = {
  formulario: "Escribió por el sitio",
  agente: "Pidió una llamada al agente",
  intento: "Intento de contacto",
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

  const [ops, acts, tareas, constancias, conversaciones] = await Promise.all([
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
        `SELECT q.id, q.creado_en, q.version_aviso, q.ip, q.origen, q.user_agent, q.atribucion FROM consultas q
          WHERE q.id IN (SELECT consulta_id FROM crm_actividades WHERE contacto_id = ? AND consulta_id IS NOT NULL)
          ORDER BY q.id`,
      )
      .bind(id)
      .all<Constancia & { atribucion: string | null }>(),
    c.db
      .prepare(
        `SELECT id, canal, iniciada_en, ultimo_en, mensajes FROM agente_conversaciones
          WHERE contacto_id = ?1 OR (?2 IS NOT NULL AND telefono = ?2)
          ORDER BY ultimo_en DESC LIMIT 5`,
      )
      .bind(id, contacto.telefono)
      .all<{ id: number; canal: string; iniciada_en: string; ultimo_en: string; mensajes: number }>(),
  ]);

  // La conversación más reciente con la IA, entera (hasta 60 mensajes).
  const ultimaConversacion = conversaciones.results[0];
  const mensajes = ultimaConversacion
    ? await c.db
        .prepare(
          `SELECT id, rol, texto, en FROM (
             SELECT id, rol, texto, en FROM agente_mensajes WHERE conversacion_id = ? ORDER BY en DESC, id DESC LIMIT 60
           ) ORDER BY en ASC, id ASC`,
        )
        .bind(ultimaConversacion.id)
        .all<{ id: number; rol: "persona" | "agente"; texto: string; en: string }>()
    : null;

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

  const ahora = new Date();
  const abiertas = ops.results.filter((o) => !o.cerrada);
  const principal = abiertas[0] ?? ops.results[0];
  const telefonoVisible = contacto.telefono ?? contacto.telefono_crudo;
  const esperando = abiertas.find((o) => o.espera_desde);
  const minutosEspera = esperando?.espera_desde ? minutosHabiles(new Date(esperando.espera_desde), ahora) : null;

  const cabecera = html`<section class="tarjeta ficha-cabecera">
  <div class="ficha-identidad">
    <span class="avatar avatar--grande" aria-hidden="true">${iniciales(contacto.nombre)}</span>
    <div>
      <h1>${titulo}</h1>
      <p class="meta">${[telefonoVisible, contacto.correo, contacto.ciudad].filter(Boolean).join(" · ")}</p>
    </div>
  </div>
  <p class="chips">${abiertas.map((o) => html`${chipEtapa(o.tipo, o.etapa)}${o.tipo === "compra" && o.puntaje !== "sin" ? chipPuntaje(o.puntaje) : ""}`)}${chipCanal(contacto.canal)}${
    minutosEspera !== null ? chipSla(minutosEspera, esperando?.espera_desde) : ""
  }${contacto.estado_datos === "reclamo" ? html`<span class="chip chip--alerta">Reclamo en trámite</span>` : ""}</p>
  <p class="meta">${nombreFuente(contacto.fuente)} · llegó ${hace(contacto.creado_en)}${
    contacto.ultimo_contacto_en ? ` · último contacto ${hace(contacto.ultimo_contacto_en)}` : " · sin contactar"
  }${principal?.minutos_respuesta !== null && principal?.minutos_respuesta !== undefined ? ` · primera respuesta en ${duracion(principal.minutos_respuesta)} hábiles` : ""}</p>
  <div class="botones-contacto">${botonesContacto(contacto)}</div>
</section>`;

  // ── Calificación y origen ──────────────────────────────────────────────
  const compra = abiertas.find((o) => o.tipo === "compra") ?? ops.results.find((o) => o.tipo === "compra");
  const dato = (etiqueta: string, valor: string | Html | null | undefined, ayuda?: string) =>
    html`<div class="dato"><dt>${etiqueta}</dt><dd>${valor || html`<span class="falta">Sin dato</span>`}${ayuda ? html`<small>${ayuda}</small>` : ""}</dd></div>`;
  const calificacion = compra
    ? (() => {
        const n = respuestasDefinidas({ presupuesto: compra.rango_presupuesto, pago: compra.pago, objetivo: compra.proposito });
        const v = valorDe(compra);
        return html`<section class="tarjeta" aria-labelledby="t-calificacion">
  <h2 id="t-calificacion">Calificación <span class="chip${n === 3 ? " chip--ok" : ""}">${n} de 3 respuestas</span></h2>
  <dl class="datos-clave">
    ${dato("Presupuesto", compra.rango_presupuesto ? nombreDe(RANGOS_PRESUPUESTO, compra.rango_presupuesto) : compra.presupuesto, compra.rango_presupuesto && compra.presupuesto ? compra.presupuesto : undefined)}
    ${dato("Forma de pago", compra.pago ? nombreDe(FORMAS_PAGO, compra.pago) : compra.forma_pago, compra.pago && compra.forma_pago ? compra.forma_pago : undefined)}
    ${dato("Para qué compra", compra.proposito ? PROPOSITOS[compra.proposito] ?? compra.proposito : null)}
    ${dato("Valor de referencia", v.valor ? pesosCortos(v.valor) : null, v.fuente === "rango" ? "punto medio del rango" : v.fuente === "cartera" ? "precio medio del proyecto" : v.fuente === "anotado" ? "anotado por ti" : undefined)}
  </dl>
  ${compra.rango_presupuesto === NO_SE || compra.pago === NO_SE ? html`<p class="nota">Respondió «Aún no lo sé» en alguna: pregúntalo en la primera llamada.</p>` : ""}
</section>`;
      })()
    : "";

  const atribucion = constancias.results.map((q) => leerAtribucion(q.atribucion)).find((x) => x) ?? null;
  const origen = html`<section class="tarjeta" aria-labelledby="t-origen">
  <h2 id="t-origen">De dónde llegó</h2>
  <dl class="datos-clave">
    ${dato("Canal", nombreCanal(contacto.canal), contacto.canal_ultimo && contacto.canal_ultimo !== contacto.canal ? `la última vez: ${nombreCanal(contacto.canal_ultimo)}` : undefined)}
    ${dato("Campaña", atribucion?.utm_campaign ?? null, atribucion?.utm_content ? `anuncio: ${atribucion.utm_content}` : undefined)}
    ${dato("Primera página", atribucion?.landing ?? contacto.pagina_entrada)}
    ${dato("Clic de anuncio", contacto.gclid ? "Google Ads (con identificador)" : contacto.fbclid ? "Facebook o Instagram (con identificador)" : null)}
  </dl>
</section>`;

  const conversacion = ultimaConversacion && mensajes
    ? html`<section class="tarjeta" aria-labelledby="t-conversacion">
  <h2 id="t-conversacion">${icono("ia")} Lo que conversó con la IA</h2>
  <p class="meta">${nombreCanalAgente(ultimaConversacion.canal)} · ${ultimaConversacion.mensajes} mensajes · último ${hace(ultimaConversacion.ultimo_en)}${
    conversaciones.results.length > 1 ? ` · ${conversaciones.results.length} conversaciones` : ""
  }</p>
  <div class="conversacion conversacion--ficha">${burbujas(mensajes.results)}</div>
  <p><a class="boton-sec boton--chico" href="/conversacion/${ultimaConversacion.id}">Ver la conversación completa</a></p>
</section>`
    : "";

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
    ? ops.results.map((o) => bloqueOportunidad(o, ahora))
    : vacio("Todavía no tiene oportunidades.");

  const tiposConOp = new Set(abiertas.map((o) => o.tipo));
  const agregarOp = (["compra", "venta"] as Tipo[])
    .filter((t) => !tiposConOp.has(t))
    .map(
      (t) => html`<form method="post" action="/contacto/${id}/oportunidad" class="en-linea">
  <input type="hidden" name="tipo" value="${t}">
  <button class="boton-sec boton--chico" type="submit">${icono("mas_uno")}<span>Oportunidad de ${t === "compra" ? "compra" : "venta o consignación"}</span></button>
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
  <span class="meta">${t.vence_en < hoyLocal ? html`<span class="vencida">venció ${fechaLocal(t.vence_en)}</span>` : t.vence_en === hoyLocal ? "hoy" : fechaLocal(t.vence_en)}${t.origen === "sistema" ? " · regla de higiene" : ""}</span></span>
  <form method="post" action="/tarea/${t.id}/hecha"><input type="hidden" name="volver" value="/contacto/${id}"><button class="boton-sec boton--chico" type="submit">Hecha</button></form></li>`,
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
  <span class="meta">${TIPOS_ACTIVIDAD[a.tipo] ?? a.tipo} · ${fechaCorta(a.creado_en)}${a.autor === "sitio" ? " · llegó solo" : a.autor === "sistema" ? " · regla automática" : ""}</span>
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
    <p>Borra el nombre, el teléfono, el correo, lo que escribió y sus conversaciones con la IA, aquí y en el buzón del sitio. Queda solo el registro de la solicitud. No se puede deshacer.</p>
    ${campo("confirmacion", `Para confirmar, escribe: ${contacto.nombre || "SUPRIMIR"}`, "", { requerido: true, max: 120, autocomplete: "off", id: `confirmar-${id}` })}
    <div class="acciones"><button class="boton-peligro" type="submit">Suprimir sus datos</button></div>
  </form>
  </details>
</section>`;

  // Eliminar el lead (9-oct-2026): lo mismo que el botón del embudo, para
  // hacerlo desde aquí o sin JavaScript.
  const eliminarLead = html`<section class="tarjeta" aria-labelledby="t-eliminar" id="eliminar">
  <details>
  <summary id="t-eliminar">Eliminar este lead</summary>
  <form method="post" action="/contacto/${id}/eliminar" class="zona-peligro rejilla">
    <input type="hidden" name="volver" value="/embudo${principal?.tipo === "venta" ? "?tipo=venta" : ""}">
    <p>Borra su ficha, sus oportunidades, notas y tareas, la copia de sus chats con la IA y su consulta del sitio. No queda nada de la persona en el CRM. No se puede deshacer.</p>
    <label class="casilla" for="confirmar-eliminar-${id}"><input id="confirmar-eliminar-${id}" name="confirmar" type="checkbox" value="si" required><span>Entiendo que no se puede deshacer</span></label>
    <div class="acciones"><button class="boton-peligro" type="submit">Eliminar el lead</button></div>
  </form>
  </details>
</section>`;

  return pagina({
    titulo,
    seccion: "embudo",
    url: c.url,
    vistaPrevia,
    ancho: "medio",
    cuerpo: html`<p class="migas"><a href="/embudo${principal?.tipo === "venta" ? "?tipo=venta" : ""}">${crudoFlecha()} Embudo</a></p>
${cabecera}
<div class="ficha-rejilla">
  <div class="ficha-principal">
    ${conversacion}
    ${registrar}
    <h2 class="subtitulo">Oportunidades</h2>
    ${bloqueOps}
    ${agregarOp}
    ${linea}
  </div>
  <div class="ficha-lateral">
    ${calificacion}
    ${origen}
    ${bloqueTareas}
    ${datos}
    ${autorizacion}
    ${proteccion}
    ${eliminarLead}
  </div>
</div>`,
  });
}

function crudoFlecha(): Html {
  return html`<span aria-hidden="true">←</span>`;
}

function bloqueOportunidad(o: Oportunidad, ahora: Date): Html {
  const etapas = ETAPAS[o.tipo];
  const cerrada = Boolean(o.cerrada);
  const opcionesInteres = CATALOGO.map((x) => ({ valor: x.slug, texto: x.nombre }));
  const interesLibre = o.interes && !CATALOGO.some((x) => x.slug === o.interes) ? o.interes : "";
  const dias = Math.floor((ahora.getTime() - new Date(o.etapa_desde).getTime()) / 86_400_000);
  return html`<section class="tarjeta oportunidad${cerrada ? " oportunidad--cerrada" : ""}" aria-label="Oportunidad de ${o.tipo}">
  <h3>${o.tipo === "compra" ? "Compra" : "Venta o consignación"} ${chipEtapa(o.tipo, o.etapa)}${o.tipo === "compra" ? chipPuntaje(o.puntaje) : ""}${
    o.higiene_nivel ? html`<span class="chip estado estado--por_vencer">${icono("reloj")}${o.higiene_nivel} días quieta</span>` : ""
  }</h3>
  <p class="meta">En esta etapa desde ${fechaLarga(o.etapa_desde)} (${dias === 1 ? "1 día" : `${dias} días`})${o.motivo_perdida ? ` · motivo: ${o.motivo_perdida}` : ""}${
    o.interes ? ` · interés: ${nombreDeInteres(o.interes)}` : ""
  }${o.canal ? ` · llegó por ${nombreCanal(o.canal)}` : ""}</p>
  <ol class="fases" aria-label="Fases del embudo a las que llegó">${[
    ["Contactado", o.fase_contactado_en],
    [o.tipo === "compra" ? "Presentación" : "Visita", o.fase_presentacion_en],
    [o.tipo === "compra" ? "Cotización" : "Consignación", o.fase_cotizacion_en],
    ["Cierre", o.fase_cierre_en],
  ].map(([nombre, en]) => html`<li class="${en ? "fase--hecha" : ""}"><span>${nombre}</span>${en ? html`<small>${fechaCorta(en)}</small>` : ""}</li>`)}</ol>
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
  <summary>Detalle, calificación, próxima acción y recorrido</summary>
  <form method="post" action="/oportunidad/${o.id}/detalle" class="rejilla">
    ${selector("interes", "Proyecto o inmueble", opcionesInteres, CATALOGO.some((x) => x.slug === o.interes) ? o.interes : "", { vacio: "—", id: `interes-${o.id}` })}
    ${campo("interes_otro", "Otro interés (texto)", interesLibre, { max: 160, id: `interes-otro-${o.id}` })}
    ${o.tipo === "compra"
      ? html`${selector("rango_presupuesto", "Presupuesto (rango)", RANGOS_PRESUPUESTO.map((x) => ({ valor: x.codigo, texto: x.es })), o.rango_presupuesto, { vacio: "—", id: `rango-${o.id}` })}
    ${selector("pago", "Forma de pago", FORMAS_PAGO.map((x) => ({ valor: x.codigo, texto: x.es })), o.pago, { vacio: "—", id: `pago-${o.id}` })}
    ${selector("proposito", "Para qué compra", Object.entries(PROPOSITOS).map(([valor, texto]) => ({ valor, texto })), o.proposito, { vacio: "—", id: `proposito-${o.id}` })}`
      : ""}
    ${campo("presupuesto", o.tipo === "compra" ? "Presupuesto exacto o nota" : "Precio esperado", o.presupuesto, { max: 80, id: `presupuesto-${o.id}` })}
    ${o.tipo === "compra" ? campo("forma_pago", "Detalle de la forma de pago", o.forma_pago, { max: 120, id: `forma-${o.id}` }) : ""}
    ${campo("valor_estimado", "Valor de referencia en pesos", o.valor_estimado ? pesos(o.valor_estimado) : "", { max: 40, id: `valor-${o.id}`, inputmode: "numeric", ayuda: `Para el pipeline del tablero. Vacío: ${valorDe({ ...o, valor_estimado: null }).valor ? `se usa ${pesosCortos(valorDe({ ...o, valor_estimado: null }).valor)}` : "no suma"}.` })}
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
