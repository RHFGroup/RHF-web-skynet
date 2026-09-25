"use client";

/**
 * La portada de la home: un escaparate a pantalla completa.
 *
 * Abre con la foto aérea propia del corredor de la Zona Norte y pasa, uno por
 * uno, por los proyectos de la cartera: cada uno a pantalla completa, con su
 * nombre, zona, estado, precio con su fecha de corte y «Ver proyecto». Lo
 * pidió Rafael el 25-sep-2026: la portada tiene que cambiar de imagen según
 * los proyectos y mostrarlos, no quedarse en una sola foto.
 *
 * Lo que se conserva del prompt 1: el titular, el eyebrow, el párrafo, los dos
 * botones, la foto propia con su crédito, el Ken Burns, el degradado oscuro a
 * la izquierda, el texto que entra por partes y los pines (solo con `heroPin`
 * verificado y solo sobre la foto del corredor; hoy ninguno lo tiene).
 *
 * Cómo se mueve:
 *  · Cada imagen se queda 7 s con un Ken Burns propio (se acerca, se aleja o
 *    se desplaza) y entra con un fundido de 1,4 s sobre la anterior.
 *  · Abajo, una miniatura por imagen con una barra que se llena: dice cuánto
 *    falta para la siguiente y deja saltar a cualquiera.
 *  · Se detiene con el botón de pausa, con el cursor sobre la leyenda o las
 *    miniaturas, al recorrerlas con el teclado, cuando la portada sale de la
 *    pantalla y cuando la pestaña queda de fondo. WCAG 2.2.2: todo lo que se
 *    mueve solo más de 5 s se puede parar.
 *  · Con menos movimiento: sin Ken Burns y sin avance solo. Las miniaturas
 *    cambian la imagen al elegirlas.
 *
 * Las imágenes pesan: al cargar se piden la primera (con prioridad, es la que
 * se ve) y la siguiente; las demás, una antes de que les toque.
 *
 * Los datos salen de proyectos.ts vía `fichaDe`: el precio solo si es
 * publicable y siempre con su corte. La cifra de la primera leyenda sale de
 * zona.ts, con su fuente.
 */
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { IconoFlecha, IconoWhatsApp } from "@/components/Iconos";
import { CIFRA_OFERTA } from "@/data/zona";
import type { Ficha } from "@/lib/ficha";
import { usePrefersReducedMotion } from "@/lib/motion";
import { marcarSalidaDesdeCartera } from "@/lib/volver";
import "@/styles/hero.css";

export type FichaHero = Ficha & { pin: { top: string; left: string; fuente: string } | null };

/** Cuánto se queda cada imagen antes de pasar a la siguiente. */
const DURACION_MS = 7000;

/** Tamaño real de la foto del corredor, para ubicar los pines sobre ella. */
const FOTO = { ancho: 2400, alto: 1350 };

const ESTADO: Record<Ficha["estado"], string> = {
  "en lanzamiento": "En lanzamiento",
  "en construcción": "En construcción",
  "entrega inmediata": "Entrega inmediata",
};

type Diapositiva = {
  clave: string;
  imagen: { src: string; src1200: string; alt: string; enfoque: string; ancho: number };
  mini: string;
  etiqueta: string;
  sub: string;
  credito: string;
  /** null en la primera: la del corredor, que presenta la zona. */
  ficha: FichaHero | null;
};

/**
 * La caja que ocupa la foto con `object-fit: cover`: los porcentajes de un pin
 * se refieren a la FOTO, no al contenedor, y la foto se recorta distinto en
 * cada pantalla.
 */
function cajaDeLaFoto(ancho: number, alto: number) {
  const escala = Math.max(ancho / FOTO.ancho, alto / FOTO.alto);
  const w = FOTO.ancho * escala;
  const h = FOTO.alto * escala;
  return { left: (ancho - w) / 2, top: (alto - h) / 2, width: w, height: h };
}

const dos = (n: number) => String(n).padStart(2, "0");

