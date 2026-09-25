import type { Metadata } from "next";
import { notFound } from "next/navigation";
import InmuebleLanding from "@/components/InmuebleLanding";
import { getInmueble, INMUEBLES, type Inmueble } from "@/data/inmuebles";
import { fechaISO } from "@/data/proyectos";

/**
 * /inmuebles/<slug> — una página por inmueble disponible, todas desde la misma
 * plantilla (InmuebleLanding). Exportación estática: `generateStaticParams`
 * arma una página por cada elemento de INMUEBLES.
 */

const SITIO = "https://rhfliving.com";

export const dynamicParams = false;

export function generateStaticParams() {
  return INMUEBLES.map((i) => ({ slug: i.slug }));
}

function titulo(i: Inmueble): string {
  return `${i.nombre}, ${i.zona} | RHF Living`;
}

function descripcion(i: Inmueble): string {
  return `${i.descripcion[0]} Asesoría de RHF Living.`;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const i = getInmueble(slug);
  if (!i) return {};
  const url = `/inmuebles/${i.slug}`;
  const t = titulo(i);
  const d = descripcion(i);
  return {
    title: { absolute: t },
    description: d,
    alternates: { canonical: `${SITIO}${url}` },
    openGraph: {
      title: t,
      description: d,
      url: `${SITIO}${url}`,
      siteName: "RHF Living",
      locale: "es_CO",
      type: "website",
      images: [{ url: `${SITIO}${i.compartir}`, alt: i.fotos[0]?.alt ?? i.nombre }],
    },
    twitter: { card: "summary_large_image", title: t, description: d, images: [`${SITIO}${i.compartir}`] },
  };
}

/** schema.org sin valores inventados: el precio solo si está escrito, con su corte. */
function datosEstructurados(i: Inmueble) {
  const url = `${SITIO}/inmuebles/${i.slug}`;
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

export default async function PaginaInmueble({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const i = getInmueble(slug);
  if (!i) notFound();
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(datosEstructurados(i)) }} />
      <InmuebleLanding i={i} />
    </>
  );
}
