import Link from "next/link";
import BloqueLegal from "@/components/BloqueLegal";
import BrochureGaleria from "@/components/BrochureGaleria";
import CabeceraSitio from "@/components/CabeceraSitio";
import ContactForm from "@/components/ContactForm";
import MeInteresaButton from "@/components/MeInteresaButton";
import MiniMapa from "@/components/MiniMapa";
import PieSitio from "@/components/PieSitio";
import PortadaGaleria from "@/components/PortadaGaleria";
import RevealGrupo from "@/components/RevealGrupo";
import TarjetaGiro from "@/components/TarjetaGiro";
import TipologiasTabs, { type TipologiaVista } from "@/components/TipologiasTabs";
import VolverACartera from "@/components/VolverACartera";
import WhatsAppFlotante from "@/components/WhatsAppFlotante";
import Animador from "@/components/Animador";
import {
  IconoAmenidad,
  IconoDocumento,
  IconoEscudo,
  IconoFlecha,
  IconoWhatsApp,
} from "@/components/Iconos";
import { enlaceWhatsApp } from "@/data/contacto";
import type { Proyecto } from "@/data/proyectos";
import { amenidadEnEspanol, etiquetaEstado, proyectos, nombresDeCartera } from "@/i18n/datos";
import { ruta, type Idioma } from "@/i18n/idioma";
import { areaDe, fichaDe, precioDe, proyectosEnOrden } from "@/lib/ficha";
import "@/styles/proyecto.css";

/**
 * La página propia de un proyecto — una sola plantilla para los cinco.
 *
 * Todo sale de `src/data/proyectos.ts`. Agregar un proyecto a la cartera es
 * agregar un elemento a ese archivo: la ruta, el mapa del sitio, la tarjeta y
 * esta página salen solos (`src/app/proyectos/[slug]/page.tsx`).
 *
 * Orden de la página, pedido en el prompt 4B: portada, datos clave,
 * tipologías, amenidades, ubicación, la opinión de Rafael, respaldo,
 * preguntas frecuentes y otros proyectos. **Cada bloque sin datos se oculta**:
 * nunca un marcador, nunca texto de relleno.
 *
 * Lo que se conserva de la landing anterior: la galería del brochure, el
 * bloque legal de la Circular 004 y «Me interesa», que abre el chat.
 *
 * Lo que ya no está, a propósito: los textos escritos a mano en cada página
 * («quedan 7 de 272 casas», «Torre 5 en venta») que no salían de la capa de
 * datos y ya contradecían la hoja vigente; y el pie que decía «en esta página
 * no publicamos precios» debajo de un precio publicado.
 *
 * En dos idiomas (29-sep-2026): el proyecto llega ya en el idioma de la
 * página (`proyectos(idioma).getProyecto(slug)`), con sus fechas de corte y
 * sus etiquetas de área ya traducidas (la literal de la fuente entre
 * paréntesis); aquí solo cambian los textos propios de la plantilla. El
 * ícono de cada amenidad se sigue eligiendo por su nombre en español.
 */

const ESTADO: Record<Proyecto["estado"], string> = {
  "en lanzamiento": "En lanzamiento",
  "en construcción": "En construcción",
  "entrega inmediata": "Entrega inmediata",
};

type Destino = NonNullable<Proyecto["tiempos"]>[number]["destino"];

const DESTINOS: Record<Idioma, Record<Destino, string>> = {
  es: {
    playa: "a la playa",
    aeropuerto: "al aeropuerto",
    hospital: "al hospital",
    centro: "al Centro Histórico",
  },
  en: {
    playa: "to the beach",
    aeropuerto: "to the airport",
    hospital: "to the hospital",
    centro: "to the Historic Center",
  },
};

/**
 * Los textos de la plantilla. Los espacios al borde son parte del texto: lo
 * separan del ícono o del dato que va al lado, y así el HTML en español sale
 * idéntico al de antes.
 */
