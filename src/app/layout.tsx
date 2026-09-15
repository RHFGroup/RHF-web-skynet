import type { Metadata } from "next";
import { Cormorant_Garamond, Montserrat } from "next/font/google";
import "./globals.css";
import AgentChat from "@/components/AgentChat";
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${cormorant.variable} ${montserrat.variable} scroll-smooth`}
    >
      <head>
        <Script
          id="json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-dvh font-sans antialiased">
        {children}
        <AgentChat />
      </body>
    </html>
  );
}
