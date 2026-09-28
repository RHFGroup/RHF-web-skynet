"use client";

/**
 * Todas las noticias de /noticias, con un filtro por tema. Sin JavaScript se
 * ven todas: el filtro solo oculta.
 */
import { useState } from "react";
import TarjetaNoticia from "@/components/TarjetaNoticia";
import { NOTICIAS, TEMAS, type TemaNoticia } from "@/data/noticias";

export default function ListaNoticias() {
  const [tema, setTema] = useState<TemaNoticia | null>(null);
  const temas = (Object.keys(TEMAS) as TemaNoticia[]).filter((t) => NOTICIAS.some((n) => n.tema === t));
  const visibles = tema ? NOTICIAS.filter((n) => n.tema === tema) : NOTICIAS;
  return (
    <>
      <div className="np-filtros" role="group" aria-label="Filtrar por tema">
        <button type="button" aria-pressed={tema === null} onClick={() => setTema(null)}>
          Todas <span>{NOTICIAS.length}</span>
        </button>
        {temas.map((t) => (
          <button key={t} type="button" aria-pressed={tema === t} onClick={() => setTema(t)}>
            {TEMAS[t]} <span>{NOTICIAS.filter((n) => n.tema === t).length}</span>
          </button>
        ))}
      </div>
      <div className="noticias-lista np-lista" aria-live="polite">
        {visibles.map((n, i) => (
          <TarjetaNoticia key={n.id} noticia={n} i={i % 6} />
        ))}
      </div>
    </>
  );
}
