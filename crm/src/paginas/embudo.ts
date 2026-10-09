/**
 * El embudo (7-oct-2026, pedido de Rafael: «intuitivo, tipo el funnel de GHL,
 * que puedas arrastrar de nuevo a contactado o calificado»).
 *
 * Una columna por etapa y una tarjeta por oportunidad. Se arrastra con el
 * mouse, o con el dedo dejándolo apretado sobre la tarjeta (crm.js); al
 * soltarla, la etapa cambia sin recargar. Perdido y Descartado piden el
 * motivo. Sin JavaScript, o con el teclado, cada tarjeta tiene «Mover a…»,
 * un formulario normal.
 *
 * Las columnas cerradas (Separó, Vendido, Perdido, Descartado) muestran solo
 * lo de los últimos 30 días; lo anterior queda en la lista.
 *
 * Desde el 9-oct-2026 (pedido de Rafael), cada tarjeta tiene:
 *  - «Info»: los datos del lead en un diálogo, sin salir del embudo. Van
 *    escritos en la página, en un <template> por tarjeta: las lecturas del
 *    CRM solo se entregan a navegaciones (src/seguridad.ts), nunca a un
 *    fetch(). Sin JavaScript, el botón abre la ficha;
 *  - «Eliminar»: borra todo el lead (src/proteccion.ts, `eliminar`), después
 *    de confirmar en un diálogo. Sin JavaScript, se elimina desde la ficha.
 */
import { html, crudo, type Html } from "../html";
import type { Ctx } from "../base";
import { ETAPAS, MOTIVOS_PERDIDA, PROPOSITOS, etapaDe, nombreDeInteres, type Tipo } from "../datos";
import { minutosHabiles } from "../horario";
import { fechaLarga, fechaLocal, hace, hoy } from "../tiempo";
import { nombreCanal } from "../canales";
import { valorDe } from "../valor";
import { FORMAS_PAGO, NO_SE, RANGOS_PRESUPUESTO, nombreDe } from "@/data/calificacion";
import {
  pagina,
  chipCanal,
  chipPuntaje,
  chipSla,
  botonesContacto,
  iniciales,
  nombreFuente,
  pesosCortos,
  icono,
  vacio,
} from "./comun";

type Tarjeta = {
  id: number;
  etapa: string;
  etapa_desde: string;
  puntaje: string;
  interes: string | null;
  canal: string | null;
  valor_estimado: number | null;
  rango_presupuesto: string | null;
  espera_desde: string | null;
  higiene_nivel: number;
  proxima_accion_en: string | null;
  recorrido_en: string | null;
  cerrada: number;
  contacto_id: number;
  nombre: string | null;
  telefono: string | null;
  telefono_crudo: string | null;
  correo: string | null;
  // Para el diálogo «Info» (9-oct-2026).
  op_creada: string;
  proposito: string | null;
  pago: string | null;
  presupuesto: string | null;
  forma_pago: string | null;
  proxima_accion: string | null;
  ultima_actividad_en: string | null;
  ciudad: string | null;
  fuente: string;
  contacto_creado: string;
  /** La última actividad con texto, como JSON: {"tipo", "texto", "en"}. */
  ultima: string | null;
  /** Cuántas conversaciones con la IA tiene en el CRM. */
  chats: number;
};

type Ultima = { tipo: string; texto: string | null; en: string };

const TIPOS_ACTIVIDAD: Record<string, string> = {
  nota: "Nota",
  llamada: "Llamada",
  whatsapp: "WhatsApp",
  correo: "Correo",
  visita: "Visita",
  formulario: "Formulario de la web",
  agente: "La IA",
  chat: "Chat",
  etapa: "Cambio de etapa",
  puntaje: "Puntaje",
  sistema: "Sistema",
};

function leerUltima(json: string | null): Ultima | null {
  if (!json) return null;
  try {
    const u = JSON.parse(json) as Ultima;
    return u && typeof u.en === "string" ? u : null;
  } catch {
    return null;
  }
}

const DIAS_CERRADAS = 30;

