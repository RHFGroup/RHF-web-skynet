/**
 * Bloque «Quién te asesora» — el 6 del plan de la home
 * (`plans/que-debe-tener-nuestra-pagina-principal` en el vault).
 *
 * Existe porque hasta hoy Rafael no aparecía en ninguna página del sitio, y
 * en una marca personal premium ese es el hueco más caro: el 88 % de los
 * compradores cierra a través de un agente. La página vendía cartera y
 * territorio, y callaba quién firma.
 *
 * Tres reglas del vault gobiernan este archivo:
 *
 *  1. **Copy en afirmativo** (`rhf-copy-afirmativo`): se nombra lo que sí
 *     existe. Ninguna línea de aquí usa «no», «nunca», «nadie», «sin» ni
 *     «tampoco» — con una excepción marcada, la frase de marca.
 *  2. **Ninguna cifra sin respaldo** (`feedback-cifras-en-piezas-publicas`).
 *     Por eso la biografía habla de formación y de oficio, y evita años de
 *     experiencia, número de operaciones cerradas y cualquier superlativo:
 *     en Colombia la publicidad obliga al anunciante (Ley 1480/2011, arts.
 *     29-30) y quien firma es la marca personal de Rafael.
 *  3. **El teléfono va escrito, visible, fuera de un botón.** NN/g midió que
 *     esconderlo se lee como evasión. El formulario es alternativa al
 *     teléfono, jamás su reemplazo.
 *
 * ⛔ Lo que NO entra acá, por decisión del propio Rafael: detalle de su
 * compra (proyecto, unidad o cifras), fiducia, y cualquier comparación entre
 * tipologías o proyectos.
 */
import Reveal from "@/components/Reveal";
import { CORREO, TELEFONO_VISIBLE, WHATSAPP, enlaceWhatsApp } from "@/data/contacto";

const WA_LINK = enlaceWhatsApp("Hola Rafael, vi tu página y quiero hablar contigo sobre: ");

/**
 * Cada credencial es verificable. El pie dice dónde y cuándo, que es lo que
 * la vuelve comprobable en vez de decorativa.
 */
const CREDENCIALES = [
  {
    titulo: "Especialista en Administración de la Seguridad",
    pie: "Universidad Militar Nueva Granada · 2018",
  },
  {
    titulo: "Profesional en Marketing y Negocios Internacionales",
    pie: "Universidad Sergio Arboleda · 2017",
  },
  {
    titulo: "Propietario e inversionista en la Zona Norte",
    pie: "Compro en la zona donde asesoro",
  },
];

/** Person + ProfilePage: el plan lo pide para que te encuentren por tu nombre. */
const personaJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Rafael Hernández Franco",
  alternateName: "Medardo Rafael Hernández Franco",
  jobTitle: "Asesor inmobiliario",
  description:
    "Asesor inmobiliario independiente en Cartagena de Indias. Acompaña la compra de vivienda nueva en Cartagena y el área de Bolívar.",
  url: "https://rhfliving.com/#asesor",
  image: "https://rhfliving.com/rafael/retrato-1040.jpg",
  telephone: `+${WHATSAPP}`,
  email: CORREO,
  worksFor: { "@type": "RealEstateAgent", name: "RHF — Rafael Hernández Franco", url: "https://rhfliving.com" },
  homeLocation: { "@type": "Place", name: "Cartagena de Indias, Bolívar, Colombia" },
  alumniOf: [
    { "@type": "CollegeOrUniversity", name: "Universidad Militar Nueva Granada" },
    { "@type": "CollegeOrUniversity", name: "Universidad Sergio Arboleda" },
  ],
};

export default function QuienTeAsesora() {
  return (
    <section className="section section-asesor" id="asesor">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personaJsonLd) }}
      />

      <div className="section-shell asesor-grid">
        {/* ── El retrato ─────────────────────────── */}
        <Reveal className="asesor-retrato" variant="zoom">
          <figure>
            <picture>
              <source
                type="image/avif"
                srcSet="/rafael/retrato-520.avif 520w, /rafael/retrato-1040.avif 1040w"
                sizes="(max-width: 900px) 84vw, 440px"
              />
              <source
                type="image/webp"
                srcSet="/rafael/retrato-520.webp 520w, /rafael/retrato-1040.webp 1040w"
                sizes="(max-width: 900px) 84vw, 440px"
              />
              <img
                src="/rafael/retrato-1040.jpg"
                srcSet="/rafael/retrato-520.jpg 520w, /rafael/retrato-1040.jpg 1040w"
                sizes="(max-width: 900px) 84vw, 440px"
                width={1040}
                height={1300}
                loading="lazy"
                decoding="async"
                alt="Rafael Hernández Franco, asesor inmobiliario en Cartagena de Indias"
              />
            </picture>
            <figcaption>Fotografía de estudio · 2026</figcaption>
          </figure>
        </Reveal>

        {/* ── El texto ───────────────────────────── */}
        <Reveal className="asesor-texto" variant="up" delay={120}>
          <p className="section-kicker">Quién te asesora</p>
          <h2>Rafael Hernández Franco</h2>
          <p className="asesor-rol">
            Asesor inmobiliario independiente · Cartagena de Indias
          </p>

          <div className="asesor-cuerpo">
            <p>
              Vivo en la Zona Norte de Cartagena y trabajo aquí todos los días.
              Represento varios proyectos a la vez, de constructoras distintas,
              así que puedo compararlos frente a ti y decirte cuál encaja con
              lo que buscas.
            </p>
            <p>
              Vengo de la seguridad y de los negocios internacionales. Esa
              formación me dejó una costumbre que hoy aplico a cada proyecto
              que te muestro: leer el documento antes de creer el argumento, y
              sostener cada cifra con su fuente y su fecha de corte.
            </p>
            <p>
              También compré aquí. Conozco esta decisión desde el lado del
              comprador — las cuentas, los plazos y las preguntas que conviene
              hacer antes de separar.
            </p>
          </div>

          <ul className="asesor-credenciales">
            {CREDENCIALES.map((c) => (
              <li key={c.titulo}>
                <strong>{c.titulo}</strong>
                <span>{c.pie}</span>
              </li>
            ))}
          </ul>

          {/* El teléfono escrito, visible, fuera del botón. */}
          <div className="asesor-contacto">
            <a
              className="btn-whatsapp"
              href={WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
            >
              <IconoWhatsApp /> Escríbeme por WhatsApp
            </a>
            <p className="asesor-directo">
              Llámame al{" "}
              <a href={`tel:+${WHATSAPP}`}>{TELEFONO_VISIBLE}</a>
              <span className="asesor-sep" aria-hidden="true">·</span>
              <a href={`mailto:${CORREO}`}>{CORREO}</a>
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function IconoWhatsApp() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.742.324 1.322.52 1.774.645.745.237 1.422.203 1.957.123.595-.089 1.832-.748 2.09-1.471.258-.723.258-1.342.183-1.472-.074-.131-.272-.213-.57-.362m-5.436 6.868h-.004a9.68 9.68 0 01-4.93-1.88l-.354-.21-3.665.96.978-3.57-.232-.37a9.68 9.68 0 01-1.483-5.128c0-5.35 4.352-9.703 9.703-9.703a9.63 9.63 0 016.86 2.843 9.63 9.63 0 012.843 6.86c0 5.35-4.352 9.703-9.703 9.703h-.005z"/>
    </svg>
  );
}
