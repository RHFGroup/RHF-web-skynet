"use client";

import Link from "next/link";
import { IconoFlechaIzq } from "@/components/Iconos";
import { olvidarSalida, vieneDeLaCartera } from "@/lib/volver";

/**
 * «Volver a la cartera». Si la persona vino desde la cartera en esta misma
 * pestaña, vuelve con el historial: la home reaparece donde la dejó. Si llegó
 * por un enlace compartido, la lleva a la cartera.
 */
export default function VolverACartera({ className = "pp-volver" }: { className?: string }) {
  return (
    <Link
      href="/#cartera"
      className={className}
      onClick={(e) => {
        if (vieneDeLaCartera() && window.history.length > 1) {
          e.preventDefault();
          olvidarSalida();
          window.history.back();
        }
      }}
    >
      <IconoFlechaIzq size={16} /> Volver a la cartera
    </Link>
  );
}
