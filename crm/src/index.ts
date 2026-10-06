/**
 * El CRM interno de RHF (Prompt 3 de Luciano, fase 2).
 *
 * Desde el 6-oct-2026 vive dentro del Worker del sitio, en una ruta secreta de
 * rhfliving.com (el secreto `CRM_RUTA`), y se entra con una clave (el secreto
 * `CRM_CLAVE`). Pedido de Rafael: «un link de rhfliving.com que pida clave».
 * Así no hace falta otro Worker, ni otro dominio, ni pasos en el panel de
 * Cloudflare. worker/index.ts le pasa cada petición con `atenderCRM`, que
 * responde null si la dirección no es la del CRM.
 *
 * Una ficha por persona con todo lo que llegó por el sitio (formularios,
 * /vender, guía, simulador, WhatsApp y chat del agente), las etapas de
 * compradores y propietarios, notas, tareas, el boletín y las herramientas de
 * la Ley 1581.
 *
 * Por dentro, el CRM trabaja con direcciones cortas («/hoy», «/contacto/3»):
 * acá se les quita la ruta secreta al entrar y se les antepone al salir, en
 * las redirecciones y en los enlaces y formularios de cada página.
 *
 * Seguridad, en el servidor y en cada ruta (ver también src/acceso.ts):
 *  - sin sesión, todo responde 403 (la página de acceso, si es un navegador);
 *  - toda escritura exige el mismo origen y el token anti-CSRF de la sesión;
 *  - las páginas solo se entregan a navegaciones (Fetch Metadata);
 *  - CSP estricta: solo el script y la hoja de estilos propios, sin nada en
 *    línea; sin marcos; ventana aislada (COOP);
 *  - fuera de los buscadores (noindex) y sin analítica;
 *  - lo que escribe un lead se escapa siempre (src/html.ts).
 */
import type { Env, Opciones } from "./env";
import { nuevoCtx, esVistaPrevia, existeTabla, rutaCRM, type Ctx } from "./base";
import { sesionDe, mismoOrigen, esNavegacion, entrarConClave, hayClave, iguales, salir, salirDeTodo } from "./acceso";
import { ingerir, contactoDeConsulta, POR_PETICION } from "./ingesta";
import type { Html } from "./html";
import { html } from "./html";
import { paginaAcceso } from "./paginas/acceso";
import { paginaHoy } from "./paginas/hoy";
import { paginaLeads } from "./paginas/leads";
import { paginaFicha } from "./paginas/ficha";
import { paginaAlta } from "./paginas/alta";
import { paginaBoletin } from "./paginas/boletin";
import { paginaMas, paginaAuditoria } from "./paginas/mas";
import { pagina } from "./paginas/comun";
import {
  volverA,
  registrarActividad,
  crearTarea,
  cerrarTarea,
  cambiarEtapa,
  cambiarPuntaje,
  guardarDetalle,
  editarDatos,
  nuevaOportunidad,
  altaManual,
} from "./acciones";
import { exportarContacto, marcarReclamo, suprimir, bajaBoletin, reactivarBoletin, csvBoletin } from "./proteccion";

export { mandarResumen } from "./resumen";
export { rutaCRM } from "./base";

/** Las cabeceras de seguridad de todas las respuestas. */
const CABECERAS: Record<string, string> = {
  "Content-Security-Policy":
    "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; " +
    "connect-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  // Solo el origen, nunca la dirección: así la ruta secreta no sale ni hacia
  // las páginas públicas del mismo sitio (ni hacia su analítica).
  "Referrer-Policy": "strict-origin",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  // Una ventana del CRM no comparte contexto con la página que la abrió: un
  // script del sitio público que la abra con window.open no puede leerla.
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "Strict-Transport-Security": "max-age=31536000",
};

const ESTATICOS_PUBLICOS = /^\/(crm\.css|fuentes\/[a-z0-9-]+\.woff2)$/;
const ESTATICOS = /^\/(crm\.css|crm\.js|fuentes\/[a-z0-9-]+\.woff2)$/;

/**
 * La entrada desde worker/index.ts. Devuelve null si la petición no es del
 * CRM: entonces el sitio la atiende como siempre.
 */
