"use client";

/**
 * «Preferencias de cookies», en el pie: vuelve a mostrar el aviso para que la
 * persona cambie su decisión (Ley 1581: la autorización se puede revocar).
 * Solo aparece cuando hay contenedor de GTM (src/data/analitica.ts).
 */
import { GTM_ID } from "@/data/analitica";

export default function BotonCookies({ texto = "Preferencias de cookies" }: { texto?: string }) {
  if (!GTM_ID) return null;
  return (
    <>
      {" · "}
      <button
        type="button"
        className="boton-cookies"
        onClick={() => window.dispatchEvent(new Event("rhf-preferencias-cookies"))}
      >
        {texto}
      </button>
    </>
  );
}