export default function Hero({ fichas, whatsapp }: { fichas: FichaHero[]; whatsapp: string }) {
  const reducido = usePrefersReducedMotion();

  const diapositivas = useMemo<Diapositiva[]>(
    () => [
      {
        clave: "zona-norte",
        imagen: {
          src: "/zona-norte/corredor-2400.jpg",
          src1200: "/zona-norte/corredor-1200.jpg",
          alt: "Vista aérea del corredor de la Zona Norte de Cartagena, con la Vía al Mar y la línea de costa",
          enfoque: "50% 50%",
          ancho: 2400,
        },
        mini: "/zona-norte/corredor-mini.jpg",
        etiqueta: "Zona Norte",
        sub: "Cartagena",
        credito: "Corredor de la Zona Norte, Cartagena · marzo de 2026 · foto propia",
        ficha: null,
      },
      ...fichas
        .filter((f) => f.escaparate !== null)
        .map((f) => ({
          clave: f.slug,
          imagen: f.escaparate!,
          mini: f.escaparate!.mini,
          etiqueta: f.nombre,
          sub: `${f.zona} · ${ESTADO[f.estado]}`,
          credito: f.escaparate!.credito,
          ficha: f,
        })),
    ],
    [fichas],
  );
  const total = diapositivas.length;

  const [activo, setActivo] = useState(0);
  const [previa, setPrevia] = useState<number | null>(null);
  const [montadas, setMontadas] = useState<number[]>(() => (total > 1 ? [0, 1] : [0]));
  const [pausaBoton, setPausaBoton] = useState(false);
  const [pausaCursor, setPausaCursor] = useState(false);
  const [pausaTeclado, setPausaTeclado] = useState(false);
  const [enPantalla, setEnPantalla] = useState(true);
  const [pestanaVisible, setPestanaVisible] = useState(true);
  const [anunciar, setAnunciar] = useState(false);

  const raiz = useRef<HTMLElement>(null);
  const escena = useRef<HTMLDivElement>(null);
  const fila = useRef<HTMLDivElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const activoRef = useRef(0);

  const corriendo =
    !reducido && !pausaBoton && !pausaCursor && !pausaTeclado && enPantalla && pestanaVisible && total > 1;

  const ir = useCallback(
    (i: number, manual = false) => {
      const antes = activoRef.current;
      if (i === antes) return;
      activoRef.current = i;
      setPrevia(antes);
      setActivo(i);
      // La que toca y la siguiente, para que la próxima ya esté cargada.
      const siguiente = (i + 1) % total;
      setMontadas((m) => (m.includes(i) && m.includes(siguiente) ? m : [...new Set([...m, i, siguiente])]));
      if (manual) setAnunciar(true);
    },
    [total],
  );
  const siguiente = useCallback(() => ir((activoRef.current + 1) % total), [ir, total]);

  // La portada se detiene cuando sale de la pantalla o la pestaña queda de fondo.
  useEffect(() => {
    const el = raiz.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setEnPantalla(e.isIntersecting), { threshold: 0.2 });
    io.observe(el);
    const alCambiar = () => setPestanaVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", alCambiar);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", alCambiar);
    };
  }, []);

  // En el teléfono las miniaturas se deslizan: la activa se mantiene a la vista.
  useEffect(() => {
    const contenedor = fila.current;
    const tab = tabs.current[activo];
    if (!contenedor || !tab || contenedor.scrollWidth <= contenedor.clientWidth) return;
    const izquierda = tab.offsetLeft - 16;
    contenedor.scrollTo({ left: izquierda, behavior: reducido ? "auto" : "smooth" });
  }, [activo, reducido]);

  // Pines: solo sobre la foto del corredor y solo con posición verificada.
  const conPin = fichas.filter((f) => f.pin && f.zona === "Zona Norte");
  const [caja, setCaja] = useState<ReturnType<typeof cajaDeLaFoto> | null>(null);
  const [pinActivo, setPinActivo] = useState<string | null>(null);
  useEffect(() => {
    if (conPin.length === 0) return;
    const medir = () => {
      const el = escena.current;
      if (el) setCaja(cajaDeLaFoto(el.clientWidth, el.clientHeight));
    };
    medir();
    window.addEventListener("resize", medir, { passive: true });
    return () => window.removeEventListener("resize", medir);
  }, [conPin.length]);

  const alTeclado = (e: React.KeyboardEvent, i: number) => {
    let j = -1;
    if (e.key === "ArrowRight") j = (i + 1) % total;
    else if (e.key === "ArrowLeft") j = (i - 1 + total) % total;
    else if (e.key === "Home") j = 0;
    else if (e.key === "End") j = total - 1;
    if (j < 0) return;
    e.preventDefault();
    ir(j, true);
    tabs.current[j]?.focus();
  };

  const d = diapositivas[activo];

  return (
    <section
      ref={raiz}
      className={"hero hero-escaparate" + (corriendo ? "" : " pausado")}
      id="inicio"
      aria-roledescription="carrusel"
      aria-label="La Zona Norte y los proyectos de nuestra cartera"
      style={{ "--dur": `${DURACION_MS}ms`, "--n": total } as React.CSSProperties}
    >
      {/* ── Las imágenes ─────────────────────────── */}
      <div className="hero-escena" ref={escena}>
        {diapositivas.map((s, i) => (
          <div
            key={s.clave}
            className={
              "hero-diapo kb-" + (i % 3) + (i === activo ? " activa" : "") + (i === previa ? " previa" : "")
            }
            aria-hidden={i !== activo}
          >
            {montadas.includes(i) && (
              <img
                src={s.imagen.src}
                srcSet={
                  s.imagen.ancho > 1200
                    ? `${s.imagen.src1200} 1200w, ${s.imagen.src} ${s.imagen.ancho}w`
                    : undefined
                }
                // En una pantalla vertical la imagen se agranda hasta cubrir el
                // alto: pide la versión grande aunque el ancho sea chico.
                sizes="(orientation: portrait) 190vh, 100vw"
                alt={s.imagen.alt}
                style={{ objectPosition: s.imagen.enfoque }}
                fetchPriority={i === 0 ? "high" : "low"}
                decoding="async"
              />
            )}
          </div>
        ))}
        <div className="hero-velo" aria-hidden="true" />

        {activo === 0 && caja && conPin.length > 0 && (
          <div className="hero-capa-pines kb-0">
            <div className="hero-pines" style={caja}>
              {conPin.map((f) => (
                <div
                  key={f.slug}
                  className={"hero-pin" + (pinActivo === f.slug ? " activo" : "")}
                  style={{ top: f.pin!.top, left: f.pin!.left }}
                  onMouseEnter={() => setPinActivo(f.slug)}
                  onMouseLeave={() => setPinActivo(null)}
                >
                  <button
                    type="button"
                    className="hero-pin-punto"
                    aria-label={`${f.nombre}: ver detalle`}
                    aria-expanded={pinActivo === f.slug}
                    onClick={() => setPinActivo(pinActivo === f.slug ? null : f.slug)}
                    onFocus={() => setPinActivo(f.slug)}
                  />
                  {pinActivo === f.slug && (
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

      {/* ── El texto y la leyenda de la imagen ───── */}
      <div className="hero-cuerpo">
        <div className="hero-content">
          <p className="eyebrow hero-eyebrow">Asesoría inmobiliaria · Cartagena</p>
          <h1>
            <span className="hero-linea">Tu próximo proyecto,</span>{" "}
            <span className="hero-linea">en la mejor ubicación.</span>
          </h1>
          <p className="hero-sub">
            Asesoría inmobiliaria premium en Cartagena y la Zona Norte. Te acompañamos en cada paso para encontrar
            el proyecto que se ajusta a lo que buscas.
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

        <div
          className="hero-leyenda"
          id="hero-leyenda"
          role="tabpanel"
          aria-labelledby={`hero-tab-${activo}`}
          aria-live={anunciar ? "polite" : "off"}
          onPointerEnter={(e) => e.pointerType === "mouse" && setPausaCursor(true)}
          onPointerLeave={(e) => e.pointerType === "mouse" && setPausaCursor(false)}
        >
          <div className="hero-leyenda-caja">
            {!reducido && total > 1 && (
              <button
                type="button"
                className="hero-pausa"
                aria-pressed={pausaBoton}
                aria-label={pausaBoton ? "Reanudar la portada" : "Pausar la portada"}
                onClick={() => setPausaBoton((p) => !p)}
              >
                {pausaBoton ? <IconoPlay /> : <IconoPausa />}
              </button>
            )}
            <Leyenda key={d.clave} d={d} indice={activo} total={total} />
          </div>
        </div>
      </div>

      {/* ── Las miniaturas y la pausa ────────────── */}
      <div
        className="hero-controles"
        // Solo el ratón pausa al pasar: en el teléfono un toque deja el
        // «hover» pegado y la portada quedaría quieta.
        onPointerEnter={(e) => e.pointerType === "mouse" && setPausaCursor(true)}
        onPointerLeave={(e) => e.pointerType === "mouse" && setPausaCursor(false)}
        onFocus={(e) => {
          // Solo el foco del teclado detiene la portada: un clic con el ratón
          // en una miniatura no debe dejarla quieta para siempre.
          if (e.target instanceof HTMLElement && e.target.matches(":focus-visible")) setPausaTeclado(true);
        }}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPausaTeclado(false);
        }}
      >
        <div className="hero-tabs" role="tablist" aria-label="Elegir la imagen de la portada" ref={fila}>
          {diapositivas.map((s, i) => (
            <button
              key={s.clave}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`hero-tab-${i}`}
              aria-selected={i === activo}
              aria-controls="hero-leyenda"
              tabIndex={i === activo ? 0 : -1}
              className={"hero-tab" + (i === activo ? " activa" : "") + (i < activo ? " vista" : "")}
              onClick={() => ir(i, true)}
              onKeyDown={(e) => alTeclado(e, i)}
            >
              <span className="hero-tab-progreso" aria-hidden="true">
                <span onAnimationEnd={corriendo && i === activo ? siguiente : undefined} />
              </span>
              <img src={s.mini} alt="" width={56} height={40} loading="lazy" decoding="async" />
              <span className="hero-tab-texto">
                <strong>{s.etiqueta}</strong>
                <small>{s.sub}</small>
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

/** La leyenda de la imagen activa. Se vuelve a montar con cada una: así entra animada. */
function Leyenda({ d, indice, total }: { d: Diapositiva; indice: number; total: number }) {
  const f = d.ficha;
  return (
    <div className="hero-leyenda-contenido">
      <p className="hero-leyenda-cuenta">
        <span>{dos(indice + 1)}</span> / {dos(total)}
      </p>
      {f ? (
        <>
          <p className="hero-leyenda-etiquetas">
            <span className="hero-leyenda-estado">{ESTADO[f.estado]}</span>
            {f.nuevo && <span className="hero-leyenda-nuevo">Nuevo</span>}
          </p>
          <p className="hero-leyenda-nombre">
            <span>{f.nombre}</span>
          </p>
          <p className="hero-leyenda-meta">
            {f.zona}
            {f.linea ? ` · ${f.linea}` : ""}
          </p>
          <p className="hero-leyenda-precio">
            <strong>{f.precio}</strong>
            {f.corte && <small>corte {f.corte}</small>}
          </p>
          <Link className="hero-leyenda-cta" href={f.href} onClick={marcarSalidaDesdeCartera}>
            Ver proyecto <IconoFlecha size={16} />
          </Link>
        </>
      ) : (
        <>
          <p className="hero-leyenda-etiquetas">
            <span className="hero-leyenda-estado">Zona Norte</span>
          </p>
          <p className="hero-leyenda-nombre">
            <span>Donde Cartagena está creciendo</span>
          </p>
          <p className="hero-leyenda-meta">
            Cerca del {CIFRA_OFERTA.valor} % {CIFRA_OFERTA.rotulo}. Fuente: {CIFRA_OFERTA.fuente}.
          </p>
          <a className="hero-leyenda-cta" href="#zonanorte">
            Conoce la zona <IconoFlecha size={16} />
          </a>
        </>
      )}
      <p className="hero-leyenda-credito">{d.credito}</p>
    </div>
  );
}

function IconoPausa() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  );
}

function IconoPlay() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" />
    </svg>
  );
}
