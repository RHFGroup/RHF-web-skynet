"use client";

/**
 * Las tipologías de un proyecto, una pestaña por tipología.
 *
 * Cada pestaña dice lo que dice la fuente y nada más: el área con su rótulo
 * literal, habitaciones y baños solo si la fuente los da, el plano si el
 * brochure lo publica y el precio solo si el proyecto puede publicarlo (con su
 * corte). Los datos llegan armados del servidor, ya en el idioma de la página.
 *
 * Accesibilidad: patrón de pestañas del WAI-ARIA, con flechas izquierda y
 * derecha para moverse entre pestañas.
 */
import { useId, useRef, useState } from "react";
import type { Plano } from "@/data/proyectos";
import type { Idioma } from "@/i18n/idioma";

export type TipologiaVista = {
  titulo: string;
  detalle: string;
  fuente: string;
  area: { etiqueta: string; valor: string; fuente: string };
  alcobas?: string;
  banos?: string;
  exterior?: string;
  planos: Plano[];
  /**
   * «$311.500.000 a $341.500.000 · 37 unidades · corte 23 de septiembre de 2026».
   * En inglés: «COP 311,500,000 to COP 341,500,000 · 37 units available ·
   * price as of September 23, 2026».
   */
  precio: { cifra: string; detalle: string; cop?: { desde: number; hasta: number } } | null;
};

/** Los espacios al borde son parte del texto: lo separan del dato que va al lado. */
const TEXTOS = {
  es: {
    pestanas: "Tipologías",
    abrirEnGrande: (alt: string) => `Abrir en grande: ${alt}`,
    area: "Área",
    rotula: "La fuente la rotula «",
    rotulaCierre: "». ",
    habitaciones: "Habitaciones",
    banos: "Baños",
    exterior: "Exterior",
    precio: "Precio de referencia",
    fuente: "Fuente: ",
  },
  en: {
    pestanas: "Unit types",
    abrirEnGrande: (alt: string) => `Open full size: ${alt}`,
    area: "Area",
    rotula: "Source label: “",
    rotulaCierre: "”. ",
    habitaciones: "Bedrooms",
    banos: "Bathrooms",
    exterior: "Outdoor space",
    precio: "Reference price",
    fuente: "Source: ",
  },
} satisfies Record<Idioma, Record<string, string | ((...datos: never[]) => string)>>;

export default function TipologiasTabs({
  tipologias,
  idioma = "es",
}: {
  tipologias: TipologiaVista[];
  idioma?: Idioma;
}) {
  const t = TEXTOS[idioma];
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
        <div className="pp-tipos-lista" role="tablist" aria-label={t.pestanas}>
          {tipologias.map((tipo, i) => (
            <button
              key={tipo.titulo}
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
              {tipo.titulo}
            </button>
          ))}
        </div>
      )}

      {tipologias.map((tipo, i) => (
        <div
          key={tipo.titulo}
          role={tipologias.length > 1 ? "tabpanel" : undefined}
          id={`${base}-panel-${i}`}
          aria-labelledby={tipologias.length > 1 ? `${base}-tab-${i}` : undefined}
          hidden={i !== activa}
          className={"pp-tipo" + (tipo.planos.length > 0 ? " con-planos" : "")}
        >
          {tipo.planos.length > 0 && (
            <div className="pp-tipo-planos">
              {tipo.planos.map((pl) => (
                <figure key={pl.src}>
                  <a href={pl.src} target="_blank" rel="noopener noreferrer" aria-label={t.abrirEnGrande(pl.alt)}>
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
            {tipologias.length === 1 && <h3>{tipo.titulo}</h3>}
            <p className="pp-tipo-detalle">{tipo.detalle}</p>
            <dl>
              <div>
                <dt>{t.area}</dt>
                <dd>
                  <strong>{tipo.area.valor}</strong>
                  <span>
                    {t.rotula}
                    {tipo.area.etiqueta}
                    {t.rotulaCierre}
                    {tipo.area.fuente}
                  </span>
                </dd>
              </div>
              {tipo.alcobas && (
                <div>
                  <dt>{t.habitaciones}</dt>
                  <dd>
                    <strong>{tipo.alcobas}</strong>
                  </dd>
                </div>
              )}
              {tipo.banos && (
                <div>
                  <dt>{t.banos}</dt>
                  <dd>
                    <strong>{tipo.banos}</strong>
                  </dd>
                </div>
              )}
              {tipo.exterior && (
                <div>
                  <dt>{t.exterior}</dt>
                  <dd>
                    <strong>{tipo.exterior}</strong>
                  </dd>
                </div>
              )}
              {tipo.precio && (
                <div>
                  <dt>{t.precio}</dt>
                  <dd>
                    <strong
                      data-cop={tipo.precio.cop?.desde}
                      data-cop-hasta={
                        tipo.precio.cop && tipo.precio.cop.hasta !== tipo.precio.cop.desde
                          ? tipo.precio.cop.hasta
                          : undefined
                      }
                    >
                      {tipo.precio.cifra}
                    </strong>
                    <span>{tipo.precio.detalle}</span>
                  </dd>
                </div>
              )}
            </dl>
            <p className="pp-fuente">
              {t.fuente}
              {tipo.fuente}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
