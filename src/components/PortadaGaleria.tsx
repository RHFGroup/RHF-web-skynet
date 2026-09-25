"use client";

/**
 * La portada de la página de un proyecto: sus fotos a pantalla completa.
 *
 * Una foto a la vez, con fundido. Flechas, puntos y teclado (← →) cuando el
 * foco está en la galería; deslizar con el dedo en el teléfono. Sin avance
 * automático: quien mira decide cuándo pasa.
 *
 * Cada foto lleva su crédito a la vista. La primera carga con prioridad; las
 * demás, solo cuando se piden.
 */
import { useRef, useState, type ReactNode } from "react";
import type { Foto } from "@/data/proyectos";
import { IconoFlecha, IconoFlechaIzq } from "@/components/Iconos";

export default function PortadaGaleria({
  fotos,
  nombre,
  children,
}: {
  fotos: Foto[];
  nombre: string;
  /** El texto de la portada: nombre, zona, estado y sello. */
  children: ReactNode;
}) {
  const [actual, setActual] = useState(0);
  // Solo se montan las fotos que ya se pidieron: la galería no descarga siete
  // imágenes para mostrar una.
  const [vistas, setVistas] = useState<Set<number>>(() => new Set([0]));
  const inicioToque = useRef<number | null>(null);
  const total = fotos.length;

  const ir = (i: number) => {
    const n = (i + total) % total;
    // La que se pide y la siguiente: así el próximo paso ya está descargado.
    setVistas((v) => {
      const siguiente = (n + 1) % total;
      if (v.has(n) && v.has(siguiente)) return v;
      return new Set(v).add(n).add(siguiente);
    });
    setActual(n);
  };

  if (total === 0) {
    return (
      <section className="pp-portada pp-portada-sin-foto">
        <div className="pp-portada-texto">{children}</div>
      </section>
    );
  }

  const foto = fotos[actual];

  return (
    <section
      className="pp-portada"
      aria-roledescription="galería"
      aria-label={`Fotos de ${nombre}`}
      onKeyDown={(e) => {
        if (total < 2) return;
        if (e.key === "ArrowRight") ir(actual + 1);
        if (e.key === "ArrowLeft") ir(actual - 1);
      }}
      onTouchStart={(e) => {
        inicioToque.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        const inicio = inicioToque.current;
        const fin = e.changedTouches[0]?.clientX;
        inicioToque.current = null;
        if (inicio === null || fin === undefined || total < 2) return;
        const dx = fin - inicio;
        if (Math.abs(dx) > 48) ir(actual + (dx < 0 ? 1 : -1));
      }}
    >
      <div className="pp-portada-fotos">
        {fotos.map((f, i) =>
          vistas.has(i) ? (
            <img
              key={f.src}
              src={f.src}
              alt={i === actual ? f.alt : ""}
              aria-hidden={i === actual ? undefined : true}
              width={f.ancho}
              height={f.alto}
              className={i === actual ? "activa" : ""}
              // La primera foto es lo primero que se ve: va con prioridad.
              fetchPriority={i === 0 ? "high" : "auto"}
              loading={i === 0 ? "eager" : "lazy"}
              decoding="async"
            />
          ) : null,
        )}
      </div>

      <div className="pp-portada-texto">{children}</div>

      <p className="pp-portada-credito">{foto.credito}</p>

      {total > 1 && (
        <div className="pp-portada-controles">
          <button type="button" onClick={() => ir(actual - 1)} aria-label="Foto anterior">
            <IconoFlechaIzq />
          </button>
          <span className="pp-portada-contador" aria-live="polite">
            {actual + 1} / {total}
          </span>
          <button type="button" onClick={() => ir(actual + 1)} aria-label="Foto siguiente">
            <IconoFlecha />
          </button>
        </div>
      )}
    </section>
  );
}
