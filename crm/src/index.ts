/**
 * El CRM interno de RHF: crm.rhfliving.com (1-oct-2026, Prompt 3 de Luciano,
 * fase 2).
 *
 * Una ficha por persona con todo lo que llegó por el sitio (formularios,
 * /vender, guía, simulador, WhatsApp y chat del agente), las etapas de
 * compradores y propietarios, notas, tareas, el boletín y las herramientas de
 * la Ley 1581.
 *
 * Seguridad, en el servidor y en cada ruta:
 *  - sin sesión, todo responde 403 (la página de acceso, si es un navegador);
 *  - toda escritura exige el mismo origen;
 *  - CSP estricta: solo el script y la hoja de estilos propios, sin nada en línea;
 *  - fuera de los buscadores (noindex, robots.txt) y sin analítica;
 *  - lo que escribe un lead se escapa siempre (src/html.ts).
 */
import type { Env } from "./env";
import { nuevoCtx, esVistaPrevia, existeTabla, type Ctx } from "./base";
import { sesionDe, mismoOrigen, pedirCodigo, entrar, salir, salirDeTodo } from "./acceso";
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
import { mandarResumen } from "./resumen";

/** Las cabeceras de seguridad de todas las respuestas. */
const CABECERAS: Record<string, string> = {
  "Content-Security-Policy":
    "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; " +
    "connect-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "Referrer-Policy": "same-origin",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "Strict-Transport-Security": "max-age=31536000",
};

function conCabeceras(r: Response): Response {
  const h = new Headers(r.headers);
  for (const [k, v] of Object.entries(CABECERAS)) h.set(k, v);
  if (!h.has("Cache-Control")) h.set("Cache-Control", "no-store");
  return new Response(r.body, { status: r.status, statusText: r.statusText, headers: h });
}

function htmlResponse(contenido: Html, status = 200, extra?: Record<string, string>): Response {
  return new Response(contenido.valor, { status, headers: { "Content-Type": "text/html; charset=utf-8", ...extra } });
}

const ESTATICOS_PUBLICOS = /^\/(crm\.css|fuentes\/[a-z0-9-]+\.woff2)$/;
const ESTATICOS = /^\/(crm\.css|crm\.js|fuentes\/[a-z0-9-]+\.woff2)$/;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      return conCabeceras(await atender(request, env));
    } catch (e) {
      console.error(JSON.stringify({ crm: "error", detalle: e instanceof Error ? e.message.slice(0, 300) : "?" }));
      return conCabeceras(new Response("Algo falló en el CRM. Vuelve a intentarlo en un momento.", { status: 500 }));
    }
  },

  // El resumen del día (ver crm/wrangler.jsonc).
  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(mandarResumen(env));
  },
} satisfies ExportedHandler<Env>;

async function atender(request: Request, env: Env): Promise<Response> {
  const c = nuevoCtx(env, request);
  const { pathname } = c.url;
  const metodo = request.method;
  const vistaPrevia = esVistaPrevia(c.url);

  if (pathname === "/robots.txt") {
    return new Response("User-agent: *\nDisallow: /\n", { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
  if (metodo === "GET" && ESTATICOS_PUBLICOS.test(pathname)) return estatico(c);

  if (!(await existeTabla(c.db, "crm_sesiones"))) {
    return new Response("Falta aplicar la migración 0006 del CRM en esta base (ver crm/README.md).", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  // ── El acceso ──────────────────────────────────────────────────────────
  if (pathname === "/acceso" && metodo === "GET") {
    if (await sesionDe(c)) return volverA("/hoy");
    return htmlResponse(paginaAcceso({ paso: c.url.searchParams.get("paso") === "codigo" ? "codigo" : "inicio", vistaPrevia }));
  }
  if (pathname === "/acceso/codigo" && metodo === "POST") {
    if (!mismoOrigen(c)) return prohibido();
    const r = await pedirCodigo(c);
    if (r.ok) return volverA("/acceso", { paso: "codigo" });
    return htmlResponse(paginaAcceso({ paso: "inicio", error: r.error, vistaPrevia }), 429);
  }
  if (pathname === "/acceso/entrar" && metodo === "POST") {
    if (!mismoOrigen(c)) return prohibido();
    const f = await formulario(request);
    if (!f) return prohibido();
    const r = await entrar(c, String(f.get("codigo") ?? ""));
    if (r.ok) {
      return new Response(null, { status: 303, headers: { Location: "/hoy", "Set-Cookie": r.cookie } });
    }
    return htmlResponse(paginaAcceso({ paso: "codigo", error: r.error, vistaPrevia }), 401);
  }

  // ── Todo lo demás exige sesión ─────────────────────────────────────────
  const usuario = await sesionDe(c);
  if (!usuario) {
    const navegador = metodo === "GET" && (request.headers.get("Accept") ?? "").includes("text/html");
    return navegador
      ? htmlResponse(paginaAcceso({ paso: "inicio", vistaPrevia }), 403)
      : new Response("Sin sesión.", { status: 403, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
  c.usuario = usuario;

  if (metodo === "GET") return await get(c, vistaPrevia);
  if (metodo === "POST") {
    if (!mismoOrigen(c)) return prohibido();
    const f = await formulario(request);
    if (!f) return prohibido();
    return await post(c, f, vistaPrevia);
  }
  return new Response("Método no permitido.", { status: 405, headers: { Allow: "GET, POST" } });
}

function prohibido(): Response {
  return new Response("No permitido.", { status: 403, headers: { "Content-Type": "text/plain; charset=utf-8" } });
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

async function estatico(c: Ctx): Promise<Response> {
  const r = await c.env.ASSETS.fetch(c.request);
  const h = new Headers(r.headers);
  // Los archivos llevan la versión en la dirección (?v=…): se pueden guardar
  // en el teléfono, pero nunca en un caché compartido.
  h.set("Cache-Control", "private, max-age=86400");
  return new Response(r.body, { status: r.status, headers: h });
}

function id(texto: string | undefined): number | null {
  const n = Number.parseInt(texto ?? "", 10);
  return n > 0 && n < 1e9 ? n : null;
}

async function get(c: Ctx, vistaPrevia: boolean): Promise<Response> {
  const ruta = c.url.pathname;
  if (ESTATICOS.test(ruta)) return estatico(c);
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
