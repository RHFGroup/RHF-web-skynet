/**
 * Una noticia de la Zona Norte: fecha, tema, si está en obra o anunciada,
 * el título propio y el resumen. Desde el 1-oct-2026 la tarjeta abre el
 * artículo de RHF Living (/inteligencia-de-mercado/<id>); la fuente sigue a
 * la vista, más discreta, y el artículo cierra con el enlace al original.
 */
import Link from "next/link";
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
        <Link href={`/inteligencia-de-mercado/${n.id}`}>{n.titulo}</Link>
      </h3>
      <p className="noticia-resumen">{n.resumen}</p>
      <p className="noticia-fuente">
        <span className="noticia-leer" aria-hidden="true">
          Leer el análisis
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </span>
        <span className="noticia-origen">Con datos de {n.fuente}</span>
      </p>
    </article>
  );
}
