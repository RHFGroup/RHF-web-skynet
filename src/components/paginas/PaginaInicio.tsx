/**
 * La home de rhfliving.com (y de /en, en inglés: docs/i18n.md) — una sola, desde el 18 de septiembre de 2026.
 *
 * Reemplaza a las tres portadas que convivían (`/`, `/home-b` y `/home-c`).
 * Se armó así, por pedido de Rafael:
 *
 *  · El cuerpo es el de home-c: Zona Norte antes de la cartera, el mapa del
 *    territorio y la cartera que se recorre ficha por ficha. Es el copy ya
 *    corregido contra la research del vault — sin el aeropuerto como hecho
 *    consumado y sin «la mayor valorización predial».
 *  · La barra de navegación es la de la home vieja, con el logo RHF Living.
 *  · El over the fold es el de home-b —la foto propia del corredor, sin
 *    partículas—. Desde el 25-sep-2026 es un escaparate (Hero.tsx): abre con
 *    esa foto y pasa por los proyectos de la cartera a pantalla completa, con
 *    su precio y su corte, y miniaturas para elegir.
 *  · El menú es transparente sobre la portada y marfil al bajar (NavInicio).
 *  · El pie de página es el de la home vieja, que trae el bloque legal bueno
 *    (precio de referencia con fecha de corte, etiqueta textual del área,
 *    Ley 675 y numeral 2.16.2) y los enlaces a privacidad y términos.
 *
 * 25-sep-2026 (pedido de Rafael, vista previa del PR #31): fuera la sección
 * Zona Norte con su mapa ilustrado y «El criterio» (los archivos quedan, sin
 * usar); El territorio sube a primera sección; «Quién te asesora» queda
 * corto, con botón a /asesor; entra «Inmuebles disponibles» debajo de la
 * cartera; y cada sección va en su color, alternando azul y café oscuros
 * (src/styles/secciones.css).
 *
 * 25-sep-2026, tarde (ya publicada esa versión): «Proyectos que asesoramos» y
 * «Apartamentos terminados y en construcción» van juntos, en un solo bloque;
 * las secciones se reordenan para quien visita la web (qué hay → dónde queda
 * → quién te asesora → con qué respaldo → hablemos); y el café sale: las
 * secciones alternan azul y blanco.
 *
 * 25-sep-2026, noche (Rafael, sobre la vista previa): los apartamentos van
 * DENTRO de la cartera; fuera las marcas «Propuesta · por confirmar»; foto más
 * seria; más animaciones y el teléfono más ordenado; el orden, según el de
 * las inmobiliarias que más venden; y una sección de redes. El orden y el
 * porqué están abajo, en `secciones()`.
 *
 * Las tarjetas leen de `src/data/proyectos.ts`. El precio aparece solo cuando
 * el proyecto tiene los tres datos del numeral 2.16.1 de la Circular 004; si
 * no, dice «Consultar». Nunca se escribe un precio a mano en esta página: fue
 * así como la home terminó anunciando Doral West $145 millones por debajo.
 */
import type { Metadata } from "next";
import ContactForm from "@/components/ContactForm";
import { nombresDeCartera } from "@/i18n/datos";
import MapaZona from "@/components/MapaZona";
import Cartera from "@/components/Cartera";
import Desarrolladores from "@/components/Desarrolladores";
import Noticias from "@/components/Noticias";
import Resenas from "@/components/Resenas";
import NuestrasRedes from "@/components/NuestrasRedes";
import Hero, { type AccesoHero, type FichaHero } from "@/components/Hero";
import NavInicio from "@/components/NavInicio";
import Animador from "@/components/Animador";
import WhatsAppFlotante from "@/components/WhatsAppFlotante";
import QuienTeAsesora from "@/components/QuienTeAsesora";
import Reveal from "@/components/Reveal";
import { enlaceWhatsApp, saludoWhatsApp } from "@/data/contacto";
import PieSitio from "@/components/PieSitio";
import RespaldoJuridico from "@/components/RespaldoJuridico";
import PasoAPaso from "@/components/PasoAPaso";
import type { Proyecto } from "@/data/proyectos";
import { alternos, SITIO, type Idioma } from "@/i18n/idioma";
import { inmuebles } from "@/i18n/modulos/inmuebles";
import { proceso } from "@/i18n/modulos/proceso";
import { fichaDe, fichaDeInmueble, pinDelMapa, proyectosEnOrden } from "@/lib/ficha";
import { seMuestra } from "@/lib/revision";
import type { PinProyecto } from "@/components/MapaIlustrado";
import "@/styles/secciones.css";