function like(texto: string): string {
  return `%${texto.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

export async function paginaEmbudo(c: Ctx, vistaPrevia: boolean): Promise<Html> {
  const tipo: Tipo = c.url.searchParams.get("tipo") === "venta" ? "venta" : "compra";
  const q = (c.url.searchParams.get("q") ?? "").trim().slice(0, 80);
  const ahora = new Date();
  const hoyLocal = hoy(ahora);
  const desdeCerradas = new Date(ahora.getTime() - DIAS_CERRADAS * 86_400_000).toISOString();

  const condiciones = ["o.tipo = ?1", "c.estado_datos != 'suprimido'", "(o.cerrada = 0 OR o.etapa_desde >= ?2)"];
  const valores: unknown[] = [tipo, desdeCerradas];
  if (q) {
    condiciones.push(`(c.nombre LIKE ?3 ESCAPE '\\' OR c.correo LIKE ?3 ESCAPE '\\' OR o.interes LIKE ?3 ESCAPE '\\' OR c.telefono LIKE ?4 ESCAPE '\\')`);
    valores.push(like(q), like(q.replace(/\D/g, "") || q));
  }
  const [filas, viejas] = await Promise.all([
    c.db
      .prepare(
        `SELECT o.id, o.etapa, o.etapa_desde, o.puntaje, o.interes, o.canal, o.valor_estimado, o.rango_presupuesto,
                o.espera_desde, o.higiene_nivel, o.proxima_accion_en, o.recorrido_en, o.cerrada,
                o.creado_en AS op_creada, o.proposito, o.pago, o.presupuesto, o.forma_pago, o.proxima_accion,
                o.ultima_actividad_en,
                c.id AS contacto_id, c.nombre, c.telefono, c.telefono_crudo, c.correo, c.ciudad, c.fuente,
                c.creado_en AS contacto_creado,
                (SELECT json_object('tipo', a.tipo, 'texto', substr(a.texto, 1, 280), 'en', a.creado_en)
                   FROM crm_actividades a
                  WHERE a.contacto_id = c.id AND a.texto IS NOT NULL AND a.texto != ''
                  ORDER BY a.creado_en DESC, a.id DESC LIMIT 1) AS ultima,
                (SELECT COUNT(*) FROM agente_conversaciones k WHERE k.contacto_id = c.id) AS chats
           FROM crm_oportunidades o JOIN crm_contactos c ON c.id = o.contacto_id
          WHERE ${condiciones.join(" AND ")}
          ORDER BY (o.espera_desde IS NULL), o.espera_desde ASC, o.etapa_desde DESC
          LIMIT 500`,
      )
      .bind(...valores)
      .all<Tarjeta>(),
    c.db
      .prepare(
        `SELECT o.etapa, COUNT(*) AS n FROM crm_oportunidades o JOIN crm_contactos c ON c.id = o.contacto_id
          WHERE o.tipo = ? AND o.cerrada = 1 AND o.etapa_desde < ? AND c.estado_datos != 'suprimido'
          GROUP BY o.etapa`,
      )
      .bind(tipo, desdeCerradas)
      .all<{ etapa: string; n: number }>(),
  ]);

  const anteriores = new Map(viejas.results.map((f) => [f.etapa, f.n]));
  const etapas = ETAPAS[tipo];
  const porEtapa = new Map<string, Tarjeta[]>(etapas.map((e) => [e.id, []]));
  for (const f of filas.results) porEtapa.get(f.etapa)?.push(f);
  const volver = tipo === "venta" ? "/embudo?tipo=venta" : "/embudo";

  // El diálogo «Info» de cada tarjeta: crm.js lo copia de este <template>.
  const dato = (etiqueta: string, valor: string | Html | null | undefined, ayuda?: string) =>
    html`<div class="dato"><dt>${etiqueta}</dt><dd>${valor || html`<span class="falta">Sin dato</span>`}${ayuda ? html`<small>${ayuda}</small>` : ""}</dd></div>`;
  const info = (f: Tarjeta, dias: number, espera: number | null, nombre: string): Html => {
    const e = etapaDe(tipo, f.etapa);
    const v = valorDe(f);
    const u = leerUltima(f.ultima);
    const telefono = f.telefono ?? f.telefono_crudo;
    const rango = f.rango_presupuesto ? nombreDe(RANGOS_PRESUPUESTO, f.rango_presupuesto) : f.presupuesto;
    const pago = f.pago ? nombreDe(FORMAS_PAGO, f.pago) : f.forma_pago;
    const proposito = f.proposito ? PROPOSITOS[f.proposito] ?? f.proposito : null;
    const programado = [
      f.proxima_accion || f.proxima_accion_en
        ? html`<li><strong>Próxima acción:</strong> ${f.proxima_accion ?? "sin detalle"}${f.proxima_accion_en ? html` · ${fechaLocal(f.proxima_accion_en)}` : ""}</li>`
        : "",
      f.recorrido_en ? html`<li><strong>Recorrido:</strong> ${fechaLocal(f.recorrido_en)}</li>` : "",
    ];
    // Lo de arriba se desliza; «Abrir la ficha» y «Eliminar» quedan siempre a la vista.
    return html`<template data-plantilla-info>
<div class="info-desliza">
  <header class="info-cabeza">
    <span class="avatar" aria-hidden="true">${iniciales(f.nombre)}</span>
    <div>
      <h2 id="info-titulo">${nombre}</h2>
      <p class="meta"><span class="chip etapa--${e?.tono ?? "nuevo"}">${e?.nombre ?? f.etapa}</span> ${dias === 0 ? "desde hoy" : dias === 1 ? "hace 1 día" : `hace ${dias} días`}</p>
    </div>
  </header>
  <p class="chips">${chipCanal(f.canal)}${tipo === "compra" ? chipPuntaje(f.puntaje) : ""}${espera !== null ? chipSla(espera, f.espera_desde) : ""}${
    f.higiene_nivel ? html`<span class="chip estado estado--por_vencer">${icono("reloj")}${f.higiene_nivel} días quieto</span>` : ""
  }</p>
  ${f.cerrada ? "" : html`<div class="info-contacto">${botonesContacto({ id: f.contacto_id, telefono: f.telefono, telefono_crudo: f.telefono_crudo, correo: f.correo })}</div>`}
  <dl class="datos-clave">
    ${dato("Teléfono", telefono)}
    ${dato("Correo", f.correo)}
    ${dato("Interés", f.interes ? nombreDeInteres(f.interes) : null)}
    ${dato("Canal", f.canal && f.canal !== "sin_dato" ? nombreCanal(f.canal) : null, nombreFuente(f.fuente) || undefined)}
    ${tipo === "compra"
      ? html`${dato("Presupuesto", rango, f.rango_presupuesto === NO_SE ? "respondió «Aún no lo sé»" : undefined)}
    ${dato("Forma de pago", pago, f.pago === NO_SE ? "respondió «Aún no lo sé»" : undefined)}
    ${dato("Para qué compra", proposito)}`
      : ""}
    ${dato("Valor de referencia", v.valor ? pesosCortos(v.valor) : null, v.fuente === "rango" ? "punto medio del rango" : v.fuente === "cartera" ? "precio medio del proyecto" : v.fuente === "anotado" ? "anotado por ti" : undefined)}
    ${dato("Ciudad", f.ciudad)}
    ${dato("Llegó", fechaLarga(f.contacto_creado))}
  </dl>
  <h3 class="info-subtitulo">Seguimiento</h3>
  <ul class="info-lista">
    ${programado}
    ${u
      ? html`<li><strong>Última actividad:</strong> ${TIPOS_ACTIVIDAD[u.tipo] ?? u.tipo}, ${hace(u.en)}${u.texto ? html`<span class="info-texto">${u.texto}</span>` : ""}</li>`
      : html`<li>Todavía no hay actividades.</li>`}
    ${f.chats ? html`<li><strong>Chats con la IA:</strong> ${f.chats === 1 ? "1 conversación" : `${f.chats} conversaciones`}, en la ficha.</li>` : ""}
  </ul>
</div>
  <div class="acciones info-acciones">
    <a class="boton" href="/contacto/${f.contacto_id}">${icono("persona")}<span>Abrir la ficha</span></a>
    <button class="boton-sec boton-sec--peligro" type="button" data-eliminar="${f.contacto_id}" data-nombre="${nombre}">${icono("basura")}<span>Eliminar</span></button>
  </div>
</template>`;
  };

  const tarjeta = (f: Tarjeta, metaDias: number | undefined): Html => {
    const dias = Math.floor((ahora.getTime() - new Date(f.etapa_desde).getTime()) / 86_400_000);
    const v = valorDe(f);
    const espera = f.espera_desde ? minutosHabiles(new Date(f.espera_desde), ahora) : null;
    const programado = (f.proxima_accion_en ?? "") >= hoyLocal || (f.recorrido_en ?? "").slice(0, 10) >= hoyLocal;
    const estancada = !f.cerrada && metaDias !== undefined && dias > metaDias && !programado && espera === null;
    const nombre = f.nombre || "Sin nombre";
    return html`<article class="tarjeta-lead" data-op="${f.id}" data-etapa="${f.etapa}" data-valor="${v.valor ?? 0}" tabindex="-1">
  <header class="tarjeta-lead-cabeza">
    <span class="avatar avatar--chico" aria-hidden="true">${iniciales(f.nombre)}</span>
    <a class="tarjeta-lead-nombre" href="/contacto/${f.contacto_id}">${nombre}</a>
    <span class="tarjeta-lead-botones">
      <a class="boton-icono boton-icono--chico" href="/contacto/${f.contacto_id}" data-info title="Información" aria-label="Información de ${nombre}">${icono("info")}</a>
      <button class="boton-icono boton-icono--chico boton-icono--peligro" type="button" data-eliminar="${f.contacto_id}" data-nombre="${nombre}" title="Eliminar" aria-label="Eliminar a ${nombre}" hidden>${icono("basura")}</button>
    </span>
  </header>
  <p class="tarjeta-lead-meta">${f.interes ? nombreDeInteres(f.interes) : "Sin proyecto"}${v.valor ? html` · <b>${pesosCortos(v.valor)}</b>` : ""}</p>
  <p class="chips">${chipCanal(f.canal)}${tipo === "compra" && f.puntaje !== "sin" ? chipPuntaje(f.puntaje) : ""}${
    espera !== null ? chipSla(espera, f.espera_desde) : ""
  }${f.higiene_nivel ? html`<span class="chip estado estado--por_vencer">${icono("reloj")}${f.higiene_nivel} días quieto</span>` : ""}</p>
  <footer class="tarjeta-lead-pie">
    <span class="dias${estancada ? " dias--estancada" : ""}">${dias === 0 ? "Hoy en esta etapa" : dias === 1 ? "1 día aquí" : `${dias} días aquí`}${
      estancada ? html` · <span class="solo-lector">estancada, la meta es ${metaDias} días</span><span aria-hidden="true">meta ${metaDias}</span>` : ""
    }</span>
    <span class="acciones-rapidas">${f.cerrada ? "" : botonesContacto({ id: f.contacto_id, telefono: f.telefono, telefono_crudo: f.telefono_crudo, correo: null }, { compacto: true })}</span>
  </footer>
  <details class="mover-a">
    <summary>Mover a…</summary>
    <form method="post" action="/oportunidad/${f.id}/etapa" class="rejilla rejilla--una" data-etapas-con-motivo="${etapas.filter((e) => e.pideMotivo).map((e) => e.id).join(",")}">
      <input type="hidden" name="volver" value="${volver}">
      <label class="campo" for="mover-${f.id}"><span>Etapa</span>
      <select id="mover-${f.id}" name="etapa">${etapas.map(
        (e) => html`<option value="${e.id}"${e.id === f.etapa ? crudo(" selected") : ""}>${e.nombre}</option>`,
      )}</select></label>
      <label class="campo" for="motivo-${f.id}"><span>Motivo</span>
      <select id="motivo-${f.id}" name="motivo"><option value="">—</option>${MOTIVOS_PERDIDA.map((m) => html`<option value="${m}">${m}</option>`)}</select></label>
      <div class="acciones"><button class="boton-sec boton--chico" type="submit">Mover</button></div>
    </form>
  </details>
  ${info(f, dias, espera, nombre)}
</article>`;
  };

  const columnas = etapas.map((e) => {
    const lista = porEtapa.get(e.id) ?? [];
    const total = lista.reduce((n, f) => n + (valorDe(f).valor ?? 0), 0);
    const viejasN = anteriores.get(e.id) ?? 0;
    return html`<section class="columna columna--${e.tono}" data-etapa="${e.id}"${e.pideMotivo ? crudo(' data-pide-motivo="1"') : ""} aria-labelledby="col-${e.id}">
  <header class="columna-cabeza">
    <h2 id="col-${e.id}"><i class="punto etapa-punto--${e.tono}" aria-hidden="true"></i>${e.nombre}</h2>
    <p class="columna-cifras"><b data-cuenta>${lista.length}</b><span data-total>${total ? pesosCortos(total) : ""}</span></p>
  </header>
  <div class="columna-cuerpo">
    ${lista.map((f) => tarjeta(f, e.metaDias))}
    <p class="columna-vacia"${lista.length ? crudo(" hidden") : ""}>Arrastra una tarjeta aquí</p>
  </div>
  ${viejasN ? html`<p class="columna-nota"><a href="/${tipo === "venta" ? "propietarios" : "leads"}?etapa=${e.id}&amp;estado=todas">+${viejasN} de hace más de ${DIAS_CERRADAS} días</a></p>` : ""}
</section>`;
  });

  const abiertas = filas.results.filter((f) => !f.cerrada);
  const esperan = abiertas.filter((f) => f.espera_desde).length;
  const cabecera = html`<div class="cabeza-pagina">
  <div>
    <h1 class="titulo">Embudo</h1>
    <p class="bajada">${abiertas.length} abiertas${esperan ? html` · <a href="/hoy#esperan">${esperan} esperan respuesta</a>` : ""} · arrastra una tarjeta para cambiarla de etapa</p>
  </div>
  <div class="controles">
    <nav class="segmentado" aria-label="Tipo de oportunidad">
      <a href="/embudo"${tipo === "compra" ? crudo(' aria-current="page"') : ""}>Compradores</a>
      <a href="/embudo?tipo=venta"${tipo === "venta" ? crudo(' aria-current="page"') : ""}>Propietarios</a>
    </nav>
    <a class="boton-sec boton--chico" href="/${tipo === "venta" ? "propietarios" : "leads"}">${icono("lista")}<span>Ver en lista</span></a>
    <form method="get" action="/embudo" class="buscador" role="search">
      ${tipo === "venta" ? html`<input type="hidden" name="tipo" value="venta">` : ""}
      <label class="solo-lector" for="buscar-embudo">Buscar en el embudo</label>
      <input id="buscar-embudo" name="q" type="search" value="${q}" maxlength="80" placeholder="Buscar nombre, teléfono o proyecto">
    </form>
  </div>
</div>`;

  const dialogo = html`<dialog class="dialogo" id="dialogo-motivo" aria-labelledby="dialogo-motivo-titulo">
  <form method="dialog" class="rejilla rejilla--una">
    <h2 id="dialogo-motivo-titulo">¿Por qué se pierde?</h2>
    <p class="nota">Para pasar a <span data-destino></span>, elige el motivo. Sirve para ver después por qué se caen los leads.</p>
    <label class="campo" for="dialogo-motivo-select"><span>Motivo</span>
    <select id="dialogo-motivo-select" name="motivo" required><option value="">Elige uno</option>${MOTIVOS_PERDIDA.map((m) => html`<option value="${m}">${m}</option>`)}</select></label>
    <div class="acciones"><button class="boton" value="confirmar">Mover</button><button class="boton-sec" value="cancelar" formnovalidate>Cancelar</button></div>
  </form>
</dialog>`;

  const dialogoInfo = html`<dialog class="dialogo dialogo--info" id="dialogo-info" aria-labelledby="info-titulo">
  <form method="dialog" class="dialogo-cerrar"><button class="boton-icono" value="cerrar" aria-label="Cerrar">${icono("cerrar")}</button></form>
  <div class="info-marco" data-info-cuerpo></div>
</dialog>`;

  // Un solo formulario para eliminar: crm.js le pone el contacto antes de abrirlo.
  const dialogoEliminar = html`<dialog class="dialogo" id="dialogo-eliminar" aria-labelledby="dialogo-eliminar-titulo">
  <form method="post" action="/contacto/0/eliminar" class="rejilla rejilla--una">
    <input type="hidden" name="volver" value="${volver}">
    <input type="hidden" name="confirmar" value="si">
    <h2 id="dialogo-eliminar-titulo">¿Eliminar a <span data-nombre></span>?</h2>
    <p class="nota">Se borran su ficha, sus oportunidades, notas y tareas, la copia de sus chats con la IA y su consulta del sitio. No se puede deshacer.</p>
    <div class="acciones"><button class="boton-peligro" type="submit">Eliminar</button><button class="boton-sec" type="submit" formmethod="dialog" formnovalidate value="cancelar">Cancelar</button></div>
  </form>
</dialog>`;

  const cuerpo = filas.results.length || q
    ? html`${cabecera}<div class="kanban" data-tipo="${tipo}" data-volver="${volver}">${columnas}</div>${dialogo}${dialogoInfo}${dialogoEliminar}`
    : html`${cabecera}${vacio(tipo === "compra" ? "Cuando entren compradores, aparecen aquí, en la columna «Nuevo»." : "Cuando entren propietarios, aparecen aquí.")}`;

  return pagina({
    titulo: "Embudo",
    seccion: "embudo",
    url: c.url,
    vistaPrevia,
    ancho: true,
    accion: html`<a class="boton-barra" href="/nuevo${tipo === "venta" ? "?tipo=venta" : ""}">${icono("mas_uno")}<span>${tipo === "venta" ? "Propietario" : "Lead"}</span></a>`,
    cuerpo,
  });
}
