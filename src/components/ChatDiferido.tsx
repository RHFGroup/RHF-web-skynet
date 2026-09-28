"use client";

/**
 * El chat, después de que la página terminó de cargar.
 *
 * Auditoría del 25-sep-2026 (W-1): el widget y su conexión competían con la
 * portada en los primeros segundos del teléfono. Ahora el chat se monta cuando
 * la página ya cargó y el navegador queda libre (o a los 4 s, lo que pase
 * primero). La burbuja aparece un par de segundos más tarde; lo demás no cambia.
 */
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const AgentChat = dynamic(() => import("@/components/AgentChat"), { ssr: false });

export default function ChatDiferido() {
  const [listo, setListo] = useState(false);

  useEffect(() => {
    let cancelado = false;
    let idle = 0;
    let espera = 0;
    const montar = () => {
      if (!cancelado) setListo(true);
    };
    const programar = () => {
      // Safari no tiene requestIdleCallback: ahí basta con esperar un poco.
      if (typeof window.requestIdleCallback === "function") {
        idle = window.requestIdleCallback(montar, { timeout: 4000 });
      } else {
        espera = window.setTimeout(montar, 2500);
      }
    };
    if (document.readyState === "complete") programar();
    else window.addEventListener("load", programar, { once: true });
    return () => {
      cancelado = true;
      window.removeEventListener("load", programar);
      if (idle && typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idle);
      window.clearTimeout(espera);
    };
  }, []);

  return listo ? <AgentChat /> : null;
}
