import Link from "next/link";
import Animador from "@/components/Animador";
import CabeceraSitio from "@/components/CabeceraSitio";
import ContactForm from "@/components/ContactForm";
import MeInteresaButton from "@/components/MeInteresaButton";
import PieSitio from "@/components/PieSitio";
import PortadaGaleria from "@/components/PortadaGaleria";
import RevealGrupo from "@/components/RevealGrupo";
import TarjetaGiro from "@/components/TarjetaGiro";
import VolverACartera from "@/components/VolverACartera";
import WhatsAppFlotante from "@/components/WhatsAppFlotante";
import { IconoAmenidad, IconoFlecha, IconoWhatsApp } from "@/components/Iconos";
import { enlaceWhatsApp } from "@/data/contacto";
import type { Inmueble } from "@/data/inmuebles";
import { amenidadEnEspanol, etiquetaEstadoInmueble, inmuebles } from "@/i18n/datos";
import { ruta, type Idioma } from "@/i18n/idioma";
import { fichaDeInmueble } from "@/lib/ficha";
import "@/styles/proyecto.css";
import "@/styles/inmuebles.css";

/**
 * La página propia de un inmueble disponible — una plantilla para los cinco.
 *
 * Todo sale de `src/data/inmuebles.ts`. El orden: portada con las fotos (y el
 * plano al final), datos clave, lo que tiene el apartamento, el conjunto, la
 * ubicación, de dónde salen los datos, otros inmuebles y el contacto. Cada
 * bloque sin datos se oculta: nunca un marcador ni texto de relleno.
 *
 * Mismas reglas que la cartera: precio solo si está escrito, con su corte;
 * área con la etiqueta literal de su documento; cada foto con su crédito y su
 * fecha. Ni matrículas, ni números de escritura, ni datos del propietario.
 *
 * En dos idiomas (29-sep-2026): el inmueble llega ya en el idioma de la
 * página (`inmuebles(idioma).getInmueble(slug)`), con su fecha de corte y sus
 * etiquetas de área ya traducidas (la literal de su documento entre
 * paréntesis); aquí solo cambian los textos propios de la plantilla. En
 * inglés la zona conserva «Zona Norte» y los créditos de los renders dicen
 * «render» (src/data/en/inmuebles.ts): las dos búsquedas de abajo siguen
 * sirviendo. El ícono de cada ítem del conjunto se elige por su nombre en
 * español.
 */

/**
 * Los textos de la plantilla. Los espacios al borde son parte del texto: lo
 * separan del ícono o del dato que va al lado, y así el HTML en español sale
 * idéntico al de antes.
 */
