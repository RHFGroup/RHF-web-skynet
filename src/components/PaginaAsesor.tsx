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
 *
 * En dos idiomas (29-sep-2026): en inglés es /en/advisor. Los nombres de las
 * universidades y de los títulos oficiales colombianos se dejan en español,
 * con la traducción entre paréntesis.
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
import { CORREO, TELEFONO_VISIBLE, WHATSAPP, enlaceWhatsApp } from "@/data/contacto";
import { asesor, proceso } from "@/i18n/datos";
import { ruta, type Idioma } from "@/i18n/idioma";
import { seMuestra } from "@/lib/revision";
import "@/styles/asesor.css";
import "@/styles/secciones.css";

/**
 * Los textos de la página. Los espacios al borde son parte del texto: lo
 * separan del ícono o del enlace que va al lado, y así el HTML en español
 * sale idéntico al de antes.
 */
const TEXTOS = {
  es: {
    // WhatsApp, con el mensaje ya escrito
    whatsapp: "Hola Rafael, vi tu perfil en la página y quiero hablar contigo sobre: ",
    cabecera: "Hola Rafael, vi tu perfil en la página y quiero hablar contigo.",
    // Portada
    kicker: "Quién te asesora",
    rol: "Asesor inmobiliario independiente · Cartagena de Indias",
    frase: "Represento proyectos de varias constructoras y los comparo frente a ti, con su fuente y su fecha de corte.",
    opcion: (id: string) => `opción ${id}`,
    escribeme: " Escríbeme por WhatsApp",
    llamame: "Llámame al ",
    altPortada: (nombre: string) => `${nombre}, asesor inmobiliario en Cartagena de Indias`,
    // Mi historia
    altHistoria: (nombre: string) => `${nombre} en la sesión de estudio`,
    pieFoto: "Fotografía de estudio · 2026",
    kickerHistoria: "Mi historia",
    tituloHistoria: "Leo el documento antes de creer el argumento",
    historia1:
      "Vivo en la Zona Norte de Cartagena y trabajo aquí todos los días. Represento varios proyectos a la vez, de constructoras distintas, así que puedo compararlos frente a ti y decirte cuál encaja con lo que buscas.",
    historia2:
      "Vengo de la seguridad y de los negocios internacionales. Esa formación me dejó una costumbre que hoy aplico a cada proyecto que te muestro: leer el documento antes de creer el argumento, y sostener cada cifra con su fuente y su fecha de corte.",
    historia3:
      "También compré aquí. Conozco esta decisión desde el lado del comprador — las cuentas, los plazos y las preguntas que conviene hacer antes de separar.",
    // Pilares
    kickerPilares: "Cómo trabajo",
    tituloPilares: "Por qué asesorarte conmigo",
    // Equipo
    kickerEquipo: "Mi equipo",
    tituloEquipo: "Quiénes te acompañan",
    rolRafael: "Asesor inmobiliario · RHF Living",
    textoRafael: "Te atiende directamente, de la primera conversación a la visita de los proyectos.",
    estudio: "Estudio jurídico propio",
    responsable: (tarjeta: string) => `Responsable del estudio jurídico · tarjeta profesional ${tarjeta}`,
    respaldo: "Respaldo jurídico de RHF Living",
    queRevisa: "Qué revisa el estudio jurídico ",
    // Contacto
    kickerContacto: "Contacto",
    tituloContacto: "Hablemos de lo que buscas",
    ledeContacto: "Cuéntame qué buscas y te muestro los proyectos que encajan contigo.",
    pieImagenes: "Las fotografías de esta página son de una sesión de estudio de 2026.",
  },
  en: {
    // WhatsApp, con el mensaje ya escrito
    whatsapp: "Hi Rafael, I saw your profile on the website and I'd like to talk with you about: ",
    cabecera: "Hi Rafael, I saw your profile on the website and I'd like to talk with you.",
    // Portada
    kicker: "Your advisor",
    rol: "Independent real estate advisor · Cartagena de Indias",
    frase: "I represent projects from several builders and compare them with you, each with its source and cut-off date.",
    opcion: (id: string) => `option ${id}`,
    escribeme: " Message me on WhatsApp",
    llamame: "Call me at ",
    altPortada: (nombre: string) => `${nombre}, real estate advisor in Cartagena de Indias`,
    // Mi historia
    altHistoria: (nombre: string) => `${nombre} at the studio photo session`,
    pieFoto: "Studio photograph · 2026",
    kickerHistoria: "My story",
    tituloHistoria: "I read the document before I believe the pitch",
    historia1:
      "I live in Zona Norte, Cartagena's northern corridor, and I work here every day. I represent several projects at once, from different builders, so I can compare them with you and tell you which one fits what you're looking for.",
    historia2:
      "My background is in security and international business. That training left me with a habit I apply to every project I show you: read the document before believing the pitch, and back every figure with its source and cut-off date.",
    historia3:
      "I also bought here. I know this decision from the buyer's side—the numbers, the timelines and the questions worth asking before you reserve.",
    // Pilares
    kickerPilares: "How I work",
    tituloPilares: "Why work with me",
    // Equipo
    kickerEquipo: "My team",
    tituloEquipo: "Who works with you",
    rolRafael: "Real estate advisor · RHF Living",
    textoRafael: "Works with you directly, from the first conversation to the project visits.",
    estudio: "Our own legal team",
    responsable: (tarjeta: string) => `Head of the legal team · professional license no. ${tarjeta}`,
    respaldo: "RHF Living's legal support",
    queRevisa: "What the legal team reviews ",
    // Contacto
    kickerContacto: "Contact",
    tituloContacto: "Let's talk about what you're looking for",
    ledeContacto: "Tell me what you're looking for and I'll show you the projects that fit.",
    pieImagenes: "The photographs on this page are from a 2026 studio session.",
  },
} satisfies Record<Idioma, Record<string, string | ((...datos: never[]) => string)>>;

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

