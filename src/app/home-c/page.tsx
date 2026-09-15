/**
 * BOCETO DE DISENO - no es la home de produccion.
 *
 * Restaurado el 15-sep-2026 a pedido de Rafael, que sigue comparando variantes.
 * Dos cosas quedaron blindadas al restaurarlo:
 *
 *  - robots: { index: false } - Google no lo indexa. La version publica de esta
 *    pagina estuvo indexable y publicando precios equivocados.
 *  - Los precios YA NO se escriben aca: salen de src/data/proyectos.ts, la misma
 *    fuente de la home real. Un boceto con precios propios se desincroniza el
 *    dia que cambie un precio, y fue asi como Doral West quedo anunciado
 *    $145 millones por debajo.
 */
// home-c: la versión con scrollytelling (actos 2, 4 y 5) y el copy de Zona
// Norte ya corregido contra la research del vault. Existe como ruta aparte
// para poder compararla contra `/` sin tocar la página que está en el aire.
//
// Diferencias contra `/`:
//   · Zona Norte va ANTES de la cartera, con parallax, revelado escalonado y
//     tres contadores cuyas cifras salen de la nota de copy del vault.
//   · La cartera se revela ficha por ficha en vez de aparecer toda en grilla.
//   · Sin aeropuerto como hecho, sin «la mayor valorización predial» y sin
//     «la mejor oportunidad de inversión»: las tres las desmiente
//     `research/zona-norte-de-cartagena-que-se-puede-afirmar`.
//   · Cierre honesto sobre el estado real del aeropuerto ante la ANI.
//
// Comparación interna: no se indexa.
export const metadata = {
  robots: { index: false, follow: false },
};

import ContactForm from "@/components/ContactForm";
import HeroParticles from "@/components/HeroParticles";
import ZonaNorte from "@/components/ZonaNorte";
import MapaZona from "@/components/MapaZona";
import Cartera from "@/components/Cartera";
import Reveal from "@/components/Reveal";
import { enlaceWhatsApp, SALUDO_WHATSAPP } from "@/data/contacto";

import { getProyecto, puedePublicarPrecio, rangoPrecio } from "@/data/proyectos";

/** El precio de la tarjeta sale de la capa de datos, con su candado. */
function precioDe(slug: string): string {
  const d = getProyecto(slug);
  if (!d || !puedePublicarPrecio(d) || !d.precio) return "Consultar";
  return rangoPrecio(d.precio.desde, d.precio.hasta);
}


// Datos de ficha. Fuente de verdad: Excel de la constructora con fecha de corte
// → nota del proyecto en el vault → este archivo. No editar sin cerrar esa cadena.
const proyectos = [
  {
    nombre: "Doral Country",
    zona: "Zona Norte",
    precio: precioDe("doral-country"),
    area: "40 – 62 m²",
    tipologia: "Apartamentos en torres · 4 torres · 111 unidades",
    descripcion: "Torre 4 recién abierta: 50 unidades con plazo de 39 meses.",
    destacado: true,
    imagen: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop",
    variante: "zoom" as const,
  },
  {
    nombre: "Doral Suite",
    zona: "Zona Norte",
    precio: precioDe("doral-suite"),
    area: "45 – 68 m²",
    tipologia: "Apartamentos tipo suite · Acabados premium",
    descripcion: "Vida urbana con acabados de lujo en la Zona Norte.",
    destacado: false,
    imagen: "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=600&h=400&fit=crop",
    variante: "up" as const,
  },
  {
    nombre: "Doral West",
    zona: "Zona Norte",
    precio: precioDe("doral-west"),
    area: "70 – 95 m²",
    tipologia: "Casas · Lote propio · 2 niveles",
    descripcion: "Casas con lote propio y espacio para crecer en familia.",
    destacado: false,
    imagen: "https://images.unsplash.com/photo-1605146769289-440113cc3d00?w=600&h=400&fit=crop",
    variante: "up" as const,
  },
  {
    nombre: "Acacias Campestre",
    zona: "Cartagena",
    precio: precioDe("acacias-campestre"),
    area: "33 – 70 m²",
    tipologia: "22 torres · 904 apartamentos · 5 etapas",
    descripcion: "Entrada económica con valorización a mediano plazo. Perfil inversionista.",
    destacado: false,
    imagen: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&h=400&fit=crop",
    variante: "left" as const,
  },
  {
    nombre: "Blue Garden",
    zona: "Turbaco",
    precio: precioDe("blue-garden"),
    area: "Lote 250 m² · 75 m² construidos",
    tipologia: "Casas ampliables · 3 habitaciones · Jardín",
    descripcion: "Casa familiar con lote generoso y posibilidad de ampliación.",
    destacado: false,
    imagen: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&h=400&fit=crop",
    variante: "blur" as const,
  },
];

