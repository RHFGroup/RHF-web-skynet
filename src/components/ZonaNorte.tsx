"use client";

/**
 * Acto 2 — «Zona Norte» (prompt 2, rama feat/zona-norte-mapa-ilustrado).
 *
 * El recorrido de la sección: Cartagena → por qué la ciudad crece hacia el
 * norte → la Zona Norte. A la izquierda se lee; a la derecha, fijo, el mapa
 * ilustrado, que arranca mostrando la ciudad y, mientras se lee el bloque de
 * Cartagena, se desplaza hacia el norte por la Vía al Mar hasta enmarcar el
 * corredor. No secuestra el scroll: solo lee la posición.
 *
 * Lo que se conserva del acto anterior: el titular, el párrafo, el 70 % con
 * «Aquí está la oferta» y Camacol Bolívar, las cifras del viaducto (8 años),
 * la doble calzada (95 %), el hospital y Uniandes, Kristal Malls, el render
 * de Doral West y la nota de fuentes. Ahora cada hecho lleva su estado
 * —Entregado, En obra— con fuente y fecha, y lo entregado va primero.
 *
 * ⛔ El copy y las cifras salen de src/data/zona.ts, que a su vez sale de
 * `projects/inmobiliaria/copy-de-la-seccion-zona-norte-que-publicamos-y-que-no`
 * en el vault. Prohibido: el aeropuerto como hecho, cualquier cifra de
 * valorización, superlativos y los minutos al centro.
 *
 * Teléfono: intro → Cartagena → la cifra → el mapa a todo el ancho → los
 * proyectos en carrusel → lo demás. Con menos movimiento: nada se anima y el
 * anillo aparece en 70 %.
 */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import CountUp from "@/components/CountUp";
import Reveal from "@/components/Reveal";
import RevealGrupo from "@/components/RevealGrupo";
import MapaIlustrado, { type PinProyecto } from "@/components/MapaIlustrado";
import { EtiquetaPropuesta } from "@/components/IconoProceso";
import { CARTAGENA, CIFRA_OFERTA, HECHOS, NOTA_FUENTES, NOTA_MAPA, type Estado } from "@/data/zona";
import type { Ficha } from "@/lib/ficha";
import { usePrefersReducedMotion, useReveal } from "@/lib/motion";
import { MODO_REVISION } from "@/lib/revision";
import "@/styles/zona-norte.css";

const claseEstado = (e: Estado) => (e === "Entregado" ? "entregado" : e === "En obra" ? "obra" : "estudio");

