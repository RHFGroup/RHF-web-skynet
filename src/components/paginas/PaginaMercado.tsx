import type { Metadata } from "next";
import Animador from "@/components/Animador";
import CabeceraSitio from "@/components/CabeceraSitio";
import ContactForm from "@/components/ContactForm";
import { etiquetaEstado, inmuebles, nombresDeCartera } from "@/i18n/datos";
import ListaNoticias from "@/components/ListaNoticias";
import MapaMercado, { type OpcionMapa } from "@/components/MapaMercado";
import PieSitio from "@/components/PieSitio";
import PreciosVivienda from "@/components/PreciosVivienda";
import Suscripcion from "@/components/Suscripcion";
import WhatsAppFlotante from "@/components/WhatsAppFlotante";
import { IconoWhatsApp } from "@/components/Iconos";
import { enlaceWhatsApp } from "@/data/contacto";
import { zonaDeOpcion } from "@/data/mercado";
import { alternos, SITIO, type Idioma } from "@/i18n/idioma";
import { fichaDe, fichaDeInmueble, proyectosEnOrden } from "@/lib/ficha";
import "@/styles/noticias.css";
import "@/styles/secciones.css";
import "@/styles/mapa-mercado.css";

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
 *
 * 14-oct-2026 (pedido de Rafael): arriba de las noticias va el mapa de obras
 * y entorno (MapaMercado.tsx) y la variación de los precios de la vivienda
 * nueva según el DANE (PreciosVivienda.tsx). Las opciones del mapa se arman
 * aquí, en el servidor, con las mismas funciones de la cartera (fichaDe y
 * fichaDeInmueble): el precio solo si es publicable, siempre con su corte,
 * su área con el rótulo literal y su ubicación (Circular 004, numeral
 * 2.16.1). Lo que el mapa afirma y lo que no: vault,
 * projects/inmobiliaria/copy-del-mapa-de-obras-y-entorno-que-publicamos-y-que-no.
 * Ningún escenario de precio futuro va en la web (Ley 1480, arts. 29 y 30).
 */

