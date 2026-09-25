"use client";

import type { ReactNode } from "react";
import { useReveal } from "@/lib/motion";

type Variant = "up" | "left" | "zoom" | "blur";

/**
 * Revela su contenido cuando entra al viewport. `delay` escalona (stagger)
 * varios hermanos. Con reduced-motion aparece de una, sin transición.
 */
export default function Reveal({
  children,
  className = "",
  delay = 0,
  variant = "up",
  threshold = 0.15,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: Variant;
  threshold?: number;
}) {
  const { ref, armed, visible } = useReveal<HTMLDivElement>(threshold);

  return (
    <div
      ref={ref}
      data-revela=""
      className={[
        armed ? "reveal" : "",
        armed ? `reveal-${variant}` : "",
        visible ? "is-visible" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={armed && delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