export async function atenderCRM(request: Request, env: Env, opciones: Opciones): Promise<Response | null> {
  const ruta = rutaCRM(env);
  if (!ruta) return null;
  const externa = new URL(request.url);
  if (externa.pathname !== ruta && !externa.pathname.startsWith(`${ruta}/`)) return null;

  const url = new URL(externa);
  url.pathname = externa.pathname.slice(ruta.length) || "/";
  const c = nuevoCtx(env, request, url, ruta, opciones.avisar, opciones.esperar ?? (() => {}));
  try {
    const r = await atender(c, opciones);
    return conCabeceras(await conRuta(r, c));
  } catch (e) {
    console.error(JSON.stringify({ crm: "error", detalle: e instanceof Error ? e.message.slice(0, 300) : "?" }));
    return conCabeceras(new Response("Algo falló en el CRM. Vuelve a intentarlo en un momento.", { status: 500 }));
  }
}

function conCabeceras(r: Response): Response {
  const h = new Headers(r.headers);
  for (const [k, v] of Object.entries(CABECERAS)) h.set(k, v);
  if (!h.has("Cache-Control")) h.set("Cache-Control", "no-store");
  return new Response(r.body, { status: r.status, statusText: r.statusText, headers: h });
}

/**
 * Antepone la ruta secreta a las direcciones internas que salen: la de cada
 * redirección y, en las páginas, los `href`, `action` y `src` que empiezan con
 * «/». Y esconde el token anti-CSRF en cada formulario que escribe.
 *
 * El HTML de las páginas lo arma el propio CRM y todo lo que viene de un lead
 * llega escapado (las comillas como `&quot;`, `<` como `&lt;`), así que estos
 * reemplazos solo alcanzan los atributos que escribe el código.
 */
