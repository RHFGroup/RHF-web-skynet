import type { Metadata } from "next";
import Animador from "@/components/Animador";
import CabeceraSitio from "@/components/CabeceraSitio";
import ContactForm from "@/components/ContactForm";
import ListaNoticias from "@/components/ListaNoticias";
import PieSitio from "@/components/PieSitio";
import Suscripcion from "@/components/Suscripcion";
import WhatsAppFlotante from "@/components/WhatsAppFlotante";
import { IconoWhatsApp } from "@/components/Iconos";
import { enlaceWhatsApp } from "@/data/contacto";
import { alternos, SITIO, type Idioma } from "@/i18n/idioma";
import "@/styles/noticias.css";
import "@/styles/secciones.css";

/**
 * /inteligencia-de-mercado y /en/market-intelligence — todas las noticias de
 * la Zona Norte (28-sep-2026, pedido de Rafael: «que abra en una sección
 * nueva»). Una sola página en los dos idiomas (docs/i18n.md). La home muestra
 * las tres más nuevas y trae aquí. Las noticias y sus reglas:
 * src/data/noticias.ts (y su versión en inglés, src/data/en/noticias.ts).
 *
 * 29-sep-2026 (informe de Luciano): la sección se llama «Inteligencia de
 * mercado», para darle peso de firma. Lo que no cambia es la atribución: cada
 * noticia dice qué medio la publicó, cuándo, y abre el artículo original.
 * Presentar una noticia ajena como análisis propio sería publicidad engañosa
 * (Ley 1480, art. 30). /noticias redirige aquí (public/_redirects).
 *
 * Sin datos estructurados de artículo: las noticias son de sus medios, y
 * aquí solo va el resumen propio con el enlace.
 */

const TEXTOS = {
  es: {
    titulo: "Inteligencia de mercado: la Zona Norte de Cartagena | RHF Living",
    descripcion:
      "Inteligencia de mercado de la Zona Norte de Cartagena: obras, inversión, vivienda y turismo en noticias verificadas, cada una con su fuente, su fecha y el enlace al artículo original.",
    locale: "es_CO",
    altOg: "RHF Living — Asesoría inmobiliaria en Cartagena",
    mensaje: "Hola Rafael, vi la inteligencia de mercado de la Zona Norte en tu página y quiero hablar contigo.",
    kicker: "Inteligencia de mercado",
    h1: "La Zona Norte de Cartagena, noticia por noticia",
    lede: "Seguimos lo que se construye, se abre y se invierte en el norte de la ciudad. Cada noticia lleva su medio y su fecha, y abre el artículo original.",
    todas: "Todas las noticias",
    boletin: "Suscripción al boletín",
    kickerContacto: "Contacto",
    h2Contacto: "Hablemos de la Zona Norte",
    ledeContacto: "Cuéntame qué buscas y te muestro los proyectos que encajan contigo.",
    escribeme: " Escríbeme por WhatsApp",
    avisoImagenes: "Las noticias son de sus medios: aquí va un resumen propio y el enlace al artículo original.",
  },
  en: {
    titulo: "Market intelligence: Cartagena's Zona Norte | RHF Living",
    descripcion:
      "Market intelligence on Cartagena's Zona Norte: infrastructure, investment, housing and tourism news, each item with its source, its date and a link to the original article (in Spanish).",
    locale: "en_US",
    altOg: "RHF Living — Real estate advisory in Cartagena",
    mensaje: "Hi Rafael, I saw the Zona Norte market intelligence on your website and I'd like to talk with you.",
    kicker: "Market intelligence",
    h1: "Cartagena's Zona Norte, one news item at a time",
    lede: "We follow what is being built, opened and invested in the north of the city. Each item shows its outlet and its date, and links to the original article, in Spanish.",
    todas: "All news",
    boletin: "Newsletter sign-up",
    kickerContacto: "Contact",
    h2Contacto: "Let's talk about the Zona Norte",
    ledeContacto: "Tell me what you're looking for and I'll show you the projects that fit your plans.",
    escribeme: " Message me on WhatsApp",
    avisoImagenes: "The news belongs to its outlets: here you'll find our own summary and a link to the original article.",
  },
} satisfies Record<Idioma, Record<string, string>>;

export function metadataMercado(idioma: Idioma): Metadata {
  const t = TEXTOS[idioma];
  const { canonical, languages } = alternos("/inteligencia-de-mercado", idioma);
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
      type: "website",
      // Al definir su propio openGraph, la página no hereda la imagen de la
      // raíz: sin esto se compartía sin foto (auditoría del 28-sep-2026).
      images: [{ url: `${SITIO}/og.jpg`, width: 1200, height: 630, alt: t.altOg }],
    },
    twitter: {
      card: "summary_large_image",
      title: t.titulo,
      description: t.descripcion,
      images: [`${SITIO}/og.jpg`],
    },
  };
}

export default function PaginaMercado({ idioma = "es" }: { idioma?: Idioma }) {
  const t = TEXTOS[idioma];
  const MENSAJE = t.mensaje;
  return (
    <>
      <CabeceraSitio blanca mensaje={MENSAJE} actual="mercado" idioma={idioma} rutaEs="/inteligencia-de-mercado" />

      <main className="np">
        <section className="np-portada tono tono-claro tono-blanco-1" aria-labelledby="np-titulo">
          <div className="section-shell">
            <p className="section-kicker">{t.kicker}</p>
            <h1 id="np-titulo">{t.h1}</h1>
            <p className="section-lede">{t.lede}</p>
          </div>
        </section>

        <section className="np-cuerpo tono tono-claro tono-blanco-2" aria-labelledby="np-todas">
          <div className="section-shell">
            {/* El título de la lista, para que las tarjetas (h3) queden debajo de un h2. */}
            <h2 id="np-todas" className="sr-only">
              {t.todas}
            </h2>
            <ListaNoticias idioma={idioma} />
          </div>
        </section>

        <section className="np-boletin tono tono-claro tono-blanco-1" aria-label={t.boletin}>
          <div className="section-shell">
            <Suscripcion idioma={idioma} />
          </div>
        </section>

        <section className="section section-contacto tono tono-oscuro tono-azul-1" id="contacto">
          <div className="section-shell contacto-shell">
            <div className="contacto-texto">
              <p className="section-kicker">{t.kickerContacto}</p>
              <h2>{t.h2Contacto}</h2>
              <p className="section-lede">{t.ledeContacto}</p>
              <div className="contacto-canales">
                <a className="btn-whatsapp" href={enlaceWhatsApp(MENSAJE)} target="_blank" rel="noopener noreferrer">
                  <IconoWhatsApp />
                  {t.escribeme}
                </a>
              </div>
            </div>
            <div className="contacto-form-caja">
              <ContactForm idioma={idioma} />
            </div>
          </div>
        </section>
      </main>

      <PieSitio avisoImagenes={t.avisoImagenes} idioma={idioma} />

      <WhatsAppFlotante trasDe=".np-portada" idioma={idioma} />
      <Animador />
    </>
  );
}
