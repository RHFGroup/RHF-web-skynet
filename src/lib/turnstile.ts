/**
 * Turnstile, la verificación antibot de Cloudflare: lo que comparten los
 * formularios (contacto, guía y boletín).
 *
 * La site key es pública a propósito: viaja en el HTML. La secreta vive como
 * secret del Worker (`TURNSTILE_SECRET`) y valida cada token contra
 * `siteverify`.
 *
 * `NEXT_PUBLIC_TURNSTILE_SITE_KEY` la reemplaza en un build local, para probar
 * con las claves de prueba de Cloudflare (la real solo sirve en rhfliving.com y
 * en las vistas previas de workers.dev). En Workers Builds no existe: sale la
 * real.
 */
export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "0x4AAAAAAE8W_1D4uDCgIB5S";

/** El script de Turnstile. El mismo `src` en todos los formularios: se descarga una sola vez. */
export const TURNSTILE_SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js";

declare global {
  interface Window {
    turnstile?: { reset: (contenedor?: HTMLElement) => void };
  }
}
