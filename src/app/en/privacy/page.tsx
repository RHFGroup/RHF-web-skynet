import type { Metadata } from "next";
import LegalPage, { Seccion, RESPONSABLE } from "@/components/LegalPage";
import { alternos, SITIO } from "@/i18n/idioma";

/**
 * La política de datos en inglés (29-sep-2026): traducción de cortesía de
 * /privacidad, sección por sección y con la misma estructura. La que obliga es
 * la versión en español, y la página lo dice arriba (LegalPage).
 *
 * Si el español cambia, esta traducción se revisa con él, fecha incluida: la
 * de abajo es la de la versión en español que se tradujo.
 *
 * Las leyes y las entidades colombianas van con su nombre y, la primera vez,
 * con una explicación corta. Los términos que la ley define (responsable y
 * encargado del tratamiento, «reclamo en trámite») y las palabras que hay que
 * escribir tal cual (BAJA, «Eliminación de datos») llevan el original.
 */
const TITULO = "Personal Data Processing Policy — RHF";
const DESCRIPCION =
  "How we collect, use, protect and delete the personal data of the people who write to us, under Law 1581 of 2012 (Colombia's personal data protection law).";
const ALTERNOS = alternos("/privacidad", "en");

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

export default function Privacy() {
  return (
    <LegalPage
      idioma="en"
      rutaEs="/privacidad"
      titulo="Personal Data Processing Policy"
      bajada="If you write to us on WhatsApp, through the chat on this website, on Instagram or on Facebook, if you subscribe to the newsletter, or if you leave your details at a trade fair, we end up holding information about you. Here we explain what we do with it, for how long, and how to ask us to delete it."
      // La fecha de la versión en español que traduce esta página.
      vigencia="September 30, 2026"
    >
      <Seccion titulo="1. Who is responsible for your data">
        <p>
          The data controller (responsable del tratamiento) is{" "}
          <strong>{RESPONSABLE.nombreLegal}</strong>, a natural person
          identified by a Colombian citizenship ID card (cédula de ciudadanía),
          who acts under the trade name{" "}
          <strong>{RESPONSABLE.nombreComercial}</strong>.
        </p>
        <p>
          Address: {RESPONSABLE.direccion}. Email:{" "}
          <a href={`mailto:${RESPONSABLE.correo}`} className="underline">
            {RESPONSABLE.correo}
          </a>
          . Phone and WhatsApp: {RESPONSABLE.telefono}.
        </p>
        <p>
          He personally handles inquiries and claims about personal data. There
          are no intermediaries or internal departments: you write to the email
          address or the WhatsApp number above and he answers you directly.
        </p>
      </Seccion>

      <Seccion titulo="2. What data we collect and through which channels">
        <p>
          We collect what you give us when you contact us: your name, phone
          number, email address, the profile name you use on social media, and
          the content of the conversation—which project interests you, what
          budget you are working with, whether you are looking for a home or an
          investment, and in what time frame. In some cases, when you move
          toward a purchase, we also collect the identification details
          required by the builder’s client onboarding process.
        </p>
        <p>That data reaches us through seven channels:</p>
        <ul className="ml-5 list-disc space-y-2">
          <li>
            <strong>The form on this website.</strong> We store what you
            write—your name, the phone number or email address at which you want
            us to contact you, the project that interests you and your
            message—together with the record of your authorization: the date
            and time of submission, the version of the text you accepted, your
            IP address and the browser you submitted it from. That record exists
            for a reason: the law requires us to be able to prove that your
            authorization was prior, express and informed, and without it,
            keeping your data would be worse than not keeping it. On the “Sell
            or list your property” page, the form also asks for the location
            and type of the property. After submitting, if you prefer, you can
            continue the conversation on WhatsApp.
          </li>
          <li>
            <strong>Newsletter subscription.</strong> If you subscribe to the
            newsletter with news from Zona Norte, Cartagena’s northern corridor,
            we store your email address and the same record of your
            authorization: the date and time, the version of the text you
            accepted, your IP address and your browser.
          </li>
          <li>
            <strong>WhatsApp Business.</strong> When you write to us, we
            receive your number, your profile name and the messages you send.
            If you send a voice note, it is transcribed automatically on our own
            server so that the assistant can understand it.
          </li>
          <li>
            <strong>The assistant on WhatsApp and in this website’s chat.</strong>{" "}
            An automated assistant attends to you first and answers with public
            information about our portfolio. If you ask for a call with Rafael,
            the assistant records your name, the city you are writing from, your
            number (on WhatsApp, the one you are writing from; in the chat, the
            one you give us), the day and time you chose and a summary of what
            you are looking for, and Rafael receives the notification.
          </li>
          <li>
            <strong>Analytics and advertising cookies, only if you accept
            them.</strong> If you authorize it in the cookie notice, this
            website loads Google Tag Manager and Google Analytics (Google LLC)
            and the Meta pixel (Meta Platforms), which record how the website is
            used—pages viewed, WhatsApp clicks, brochure downloads, form
            submissions—in order to measure results and show ads for our
            projects. Without your authorization, none of them loads. You can
            change your decision whenever you want under “Cookie preferences,”
            at the bottom of every page.
          </li>
          <li>
            <strong>Instagram and Facebook.</strong> Direct messages and
            comments on our profiles.
          </li>
          <li>
            <strong>Trade fairs and in-person events.</strong> The paper forms
            you fill out at the service desk.
          </li>
        </ul>
        <p>
          We do not collect sensitive data—health, ethnic origin, sexual
          orientation, political or religious beliefs, biometric data—and we
          will not ask you for it. If you happen to include any of it in a
          message on your own, we do not use it for anything and we delete it.
        </p>
      </Seccion>

      <Seccion titulo="3. What we use your data for">
        <p>
          Your data is used to answer you, understand what you are looking for
          and show you the options in our portfolio that fit; to coordinate
          visits, appointments and the reservation or purchase process with the
          relevant builder; to send you information about projects, availability
          and prices when you have agreed to receive it; and to keep the
          internal record of our sales management.
        </p>
        <p id="boletin">
          If you subscribe to the newsletter, we use your email address only to
          send you the news from Zona Norte and updates on our portfolio. You
          can unsubscribe whenever you want by replying <em>BAJA</em> (Spanish
          for “unsubscribe”) to any newsletter or by writing to{" "}
          <a href={`mailto:${RESPONSABLE.correo}`} className="underline">
            {RESPONSABLE.correo}
          </a>
          , and from that moment on you will not receive any more.
        </p>
        <p>
          Sending promotional messages via WhatsApp requires your prior and
          express authorization. You can withdraw it at any time by replying{" "}
          <em>BAJA</em> to any of those messages, and we stop sending them to
          you. This does not affect the conversations you start or the answers
          to what you ask us.
        </p>
        <p>
          We do not sell your data, we do not hand it over to third parties for
          their own advertising, and we do not use it for any purpose other than
          the ones you have just read.
        </p>
      </Seccion>

      <Seccion titulo="4. Who we share your data with">
        <p>
          We share data only with those who are needed to serve you: the
          builder or developer of the project that interests you, when you move
          toward a reservation or a purchase and that entity needs your data to
          onboard you as a client; and the technology providers that operate our
          channels, which act as data processors (encargados del tratamiento)
          and may not use your information for their own purposes.
        </p>
        <p>
          Those providers are Meta Platforms (which operates the WhatsApp
          Business Platform, Instagram, Facebook and, if you accept cookies, its
          pixel); Google LLC (Tag Manager and Analytics, only if you accept
          cookies); the infrastructure provider that hosts this website and the
          customer service channel; the provider of the language model that
          powers the assistant, which processes the text of the conversation in
          order to answer you; Telegram, through which Rafael receives the
          notification of each inquiry or requested call; and the email and
          sales management tools we use. Some of them process information
          outside Colombia, which constitutes an international transfer; by
          accepting this policy you authorize that transfer under the terms of
          Articles 26 and 27 of Law 1581 of 2012 (Colombia’s personal data
          protection law).
        </p>
        <p>
          We also provide information when a judicial or administrative
          authority requires it in the exercise of its functions.
        </p>
      </Seccion>
      <Seccion titulo="5. Your rights">
        <p>
          Article 8 of Law 1581 of 2012 grants you rights that do not depend on
          our goodwill. You can find out what data of yours we hold and what we
          use it for, free of charge. You can ask us to correct data that is
          incomplete, outdated or wrong. You can revoke the authorization you
          gave and ask us to delete your data. You can demand proof of the
          authorization you granted. And you can file a complaint with the
          Superintendence of Industry and Commerce (SIC), Colombia’s data
          protection authority, if we assess your claim wrongly or do not answer
          you.
        </p>
        <p>
          There is one limit worth stating up front: deletion does not apply
          when there is a legal or contractual duty to keep the data. If you
          signed a reservation (separación) or a preliminary purchase agreement
          (promesa), the records of that transaction are kept for the period
          required by commercial and tax law, even if you ask us to delete them.
        </p>
      </Seccion>

      <Seccion titulo="6. How to exercise those rights">
        <p>
          Write to{" "}
          <a href={`mailto:${RESPONSABLE.correo}`} className="underline">
            {RESPONSABLE.correo}
          </a>{" "}
          or to WhatsApp {RESPONSABLE.telefono}, stating your name, a way to
          contact you so we can answer, and what you want: to consult, correct,
          update or delete your data. You do not need a lawyer or any special
          form.
        </p>
        <p>
          <strong>Inquiries</strong> are handled within a maximum of ten
          business days, which may be extended by five more if we cannot make
          it in time, in which case we tell you the reason and the new date
          (Article 14 of Law 1581 of 2012). <strong>Claims</strong>—when you
          believe that some data should be corrected, updated or deleted—are
          handled within fifteen business days, which may be extended by eight
          more under the same rule (Article 15). While the claim is being
          processed, the data is marked “claim in process” (reclamo en
          trámite).
        </p>
        <p>
          Filing the claim with us is a prerequisite for going to the SIC
          (Article 16). That is why it makes sense to start here: it is faster,
          and it is almost always resolved without getting that far.
        </p>
      </Seccion>

      <Seccion id="supresion" titulo="7. How to ask us to delete your data">
        <p>
          If you want us to delete all the information we have about you, send
          a message to WhatsApp {RESPONSABLE.telefono} or an email to{" "}
          <a href={`mailto:${RESPONSABLE.correo}`} className="underline">
            {RESPONSABLE.correo}
          </a>{" "}
          with the subject line <strong>“Eliminación de datos”</strong> (Spanish
          for “data deletion”), stating the phone number, email address or
          social media profile you contacted us from, so that we can identify
          your record.
        </p>
        <p>
          Within the following fifteen business days, we delete your data from
          our databases and from our sales management tools, and we confirm to
          you through the same channel that we have done so. We keep only what
          a legal or contractual duty requires us to keep, and in that case we
          tell you what remains and why.
        </p>
        <p>
          Any conversation in the WhatsApp app on your own phone is yours, and
          you are the one who deletes it; we delete the copy on our side.
        </p>
      </Seccion>

      <Seccion titulo="8. Minors">
        <p>
          This website and our customer service channels are intended for
          persons of legal age with the capacity to enter into contracts. We do
          not knowingly collect data from minors. If we detect that some data
          belongs to a minor, we delete it.
        </p>
      </Seccion>

      <Seccion titulo="9. Security and retention">
        <p>
          We apply reasonable technical and administrative measures so that
          your data is not lost and is not within reach of anyone who should not
          see it: access restricted to whoever handles sales management,
          encrypted channels and providers with their own security controls. No
          measure is infallible, and we are not going to promise otherwise.
        </p>
        <p>
          We keep your data for as long as the business relationship lasts and,
          afterwards, for the time needed to meet legal obligations or address
          claims. Once that period is over, it is deleted.
        </p>
        <p>
          The newsletter email address is kept for as long as you remain
          subscribed. If you unsubscribe, it is no longer used for any mailing
          and is marked as unsubscribed, together with the record of your
          authorization, so that we can prove both. If you also want us to
          delete it, ask for it as explained in section 7.
        </p>
        <p>
          For the inquiries that come in through the form on this website, the
          period is specific: <strong>two years from our last contact with
          you</strong>. That is how long a real estate decision stays alive and
          how long your inquiry still helps us answer you well. Once the two
          years are up, they are deleted, and if you ask us sooner, we delete
          them sooner—just write to us, as explained in section 7.
        </p>
        <p>
          Those inquiries, and the newsletter email addresses, are stored in a
          database hosted on Cloudflare’s infrastructure, encrypted at rest.
          The form can only write to it; reading is done by the data controller
          with his own credentials, and it is not exposed on the website.
        </p>
        <p>
          The inquiry and newsletter forms also use Cloudflare Turnstile, an
          automatic check that tells a person apart from a program before what
          you send is saved. For most people it is invisible: there is no
          image puzzle to solve.
          Turnstile does not install tracking cookies or use your data for
          advertising, and it runs on the same infrastructure that already hosts
          this website, so your inquiry does not go through an additional third
          party.
        </p>
      </Seccion>

      <Seccion titulo="10. Effective date and changes">
        <p>
          This policy is in effect from the date stated at the top and for as
          long as the databases we manage are maintained. If we modify it, we
          publish the new version at this same address, with its date; when the
          change affects the purpose of the processing, we inform you through
          the channel you use with us and ask for your authorization again.
        </p>
        <p className="text-sm text-marino/60">
          Applicable framework: Law 1581 of 2012, Decree 1074 of 2015 (which
          compiled Decree 1377 of 2013, a regulation implementing Law 1581) and
          External Circular 002 of 2015 of the Superintendence of Industry and
          Commerce. The data controller is a natural person and, under
          Decree 090 of 2018, is not required to register his databases in the
          National Database Registry (Registro Nacional de Bases de Datos).
        </p>
      </Seccion>
    </LegalPage>
  );
}
