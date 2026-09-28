"use client";

/**
 * Tarjeta de proyecto que gira en 3D.
 *
 * Referencia visual: la tarjeta «card-14» de Shadcn Space en 21st.dev. No se
 * copió su código —el sitio no usa shadcn/ui ni lucide— sino el efecto: al
 * pasar el cursor la tarjeta gira 180° sobre el eje Y con perspectiva, y los
 * elementos de cada cara flotan a distintas profundidades (translateZ). El
 * contenido es nuestro: foto real del proyecto, estado, precio con su corte.
 *
 * Cómo gira, según el dispositivo:
 *  · Ratón: gira al entrar el cursor y vuelve al salir. Con el reverso a la
 *    vista, un clic fuera de los botones abre la página del proyecto.
 *  · Pantalla táctil: no hay «hover». Un toque gira, otro toque vuelve.
 *  · Teclado: el botón «Ver más» gira y lleva el foco al reverso; «Volver»
 *    regresa. La cara que no se ve queda `inert`: fuera del tabulador y del
 *    lector de pantalla.
 *  · Menos movimiento: sin giro, un fundido entre las dos caras (CSS).
 *
 * Las fotos rotan: la tarjeta pasa por hasta cuatro imágenes del proyecto
 * (fundido y un acercamiento lento), cada 3,6 s, solo mientras está a la
 * vista y de frente. Cada tarjeta arranca con un desfase (`retraso`) para que
 * la grilla no cambie toda a la vez. Con menos movimiento, queda la primera.
 * Las imágenes se piden de a una, antes de que les toque.
 *
 * Todos los datos llegan armados desde el servidor (`fichaDe`): esta tarjeta
 * no calcula precios ni áreas, los muestra.
 */
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import MeInteresaButton from "@/components/MeInteresaButton";
import {
  IconoArea,
  IconoBano,
  IconoCama,
  IconoEscudo,
  IconoFlecha,
  IconoWhatsApp,
} from "@/components/Iconos";
import { enlaceWhatsApp } from "@/data/contacto";
import type { Ficha } from "@/lib/ficha";
import { usePrefersReducedMotion } from "@/lib/motion";
import { marcarSalidaDesdeCartera } from "@/lib/volver";
import "@/styles/tarjeta-giro.css";

const ESTADO: Record<Ficha["estado"], string> = {
  "en lanzamiento": "En lanzamiento",
  "en construcción": "En construcción",
  "entrega inmediata": "Entrega inmediata",
};

/** Cada cuánto cambia la foto de la tarjeta. */
const INTERVALO_FOTOS_MS = 3600;

/** El rótulo del área en la cara frontal: el literal si es corto. */
function rotuloArea(etiquetas: string[]): string {
  const junto = etiquetas.join(" · ");
  return etiquetas.length > 0 && junto.length <= 28 ? junto : "Área";
}