const TEXTOS = {
  es: {
    kicker: "Contacto",
    h2: "Hablemos de tu próximo proyecto",
    lede: "Te asesoramos sin compromiso. Cuéntanos qué buscas y te guiamos al proyecto que mejor se ajuste a tus planes.",
    escribenos: " Escríbenos por WhatsApp",
    chat: "¿Prefieres chatear directo en la página? Usa el ícono de chat abajo a la derecha — nuestro agente te responde al instante sobre disponibilidad, plazos y condiciones.",
  },
  en: {
    kicker: "Contact",
    h2: "Let's talk about your next home",
    lede: "No-obligation advice. Tell us what you're looking for and we'll point you to the projects that fit your plans.",
    escribenos: " Message us on WhatsApp",
    chat: "Prefer to chat right here? Use the chat icon at the bottom right — our assistant replies right away about availability, timelines and terms.",
  },
} satisfies Record<Idioma, Record<string, string>>;

/**
 * Los accesos de la portada, por estado, con cuántos hay de cada uno en la
 * cartera. Un estado sin nada no se muestra.
 */
const ACCESOS: { estado: Proyecto["estado"]; ancla: string; texto: Record<Idioma, string> }[] = [
  { estado: "en lanzamiento", ancla: "en-lanzamiento", texto: { es: "En lanzamiento", en: "Launching" } },
  { estado: "en construcción", ancla: "en-construccion", texto: { es: "En construcción", en: "Under construction" } },
  { estado: "entrega inmediata", ancla: "entrega-inmediata", texto: { es: "Entrega inmediata", en: "Ready to move in" } },
];

/**
 * La home en inglés lleva su propio título y descripción; la española usa los
 * de la raíz (src/app/layout.tsx). Las dos, con sus enlaces `hreflang`.
 */
export function metadataInicio(idioma: Idioma): Metadata {
  const { canonical, languages } = alternos("/", idioma);
  if (idioma === "es") return { alternates: { canonical, languages } };
  const titulo = "RHF Living — Real estate advisory in Cartagena, Colombia";
  const descripcion =
    "Rafael Hernández Franco, independent real estate advisor in Cartagena de Indias, Colombia. Our portfolio of new homes in the Zona Norte and nearby, each with its official brochure and its reference price in Colombian pesos, with a USD reference.";
  return {
    title: { absolute: titulo },
    description: descripcion,
    keywords: [
      "Cartagena real estate",
      "Cartagena Colombia apartments for sale",
      "Zona Norte Cartagena",
      "real estate advisor Cartagena",
      "Rafael Hernández Franco",
      "RHF Living",
    ],
    alternates: { canonical, languages },
    openGraph: {
      title: titulo,
      description: descripcion,
      url: canonical,
      siteName: "RHF Living",
      locale: "en_US",
      type: "website",
      images: [{ url: `${SITIO}/og.jpg`, width: 1200, height: 630, alt: "RHF Living — Real estate advisory in Cartagena" }],
    },
    twitter: { card: "summary_large_image", title: titulo, description: descripcion, images: [`${SITIO}/og.jpg`] },
  };
}

