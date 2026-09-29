import Image from "next/image";
import type { Idioma } from "@/i18n/idioma";

/**
 * El brochure del constructor, página por página, como imágenes web.
 *
 * Por qué imágenes y no el PDF embebido: los brochures pesan entre 4 y 21 MB.
 * Servirlos completos en la página castiga al cliente que entra desde el
 * celular con datos. Las imágenes cargan de a poco, se indexan, y el PDF
 * queda disponible para quien lo quiera bajar.
 *
 * En inglés se avisa que el material está en español: es el del constructor,
 * tal cual.
 */

/** Los espacios al borde son parte del texto: lo separan del número de páginas. */
const TEXTOS = {
  es: {
    titulo: "Brochure oficial",
    material: "Material del constructor, ",
    paginas: " páginas. Las imágenes y textos son los que publica el promotor del proyecto.",
    descargar: "Descargar el PDF completo",
    alt: (nombre: string, n: number, total: number) => `${nombre} — brochure oficial, página ${n} de ${total}`,
  },
  en: {
    titulo: "Official brochure",
    material: "Builder's material, ",
    paginas: " pages, in Spanish. The images and text are the ones published by the project's developer.",
    descargar: "Download the full PDF",
    alt: (nombre: string, n: number, total: number) => `${nombre} — official brochure, page ${n} of ${total}`,
  },
} satisfies Record<Idioma, Record<string, string | ((...datos: never[]) => string)>>;

export default function BrochureGaleria({
  slug,
  paginas,
  pdf,
  nombre,
  idioma = "es",
}: {
  slug: string;
  paginas: number;
  pdf: string | null;
  nombre: string;
  idioma?: Idioma;
}) {
  const t = TEXTOS[idioma];
  const pags = Array.from({ length: paginas }, (_, i) =>
    String(i + 1).padStart(2, "0"),
  );

  return (
    <section className="brochure" id="brochure">
      <div className="brochure-head">
        <h2>{t.titulo}</h2>
        <p>
          {t.material}
          {paginas}
          {t.paginas}
        </p>
        {pdf && (
          <a className="brochure-pdf" href={pdf} target="_blank" rel="noopener noreferrer">
            {t.descargar}
          </a>
        )}
      </div>

      <div className="brochure-grid">
        {pags.map((n, i) => (
          <figure key={n} className="brochure-pag">
            <Image
              src={`/proyectos/${slug}/brochure/p${n}.jpg`}
              alt={t.alt(nombre, i + 1, paginas)}
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