export default function TarjetaGiro({
  ficha,
  desdeCartera = false,
  prioritaria = false,
  retraso = 0,
}: {
  ficha: Ficha;
  /** La tarjeta está en la cartera de la home: «Volver» regresa aquí. */
  desdeCartera?: boolean;
  prioritaria?: boolean;
  /** Desfase del primer cambio de foto, en ms, para que no roten todas juntas. */
  retraso?: number;
}) {
  const [girada, setGirada] = useState(false);
  const ultimoPuntero = useRef<string>("mouse");
  const tarjeta = useRef<HTMLElement>(null);
  const reverso = useRef<HTMLDivElement>(null);
  const botonVerMas = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const reducido = usePrefersReducedMotion();

  const f = ficha;
  const fotos = f.fotos.length > 0 ? f.fotos : f.foto ? [f.foto] : [];
  const [fotoActiva, setFotoActiva] = useState(0);
  // La que sale queda debajo, entera, mientras la nueva entra encima.
  const [fotoPrevia, setFotoPrevia] = useState<number | null>(null);
  const activaRef = useRef(0);
  const [montadas, setMontadas] = useState(1);
  const [aLaVista, setALaVista] = useState(false);

  useEffect(() => {
    const el = tarjeta.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setALaVista(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // La siguiente foto se pide antes de que le toque.
  useEffect(() => {
    if (!aLaVista) return;
    setMontadas((m) => Math.max(m, Math.min(fotos.length, fotoActiva + 2)));
  }, [aLaVista, fotoActiva, fotos.length]);

  useEffect(() => {
    if (reducido || !aLaVista || girada || fotos.length < 2) return;
    let intervalo = 0;
    const avanzar = () => {
      const antes = activaRef.current;
      activaRef.current = (antes + 1) % fotos.length;
      setFotoPrevia(antes);
      setFotoActiva(activaRef.current);
    };
    const primero = window.setTimeout(() => {
      avanzar();
      intervalo = window.setInterval(avanzar, INTERVALO_FOTOS_MS);
    }, INTERVALO_FOTOS_MS + retraso);
    return () => {
      window.clearTimeout(primero);
      window.clearInterval(intervalo);
    };
  }, [reducido, aLaVista, girada, fotos.length, retraso]);
  const whatsapp = enlaceWhatsApp(`Hola Rafael, quiero agendar una visita a ${f.nombre}.`);
  const alSalir = () => {
    if (desdeCartera) marcarSalidaDesdeCartera();
  };

  const girar = (hacia: boolean, conFoco = false) => {
    setGirada(hacia);
    if (conFoco) {
      // Después de pintar: la cara que recibe el foco debe dejar de ser inert.
      requestAnimationFrame(() => {
        if (hacia) reverso.current?.focus();
        else botonVerMas.current?.focus();
      });
    }
  };

  const esInteractivo = (el: EventTarget | null) =>
    el instanceof Element && el.closest("a, button") !== null;

  return (
    <article
      ref={tarjeta}
      className={"tg" + (girada ? " tg-girada" : "")}
      aria-label={f.nombre}
      onPointerDown={(e) => {
        ultimoPuntero.current = e.pointerType;
      }}
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") setGirada(true);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") setGirada(false);
      }}
      onClick={(e) => {
        if (esInteractivo(e.target)) return;
        if (ultimoPuntero.current === "mouse") {
          // Con ratón la tarjeta ya está girada: el clic abre el proyecto.
          alSalir();
          router.push(f.href);
          return;
        }
        // Táctil o lápiz: el toque gira y vuelve.
        setGirada((g) => !g);
      }}
      onBlur={(e) => {
        // El foco salió de la tarjeta: vuelve a la cara frontal.
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setGirada(false);
      }}
    >
      <div className="tg-giro">
        {/* ── Cara frontal ─────────────────────────── */}
        <div className="tg-cara tg-frente" inert={girada}>
          <div className="tg-foto">
            {fotos.length > 0 ? (
              fotos.slice(0, montadas).map((foto, i) => (
                <img
                  key={foto.src}
                  className={
                    i === fotoActiva
                      ? "tg-foto-activa" + (fotoPrevia !== null ? " tg-foto-entra" : "")
                      : i === fotoPrevia
                        ? "tg-foto-previa"
                        : undefined
                  }
                  src={foto.src}
                  alt={i === 0 ? foto.alt : ""}
                  aria-hidden={i === 0 ? undefined : true}
                  loading={prioritaria && i === 0 ? "eager" : "lazy"}
                  decoding="async"
                />
              ))
            ) : (
              <div className="tg-panel" aria-hidden="true">
                <span>{f.nombre}</span>
              </div>
            )}
            <span className="tg-estado">{f.estadoTexto ?? ESTADO[f.estado]}</span>
            {f.nuevo && <span className="tg-nuevo">Nuevo</span>}
            {/* 25-sep-2026: los apartamentos van en la misma cartera; esta marca los distingue. */}
            {f.origen === "apartamento" && <span className="tg-origen">Apartamento</span>}
            {fotos.length > 1 && (
              <span className="tg-puntos" aria-hidden="true">
                {fotos.map((foto, i) => (
                  <i key={foto.src} className={i === fotoActiva ? "activo" : undefined} />
                ))}
              </span>
            )}
            {fotos.length > 0 && <span className="tg-credito">{fotos[fotoActiva]?.credito}</span>}
          </div>

          <div className="tg-cuerpo">
            <div className="tg-cabeza">
              <div className="tg-titulos">
                <h3 className="tg-nombre">
                  <Link href={f.href} onClick={alSalir}>
                    {f.nombre}
                  </Link>
                </h3>
                <p className="tg-zona">{f.zona}</p>
                {f.linea && <p className="tg-linea">{f.linea}</p>}
              </div>
              <p className="tg-precio">
                <strong>{f.precio}</strong>
                {f.corte && <span>corte {f.corte}</span>}
              </p>
            </div>

            <ul className="tg-datos">
              {f.alcobas && (
                <li>
                  <IconoCama />
                  <span>
                    <strong>{f.alcobas}</strong> hab.
                  </span>
                </li>
              )}
              {f.banos && (
                <li>
                  <IconoBano />
                  <span>
                    <strong>{f.banos}</strong> {f.banos === "1" ? "baño" : "baños"}
                  </span>
                </li>
              )}
              {f.area && (
                <li>
                  <IconoArea />
                  <span>
                    <strong>
                      {f.area.texto}
                      {f.area.conflicto && <sup aria-hidden="true">*</sup>}
                    </strong>
                    <small>{rotuloArea(f.area.etiquetas)}</small>
                  </span>
                </li>
              )}
            </ul>

            <div className="tg-pie">
              {f.revisionJuridica ? (
                <p className="tg-sello">
                  <IconoEscudo size={16} /> Revisado por nuestro estudio jurídico
                </p>
              ) : (
                <span />
              )}
              <button
                type="button"
                className="tg-ver-mas"
                ref={botonVerMas}
                onClick={() => girar(true, true)}
              >
                <span className="tg-ver-mas-raton">Ver más</span>
                <span className="tg-ver-mas-tactil">Toca para ver más</span>
                <IconoFlecha size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Reverso ──────────────────────────────── */}
        <div
          className="tg-cara tg-reverso"
          inert={!girada}
          ref={reverso}
          tabIndex={-1}
          aria-label={`${f.nombre}: lo que lo hace especial`}
        >
          <p className="tg-kicker">Lo que lo hace especial</p>
          <p className="tg-frase">{f.frase}</p>

          {f.destacados.length > 0 && (
            <ul className="tg-capas">
              {f.destacados.map((d) => (
                <li key={d.titulo}>
                  <span>{d.titulo}</span>
                  <strong>{d.texto}</strong>
                </li>
              ))}
            </ul>
          )}

          {f.entrega && <p className="tg-entrega">Entrega: {f.entrega}</p>}

          {f.area && (f.area.conflicto || rotuloArea(f.area.etiquetas) === "Área") && (
            <p className="tg-nota">
              {f.area.etiquetas.length > 0 && (
                <>Área como la rotula la fuente: {f.area.etiquetas.map((e) => `«${e}»`).join(", ")}. </>
              )}
              {f.area.conflicto && (
                <>* Las fuentes del promotor publican cifras de área distintas; en la página del proyecto están todas.</>
              )}
            </p>
          )}

          <div className="tg-acciones">
            <a className="tg-btn tg-btn-principal" href={whatsapp} target="_blank" rel="noopener noreferrer">
              <IconoWhatsApp size={18} /> Agendar visita
            </a>
            <MeInteresaButton label="Me interesa" className="tg-btn tg-btn-secundario" />
          </div>
          <div className="tg-enlaces">
            <Link className="tg-link" href={f.href} onClick={alSalir}>
              {f.verTexto ?? "Ver proyecto"} <IconoFlecha size={16} />
            </Link>
            <button type="button" className="tg-volver" onClick={() => girar(false, true)}>
              Volver
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
