/**
 * Chats: todo lo que conversó la IA (el agente de atención) por el chat de la
 * web y por WhatsApp (7-oct-2026, pedido de Rafael: «que se pueda ver qué
 * conversó la IA con el chat», todas). Ver crm/src/conversaciones.ts.
 *
 *  - /conversaciones: la bandeja, la más reciente arriba, con filtros por
 *    canal y por si la persona ya tiene ficha, y búsqueda en los mensajes.
 *  - /conversacion/<id>: la conversación completa, en burbujas, con el enlace
 *    a la ficha (o para crearla).
 */
import { html, crudo, type Html } from "../html";
import { auditar, type Ctx } from "../base";
import { fechaCorta, hace, horaCorta, fechaLocal, fechaDe } from "../tiempo";
import { nombreCanalAgente } from "../conversaciones";
import { pagina, vacio, iniciales, icono } from "./comun";

type Fila = {
  id: number;
  canal: string;
  usuario: string | null;
  telefono: string | null;
  contacto_id: number | null;
  nombre: string | null;
  iniciada_en: string;
  ultimo_en: string;
  mensajes: number;
  primer_mensaje: string | null;
  ultimo_texto: string | null;
  ultimo_rol: string | null;
  leida_en: string | null;
};

const POR_PAGINA = 40;

function like(texto: string): string {
  return `%${texto.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

/** Quién es, para mostrar: su nombre si tiene ficha, si no su número o «Visitante de la web». */
function quien(f: { nombre: string | null; telefono: string | null; canal: string; id: number }): string {
  if (f.nombre) return f.nombre;
  if (f.telefono) return f.telefono;
  return f.canal === "webchat" ? `Visitante de la web #${f.id}` : `${nombreCanalAgente(f.canal)} #${f.id}`;
}

