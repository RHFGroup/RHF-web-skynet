"use client";

/**
 * Una fila que se desliza de lado, con flechas (28-sep-2026).
 *
 * La de los reels pasó de tres a cinco: en escritorio caben cuatro y el
 * quinto quedaba escondido para quien usa mouse, que no desliza de lado. Las
 * flechas corren una tarjeta; el dedo y el trackpad siguen deslizando como
 * siempre (scroll nativo con imán). Sin JS la fila se ve y se desliza igual;
 * solo faltan las flechas. En los extremos la flecha se apaga con
 * aria-disabled y no con disabled: así no se le escapa el foco a quien usa
 * el teclado.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePrefersReducedMotion } from "@/lib/motion";

export default function FilaDeslizable({
  className,
  etiqueta,
  children,
}: {
  /** Clase de la lista (la fila). */
  className: string;
  /** Nombre del grupo de flechas para el lector de pantalla. */
  etiqueta: string;
  children: ReactNode;
}) {
  const fila = useRef<HTMLUListElement>(null);
  const [estado, setEstado] = useState({ desborda: false, inicio: true, fin: false });
  const reducido = usePrefersReducedMotion();

  useEffect(() => {
    const el = fila.current;
    if (!el) return;
    const medir = () => {
      const max = el.scrollWidth - el.clientWidth;
      const nuevo = { desborda: max > 4, inicio: el.scrollLeft <= 4, fin: el.scrollLeft >= max - 4 };
      setEstado((e) => (e.desborda === nuevo.desborda && e.inicio === nuevo.inicio && e.fin === nuevo.fin ? e : nuevo));
    };
    medir();
    el.addEventListener("scroll", medir, { passive: true });
    window.addEventListener("resize", medir, { passive: true });
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(medir) : null;
    ro?.observe(el);
    return () => {
      el.removeEventListener("scroll", medir);
      window.removeEventListener("resize", medir);
      ro?.disconnect();
    };
  }, []);

  const mover = (sentido: 1 | -1) => {
    const el = fila.current;
    if (!el) return;
    const tarjeta = el.firstElementChild as HTMLElement | null;
    const hueco = parseFloat(getComputedStyle(el).columnGap) || 0;
    const paso = tarjeta ? tarjeta.getBoundingClientRect().width + hueco : el.clientWidth * 0.8;
    el.scrollBy({ left: sentido * paso, behavior: reducido ? "auto" : "smooth" });
  };

  return (
    <>
      <ul className={className} ref={fila}>
        {children}
      </ul>
      {estado.desborda && (
        <div className="fila-mando" role="group" aria-label={etiqueta}>
          <button
            type="button"
            className="fila-mando-boton"
            onClick={() => !estado.inicio && mover(-1)}
            aria-disabled={estado.inicio}
            aria-label="Ver los anteriores"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            className="fila-mando-boton"
            onClick={() => !estado.fin && mover(1)}
            aria-disabled={estado.fin}
            aria-label="Ver los siguientes"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
}
