/**
 * Las listas de compradores (/leads) y de propietarios (/propietarios), con
 * búsqueda y filtros (Prompt 3, §2.5). En el celular, tarjetas.
 */
import { html, type Html } from "../html";
import type { Ctx } from "../base";
import { ETAPAS, FUENTES, PUNTAJES, nombreDeInteres, type Tipo } from "../datos";
import { hace } from "../tiempo";
import { pagina, chipEtapa, chipPuntaje, nombreFuente, selector, vacio } from "./comun";

type Fila = {
  op_id: number;
  etapa: string;
  puntaje: string;
  interes: string | null;
  actualizado_en: string;
  id: number;
  nombre: string | null;
  telefono: string | null;
  correo: string | null;
  fuente: string;
  ultimo_contacto_en: string | null;
};

const POR_PAGINA = 50;

/** Para buscar con LIKE sin que «%» o «_» del texto cambien el sentido. */
function like(texto: string): string {
  return `%${texto.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

export async function paginaLeads(c: Ctx, tipo: Tipo, vistaPrevia: boolean): Promise<Html> {
  const p = c.url.searchParams;
  const q = (p.get("q") ?? "").trim().slice(0, 80);
  const etapa = p.get("etapa") ?? "";
  const puntaje = p.get("puntaje") ?? "";
  const fuente = p.get("fuente") ?? "";
  const idioma = p.get("idioma") ?? "";
  const estado = p.get("estado") ?? "abiertas";
  const desde = Math.max(0, Number.parseInt(p.get("desde") ?? "0", 10) || 0);

  const condiciones = ["o.tipo = ?", "c.estado_datos != 'suprimido'"];
  const valores: unknown[] = [tipo];
  if (estado === "abiertas") condiciones.push("o.cerrada = 0");
  if (estado === "cerradas") condiciones.push("o.cerrada = 1");
  if (etapa && ETAPAS[tipo].some((e) => e.id === etapa)) {
    condiciones.push("o.etapa = ?");
    valores.push(etapa);
  }
  if (puntaje && PUNTAJES.some((x) => x.id === puntaje)) {
    condiciones.push("o.puntaje = ?");
    valores.push(puntaje);
  }
  if (fuente && FUENTES[fuente]) {
    condiciones.push("c.fuente = ?");
    valores.push(fuente);
  }
  if (idioma === "es" || idioma === "en") {
    condiciones.push("c.idioma = ?");
    valores.push(idioma);
  }
  if (q) {
    const digitos = q.replace(/\D/g, "");
    condiciones.push(
      `(c.nombre LIKE ? ESCAPE '\\' OR c.correo LIKE ? ESCAPE '\\' OR o.interes LIKE ? ESCAPE '\\'${
        digitos.length >= 4 ? " OR c.telefono LIKE ? ESCAPE '\\'" : ""
      })`,
    );
    valores.push(like(q), like(q.toLowerCase()), like(q));
    if (digitos.length >= 4) valores.push(like(digitos));
  }

  const [filas, porEtapa] = await Promise.all([
    c.db
      .prepare(
        `SELECT o.id AS op_id, o.etapa, o.puntaje, o.interes, o.actualizado_en,
                c.id, c.nombre, c.telefono, c.correo, c.fuente, c.ultimo_contacto_en
           FROM crm_oportunidades o JOIN crm_contactos c ON c.id = o.contacto_id
          WHERE ${condiciones.join(" AND ")}
          ORDER BY o.actualizado_en DESC, o.id DESC
          LIMIT ? OFFSET ?`,
      )
      .bind(...valores, POR_PAGINA + 1, desde)
      .all<Fila>(),
    c.db
      .prepare(
        `SELECT o.etapa, COUNT(*) AS n
           FROM crm_oportunidades o JOIN crm_contactos c ON c.id = o.contacto_id
          WHERE o.tipo = ? AND c.estado_datos != 'suprimido'
          GROUP BY o.etapa`,
      )
      .bind(tipo)
      .all<{ etapa: string; n: number }>(),
  ]);

  const hayMas = filas.results.length > POR_PAGINA;
  const lista = filas.results.slice(0, POR_PAGINA);
  const base = tipo === "compra" ? "/leads" : "/propietarios";
  const conteo = new Map(porEtapa.results.map((f) => [f.etapa, f.n]));
  const filtrosActivos = [q, etapa, puntaje, fuente, idioma].some(Boolean) || estado !== "abiertas";

  const enlaceCon = (cambios: Record<string, string>) => {
    const u = new URLSearchParams(p);
    u.delete("desde");
    u.delete("ok");
    for (const [k, v] of Object.entries(cambios)) v ? u.set(k, v) : u.delete(k);
    const s = u.toString();
    return s ? `${base}?${s}` : base;
  };

  const embudo = html`<nav class="embudo" aria-label="Etapas">${ETAPAS[tipo].map(
    (e) => html`<a class="chip etapa--${e.tono}${etapa === e.id ? " chip--elegida" : ""}" href="${enlaceCon({
      etapa: etapa === e.id ? "" : e.id,
      estado: e.cierra ? "todas" : estado,
    })}"${etapa === e.id ? html` aria-current="true"` : ""}>${e.nombre} <b>${conteo.get(e.id) ?? 0}</b></a>`,
  )}</nav>`;

  const filtros = html`<details class="tarjeta filtros"${filtrosActivos ? html` open` : ""}>
<summary>Buscar y filtrar</summary>
<form method="get" action="${base}" class="rejilla">
  <label class="campo" for="q"><span>Nombre, teléfono, correo o proyecto</span>
  <input id="q" name="q" type="search" value="${q}" maxlength="80"></label>
  ${selector("etapa", "Etapa", ETAPAS[tipo].map((e) => ({ valor: e.id, texto: e.nombre })), etapa, { vacio: "Todas" })}
  ${selector("puntaje", "Puntaje", PUNTAJES.map((x) => ({ valor: x.id, texto: x.nombre })), puntaje, { vacio: "Todos" })}
  ${selector("fuente", "Fuente", Object.entries(FUENTES).map(([valor, texto]) => ({ valor, texto })), fuente, { vacio: "Todas" })}
  ${selector("idioma", "Idioma", [{ valor: "es", texto: "Español" }, { valor: "en", texto: "Inglés" }], idioma, { vacio: "Los dos" })}
  ${selector("estado", "Mostrar", [
    { valor: "abiertas", texto: "Abiertas" },
    { valor: "cerradas", texto: "Cerradas" },
    { valor: "todas", texto: "Todas" },
  ], estado)}
  <div class="acciones"><button class="boton" type="submit">Filtrar</button>${
    filtrosActivos ? html`<a class="boton-sec" href="${base}">Quitar filtros</a>` : ""
  }</div>
</form>
</details>`;

  const tarjetas = lista.length
    ? html`<ul class="tarjetas">${lista.map(
        (f) => html`<li><a class="tarjeta lead" href="/contacto/${f.id}">
  <span class="lead-nombre">${f.nombre || "Sin nombre"}</span>
  <span class="chips">${chipEtapa(tipo, f.etapa)}${tipo === "compra" ? chipPuntaje(f.puntaje) : ""}</span>
  <span class="meta">${nombreFuente(f.fuente)}${f.interes ? ` · ${nombreDeInteres(f.interes)}` : ""}</span>
  <span class="meta">${f.ultimo_contacto_en ? `Último contacto ${hace(f.ultimo_contacto_en)}` : "Sin contactar"} · movido ${hace(f.actualizado_en)}</span>
</a></li>`,
      )}</ul>`
    : vacio(filtrosActivos ? "Con estos filtros no aparece nadie." : tipo === "compra" ? "Aquí van a aparecer los compradores." : "Aquí van a aparecer los propietarios.");

  const paginas = hayMas || desde > 0
    ? html`<nav class="paginas" aria-label="Más resultados">
  ${desde > 0 ? html`<a class="boton-sec" href="${enlaceCon({ desde: String(Math.max(0, desde - POR_PAGINA)) })}">Anteriores</a>` : ""}
  ${hayMas ? html`<a class="boton-sec" href="${enlaceCon({ desde: String(desde + POR_PAGINA) })}">Siguientes</a>` : ""}
</nav>`
    : "";

  const titulo = tipo === "compra" ? "Compradores" : "Propietarios";
  return pagina({
    titulo,
    seccion: tipo,
    url: c.url,
    vistaPrevia,
    accion: html`<a class="boton-barra" href="/nuevo?tipo=${tipo}">+ ${tipo === "compra" ? "Lead" : "Propietario"}</a>`,
    cuerpo: html`<h1 class="titulo">${titulo}</h1>${embudo}${filtros}${tarjetas}${paginas}`,
  });
}
