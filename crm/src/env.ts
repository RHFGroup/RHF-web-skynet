/**
 * Lo que el Worker del CRM recibe de Cloudflare (ver crm/wrangler.jsonc).
 */

/** Lo que expone el Worker del sitio para el CRM (`Avisos` en worker/index.ts). */
export interface Avisos {
  /** Manda un mensaje (HTML de Telegram) al chat de Rafael. Nunca lanza. */
  telegram(html: string): Promise<{ ok: boolean; motivo?: string }>;
}

export interface Env {
  /** La base del sitio y del CRM: rhf-leads. */
  DB: D1Database;
  /** La base de las vistas previas: rhf-leads-preview. Ver `baseDe`. */
  DB_PREVIEW?: D1Database;
  /** La hoja de estilos, el script y las fuentes (crm/public). */
  ASSETS: Fetcher;
  /** El Worker del sitio, que manda los avisos de Telegram. */
  AVISOS: Avisos;
  /**
   * Solo para probar en local (.dev.vars): el código de acceso sale también
   * en la consola. Nunca existe en producción ni en las vistas previas, y el
   * Worker lo ignora fuera de 127.0.0.1 y localhost.
   */
  CRM_CODIGO_EN_CONSOLA?: string;
}
