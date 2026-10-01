"use client";

/**
 * «Preferencias de cookies», en el pie: vuelve a mostrar el aviso para que la
 * persona cambie su decisión (Ley 1581: la autorización se puede revocar).
 * Solo aparece cuando hay con qué medir: GTM o GA4 directo (src/data/analitica.ts).
 *
 * 29-sep-2026 (sitio en inglés): el texto va en el idioma de la página.
 */
import { HAY_ANALITICA } from "@/data/analitica";
import type { Idioma } from "@/i18n/idioma";

const TEXTOS = {
  es: { texto: "Preferencias de cookies" },
  en: { texto: "Cookie preferences" },
} satisfies Record<Idioma, Record<string, string>>;

export default function BotonCookies({ texto, idioma = "es" }: { texto?: string; idioma?: Idioma }) {
  if (!HAY_ANALITICA) return null;
  return (
    <>
      {" · "}
      <button
        type="button"
        className="boton-cookies"
        onClick={() => window.dispatchEvent(new Event("rhf-preferencias-cookies"))}
      >
        {texto ?? TEXTOS[idioma].texto}
      </button>
    </>
  );
}
