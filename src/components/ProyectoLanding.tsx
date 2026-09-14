import Link from "next/link";
import MeInteresaButton from "@/components/MeInteresaButton";
import BloqueLegal from "@/components/BloqueLegal";
import { getProyecto, puedePublicarPrecio, rangoPrecio } from "@/data/proyectos";

/**
 * Landing de un proyecto de la cartera.
 *
 * Cadena de fuente de verdad: Excel de la constructora con fecha de corte →
 * nota del proyecto en el vault (`projects/<proyecto>/`) → este componente.
 * Nada de lo que se muestra acá se escribe sin pasar por la nota.
 *
 * El precio se publica cuando el proyecto tiene los TRES datos del numeral
 * 2.16.1 de la Circular 004 (área, precio de referencia y ubicación exacta) y
 * SIEMPRE acompañado del bloque legal, que declara la fecha de corte y el
 * estado real del área. El candado es `puedePublicarPrecio`; la cifra sale de
 * `src/data/proyectos.ts`, nunca escrita a mano acá.
 *
 * ⛔ El copy de Zona Norte sale de `projects/inmobiliaria/copy-de-la-seccion-
 * zona-norte-que-publicamos-y-que-no`, ya contrastado contra la research. Sin
 * superlativos, sin cifras de valorización, sin el aeropuerto como hecho.
 */

export type Dato = { label: string; valor: string };
export type Imagen = { src: string; alt: string };

export type ProyectoData = {
  nombre: string;
  zona: string;
  heroTitulo: string;
  heroSub: string;
  heroImg: string;
  intro: string;
  tipologias: { titulo: string; detalle: string }[];
  amenidades: string[];
  datos: Dato[];
  fuente: string;
  ubicacion: string;
  ubicacionNota: string;
  galeria: Imagen[];
  /** Slug en `src/data/proyectos.ts`. De ahí salen el precio y el bloque legal. */
  slug?: string;
};

const ZONA_NORTE = [
  {
    titulo: "Aquí está la oferta",
    texto:
      "Cerca del 70 % de la vivienda nueva que se comercializa en Bolívar está en la Zona Norte. Donde se concentra la oferta se concentra la competencia entre constructores, y eso se nota en las condiciones de compra.",
    fuente: "Camacol Bolívar",
  },
  {
    titulo: "La vía ya está hecha",
    texto:
      "El Viaducto del Gran Manglar opera desde 2018 y el corredor completo hacia Barranquilla desde 2021. La doble calzada de Tierra Baja está al 95 %.",
    fuente: "ANI · prensa nacional",
  },
  {
    titulo: "El entorno ya funciona",
    texto:
      "El hospital Santa Fe y el campus de Uniandes funcionan aquí desde 2018, a 12 km del Centro Histórico. Kristal Malls está en obra desde marzo de 2026, con apertura prevista para 2027.",
    fuente: "Prensa local",
  },
];