const TEXTOS = {
  es: {
    titulo: "Inteligencia de mercado: la Zona Norte de Cartagena | RHF Living",
    descripcion:
      "Inteligencia de mercado de Cartagena y su Zona Norte: el mapa de obras y entorno con nuestras opciones, los precios de la vivienda nueva según el DANE y noticias verificadas, cada una con su fuente y su fecha.",
    locale: "es_CO",
    altOg: "RHF Living — Asesoría inmobiliaria en Cartagena",
    mensaje: "Hola Rafael, vi la inteligencia de mercado de la Zona Norte en tu página y quiero hablar contigo.",
    kicker: "Inteligencia de mercado",
    h1: "La Zona Norte de Cartagena, noticia por noticia",
    lede: "Seguimos lo que se construye, se abre y se invierte en el norte de la ciudad. Cada noticia lleva su medio y su fecha, y abre el artículo original.",
    irAlMapa: "Ver el mapa de obras y entorno",
    kickerMapa: "Mapa de obras y entorno",
    h2Mapa: "Dónde está cada opción y qué se construye alrededor",
    ledeMapa: "Elige una zona para acercarte. Cada punto lleva su fuente, cada obra su estado y cada precio su fecha de corte.",
    verProyecto: "Ver proyecto",
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
      "Market intelligence on Cartagena and its Zona Norte: a map of public works and surroundings with our options, new-home prices according to DANE, and verified news, each item with its source and its date.",
    locale: "en_US",
    altOg: "RHF Living — Real estate advisory in Cartagena",
    mensaje: "Hi Rafael, I saw the Zona Norte market intelligence on your website and I'd like to talk with you.",
    kicker: "Market intelligence",
    h1: "Cartagena's Zona Norte, one news item at a time",
    lede: "We follow what is being built, opened and invested in the north of the city. Each item shows its outlet and its date, and links to the original article, in Spanish.",
    irAlMapa: "See the map of public works and surroundings",
    kickerMapa: "Map of public works and surroundings",
    h2Mapa: "Where each option is and what is being built around it",
    ledeMapa: "Choose an area to zoom in. Every point shows its source, every public work its status and every price its as-of date.",
    verProyecto: "View project",
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

/** «en construcción» → «En construcción», para el rótulo del estado en la tarjeta del mapa. */
function conMayuscula(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/**
 * Las opciones del mapa: los proyectos en el orden de la cartera y, después,
 * los apartamentos disponibles. Salen de las mismas fichas que la cartera de
 * la home, así que el precio, su corte y el área son los mismos en las dos
 * partes. La coordenada va solo si está verificada en la capa de datos.
 */
function opcionesDelMapa(idioma: Idioma): OpcionMapa[] {
  const t = TEXTOS[idioma];
  const deProyectos = proyectosEnOrden(idioma).map((p): OpcionMapa => {
    const f = fichaDe(p, idioma);
    return {
      slug: f.slug,
      nombre: f.nombre,
      origen: "proyecto",
      zona: zonaDeOpcion(f.slug, f.zonaFiltro),
      estado: conMayuscula(etiquetaEstado(f.estado, idioma)),
      precio: f.precio,
      muestraPrecio: f.muestraPrecio,
      corte: f.corte,
      area: f.area,
      ubicacion: p.ubicacion,
      href: f.href,
      verTexto: f.verTexto ?? t.verProyecto,
      foto: f.foto ? { src: f.foto.src, alt: f.foto.alt } : null,
      coordenada: p.coordenada ?? null,
    };
  });
  const deInmuebles = inmuebles(idioma).INMUEBLES.map((i): OpcionMapa => {
    const f = fichaDeInmueble(i, idioma);
    return {
      slug: f.slug,
      nombre: f.nombre,
      origen: "apartamento",
      zona: zonaDeOpcion(f.slug, f.zonaFiltro),
      estado: conMayuscula(f.estadoTexto ?? etiquetaEstado(f.estado, idioma)),
      precio: f.precio,
      muestraPrecio: f.muestraPrecio,
      corte: f.corte,
      area: f.area,
      ubicacion: i.ubicacion,
      href: f.href,
      verTexto: f.verTexto ?? t.verProyecto,
      foto: f.foto ? { src: f.foto.src, alt: f.foto.alt } : null,
      coordenada: i.coordenada ?? null,
    };
  });
  return [...deProyectos, ...deInmuebles];
}

export default function PaginaMercado({ idioma = "es" }: { idioma?: Idioma }) {
  const t = TEXTOS[idioma];
  const MENSAJE = t.mensaje;
  const opciones = opcionesDelMapa(idioma);
  return (
    <>
      <CabeceraSitio blanca mensaje={MENSAJE} actual="mercado" idioma={idioma} rutaEs="/inteligencia-de-mercado" />

      <main className="np">
        <section className="np-portada tono tono-claro tono-blanco-1" aria-labelledby="np-titulo">
          <div className="section-shell">
            <p className="section-kicker">{t.kicker}</p>
            <h1 id="np-titulo">{t.h1}</h1>
            <p className="section-lede">{t.lede}</p>
            <p className="mm-ir">
              <a href="#mapa">{t.irAlMapa} ↓</a>
            </p>
          </div>
        </section>

        <section className="mm-seccion tono tono-oscuro tono-azul-2" id="mapa" aria-labelledby="mm-titulo">
          <div className="section-shell">
            <p className="section-kicker">{t.kickerMapa}</p>
            <h2 id="mm-titulo">{t.h2Mapa}</h2>
            <p className="section-lede">{t.ledeMapa}</p>
            <MapaMercado opciones={opciones} idioma={idioma} />
            <PreciosVivienda idioma={idioma} />
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
              <ContactForm idioma={idioma} nombres={nombresDeCartera(idioma)} />
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