export async function paginaConversaciones(c: Ctx, vistaPrevia: boolean): Promise<Html> {
  const p = c.url.searchParams;
  const canal = p.get("canal") ?? "";
  const ficha = p.get("ficha") ?? "";
  const q = (p.get("q") ?? "").trim().slice(0, 80);
  const desde = Math.max(0, Number.parseInt(p.get("desde") ?? "0", 10) || 0);

  const condiciones: string[] = ["1 = 1"];
  const valores: unknown[] = [];
  if (canal === "whatsapp") condiciones.push("k.canal LIKE 'whatsapp%'");
  if (canal === "web") condiciones.push("k.canal = 'webchat'");
  if (ficha === "con") condiciones.push("k.contacto_id IS NOT NULL");
  if (ficha === "sin") condiciones.push("k.contacto_id IS NULL");
  if (q) {
    condiciones.push(
      `(k.telefono LIKE ? ESCAPE '\\' OR c.nombre LIKE ? ESCAPE '\\'
        OR EXISTS (SELECT 1 FROM agente_mensajes m2 WHERE m2.conversacion_id = k.id AND m2.texto LIKE ? ESCAPE '\\'))`,
    );
    valores.push(like(q.replace(/[^\d+]/g, "") || q), like(q), like(q));
  }

  const [filas, sync] = await Promise.all([
    c.db
      .prepare(
        `SELECT k.id, k.canal, k.usuario, k.telefono, k.contacto_id, c.nombre, k.iniciada_en, k.ultimo_en, k.mensajes,
                k.primer_mensaje, k.leida_en,
                (SELECT texto FROM agente_mensajes m WHERE m.conversacion_id = k.id ORDER BY m.en DESC, m.id DESC LIMIT 1) AS ultimo_texto,
                (SELECT rol FROM agente_mensajes m WHERE m.conversacion_id = k.id ORDER BY m.en DESC, m.id DESC LIMIT 1) AS ultimo_rol
           FROM agente_conversaciones k
           LEFT JOIN crm_contactos c ON c.id = k.contacto_id AND c.estado_datos != 'suprimido'
          WHERE ${condiciones.join(" AND ")}
          ORDER BY k.ultimo_en DESC LIMIT ? OFFSET ?`,
      )
      .bind(...valores, POR_PAGINA + 1, desde)
      .all<Fila>(),
    c.db.prepare(`SELECT ultimo_en, lotes, mensajes FROM agente_sincronizacion WHERE fuente = 'atencion'`).first<{ ultimo_en: string; lotes: number; mensajes: number }>(),
  ]);

  const lista = filas.results.slice(0, POR_PAGINA);
  const hayMas = filas.results.length > POR_PAGINA;
  const enlaceCon = (cambios: Record<string, string>) => {
    const u = new URLSearchParams(p);
    u.delete("desde");
    for (const [k, v] of Object.entries(cambios)) v ? u.set(k, v) : u.delete(k);
    const s = u.toString();
    return s ? `/conversaciones?${s}` : "/conversaciones";
  };
  const opcion = (clave: string, valor: string, texto: string, actual: string) =>
    html`<a href="${enlaceCon({ [clave]: valor })}"${actual === valor ? crudo(' aria-current="true"') : ""}>${texto}</a>`;

  // El sincronizador manda un «latido» cada 5 minutos aunque no haya chats
  // nuevos: si pasan 30 sin nada, algo se cayó del lado del servidor.
  const callado = sync ? Date.now() - Date.parse(sync.ultimo_en) > 30 * 60_000 : false;
  const estadoSync = sync
    ? callado
      ? html`<p class="error" role="status">${icono("alerta")}<span>Hace ${hace(sync.ultimo_en).replace(/^hace /, "")} que no llega nada del servidor del agente. Los chats nuevos no aparecen hasta que el sincronizador vuelva: revisa el servicio en el servidor (ver el informe).</span></p>`
      : html`<p class="nota">Sincronizado con el servidor del agente ${hace(sync.ultimo_en)} (${sync.mensajes} mensajes en total).</p>`
    : html`<p class="nota">Todavía no llega nada del servidor del agente. Cuando se instale el sincronizador (ver el informe), las conversaciones aparecen aquí solas, cada minuto.</p>`;

  const items = lista.length
    ? html`<ul class="bandeja">${lista.map((f) => {
        const nueva = !f.leida_en || f.ultimo_en > f.leida_en;
        return html`<li><a class="bandeja-item${nueva ? " bandeja-item--nueva" : ""}" href="/conversacion/${f.id}">
  <span class="avatar${f.contacto_id ? "" : " avatar--anonimo"}" aria-hidden="true">${f.nombre ? iniciales(f.nombre) : icono(f.canal === "webchat" ? "chats" : "whatsapp")}</span>
  <span class="bandeja-cuerpo">
    <span class="bandeja-linea"><strong>${quien(f)}</strong><time datetime="${f.ultimo_en}">${hace(f.ultimo_en)}</time></span>
    <span class="bandeja-texto">${f.ultimo_rol === "agente" ? html`<b>IA:</b> ` : ""}${(f.ultimo_texto ?? f.primer_mensaje ?? "").slice(0, 140)}</span>
    <span class="chips"><span class="chip">${nombreCanalAgente(f.canal)}</span><span class="chip">${f.mensajes} mensajes</span>${
      f.contacto_id ? html`<span class="chip chip--ok">${icono("persona")}Con ficha</span>` : ""
    }${nueva ? html`<span class="chip chip--nueva">Nueva</span>` : ""}</span>
  </span>
</a></li>`;
      })}</ul>`
    : vacio(q || canal || ficha ? "Con estos filtros no aparece ninguna conversación." : "Todavía no hay conversaciones.");

  const cuerpo = html`<div class="cabeza-pagina">
  <div>
    <h1 class="titulo">Chats</h1>
    <p class="bajada">Lo que la IA conversó por el chat de la web y por WhatsApp.</p>
  </div>
</div>
<div class="filtros-fila">
  <nav class="segmentado" aria-label="Canal">${opcion("canal", "", "Todos", canal)}${opcion("canal", "whatsapp", "WhatsApp", canal)}${opcion("canal", "web", "Web", canal)}</nav>
  <nav class="segmentado" aria-label="Ficha">${opcion("ficha", "", "Todas", ficha)}${opcion("ficha", "con", "Con ficha", ficha)}${opcion("ficha", "sin", "Sin ficha", ficha)}</nav>
  <form method="get" action="/conversaciones" class="buscador" role="search">
    ${canal ? html`<input type="hidden" name="canal" value="${canal}">` : ""}${ficha ? html`<input type="hidden" name="ficha" value="${ficha}">` : ""}
    <label class="solo-lector" for="buscar-chats">Buscar en las conversaciones</label>
    <input id="buscar-chats" name="q" type="search" value="${q}" maxlength="80" placeholder="Buscar en los chats">
  </form>
</div>
${estadoSync}
<section class="tarjeta tarjeta--lista">${items}</section>
${hayMas || desde > 0
  ? html`<nav class="paginas" aria-label="Más conversaciones">${desde > 0 ? html`<a class="boton-sec" href="${enlaceCon({ desde: String(Math.max(0, desde - POR_PAGINA)) })}">Más recientes</a>` : ""}${
      hayMas ? html`<a class="boton-sec" href="${enlaceCon({ desde: String(desde + POR_PAGINA) })}">Más antiguas</a>` : ""
    }</nav>`
  : ""}`;

  return pagina({ titulo: "Chats", seccion: "chats", url: c.url, vistaPrevia, cuerpo });
}

