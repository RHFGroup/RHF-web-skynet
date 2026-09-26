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
import { NOMBRE_COMPLETO, PILARES, type Pilar } from "@/data/asesor";
import { TELEFONO_VISIBLE, WHATSAPP, enlaceWhatsApp } from "@/data/contacto";
import { seMuestra } from "@/lib/revision";
import "@/styles/asesor.css";

export const ICONO_PILAR: Record<Pilar["icono"], React.ReactNode> = {
  comparar: <IconoCapas size={22} />,
  escudo: <IconoEscudo size={22} />,
  llave: <IconoLlave size={22} />,
};

const WA_LINK = enlaceWhatsApp("Hola Rafael, vi tu página y quiero hablar contigo sobre: ");

export default function QuienTeAsesora() {
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
                alt={`${NOMBRE_COMPLETO}, asesor inmobiliario en Cartagena de Indias`}
              />
            </picture>
          </figure>
        </Reveal>

        {/* ── El texto ───────────────────────────── */}
        <Reveal className="asesor-corto-texto" variant="up" delay={120}>
          <p className="section-kicker">Quién te asesora</p>
          <h2 id="asesor-titulo">{NOMBRE_COMPLETO}</h2>
          <p className="asesor-rol">Asesor inmobiliario independiente · Cartagena de Indias</p>
          <p className="asesor-corto-frase">
            Vivo en la Zona Norte y represento proyectos de varias constructoras: te los comparo con su fuente y su
            fecha de corte.
          </p>

          {pilares.length > 0 && (
            <div className="asesor-pilares-corto">
              <h3>Por qué asesorarte conmigo</h3>
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
              <AvisoPropuesta pendiente={pilares.some((p) => !p.confirmado)} />
            </div>
          )}

          <div className="asesor-corto-acciones">
            <Link className="btn-primary asesor-btn-detalle" href="/asesor">
              Conoce a Rafael y su equipo <IconoFlecha size={18} />
            </Link>
            <a className="btn-whatsapp" href={WA_LINK} target="_blank" rel="noopener noreferrer">
              <IconoWhatsApp size={18} /> Escríbeme
            </a>
          </div>
          <p className="asesor-directo">
            O llámame al <a href={`tel:+${WHATSAPP}`}>{TELEFONO_VISIBLE}</a>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
