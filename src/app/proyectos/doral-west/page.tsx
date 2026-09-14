import type { Metadata } from "next";
import ProyectoLanding, { type ProyectoData } from "@/components/ProyectoLanding";

/**
 * Fuente: `projects/doral-west/doral-west` del vault, que a su vez deriva del
 * Excel del constructor con corte 2026-08-03.
 *
 * ⛔ No publicar acá: precios (faltan estrato, cuota de administración,
 * acabados y valor de desistimiento — cuatro de los diez datos de la Circular
 * 004); los lotes (salieron del inventario del 3-ago); las casas de 1 piso de
 * 64 m² (están en el Excel pero no en ninguna pieza nuestra — pendiente de
 * confirmar con el promotor); y cualquier afirmación de valorización: vender
 * rápido es escasez, no apreciación de precio.
 */

const CORTE = "Excel del constructor, corte 3 de agosto de 2026";

export const metadata: Metadata = {
  title: "Doral West — Casas en Zona Norte de Cartagena",
  description:
    "Casas de 1 y 2 pisos en condominio cerrado. Quedan 7 de las 272 casas de la Etapa 1. Entrega entre noviembre de 2026 y octubre de 2028. Asesoría independiente RHF.",
  keywords: [
    "Doral West Cartagena",
    "casas Zona Norte Cartagena",
    "condominio cerrado Cartagena",
    "casas Vía al Mar",
  ],
  alternates: { canonical: "/proyectos/doral-west" },
  openGraph: {
    title: "Doral West — Casas en Zona Norte de Cartagena",
    description:
      "Casas de 1 y 2 pisos en condominio cerrado. Quedan 7 de las 272 casas de la Etapa 1. Entrega entre noviembre de 2026 y octubre de 2028.",
    url: "/proyectos/doral-west",
    siteName: "RHF Asesoría Inmobiliaria",
    locale: "es_CO",
    type: "website",
    images: [
      {
        url: "/proyectos/doral-west/og.jpg",
        width: 1200,
        height: 630,
        alt: "Doral West — casas en la Zona Norte de Cartagena",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Doral West — Casas en Zona Norte de Cartagena",
    description:
      "Casas de 1 y 2 pisos en condominio cerrado. Quedan 7 de las 272 casas de la Etapa 1.",
    images: ["/proyectos/doral-west/og.jpg"],
  },
};

const doralWest: ProyectoData = {
  slug: "doral-west",
  nombre: "Doral West",
  zona: "Zona Norte",
  heroTitulo: "Casas en la Zona Norte, donde Cartagena está creciendo",
  heroSub: "Quedan 7 casas de las 272 de la Etapa 1.",
  heroImg: "/proyectos/doral-west/hero.jpg",
  intro:
    "Condominio cerrado de casas de 1 y 2 pisos sobre la Vía al Mar. La Etapa 1 está entregando y la Etapa 2 está en venta. Es el proyecto mejor documentado de nuestra cartera: la constructora tiene NIT verificado y fecha de entrega por manzana en el documento del promotor.",
  tipologias: [
    { titulo: "Casa de 1 piso", detalle: "53 m² construidos sobre lote de 150 m²" },
    { titulo: "Casa de 2 pisos", detalle: "100 m² construidos sobre lote de 128 m²" },
    { titulo: "Casa premium", detalle: "100 m² construidos sobre lote de 288 m²" },
  ],
  amenidades: [
    "Condominio cerrado",
    "Acceso a administración",
    "Parqueadero privado por casa",
  ],
  datos: [
    { label: "Ubicación", valor: "Vía al Mar 90A, Zona Norte, Cartagena" },
    { label: "Constructora", valor: "Doral West S.A.S. · NIT 901641288" },
    { label: "Producto", valor: "Casas de 1 y 2 pisos en condominio cerrado" },
    { label: "Parqueadero", valor: "Privado" },
    { label: "Entrega", valor: "Entre noviembre de 2026 y octubre de 2028, según la manzana" },
    { label: "Etapa 1", valor: "Entregando · quedan 7 de 272 casas" },
    { label: "Etapa 2", valor: "En venta" },
  ],
  fuente: `Disponibilidad, áreas y fechas de entrega: ${CORTE}. El precio vigente y su respaldo documental te los damos por el chat o en asesoría directa.`,
  ubicacion: "Vía al Mar 90A, Zona Norte de Cartagena",
  ubicacionNota:
    "Sobre el corredor que conecta Cartagena con Barranquilla, en el eje donde se concentra la vivienda nueva del departamento.",
  galeria: [
    { src: "/proyectos/doral-west/galeria-1.jpg", alt: "Doral West — vista aérea del condominio y la zona de piscina" },
    { src: "/proyectos/doral-west/galeria-2.jpg", alt: "Doral West — canchas y casas del condominio" },
    { src: "/proyectos/doral-west/galeria-3.jpg", alt: "Doral West — senderos y zonas verdes del condominio" },
    { src: "/proyectos/doral-west/galeria-4.jpg", alt: "Doral West — fachada de casa de un piso con parqueadero privado" },
  ],
};

export default function DoralWestPage() {
  return <ProyectoLanding p={doralWest} />;
}
