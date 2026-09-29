import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProyectoLanding from "@/components/ProyectoLanding";
import type { Proyecto } from "@/data/proyectos";
import { etiquetaTipo } from "@/i18n/etiquetas";
import { alternos, SITIO, type Idioma } from "@/i18n/idioma";
import { proyectos } from "@/i18n/modulos/proyectos";
import { dondeQueda } from "@/lib/ficha";

/**
 * /proyectos/<slug> y /en/projects/<slug> — una página por proyecto, todas
 * desde la misma plantilla, en los dos idiomas (docs/i18n.md).
 *
 * El sitio es exportación estática: `generateStaticParams` arma en el build
 * una página por cada elemento de PROYECTOS. Agregar un proyecto a la cartera
 * es agregarlo en `src/data/proyectos.ts`; esta ruta, el mapa del sitio y la
 * tarjeta de la home salen solos. En inglés, sus textos van en
 * `src/data/en/proyectos.ts`.
 */

export function slugsProyectos(): { slug: string }[] {
  return proyectos("es").PROYECTOS.map((p) => ({ slug: p.slug }));
}

const TEXTOS = {
  es: {
    otro: "proyecto ",
    asesoria: " Asesoría de RHF Living en Cartagena.",
    vivienda: "vivienda",
    enLugar: /^en (la )?/,
    palabraClave: "asesoría inmobiliaria Cartagena",
    locale: "es_CO",
    material: "material del promotor",
  },
  en: {
    otro: "project ",
    asesoria: " Advisory by RHF Living in Cartagena.",
    vivienda: "homes",
    enLugar: /^(in|on) (the )?/,
    palabraClave: "Cartagena real estate advisor",
    locale: "en_US",
    material: "developer's material",
  },
} satisfies Record<Idioma, unknown>;

/** «Doral Country, apartamentos en la Zona Norte de Cartagena | RHF Living» */
function titulo(p: Proyecto, idioma: Idioma): string {
  const t = TEXTOS[idioma];
  const tipo = p.tipoInmueble
    ? `${idioma === "es" ? p.tipoInmueble : etiquetaTipo(p.tipoInmueble, idioma)} `
    : t.otro;
  return `${p.nombre}, ${tipo}${dondeQueda(p, idioma)} | RHF Living`;
}

/** La primera oración del resumen, que ya está contrastada contra la fuente. */
function descripcion(p: Proyecto, idioma: Idioma): string {
  const primera = p.resumen.split(/(?<=\.)\s/)[0] ?? p.resumen;
  return `${primera}${TEXTOS[idioma].asesoria}`;
}

export function metadataProyecto(slug: string, idioma: Idioma): Metadata {
  const p = proyectos(idioma).getProyecto(slug);
  if (!p) return {};
  const t = TEXTOS[idioma];
  const { canonical, languages } = alternos(`/proyectos/${p.slug}`, idioma);
  const imagen = p.fotos?.compartir ?? "/og.jpg";
  const ti = titulo(p, idioma);
  const d = descripcion(p, idioma);
  const tipo = p.tipoInmueble ? (idioma === "es" ? p.tipoInmueble : etiquetaTipo(p.tipoInmueble, idioma)) : t.vivienda;
  return {
    title: { absolute: ti },
    description: d,
    keywords: [
      `${p.nombre} Cartagena`,
      `${tipo} ${dondeQueda(p, idioma).replace(t.enLugar, "")}`,
      t.palabraClave,
      "RHF Living",
    ],
    alternates: { canonical, languages },
    openGraph: {
      title: ti,
      description: d,
      url: canonical,
      siteName: "RHF Living",
      locale: t.locale,
      type: "website",
      images: [{ url: `${SITIO}${imagen}`, width: 1200, height: 630, alt: `${p.nombre} — ${t.material}` }],
    },
    twitter: {
      card: "summary_large_image",
      title: ti,
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
function datosEstructurados(p: Proyecto, idioma: Idioma) {
  const { puedePublicarPrecio, fechaISO } = proyectos(idioma);
  const url = alternos(`/proyectos/${p.slug}`, idioma).canonical;
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
  if (idioma === "en") ficha.inLanguage = "en";

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

export default function PaginaProyecto({ slug, idioma = "es" }: { slug: string; idioma?: Idioma }) {
  const p = proyectos(idioma).getProyecto(slug);
  if (!p) notFound();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(datosEstructurados(p, idioma)) }}
      />
      <ProyectoLanding p={p} idioma={idioma} />
    </>
  );
}
