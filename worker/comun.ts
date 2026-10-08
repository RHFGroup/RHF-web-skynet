/**
 * Lo que comparten los endpoints del Worker (30-sep-2026): el origen permitido,
 * las respuestas JSON, los topes, Turnstile y la base de cada petición.
 *
 * Estaba en worker/index.ts; salió a este archivo cuando el boletín pasó a su
 * propio módulo (worker/boletin.ts), para que los dos lo usen sin importarse
 * entre sí.
 */
import type { Env } from "./index";

/**
 * Orígenes que pueden postear, ADEMÁS del propio.
 *
 * La regla principal es «mismo origen que esta petición», que cubre sola
 * producción, cada preview de Cloudflare y cualquier servidor local en
 * cualquier puerto. Una lista blanca de dominios y puertos parece más estricta
 * pero envejece mal: el primer preview con un hash nuevo, o un `wrangler dev`
 * en otro puerto, quedan afuera y el formulario devuelve 403 en silencio —
 * pasó en la prueba del 18-sep con el puerto 8787.
 *
 * Esta lista queda solo para el par apex/www, que son orígenes distintos para
 * el navegador aunque sirvan la misma página.
 */
const ORIGENES_EXTRA = new Set([
  "https://rhfliving.com",
  "https://www.rhfliving.com",
]);

/** Topes de tamaño. Un campo más largo que esto es ruido o ataque. */
export const LIMITES = {
  cuerpo: 16 * 1024,
  nombre: 120,
  contacto: 160,
  proyecto: 80,
  mensaje: 2000,
  origen: 200,
  userAgent: 400,
  version: 32,
} as const;

/** Envíos permitidos desde una misma IP en la ventana de abajo. */
export const TOPE_POR_IP = 5;
export const VENTANA_MINUTOS = 10;

export async function verificarTurnstile(
  secreto: string,
  token: string,
  ip: string | null,
  /** La acción del widget (`data-action`). Si se pasa, un token de otro
   *  widget con nombre no sirve: el del boletín no vale para otro formulario,
   *  ni al revés. */
  accion?: string,
): Promise<boolean> {
  if (!token) return false;
  const datos = new FormData();
  datos.append("secret", secreto);
  datos.append("response", token);
  if (ip) datos.append("remoteip", ip);
  try {
    const r = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body: datos },
    );
    const j = (await r.json()) as { success?: boolean; action?: string };
    // Los tokens de prueba de Cloudflare (y los widgets sin acción) no traen
    // `action`: solo se rechaza el de otro widget con nombre.
    if (accion && j.action && j.action !== accion) return false;
    return j.success === true;
  } catch {
    return false;
  }
}

export function origenPermitido(request: Request): boolean {
  const origen = request.headers.get("Origin");
  // Sin cabecera Origin no es un envío del formulario desde un navegador: los
  // navegadores la mandan siempre en un POST, también cuando es del mismo sitio.
  if (!origen) return false;
  try {
    if (origen === new URL(request.url).origin) return true;
  } catch {
    /* url rara: cae a la lista de abajo */
  }
  return ORIGENES_EXTRA.has(origen);
}

export function cabecerasCors(request: Request): Record<string, string> {
  const origen = request.headers.get("Origin");
  if (!origen || !origenPermitido(request)) return {};
  return {
    "Access-Control-Allow-Origin": origen,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

export function texto(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export function json(
  cuerpo: unknown,
  status: number,
  request?: Request,
): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...(request ? cabecerasCors(request) : {}),
    },
  });
}

/** Escapa lo que el HTML interpreta: los avisos de Telegram y los correos del boletín. */
export function esc(v: string): string {
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * ¿La petición llegó a una vista previa de Workers Builds? Una vista previa es
 * `<versión o rama>-rhf-web-skynet.<subdominio>.workers.dev`. El `workers.dev`
 * de producción (sin prefijo), rhfliving.com y el servidor local no lo son.
 */
export function esVistaPrevia(request: Request): boolean {
  const host = new URL(request.url).hostname;
  return /^[a-z0-9-]+-rhf-web-skynet\.[a-z0-9-]+\.workers\.dev$/.test(host);
}

/**
 * La base de cada petición (30-sep-2026, auditoría del 29-sep, AS-11): las
 * vistas previas escriben en `rhf-leads-preview` (binding `DB_PREVIEW`), no en
 * la de producción. Así una prueba nunca queda entre los leads reales. Si el
 * binding no existe, todo va a `DB`, como antes.
 */
export function baseDe(env: Env, request: Request): D1Database {
  return env.DB_PREVIEW && esVistaPrevia(request) ? env.DB_PREVIEW : env.DB;
}
