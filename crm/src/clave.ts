/**
 * La clave del CRM (6-oct-2026, pedido de Rafael: «que pida clave»).
 *
 * La clave no se guarda en ninguna parte. Se guarda su huella en el secreto
 * `CRM_CLAVE` de Cloudflare, con este formato:
 *
 *   pbkdf2-sha256$<iteraciones>$<sal en base64url>$<hash de 32 bytes en base64url>
 *
 * La pone crm/dev/poner-clave.mjs, que la pide en un cuadro del Mac: ni Claude
 * ni los registros la ven.
 *
 * PBKDF2 con SHA-256 porque es lo que trae WebCrypto en los Workers. Las
 * iteraciones son pocas para un servidor propio a propósito: el plan gratis da
 * 10 ms de CPU por petición, y 20.000 iteraciones caben con margen. Lo que
 * protege de verdad es otra cosa: la huella vive en un secreto que nadie puede
 * leer de vuelta, la ruta es secreta, y los intentos tienen tope (src/acceso.ts).
 */

/** Las que usa crm/dev/poner-clave.mjs. Las que acepta la verificación van de 10.000 a 100.000. */
export const ITERACIONES = 20_000;

const cod = new TextEncoder();

export function aBase64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function deBase64url(texto: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]*$/.test(texto)) return null;
  try {
    const s = atob(texto.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((texto.length + 3) % 4));
    return Uint8Array.from(s, (ch) => ch.charCodeAt(0));
  } catch {
    return null;
  }
}

/** Comparación en tiempo constante. */
export function igualesBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.byteLength !== b.byteLength) return false;
  let r = 0;
  for (let i = 0; i < a.byteLength; i++) r |= a[i] ^ b[i];
  return r === 0;
}

async function derivar(clave: string, sal: Uint8Array, iteraciones: number): Promise<Uint8Array> {
  // NFC: una tilde escrita en el Mac y en el iPhone da los mismos bytes.
  const llave = await crypto.subtle.importKey("raw", cod.encode(clave.normalize("NFC")), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: sal, iterations: iteraciones }, llave, 256);
  return new Uint8Array(bits);
}

/** ¿La huella tiene la forma correcta? (Sin ella, el CRM dice que falta configurar la clave.) */
export function huellaValida(huella: string | undefined): boolean {
  return leerHuella(huella) !== null;
}

function leerHuella(huella: string | undefined): { iteraciones: number; sal: Uint8Array; hash: Uint8Array } | null {
  const partes = (huella ?? "").trim().split("$");
  if (partes.length !== 4 || partes[0] !== "pbkdf2-sha256") return null;
  const iteraciones = Number(partes[1]);
  if (!Number.isInteger(iteraciones) || iteraciones < 10_000 || iteraciones > 100_000) return null;
  const sal = deBase64url(partes[2]);
  const hash = deBase64url(partes[3]);
  if (!sal || sal.byteLength < 16 || !hash || hash.byteLength !== 32) return null;
  return { iteraciones, sal, hash };
}

/** ¿La clave corresponde a la huella? */
export async function claveCorrecta(clave: string, huella: string | undefined): Promise<boolean> {
  const h = leerHuella(huella);
  if (!h || !clave || clave.length > 200) return false;
  return igualesBytes(await derivar(clave, h.sal, h.iteraciones), h.hash);
}

/** Arma una huella nueva. La usan las pruebas; en producción la pone crm/dev/poner-clave.mjs. */
export async function huellaDe(clave: string, iteraciones = ITERACIONES): Promise<string> {
  const sal = new Uint8Array(16);
  crypto.getRandomValues(sal);
  const hash = await derivar(clave, sal, iteraciones);
  return `pbkdf2-sha256$${iteraciones}$${aBase64url(sal)}$${aBase64url(hash)}`;
}
