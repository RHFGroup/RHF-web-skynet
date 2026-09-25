/**
 * La home de rhfliving.com — una sola, desde el 18 de septiembre de 2026.
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
 * Las tarjetas leen de `src/data/proyectos.ts`. El precio aparece solo cuando
 * el proyecto tiene los tres datos del numeral 2.16.1 de la Circular 004; si
 * no, dice «Consultar». Nunca se escribe un precio a mano en esta página: fue
 * así como la home terminó anunciando Doral West $145 millones por debajo.
 */
import ContactForm from "@/components/ContactForm";
import MapaZona from "@/components/MapaZona";
import Cartera from "@/components/Cartera";
import Inmuebles from "@/components/Inmuebles";
import Hero, { type FichaHero } from "@/components/Hero";
import NavInicio from "@/components/NavInicio";
import Animador from "@/components/Animador";
import WhatsAppFlotante from "@/components/WhatsAppFlotante";
import QuienTeAsesora from "@/components/QuienTeAsesora";
import Reveal from "@/components/Reveal";
import { enlaceWhatsApp, SALUDO_WHATSAPP } from "@/data/contacto";
import PieSitio from "@/components/PieSitio";
import RespaldoJuridico from "@/components/RespaldoJuridico";
import PasoAPaso from "@/components/PasoAPaso";
import { INMUEBLES } from "@/data/inmuebles";
import { PASOS } from "@/data/proceso";
import { fichaDe, fichaDeInmueble, pinDelMapa, proyectosEnOrden } from "@/lib/ficha";
import { seMuestra } from "@/lib/revision";
import type { PinProyecto } from "@/components/MapaIlustrado";
import "@/styles/secciones.css";

/**
 * Las tarjetas de la cartera salen de `src/data/proyectos.ts`, en el orden de
 * la cartera, armadas en el build por `fichaDe` (src/lib/ficha.ts): el precio
 * solo si es publicable y con su corte, el área con su rótulo literal.
 */
const fichas = proyectosEnOrden().map(fichaDe);

/** Las mismas fichas para la franja del hero, con su pin si está verificado. */
const heroFichas: FichaHero[] = proyectosEnOrden().map((p) => ({
  ...fichaDe(p),
  pin: p.heroPin ?? null,
}));

/** Los inmuebles disponibles, con la misma tarjeta de la cartera. */
const fichasInmuebles = INMUEBLES.map(fichaDeInmueble);

/**
 * El territorio muestra los proyectos de la Zona Norte: todos en su lista y,
 * en el mapa, solo los que tienen coordenada verificada en proyectos.ts (hoy
 * ninguno). Blue Garden y Acacias no van: no están en la Zona Norte.
 */
const proyectosZonaNorte = proyectosEnOrden().filter((p) => p.zona === "Zona Norte");
const fichasZonaNorte = proyectosZonaNorte.map(fichaDe);
const pinesZonaNorte = proyectosZonaNorte.map(pinDelMapa).filter((p): p is PinProyecto => p !== null);

const WA_LINK = enlaceWhatsApp(SALUDO_WHATSAPP);

/**
 * Los colores de las secciones, en orden: azul, café, azul, café… con un tono
 * distinto para cada una. Se asignan sobre las secciones que de verdad se
 * publican, para que la alternancia no se rompa cuando una se oculta (el paso
 * a paso no sale en producción mientras ningún paso esté confirmado).
 */
const TONOS = [
  "tono-azul-1",
  "tono-cafe-1",
  "tono-azul-2",
  "tono-cafe-2",
  "tono-azul-3",
  "tono-cafe-3",
  "tono-azul-4",
];

/**
 * El orden de la home: el territorio primero (la zona antes que el
 * apartamento), quién te asesora, la cartera, los inmuebles disponibles, el
 * respaldo jurídico, el paso a paso y el contacto.
 */
function secciones(): { id: string; nodo: React.ReactNode }[] {
  return [
    { id: "territorio", nodo: <MapaZona proyectos={fichasZonaNorte} pines={pinesZonaNorte} /> },
    { id: "asesor", nodo: <QuienTeAsesora /> },
    { id: "cartera", nodo: <Cartera fichas={fichas} /> },
    ...(fichasInmuebles.length > 0 ? [{ id: "inmuebles", nodo: <Inmuebles fichas={fichasInmuebles} /> }] : []),
    { id: "respaldo", nodo: <RespaldoJuridico /> },
    ...(PASOS.some(seMuestra) ? [{ id: "pasos", nodo: <PasoAPaso /> }] : []),
    { id: "contacto", nodo: <Contacto /> },
  ];
}

export default function Home() {
  return (
    <>
      {/* ── Nav: transparente sobre la portada, marfil al bajar ── */}
      <NavInicio whatsapp={WA_LINK} />

      <main>
        {/* ── Over the fold ────────────────────── */}
        <Hero fichas={heroFichas} whatsapp={WA_LINK} />

        {/* ── Las secciones, cada una en su color ── */}
        {secciones().map((x, i) => (
          <div key={x.id} className={`tono ${TONOS[i % TONOS.length]}`}>
            {x.nodo}
          </div>
        ))}
      </main>

      {/* Las entradas al hacer scroll de toda la página (titulares, eyebrows,
          párrafos, botones e imágenes). No pinta nada. */}
      <Animador />

      {/* ── Footer ─────────────────────── */}
      <PieSitio />

      {/* ── WhatsApp flotante, con la foto de Rafael ──
          Aparece cuando la portada sale de la pantalla. */}
      <WhatsAppFlotante trasDe="#inicio" />
    </>
  );
}

function Contacto() {
  return (
    <section className="section section-contacto" id="contacto">
      <div className="section-shell contacto-shell">
        <Reveal className="contacto-texto" variant="up">
          <p className="section-kicker">Contacto</p>
          <h2>Hablemos de tu próximo proyecto</h2>
          <p className="section-lede">
            Te asesoramos sin compromiso. Cuéntanos qué buscas y te guiamos al proyecto que mejor se ajuste a tus
            planes.
          </p>
          <div className="contacto-canales">
            <a className="btn-whatsapp" href={WA_LINK} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon /> Escríbenos por WhatsApp
            </a>
            <p className="contacto-chat-hint">
              ¿Prefieres chatear directo en la página? Usa el ícono de chat abajo a la derecha — nuestro agente te
              responde al instante sobre disponibilidad, plazos y condiciones.
            </p>
          </div>
        </Reveal>
        <Reveal variant="up" delay={140}>
          <ContactForm />
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