export default function ZonaNorte({ proyectos, pines }: { proyectos: Ficha[]; pines: PinProyecto[] }) {
  const reducido = usePrefersReducedMotion();
  const [movil, setMovil] = useState(false);
  const [progreso, setProgreso] = useState(1);
  const [resaltado, setResaltado] = useState<string | null>(null);
  const cartagena = useRef<HTMLDivElement>(null);
  const oferta = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 960px)");
    const actualizar = () => setMovil(mq.matches);
    actualizar();
    mq.addEventListener("change", actualizar);
    return () => mq.removeEventListener("change", actualizar);
  }, []);

  // El paso de la ciudad al corredor sigue la lectura: empieza cuando el
  // bloque de Cartagena llega a la mitad de la pantalla y termina cuando la
  // cifra de la oferta llega arriba. Se mide en el propio evento de scroll (ver
  // useScrollProgress en src/lib/motion.ts) y siempre se mide el último.
  useEffect(() => {
    if (movil || reducido) {
      setProgreso(1);
      return;
    }
    const a = cartagena.current;
    const b = oferta.current;
    if (!a || !b) return;
    let ultimo = 0;
    let pendiente = 0;
    const medir = () => {
      const vh = window.innerHeight || 1;
      const ta = a.getBoundingClientRect().top;
      const tb = b.getBoundingClientRect().top;
      // 0 cuando el bloque de Cartagena llega a la mitad de la pantalla; 1
      // cuando la cifra de la oferta llega al 35 % superior.
      const recorrido = tb - ta + 0.15 * vh;
      const p = recorrido > 0 ? (0.5 * vh - ta) / recorrido : ta < 0.5 * vh ? 1 : 0;
      setProgreso(Math.max(0, Math.min(1, p)));
    };
    const alMover = () => {
      window.clearTimeout(pendiente);
      pendiente = window.setTimeout(medir, 80);
      const ahora = performance.now();
      if (ahora - ultimo < 16) return;
      ultimo = ahora;
      medir();
    };
    medir();
    window.addEventListener("scroll", alMover, { passive: true });
    window.addEventListener("resize", alMover, { passive: true });
    return () => {
      window.clearTimeout(pendiente);
      window.removeEventListener("scroll", alMover);
      window.removeEventListener("resize", alMover);
    };
  }, [movil, reducido]);

  const entregados = HECHOS.filter((h) => h.estado === "Entregado");
  const enCurso = HECHOS.filter((h) => h.estado !== "Entregado");

  return (
    <section className="section zn" id="zonanorte">
      <div className="section-shell zn-grid">
        {/* ── La entrada ── */}
        <RevealGrupo className="zn-intro">
          <p className="section-kicker" style={{ "--i": 0 } as React.CSSProperties}>
            Zona Norte
          </p>
          <h2 style={{ "--i": 1 } as React.CSSProperties}>La Zona Norte es donde Cartagena está creciendo</h2>
          <p className="section-lede" style={{ "--i": 2 } as React.CSSProperties}>
            Siete de cada diez viviendas nuevas de Bolívar están aquí. Te contamos qué está hecho y qué está en
            estudio.
          </p>
        </RevealGrupo>

        {/* ── Cartagena, en el medio ── */}
        <div className="zn-cartagena" ref={cartagena}>
          <Reveal>
            <p className="section-kicker">Cartagena</p>
            <h3>{CARTAGENA.titulo}</h3>
            {MODO_REVISION && (
              <p className="zn-alterno">
                <EtiquetaPropuesta confirmado={false} nota="titular, elige una" />
                <span>
                  Opción A (publicada): «{CARTAGENA.titulo}» · Opción B: «{CARTAGENA.tituloAlterno}»
                </span>
              </p>
            )}
            <p className="zn-cartagena-texto">{CARTAGENA.texto}</p>
          </Reveal>
        </div>

        {/* ── La cifra de la oferta ── */}
        <div className="zn-oferta" ref={oferta}>
          <Reveal delay={120}>
            <div className="zn-oferta-cifra">
              <Anillo valor={CIFRA_OFERTA.valor} />
              <div>
                <p className="zn-oferta-rotulo">{CIFRA_OFERTA.rotulo}</p>
                <ul className="zn-oferta-leyenda">
                  <li>
                    <span className="zn-punto zn-punto-norte" aria-hidden="true" />
                    Zona Norte · {CIFRA_OFERTA.valor} %
                  </li>
                  <li>
                    <span className="zn-punto zn-punto-resto" aria-hidden="true" />
                    {CIFRA_OFERTA.resto.charAt(0).toUpperCase() + CIFRA_OFERTA.resto.slice(1)} ·{" "}
                    {100 - CIFRA_OFERTA.valor} %
                  </li>
                </ul>
              </div>
            </div>
            <h3>{CIFRA_OFERTA.titulo}</h3>
            <p className="zn-oferta-texto">{CIFRA_OFERTA.texto}</p>
            <p className="zn-fuente">Fuente: {CIFRA_OFERTA.fuente}</p>
          </Reveal>
        </div>

        {/* ── El mapa, fijo a la derecha; en el teléfono, después de la cifra ── */}
        <div className="zn-mapa-col">
          <div className="zn-mapa-fijo">
            <MapaIlustrado progreso={progreso} proyectos={pines} compacto={movil} resaltado={resaltado} />
            {proyectos.length > 0 && (
              <div className="zn-proyectos">
                <p className="zn-proyectos-titulo">Nuestros proyectos en la Zona Norte</p>
                <ul>
                  {proyectos.map((f) => (
                    <li key={f.slug}>
                      <Link
                        href={f.href}
                        onMouseEnter={() => setResaltado(f.slug)}
                        onMouseLeave={() => setResaltado(null)}
                        onFocus={() => setResaltado(f.slug)}
                        onBlur={() => setResaltado(null)}
                      >
                        {f.foto ? (
                          <img src={f.foto.src} alt="" loading="lazy" decoding="async" width={56} height={56} />
                        ) : (
                          <span className="zn-proyecto-panel" aria-hidden="true" />
                        )}
                        <span className="zn-proyecto-texto">
                          <strong>{f.nombre}</strong>
                          <span className="zn-proyecto-precio">{f.precio}</span>
                          {f.corte && <small>corte {f.corte}</small>}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* ── Lo que está hecho y lo que está en obra ── */}
        <div className="zn-hechos">
          <GrupoHechos titulo="Lo que ya funciona" hechos={entregados} />
          <GrupoHechos titulo="Lo que está en obra" hechos={enCurso} />
        </div>

        {/* ── El render ── */}
        <Reveal className="zn-render-bloque">
          <figure className="zn-render">
            <img
              src="/proyectos/doral-west/home.jpg"
              alt="Doral West, en la Zona Norte de Cartagena — render del promotor"
              loading="lazy"
              decoding="async"
            />
            <figcaption>Doral West, en la Zona Norte · render del promotor</figcaption>
          </figure>
        </Reveal>

        <div className="zn-fuentes">
          <p>{NOTA_FUENTES}</p>
          <p>{NOTA_MAPA}</p>
        </div>
      </div>
    </section>
  );
}

/** El 70 %: el número cuenta y el anillo se llena en camel sobre arena. */
function Anillo({ valor }: { valor: number }) {
  const { ref, armed, visible } = useReveal<HTMLDivElement>(0.4);
  // El HTML sale lleno: sin JS, con menos movimiento o ya en pantalla, se lee el dato.
  const lleno = !armed || visible;
  return (
    <div ref={ref} className={"zn-anillo" + (lleno ? " lleno" : "")}>
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle cx={60} cy={60} r={50} className="zn-anillo-pista" />
        <circle
          cx={60}
          cy={60}
          r={50}
          className="zn-anillo-relleno"
          pathLength={100}
          style={{ "--valor": valor } as React.CSSProperties}
        />
      </svg>
      <strong>
        <CountUp
          to={valor}
          suffix=" %"
          srText={`Cerca del ${valor} por ciento de la vivienda nueva que se comercializa en Bolívar está en la Zona Norte`}
        />
      </strong>
    </div>
  );
}

function GrupoHechos({ titulo, hechos }: { titulo: string; hechos: typeof HECHOS }) {
  if (hechos.length === 0) return null;
  return (
    <div className="zn-hechos-grupo">
      <h3 className="zn-hechos-titulo">{titulo}</h3>
      <RevealGrupo className="zn-hechos-lista">
        {hechos.map((h, i) => (
          <article
            key={h.titulo}
            className={"zn-hecho zn-hecho-" + claseEstado(h.estado)}
            style={{ "--i": i } as React.CSSProperties}
          >
            <span className={"zn-estado zn-estado-" + claseEstado(h.estado)}>{h.estado}</span>
            {h.cifra && (
              <p className="zn-hecho-cifra">
                <strong>
                  <CountUp
                    to={h.cifra.valor}
                    suffix={h.cifra.sufijo}
                    srText={`${h.cifra.valor}${h.cifra.sufijo} ${h.cifra.rotulo}`}
                  />
                </strong>
                <span>{h.cifra.rotulo}</span>
              </p>
            )}
            <h4>{h.titulo}</h4>
            <p className="zn-hecho-texto">{h.texto}</p>
            <p className="zn-fuente">
              Fuente: {h.fuente} · {h.fecha}
            </p>
          </article>
        ))}
      </RevealGrupo>
    </div>
  );
}