const TEXTOS = {
  es: {
    // WhatsApp, con el mensaje ya escrito
    cabecera: (nombre: string) => `Hola Rafael, vi ${nombre} en tu página y quiero más información.`,
    visita: (nombre: string) => `Hola Rafael, quiero agendar una visita a ${nombre}.`,
    flotante: (nombre: string) => `Hola Rafael, vi ${nombre} en tu página y me interesa: `,
    // Datos clave
    precioReferencia: "Precio de referencia",
    precio: "Precio",
    corte: (fecha: string) => `corte ${fecha}`,
    sinPrecio: "Te lo damos por WhatsApp o en asesoría directa",
    habitaciones: "Habitaciones",
    banos: "Baños",
    piso: "Piso",
    parqueadero: "Parqueadero",
    // Bloques
    volver: "Volver a los apartamentos",
    datosClave: "Datos clave",
    kickerApartamento: "El apartamento",
    tituloApartamento: "Lo que tiene",
    segun: "Según: ",
    kickerConjunto: "El conjunto",
    kickerUbicacion: "Ubicación",
    fuente: "Fuente: ",
    enlaceZona: "Colegios, salud, comercio y vías de la Zona Norte ",
    kickerRespaldo: "Respaldo",
    tituloFuentes: "De dónde salen los datos",
    // Contacto
    contactoSobre: (nombre: string) => `Contacto sobre ${nombre}`,
    agendar: " Agendar visita",
    meInteresa: "Me interesa",
    dejanosDatos: "O déjanos tus datos",
    kickerOtros: "Inmuebles disponibles",
    tituloOtros: "Otros apartamentos disponibles",
    kickerContacto: "Contacto",
    teInteresa: "¿Te interesa ",
    ledeContacto: "Te contamos las condiciones, resolvemos tus preguntas y agendamos la visita.",
    agendarWhatsApp: " Agendar visita por WhatsApp",
    contactarSobre: (nombre: string) => `Contactar sobre ${nombre}`,
    // Avisos legales
    avisosLegales: "Avisos legales del inmueble",
    avisoPrecio: (fecha: string) =>
      `El precio es de referencia, en pesos colombianos, a la fecha de corte indicada (${fecha}), y está sujeto a disponibilidad. `,
    avisoSinPrecio: "El precio vigente se entrega con su respaldo por WhatsApp o en asesoría directa. ",
    avisoAreas:
      "Las áreas se citan con la etiqueta textual de su documento —escritura pública, plano oficial o presentación de venta— y la información precontractual se entrega por escrito antes de cualquier separación.",
    avisoRenders:
      "Las imágenes son renders y planos del promotor: son ilustrativas y no reproducen necesariamente acabados, mobiliario ni entorno definitivos.",
    avisoFotos:
      "Cada foto lleva su crédito y su fecha; el mobiliario que aparece en ellas no hace parte de la venta salvo que se acuerde por escrito.",
    avisoOferta: "Esta página no constituye oferta comercial en los términos del artículo 845 del Código de Comercio.",
    pieRenders: "Las imágenes de esta página son renders y planos del promotor, y son ilustrativas.",
    pieFotos:
      "Las fotos de esta página son del apartamento, con su fecha; el plano, cuando aparece, es material del constructor.",
  },
  en: {
    // WhatsApp, con el mensaje ya escrito
    cabecera: (nombre: string) => `Hi Rafael, I saw ${nombre} on your website and I'd like more information.`,
    visita: (nombre: string) => `Hi Rafael, I'd like to schedule a visit to ${nombre}.`,
    flotante: (nombre: string) => `Hi Rafael, I saw ${nombre} on your website and I'm interested in: `,
    // Datos clave
    precioReferencia: "Reference price",
    precio: "Price",
    corte: (fecha: string) => `Price as of ${fecha}`,
    sinPrecio: "We'll share it on WhatsApp or in a one-on-one consultation",
    habitaciones: "Bedrooms",
    banos: "Bathrooms",
    piso: "Floor",
    parqueadero: "Parking",
    // Bloques
    volver: "Back to apartments",
    datosClave: "Key facts",
    kickerApartamento: "The apartment",
    tituloApartamento: "What it includes",
    segun: "Source: ",
    kickerConjunto: "The complex",
    kickerUbicacion: "Location",
    fuente: "Source: ",
    enlaceZona: "Schools, healthcare, shopping and roads in Zona Norte, Cartagena's northern corridor ",
    kickerRespaldo: "Sources",
    tituloFuentes: "Where the data comes from",
    // Contacto
    contactoSobre: (nombre: string) => `Contact about ${nombre}`,
    agendar: " Schedule a visit",
    meInteresa: "I'm interested",
    dejanosDatos: "Or leave us your details",
    kickerOtros: "Available properties",
    tituloOtros: "Other available apartments",
    kickerContacto: "Contact",
    teInteresa: "Interested in ",
    ledeContacto: "We'll walk you through the terms, answer your questions and schedule your visit.",
    agendarWhatsApp: " Schedule a visit on WhatsApp",
    contactarSobre: (nombre: string) => `Get in touch about ${nombre}`,
    // Avisos legales
    avisosLegales: "Legal notices for this property",
    avisoPrecio: (fecha: string) =>
      `The price is a reference price in Colombian pesos, as of the cut-off date shown (${fecha}), and is subject to availability. `,
    avisoSinPrecio:
      "The current price is provided with its supporting documents on WhatsApp or in a one-on-one consultation. ",
    avisoAreas:
      "Areas are quoted with the exact label of their document—public deed, official floor plan or sales presentation—and pre-contractual information is provided in writing before any reservation.",
    avisoRenders:
      "Images are the developer's renderings and floor plans: they are illustrative and do not necessarily show final finishes, furniture or surroundings.",
    avisoFotos:
      "Each photo carries its credit and date; any furniture shown is not part of the sale unless agreed in writing.",
    avisoOferta: "This page is not a commercial offer under Article 845 of the Colombian Commercial Code.",
    pieRenders: "The images on this page are the developer's renderings and floor plans, and are illustrative.",
    pieFotos:
      "The photos on this page are of the apartment, with their dates; the floor plan, when shown, is the builder's material.",
  },
} satisfies Record<Idioma, Record<string, string | ((...datos: never[]) => string)>>;

/**
 * `i`: el inmueble ya en el idioma de la página. `idioma`: el de la página;
 * en español, la página sale igual que siempre.
 */