export default function ProyectoLanding({ p }: { p: ProyectoData }) {
  const datos = p.slug ? getProyecto(p.slug) : undefined;

  return (
    <>
      <header className="nav">
        <div className="nav-inner">
          <Link className="brand" href="/">RHF</Link>
          <nav className="nav-links">
            <Link href="/#cartera">Nuestra cartera</Link>
            <Link href="/#zonanorte">Zona Norte</Link>
            <Link href="/#contacto">Contacto</Link>
          </nav>
          <MeInteresaButton label="Hablemos" className="nav-cta" />
        </div>
      </header>

      <main>
        {/* ── Hero ───────────────────────────── */}
        <section className="proyecto-hero">
          <img className="proyecto-hero-bg" src={p.heroImg} alt={`${p.nombre} — render del proyecto`} />
          <div className="proyecto-hero-inner">
            <p className="breadcrumb">
              <Link href="/#cartera">Nuestra cartera</Link>
              <span aria-hidden="true"> · </span>
              {p.nombre}
            </p>
            <p className="eyebrow">{p.zona} · Cartagena</p>
            <h1>{p.heroTitulo}</h1>
            <p className="hero-sub">{p.heroSub}</p>
            <div className="hero-ctas">
              <MeInteresaButton label="Me interesa este proyecto" className="btn-primary" />
              <a className="btn-ghost" href="#ficha">Ver los datos</a>
            </div>
          </div>
        </section>

        {/* ── Ficha ──────────────────────────── */}
        <section className="section" id="ficha">
          <div className="section-shell">
            <p className="section-kicker">El proyecto</p>
            <h2>{p.nombre}</h2>
            <p className="section-lede">{p.intro}</p>

            <div className="ficha-grid">
              {p.datos.map((d) => (
                <div className="ficha-item" key={d.label}>
                  <p className="ficha-label">{d.label}</p>
                  <p className="ficha-valor">{d.valor}</p>
                </div>
              ))}
            </div>

            <p className="aviso-fuente">{p.fuente}</p>
            {datos && datos.precio && puedePublicarPrecio(datos) && (
              <p className="proyecto-precio">
                <strong>{rangoPrecio(datos.precio.desde, datos.precio.hasta)}</strong>{" "}
                <span>
                  precio de referencia · {datos.precio.unidadesDisponibles} unidades
                  disponibles · corte {datos.precio.corte}
                </span>
              </p>
            )}
          </div>
        </section>

        {/* ── Tipologías y amenidades ────────── */}
        <section className="section section-alterna">
          <div className="section-shell">
            <div className="doble-grid">
              <div>
                <p className="section-kicker">Tipologías</p>
                <h2>Qué se ofrece</h2>
                <ul className="lista-tipologias">
                  {p.tipologias.map((t) => (
                    <li key={t.titulo}>
                      <strong>{t.titulo}</strong>
                      <span>{t.detalle}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="section-kicker">Zonas comunes</p>
                <h2>Amenidades</h2>
                <ul className="lista-amenidades">
                  {p.amenidades.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
                <p className="aviso-fuente">
                  Amenidades según el brochure oficial del constructor.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Galería ────────────────────────── */}
        {p.galeria.length > 0 && (
          <section className="section">
            <div className="section-shell">
              <p className="section-kicker">Galería</p>
              <h2>Así se ve el proyecto</h2>
              <div className="galeria-grid">
                {p.galeria.map((g) => (
                  <figure key={g.src}>
                    <img src={g.src} alt={g.alt} loading="lazy" />
                  </figure>
                ))}
              </div>
              <p className="aviso-fuente">
                Renders entregados por el constructor. Las imágenes son ilustrativas.
              </p>
            </div>
          </section>
        )}

        {/* ── Ubicación ──────────────────────── */}
        <section className="section section-alterna">
          <div className="section-shell">
            <p className="section-kicker">Ubicación</p>
            <h2>{p.ubicacion}</h2>
            <p className="section-lede">{p.ubicacionNota}</p>

            <div className="zona-cards">
              {ZONA_NORTE.map((z) => (
                <article className="zona-card" key={z.titulo}>
                  <h3>{z.titulo}</h3>
                  <p>{z.texto}</p>
                  <p className="zona-card-fuente">{z.fuente}</p>
                </article>
              ))}
            </div>

            <p className="aviso-fuente">
              Publicamos lo que está construido y en operación. Lo que está en
              estudio lo decimos como estudio: del nuevo aeropuerto de la zona
              hay una evaluación de factibilidad ante la ANI, con concepto
              esperado en noviembre de 2026.
            </p>
          </div>
        </section>

        {/* ── CTA ────────────────────────────── */}
        <section className="section section-contacto" id="contacto">
          <div className="section-shell proyecto-cta">
            <p className="section-kicker">Siguiente paso</p>
            <h2>¿Te interesa {p.nombre}?</h2>
            <p className="section-lede">
              Te pasamos disponibilidad, precios vigentes y condiciones de pago
              con la fecha de corte del documento del constructor. Escríbenos y
              te respondemos al instante.
            </p>
            <MeInteresaButton label="Hablar con el asesor" className="btn-primary" />
          </div>
        </section>
        {datos && <BloqueLegal p={datos} />}
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-top">
            <span className="footer-brand">RHF</span>
            <div className="footer-links">
              <Link href="/">Inicio</Link>
              <Link href="/#cartera">Nuestra cartera</Link>
              <Link href="/proyectos/doral-west">Doral West</Link>
              <Link href="/proyectos/doral-country">Doral Country</Link>
            </div>
          </div>
          <div className="footer-legal">
            <p>
              <strong>Rafael Hernández Franco</strong> — Asesor inmobiliario
              independiente. Las imágenes de esta página son renders entregados
              por el constructor y son ilustrativas. Las áreas, la disponibilidad
              y las fechas corresponden al documento y la fecha de corte que se
              indican en cada dato, y pueden variar sin previo aviso.
            </p>
            <p className="footer-circular">
              En esta página no publicamos precios. La Circular 004 de 2024 de
              la Superintendencia de Industria y Comercio exige que toda pieza
              con precio incluya diez datos del proyecto —entre ellos el estrato,
              la cuota de administración estimada y el valor de desistimiento
              precontractual—, y hoy el constructor no los ha entregado por
              escrito. Los pedimos y los publicamos cuando los tengamos. Mientras
              tanto, te damos el precio vigente y su respaldo documental por el
              chat o en asesoría directa.
            </p>
            <p className="footer-copy">
              © {new Date().getFullYear()} RHF. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
