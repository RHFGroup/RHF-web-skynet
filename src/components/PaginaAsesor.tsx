/**
 * /asesor — la página de Rafael y su equipo.
 *
 * Nace del pedido del 25-sep-2026: la sección de la home queda corta y
 * precisa, y un botón lleva aquí, «a una sección sobre la información a
 * detalle de él y su equipo». Aquí están la biografía, las credenciales, los
 * pilares, el equipo y el contacto.
 *
 * Las secciones alternan azul y blanco, como la home (secciones.css). El
 * color se asigna sobre las que de verdad salen: los pilares no se publican
 * mientras no estén confirmados, y la alternancia no se rompe.
 *
 * Reglas que siguen mandando (vault): copy en afirmativo; ninguna cifra sin
 * respaldo (ni años de experiencia, ni operaciones cerradas, ni
 * superlativos); cada credencial dice dónde y cuándo; el teléfono escrito a la
 * vista. Del equipo se publica solo lo que Rafael entregue: nombre, cargo y
 * foto. Mientras falte, en las vistas previas se avisa qué falta y en
 * producción el bloque muestra lo confirmado —Rafael y el estudio jurídico
 * propio—, sin marcadores ni relleno.
 *
 * ⛔ Lo que no entra, por decisión de Rafael: detalle de su compra (proyecto,
 * unidad o cifras) y la palabra «fiducia».
 */
import Link from "next/link";
import Animador from "@/components/Animador";
import CabeceraSitio from "@/components/CabeceraSitio";
import ContactForm from "@/components/ContactForm";
import PieSitio from "@/components/PieSitio";
import Reveal from "@/components/Reveal";
import RevealGrupo from "@/components/RevealGrupo";
import WhatsAppFlotante from "@/components/WhatsAppFlotante";
import { AvisoPropuesta, EtiquetaPropuesta } from "@/components/IconoProceso";
import { IconoEscudo, IconoFlecha, IconoWhatsApp } from "@/components/Iconos";
import { ICONO_PILAR } from "@/components/QuienTeAsesora";
import { EQUIPO, NOMBRE_COMPLETO, PILARES, PROPUESTA_VALOR } from "@/data/asesor";
import { CORREO, TELEFONO_VISIBLE, WHATSAPP, enlaceWhatsApp } from "@/data/contacto";
import { ESTUDIO_JURIDICO } from "@/data/proceso";
import { MODO_REVISION, seMuestra } from "@/lib/revision";
import "@/styles/asesor.css";
import "@/styles/secciones.css";

const WA_LINK = enlaceWhatsApp("Hola Rafael, vi tu perfil en la página y quiero hablar contigo sobre: ");

/** Azul y blanco, en orden, sobre las secciones que salen. */
const TONOS_AP = [
  "tono tono-oscuro tono-azul-1",
  "tono tono-claro tono-blanco-1",
  "tono tono-oscuro tono-azul-2",
  "tono tono-claro tono-blanco-2",
  "tono tono-oscuro tono-azul-3",
];