export default function InmuebleLanding({ i, idioma = "es" }: { i: Inmueble; idioma?: Idioma }) {
  const t = TEXTOS[idioma];
  const { INMUEBLES, precioInmueble } = inmuebles(idioma);
  const precio = precioInmueble(i);
  const whatsappVisita = enlaceWhatsApp(t.visita(i.nombre));
  const otros = INMUEBLES.filter((x) => x.slug !== i.slug)
    .slice(0, 3)
    .map((x) => fichaDeInmueble(x, idioma));
  const fotos = [...i.fotos, ...(i.plano ? [i.plano] : [])];
  const soloRenders = i.fotos.every((f) => /render/i.test(f.credito));

  const franja: { titulo: string; valor: string; nota?: string }[] = [
    {
      titulo: i.precio ? t.precioReferencia : t.precio,
      valor: precio.texto,
      nota: precio.corte ? t.corte(precio.corte) : t.sinPrecio,
    },
    ...i.areas.map((a) => ({ titulo: a.etiqueta, valor: a.valor, nota: a.fuente })),
    { titulo: t.habitaciones, valor: i.habitaciones },
    { titulo: t.banos, valor: i.banos },
    { titulo: t.piso, valor: i.piso },
    ...(i.parqueadero ? [{ titulo: t.parqueadero, valor: i.parqueadero }] : []),
  ];

  return (
    <>
      <CabeceraSitio
        mensaje={t.cabecera(i.nombre)}
        actual="proyectos"
        idioma={idioma}
        rutaEs={`/inmuebles/${i.slug}`}
      />

      <main className="pp pi">
        <div className="pp-migas">
          <div className="section-shell">
            <VolverACartera href="/#apartamentos" texto={t.volver} idioma={idioma} />
          </div>
        </div>

        {/* 1 · Portada ─────────────────────────────── */}
        <PortadaGaleria fotos={fotos} nombre={i.nombre} idioma={idioma}>
          <p className="eyebrow">
            {i.zona} · {etiquetaEstadoInmueble(i.estado, idioma)}
          </p>
          <h1>{i.nombre}</h1>
          <p className="pp-portada-linea">{i.linea}</p>
        </PortadaGaleria>

        <div className="pp-cuerpo section-shell">
          <div className="pp-contenido">
            {/* 2 · Datos clave ─────────────────────── */}
            <section className="pp-bloque" aria-label={t.datosClave}>
              <dl className="pp-franja">
                {franja.map((d) => (
                  <div key={d.titulo}>
                    <dt>{d.titulo}</dt>
                    <dd>
                      <strong>{d.valor}</strong>
                      {d.nota && <span>{d.nota}</span>}
                    </dd>
                  </div>
                ))}
              </dl>
              {i.descripcion.map((p) => (
                <p key={p} className="pp-resumen">
                  {p}
                </p>
              ))}
            </section>

            {/* 3 · El apartamento ──────────────────── */}
            <section className="pp-bloque" id="apartamento">
              <p className="section-kicker">{t.kickerApartamento}</p>
              <h2>{t.tituloApartamento}</h2>
              <p className="pi-dependencias">{i.dependencias.texto}.</p>
              <p className="pp-fuente">
                {t.segun}
                {i.dependencias.fuente}.
              </p>
              {i.plano && (
                <figure className="pi-plano">
                  <img src={i.plano.src} alt={i.plano.alt} width={i.plano.ancho} height={i.plano.alto} loading="lazy" />
                  <figcaption>{i.plano.credito}</figcaption>
                </figure>
              )}
            </section>

            {/* 4 · El conjunto ─────────────────────── */}
            {i.conjunto && (
              <section className="pp-bloque" id="conjunto">
                <p className="section-kicker">{t.kickerConjunto}</p>
                <h2>{i.proyecto}</h2>
                <ul className="pp-amenidades">
                  {i.conjunto.items.map((a) => (
                    <li key={a}>
                      <IconoAmenidad nombre={amenidadEnEspanol(a)} size={24} />
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
                <p className="pp-fuente">
                  {t.segun}
                  {i.conjunto.fuente}.
                </p>
              </section>
            )}

            {/* 5 · Ubicación ───────────────────────── */}
            <section className="pp-bloque" id="ubicacion">
              <p className="section-kicker">{t.kickerUbicacion}</p>
              <h2>{i.ubicacion}</h2>
              <p className="pp-fuente">
                {t.fuente}
                {i.ubicacionFuente}.
              </p>
              {/Zona Norte/.test(i.zona) && (
                <p className="pp-enlace-zona">
                  <Link href={ruta(idioma, "/#mapa")}>
                    {t.enlaceZona}
                    <IconoFlecha size={16} />
                  </Link>
                </p>
              )}
            </section>

            {/* 6 · De dónde salen los datos ────────── */}
            <section className="pp-bloque" id="fuentes">
              <p className="section-kicker">{t.kickerRespaldo}</p>
              <h2>{t.tituloFuentes}</h2>
              <ul className="pi-fuentes">
                {i.fuentes.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </section>
          </div>

          {/* Contacto: columna fija en escritorio ─────── */}
          <aside className="pp-lateral" aria-label={t.contactoSobre(i.nombre)}>
            <div className="pp-lateral-caja">
              <p className="pp-lateral-kicker">{i.precio ? t.precioReferencia : t.precio}</p>
              <p className="pp-lateral-precio" data-cop={i.precio ? i.precio.valor : undefined}>
                {precio.texto}
              </p>
              <p className="pp-lateral-corte">
                {precio.corte ? t.corte(precio.corte) : t.sinPrecio}
              </p>
              <a className="btn-primary pp-btn" href={whatsappVisita} target="_blank" rel="noopener noreferrer">
                <IconoWhatsApp size={18} />
                {t.agendar}
              </a>
              <MeInteresaButton label={t.meInteresa} className="pp-btn pp-btn-secundario" idioma={idioma} />
              <a className="pp-lateral-form" href="#contacto">
                {t.dejanosDatos}
              </a>
            </div>
          </aside>
        </div>

        {/* 7 · Otros inmuebles ─────────────────────────── */}
        {otros.length > 0 && (
          <section className="section pp-otros" aria-labelledby="pi-otros-titulo">
            <div className="section-shell">
              <p className="section-kicker">{t.kickerOtros}</p>
              <h2 id="pi-otros-titulo">{t.tituloOtros}</h2>
              <RevealGrupo className="pp-otros-grid">
                {otros.map((f, n) => (
                  <div key={f.slug} style={{ "--i": n } as React.CSSProperties}>
                    <TarjetaGiro ficha={f} retraso={n * 900} idioma={idioma} />
                  </div>
                ))}
              </RevealGrupo>
            </div>
          </section>
        )}

        {/* Contacto con el inmueble ya elegido ──────────── */}
        <section className="section section-contacto" id="contacto">
          <div className="section-shell contacto-shell">
            <div className="contacto-texto">
              <p className="section-kicker">{t.kickerContacto}</p>
              <h2>
                {t.teInteresa}
                {i.nombre}?
              </h2>
              <p className="section-lede">{t.ledeContacto}</p>
              <div className="contacto-canales">
                <a className="btn-whatsapp" href={whatsappVisita} target="_blank" rel="noopener noreferrer">
                  <IconoWhatsApp />
                  {t.agendarWhatsApp}
                </a>
              </div>
            </div>
            <ContactForm proyectoInicial={i.nombre} idioma={idioma} />
          </div>
        </section>

        {/* Avisos legales ───────────────────────────────── */}
        <section className="pp-avisos" aria-label={t.avisosLegales}>
          <div className="section-shell">
            <p className="pp-avisos-texto">
              {i.precio ? t.avisoPrecio(i.precio.corte) : t.avisoSinPrecio}
              {t.avisoAreas}{" "}
              {soloRenders ? t.avisoRenders : t.avisoFotos}{" "}
              {t.avisoOferta}
            </p>
          </div>
        </section>
      </main>

      <PieSitio avisoImagenes={soloRenders ? t.pieRenders : t.pieFotos} idioma={idioma} />

      {/* Escritorio: la foto de Rafael, encima del botón del chat ─── */}
      <WhatsAppFlotante trasDe=".pp-portada" soloEscritorio mensaje={t.flotante(i.nombre)} idioma={idioma} />

      <Animador />

      {/* Móvil: los dos botones siempre a mano, sin tapar el del chat ─── */}
      <div className="pp-barra-movil" role="region" aria-label={t.contactarSobre(i.nombre)}>
        <a className="pp-barra-visita" href={whatsappVisita} target="_blank" rel="noopener noreferrer">
          <IconoWhatsApp size={18} />
          {t.agendar}
        </a>
        <MeInteresaButton label={t.meInteresa} className="pp-barra-interesa" idioma={idioma} />
      </div>
    </>
  );
}
