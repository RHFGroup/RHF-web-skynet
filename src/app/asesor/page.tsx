import type { Metadata } from "next";
import PaginaAsesor, { CREDENCIALES } from "@/components/PaginaAsesor";
import { NOMBRE_COMPLETO } from "@/data/asesor";
import { CORREO, WHATSAPP } from "@/data/contacto";

/**
 * /asesor — Medardo Rafael Hernández Franco y su equipo.
 *
 * La home tiene la versión corta («Quién te asesora») y su botón trae aquí.
 * Los datos estructurados de la persona viven en esta página (ProfilePage +
 * Person), para que lo encuentren por su nombre.
 */

const SITIO = "https://rhfliving.com";
const TITULO = `${NOMBRE_COMPLETO}, asesor inmobiliario en Cartagena | RHF Living`;
const DESCRIPCION =
  "Asesor inmobiliario independiente en Cartagena de Indias. Compara proyectos de varias constructoras en la Zona Norte, con su fuente y su fecha de corte, y cuenta con estudio jurídico propio.";

export const metadata: Metadata = {
  title: { absolute: TITULO },
  description: DESCRIPCION,
  alternates: { canonical: `${SITIO}/asesor` },
  openGraph: {
    title: TITULO,
    description: DESCRIPCION,
    url: `${SITIO}/asesor`,
    siteName: "RHF Living",
    locale: "es_CO",
    type: "profile",
    images: [{ url: `${SITIO}/rafael/camisa-blanca-1040.jpg`, width: 1040, height: 1300, alt: NOMBRE_COMPLETO }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITULO,
    description: DESCRIPCION,
    images: [`${SITIO}/rafael/camisa-blanca-1040.jpg`],
  },
};

const perfilJsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  url: `${SITIO}/asesor`,
  mainEntity: {
    "@type": "Person",
    name: NOMBRE_COMPLETO,
    alternateName: "Rafael Hernández Franco",
    jobTitle: "Asesor inmobiliario",
    description:
      "Asesor inmobiliario independiente en Cartagena de Indias. Acompaña la compra de vivienda en Cartagena y la Zona Norte.",
    url: `${SITIO}/asesor`,
    image: `${SITIO}/rafael/camisa-blanca-1040.jpg`,
    telephone: `+${WHATSAPP}`,
    email: CORREO,
    worksFor: { "@type": "RealEstateAgent", name: "RHF Living — Rafael Hernández Franco", url: SITIO },
    homeLocation: { "@type": "Place", name: "Cartagena de Indias, Bolívar, Colombia" },
    alumniOf: [
      { "@type": "CollegeOrUniversity", name: "Universidad Militar Nueva Granada" },
      { "@type": "CollegeOrUniversity", name: "Universidad Sergio Arboleda" },
    ],
    hasCredential: CREDENCIALES.slice(0, 2).map((c) => ({
      "@type": "EducationalOccupationalCredential",
      name: c.titulo,
      description: c.pie,
    })),
  },
};

export default function PaginaDelAsesor() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(perfilJsonLd) }} />
      <PaginaAsesor />
    </>
  );
}