/**
 * El orden de la home y el color de cada bloque, blanco y azul alternados
 * («café no me gusta, que sea azul y blanco»). Cada bloque tiene su tono
 * (src/styles/secciones.css).
 *
 * El orden sale de revisar las homes de las inmobiliarias y los agentes que
 * más venden (Amarilo, Constructora Bolívar, Marval, Cusezar, Serena del Mar,
 * Engel & Völkers, Compass, Coldwell Banker, The Agency y agentes de alto
 * volumen), el 25-sep-2026: arriba la portada con accesos a la oferta;
 * después, la oferta con filtros; luego quién asesora; el territorio, cuando
 * la persona ya vio qué hay; cómo se compra y con qué respaldo; y al final
 * las redes y el contacto.
 *
 *  1. Cartera (blanco): proyectos y apartamentos juntos, y debajo, en el
 *     mismo bloque, los desarrolladores con sus logos (28-sep-2026).
 *  2. Quién te asesora (azul).
 *  3. El territorio (blanco): «¿por qué aquí?».
 *  4. Cómo comprar y respaldo jurídico (azul): van en un mismo bloque; si el
 *     paso a paso no sale, la alternancia de colores sigue igual.
 *  5. Noticias de la Zona Norte, con la suscripción al boletín (blanco).
 *  6. Reseñas (azul): hoy, la invitación a dejar una.
 *  7. Nuestras redes, con los últimos reels (blanco).
 *  8. Contacto (azul), antes del pie, que lleva una línea camel arriba.
 *
 * 28-sep-2026, tarde (Rafael): entran los desarrolladores, las noticias con
 * su página /noticias y la suscripción, las reseñas y los reels.
 */
function secciones(
  idioma: Idioma,
  datos: { cartera: ReturnType<typeof fichaDe>[]; fichasZonaNorte: ReturnType<typeof fichaDe>[]; pinesZonaNorte: PinProyecto[]; wa: string },
): { id: string; tono: string; nodo: React.ReactNode }[] {
  const { cartera, fichasZonaNorte, pinesZonaNorte, wa } = datos;
  return [
    {
      id: "oferta",
      tono: "tono-claro tono-blanco-1",
      // 28-sep-2026: Rafael pidió quitar la barra de cifras que iba encima
      // («quita toda la barra esa»). BarraConfianza.tsx queda en el repo, sin uso.
      nodo: (
        <>
          <Cartera fichas={cartera} idioma={idioma} />
          <Desarrolladores idioma={idioma} />
        </>
      ),
    },
    { id: "asesor", tono: "tono-oscuro tono-azul-1", nodo: <QuienTeAsesora idioma={idioma} /> },
    {
      id: "territorio",
      tono: "tono-claro tono-blanco-2",
      nodo: <MapaZona proyectos={fichasZonaNorte} pines={pinesZonaNorte} idioma={idioma} />,
    },
    {
      id: "compra",
      tono: "tono-oscuro tono-azul-2",
      nodo: (
        <>
          {proceso(idioma).PASOS.some(seMuestra) && <PasoAPaso idioma={idioma} />}
          <RespaldoJuridico idioma={idioma} />
        </>
      ),
    },
    { id: "noticias", tono: "tono-claro tono-blanco-1", nodo: <Noticias idioma={idioma} /> },
    { id: "resenas", tono: "tono-oscuro tono-azul-1", nodo: <Resenas idioma={idioma} /> },
    { id: "redes", tono: "tono-claro tono-blanco-3", nodo: <NuestrasRedes idioma={idioma} /> },
    { id: "contacto", tono: "tono-oscuro tono-azul-3", nodo: <Contacto idioma={idioma} wa={wa} /> },
  ];
}