const TEXTOS = {
  es: {
    // WhatsApp, con el mensaje ya escrito
    cabecera: (nombre: string) => `Hola Rafael, vi la página de ${nombre} y quiero más información.`,
    visita: (nombre: string) => `Hola Rafael, quiero agendar una visita a ${nombre}.`,
    flotante: (nombre: string) => `Hola Rafael, vi ${nombre} en tu página y me interesa: `,
    // Datos clave
    precioReferencia: "Precio de referencia",
    precio: "Precio",
    corte: (fecha: string) => `corte ${fecha}`,
    sinPrecio: "Te lo damos con su respaldo documental",
    area: "Área",
    rotulada: (etiquetas: string) => `Como la rotula la fuente: ${etiquetas}`,
    comillas: (etiqueta: string) => `«${etiqueta}»`,
    publicada: "Como la publica la fuente",
    difieren: " · las fuentes difieren, ver tipologías",
    habitaciones: "Habitaciones",
    banos: "Baños",
    entrega: "Entrega",
    disponibles: "Disponibles",
    unidades: (n: number) => `${n} ${n === 1 ? "unidad" : "unidades"}`,
    corteDisponibles: (fecha: string) => `corte ${fecha}`,
    // El precio de cada tipología
    rangoTipologia: (desde: string, hasta: string) => `${desde} a ${hasta}`,
    detalleTipologia: (n: number, fecha: string) =>
      `${n} ${n === 1 ? "unidad disponible" : "unidades disponibles"} · corte ${fecha}`,
    // Portada y bloques
    revisado: " Revisado por nuestro estudio jurídico",
    datosClave: "Datos clave",
    kickerTipologias: "Tipologías",
    tituloTipologias: "Qué se ofrece",
    conflictos: "Datos en los que las fuentes del promotor no coinciden.",
    conflictosTexto: "Publicamos todas las versiones en lugar de elegir una:",
    kickerAmenidades: "Amenidades",
    tituloAmenidades: "Lo que tiene el proyecto",
    segunPromotor: "Según el material publicado por el promotor.",
    kickerUbicacion: "Ubicación",
    ubicacionPendiente: "Ubicación exacta por confirmar con el promotor",
    fuente: "Fuente: ",
    enlaceZona: "Colegios, salud, comercio y vías de la Zona Norte ",
    kickerOpinion: "La opinión de Rafael",
    tituloOpinion: "Lo que debes saber antes de separar",
    fuertes: "Puntos fuertes",
    tenerEnCuenta: "Lo que conviene tener en cuenta",
    escritoPor: "Escrito por Rafael el ",
    kickerRespaldo: "Respaldo",
    tituloRespaldo: "Quién lo construye y de dónde salen los datos",
    promotor: "Promotor y comercialización",
    estadoProyecto: "Estado del proyecto",
    preciosDisponibilidad: "Precios y disponibilidad",
    corteRespaldo: " · corte ",
    avance: "Avance de obra",
    paginaAvance: "Página de avance de la constructora",
    descargarBrochure: " Descargar el brochure oficial (PDF)",
    kickerPreguntas: "Preguntas frecuentes",
    tituloPreguntas: "Lo que más nos preguntan",
    // Contacto
    contactoSobre: (nombre: string) => `Contacto sobre ${nombre}`,
    agendar: " Agendar visita",
    meInteresa: "Me interesa",
    dejanosDatos: "O déjanos tus datos",
    // El simulador de compra (30-sep-2026)
    simularTitulo: "¿Te alcanza?",
    simularTexto: "Mira cuánto pagas en obra, tu cuota y el ingreso que te piden, con tus números.",
    simular: "Simular cuota",
    // El comparador (5-oct-2026)
    comparar: "Compáralo con otra opción de la cartera",
    kickerCartera: "Nuestra cartera",
    tituloOtros: "Otros proyectos que asesoramos",
    kickerContacto: "Contacto",
    teInteresa: "¿Te interesa ",
    ledeContacto:
      "Te pasamos disponibilidad, precios vigentes y condiciones de pago con la fecha de corte del documento del constructor.",
    agendarWhatsApp: " Agendar visita por WhatsApp",
    contactarSobre: (nombre: string) => `Contactar sobre ${nombre}`,
    // Avisos legales
    avisosLegales: "Avisos legales del proyecto",
    sinPrecioTitulo: "Por qué este proyecto no publica precio",
    sinPrecioTexto:
      "La Circular 004 de 2024 de la Superintendencia de Industria y Comercio (numeral 2.16.1) exige que toda pieza con precio lleve también el área y la ubicación exacta del proyecto. Hoy falta:",
    sinPrecioCierre:
      ". Te damos el precio vigente y su respaldo documental por el chat, por WhatsApp o en asesoría directa.",
    precontractual:
      "Información precontractual que se entrega por escrito antes de cualquier separación (numeral 2.16.2): ",
    avisos:
      "Los precios son de referencia, en pesos colombianos, a la fecha de corte indicada, y están sujetos a disponibilidad. Las áreas se citan con la etiqueta textual de la fuente y pueden cambiar por decisión de la constructora. Las imágenes son renders y material del promotor: son ilustrativas y no reproducen necesariamente acabados, mobiliario ni entorno definitivos. Esta página no constituye oferta comercial en los términos del artículo 845 del Código de Comercio.",
  },
  en: {
    // WhatsApp, con el mensaje ya escrito
    cabecera: (nombre: string) => `Hi Rafael, I saw the ${nombre} page on your website and I'd like more information.`,
    visita: (nombre: string) => `Hi Rafael, I'd like to schedule a visit to ${nombre}.`,
    flotante: (nombre: string) => `Hi Rafael, I saw ${nombre} on your website and I'm interested in: `,
    // Datos clave
    precioReferencia: "Reference price",
    precio: "Price",
    corte: (fecha: string) => `Price as of ${fecha}`,
    sinPrecio: "We'll share it with its supporting documents",
    area: "Area",
    rotulada: (etiquetas: string) => `As labeled by the source: ${etiquetas}`,
    comillas: (etiqueta: string) => `“${etiqueta}”`,
    publicada: "As published by the source",
    difieren: " · sources differ, see unit types",
    habitaciones: "Bedrooms",
    banos: "Bathrooms",
    entrega: "Delivery",
    disponibles: "Available",
    unidades: (n: number) => `${n} ${n === 1 ? "unit" : "units"}`,
    corteDisponibles: (fecha: string) => `As of ${fecha}`,
    // El precio de cada tipología
    rangoTipologia: (desde: string, hasta: string) => `${desde} to ${hasta}`,
    detalleTipologia: (n: number, fecha: string) =>
      `${n} ${n === 1 ? "unit available" : "units available"} · price as of ${fecha}`,
    // Portada y bloques
    revisado: " Reviewed by our legal team",
    datosClave: "Key facts",
    kickerTipologias: "Unit types",
    tituloTipologias: "What's on offer",
    conflictos: "Figures on which the developer's sources disagree.",
    conflictosTexto: "We publish every version instead of choosing one:",
    kickerAmenidades: "Amenities",
    tituloAmenidades: "What the project offers",
    segunPromotor: "According to the material published by the developer.",
    kickerUbicacion: "Location",
    ubicacionPendiente: "Exact location to be confirmed with the developer",
    fuente: "Source: ",
    enlaceZona: "Schools, healthcare, shopping and roads in Zona Norte, Cartagena's northern corridor ",
    kickerOpinion: "Rafael's take",
    tituloOpinion: "What you should know before reserving",
    fuertes: "Strengths",
    tenerEnCuenta: "Things to keep in mind",
    escritoPor: "Written by Rafael on ",
    kickerRespaldo: "Sources",
    tituloRespaldo: "Who builds it and where the data comes from",
    promotor: "Developer and sales",
    estadoProyecto: "Project status",
    preciosDisponibilidad: "Prices and availability",
    corteRespaldo: " · as of ",
    avance: "Construction progress",
    paginaAvance: "Builder's construction progress page",
    descargarBrochure: " Download the official brochure (PDF, in Spanish)",
    kickerPreguntas: "FAQ",
    tituloPreguntas: "What people ask us most",
    // Contacto
    contactoSobre: (nombre: string) => `Contact about ${nombre}`,
    agendar: " Schedule a visit",
    meInteresa: "I'm interested",
    dejanosDatos: "Or leave us your details",
    simularTitulo: "Can you afford it?",
    simularTexto: "See what you'd pay during construction, your monthly payment and the income required, with your own numbers.",
    simular: "Estimate my payment",
    comparar: "Compare it with another option in our portfolio",
    kickerCartera: "Our portfolio",
    tituloOtros: "Other projects we advise on",
    kickerContacto: "Contact",
    teInteresa: "Interested in ",
    ledeContacto:
      "We'll send you availability, current prices and payment terms, with the cut-off date of the builder's document.",
    agendarWhatsApp: " Schedule a visit on WhatsApp",
    contactarSobre: (nombre: string) => `Get in touch about ${nombre}`,
    // Avisos legales
    avisosLegales: "Legal notices for this project",
    sinPrecioTitulo: "Why this project does not show a price",
    sinPrecioTexto:
      "Circular 004 of 2024 of the Superintendence of Industry and Commerce (SIC), section 2.16.1, requires any material that shows a price to also show the area and the exact location of the project. Currently missing:",
    sinPrecioCierre:
      ". We'll give you the current price and its supporting documents through the chat, on WhatsApp or in a one-on-one consultation.",
    precontractual: "Pre-contractual information delivered in writing before any reservation (section 2.16.2): ",
    avisos:
      "Prices are reference prices in Colombian pesos, as of the cut-off date shown, and are subject to availability. Areas are quoted with the exact label used by the source and may change at the builder's discretion. Images are renderings and developer materials: they are illustrative and do not necessarily show final finishes, furniture or surroundings. This page is not a commercial offer under Article 845 of the Colombian Commercial Code.",
  },
} satisfies Record<Idioma, Record<string, string | ((...datos: never[]) => string)>>;

