import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Animador from "@/components/Animador";
import CabeceraSitio from "@/components/CabeceraSitio";
import PieSitio from "@/components/PieSitio";
import Suscripcion from "@/components/Suscripcion";
import TarjetaNoticia from "@/components/TarjetaNoticia";
import WhatsAppFlotante from "@/components/WhatsAppFlotante";
import { IconoWhatsApp } from "@/components/Iconos";
import { enlaceWhatsApp } from "@/data/contacto";
import { AUTOR, MARCA_TIPO, NOTICIAS, TEMAS, dominio, fechaNoticia, getNoticia } from "@/data/noticias";
import "@/styles/noticias.css";
import "@/styles/secciones.css";

/**
 * /inteligencia-de-mercado/<id> — el artículo de RHF Living sobre una noticia
 * de la Zona Norte (1-oct-2026, Rafael: «quiero que estas noticias se vean
 * elaboradas por nosotros»).
 *
 * El texto y la lectura son nuestros, con firma. Los hechos y las cifras son
 * de la fuente: van atribuidos en el texto y el artículo cierra con el medio,
 * la fecha y el enlace al original. Por eso los datos estructurados dicen
 * `isBasedOn` con la URL de la fuente. Exportación estática: una página por
 * noticia de src/data/noticias.ts.
 */

const SITIO = "https://rhfliving.com";

export const dynamicParams = false;

export function generateStaticParams() {
  return NOTICIAS.map((n) => ({ id: n.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const n = getNoticia(id);
  if (!n) return {};
  const url = `${SITIO}/inteligencia-de-mercado/${n.id}`;
  const titulo = `${n.titulo} | Inteligencia de mercado · RHF Living`;
  return {
    title: { absolute: titulo },
    description: n.resumen,
    alternates: { canonical: url },
    authors: [{ name: AUTOR }],
    openGraph: {
      title: n.titulo,
      description: n.resumen,
      url,
      siteName: "RHF Living",
      locale: "es_CO",
      type: "article",
      publishedTime: n.fecha,
      authors: [AUTOR],
      images: [{ url: `${SITIO}/og.jpg`, width: 1200, height: 630, alt: "RHF Living — Asesoría inmobiliaria en Cartagena" }],
    },
    twitter: { card: "summary_large_image", title: n.titulo, description: n.resumen, images: [`${SITIO}/og.jpg`] },
  };
}

export default async function PaginaArticulo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const n = getNoticia(id);
  if (!n) notFound();
  const marca = MARCA_TIPO[n.tipo];
  const otras = NOTICIAS.filter((o) => o.id !== n.id).slice(0, 3);
  const mensaje = `Hola Rafael, leí tu análisis «${n.titulo}» y quiero hablar contigo sobre la Zona Norte.`;
  const ld = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: n.titulo,
    description: n.resumen,
    datePublished: n.fecha,
    inLanguage: "es-CO",
    url: `${SITIO}/inteligencia-de-mercado/${n.id}`,
    author: { "@type": "Person", name: AUTOR, url: `${SITIO}/asesor` },
    publisher: { "@type": "Organization", name: "RHF Living", url: SITIO },
    isBasedOn: n.url,
  };

  return (
    <>
      <CabeceraSitio blanca mensaje={mensaje} actual="mercado" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />

      <main className="np art">
        <article className="art-cuerpo tono tono-claro tono-blanco-1" aria-labelledby="art-titulo">
          <div className="art-shell">
            <p className="art-volver">
              <Link href="/inteligencia-de-mercado">← Inteligencia de mercado</Link>
            </p>
            <p className="noticia-meta">
              <span className="noticia-tema">{TEMAS[n.tema]}</span>
              {marca && <span className="noticia-marca">{marca}</span>}
            </p>
            <h1 id="art-titulo">{n.titulo}</h1>
            <p className="art-firma">
              Por <strong>{AUTOR}</strong> · RHF Living · <time dateTime={n.fecha}>{fechaNoticia(n.fecha)}</time>
            </p>
            <p className="art-entrada">{n.resumen}</p>
            {n.cuerpo.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            <aside className="art-lectura" aria-label="Nuestra lectura">
              <p className="art-lectura-titulo">Nuestra lectura</p>
              <p>{n.lectura}</p>
            </aside>
            <p className="art-fuente">
              Fuente: {n.fuente}, {fechaNoticia(n.fecha)}.{" "}
              <a href={n.url} target="_blank" rel="noopener noreferrer">
                Ver la nota original en {dominio(n.url)}
              </a>
              . El análisis es de RHF Living; los datos, de la fuente.
            </p>
          </div>
        </article>

        <section className="np-cuerpo tono tono-claro tono-blanco-2" aria-labelledby="art-mas">
          <div className="section-shell">
            <h2 id="art-mas" className="art-mas-titulo">
              Más inteligencia de mercado
            </h2>
            <div className="noticias-lista">
              {otras.map((o, i) => (
                <TarjetaNoticia key={o.id} noticia={o} i={i} />
              ))}
            </div>
          </div>
        </section>

        <section className="np-boletin tono tono-claro tono-blanco-1" aria-label="Suscripción al boletín">
          <div className="section-shell">
            <Suscripcion />
          </div>
        </section>

        <section className="section section-contacto tono tono-oscuro tono-azul-1" id="contacto">
          <div className="section-shell contacto-shell">
            <div className="contacto-texto">
              <p className="section-kicker">Contacto</p>
              <h2>Hablemos de la Zona Norte</h2>
              <p className="section-lede">Cuéntame qué buscas y te muestro los proyectos que encajan contigo.</p>
              <div className="contacto-canales">
                <a className="btn-whatsapp" href={enlaceWhatsApp(mensaje)} target="_blank" rel="noopener noreferrer">
                  <IconoWhatsApp /> Escríbeme por WhatsApp
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PieSitio avisoImagenes="Análisis de RHF Living con datos de la fuente citada en cada artículo." />

      <WhatsAppFlotante trasDe=".art-cuerpo" />
      <Animador />
    </>
  );
}
