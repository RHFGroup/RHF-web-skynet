"use client";

/**
 * La portada de la home: la foto aérea propia del corredor de la Zona Norte,
 * viva, y la cartera pasando debajo.
 *
 * Lo que se conserva: el titular, el eyebrow, el párrafo, los dos botones, la
 * foto propia y su crédito. Lo que se suma (prompt 1):
 *
 *  · Ken Burns muy lento sobre la foto (1,00 → 1,08 en 20 s, ida y vuelta),
 *    con un degradado oscuro a la izquierda —donde va el texto— y casi
 *    transparente a la derecha, más un tono cálido leve.
 *  · El texto entra por partes: la línea del eyebrow se dibuja, el titular
 *    sube línea por línea, después el párrafo y los botones.
 *  · Una franja con los proyectos de la cartera que se desplaza sola, despacio,
 *    y se detiene con el cursor o el foco. En el teléfono se desliza con el
 *    dedo, sin moverse sola.
 *  · Pines sobre la foto, SOLO para proyectos con `heroPin` verificado en
 *    proyectos.ts. Hoy ninguno lo tiene: el mecanismo queda listo.
 *
 * Con menos movimiento: sin zoom, sin pulso y sin desplazamiento automático.
 * No hay partículas: HeroParticles salió de la home el 18-sep-2026 y sigue
 * fuera (competía con la foto, que es la prueba de «compra sobre lo
 * construido»).
 */
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { IconoWhatsApp } from "@/components/Iconos";
import type { Ficha } from "@/lib/ficha";
import { marcarSalidaDesdeCartera } from "@/lib/volver";
import "@/styles/hero.css";

export type FichaHero = Ficha & { pin: { top: string; left: string; fuente: string } | null };

/** Tamaño real de la foto del hero, para ubicar los pines sobre ella. */
const FOTO = { ancho: 2400, alto: 1350 };

const ESTADO: Record<Ficha["estado"], string> = {
  "en lanzamiento": "En lanzamiento",
  "en construcción": "En construcción",
  "entrega inmediata": "Entrega inmediata",
};

/**
 * La caja que ocupa la foto con `object-fit: cover`: los porcentajes de un pin
 * se refieren a la FOTO, no al contenedor, y la foto se recorta distinto en
 * cada pantalla. `enfoqueX` es el `object-position` horizontal (0 a 1).
 */
function cajaDeLaFoto(ancho: number, alto: number, enfoqueX: number) {
  const escala = Math.max(ancho / FOTO.ancho, alto / FOTO.alto);
  const w = FOTO.ancho * escala;
  const h = FOTO.alto * escala;
  return { left: (ancho - w) * enfoqueX, top: (alto - h) / 2, width: w, height: h };
}

