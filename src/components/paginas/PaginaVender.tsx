import type { Metadata } from "next";
import Animador from "@/components/Animador";
import CabeceraSitio from "@/components/CabeceraSitio";
import ContactForm from "@/components/ContactForm";
import PieSitio from "@/components/PieSitio";
import WhatsAppFlotante from "@/components/WhatsAppFlotante";
import { IconoWhatsApp } from "@/components/Iconos";
import { enlaceWhatsApp } from "@/data/contacto";
import { alternos, SITIO, type Idioma } from "@/i18n/idioma";
import "@/styles/secciones.css";
import "@/styles/vender.css";

/**
 * /vender y /en/sell — «Quiero vender / consignar» (29-sep-2026, informe de
 * Luciano). Una sola página en los dos idiomas (docs/i18n.md).
 *
 * El botón destacado del menú trae aquí. Dos caminos, los dos con aviso a
 * Rafael: el formulario (POST /api/consulta con `tipo: "consignar"`, que
 * cambia el título del aviso de Telegram) y WhatsApp con el mensaje que pidió
 * Luciano ya escrito. Es también la página de destino de la campaña de
 * captación de propietarios.
 *
 * Lo que la página promete, y lo que no:
 *  · Rafael da una **estimación de precio con comparables de mercado**. No
 *    un «avalúo»: avaluar es una actividad reglada (Ley 1673 de 2013, arts.
 *    3 y 9) que exige estar inscrito en el Registro Abierto de Avaluadores.
 *    En inglés, «price estimate», nunca «appraisal».
 *  · Sin cifras, plazos de venta, «cartera de compradores» ni superlativos:
 *    nada que no se pueda demostrar (Ley 1480, arts. 29 y 30).
 */

const TEXTOS = {
  es: {
    titulo: "Vende o consigna tu inmueble en Cartagena | RHF Living",
    descripcion:
      "¿Quieres vender o consignar tu apartamento, casa o lote en Cartagena? Cuéntanos dónde está y qué es, y Rafael Hernández Franco te llama con una estimación de precio basada en comparables de mercado.",
    locale: "es_CO",
    altOg: "RHF Living — Asesoría inmobiliaria en Cartagena",
    // El mensaje que pidió Luciano, tal cual: la persona sigue escribiendo.
    mensaje: "Hola, quiero consignar mi propiedad...",
    pasos: [
      {
        titulo: "Nos cuentas dónde está y qué es",
        texto: "La ubicación y el tipo de inmueble bastan para empezar: por el formulario o por WhatsApp.",
      },
      {
        titulo: "Rafael te llama",
        texto:
          "Conoce el inmueble y su documentación, y te da una estimación de precio con comparables de mercado de la zona.",
      },
      {
        titulo: "Acuerdan las condiciones",
        texto: "Si decides consignarlo, definen juntos las condiciones y los siguientes pasos para la venta.",
      },
    ],
    kicker: "Vender o consignar",
    h1: "¿Quieres vender tu inmueble en Cartagena?",
    lede: "Cuéntanos dónde está y qué es. Rafael Hernández Franco te llama, revisa tu inmueble contigo y te da una estimación de precio con comparables de mercado.",
    escribir: " Escribir por WhatsApp",
    dejarDatos: "Dejar los datos del inmueble",
    pie: "Asesor inmobiliario independiente · Cartagena",
    como: "Cómo funciona",
    nota: "La estimación es un análisis comercial con comparables de mercado. Un avalúo lo firma un avaluador inscrito en el Registro Abierto de Avaluadores (Ley 1673 de 2013).",
    kickerForm: "Tu inmueble",
    h2Form: "Rafael te llama",
    ledeForm:
      "Déjanos los datos del inmueble y tu contacto, o escríbenos por WhatsApp con el mensaje ya listo.",
    avisoImagenes: "Esta página no publica imágenes de inmuebles.",
  },
  en: {
    titulo: "Sell or list your property in Cartagena | RHF Living",
    descripcion:
      "Want to sell or list your apartment, house or lot in Cartagena, Colombia? Tell us where it is and what it is, and Rafael Hernández Franco will call you with a price estimate based on market comparables.",
    locale: "en_US",
    altOg: "RHF Living — Real estate advisory in Cartagena",
    mensaje: "Hi, I'd like to list my property...",
    pasos: [
      {
        titulo: "Tell us where it is and what it is",
        texto: "The location and the type of property are enough to start: through the form or on WhatsApp.",
      },
      {
        titulo: "Rafael calls you",
        texto:
          "He gets to know the property and its paperwork, and gives you a price estimate based on market comparables from the area.",
      },
      {
        titulo: "You agree on the terms",
        texto: "If you decide to list it with us, you define the terms and the next steps of the sale together.",
      },
    ],
    kicker: "Sell or list",
    h1: "Want to sell your property in Cartagena?",
    lede: "Tell us where it is and what it is. Rafael Hernández Franco will call you, go over your property with you and give you a price estimate based on market comparables.",
    escribir: " Message us on WhatsApp",
    dejarDatos: "Send your property details",
    pie: "Independent real estate advisor · Cartagena",
    como: "How it works",
    nota: "The estimate is a commercial analysis based on market comparables. It is not an appraisal: in Colombia, an appraisal is signed by an appraiser registered in the Registro Abierto de Avaluadores (Law 1673 of 2013).",
    kickerForm: "Your property",
    h2Form: "Rafael will call you",
    ledeForm: "Leave us your property details and your contact information, or message us on WhatsApp with the text ready to send.",
    avisoImagenes: "This page does not publish property photos.",
  },
} satisfies Record<Idioma, unknown>;

