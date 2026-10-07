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
 */
import { html, crudo, type Html } from "../html";
import type { Ctx } from "../base";
import { ETAPAS, MOTIVOS_PERDIDA, nombreDeInteres, type Tipo } from "../datos";
import { minutosHabiles } from "../horario";
import { hoy } from "../tiempo";
import { valorDe } from "../valor";
import { pagina, chipCanal, chipPuntaje, chipSla, botonesContacto, iniciales, pesosCortos, icono, vacio } from "./comun";

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
};

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
                c.id AS contacto_id, c.nombre, c.telefono, c.telefono_crudo, c.correo
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

  const tarjeta = (f: Tarjeta, metaDias: number | undefined): Html => {
    const dias = Math.floor((ahora.getTime() - new Date(f.etapa_desde).getTime()) / 86_400_000);
    const v = valorDe(f);
    const espera = f.espera_desde ? minutosHabiles(new Date(f.espera_desde), ahora) : null;
    const programado = (f.proxima_accion_en ?? "") >= hoyLocal || (f.recorrido_en ?? "").slice(0, 10) >= hoyLocal;
    const estancada = !f.cerrada && metaDias !== undefined && dias > metaDias && !programado && espera === null;
    return html`<article class="tarjeta-lead" data-op="${f.id}" data-etapa="${f.etapa}" tabindex="-1">
  <header class="tarjeta-lead-cabeza">
    <span class="avatar avatar--chico" aria-hidden="true">${iniciales(f.nombre)}</span>
    <a class="tarjeta-lead-nombre" href="/contacto/${f.contacto_id}">${f.nombre || "Sin nombre"}</a>
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
</article>`;
  };

  const columnas = etapas.map((e) => {
    const lista = porEtapa.get(e.id) ?? [];
    const total = lista.reduce((n, f) => n + (valorDe(f).valor ?? 0), 0);
    const viejasN = anteriores.get(e.id) ?? 0;
    return html`<section class="columna columna--${e.tono}" data-etapa="${e.id}"${e.pideMotivo ? crudo(' data-pide-motivo="1"') : ""} aria-labelledby="col-${e.id}">
  <header class="columna-cabeza">
    <h2 id="col-${e.id}"><i class="punto etapa-punto--${e.tono}" aria-hidden="true"></i>${e.nombre}</h2>
    <p class="columna-cifras"><b data-cuenta>${lista.length}</b><span>${total ? pesosCortos(total) : ""}</span></p>
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

  const cuerpo = filas.results.length || q
    ? html`${cabecera}<div class="kanban" data-tipo="${tipo}" data-volver="${volver}">${columnas}</div>${dialogo}`
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