/**
 * Las mismas credenciales en inglés. El título oficial colombiano y la
 * universidad van tal cual, en español; entre paréntesis, qué es el título.
 */
const CREDENCIALES_EN: typeof CREDENCIALES = [
  {
    titulo: "Especialista en Administración de la Seguridad (postgraduate specialization in Security Administration)",
    pie: "Universidad Militar Nueva Granada · 2018",
  },
  {
    titulo: "Profesional en Marketing y Negocios Internacionales (undergraduate degree in Marketing and International Business)",
    pie: "Universidad Sergio Arboleda · 2017",
  },
  {
    titulo: "Owner and investor in Zona Norte",
    pie: "I buy in the same area where I advise",
  },
];

/**
 * Las credenciales en el idioma de la página (la página y sus datos
 * estructurados). En español, la lista de siempre.
 */
export function credenciales(idioma: Idioma): typeof CREDENCIALES {
  return idioma === "en" ? CREDENCIALES_EN : CREDENCIALES;
}

/** `idioma`: el de la página; en español, la página sale igual que siempre. */
export default function PaginaAsesor({ idioma = "es" }: { idioma?: Idioma }) {
  const t = TEXTOS[idioma];
  const { EQUIPO, NOMBRE_COMPLETO, PILARES, PROPUESTA_VALOR } = asesor(idioma);
  const { ESTUDIO_JURIDICO } = proceso(idioma);
  const waLink = enlaceWhatsApp(t.whatsapp);
  const propuestas = PROPUESTA_VALOR.filter(seMuestra);
  const pilares = PILARES.filter(seMuestra);
  const equipo = EQUIPO.filter(seMuestra);
  const responsable = ESTUDIO_JURIDICO.responsable;
  const bloques = ["portada", "historia", ...(pilares.length > 0 ? ["pilares"] : []), "equipo", "contacto"];
  const tono = (id: string) => TONOS_AP[bloques.indexOf(id)];

  return (
    <>
      <CabeceraSitio blanca mensaje={t.cabecera} idioma={idioma} rutaEs="/asesor" />

      <main className="ap">
        {/* ── Portada ─────────────────────────────────── */}
        <section className={`ap-portada ${tono("portada")}`} aria-labelledby="ap-nombre">
          <div className="section-shell ap-portada-grid">
            <Reveal className="ap-portada-texto" variant="up">
              <p className="section-kicker">{t.kicker}</p>
              <h1 id="ap-nombre">{NOMBRE_COMPLETO}</h1>
              <p className="asesor-rol">{t.rol}</p>
              <p className="ap-frase">{t.frase}</p>
              {propuestas.map((o) => (
                <p key={o.id} className="ap-propuesta">
                  {o.texto}
                  <EtiquetaPropuesta confirmado={o.confirmado} nota={t.opcion(o.id.toUpperCase())} idioma={idioma} />
                </p>
              ))}
              <div className="ap-acciones">
                <a className="btn-whatsapp" href={waLink} target="_blank" rel="noopener noreferrer">
                  <IconoWhatsApp />
                  {t.escribeme}
                </a>
                <p className="asesor-directo">
                  {t.llamame}
                  <a href={`tel:+${WHATSAPP}`}>{TELEFONO_VISIBLE}</a>
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
                  srcSet="/rafael/camisa-blanca-520.webp 520w, /rafael/camisa-blanca-1040.webp 1040w"
                  sizes="(max-width: 860px) 80vw, 420px"
                />
                <img
                  src="/rafael/camisa-blanca-1040.jpg"
                  srcSet="/rafael/camisa-blanca-520.jpg 520w, /rafael/camisa-blanca-1040.jpg 1040w"
                  sizes="(max-width: 860px) 80vw, 420px"
                  width={1040}
                  height={1300}
                  alt={t.altPortada(NOMBRE_COMPLETO)}
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
                    alt={t.altHistoria(NOMBRE_COMPLETO)}
                  />
                </picture>
                <figcaption>{t.pieFoto}</figcaption>
              </figure>
            </Reveal>
            <Reveal className="ap-historia-texto" variant="up" delay={120}>
              <p className="section-kicker">{t.kickerHistoria}</p>
              <h2 id="ap-historia-titulo">{t.tituloHistoria}</h2>
              <div className="asesor-cuerpo">
                <p>{t.historia1}</p>
                <p>{t.historia2}</p>
                <p>{t.historia3}</p>
              </div>
              <ul className="asesor-credenciales">
                {credenciales(idioma).map((c) => (
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
              <p className="section-kicker">{t.kickerPilares}</p>
              <h2 id="ap-pilares-titulo">{t.tituloPilares}</h2>
              <AvisoPropuesta pendiente={pilares.some((p) => !p.confirmado)} idioma={idioma} />
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
            <p className="section-kicker">{t.kickerEquipo}</p>
            <h2 id="ap-equipo-titulo">{t.tituloEquipo}</h2>
            <RevealGrupo className="ap-equipo-lista">
              <article className="ap-persona" style={{ "--i": 0 } as React.CSSProperties}>
                <img
                  src="/rafael/retrato-520.jpg"
                  alt={NOMBRE_COMPLETO}
                  width={520}
                  height={650}
                  loading="lazy"
                  decoding="async"
                />
                <div>
                  <h3>{NOMBRE_COMPLETO}</h3>
                  <p className="ap-persona-rol">{t.rolRafael}</p>
                  <p>{t.textoRafael}</p>
                </div>
              </article>

              <article className="ap-persona ap-persona-estudio" style={{ "--i": 1 } as React.CSSProperties}>
                <span className="ap-persona-icono" aria-hidden="true">
                  <IconoEscudo size={40} />
                </span>
                <div>
                  <h3>{responsable ? responsable.nombre : t.estudio}</h3>
                  <p className="ap-persona-rol">
                    {responsable ? t.responsable(responsable.tarjetaProfesional) : t.respaldo}
                  </p>
                  <p>{ESTUDIO_JURIDICO.base}</p>
                  <Link className="ap-enlace" href={ruta(idioma, "/#respaldo-juridico")}>
                    {t.queRevisa}
                    <IconoFlecha size={16} />
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
                    <EtiquetaPropuesta confirmado={m.confirmado} idioma={idioma} />
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
              <p className="section-kicker">{t.kickerContacto}</p>
              <h2>{t.tituloContacto}</h2>
              <p className="section-lede">{t.ledeContacto}</p>
              <div className="contacto-canales">
                <a className="btn-whatsapp" href={waLink} target="_blank" rel="noopener noreferrer">
                  <IconoWhatsApp />
                  {t.escribeme}
                </a>
              </div>
            </div>
            <div className="contacto-form-caja">
              <ContactForm idioma={idioma} />
            </div>
          </div>
        </section>
      </main>

      <PieSitio avisoImagenes={t.pieImagenes} idioma={idioma} />

      <WhatsAppFlotante trasDe=".ap-portada" idioma={idioma} />
      <Animador />
    </>
  );
}