export function metadataVender(idioma: Idioma): Metadata {
  const t = TEXTOS[idioma];
  const { canonical, languages } = alternos("/vender", idioma);
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
      images: [{ url: `${SITIO}/og.jpg`, width: 1200, height: 630, alt: t.altOg }],
    },
    twitter: { card: "summary_large_image", title: t.titulo, description: t.descripcion, images: [`${SITIO}/og.jpg`] },
  };
}

export default function PaginaVender({ idioma = "es" }: { idioma?: Idioma }) {
  const t = TEXTOS[idioma];
  const MENSAJE = t.mensaje;
  return (
    <>
      <CabeceraSitio blanca mensaje={MENSAJE} actual="vender" idioma={idioma} rutaEs="/vender" />

      <main className="vd">
        <section className="vd-portada tono tono-claro tono-blanco-1" aria-labelledby="vd-titulo">
          <div className="section-shell vd-portada-grid">
            <div>
              <p className="section-kicker">{t.kicker}</p>
              <h1 id="vd-titulo">{t.h1}</h1>
              <p className="section-lede">{t.lede}</p>
              <div className="vd-acciones">
                <a
                  className="btn-whatsapp"
                  href={enlaceWhatsApp(MENSAJE)}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-lead="consignar"
                  data-ubicacion="vender-portada"
                >
                  <IconoWhatsApp />
                  {t.escribir}
                </a>
                <a className="btn-primary vd-al-formulario" href="#formulario">
                  {t.dejarDatos}
                </a>
              </div>
            </div>
            {/* La promesa de la página es «Rafael te llama»: se ve quién llama. */}
            <figure className="vd-retrato">
              <picture>
                <source
                  type="image/avif"
                  srcSet="/rafael/retrato-520.avif 520w, /rafael/retrato-1040.avif 1040w"
                  sizes="(max-width: 860px) 70vw, 320px"
                />
                <source
                  type="image/webp"
                  srcSet="/rafael/retrato-520.webp 520w, /rafael/retrato-1040.webp 1040w"
                  sizes="(max-width: 860px) 70vw, 320px"
                />
                <img
                  src="/rafael/retrato-1040.jpg"
                  srcSet="/rafael/retrato-520.jpg 520w, /rafael/retrato-1040.jpg 1040w"
                  sizes="(max-width: 860px) 70vw, 320px"
                  width={1040}
                  height={1300}
                  decoding="async"
                  alt="Rafael Hernández Franco"
                />
              </picture>
              <figcaption>
                <strong>Rafael Hernández Franco</strong>
                {t.pie}
              </figcaption>
            </figure>
          </div>
        </section>

        <section className="vd-pasos tono tono-claro tono-blanco-2" aria-labelledby="vd-como">
          <div className="section-shell">
            <h2 id="vd-como">{t.como}</h2>
            <ol className="vd-lista">
              {t.pasos.map((p, i) => (
                <li key={p.titulo}>
                  <span className="vd-numero" aria-hidden="true">
                    {i + 1}
                  </span>
                  <div>
                    <h3>{p.titulo}</h3>
                    <p>{p.texto}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="vd-nota">{t.nota}</p>
          </div>
        </section>

        <section
          className="section section-contacto tono tono-oscuro tono-azul-1"
          id="formulario"
          aria-labelledby="vd-formulario"
        >
          <div className="section-shell contacto-shell">
            <div className="contacto-texto">
              <p className="section-kicker">{t.kickerForm}</p>
              <h2 id="vd-formulario">{t.h2Form}</h2>
              <p className="section-lede">{t.ledeForm}</p>
              <div className="contacto-canales">
                <a
                  className="btn-whatsapp"
                  href={enlaceWhatsApp(MENSAJE)}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-lead="consignar"
                  data-ubicacion="vender-formulario"
                >
                  <IconoWhatsApp />
                  {t.escribir}
                </a>
              </div>
            </div>
            <div className="contacto-form-caja">
              <ContactForm variante="consignar" idioma={idioma} />
            </div>
          </div>
        </section>
      </main>

      <PieSitio avisoImagenes={t.avisoImagenes} idioma={idioma} />

      <WhatsAppFlotante trasDe=".vd-portada" idioma={idioma} />
      <Animador />
    </>
  );
}
