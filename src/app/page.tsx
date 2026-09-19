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
 *  · El over the fold es el de home-b: imagen de fondo fija, sin partículas.
 *  · El pie de página es el de la home vieja, que trae el bloque legal bueno
 *    (precio de referencia con fecha de corte, etiqueta textual del área,
 *    Ley 675 y numeral 2.16.2) y los enlaces a privacidad y términos.
 *
 * Las tarjetas leen de `src/data/proyectos.ts`. El precio aparece solo cuando
 * el proyecto tiene los tres datos del numeral 2.16.1 de la Circular 004; si
 * no, dice «Consultar». Nunca se escribe un precio a mano en esta página: fue
 * así como la home terminó anunciando Doral West $145 millones por debajo.
 */
import Link from "next/link";
import ContactForm from "@/components/ContactForm";
import ZonaNorte from "@/components/ZonaNorte";
import MapaZona from "@/components/MapaZona";
import Cartera from "@/components/Cartera";
import QuienTeAsesora from "@/components/QuienTeAsesora";
import Reveal from "@/components/Reveal";
import { enlaceWhatsApp, SALUDO_WHATSAPP } from "@/data/contacto";
import { puedePublicarPrecio, rangoPrecio, getProyecto } from "@/data/proyectos";

/**
 * Lo único que se escribe a mano por proyecto: cómo se presenta y a dónde
 * lleva. `href: null` es un proyecto sin landing propia todavía — la ficha
 * queda con «Me interesa» y sin enlace, nunca con un enlace roto.
 * `variante` es la animación de entrada de la ficha en el recorrido.
 *
 * `imagen` es el render del promotor que ya vive en `public/proyectos/<slug>/`,
 * el mismo que abre su landing. `imagen: null` es un proyecto del que todavía
 * tenemos material propio por recibir: la ficha muestra un panel de marca en
 * vez de una foto ajena. Publicamos lo que podemos sostener, también en las
 * imágenes.
 */
const PRESENTACION: Record<
  string,
  {
    href: string | null;
    tipologia: string;
    descripcion: string;
    destacado?: boolean;
    imagen: string | null;
    variante: "zoom" | "up" | "left" | "blur";
  }
> = {
  "doral-country": {
    href: "/proyectos/doral-country",
    tipologia: "Apartamentos en torres · 6 torres · ascensor",
    descripcion: "El lanzamiento más reciente del desarrollo Doral, sobre la Vía al Mar.",
    destacado: true,
    imagen: "/proyectos/doral-country/home.jpg",
    variante: "zoom",
  },
  "doral-suite": {
    href: null,
    tipologia: "Apartaestudios · aprobados para renta corta",
    descripcion: "Inventario final: quedan siete de sesenta y seis unidades.",
    imagen: null,
    variante: "up",
  },
  "doral-west": {
    href: "/proyectos/doral-west",
    tipologia: "Casas de 1 y 2 pisos · lote propio · parqueadero privado",
    descripcion: "Estructura preparada para crecer hasta un tercer nivel. Entregas documentadas por manzana.",
    imagen: "/proyectos/doral-west/home.jpg",
    variante: "up",
  },
  "acacias-campestre": {
    href: null,
    tipologia: "22 torres · 904 apartamentos · 5 etapas",
    descripcion: "Entrada económica con valorización a mediano plazo. Perfil inversionista.",
    imagen: null,
    variante: "left",
  },
  "blue-garden": {
    href: "/proyectos/blue-garden",
    tipologia: "Casas ampliables · 3 habitaciones · jardín",
    descripcion: "Casa familiar con lote generoso y posibilidad de ampliación.",
    imagen: "/proyectos/blue-garden/home.jpg",
    variante: "blur",
  },
};

const ORDEN = ["doral-country", "doral-suite", "doral-west", "acacias-campestre", "blue-garden"];

const proyectos = ORDEN.map((slug) => {
  const d = getProyecto(slug)!;
  const pres = PRESENTACION[slug];
  const areas = [...new Set(d.tipologias.map((t) => t.area.valor))].join(" · ");
  return {
    nombre: d.nombre,
    href: pres.href,
    zona: d.zona,
    precio: puedePublicarPrecio(d) && d.precio ? rangoPrecio(d.precio.desde, d.precio.hasta) : "Consultar",
    muestraPrecio: puedePublicarPrecio(d) && d.precio !== null,
    corte: d.precio?.corte ?? null,
    area: areas,
    tipologia: pres.tipologia,
    descripcion: pres.descripcion,
    destacado: pres.destacado ?? false,
    imagen: pres.imagen,
    variante: pres.variante,
  };
});

const WA_LINK = enlaceWhatsApp(SALUDO_WHATSAPP);

