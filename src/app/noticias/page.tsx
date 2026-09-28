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
import "@/styles/noticias.css";
import "@/styles/secciones.css";

/**
 * /noticias — todas las noticias de la Zona Norte (28-sep-2026, pedido de
 * Rafael: «que abra en una sección nueva»). La home muestra las tres más
 * nuevas y trae aquí. Las noticias y sus reglas: src/data/noticias.ts.
 *
 * Sin datos estructurados de artículo: las noticias son de sus medios, y
 * aquí solo va el resumen propio con el enlace.
 */

const SITIO = "https://rhfliving.com";
const TITULO = "Noticias de la Zona Norte de Cartagena | RHF Living";
const DESCRIPCION =
  "Obras, inversión, vivienda y turismo en la Zona Norte de Cartagena: noticias verificadas, cada una con su fuente, su fecha y el enlace al artículo original.";

export const metadata: Metadata = {
  title: { absolute: TITULO },
  description: DESCRIPCION,
  alternates: { canonical: `${SITIO}/noticias` },
  openGraph: {
    title: TITULO,
    description: DESCRIPCION,
    url: `${SITIO}/noticias`,
    siteName: "RHF Living",
    locale: "es_CO",
    type: "website",
    // Al definir su propio openGraph, la página no hereda la imagen de la
    // raíz: sin esto se compartía sin foto (auditoría del 28-sep-2026).
    images: [{ url: `${SITIO}/og.jpg`, width: 1200, height: 630, alt: "RHF Living — Asesoría inmobiliaria en Cartagena" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITULO,
    description: DESCRIPCION,
    images: [`${SITIO}/og.jpg`],
  },
};

const MENSAJE = "Hola Rafael, vi las noticias de la Zona Norte en tu página y quiero hablar contigo.";

export default function PaginaNoticias() {
  return (
    <>
      <CabeceraSitio blanca mensaje={MENSAJE} />

      <main className="np">
        <section className="np-portada tono tono-claro tono-blanco-1" aria-labelledby="np-titulo">
          <div className="section-shell">
            <p className="section-kicker">Noticias</p>
            <h1 id="np-titulo">Noticias de la Zona Norte de Cartagena</h1>
            <p className="section-lede">
              Lo que se construye, se abre y se invierte en el norte de la ciudad. Cada noticia lleva su fuente y su
              fecha, y abre el artículo original en su medio.
            </p>
          </div>
        </section>

        <section className="np-cuerpo tono tono-claro tono-blanco-2" aria-labelledby="np-todas">
          <div className="section-shell">
            {/* El título de la lista, para que las tarjetas (h3) queden debajo de un h2. */}
            <h2 id="np-todas" className="sr-only">
              Todas las noticias
            </h2>
            <ListaNoticias />
          </div>
        </section>

        <section className="np-boletin tono tono-claro tono-blanco-1" aria-label="Suscripción al boletín">
          <div className="section-shell">
            <Suscripcion />
          </div>
        </section>

        <section className="section section-contacto tono tono-oscuro tono-azul-1" id="contacto">
          <div className="section-shell contacto-shell">
            <div className="contacto-texto">
              <p className="section-kicker">Contacto</p>
              <h2>Hablemos de la Zona Norte</h2>
              <p className="section-lede">Cuéntame qué buscas y te muestro los proyectos que encajan contigo.</p>
              <div className="contacto-canales">
                <a className="btn-whatsapp" href={enlaceWhatsApp(MENSAJE)} target="_blank" rel="noopener noreferrer">
                  <IconoWhatsApp /> Escríbeme por WhatsApp
                </a>
              </div>
            </div>
            <div className="contacto-form-caja">
              <ContactForm />
            </div>
          </div>
        </section>
      </main>

      <PieSitio avisoImagenes="Las noticias son de sus medios: aquí va un resumen propio y el enlace al artículo original." />

      <WhatsAppFlotante trasDe=".np-portada" />
      <Animador />
    </>
  );
}
