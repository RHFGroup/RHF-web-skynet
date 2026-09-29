/**
 * Bloque «Quién te asesora» de la home — versión corta.
 *
 * El 25-sep-2026 Rafael pidió que esta sección fuera «simple, corta y
 * precisa», con su nombre completo —Medardo Rafael Hernández Franco— y un
 * botón hacia una página con el detalle de él y de su equipo. Esa página es
 * /asesor (src/app/asesor/page.tsx): allí viven la biografía, las
 * credenciales, el equipo y los datos estructurados de la persona.
 *
 * Aquí queda lo esencial: la foto, el nombre, el oficio, una frase, los tres
 * pilares en su versión básica y dos botones. «Te asesoro si…» salió entero,
 * por su pedido. La foto es la de camisa blanca de la sesión de estudio: la
 * de camiseta negra no le gustó («quiero que se vea más serio», 25-sep-2026).
 *
 * Reglas del vault que siguen mandando: copy en afirmativo, ninguna cifra sin
 * respaldo, y el teléfono escrito a la vista, fuera de un botón.
 */
import Link from "next/link";
import Reveal from "@/components/Reveal";
import RevealGrupo from "@/components/RevealGrupo";
import { AvisoPropuesta } from "@/components/IconoProceso";
import { IconoCapas, IconoEscudo, IconoFlecha, IconoLlave, IconoWhatsApp } from "@/components/Iconos";
import type { Pilar } from "@/data/asesor";
import { TELEFONO_VISIBLE, WHATSAPP, enlaceWhatsApp } from "@/data/contacto";
import { ruta, type Idioma } from "@/i18n/idioma";
import { asesor } from "@/i18n/datos";
import { seMuestra } from "@/lib/revision";
import "@/styles/asesor.css";

export const ICONO_PILAR: Record<Pilar["icono"], React.ReactNode> = {
  comparar: <IconoCapas size={22} />,
  escudo: <IconoEscudo size={22} />,
  llave: <IconoLlave size={22} />,
};

/**
 * Los textos, en los dos idiomas (docs/i18n.md). Cada uno es un nodo de texto
 * tal como queda en el HTML, con sus espacios de borde: así el español sale
 * idéntico.
 */
const TEXTOS = {
  es: {
    whatsapp: "Hola Rafael, vi tu página y quiero hablar contigo sobre: ",
    alt: (nombre: string) => `${nombre}, asesor inmobiliario en Cartagena de Indias`,
    kicker: "Quién te asesora",
    rol: "Asesor inmobiliario independiente · Cartagena de Indias",
    frase:
      "Vivo en la Zona Norte y represento proyectos de varias constructoras: te los comparo con su fuente y su fecha de corte.",
    porQue: "Por qué asesorarte conmigo",
    detalle: "Conoce a Rafael y su equipo ",
    escribeme: " Escríbeme",
    llamame: "O llámame al ",
  },
  en: {
    whatsapp: "Hi Rafael, I saw your website and I'd like to talk to you about: ",
    alt: (nombre: string) => `${nombre}, real estate advisor in Cartagena de Indias`,
    kicker: "Your advisor",
    rol: "Independent real estate advisor · Cartagena de Indias",
    frase:
      "I live in the Zona Norte and represent projects from several builders: I compare them for you, each with its source and its as-of date.",
    porQue: "Why work with me",
    detalle: "Meet Rafael and his team ",
    escribeme: " Message me",
    llamame: "Or call me at ",
  },
} satisfies Record<Idioma, Record<string, string | ((nombre: string) => string)>>;

export default function QuienTeAsesora({ idioma = "es" }: { idioma?: Idioma }) {
  const t = TEXTOS[idioma];
  const { NOMBRE_COMPLETO, PILARES } = asesor(idioma);
  const pilares = PILARES.filter(seMuestra);
  return (
    <section className="section section-asesor asesor-corto" id="asesor" aria-labelledby="asesor-titulo">
      <div className="section-shell asesor-corto-grid">
        {/* ── La foto de perfil ─────────────────────── */}
        <Reveal className="asesor-foto" variant="zoom">
          <figure>
            <picture>
              <source
                type="image/webp"
                srcSet="/rafael/camisa-blanca-520.webp 520w, /rafael/camisa-blanca-1040.webp 1040w"
                sizes="(max-width: 860px) 78vw, 380px"
              />
              <img
                src="/rafael/camisa-blanca-1040.jpg"
                srcSet="/rafael/camisa-blanca-520.jpg 520w, /rafael/camisa-blanca-1040.jpg 1040w"
                sizes="(max-width: 860px) 78vw, 380px"
                width={1040}
                height={1300}
                loading="lazy"
                decoding="async"
                alt={t.alt(NOMBRE_COMPLETO)}
              />
            </picture>
          </figure>
        </Reveal>

        {/* ── El texto ───────────────────────────── */}
        <Reveal className="asesor-corto-texto" variant="up" delay={120}>
          <p className="section-kicker">{t.kicker}</p>
          <h2 id="asesor-titulo">{NOMBRE_COMPLETO}</h2>
          <p className="asesor-rol">{t.rol}</p>
          <p className="asesor-corto-frase">{t.frase}</p>

          {pilares.length > 0 && (
            <div className="asesor-pilares-corto">
              <h3>{t.porQue}</h3>
              <RevealGrupo className="asesor-pilares-corto-lista">
                {pilares.map((p, i) => (
                  <div key={p.titulo} className="asesor-pilar-corto" style={{ "--i": i } as React.CSSProperties}>
                    <span className="asesor-pilar-corto-icono">{ICONO_PILAR[p.icono]}</span>
                    <p>
                      <strong>{p.titulo}</strong>
                      <span>{p.texto}</span>
                    </p>
                  </div>
                ))}
              </RevealGrupo>
              <AvisoPropuesta pendiente={pilares.some((p) => !p.confirmado)} idioma={idioma} />
            </div>
          )}

          <div className="asesor-corto-acciones">
            <Link className="btn-primary asesor-btn-detalle" href={ruta(idioma, "/asesor")}>
              {t.detalle}
              <IconoFlecha size={18} />
            </Link>
            <a className="btn-whatsapp" href={enlaceWhatsApp(t.whatsapp)} target="_blank" rel="noopener noreferrer">
              <IconoWhatsApp size={18} />
              {t.escribeme}
            </a>
          </div>
          <p className="asesor-directo">
            {t.llamame}
            <a href={`tel:+${WHATSAPP}`}>{TELEFONO_VISIBLE}</a>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
