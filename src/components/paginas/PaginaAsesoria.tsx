import type { Metadata } from "next";
import Captacion from "@/components/asesoria/Captacion";
import Gracias from "@/components/asesoria/Gracias";
import { TEXTOS } from "@/components/asesoria/textos";
import { alternos, ruta, type Idioma } from "@/i18n/idioma";
import "@/styles/asesoria.css";

/**
 * /asesoria y /en/lets-talk — la página de captación para quien llega de un
 * video (YouTube, Instagram, un anuncio). Pedido de Rafael del 7-oct-2026.
 * Más /asesoria/gracias y /en/lets-talk/thank-you.
 *
 * Es una página de campaña:
 *  · fuera del menú, del sitemap y de los buscadores (noindex): llega solo
 *    quien tiene el enlace, y así cada lead se puede atribuir al video;
 *  · sin la cabecera ni el pie del sitio: una sola acción, sin salidas;
 *  · sin proyectos ni precios (pedido de Rafael), así que no es pieza
 *    publicitaria de un proyecto en el sentido de la Circular 004.
 *
 * El enlace para la descripción del video lleva las UTM:
 *   https://rhfliving.com/asesoria?utm_source=youtube&utm_medium=video&utm_campaign=<nombre-del-video>
 */

const NO_INDEXAR: Metadata["robots"] = { index: false, follow: false, nocache: true };

export function metadataAsesoria(idioma: Idioma): Metadata {
  const t = TEXTOS[idioma];
  const { canonical, languages } = alternos("/asesoria", idioma);
  return {
    title: { absolute: t.titulo },
    description: t.descripcion,
    robots: NO_INDEXAR,
    alternates: { canonical, languages },
    openGraph: { title: t.titulo, description: t.descripcion, url: canonical, siteName: "RHF Living", type: "website", images: [{ url: "/og.jpg", width: 1200, height: 630 }] },
  };
}

export function metadataAsesoriaGracias(idioma: Idioma): Metadata {
  const t = TEXTOS[idioma];
  return { title: { absolute: t.graciasTitulo }, description: t.graciasDescripcion, robots: NO_INDEXAR };
}

function Cabeza({ idioma, rutaEs }: { idioma: Idioma; rutaEs: string }) {
  return (
    <header className="ase-top">
      <a href={ruta(idioma, "/")} className="ase-marca" aria-label="RHF Living">
        <img src="/marca/rhf-living.svg" alt="RHF Living" width="176" height="40" />
      </a>
      <nav className="ase-idiomas" aria-label={idioma === "en" ? "Language" : "Idioma"}>
        <a href={ruta("es", rutaEs)} hrefLang="es" lang="es" aria-current={idioma === "es" ? "page" : undefined}>
          ES
        </a>
        <a href={ruta("en", rutaEs)} hrefLang="en" lang="en" aria-current={idioma === "en" ? "page" : undefined}>
          EN
        </a>
      </nav>
    </header>
  );
}

function Pie({ idioma }: { idioma: Idioma }) {
  const t = TEXTOS[idioma];
  return (
    <footer className="ase-pie">
      <p>{t.aviso}</p>
      <p>
        <a href={ruta(idioma, "/privacidad")}>{idioma === "en" ? "Privacy policy" : "Política de tratamiento de datos"}</a>
        {" · "}
        <a href={ruta(idioma, "/terminos")}>{idioma === "en" ? "Terms of use" : "Términos de uso"}</a>
      </p>
    </footer>
  );
}

export default function PaginaAsesoria({ idioma = "es" }: { idioma?: Idioma }) {
  const t = TEXTOS[idioma];
  return (
    <main className="ase" data-sin-chat>
      <Cabeza idioma={idioma} rutaEs="/asesoria" />

      <section className="ase-hero" aria-labelledby="ase-titulo">
        <div className="ase-intro">
          <p className="ase-kicker">{t.kicker}</p>
          <h1 id="ase-titulo">{t.h1}</h1>
          <p className="ase-lede">{t.lede}</p>
        </div>

        <Captacion idioma={idioma} />

        <div className="ase-respaldo">
          <div className="ase-firma">
            <picture>
              <source type="image/webp" srcSet="/rafael/camisa-blanca-520.webp" />
              <img src="/rafael/camisa-blanca-520.jpg" alt={t.alt} width="64" height="64" loading="eager" />
            </picture>
            <div>
              <strong>{t.firma}</strong>
              <span>{t.firmaRol}</span>
            </div>
          </div>
          <ul className="ase-confianza">
            {t.confianza.map((c, i) => (
              <li key={c} style={{ ["--i" as string]: i }}>
                {c}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Pie idioma={idioma} />
    </main>
  );
}

export function PaginaAsesoriaGracias({ idioma = "es" }: { idioma?: Idioma }) {
  return (
    <main className="ase ase-pagina-gracias" data-sin-chat>
      <Cabeza idioma={idioma} rutaEs="/asesoria/gracias" />
      <section className="ase-hero-gracias">
        <Gracias idioma={idioma} />
      </section>
      <Pie idioma={idioma} />
    </main>
  );
}
