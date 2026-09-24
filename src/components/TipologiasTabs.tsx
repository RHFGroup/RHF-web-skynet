"use client";

/**
 * Las tipologías de un proyecto, una pestaña por tipología.
 *
 * Cada pestaña dice lo que dice la fuente y nada más: el área con su rótulo
 * literal, habitaciones y baños solo si la fuente los da, el plano si el
 * brochure lo publica y el precio solo si el proyecto puede publicarlo (con su
 * corte). Los datos llegan armados del servidor.
 *
 * Accesibilidad: patrón de pestañas del WAI-ARIA, con flechas izquierda y
 * derecha para moverse entre pestañas.
 */
import { useId, useRef, useState } from "react";
import type { Plano } from "@/data/proyectos";

export type TipologiaVista = {
  titulo: string;
  detalle: string;
  fuente: string;
  area: { etiqueta: string; valor: string; fuente: string };
  alcobas?: string;
  banos?: string;
  exterior?: string;
  planos: Plano[];
  /** «$311.500.000 a $341.500.000 · 37 unidades · corte 23 de septiembre de 2026». */
  precio: { cifra: string; detalle: string } | null;
};

export default function TipologiasTabs({ tipologias }: { tipologias: TipologiaVista[] }) {
  const [activa, setActiva] = useState(0);
  const base = useId();
  const pestañas = useRef<(HTMLButtonElement | null)[]>([]);

  const mover = (i: number) => {
    const n = (i + tipologias.length) % tipologias.length;
    setActiva(n);
    pestañas.current[n]?.focus();
  };

  return (
    <div className="pp-tipos">
      {tipologias.length > 1 && (
        <div className="pp-tipos-lista" role="tablist" aria-label="Tipologías">
          {tipologias.map((t, i) => (
            <button
              key={t.titulo}
              ref={(el) => {
                pestañas.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${base}-tab-${i}`}
              aria-selected={i === activa}
              aria-controls={`${base}-panel-${i}`}
              tabIndex={i === activa ? 0 : -1}
              className={i === activa ? "activa" : ""}
              onClick={() => setActiva(i)}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight") mover(i + 1);
                if (e.key === "ArrowLeft") mover(i - 1);
              }}
            >
              {t.titulo}
            </button>
          ))}
        </div>
      )}

      {tipologias.map((t, i) => (
        <div
          key={t.titulo}
          role={tipologias.length > 1 ? "tabpanel" : undefined}
          id={`${base}-panel-${i}`}
          aria-labelledby={tipologias.length > 1 ? `${base}-tab-${i}` : undefined}
          hidden={i !== activa}
          className={"pp-tipo" + (t.planos.length > 0 ? " con-planos" : "")}
        >
          {t.planos.length > 0 && (
            <div className="pp-tipo-planos">
              {t.planos.map((pl) => (
                <figure key={pl.src}>
                  <a href={pl.src} target="_blank" rel="noopener noreferrer" aria-label={`Abrir en grande: ${pl.alt}`}>
                    <img src={pl.src} alt={pl.alt} width={pl.ancho} height={pl.alto} loading="lazy" decoding="async" />
                  </a>
                  <figcaption>
                    {pl.fuente} · {pl.credito}
                  </figcaption>
                </figure>
              ))}
            </div>
          )}

          <div className="pp-tipo-datos">
            {tipologias.length === 1 && <h3>{t.titulo}</h3>}
            <p className="pp-tipo-detalle">{t.detalle}</p>
            <dl>
              <div>
                <dt>Área</dt>
                <dd>
                  <strong>{t.area.valor}</strong>
                  <span>
                    La fuente la rotula «{t.area.etiqueta}». {t.area.fuente}
                  </span>
                </dd>
              </div>
              {t.alcobas && (
                <div>
                  <dt>Habitaciones</dt>
                  <dd>
                    <strong>{t.alcobas}</strong>
                  </dd>
                </div>
              )}
              {t.banos && (
                <div>
                  <dt>Baños</dt>
                  <dd>
                    <strong>{t.banos}</strong>
                  </dd>
                </div>
              )}
              {t.exterior && (
                <div>
                  <dt>Exterior</dt>
                  <dd>
                    <strong>{t.exterior}</strong>
                  </dd>
                </div>
              )}
              {t.precio && (
                <div>
                  <dt>Precio de referencia</dt>
                  <dd>
                    <strong>{t.precio.cifra}</strong>
                    <span>{t.precio.detalle}</span>
                  </dd>
                </div>
              )}
            </dl>
            <p className="pp-fuente">Fuente: {t.fuente}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
