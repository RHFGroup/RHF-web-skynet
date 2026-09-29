import type { Metadata } from "next";
import Animador from "@/components/Animador";
import CabeceraSitio from "@/components/CabeceraSitio";
import ContactForm from "@/components/ContactForm";
import PieSitio from "@/components/PieSitio";
import WhatsAppFlotante from "@/components/WhatsAppFlotante";
import { IconoWhatsApp } from "@/components/Iconos";
import { enlaceWhatsApp } from "@/data/contacto";
import "@/styles/secciones.css";
import "@/styles/vender.css";

/**
 * /vender — «Quiero vender / consignar» (29-sep-2026, informe de Luciano).
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
 *  · Sin cifras, plazos de venta, «cartera de compradores» ni superlativos:
 *    nada que no se pueda demostrar (Ley 1480, arts. 29 y 30).
 */

const SITIO = "https://rhfliving.com";
const TITULO = "Vende o consigna tu inmueble en Cartagena | RHF Living";
const DESCRIPCION =
  "¿Quieres vender o consignar tu apartamento, casa o lote en Cartagena? Cuéntanos dónde está y qué es, y Rafael Hernández Franco te llama con una estimación de precio basada en comparables de mercado.";

export const metadata: Metadata = {
  title: { absolute: TITULO },
  description: DESCRIPCION,
  alternates: { canonical: `${SITIO}/vender` },
  openGraph: {
    title: TITULO,
    description: DESCRIPCION,
    url: `${SITIO}/vender`,
    siteName: "RHF Living",
    locale: "es_CO",
    type: "website",
    images: [{ url: `${SITIO}/og.jpg`, width: 1200, height: 630, alt: "RHF Living — Asesoría inmobiliaria en Cartagena" }],
  },
  twitter: { card: "summary_large_image", title: TITULO, description: DESCRIPCION, images: [`${SITIO}/og.jpg`] },
};

/** El mensaje que pidió Luciano, tal cual: la persona sigue escribiendo. */
const MENSAJE = "Hola, quiero consignar mi propiedad...";

const PASOS = [
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
];

export default function PaginaVender() {
  return (
    <>
      <CabeceraSitio blanca mensaje={MENSAJE} />

      <main className="vd">
        <section className="vd-portada tono tono-claro tono-blanco-1" aria-labelledby="vd-titulo">
          <div className="section-shell">
            <p className="section-kicker">Vender o consignar</p>
            <h1 id="vd-titulo">¿Quieres vender tu inmueble en Cartagena?</h1>
            <p className="section-lede">
              Cuéntanos dónde está y qué es. Rafael Hernández Franco te llama, revisa tu inmueble contigo y te da una
              estimación de precio con comparables de mercado.
            </p>
            <div className="vd-acciones">
              <a
                className="btn-whatsapp"
                href={enlaceWhatsApp(MENSAJE)}
                target="_blank"
                rel="noopener noreferrer"
                data-lead="consignar"
                data-ubicacion="vender-portada"
              >
                <IconoWhatsApp /> Escribir por WhatsApp
              </a>
              <a className="btn-primary vd-al-formulario" href="#formulario">
                Dejar los datos del inmueble
              </a>
            </div>
          </div>
        </section>

        <section className="vd-pasos tono tono-claro tono-blanco-2" aria-labelledby="vd-como">
          <div className="section-shell">
            <h2 id="vd-como">Cómo funciona</h2>
            <ol className="vd-lista">
              {PASOS.map((p, i) => (
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
            <p className="vd-nota">
              La estimación es un análisis comercial con comparables de mercado. Un avalúo lo firma un avaluador
              inscrito en el Registro Abierto de Avaluadores (Ley 1673 de 2013).
            </p>
          </div>
        </section>

        <section
          className="section section-contacto tono tono-oscuro tono-azul-1"
          id="formulario"
          aria-labelledby="vd-formulario"
        >
          <div className="section-shell contacto-shell">
            <div className="contacto-texto">
              <p className="section-kicker">Tu inmueble</p>
              <h2 id="vd-formulario">Rafael te llama</h2>
              <p className="section-lede">
                Déjanos los datos del inmueble y tu contacto, o escríbenos por WhatsApp con el mensaje ya listo.
              </p>
              <div className="contacto-canales">
                <a
                  className="btn-whatsapp"
                  href={enlaceWhatsApp(MENSAJE)}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-lead="consignar"
                  data-ubicacion="vender-formulario"
                >
                  <IconoWhatsApp /> Escribir por WhatsApp
                </a>
              </div>
            </div>
            <div className="contacto-form-caja">
              <ContactForm variante="consignar" />
            </div>
          </div>
        </section>
      </main>

      <PieSitio avisoImagenes="Esta página no publica imágenes de inmuebles." />

      <WhatsAppFlotante trasDe=".vd-portada" />
      <Animador />
    </>
  );
}
