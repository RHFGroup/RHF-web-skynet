"use client";

/**
 * Todas las noticias de /noticias, con un filtro por tema. Sin JavaScript se
 * ven todas: el filtro solo oculta.
 */
import { useState } from "react";
import TarjetaNoticia from "@/components/TarjetaNoticia";
import type { TemaNoticia } from "@/data/noticias";
import type { Idioma } from "@/i18n/idioma";
import { noticias } from "@/i18n/modulos/noticias";

/**
 * Los textos, en los dos idiomas (docs/i18n.md). Cada uno es un nodo de texto
 * tal como queda en el HTML, con sus espacios de borde: así el español sale
 * idéntico.
 */
const TEXTOS = {
  es: { filtrar: "Filtrar por tema", todas: "Todas " },
  en: { filtrar: "Filter by topic", todas: "All " },
} satisfies Record<Idioma, Record<string, string>>;

export default function ListaNoticias({ idioma = "es" }: { idioma?: Idioma }) {
  const t = TEXTOS[idioma];
  const { NOTICIAS, TEMAS } = noticias(idioma);
  const [tema, setTema] = useState<TemaNoticia | null>(null);
  const temas = (Object.keys(TEMAS) as TemaNoticia[]).filter((tm) => NOTICIAS.some((n) => n.tema === tm));
  const visibles = tema ? NOTICIAS.filter((n) => n.tema === tema) : NOTICIAS;
  return (
    <>
      <div className="np-filtros" role="group" aria-label={t.filtrar}>
        <button type="button" aria-pressed={tema === null} onClick={() => setTema(null)}>
          {t.todas}<span>{NOTICIAS.length}</span>
        </button>
        {temas.map((tm) => (
          <button key={tm} type="button" aria-pressed={tema === tm} onClick={() => setTema(tm)}>
            {TEMAS[tm]} <span>{NOTICIAS.filter((n) => n.tema === tm).length}</span>
          </button>
        ))}
      </div>
      <div className="noticias-lista np-lista" aria-live="polite">
        {visibles.map((n, i) => (
          <TarjetaNoticia key={n.id} noticia={n} i={i % 6} idioma={idioma} />
        ))}
      </div>
    </>
  );
}
