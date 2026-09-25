"use client";

import type { ReactNode } from "react";
import { useReveal } from "@/lib/motion";

/**
 * Revela un grupo de elementos escalonados cuando el GRUPO entra en pantalla.
 *
 * Existe por los carruseles del teléfono: con un `Reveal` por tarjeta, las que
 * quedan a la derecha, fuera de la vista, nunca «entran» y se quedaban
 * invisibles, así que no asomaba la siguiente tarjeta que invita a deslizar.
 * Aquí manda el grupo; los hijos entran escalonados con `--i` (CSS `.stagger`
 * de globals.css). Mismo contrato que `Reveal`: el HTML sale visible.
 */
export default function RevealGrupo({ className = "", children }: { className?: string; children: ReactNode }) {
  const { ref, armed, visible } = useReveal<HTMLDivElement>(0.12);
  return (
    <div
      ref={ref}
      data-revela=""
      className={[className, armed ? "stagger" : "", visible ? "is-visible" : ""].filter(Boolean).join(" ")}
    >
      {children}
    </div>
  );
}
