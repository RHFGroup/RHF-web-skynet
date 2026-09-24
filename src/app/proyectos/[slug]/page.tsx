import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProyectoLanding from "@/components/ProyectoLanding";
import { fechaISO, getProyecto, PROYECTOS, puedePublicarPrecio, type Proyecto } from "@/data/proyectos";
import { dondeQueda } from "@/lib/ficha";

/**
 * /proyectos/<slug> — una página por proyecto, todas desde la misma plantilla.
 *
 * El sitio es exportación estática: `generateStaticParams` arma en el build
 * una página por cada elemento de PROYECTOS. Agregar un proyecto a la cartera
 * es agregarlo en `src/data/proyectos.ts`; esta ruta, el mapa del sitio y la
 * tarjeta de la home salen solos.
 */

const SITIO = "https://rhfliving.com";

export const dynamicParams = false;

export function generateStaticParams() {
  return PROYECTOS.map((p) => ({ slug: p.slug }));
}

/** «Doral Country, apartamentos en la Zona Norte de Cartagena | RHF Living» */
function titulo(p: Proyecto): string {
  const tipo = p.tipoInmueble ? `${p.tipoInmueble} ` : "proyecto ";
  return `${p.nombre}, ${tipo}${dondeQueda(p)} | RHF Living`;
}

/** La primera oración del resumen, que ya está contrastada contra la fuente. */
function descripcion(p: Proyecto): string {
  const primera = p.resumen.split(/(?<=\.)\s/)[0] ?? p.resumen;
  return `${primera} Asesoría de RHF Living en Cartagena.`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = getProyecto(slug);
  if (!p) return {};
  const url = `/proyectos/${p.slug}`;
  const imagen = p.fotos?.compartir ?? "/og.jpg";
  const t = titulo(p);
  const d = descripcion(p);
  return {
    title: { absolute: t },
    description: d,
    keywords: [
      `${p.nombre} Cartagena`,
      `${p.tipoInmueble ?? "vivienda"} ${dondeQueda(p).replace(/^en (la )?/, "")}`,
      "asesoría inmobiliaria Cartagena",
      "RHF Living",
    ],
    alternates: { canonical: `${SITIO}${url}` },
    openGraph: {
      title: t,
      description: d,
      url: `${SITIO}${url}`,
      siteName: "RHF Living",
      locale: "es_CO",
      type: "website",
      images: [{ url: `${SITIO}${imagen}`, width: 1200, height: 630, alt: `${p.nombre} — material del promotor` }],
    },
    twitter: {
      card: "summary_large_image",
      title: t,
      description: d,
      images: [`${SITIO}${imagen}`],
    },
  };
}

/**
 * Datos estructurados de schema.org, sin valores inventados.
 *
 * El precio entra SOLO si `puedePublicarPrecio` es true, y con la fecha de
 * corte como `validFrom`: la misma regla que la página. La dirección, solo si
 * el proyecto la tiene; si no, no se escribe ninguna.
 */
function datosEstructurados(p: Proyecto) {
  const url = `${SITIO}/proyectos/${p.slug}`;
  const lugar: Record<string, unknown> = {
    "@type": p.tipoInmueble === "casas" ? "GatedResidenceCommunity" : "ApartmentComplex",
    name: p.nombre,
    description: p.resumen,
    amenityFeature: p.amenidades.map((a) => ({ "@type": "LocationFeatureSpecification", name: a, value: true })),
  };
  if (p.ubicacion) lugar.address = p.ubicacion;
  if (p.coordenada) {
    lugar.geo = { "@type": "GeoCoordinates", latitude: p.coordenada.lat, longitude: p.coordenada.lon };
  }

  const ficha: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: p.nombre,
    url,
    description: p.resumen,
    image: (p.fotos?.galeria ?? []).map((f) => `${SITIO}${f.src}`),
    about: lugar,
    provider: {
      "@type": "RealEstateAgent",
      name: "RHF Living — Rafael Hernández Franco",
      url: SITIO,
    },
  };

  if (puedePublicarPrecio(p) && p.precio) {
    const oferta: Record<string, unknown> = {
      "@type": "AggregateOffer",
      priceCurrency: p.precio.moneda,
      lowPrice: p.precio.desde,
      highPrice: p.precio.hasta,
      offerCount: p.precio.unidadesDisponibles,
      availability: "https://schema.org/InStock",
    };
    const desde = fechaISO(p.precio.corte);
    if (desde) oferta.validFrom = desde;
    ficha.offers = oferta;
  }
  return ficha;
}

export default async function PaginaProyecto({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getProyecto(slug);
  if (!p) notFound();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(datosEstructurados(p)) }}
      />
      <ProyectoLanding p={p} />
    </>
  );
}
