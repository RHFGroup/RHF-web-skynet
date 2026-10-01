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
 * /inteligencia-de-mercado — todas las noticias de la Zona Norte (28-sep-2026,
 * pedido de Rafael: «que abra en una sección nueva»). La home muestra las tres
 * más nuevas y trae aquí. Las noticias y sus reglas: src/data/noticias.ts.
 *
 * 29-sep-2026 (informe de Luciano): la sección se llama «Inteligencia de
 * mercado», para darle peso de firma.
 *
 * 1-oct-2026 (Rafael: «quiero que estas noticias se vean elaboradas por
 * nosotros»): cada tarjeta abre un artículo propio con firma
 * (/inteligencia-de-mercado/[id]). Lo que no cambia es la atribución: los
 * datos son del medio, que se nombra en la tarjeta y en el texto, y el
 * artículo enlaza la nota original. Presentar una noticia ajena como
 * reportería propia sería publicidad engañosa (Ley 1480, art. 30); el
 * análisis sí es nuestro. /noticias redirige aquí (public/_redirects).
 */

const SITIO = "https://rhfliving.com";
const TITULO = "Inteligencia de mercado: la Zona Norte de Cartagena | RHF Living";
const DESCRIPCION =
  "Inteligencia de mercado de la Zona Norte de Cartagena: obras, inversión, vivienda y turismo, analizados por RHF Living con datos verificados de su fuente.";

export const metadata: Metadata = {
  title: { absolute: TITULO },
  description: DESCRIPCION,
  alternates: { canonical: `${SITIO}/inteligencia-de-mercado` },
  openGraph: {
    title: TITULO,
    description: DESCRIPCION,
    url: `${SITIO}/inteligencia-de-mercado`,
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

const MENSAJE = "Hola Rafael, vi la inteligencia de mercado de la Zona Norte en tu página y quiero hablar contigo.";

export default function PaginaInteligenciaDeMercado() {
  return (
    <>
      <CabeceraSitio blanca mensaje={MENSAJE} actual="mercado" />

      <main className="np">
        <section className="np-portada tono tono-claro tono-blanco-1" aria-labelledby="np-titulo">
          <div className="section-shell">
            <p className="section-kicker">Inteligencia de mercado</p>
            <h1 id="np-titulo">La Zona Norte de Cartagena, noticia por noticia</h1>
            <p className="section-lede">
              Seguimos lo que se construye, se abre y se invierte en el norte de la ciudad, y te contamos qué significa.
              Cada análisis cita el medio de donde salen los datos.
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

      <PieSitio avisoImagenes="Análisis de RHF Living con datos de la fuente citada en cada artículo." />

      <WhatsAppFlotante trasDe=".np-portada" />
      <Animador />
    </>
  );
}
