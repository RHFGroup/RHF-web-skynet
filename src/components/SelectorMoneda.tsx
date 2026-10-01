"use client";

/**
 * El selector de moneda del menú (29-sep-2026, informe de Luciano).
 *
 * COP muestra los precios como siempre, en pesos. USD suma, debajo de cada
 * precio en pesos, su referencia aproximada en dólares con la TRM del día
 * (ReferenciaDolares.tsx). Los pesos nunca desaparecen: son el precio
 * (Ley 1480, art. 26).
 *
 * Arranca en COP en el servidor y se ajusta al montar con lo que ya dejó el
 * script de <head> en <html data-moneda>: así el HTML del build y el del
 * navegador coinciden y React no se queja al hidratar.
 *
 * 29-sep-2026 (sitio en inglés): la etiqueta va en el idioma de la página;
 * COP y USD quedan igual en los dos.
 */
import { useEffect, useState } from "react";
import type { Idioma } from "@/i18n/idioma";
import { EVENTO_MONEDA, fijarMoneda, monedaActual, type Moneda } from "@/lib/moneda";
import "@/styles/moneda.css";

const TEXTOS = {
  es: { etiqueta: "Moneda de los precios" },
  en: { etiqueta: "Price currency" },
} satisfies Record<Idioma, Record<string, string>>;

export default function SelectorMoneda({
  className = "",
  etiqueta,
  idioma = "es",
}: {
  className?: string;
  etiqueta?: string;
  idioma?: Idioma;
}) {
  const [moneda, setMoneda] = useState<Moneda>("COP");

  useEffect(() => {
    setMoneda(monedaActual());
    const alCambiar = (e: Event) => setMoneda((e as CustomEvent<Moneda>).detail);
    window.addEventListener(EVENTO_MONEDA, alCambiar);
    return () => window.removeEventListener(EVENTO_MONEDA, alCambiar);
  }, []);

  return (
    <div className={`selector-moneda ${className}`.trim()} role="group" aria-label={etiqueta ?? TEXTOS[idioma].etiqueta}>
      {(["COP", "USD"] as const).map((m) => (
        <button
          key={m}
          type="button"
          aria-pressed={moneda === m}
          onClick={() => {
            fijarMoneda(m);
            setMoneda(m);
          }}
        >
          {m}
        </button>
      ))}
    </div>
  );
}