export default function PaginaInicio({ idioma = "es" }: { idioma?: Idioma }) {
  /**
   * Las tarjetas de la cartera salen de `src/data/proyectos.ts` (en inglés,
   * de `src/data/en/proyectos.ts`), en el orden de la cartera, armadas en el
   * build por `fichaDe` (src/lib/ficha.ts): el precio solo si es publicable y
   * con su corte, el área con su rótulo literal.
   */
  const orden = proyectosEnOrden(idioma);
  const fichas = orden.map((p) => fichaDe(p, idioma));

  /** Las mismas fichas para la franja del hero, con su pin si está verificado. */
  const heroFichas: FichaHero[] = orden.map((p) => ({
    ...fichaDe(p, idioma),
    pin: p.heroPin ?? null,
  }));

  /** Los inmuebles disponibles, con la misma tarjeta de la cartera. */
  const fichasInmuebles = inmuebles(idioma).INMUEBLES.map((i) => fichaDeInmueble(i, idioma));

  /** La cartera completa: los proyectos y, después, los apartamentos disponibles. */
  const cartera = [...fichas, ...fichasInmuebles];

  const accesos: AccesoHero[] = ACCESOS.map((e) => ({
    href: `#${e.ancla}`,
    texto: e.texto[idioma],
    n: cartera.filter((f) => f.estado === e.estado).length,
  })).filter((a) => a.n > 0);

  /**
   * El territorio muestra los proyectos de la Zona Norte: todos en su lista y,
   * en el mapa, solo los que tienen coordenada verificada en proyectos.ts (hoy
   * ninguno). Blue Garden y Acacias no van: no están en la Zona Norte.
   */
  const proyectosZonaNorte = orden.filter((p) => p.zona === "Zona Norte");
  const fichasZonaNorte = proyectosZonaNorte.map((p) => fichaDe(p, idioma));
  const pinesZonaNorte = proyectosZonaNorte
    .map((p) => pinDelMapa(p, idioma))
    .filter((p): p is PinProyecto => p !== null);

  const WA_LINK = enlaceWhatsApp(saludoWhatsApp(idioma));

  return (
    <>
      {/* ── Nav: transparente sobre la portada, blanco al bajar ── */}
      <NavInicio whatsapp={WA_LINK} idioma={idioma} />

      <main>
        {/* ── Over the fold ────────────────────── */}
        <Hero fichas={heroFichas} whatsapp={WA_LINK} accesos={accesos} idioma={idioma} />

        {/* ── Los bloques, azul y blanco alternados ── */}
        {secciones(idioma, { cartera, fichasZonaNorte, pinesZonaNorte, wa: WA_LINK }).map((x) => (
          <div key={x.id} className={`tono ${x.tono} bloque-${x.id}`}>
            {x.nodo}
          </div>
        ))}
      </main>

      {/* Las entradas al hacer scroll de toda la página (titulares, eyebrows,
          párrafos, botones e imágenes). No pinta nada. */}
      <Animador />

      {/* ── Footer ─────────────────────── */}
      <PieSitio idioma={idioma} />

      {/* ── WhatsApp flotante, con la foto de Rafael ──
          Aparece cuando la portada sale de la pantalla. */}
      <WhatsAppFlotante trasDe="#inicio" idioma={idioma} />
    </>
  );
}

function Contacto({ idioma, wa }: { idioma: Idioma; wa: string }) {
  const t = TEXTOS[idioma];
  return (
    <section className="section section-contacto" id="contacto">
      <div className="section-shell contacto-shell">
        <Reveal className="contacto-texto" variant="up">
          <p className="section-kicker">{t.kicker}</p>
          <h2>{t.h2}</h2>
          <p className="section-lede">{t.lede}</p>
          <div className="contacto-canales">
            <a className="btn-whatsapp" href={wa} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon />
              {t.escribenos}
            </a>
            <p className="contacto-chat-hint">{t.chat}</p>
          </div>
        </Reveal>
        <Reveal variant="up" delay={140}>
          <ContactForm idioma={idioma} nombres={nombresDeCartera(idioma)} />
        </Reveal>
      </div>
    </section>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.742.324 1.322.52 1.774.645.745.237 1.422.203 1.957.123.595-.089 1.832-.748 2.09-1.471.258-.723.258-1.342.183-1.472-.074-.131-.272-.213-.57-.362m-5.436 6.868h-.004a9.68 9.68 0 01-4.93-1.88l-.354-.21-3.665.96.978-3.57-.232-.37a9.68 9.68 0 01-1.483-5.128c0-5.35 4.352-9.703 9.703-9.703a9.63 9.63 0 016.86 2.843 9.63 9.63 0 012.843 6.86c0 5.35-4.352 9.703-9.703 9.703h-.005zm5.577-14.998a12.28 12.28 0 00-8.74-3.623C6.439 2.63 3.63 5.437 3.63 8.874c0 1.213.345 2.394.997 3.406l-1.06 3.87 3.96-1.038a6.24 6.24 0 003.314.902c3.467 0 6.285-2.818 6.285-6.285 0-1.68-.654-3.26-1.84-4.448l-.005-.004z"/>
    </svg>
  );
}
