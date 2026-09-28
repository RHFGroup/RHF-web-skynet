/**
 * Una noticia de la Zona Norte: fecha, tema, si está en obra o anunciada,
 * el título propio, el resumen y a dónde lleva. La tarjeta entera abre el
 * artículo original en su medio (src/data/noticias.ts).
 */
import { MARCA_TIPO, TEMAS, fechaNoticia, type Noticia } from "@/data/noticias";

export default function TarjetaNoticia({ noticia: n, i = 0 }: { noticia: Noticia; i?: number }) {
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
          <span className="sr-only"> (se abre en {n.fuente})</span>
        </a>
      </h3>
      <p className="noticia-resumen">{n.resumen}</p>
      <p className="noticia-fuente" aria-hidden="true">
        Leer en {n.fuente}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 17 17 7M8 7h9v9" />
        </svg>
      </p>
    </article>
  );
}
