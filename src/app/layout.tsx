import type { Metadata } from "next";
import { Cormorant_Garamond, Montserrat } from "next/font/google";
import "./globals.css";
import ChatDiferido from "@/components/ChatDiferido";
import Analitica from "@/components/Analitica";
import ReferenciaDolares from "@/components/ReferenciaDolares";
import { MONEDA_ANTES_DE_PINTAR } from "@/lib/moneda";
import Script from "next/script";

// Las fuentes van sin <link rel="preload"> (29-sep-2026). En Chrome 154 una
// fuente precargada bloquea el primer pintado (RenderBlockingFonts) y, sumada
// al paint holding, lo retenía cerca de un segundo después de llegar el HTML:
// la portada pintaba a los 2,4 s en vez de a los 0,7 s (medido con Lighthouse,
// apagando cada función de Chrome por separado). Sin precarga, el texto sale
// con la fuente de respaldo ya ajustada (adjustFontFallback) y cambia apenas
// llega la buena, sin mover nada.
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-serif",
  preload: false,
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  preload: false,
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
        <ChatDiferido />
        <ReferenciaDolares />
        <Analitica />
      </body>
    </html>
  );
}
