import type { Metadata } from "next";
import PaginaAsesor, { credenciales } from "@/components/PaginaAsesor";
import { NOMBRE_COMPLETO } from "@/data/asesor";
import { CORREO, WHATSAPP } from "@/data/contacto";
import { alternos, SITIO, type Idioma } from "@/i18n/idioma";

/**
 * /asesor y /en/advisor — Medardo Rafael Hernández Franco y su equipo. Una
 * sola página en los dos idiomas (docs/i18n.md).
 *
 * La home tiene la versión corta («Quién te asesora») y su botón trae aquí.
 * Los datos estructurados de la persona viven en esta página (ProfilePage +
 * Person), para que lo encuentren por su nombre.
 */

const TEXTOS = {
  es: {
    titulo: `${NOMBRE_COMPLETO}, asesor inmobiliario en Cartagena | RHF Living`,
    descripcion:
      "Asesor inmobiliario independiente en Cartagena de Indias. Compara proyectos de varias constructoras en la Zona Norte, con su fuente y su fecha de corte, y cuenta con estudio jurídico propio.",
    locale: "es_CO",
    cargo: "Asesor inmobiliario",
    persona:
      "Asesor inmobiliario independiente en Cartagena de Indias. Acompaña la compra de vivienda en Cartagena y la Zona Norte.",
  },
  en: {
    titulo: `${NOMBRE_COMPLETO}, real estate advisor in Cartagena | RHF Living`,
    descripcion:
      "Independent real estate advisor in Cartagena de Indias, Colombia. He compares projects from several builders in the Zona Norte, each with its source and its as-of date, and works with his own legal team.",
    locale: "en_US",
    cargo: "Real estate advisor",
    persona:
      "Independent real estate advisor in Cartagena de Indias, Colombia. He guides home purchases in Cartagena and its Zona Norte.",
  },
} satisfies Record<Idioma, Record<string, string>>;

export function metadataAsesor(idioma: Idioma): Metadata {
  const t = TEXTOS[idioma];
  const { canonical, languages } = alternos("/asesor", idioma);
  return {
    title: { absolute: t.titulo },
    description: t.descripcion,
    alternates: { canonical, languages },
    openGraph: {
      title: t.titulo,
      description: t.descripcion,
      url: canonical,
      siteName: "RHF Living",
      locale: t.locale,
      type: "profile",
      images: [{ url: `${SITIO}/rafael/camisa-blanca-1040.jpg`, width: 1040, height: 1300, alt: NOMBRE_COMPLETO }],
    },
    twitter: {
      card: "summary_large_image",
      title: t.titulo,
      description: t.descripcion,
      images: [`${SITIO}/rafael/camisa-blanca-1040.jpg`],
    },
  };
}

function perfilJsonLd(idioma: Idioma) {
  const t = TEXTOS[idioma];
  const url = alternos("/asesor", idioma).canonical;
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url,
    ...(idioma === "en" ? { inLanguage: "en" } : {}),
    mainEntity: {
      "@type": "Person",
      name: NOMBRE_COMPLETO,
      alternateName: "Rafael Hernández Franco",
      jobTitle: t.cargo,
      description: t.persona,
      url,
      image: `${SITIO}/rafael/camisa-blanca-1040.jpg`,
      telephone: `+${WHATSAPP}`,
      email: CORREO,
      worksFor: { "@type": "RealEstateAgent", name: "RHF Living — Rafael Hernández Franco", url: SITIO },
      homeLocation: { "@type": "Place", name: "Cartagena de Indias, Bolívar, Colombia" },
      alumniOf: [
        { "@type": "CollegeOrUniversity", name: "Universidad Militar Nueva Granada" },
        { "@type": "CollegeOrUniversity", name: "Universidad Sergio Arboleda" },
      ],
      hasCredential: credenciales(idioma)
        .slice(0, 2)
        .map((c) => ({
          "@type": "EducationalOccupationalCredential",
          name: c.titulo,
          description: c.pie,
        })),
    },
  };
}

export default function PaginaDelAsesor({ idioma = "es" }: { idioma?: Idioma }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(perfilJsonLd(idioma)) }} />
      <PaginaAsesor idioma={idioma} />
    </>
  );
}
