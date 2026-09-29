import type { Metadata } from "next";
import { notFound } from "next/navigation";
import InmuebleLanding from "@/components/InmuebleLanding";
import type { Inmueble } from "@/data/inmuebles";
import { alternos, SITIO, type Idioma } from "@/i18n/idioma";
import { inmuebles } from "@/i18n/modulos/inmuebles";
import { proyectos } from "@/i18n/modulos/proyectos";

/**
 * /inmuebles/<slug> y /en/properties/<slug> — una página por inmueble
 * disponible, todas desde la misma plantilla (InmuebleLanding), en los dos
 * idiomas (docs/i18n.md). Exportación estática: `generateStaticParams` arma
 * una página por cada elemento de INMUEBLES.
 */

export function slugsInmuebles(): { slug: string }[] {
  return inmuebles("es").INMUEBLES.map((i) => ({ slug: i.slug }));
}

const TEXTOS = {
  es: { asesoria: " Asesoría de RHF Living.", locale: "es_CO" },
  en: { asesoria: " Advisory by RHF Living.", locale: "en_US" },
} satisfies Record<Idioma, Record<string, string>>;

function titulo(i: Inmueble): string {
  return `${i.nombre}, ${i.zona} | RHF Living`;
}

function descripcion(i: Inmueble, idioma: Idioma): string {
  return `${i.descripcion[0]}${TEXTOS[idioma].asesoria}`;
}

export function metadataInmueble(slug: string, idioma: Idioma): Metadata {
  const i = inmuebles(idioma).getInmueble(slug);
  if (!i) return {};
  const { canonical, languages } = alternos(`/inmuebles/${i.slug}`, idioma);
  const t = titulo(i);
  const d = descripcion(i, idioma);
  return {
    title: { absolute: t },
    description: d,
    alternates: { canonical, languages },
    openGraph: {
      title: t,
      description: d,
      url: canonical,
      siteName: "RHF Living",
      locale: TEXTOS[idioma].locale,
      type: "website",
      images: [{ url: `${SITIO}${i.compartir}`, alt: i.fotos[0]?.alt ?? i.nombre }],
    },
    twitter: { card: "summary_large_image", title: t, description: d, images: [`${SITIO}${i.compartir}`] },
  };
}

/** schema.org sin valores inventados: el precio solo si está escrito, con su corte. */
function datosEstructurados(i: Inmueble, idioma: Idioma) {
  const { fechaISO } = proyectos(idioma);
  const url = alternos(`/inmuebles/${i.slug}`, idioma).canonical;
  const ficha: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: i.nombre,
    url,
    description: i.descripcion.join(" "),
    image: i.fotos.map((f) => `${SITIO}${f.src}`),
    about: {
      "@type": "Apartment",
      name: i.nombre,
      address: i.ubicacion,
      numberOfBathroomsTotal: i.banosTarjeta ? Number(i.banosTarjeta) : undefined,
      numberOfBedrooms: i.habitacionesTarjeta ? Number(i.habitacionesTarjeta) : undefined,
    },
    provider: { "@type": "RealEstateAgent", name: "RHF Living — Rafael Hernández Franco", url: SITIO },
  };
  if (idioma === "en") ficha.inLanguage = "en";
  if (i.precio) {
    const oferta: Record<string, unknown> = {
      "@type": "Offer",
      price: i.precio.valor,
      priceCurrency: "COP",
      availability: "https://schema.org/InStock",
    };
    const desde = fechaISO(i.precio.corte);
    if (desde) oferta.validFrom = desde;
    ficha.offers = oferta;
  }
  return ficha;
}

export default function PaginaInmueble({ slug, idioma = "es" }: { slug: string; idioma?: Idioma }) {
  const i = inmuebles(idioma).getInmueble(slug);
  if (!i) notFound();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(datosEstructurados(i, idioma)) }}
      />
      <InmuebleLanding i={i} idioma={idioma} />
    </>
  );
}
