import Image from "next/image";

/**
 * El brochure del constructor, página por página, como imágenes web.
 *
 * Por qué imágenes y no el PDF embebido: los brochures pesan entre 4 y 21 MB.
 * Servirlos completos en la página castiga al cliente que entra desde el
 * celular con datos. Las imágenes cargan de a poco, se indexan, y el PDF
 * queda disponible para quien lo quiera bajar.
 */

export default function BrochureGaleria({
  slug,
  paginas,
  pdf,
  nombre,
}: {
  slug: string;
  paginas: number;
  pdf: string | null;
  nombre: string;
}) {
  const pags = Array.from({ length: paginas }, (_, i) =>
    String(i + 1).padStart(2, "0"),
  );

  return (
    <section className="brochure" id="brochure">
      <div className="brochure-head">
        <h2>Brochure oficial</h2>
        <p>
          Material del constructor, {paginas} páginas. Las imágenes y textos son
          los que publica el promotor del proyecto.
        </p>
        {pdf && (
          <a className="brochure-pdf" href={pdf} target="_blank" rel="noopener noreferrer">
            Descargar el PDF completo
          </a>
        )}
      </div>

      <div className="brochure-grid">
        {pags.map((n, i) => (
          <figure key={n} className="brochure-pag">
            <Image
              src={`/proyectos/${slug}/brochure/p${n}.jpg`}
              alt={`${nombre} — brochure oficial, página ${i + 1} de ${paginas}`}
              width={1200}
              height={848}
              sizes="(max-width: 700px) 100vw, 50vw"
              loading={i < 2 ? "eager" : "lazy"}
              unoptimized
            />
          </figure>
        ))}
      </div>
    </section>
  );
}