export default function Hero({ fichas, whatsapp }: { fichas: FichaHero[]; whatsapp: string }) {
  const [activo, setActivo] = useState<string | null>(null);
  const escena = useRef<HTMLDivElement>(null);
  const [caja, setCaja] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const conPin = fichas.filter((f) => f.pin && f.zona === "Zona Norte");

  const medir = useCallback(() => {
    const el = escena.current;
    if (!el) return;
    const angosta = window.matchMedia("(max-width: 860px)").matches;
    setCaja(cajaDeLaFoto(el.clientWidth, el.clientHeight, angosta ? 0.36 : 0.5));
  }, []);

  useEffect(() => {
    if (conPin.length === 0) return;
    medir();
    window.addEventListener("resize", medir, { passive: true });
    return () => window.removeEventListener("resize", medir);
  }, [conPin.length, medir]);

  return (
    <section className="hero-wrap hero" id="inicio">
      <div className="hero-escena" ref={escena}>
        <div className="hero-kb">
          <img
            className="hero-foto"
            src="/zona-norte/corredor-2400.jpg"
            srcSet="/zona-norte/corredor-1200.jpg 1200w, /zona-norte/corredor-2400.jpg 2400w"
            sizes="100vw"
            width={FOTO.ancho}
            height={FOTO.alto}
            alt="Vista aérea del corredor de la Zona Norte de Cartagena, con la Vía al Mar y la línea de costa"
            fetchPriority="high"
            decoding="async"
          />
        </div>
        <div className="hero-velo" aria-hidden="true" />
        {/* Los pines van en su propia capa, por encima del velo y con el mismo
            Ken Burns que la foto: dentro de la capa de la foto quedaban
            oscurecidos por el degradado. */}
        {caja && conPin.length > 0 && (
          <div className="hero-kb hero-kb-pines">
            <div className="hero-pines" style={caja}>
              {conPin.map((f) => (
                <div
                  key={f.slug}
                  className={"hero-pin" + (activo === f.slug ? " activo" : "")}
                  style={{ top: f.pin!.top, left: f.pin!.left }}
                  onMouseEnter={() => setActivo(f.slug)}
                  onMouseLeave={() => setActivo(null)}
                >
                  <button
                    type="button"
                    className="hero-pin-punto"
                    aria-label={`${f.nombre}: ver detalle`}
                    aria-expanded={activo === f.slug}
                    onClick={() => setActivo(activo === f.slug ? null : f.slug)}
                    onFocus={() => setActivo(f.slug)}
                  />
                  {activo === f.slug && (
                    <div className="hero-pin-tarjeta" role="dialog" aria-label={f.nombre}>
                      {f.foto && <img src={f.foto.src} alt="" loading="lazy" />}
                      <div>
                        <strong>{f.nombre}</strong>
                        <span>
                          {f.zona} · {f.linea ?? ESTADO[f.estado]}
                        </span>
                        <span className="hero-pin-precio">
                          {f.precio}
                          {f.corte && <small> · corte {f.corte}</small>}
                        </span>
                        <Link href={f.href} onClick={marcarSalidaDesdeCartera}>
                          Ver proyecto
                        </Link>
                        <small className="hero-pin-fuente">Posición verificada · {f.pin!.fuente}</small>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="hero-content">
        <p className="eyebrow hero-eyebrow">Asesoría inmobiliaria · Cartagena</p>
        <h1>
          <span className="hero-linea">Tu próximo proyecto,</span>{" "}
          <span className="hero-linea">en la mejor ubicación.</span>
        </h1>
        <p className="hero-sub">
          Asesoría inmobiliaria premium en Cartagena y la Zona Norte.
          Te acompañamos en cada paso para encontrar el proyecto
          que se ajusta a lo que buscas.
        </p>
        <div className="hero-ctas">
          <a className="btn-primary" href="#cartera">
            Ver nuestra cartera
          </a>
          <a className="btn-ghost" href={whatsapp} target="_blank" rel="noopener noreferrer">
            <IconoWhatsApp /> Contactar
          </a>
        </div>
      </div>

      {fichas.length > 0 && (
        <nav className="hero-carrusel" aria-label="Proyectos de nuestra cartera">
          <div className="hero-pista">
            <ul className="hero-serie">
              {fichas.map((f) => (
                <Miniatura key={f.slug} f={f} activo={activo === f.slug} alActivar={setActivo} />
              ))}
            </ul>
            {/* La copia hace el bucle sin salto. Es decorativa: fuera del
                tabulador y del lector de pantalla. */}
            <ul className="hero-serie hero-serie-copia" aria-hidden="true" inert>
              {fichas.map((f) => (
                <Miniatura key={f.slug} f={f} activo={activo === f.slug} alActivar={setActivo} />
              ))}
            </ul>
          </div>
        </nav>
      )}

      <p className="hero-credito">
        Corredor de la Zona Norte, Cartagena · marzo de 2026 · foto propia
      </p>
    </section>
  );
}

function Miniatura({
  f,
  activo,
  alActivar,
}: {
  f: FichaHero;
  activo: boolean;
  alActivar: (slug: string | null) => void;
}) {
  return (
    <li className={"hero-mini" + (activo ? " activa" : "")}>
      <Link
        href={f.href}
        onClick={marcarSalidaDesdeCartera}
        onMouseEnter={() => alActivar(f.slug)}
        onMouseLeave={() => alActivar(null)}
        onFocus={() => alActivar(f.slug)}
        onBlur={() => alActivar(null)}
      >
        {f.foto ? (
          <img src={f.foto.src} alt="" loading="lazy" decoding="async" width={112} height={84} />
        ) : (
          <span className="hero-mini-panel" aria-hidden="true" />
        )}
        <span className="hero-mini-texto">
          <strong>{f.nombre}</strong>
          <span>
            {f.zona} · {ESTADO[f.estado]}
          </span>
          <span className="hero-mini-precio">
            {f.precio}
            {f.corte && <small>corte {f.corte}</small>}
          </span>
        </span>
      </Link>
    </li>
  );
}