function tipologiasVista(p: Proyecto, idioma: Idioma): TipologiaVista[] {
  const t = TEXTOS[idioma];
  const { formatoPesos, puedePublicarPrecio } = proyectos(idioma);
  const publica = puedePublicarPrecio(p) && p.precio !== null;
  return p.tipologias.map((tipo) => ({
    titulo: tipo.titulo,
    detalle: tipo.detalle,
    fuente: tipo.fuente,
    area: { etiqueta: tipo.area.etiqueta, valor: tipo.area.valor, fuente: tipo.area.fuente },
    alcobas: tipo.alcobas,
    banos: tipo.banos,
    exterior: tipo.exterior,
    planos: tipo.planos ?? [],
    precio:
      publica && tipo.precio && p.precio
        ? {
            cifra:
              tipo.precio.desde === tipo.precio.hasta
                ? formatoPesos(tipo.precio.desde)
                : t.rangoTipologia(formatoPesos(tipo.precio.desde), formatoPesos(tipo.precio.hasta)),
            detalle: t.detalleTipologia(tipo.precio.unidades, p.precio.corte),
            cop: { desde: tipo.precio.desde, hasta: tipo.precio.hasta },
          }
        : null,
  }));
}

/** Los tres proyectos que siguen en la cartera, dando la vuelta. */
function otrosProyectos(p: Proyecto, idioma: Idioma) {
  const todos = proyectosEnOrden(idioma);
  const i = todos.findIndex((x) => x.slug === p.slug);
  const resto = [...todos.slice(i + 1), ...todos.slice(0, i)];
  return resto.slice(0, 3).map((x) => fichaDe(x, idioma));
}