const WA_LINK = enlaceWhatsApp(SALUDO_WHATSAPP);

export default function Home() {
  return (
    <>
      {/* ── Nav ─────────────────────────────── */}
      <header className="nav">
        <div className="nav-inner">
          <a className="brand" href="#inicio">RHF</a>
          <nav className="nav-links">
            <a href="#zonanorte">Zona Norte</a>
            <a href="#cartera">Nuestra cartera</a>
            <a href="#contacto">Contacto</a>
          </nav>
          <a className="nav-cta" href={WA_LINK} target="_blank" rel="noopener noreferrer">
            Escríbenos
          </a>
        </div>
      </header>

      <main>
        {/* ── Acto 1 · Héroe ───────────────────── */}
        <section className="hero-wrap" id="inicio">
          <HeroParticles />
          <div className="hero-content">
            <p className="eyebrow">Asesoría inmobiliaria · Cartagena</p>
            <h1>Tu próximo proyecto,<br />en la mejor ubicación.</h1>
            <p className="hero-sub">
              Asesoría inmobiliaria premium en Cartagena y la Zona Norte.
              Te acompañamos en cada paso para encontrar el proyecto
              que se ajusta a lo que buscas.
            </p>
            <div className="hero-ctas">
              <a className="btn-primary" href="#zonanorte">
                Empieza por la zona
              </a>
              <a className="btn-ghost" href={WA_LINK} target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon /> Contactar
              </a>
            </div>
          </div>
          <a className="hero-scroll" href="#zonanorte" aria-label="Ir a la sección Zona Norte">
            <span />
          </a>
        </section>

        {/* ── Acto 2 · Zona Norte (antes que la cartera) ── */}
        <ZonaNorte />

        {/* ── El territorio · mapa interactivo ─── */}
        <MapaZona />

        {/* ── Acto 4 · La cartera ──────────────── */}
        <Cartera proyectos={proyectos} />

        {/* ── Acto 5 · Contacto ────────────────── */}
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
            <span className="footer-brand">RHF</span>
            <div className="footer-links">
              <a href="#inicio">Inicio</a>
              <a href="#zonanorte">Zona Norte</a>
              <a href="#cartera">Nuestra cartera</a>
              <a href="#contacto">Contacto</a>
            </div>
          </div>
          <div className="footer-legal">
            <p>
              <strong>Rafael Hernández Franco</strong> — Asesor inmobiliario independiente.
              Las imágenes de esta página son ilustrativas. Los precios,
              áreas y condiciones aquí publicados corresponden a la fecha
              indicada en cada proyecto y pueden variar sin previo aviso.
              Para información actualizada, contáctanos directamente.
            </p>
            <p className="footer-circular">
              De conformidad con la Circular 004 de la Superintendencia
              de Industria y Comercio (SIC), la información completa de
              cada proyecto —incluyendo dirección exacta, estrato,
              fecha de entrega y reglamento de propiedad horizontal—
              está disponible para consulta directa con el asesor.
            </p>
            <p className="footer-copy">© {new Date().getFullYear()} RHF. Todos los derechos reservados.</p>
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