/** Cada credencial es verificable: el pie dice dónde y cuándo. */
export const CREDENCIALES = [
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

export default function PaginaAsesor() {
  const propuestas = PROPUESTA_VALOR.filter(seMuestra);
  const pilares = PILARES.filter(seMuestra);
  const equipo = EQUIPO.filter(seMuestra);
  const responsable = ESTUDIO_JURIDICO.responsable;
  const bloques = ["portada", "historia", ...(pilares.length > 0 ? ["pilares"] : []), "equipo", "contacto"];
  const tono = (id: string) => TONOS_AP[bloques.indexOf(id)];

  return (
    <>
      <CabeceraSitio blanca mensaje="Hola Rafael, vi tu perfil en la página y quiero hablar contigo." />

      <main className="ap">
        {/* ── Portada ─────────────────────────────────── */}
        <section className={`ap-portada ${tono("portada")}`} aria-labelledby="ap-nombre">
          <div className="section-shell ap-portada-grid">
            <Reveal className="ap-portada-texto" variant="up">
              <p className="section-kicker">Quién te asesora</p>
              <h1 id="ap-nombre">{NOMBRE_COMPLETO}</h1>
              <p className="asesor-rol">Asesor inmobiliario independiente · Cartagena de Indias</p>
              <p className="ap-frase">
                Represento proyectos de varias constructoras y los comparo frente a ti, con su fuente y su fecha de
                corte.
              </p>
              {propuestas.map((o) => (
                <p key={o.id} className="ap-propuesta">
                  {o.texto}
                  <EtiquetaPropuesta confirmado={o.confirmado} nota={`opción ${o.id.toUpperCase()}`} />
                </p>
              ))}
              <div className="ap-acciones">
                <a className="btn-whatsapp" href={WA_LINK} target="_blank" rel="noopener noreferrer">
                  <IconoWhatsApp /> Escríbeme por WhatsApp
                </a>
                <p className="asesor-directo">
                  Llámame al <a href={`tel:+${WHATSAPP}`}>{TELEFONO_VISIBLE}</a>
                  <span className="asesor-sep" aria-hidden="true">
                    ·
                  </span>
                  <a href={`mailto:${CORREO}`}>{CORREO}</a>
                </p>
              </div>
            </Reveal>
            <Reveal className="ap-portada-foto" variant="zoom" delay={120}>
              <picture>
                <source
                  type="image/webp"
                  srcSet="/rafael/perfil-520.webp 520w, /rafael/perfil-1040.webp 1040w"
                  sizes="(max-width: 860px) 80vw, 420px"
                />
                <img
                  src="/rafael/perfil-1040.jpg"
                  srcSet="/rafael/perfil-520.jpg 520w, /rafael/perfil-1040.jpg 1040w"
                  sizes="(max-width: 860px) 80vw, 420px"
                  width={1040}
                  height={1300}
                  alt={`${NOMBRE_COMPLETO}, asesor inmobiliario en Cartagena de Indias`}
                />
              </picture>
            </Reveal>
          </div>
        </section>

        {/* ── Mi historia ─────────────────────────────── */}
        <section className={`section ap-historia ${tono("historia")}`} aria-labelledby="ap-historia-titulo">
          <div className="section-shell ap-historia-grid">
            <Reveal className="ap-historia-foto" variant="zoom">
              <figure>
                <picture>
                  <source
                    type="image/webp"
                    srcSet="/rafael/retrato-520.webp 520w, /rafael/retrato-1040.webp 1040w"
                    sizes="(max-width: 860px) 80vw, 380px"
                  />
                  <img
                    src="/rafael/retrato-1040.jpg"
                    srcSet="/rafael/retrato-520.jpg 520w, /rafael/retrato-1040.jpg 1040w"
                    sizes="(max-width: 860px) 80vw, 380px"
                    width={1040}
                    height={1300}
                    loading="lazy"
                    decoding="async"
                    alt={`${NOMBRE_COMPLETO} en la sesión de estudio`}
                  />
                </picture>
                <figcaption>Fotografía de estudio · 2026</figcaption>
              </figure>
            </Reveal>
            <Reveal className="ap-historia-texto" variant="up" delay={120}>
              <p className="section-kicker">Mi historia</p>
              <h2 id="ap-historia-titulo">Leo el documento antes de creer el argumento</h2>
              <div className="asesor-cuerpo">
                <p>
                  Vivo en la Zona Norte de Cartagena y trabajo aquí todos los días. Represento varios proyectos a la
                  vez, de constructoras distintas, así que puedo compararlos frente a ti y decirte cuál encaja con lo
                  que buscas.
                </p>
                <p>
                  Vengo de la seguridad y de los negocios internacionales. Esa formación me dejó una costumbre que hoy
                  aplico a cada proyecto que te muestro: leer el documento antes de creer el argumento, y sostener cada
                  cifra con su fuente y su fecha de corte.
                </p>
                <p>
                  También compré aquí. Conozco esta decisión desde el lado del comprador — las cuentas, los plazos y
                  las preguntas que conviene hacer antes de separar.
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
            </Reveal>
          </div>
        </section>

        {/* ── Por qué asesorarte conmigo ──────────────── */}
        {pilares.length > 0 && (
          <section className={`section ap-pilares ${tono("pilares")}`} aria-labelledby="ap-pilares-titulo">
            <div className="section-shell">
              <p className="section-kicker">Cómo trabajo</p>
              <h2 id="ap-pilares-titulo">Por qué asesorarte conmigo</h2>
              <AvisoPropuesta pendiente={pilares.some((p) => !p.confirmado)} />
              <RevealGrupo className="ap-pilares-lista">
                {pilares.map((p, i) => (
                  <article key={p.titulo} className="ap-pilar" style={{ "--i": i } as React.CSSProperties}>
                    <span className="ap-pilar-icono">{ICONO_PILAR[p.icono]}</span>
                    <h3>{p.titulo}</h3>
                    <p>{p.texto}</p>
                  </article>
                ))}
              </RevealGrupo>
            </div>
          </section>
        )}

        {/* ── Mi equipo ───────────────────────────────── */}
        <section className={`section ap-equipo ${tono("equipo")}`} aria-labelledby="ap-equipo-titulo">
          <div className="section-shell">
            <p className="section-kicker">Mi equipo</p>
            <h2 id="ap-equipo-titulo">Quiénes te acompañan</h2>
            {MODO_REVISION && equipo.length === 0 && (
              <p className="propuesta propuesta-seccion">
                Pendiente — los integrantes del equipo: nombre, cargo y foto de cada uno
              </p>
            )}
            <RevealGrupo className="ap-equipo-lista">
              <article className="ap-persona" style={{ "--i": 0 } as React.CSSProperties}>
                <img
                  src="/rafael/camisa-blanca-520.jpg"
                  alt={NOMBRE_COMPLETO}
                  width={520}
                  height={650}
                  loading="lazy"
                  decoding="async"
                />
                <div>
                  <h3>{NOMBRE_COMPLETO}</h3>
                  <p className="ap-persona-rol">Asesor inmobiliario · RHF Living</p>
                  <p>Te atiende directamente, de la primera conversación a la visita de los proyectos.</p>
                </div>
              </article>

              <article className="ap-persona ap-persona-estudio" style={{ "--i": 1 } as React.CSSProperties}>
                <span className="ap-persona-icono" aria-hidden="true">
                  <IconoEscudo size={40} />
                </span>
                <div>
                  <h3>{responsable ? responsable.nombre : "Estudio jurídico propio"}</h3>
                  <p className="ap-persona-rol">
                    {responsable
                      ? `Responsable del estudio jurídico · tarjeta profesional ${responsable.tarjetaProfesional}`
                      : "Respaldo jurídico de RHF Living"}
                  </p>
                  <p>{ESTUDIO_JURIDICO.base}</p>
                  <Link className="ap-enlace" href="/#respaldo-juridico">
                    Qué revisa el estudio jurídico <IconoFlecha size={16} />
                  </Link>
                </div>
              </article>

              {equipo.map((m, i) => (
                <article key={m.nombre} className="ap-persona" style={{ "--i": i + 2 } as React.CSSProperties}>
                  {m.foto && <img src={m.foto} alt={m.nombre} width={520} height={650} loading="lazy" />}
                  <div>
                    <h3>{m.nombre}</h3>
                    <p className="ap-persona-rol">{m.rol}</p>
                    {m.texto && <p>{m.texto}</p>}
                    <EtiquetaPropuesta confirmado={m.confirmado} />
                  </div>
                </article>
              ))}
            </RevealGrupo>
          </div>
        </section>

        {/* ── Contacto ────────────────────────────────── */}
        <section className={`section section-contacto ${tono("contacto")}`} id="contacto">
          <div className="section-shell contacto-shell">
            <div className="contacto-texto">
              <p className="section-kicker">Contacto</p>
              <h2>Hablemos de lo que buscas</h2>
              <p className="section-lede">Cuéntame qué buscas y te muestro los proyectos que encajan contigo.</p>
              <div className="contacto-canales">
                <a className="btn-whatsapp" href={WA_LINK} target="_blank" rel="noopener noreferrer">
                  <IconoWhatsApp /> Escríbeme por WhatsApp
                </a>
              </div>
            </div>
            <div className="contacto-form-caja">
              <ContactForm />
            </div>
          </div>
        </section>
      </main>

      <PieSitio avisoImagenes="Las fotografías de esta página son de una sesión de estudio de 2026." />

      <WhatsAppFlotante trasDe=".ap-portada" />
      <Animador />
    </>
  );
}