async function conRuta(r: Response, c: Ctx): Promise<Response> {
  const h = new Headers(r.headers);
  const destino = h.get("Location");
  if (destino && destino.startsWith("/") && !destino.startsWith("//")) h.set("Location", `${c.ruta}${destino}`);
  if (!(h.get("Content-Type") ?? "").startsWith("text/html") || !r.body) {
    return new Response(r.body, { status: r.status, statusText: r.statusText, headers: h });
  }
  let cuerpo = (await r.text()).replace(/\b(href|action|src)="\/(?!\/)/g, `$1="${c.ruta}/`);
  if (c.csrf) {
    cuerpo = cuerpo.replace(
      /<form\b[^>]*\bmethod="post"[^>]*>/g,
      (m) => `${m}<input type="hidden" name="_csrf" value="${c.csrf}">`,
    );
  }
  return new Response(cuerpo, { status: r.status, statusText: r.statusText, headers: h });
}

function htmlResponse(contenido: Html, status = 200, extra?: Record<string, string>): Response {
  return new Response(contenido.valor, { status, headers: { "Content-Type": "text/html; charset=utf-8", ...extra } });
}

function texto(t: string, status: number): Response {
  return new Response(t, { status, headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

async function atender(c: Ctx, opciones: Opciones): Promise<Response> {
  const { pathname } = c.url;
  const metodo = c.request.method;
  const vistaPrevia = esVistaPrevia(c.url);

  if (metodo === "GET" && ESTATICOS_PUBLICOS.test(pathname)) return estatico(c, opciones);

  // Solo navegaciones: un fetch() o un <iframe> de otra página, nunca.
  if (!(metodo === "GET" && ESTATICOS.test(pathname)) && !esNavegacion(c.request)) return prohibido();

  if (!(await existeTabla(c.db, "crm_sesiones")) || !(await existeTabla(c.db, "crm_ingresos"))) {
    return texto("Falta aplicar las migraciones 0006 y 0007 del CRM en esta base (ver crm/README.md).", 503);
  }

  // ── El acceso ──────────────────────────────────────────────────────────
  if (pathname === "/acceso" && metodo === "GET") {
    if (await sesionDe(c)) return volverA("/hoy");
    return htmlResponse(paginaAcceso({ hayClave: hayClave(c), vistaPrevia }));
  }
  if (pathname === "/acceso" && metodo === "POST") {
    if (!mismoOrigen(c)) return prohibido();
    const f = await formulario(c.request);
    if (!f) return prohibido();
    const r = await entrarConClave(c, String(f.get("clave") ?? ""));
    if (r.ok) {
      return new Response(null, { status: 303, headers: { Location: "/hoy", "Set-Cookie": r.cookie } });
    }
    return htmlResponse(paginaAcceso({ hayClave: hayClave(c), error: r.error, vistaPrevia }), r.estado);
  }

  // ── Todo lo demás exige sesión ─────────────────────────────────────────
  const sesion = await sesionDe(c);
  if (!sesion) {
    const navegador = metodo === "GET" && (c.request.headers.get("Accept") ?? "").includes("text/html");
    return navegador ? htmlResponse(paginaAcceso({ hayClave: hayClave(c), vistaPrevia }), 403) : texto("Sin sesión.", 403);
  }
  c.usuario = sesion.usuario;
  c.csrf = sesion.csrf;

  if (metodo === "GET") return await get(c, vistaPrevia, opciones);
  if (metodo === "POST") {
    if (!mismoOrigen(c)) return prohibido();
    const f = await formulario(c.request);
    if (!f || !iguales(String(f.get("_csrf") ?? ""), c.csrf)) return prohibido();
    return await post(c, f, vistaPrevia);
  }
  return new Response("Método no permitido.", { status: 405, headers: { Allow: "GET, POST" } });
}

function prohibido(): Response {
  return texto("No permitido.", 403);
}

/** El cuerpo del formulario, con tope de tamaño. */
async function formulario(request: Request): Promise<FormData | null> {
  const largo = Number(request.headers.get("Content-Length") ?? "0");
  if (largo > 64 * 1024) return null;
  const tipo = request.headers.get("Content-Type") ?? "";
  if (!tipo.startsWith("application/x-www-form-urlencoded") && !tipo.startsWith("multipart/form-data")) return null;
  try {
    return await request.formData();
  } catch {
    return null;
  }
}

/** La hoja de estilos, el script y las fuentes (crm/public, embebidos en el Worker). */
function estatico(c: Ctx, opciones: Opciones): Response {
  const p = c.url.pathname;
  // Llevan la versión en la dirección (?v=…): se pueden guardar en el
  // teléfono, pero nunca en un caché compartido.
  const cache = { "Cache-Control": "private, max-age=86400" };
  if (p === "/crm.css") return new Response(opciones.recursos.css, { headers: { "Content-Type": "text/css; charset=utf-8", ...cache } });
  if (p === "/crm.js") return new Response(opciones.recursos.js, { headers: { "Content-Type": "text/javascript; charset=utf-8", ...cache } });
  const fuente = opciones.recursos.fuentes[p.replace(/^\/fuentes\//, "").replace(/\.woff2$/, "")];
  if (fuente) return new Response(fuente, { headers: { "Content-Type": "font/woff2", ...cache } });
  return texto("No existe.", 404);
}

function id(texto: string | undefined): number | null {
  const n = Number.parseInt(texto ?? "", 10);
  return n > 0 && n < 1e9 ? n : null;
}

async function get(c: Ctx, vistaPrevia: boolean, opciones: Opciones): Promise<Response> {
  const ruta = c.url.pathname;
  if (ESTATICOS.test(ruta)) return estatico(c, opciones);
  if (ruta === "/" || ruta === "") return volverA("/hoy");

  // El enlace del aviso de Telegram: /c/<id de la consulta>. Si la consulta
  // todavía no entró, se ingiere un tramo y se vuelve a pedir la misma
  // dirección (cada petición tiene su propio tope de 50 sentencias), hasta 10
  // veces.
  let m = ruta.match(/^\/c\/(\d+)$/);
  if (m) {
    const consulta = id(m[1]);
    if (!consulta) return volverA("/hoy");
    const ficha = await contactoDeConsulta(c.db, consulta);
    if (ficha) return volverA(`/contacto/${ficha}`);
    const vuelta = Number.parseInt(c.url.searchParams.get("n") ?? "0", 10) || 0;
    if (vuelta < 10 && (await ingerir(c.db)) > 0) return volverA(`/c/${consulta}`, { n: String(vuelta + 1) });
    return volverA("/hoy");
  }

  // Lo nuevo del sitio entra antes de mostrar cualquier lista o ficha. Si
  // llegaron muchas consultas juntas (la primera vez, por ejemplo), se ingiere
  // un tramo por petición y se vuelve a pedir la misma página hasta ponerse al
  // día: cada petición tiene su propio tope de 50 sentencias.
  const leidas = await ingerir(c.db);
  const vuelta = Number.parseInt(c.url.searchParams.get("_i") ?? "0", 10) || 0;
  if (leidas >= POR_PETICION && vuelta < 20) {
    const u = new URL(c.url);
    u.searchParams.set("_i", String(vuelta + 1));
    return volverA(`${u.pathname}${u.search}`);
  }
  if (vuelta > 0) {
    const u = new URL(c.url);
    u.searchParams.delete("_i");
    return volverA(`${u.pathname}${u.search}`);
  }

  if (ruta === "/hoy") return htmlResponse(await paginaHoy(c, vistaPrevia));
  if (ruta === "/leads") return htmlResponse(await paginaLeads(c, "compra", vistaPrevia));
  if (ruta === "/propietarios") return htmlResponse(await paginaLeads(c, "venta", vistaPrevia));
  if (ruta === "/nuevo") return htmlResponse(paginaAlta(c, vistaPrevia));
  if (ruta === "/boletin") return htmlResponse(await paginaBoletin(c, vistaPrevia));
  if (ruta === "/boletin/activos.csv") return csvBoletin(c);
  if (ruta === "/mas") return htmlResponse(paginaMas(c, vistaPrevia));
  if (ruta === "/auditoria") return htmlResponse(await paginaAuditoria(c, vistaPrevia));

  m = ruta.match(/^\/contacto\/(\d+)(\/exportar)?$/);
  if (m) {
    const contacto = id(m[1]);
    if (contacto) {
      if (m[2]) return exportarContacto(c, contacto);
      const p = await paginaFicha(c, contacto, vistaPrevia);
      if (p) return htmlResponse(p);
    }
  }
  return noEncontrado(c, vistaPrevia);
}

async function post(c: Ctx, f: FormData, vistaPrevia: boolean): Promise<Response> {
  const ruta = c.url.pathname;
  if (ruta === "/salir") {
    return new Response(null, { status: 303, headers: { Location: "/acceso", "Set-Cookie": await salir(c) } });
  }
  if (ruta === "/salir/todo") {
    return new Response(null, { status: 303, headers: { Location: "/acceso", "Set-Cookie": await salirDeTodo(c) } });
  }
  if (ruta === "/nuevo") {
    const r = await altaManual(c, f);
    return r instanceof Response ? r : htmlResponse(paginaAlta(c, vistaPrevia, r), 422);
  }

  let m = ruta.match(/^\/contacto\/(\d+)\/(nota|tarea|datos|oportunidad|reclamo|suprimir)$/);
  if (m) {
    const contacto = id(m[1]);
    if (!contacto) return volverA("/hoy");
    switch (m[2]) {
      case "nota":
        return registrarActividad(c, contacto, f);
      case "tarea":
        return crearTarea(c, contacto, f);
      case "datos":
        return editarDatos(c, contacto, f);
      case "oportunidad":
        return nuevaOportunidad(c, contacto, f);
      case "reclamo":
        return marcarReclamo(c, contacto, f);
      case "suprimir":
        return suprimir(c, contacto, f);
    }
  }
  m = ruta.match(/^\/oportunidad\/(\d+)\/(etapa|puntaje|detalle)$/);
  if (m) {
    const op = id(m[1]);
    if (!op) return volverA("/hoy");
    if (m[2] === "etapa") return cambiarEtapa(c, op, f);
    if (m[2] === "puntaje") return cambiarPuntaje(c, op, f);
    return guardarDetalle(c, op, f);
  }
  m = ruta.match(/^\/tarea\/(\d+)\/hecha$/);
  if (m) {
    const t = id(m[1]);
    return t ? cerrarTarea(c, t, f) : volverA("/hoy");
  }
  m = ruta.match(/^\/boletin\/(\d+)\/(baja|reactivar)$/);
  if (m) {
    const s = id(m[1]);
    if (!s) return volverA("/boletin");
    return m[2] === "baja" ? bajaBoletin(c, s) : reactivarBoletin(c, s);
  }
  return noEncontrado(c, vistaPrevia);
}

function noEncontrado(c: Ctx, vistaPrevia: boolean): Response {
  return htmlResponse(
    pagina({
      titulo: "No encontrada",
      seccion: null,
      url: c.url,
      vistaPrevia,
      cuerpo: html`<h1 class="titulo">No encontré esa página</h1><p><a class="boton" href="/hoy">Volver a Hoy</a></p>`,
    }),
    404,
  );
}
