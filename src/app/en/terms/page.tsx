import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { Seccion, RESPONSABLE } from "@/components/LegalPage";
import { alternos, ruta, SITIO } from "@/i18n/idioma";

/**
 * Los términos de uso en inglés (29-sep-2026): traducción de cortesía de
 * /terminos, sección por sección y con la misma estructura. Los que obligan
 * son los de la versión en español, y la página lo dice arriba (LegalPage).
 *
 * Si el español cambia, esta traducción se revisa con él, fecha incluida: la
 * de abajo es la de la versión en español que se tradujo.
 */
const TITULO = "Terms of Use — RHF";
const DESCRIPCION =
  "The conditions under which the information on rhfliving.com is published and the contact channels are handled.";
const ALTERNOS = alternos("/terminos", "en");

export const metadata: Metadata = {
  title: { absolute: TITULO },
  description: DESCRIPCION,
  robots: { index: true, follow: true },
  alternates: ALTERNOS,
  openGraph: {
    title: TITULO,
    description: DESCRIPCION,
    url: ALTERNOS.canonical,
    siteName: "RHF Living",
    locale: "en_US",
    type: "website",
    // Al definir su propio openGraph, la página no hereda la imagen de la raíz.
    images: [{ url: `${SITIO}/og.jpg`, width: 1200, height: 630, alt: "RHF Living — Real estate advisory in Cartagena" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITULO,
    description: DESCRIPCION,
    images: [`${SITIO}/og.jpg`],
  },
};

export default function Terms() {
  return (
    <LegalPage
      idioma="en"
      rutaEs="/terminos"
      titulo="Terms of Use"
      bajada="The conditions under which we publish the information on this website and handle the contact channels. By using the site or writing to us through any of those channels, you accept these conditions."
      // La fecha de la versión en español que traduce esta página.
      vigencia="September 18, 2026"
    >
      <Seccion titulo="1. Who operates this site">
        <p>
          {RESPONSABLE.sitio} is operated by{" "}
          <strong>{RESPONSABLE.nombreLegal}</strong>, a natural person acting
          under the trade name{" "}
          <strong>{RESPONSABLE.nombreComercial}</strong>, domiciled at{" "}
          {RESPONSABLE.direccion}, who can be contacted at{" "}
          <a href={`mailto:${RESPONSABLE.correo}`} className="underline">
            {RESPONSABLE.correo}
          </a>{" "}
          and {RESPONSABLE.telefono}.
        </p>
      </Seccion>

      <Seccion titulo="2. I am an advisor, not the builder">
        <p>
          I market third-party real estate projects as an independent advisor.
          I am not the owner, the builder or the developer of the projects shown
          on this website, and I do not manage the funds of those who buy. The
          contractual purchase relationship is always entered into between the
          buyer and the project’s construction or development entity, under the
          documents that entity issues.
        </p>
        <p>
          My job is to show you the options, explain the differences and
          accompany you through the process. Delivery obligations, compliance
          with the construction schedule, technical specifications and the
          property’s warranties are the builder’s responsibility, not mine.
        </p>
      </Seccion>

      <Seccion titulo="3. The published information is not a commercial offer">
        <p>
          The prices, areas, unit types, time frames and availability shown on
          this website correspond to the date indicated for each project and are
          provided by the builder. They may change without prior notice and do
          not constitute a binding commercial offer under Article 845 of the
          Colombian Commercial Code (Código de Comercio). Any condition is
          confirmed with the advisor and formalized in the builder’s documents.
        </p>
        <p>
          Images, renderings and walkthroughs are illustrative. They do not
          necessarily reproduce the final finishes, furniture, vegetation or
          surroundings.
        </p>
        <p>
          Advertising for housing projects is subject to the information
          requirements of the Circular Única (Single Circular) of the
          Superintendence of Industry and Commerce (SIC), Colombia’s consumer
          protection authority. The complete information on each project—exact
          address, estrato (Colombia’s socioeconomic classification of
          properties), private built area (área privada construida), delivery
          date, real estate registration number (matrícula inmobiliaria),
          condominium regulations (reglamento de propiedad horizontal) and
          funds management scheme (esquema de manejo de recursos)—is available
          for direct consultation, and it is advisable to review it before
          committing any money.
        </p>
      </Seccion>

      <Seccion titulo="4. Contact channels">
        <p>
          We attend to inquiries on WhatsApp, through this website’s chat, on
          Instagram and on Facebook. The website chat and the WhatsApp channel
          may be handled by an automated assistant that answers with public
          information about the portfolio; when the inquiry calls for it, the
          conversation is passed on to an advisor.
        </p>
        <p>
          That assistant can make mistakes. Nothing it answers constitutes
          legal, financial or tax advice, nor does it commit to any commercial
          terms. What counts is what is set down in writing in the builder’s
          documents.
        </p>
        <p>
          The processing of the personal data you provide through those
          channels is governed by our{" "}
          <Link href={ruta("en", "/privacidad")} className="underline">
            Personal Data Processing Policy
          </Link>
          .
        </p>
      </Seccion>

      <Seccion titulo="5. Intellectual property">
        <p>
          The texts, the design, the RHF brand, the logo and this website’s own
          graphic material are protected by Law 23 of 1982 (Colombia’s
          copyright law) and Decision 486 of the Andean Community (the Andean
          common industrial property regime). You may view them and share
          links. You may not reproduce, modify or use them for commercial
          purposes without written authorization.
        </p>
        <p>
          The renderings, floor plans and materials of each project belong to
          their respective builders and are published with their authorization
          for marketing purposes.
        </p>
      </Seccion>

      <Seccion titulo="6. Site availability">
        <p>
          We strive to keep the website available and up to date, without
          guaranteeing uninterrupted operation or the absence of errors. We may
          modify, suspend or remove content at any time, including projects
          that are no longer on the market.
        </p>
      </Seccion>

      <Seccion titulo="7. Governing law">
        <p>
          These terms are governed by Colombian law. Any dispute is submitted
          to the courts of Cartagena de Indias, without prejudice to the
          consumer protection actions before the SIC provided for in Law 1480
          of 2011 (Colombia’s Consumer Protection Statute).
        </p>
      </Seccion>

      <Seccion titulo="8. Changes">
        <p>
          We may update these terms. The version in force is always the one
          published at this address, with the date indicated at the top.
        </p>
      </Seccion>
    </LegalPage>
  );
}
