import type { Metadata } from "next";
import { Cormorant_Garamond, Montserrat } from "next/font/google";
import "./globals.css";
import ChatDiferido from "@/components/ChatDiferido";
import Analitica from "@/components/Analitica";
import ReferenciaDolares from "@/components/ReferenciaDolares";
import IdiomaDocumento from "@/components/IdiomaDocumento";
import CapturaAtribucion from "@/components/CapturaAtribucion";
import { MONEDA_ANTES_DE_PINTAR } from "@/lib/moneda";
import Script from "next/script";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-serif",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://rhfliving.com"),
  title: "RHF — Asesoría Inmobiliaria Premium en Cartagena",
  description:
    "Rafael Hernández Franco. Asesoría inmobiliaria premium en Cartagena y la Zona Norte. Conoce nuestra cartera: Doral Country, Doral Suite, Doral West, Acacias Campestre y Blue Garden.",
  keywords: [
    "asesoría inmobiliaria Cartagena",
    "apartamentos Zona Norte Cartagena",
    "Doral Cartagena",
    "RHF propiedades",
    "inversión inmobiliaria Cartagena",
    "Rafael Hernández Franco",
  ],
  authors: [{ name: "Rafael Hernández Franco" }],
  openGraph: {
    title: "RHF — Asesoría Inmobiliaria Premium en Cartagena",
    description:
      "Nuestra cartera de proyectos en la Zona Norte y alrededores. Te acompañamos en cada paso.",
    url: "https://rhfliving.com",
    siteName: "RHF Asesoría Inmobiliaria",
    locale: "es_CO",
    type: "website",
    images: [
      {
        url: "https://rhfliving.com/og.jpg",
        width: 1200,
        height: 630,
        alt: "RHF — Asesoría Inmobiliaria Cartagena",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RHF — Asesoría Inmobiliaria Premium en Cartagena",
    description:
      "Nuestra cartera de proyectos en la Zona Norte y alrededores.",
    images: [
      "https://rhfliving.com/og.jpg",
    ],
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "https://rhfliving.com" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  name: "RHF — Rafael Hernández Franco",
  description:
    "Asesoría inmobiliaria premium en Cartagena y la Zona Norte. Cartera de proyectos: Doral Country, Doral Suite, Doral West, Acacias Campestre, Blue Garden.",
  url: "https://rhfliving.com",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Cartagena",
    addressRegion: "Bolívar",
    addressCountry: "CO",
  },
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    availableLanguage: ["es"],
  },
  knowsAbout: [
    "Propiedad raíz",
    "Apartamentos Zona Norte Cartagena",
    "Inversión inmobiliaria",
    "Doral Cartagena",
  ],
  areaServed: {
    "@type": "City",
    name: "Cartagena",
  },
};

/**
 * La elección del control «Animaciones» del pie de página (src/lib/motion.ts),
 * aplicada antes de pintar: sin esto, quien las activó vería un instante la
 * página quieta y luego el salto. Si el navegador no deja leer el
 * almacenamiento, no pasa nada: manda lo que pida el sistema.
 */
/**
 * El idioma del documento, antes de pintar (29-sep-2026, sitio en inglés).
 * El layout raíz es uno solo y escribe `lang="es"`; en /en este script lo
 * cambia a "en" antes del primer cuadro, para los lectores de pantalla, el
 * traductor del navegador y los componentes del layout que eligen su texto
 * por `document.documentElement.lang` (chat, aviso de cookies, referencia en
 * dólares). Google toma el idioma del contenido y de los `hreflang`.
 */
const IDIOMA_ANTES_DE_PINTAR = `if(location.pathname==="/en"||location.pathname.indexOf("/en/")===0)document.documentElement.lang="en"`;

const MOVIMIENTO_ANTES_DE_PINTAR = `try{var m=localStorage.getItem("rhf-movimiento");if(m==="activo"||m==="reducido")document.documentElement.setAttribute("data-mov",m)}catch(e){}`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${cormorant.variable} ${montserrat.variable} scroll-smooth`}
      // Los scripts de abajo pueden agregar data-mov y data-moneda antes de que React hidrate.
      suppressHydrationWarning
    >
      <head>
        <script id="idioma" dangerouslySetInnerHTML={{ __html: IDIOMA_ANTES_DE_PINTAR }} />
        <script id="movimiento" dangerouslySetInnerHTML={{ __html: MOVIMIENTO_ANTES_DE_PINTAR }} />
        {/* La moneda de la referencia de precio (src/lib/moneda.ts), antes de pintar. */}
        <script id="moneda" dangerouslySetInnerHTML={{ __html: MONEDA_ANTES_DE_PINTAR }} />
        <Script
          id="json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-dvh font-sans antialiased">
        {children}
        <IdiomaDocumento />
        {/* Por dónde entró, solo en esta pestaña y sin cookies (src/lib/atribucion.ts). */}
        <CapturaAtribucion />
        <ChatDiferido />
        <ReferenciaDolares />
        <Analitica />
      </body>
    </html>
  );
}
