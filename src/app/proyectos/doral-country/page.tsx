import type { Metadata } from "next";
import ProyectoLanding, { type ProyectoData } from "@/components/ProyectoLanding";

/**
 * Fuente: `projects/doral-country/doral-country` del vault, que a su vez deriva
 * del Excel del constructor con corte 2026-08-03 y del brochure oficial (15 p).
 *
 * ⛔ No publicar acá: precios (faltan estrato, fecha de entrega, cuota de
 * administración y valor de desistimiento); áreas exactas (tres fuentes en
 * desacuerdo — Excel 40/42/62, brochure impreso 40/62, web 42/50/63/70; el
 * brochure es el documento con fecha y en él el 42 m² no existe); fecha de
 * entrega (solo hay plazos en meses); la razón social y el NIT (sin confirmar);
 * el número de torres (la ficha dice 4 en un lugar y T4-T6 en otro); y
 * "las primeras tres torres están casi agotadas" — la Torre 3 tiene 44 de las
 * 111 unidades disponibles.
 *
 * ⛔ Amenidades: solo las siete del brochure (p. 13). La primera versión del
 * plan anunciaba gimnasio, que no aparece en ninguna fuente.
 */

const CORTE = "Excel del constructor, corte 3 de agosto de 2026";

export const metadata: Metadata = {
  title: "Doral Country — Apartamentos en Zona Norte de Cartagena",
  description:
    "Apartamentos de 2 y 3 habitaciones en condominio cerrado. Torre 4 recién abierta. Piscina, cancha múltiple, parque infantil y salón social. Asesoría RHF.",
  keywords: [
    "Doral Country Cartagena",
    "apartamentos Zona Norte Cartagena",
    "condominio cerrado Cartagena",
    "apartamentos Vía al Mar",
  ],
  alternates: { canonical: "/proyectos/doral-country" },
  openGraph: {
    title: "Doral Country — Apartamentos en Zona Norte de Cartagena",
    description:
      "Apartamentos de 2 y 3 habitaciones en condominio cerrado. Torre 4 recién abierta. Piscina, cancha múltiple, parque infantil y salón social.",
    url: "/proyectos/doral-country",
    siteName: "RHF Asesoría Inmobiliaria",
    locale: "es_CO",
    type: "website",
    images: [
      {
        url: "/proyectos/doral-country/og.jpg",
        width: 1200,
        height: 630,
        alt: "Doral Country — zona de piscina del condominio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Doral Country — Apartamentos en Zona Norte de Cartagena",
    description:
      "Apartamentos de 2 y 3 habitaciones en condominio cerrado. Torre 4 recién abierta.",
    images: ["/proyectos/doral-country/og.jpg"],
  },
};

const doralCountry: ProyectoData = {
  slug: "doral-country",
  nombre: "Doral Country",
  zona: "Zona Norte",
  heroTitulo: "Apartamentos en un condominio cerrado con piscina y zonas comunes",
  heroSub: "Torre 4 recién abierta. Quedan 17 apartamentos entre las torres 1 y 2.",
  heroImg: "/proyectos/doral-country/hero.jpg",
  intro:
    "Condominio cerrado de apartamentos sobre la Vía al Mar, con piscina, cancha múltiple, parque infantil y salón social. Las torres 1 y 2 están casi agotadas y la Torre 4 acaba de abrir con el plazo de cuota inicial más largo del proyecto.",
  tipologias: [
    { titulo: "Apartamento de 2 habitaciones", detalle: "Sala-comedor, cocina, zona de labores y baño" },
    { titulo: "Apartamento de 3 habitaciones", detalle: "Sala-comedor, cocina y baño" },
  ],
  amenidades: [
    "Piscina",
    "Cancha múltiple",
    "Parque infantil",
    "Salón social",
    "Ascensor",
    "Parqueadero comunal",
    "Condominio cerrado",
  ],
  datos: [
    { label: "Ubicación", valor: "Vía al Mar 90A, Zona Norte, Cartagena" },
    { label: "Producto", valor: "Apartamentos de 2 y 3 habitaciones en torres" },
    { label: "Parqueadero", valor: "Comunal" },
    { label: "Disponibilidad", valor: "111 apartamentos entre las cuatro torres en venta" },
    { label: "Torres 1 y 2", valor: "Casi agotadas · quedan 17 apartamentos" },
    { label: "Torre 3", valor: "44 apartamentos disponibles" },
    { label: "Torre 4", valor: "Recién abierta · 50 apartamentos, plazo de cuota inicial de 39 meses" },
  ],
  fuente: `Disponibilidad: ${CORTE}. Las áreas exactas no se publican mientras las tres fuentes del constructor no coincidan, y la fecha de entrega tampoco: hasta hoy el promotor solo ha dado plazos en meses, sin fecha de calendario. Los pedimos por escrito.`,
  ubicacion: "Vía al Mar 90A, Zona Norte de Cartagena",
  ubicacionNota:
    "Sobre el corredor que conecta Cartagena con Barranquilla, en el eje donde se concentra la vivienda nueva del departamento.",
  galeria: [
    { src: "/proyectos/doral-country/galeria-1.jpg", alt: "Doral Country — vista aérea del condominio con la piscina y el parque infantil" },
    { src: "/proyectos/doral-country/galeria-2.jpg", alt: "Doral Country — parque infantil y zonas verdes entre las torres" },
    { src: "/proyectos/doral-country/galeria-3.jpg", alt: "Doral Country — fachada de las torres con la piscina y la zona social" },
    { src: "/proyectos/doral-country/galeria-4.jpg", alt: "Doral Country — fachada de las torres desde el acceso al condominio" },
  ],
};

export default function DoralCountryPage() {
  return <ProyectoLanding p={doralCountry} />;
}
