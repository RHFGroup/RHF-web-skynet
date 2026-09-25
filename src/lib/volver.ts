/**
 * «Volver a la cartera» que vuelve de verdad al mismo punto.
 *
 * Si la persona llegó a la página de un proyecto desde la cartera de la home,
 * el botón de volver usa el historial del navegador, que devuelve la página
 * en la misma posición de scroll. Si llegó por un enlace de WhatsApp o de un
 * buscador, no hay a dónde «volver»: el botón la lleva a la cartera.
 *
 * La marca vive en sessionStorage (una pestaña, se borra sola). Si el
 * navegador no deja escribir —modo privado estricto—, todo sigue funcionando
 * con el enlace normal.
 */
const CLAVE = "rhf:desde-cartera";
const VIGENCIA_MS = 30 * 60 * 1000;

export function marcarSalidaDesdeCartera(): void {
  try {
    sessionStorage.setItem(CLAVE, String(Date.now()));
  } catch {
    /* sin almacenamiento: queda el enlace normal */
  }
}

/** ¿La persona vino desde la cartera en esta misma pestaña, hace poco? */
export function vieneDeLaCartera(): boolean {
  try {
    const marca = Number(sessionStorage.getItem(CLAVE) ?? 0);
    return marca > 0 && Date.now() - marca < VIGENCIA_MS;
  } catch {
    return false;
  }
}

export function olvidarSalida(): void {
  try {
    sessionStorage.removeItem(CLAVE);
  } catch {
    /* nada que olvidar */
  }
}