type Mensaje = { id: number; rol: "persona" | "agente"; texto: string; en: string };

/** Las burbujas de una conversación, con un separador por día. También la usa la ficha. */
export function burbujas(mensajes: Mensaje[]): Html {
  let dia = "";
  return html`<ol class="burbujas">${mensajes.map((m) => {
    const d = fechaDe(m.en);
    const separador = d !== dia ? html`<li class="burbujas-dia"><span>${fechaLocal(d)}</span></li>` : "";
    dia = d;
    return html`${separador}<li class="burbuja burbuja--${m.rol}">
  <span class="burbuja-quien">${m.rol === "agente" ? "IA" : "Persona"}</span>
  <p class="texto-libre">${m.texto}</p>
  <time datetime="${m.en}">${horaCorta(m.en)}</time>
</li>`;
  })}</ol>`;
}

export async function paginaConversacion(c: Ctx, id: number, vistaPrevia: boolean): Promise<Html | null> {
  const k = await c.db
    .prepare(
      `SELECT k.id, k.canal, k.usuario, k.telefono, k.contacto_id, c.nombre, k.iniciada_en, k.ultimo_en, k.mensajes,
              k.primer_mensaje, k.leida_en, NULL AS ultimo_texto, NULL AS ultimo_rol
         FROM agente_conversaciones k
         LEFT JOIN crm_contactos c ON c.id = k.contacto_id AND c.estado_datos != 'suprimido'
        WHERE k.id = ?`,
    )
    .bind(id)
    .first<Fila>();
  if (!k) return null;
  const mensajes = await c.db
    .prepare(`SELECT id, rol, texto, en FROM agente_mensajes WHERE conversacion_id = ? ORDER BY en ASC, id ASC LIMIT 1000`)
    .bind(id)
    .all<Mensaje>();
  await c.db.prepare(`UPDATE agente_conversaciones SET leida_en = ? WHERE id = ?`).bind(new Date().toISOString(), id).run();
  await auditar(c, "ver_conversacion", "conversacion", id);

  const ficha = k.contacto_id
    ? html`<a class="boton-sec boton--chico" href="/contacto/${k.contacto_id}">${icono("persona")}<span>Ver la ficha</span></a>`
    : html`<a class="boton-sec boton--chico" href="/nuevo?telefono=${encodeURIComponent(k.telefono ?? "")}&amp;fuente=whatsapp_directo">${icono("mas_uno")}<span>Crear ficha</span></a>`;

  const cuerpo = html`<p class="migas"><a href="/conversaciones">${crudo("&larr;")} Chats</a></p>
<section class="tarjeta conversacion-cabeza">
  <span class="avatar avatar--grande${k.contacto_id ? "" : " avatar--anonimo"}" aria-hidden="true">${k.nombre ? iniciales(k.nombre) : icono(k.canal === "webchat" ? "chats" : "whatsapp")}</span>
  <div>
    <h1>${quien(k)}</h1>
    <p class="meta">${nombreCanalAgente(k.canal)} · empezó el ${fechaCorta(k.iniciada_en)} · ${k.mensajes} mensajes · último ${hace(k.ultimo_en)}</p>
  </div>
  <div class="acciones">${ficha}</div>
</section>
${!k.contacto_id
  ? html`<p class="nota">Sin ficha: esta persona no ha pedido una llamada ni dejado sus datos por el sitio. Si la creas, anota cómo dio su autorización de datos.</p>`
  : ""}
<section class="tarjeta conversacion" aria-label="Mensajes">${mensajes.results.length ? burbujas(mensajes.results) : vacio("Esta conversación no tiene mensajes.")}</section>`;

  return pagina({ titulo: `Chat · ${quien(k)}`, seccion: "chats", url: c.url, vistaPrevia, cuerpo });
}
