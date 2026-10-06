/**
 * Las piezas de seguridad que no dependen de nada más (así se prueban con
 * `node --test`, ver crm/test/): la ruta secreta, Fetch Metadata y el token
 * anti-CSRF. Las usan src/base.ts, src/acceso.ts y src/index.ts.
 */

/**
 * «/r/» y de 16 a 64 letras, números, «-» o «_». El «/r/» es lo único que
 * aparece en wrangler.jsonc (`run_worker_first`): sin eso, el sitio responde su
 * página 404 sin llegar al Worker. Lo que sigue es el secreto.
 */
const RUTA_VALIDA = /^\/r\/[A-Za-z0-9_-]{16,64}$/;

/** La ruta secreta del CRM (el secreto `CRM_RUTA`), si está bien configurada. Sin ella, el CRM no existe. */
export function rutaCRM(env: { CRM_RUTA?: string }): string | null {
  const r = (env.CRM_RUTA ?? "").trim();
  return RUTA_VALIDA.test(r) ? r : null;
}

/**
 * ¿Es una navegación de verdad? Las páginas, las exportaciones y los envíos de
 * formulario solo se entregan a la pestaña que navega: un `fetch()` hecho por
 * un script de una página pública (Sec-Fetch-Mode: cors o same-origin) o un
 * `<iframe>` (Sec-Fetch-Dest: iframe) reciben 403. Los navegadores viejos que
 * no mandan estas cabeceras pasan: para ellos quedan la sesión, el origen y el
 * token.
 */
export function esNavegacion(request: Request): boolean {
  const modo = request.headers.get("Sec-Fetch-Mode");
  const destino = request.headers.get("Sec-Fetch-Dest");
  if (modo === null && destino === null) return true;
  return modo === "navigate" && (destino === null || destino === "document");
}

const cod = new TextEncoder();

export async function sha256(texto: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", cod.encode(texto));
  return [...new Uint8Array(d)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

/** El token anti-CSRF de una sesión: sale del token de la cookie, que ningún script puede leer. */
export async function csrfDe(token: string): Promise<string> {
  return (await sha256(`csrf|${token}`)).slice(0, 32);
}

/** Comparación en tiempo constante. */
export function iguales(a: string, b: string): boolean {
  const x = cod.encode(a);
  const y = cod.encode(b);
  if (x.byteLength !== y.byteLength) return false;
  let r = 0;
  for (let i = 0; i < x.byteLength; i++) r |= x[i] ^ y[i];
  return r === 0;
}
