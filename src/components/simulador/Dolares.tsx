"use client";

/**
 * La referencia en dólares de las cifras que cambian mientras la persona
 * mueve el simulador.
 *
 * El resto del sitio la pone con `data-cop` (ReferenciaDolares.tsx), que
 * vuelve a pintar cuando cambian los nodos de la página, no cuando cambia el
 * texto de una cifra: en el simulador quedaría la referencia de la cifra
 * anterior. Aquí se calcula con la misma TRM del día y el mismo formato, solo
 * si la persona eligió ver dólares, y siempre como referencia: el precio es
 * en pesos (Ley 1480, art. 26).
 */
import { useEffect, useState } from "react";
import { EVENTO_MONEDA, formatoDolares, monedaActual, obtenerTRM, type TRM } from "@/lib/moneda";
import { useSim } from "@/components/simulador/contexto";

/** La TRM del día si la persona eligió ver dólares; null si no. */
export function useReferenciaUSD(): TRM | null {
  const [trm, setTrm] = useState<TRM | null>(null);
  useEffect(() => {
    let vivo = true;
    const activar = async () => {
      if (monedaActual() !== "USD") {
        if (vivo) setTrm(null);
        return;
      }
      const t = await obtenerTRM();
      if (vivo) setTrm(t);
    };
    activar();
    window.addEventListener(EVENTO_MONEDA, activar);
    return () => {
      vivo = false;
      window.removeEventListener(EVENTO_MONEDA, activar);
    };
  }, []);
  return trm;
}

/** «≈ US$113.700» debajo de una cifra en pesos. */
export function Usd({ cop }: { cop: number }) {
  const { trmUSD, idioma } = useSim();
  if (!trmUSD || !(cop > 0) || !Number.isFinite(cop)) return null;
  return (
    <small className="sim-usd">
      ≈ {formatoDolares(cop / trmUSD.valor, idioma)}
      {idioma === "en" ? " reference" : ""}
    </small>
  );
}