export default function Home() {
  return (
    <>
      {/* ── Nav ─────────────────────────────── */}
      <header className="nav">
        <div className="nav-inner">
          <a className="brand" href="#inicio" aria-label="RHF Living — inicio">
            <img src="/marca/rhf-living-oscuro.svg" alt="RHF Living" width="215" height="48" />
          </a>
          <nav className="nav-links">
            <a href="#cartera">Nuestra cartera</a>
            <a href="#zonanorte">Zona Norte</a>
            <a href="#asesor">Quién te asesora</a>
            <a href="#contacto">Contacto</a>
          </nav>
          <a className="nav-cta" href={WA_LINK} target="_blank" rel="noopener noreferrer">
            Escríbenos
          </a>
        </div>
      </header>

      <main>
        {/* ── Over the fold ────────────────────── */}
        <section className="hero-wrap" id="inicio">
          <div className="hero-bg" />
          <div className="hero-content">
            <p className="eyebrow">Asesoría inmobiliaria · Cartagena</p>
            <h1>Tu próximo proyecto,<br />en la mejor ubicación.</h1>
            <p className="hero-sub">
              Asesoría inmobiliaria premium en Cartagena y la Zona Norte.
              Te acompañamos en cada paso para encontrar el proyecto
              que se ajusta a lo que buscas.
            </p>
            <div className="hero-ctas">
              <a className="btn-primary" href="#cartera">
                Ver nuestra cartera
              </a>
              <a className="btn-ghost" href={WA_LINK} target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon /> Contactar
              </a>
            </div>
          </div>
          <p className="hero-credito">
            Corredor de la Zona Norte, Cartagena · marzo de 2026 · foto propia
          </p>
        </section>

        {/* ── Zona Norte (antes que la cartera) ── */}
        <ZonaNorte />

        {/* ── El territorio · mapa interactivo ─── */}
        <MapaZona />

        {/* ── Quién te asesora ──────────────────
            Va antes de la cartera a propósito: el visitante sabe por qué
            escucharnos antes de que le mostremos qué tenemos. Es el orden
            del plan de la home. */}
        <QuienTeAsesora />

        {/* ── La cartera ───────────────────────── */}
        <Cartera proyectos={proyectos} />

        {/* ── Contacto ─────────────────────────── */}
        <section className="section section-contacto" id="contacto">
          <div className="section-shell contacto-shell">
            <Reveal className="contacto-texto" variant="up">
              <p className="section-kicker">Contacto</p>
              <h2>Hablemos de tu próximo proyecto</h2>
              <p className="section-lede">
                Te asesoramos sin compromiso. Cuéntanos qué buscas
                y te guiamos al proyecto que mejor se ajuste a tus planes.
              </p>
              <div className="contacto-canales">
                <a
                  className="btn-whatsapp"
                  href={WA_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <WhatsAppIcon /> Escríbenos por WhatsApp
                </a>
                <p className="contacto-chat-hint">
                  ¿Prefieres chatear directo en la página? Usa el ícono
                  de chat abajo a la derecha — nuestro agente te responde
                  al instante sobre disponibilidad, plazos y condiciones.
                </p>
              </div>
            </Reveal>
            <Reveal variant="up" delay={140}>
              <ContactForm />
            </Reveal>
          </div>
        </section>
      </main>

      {/* ── Footer ─────────────────────── */}
      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-top">
            <img className="footer-brand" src="/marca/rhf-living.svg" alt="RHF Living" width="196" height="44" />
            <div className="footer-links">
              <a href="#inicio">Inicio</a>
              <a href="#cartera">Nuestra cartera</a>
              <a href="#zonanorte">Zona Norte</a>
              <a href="#asesor">Quién te asesora</a>
              <a href="#contacto">Contacto</a>
            </div>
          </div>
          <div className="footer-legal">
            <p>
              <strong>Rafael Hernández Franco</strong> — Asesor inmobiliario independiente.
              La fotografía de portada es propia. Las imágenes de los proyectos son renders
              y material del promotor. Los precios,
              áreas y condiciones aquí publicados corresponden a la fecha
              indicada en cada proyecto y pueden variar sin previo aviso.
              Para información actualizada, contáctanos directamente.
            </p>
            <p className="footer-circular">
              Los precios aquí publicados son de referencia, en pesos
              colombianos, a la fecha de corte que acompaña a cada cifra, y
              están sujetos a disponibilidad. Cada proyecto publica su área
              con la etiqueta textual de la fuente del promotor y declara si
              su equivalencia con el área privada construida del artículo 3 de
              la Ley 675 de 2001 está pendiente de certificación. La
              información precontractual del numeral 2.16.2 de la Circular 004
              de la SIC —estrato, cuota de administración, fecha de entrega,
              valor de desistimiento y plan de etapas— se entrega por escrito
              antes de cualquier separación.
            </p>
            <p className="footer-legal-links">
              <Link href="/privacidad">Política de tratamiento de datos</Link>
              {" · "}
              <Link href="/terminos">Términos de uso</Link>
            </p>
            <p className="footer-copy">© {new Date().getFullYear()} RHF Living. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>

      {/* ── WhatsApp flotante ───────────────── */}
      <a
        className="whatsapp-float"
        href={WA_LINK}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat por WhatsApp"
      >
        <WhatsAppIcon />
      </a>
    </>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.742.324 1.322.52 1.774.645.745.237 1.422.203 1.957.123.595-.089 1.832-.748 2.09-1.471.258-.723.258-1.342.183-1.472-.074-.131-.272-.213-.57-.362m-5.436 6.868h-.004a9.68 9.68 0 01-4.93-1.88l-.354-.21-3.665.96.978-3.57-.232-.37a9.68 9.68 0 01-1.483-5.128c0-5.35 4.352-9.703 9.703-9.703a9.63 9.63 0 016.86 2.843 9.63 9.63 0 012.843 6.86c0 5.35-4.352 9.703-9.703 9.703h-.005zm5.577-14.998a12.28 12.28 0 00-8.74-3.623C6.439 2.63 3.63 5.437 3.63 8.874c0 1.213.345 2.394.997 3.406l-1.06 3.87 3.96-1.038a6.24 6.24 0 003.314.902c3.467 0 6.285-2.818 6.285-6.285 0-1.68-.654-3.26-1.84-4.448l-.005-.004z"/>
    </svg>
  );
}
