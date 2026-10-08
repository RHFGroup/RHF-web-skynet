/**
 * Lo que el CRM recibe del Worker del sitio (worker/index.ts), que lo monta en
 * su ruta secreta desde el 6-oct-2026 (pedido de Rafael: «un link de
 * rhfliving.com que pida clave»).
 */

/** Manda un mensaje (HTML de Telegram) al chat de los avisos. Nunca lanza. */
export type Avisar = (html: string) => Promise<{ ok: boolean; motivo?: string }>;

/** La hoja de estilos, el script y las fuentes de crm/public, ya cargados. */
export interface Recursos {
  css: string;
  js: string;
  /** Por nombre de archivo, sin la extensión: «cormorant-garamond», «montserrat». */
  fuentes: Record<string, ArrayBuffer | Uint8Array>;
}

export interface Env {
  /** La base del sitio y del CRM: rhf-leads. */
  DB: D1Database;
  /** La base de las vistas previas: rhf-leads-preview. Ver `baseDe`. */
  DB_PREVIEW?: D1Database;
  /**
   * La ruta secreta del CRM, por ejemplo «/r/k3m9…»: «/r/» y de 16 a 64
   * letras, números, «-» o «_». Es un secreto de Cloudflare y no va en el
   * código, porque el repo es público. Sin ella, el CRM no existe: cualquier
   * dirección sigue siendo del sitio.
   */
  CRM_RUTA?: string;
  /**
   * La huella de la clave de Rafael, `pbkdf2-sha256$<iteraciones>$<sal>$<hash>`
   * (ver crm/dev/poner-clave.mjs). La clave misma no se guarda en ninguna parte.
   * Sin la huella, nadie puede entrar.
   */
  CRM_CLAVE?: string;
}

/** Lo que el Worker del sitio le pasa al CRM en cada petición. */
export interface Opciones {
  avisar: Avisar;
  recursos: Recursos;
  /** Para lo que puede terminar después de responder (el aviso de una sesión nueva). */
  esperar?: (p: Promise<unknown>) => void;
}
