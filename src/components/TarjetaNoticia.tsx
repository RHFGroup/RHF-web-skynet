/**
 * Una noticia de la Zona Norte: fecha, tema, si está en obra o anunciada,
 * el título propio, el resumen y a dónde lleva. La tarjeta entera abre el
 * artículo original en su medio (src/data/noticias.ts).
 *
 * En inglés (29-sep-2026) el título, el resumen, el tema y la fecha salen del
 * módulo en inglés; el medio se muestra igual, porque es un nombre propio.
 */
import type { Noticia } from "@/data/noticias";
import type { Idioma } from "@/i18n/idioma";
import { noticias } from "@/i18n/modulos/noticias";

/**
 * Los textos, en los dos idiomas (docs/i18n.md). Cada uno es un nodo de texto
 * tal como queda en el HTML, con sus espacios de borde: así el español sale
 * idéntico.
 */
const TEXTOS = {
  es: { seAbreEn: " (se abre en ", leerEn: "Leer en " },
  en: { seAbreEn: " (opens on ", leerEn: "Read at " },
} satisfies Record<Idioma, Record<string, string>>;

export default function TarjetaNoticia({
  noticia: n,
  i = 0,
  idioma = "es",
}: {
  noticia: Noticia;
  i?: number;
  idioma?: Idioma;
}) {
  const t = TEXTOS[idioma];
  const { MARCA_TIPO, TEMAS, fechaNoticia } = noticias(idioma);
  const marca = MARCA_TIPO[n.tipo];
  return (
    <article className="noticia" style={{ "--i": i } as React.CSSProperties}>
      <p className="noticia-meta">
        <time dateTime={n.fecha}>{fechaNoticia(n.fecha)}</time>
        <span className="noticia-tema">{TEMAS[n.tema]}</span>
        {marca && <span className="noticia-marca">{marca}</span>}
      </p>
      <h3 className="noticia-titulo">
        <a href={n.url} target="_blank" rel="noopener noreferrer">
          {n.titulo}
          <span className="sr-only">{t.seAbreEn}{n.fuente})</span>
        </a>
      </h3>
      <p className="noticia-resumen">{n.resumen}</p>
      <p className="noticia-fuente" aria-hidden="true">
        {t.leerEn}{n.fuente}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 17 17 7M8 7h9v9" />
        </svg>
      </p>
    </article>
  );
}