/**
 * `p`: el proyecto ya en el idioma de la página. `idioma`: el de la página;
 * en español, la página sale igual que siempre.
 */
export default function ProyectoLanding({ p, idioma = "es" }: { p: Proyecto; idioma?: Idioma }) {
  const t = TEXTOS[idioma];
  const { datosDePieza, faltaPrecontractual } = proyectos(idioma);
  const estado = idioma === "es" ? ESTADO[p.estado] : etiquetaEstado(p.estado, idioma);
  const precio = precioDe(p, idioma);
  const area = areaDe(p, idioma);
  const ficha = fichaDe(p, idioma);
  const pieza = datosDePieza(p);
  const pendientes = faltaPrecontractual(p);
  const whatsappVisita = enlaceWhatsApp(t.visita(p.nombre));
  const otros = otrosProyectos(p, idioma);

  const franja: { titulo: string; valor: string; nota?: string }[] = [
    {
      titulo: precio.muestra ? t.precioReferencia : t.precio,
      valor: precio.texto,
      nota: precio.corte ? t.corte(precio.corte) : t.sinPrecio,
    },
  ];
  if (area) {
    franja.push({
      titulo: t.area,
      valor: area.texto,
      nota:
        (area.etiquetas.length > 0
          ? t.rotulada(area.etiquetas.map((e) => t.comillas(e)).join(", "))
          : t.publicada) + (area.conflicto ? t.difieren : ""),
    });
  }
  if (ficha.alcobas) franja.push({ titulo: t.habitaciones, valor: ficha.alcobas });
  if (ficha.banos) franja.push({ titulo: t.banos, valor: ficha.banos });
  if (p.precontractual.fechaEntrega) franja.push({ titulo: t.entrega, valor: p.precontractual.fechaEntrega });
  if (p.precio) {
    franja.push({
      titulo: t.disponibles,
      valor: t.unidades(p.precio.unidadesDisponibles),
      nota: t.corteDisponibles(p.precio.corte),
    });
  }

  return (
    <>
      <CabeceraSitio
        mensaje={t.cabecera(p.nombre)}
        actual="proyectos"
        idioma={idioma}
        rutaEs={`/proyectos/${p.slug}`}
      />

      <main className="pp">
        <div className="pp-migas">
          <div className="section-shell">
            <VolverACartera idioma={idioma} />
          </div>
        </div>

        {/* 1 · Portada ─────────────────────────────── */}
        <PortadaGaleria fotos={p.fotos?.galeria ?? []} nombre={p.nombre} idioma={idioma}>
          <p className="eyebrow">
            {p.zona} · {estado}
          </p>
          <h1>{p.nombre}</h1>
          {p.presentacion && <p className="pp-portada-linea">{p.presentacion.linea}</p>}
          {p.revisionJuridica && (
            <p className="pp-sello">
              <IconoEscudo size={18} />
              {t.revisado}
            </p>
          )}
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
              <p className="pp-resumen">{p.resumen}</p>
              {/* El simulador, con este proyecto ya elegido. Solo con precio publicable. */}
              {precio.muestra && (
                <a className="pp-simular" href={ruta(idioma, `/simulador?p=${p.slug}`)} data-ubicacion="proyecto-datos">
                  <span>
                    <strong>{t.simularTitulo}</strong> {t.simularTexto}
                  </span>
                  <span className="pp-simular-boton">{t.simular} →</span>
                </a>
              )}
              <a className="pp-comparar" href={`${ruta(idioma, "/comparar")}?p=${p.slug}`} data-ubicacion="proyecto-datos">
                {t.comparar} →
              </a>
            </section>

            {/* 3 · Tipologías ──────────────────────── */}
            <section className="pp-bloque" id="tipologias">
              <p className="section-kicker">{t.kickerTipologias}</p>
              <h2>{t.tituloTipologias}</h2>
              <TipologiasTabs tipologias={tipologiasVista(p, idioma)} idioma={idioma} />

              {p.conflictos.length > 0 && (
                <div className="pp-conflictos">
                  <p>
                    <strong>{t.conflictos}</strong>{" "}
                    {t.conflictosTexto}
                  </p>
                  <ul>
                    {p.conflictos.map((c) => (
                      <li key={c.dato}>
                        <em>{c.dato}:</em>{" "}
                        {c.versiones.map((v, i) => (
                          <span key={v.fuente}>
                            {i > 0 && " · "}
                            {v.valor} <span className="pp-fuente-inline">({v.fuente})</span>
                          </span>
                        ))}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            {/* 4 · Amenidades ──────────────────────── */}
            {p.amenidades.length > 0 && (
              <section className="pp-bloque" id="amenidades">
                <p className="section-kicker">{t.kickerAmenidades}</p>
                <h2>{t.tituloAmenidades}</h2>
                <ul className="pp-amenidades">
                  {p.amenidades.map((a) => (
                    <li key={a}>
                      <IconoAmenidad nombre={amenidadEnEspanol(a)} size={24} />
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
                <p className="pp-fuente">{t.segunPromotor}</p>
              </section>
            )}

            {/* 5 · Ubicación ───────────────────────── */}
            <section className="pp-bloque" id="ubicacion">
              <p className="section-kicker">{t.kickerUbicacion}</p>
              <h2>{p.ubicacion ?? t.ubicacionPendiente}</h2>
              {p.coordenada && (
                <MiniMapa
                  lat={p.coordenada.lat}
                  lon={p.coordenada.lon}
                  nombre={p.nombre}
                  fuente={p.coordenada.fuente}
                  idioma={idioma}
                />
              )}
              <p className="pp-fuente">
                {t.fuente}
                {p.ubicacionFuente}
              </p>
              {p.tiempos && p.tiempos.length > 0 && (
                <ul className="pp-tiempos">
                  {p.tiempos.map((tiempo) => (
                    <li key={tiempo.destino}>
                      <strong>{tiempo.minutos} min</strong> {DESTINOS[idioma][tiempo.destino]}
                      <small>{tiempo.fuente}</small>
                    </li>
                  ))}
                </ul>
              )}
              {p.zona === "Zona Norte" && (
                <p className="pp-enlace-zona">
                  <Link href={ruta(idioma, "/#mapa")}>
                    {t.enlaceZona}
                    <IconoFlecha size={16} />
                  </Link>
                </p>
              )}
            </section>

            {/* 6 · La opinión de Rafael ────────────── */}
            {p.opinionRafael && (
              <section className="pp-bloque pp-opinion" id="opinion">
                <img
                  className="pp-opinion-foto"
                  src="/rafael/retrato-520.jpg"
                  alt="Rafael Hernández Franco"
                  width={96}
                  height={120}
                  loading="lazy"
                />
                <div>
                  <p className="section-kicker">{t.kickerOpinion}</p>
                  <h2>{t.tituloOpinion}</h2>
                  <p className="pp-opinion-para">{p.opinionRafael.paraQuien}</p>
                  <div className="pp-opinion-listas">
                    <div>
                      <h3>{t.fuertes}</h3>
                      <ul>
                        {p.opinionRafael.fuertes.map((f) => (
                          <li key={f}>{f}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3>{t.tenerEnCuenta}</h3>
                      <ul>
                        {p.opinionRafael.tenerEnCuenta.map((f) => (
                          <li key={f}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <p className="pp-fuente">
                    {t.escritoPor}
                    {p.opinionRafael.fecha}.
                  </p>
                </div>
              </section>
            )}

            {/* 7 · Respaldo ────────────────────────── */}
            <section className="pp-bloque" id="respaldo">
              <p className="section-kicker">{t.kickerRespaldo}</p>
              <h2>{t.tituloRespaldo}</h2>
              <dl className="pp-respaldo">
                <div>
                  <dt>{t.promotor}</dt>
                  <dd>{p.promotor}</dd>
                </div>
                <div>
                  <dt>{t.estadoProyecto}</dt>
                  <dd>{estado}</dd>
                </div>
                {p.precio && (
                  <div>
                    <dt>{t.preciosDisponibilidad}</dt>
                    <dd>
                      {p.precio.fuente}
                      {t.corteRespaldo}
                      {p.precio.corte}
                    </dd>
                  </div>
                )}
                {p.avanceObra && (
                  <div>
                    <dt>{t.avance}</dt>
                    <dd>
                      <a href={p.avanceObra.url} target="_blank" rel="noopener noreferrer">
                        {t.paginaAvance}
                      </a>{" "}
                      <span className="pp-fuente-inline">({p.avanceObra.fuente})</span>
                    </dd>
                  </div>
                )}
              </dl>
              {p.brochurePdf && p.brochurePaginas === 0 && (
                <p className="pp-brochure-solo">
                  <a href={p.brochurePdf} target="_blank" rel="noopener noreferrer">
                    <IconoDocumento size={18} />
                    {t.descargarBrochure}
                  </a>
                </p>
              )}
              {p.brochurePaginas > 0 && (
                <BrochureGaleria
                  slug={p.slug}
                  paginas={p.brochurePaginas}
                  pdf={p.brochurePdf}
                  nombre={p.nombre}
                  idioma={idioma}
                />
              )}
            </section>

            {/* 8 · Preguntas frecuentes ────────────── */}
            {p.faq && p.faq.length > 0 && (
              <section className="pp-bloque" id="preguntas">
                <p className="section-kicker">{t.kickerPreguntas}</p>
                <h2>{t.tituloPreguntas}</h2>
                <div className="pp-faq">
                  {p.faq.map((q) => (
                    <details key={q.pregunta}>
                      <summary>{q.pregunta}</summary>
                      <p>{q.respuesta}</p>
                    </details>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Contacto: columna fija en escritorio ─────── */}
          <aside className="pp-lateral" aria-label={t.contactoSobre(p.nombre)}>
            <div className="pp-lateral-caja">
              <p className="pp-lateral-kicker">{precio.muestra ? t.precioReferencia : t.precio}</p>
              <p className="pp-lateral-precio">{precio.texto}</p>
              <p className="pp-lateral-corte">
                {precio.corte ? t.corte(precio.corte) : t.sinPrecio}
              </p>
              <a className="btn-primary pp-btn" href={whatsappVisita} target="_blank" rel="noopener noreferrer">
                <IconoWhatsApp size={18} />
                {t.agendar}
              </a>
              <MeInteresaButton label={t.meInteresa} className="pp-btn pp-btn-secundario" idioma={idioma} />
              {precio.muestra && (
                <a className="pp-lateral-simular" href={ruta(idioma, `/simulador?p=${p.slug}`)} data-ubicacion="proyecto-lateral">
                  {t.simular} →
                </a>
              )}
              <a className="pp-lateral-form" href="#contacto">
                {t.dejanosDatos}
              </a>
            </div>
          </aside>
        </div>

        {/* 9 · Otros proyectos ────────────────────────── */}
        {otros.length > 0 && (
          <section className="section pp-otros" aria-labelledby="pp-otros-titulo">
            <div className="section-shell">
              <p className="section-kicker">{t.kickerCartera}</p>
              <h2 id="pp-otros-titulo">{t.tituloOtros}</h2>
              <RevealGrupo className="pp-otros-grid">
                {otros.map((f, i) => (
                  <div key={f.slug} style={{ "--i": i } as React.CSSProperties}>
                    <TarjetaGiro ficha={f} retraso={i * 900} idioma={idioma} />
                  </div>
                ))}
              </RevealGrupo>
            </div>
          </section>
        )}

        {/* Contacto con el proyecto ya elegido ──────────── */}
        <section className="section section-contacto" id="contacto">
          <div className="section-shell contacto-shell">
            <div className="contacto-texto">
              <p className="section-kicker">{t.kickerContacto}</p>
              <h2>
                {t.teInteresa}
                {p.nombre}?
              </h2>
              <p className="section-lede">{t.ledeContacto}</p>
              <div className="contacto-canales">
                <a className="btn-whatsapp" href={whatsappVisita} target="_blank" rel="noopener noreferrer">
                  <IconoWhatsApp />
                  {t.agendarWhatsApp}
                </a>
              </div>
            </div>
            <ContactForm proyectoInicial={p.nombre} idioma={idioma} nombres={nombresDeCartera(idioma)} />
          </div>
        </section>

        {/* Avisos legales del proyecto ───────────────────── */}
        <section className="pp-avisos" aria-label={t.avisosLegales}>
          <div className="section-shell">
            <BloqueLegal p={p} idioma={idioma} />
            {!pieza.completo && (
              <div className="pp-sin-precio">
                <h2>{t.sinPrecioTitulo}</h2>
                <p>
                  {t.sinPrecioTexto}{" "}
                  {pieza.faltan.join(", ")}
                  {t.sinPrecioCierre}
                </p>
                {p.reservas.length > 0 && (
                  <ul>
                    {p.reservas.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                )}
                {pendientes.length > 0 && (
                  <p>
                    {t.precontractual}
                    {pendientes.join(", ")}.
                  </p>
                )}
              </div>
            )}
            <p className="pp-avisos-texto">{t.avisos}</p>
          </div>
        </section>
      </main>

      <PieSitio portadaPropia={false} idioma={idioma} />

      {/* Escritorio: la foto de Rafael, encima del botón del chat ─── */}
      <WhatsAppFlotante trasDe=".pp-portada" soloEscritorio mensaje={t.flotante(p.nombre)} idioma={idioma} />

      {/* Las entradas al hacer scroll, como en la home ─── */}
      <Animador />

      {/* Móvil: los dos botones siempre a mano, sin tapar el del chat ─── */}
      <div className="pp-barra-movil" role="region" aria-label={t.contactarSobre(p.nombre)}>
        <a className="pp-barra-visita" href={whatsappVisita} target="_blank" rel="noopener noreferrer">
          <IconoWhatsApp size={18} />
          {t.agendar}
        </a>
        <MeInteresaButton label={t.meInteresa} className="pp-barra-interesa" idioma={idioma} />
      </div>
    </>
  );
}
