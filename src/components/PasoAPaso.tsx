"use client";

/**
 * «Cómo comprar con nosotros» — la línea de tiempo del paso a paso.
 *
 * Horizontal en escritorio (dos filas de cuatro), vertical en el teléfono.
 * Una línea camel se dibuja de paso en paso a medida que la persona baja, y
 * cada paso se ilumina al llegar. Los pasos donde interviene el estudio
 * jurídico llevan su sello.
 *
 * Los pasos salen de src/data/proceso.ts y solo se publican los confirmados;
 * en las vistas previas se ven todos, marcados como propuesta. Si ninguno
 * está confirmado, en producción la sección no aparece.
 *
 * El avance se mide en el evento de scroll (sin IntersectionObserver, que se
 * congela en pestañas de fondo). Con menos movimiento, todo aparece dibujado.
 */
import { useEffect, useRef, useState } from "react";
import FormularioGuia from "@/components/FormularioGuia";
import IconoProceso, { EtiquetaPropuesta } from "@/components/IconoProceso";
import { IconoEscudo, IconoWhatsApp } from "@/components/Iconos";
import { enlaceWhatsApp } from "@/data/contacto";
import { COMPRA_DESDE_EXTERIOR, GUIAS, PASOS } from "@/data/proceso";
import { seMuestra } from "@/lib/revision";
import { usePrefersReducedMotion } from "@/lib/motion";
import "@/styles/proceso.css";

export default function PasoAPaso() {
  const pasos = PASOS.filter(seMuestra);
  const reduced = usePrefersReducedMotion();
  const lista = useRef<HTMLOListElement>(null);
  const [avance, setAvance] = useState(0);
  const [guiaAbierta, setGuiaAbierta] = useState(false);

  useEffect(() => {
    const el = lista.current;
    if (!el || reduced) return;
    let ultimo = 0;
    const medir = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // 0 cuando la lista asoma por abajo; 1 cuando su final pasa el 55 %.
      const p = (vh * 0.85 - r.top) / (r.height + vh * 0.3);
      setAvance(Math.max(0, Math.min(1, p)));
    };
    const alScroll = () => {
      const ahora = performance.now();
      if (ahora - ultimo < 32) return;
      ultimo = ahora;
      medir();
    };
    medir();
    window.addEventListener("scroll", alScroll, { passive: true });
    window.addEventListener("resize", alScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", alScroll);
      window.removeEventListener("resize", alScroll);
    };
  }, [reduced]);

  if (pasos.length === 0) return null;

  const n = pasos.length;
  const recorrido = reduced ? n : avance * n;

  return (
    <section className="pa section" id="paso-a-paso" aria-labelledby="pa-titulo">
      <div className="section-shell">
        <p className="section-kicker">Paso a paso</p>
        <h2 id="pa-titulo">Cómo comprar con nosotros</h2>
        <p className="section-lede">
          Desde la primera conversación hasta la entrega: sabes en qué paso
          vas y qué sigue.
        </p>

        <ol className="pa-lista" ref={lista}>
          {pasos.map((p, i) => {
            const activo = recorrido > i;
            const llenado = Math.max(0, Math.min(1, recorrido - i - 0.35));
            return (
              <li key={p.titulo} className={"pa-paso" + (activo ? " activo" : "")}>
                <div className="pa-nodo" aria-hidden="true">
                  <span className="pa-circulo">
                    <IconoProceso icono={p.icono} size={20} />
                  </span>
                  {i < n - 1 && (
                    <span className="pa-conector">
                      <span style={{ "--llenado": llenado.toFixed(3) } as React.CSSProperties} />
                    </span>
                  )}
                </div>
                <div className="pa-texto">
                  <span className="pa-numero">{String(i + 1).padStart(2, "0")}</span>
                  <h3>{p.titulo}</h3>
                  <p>{p.texto}</p>
                  {p.juridico && (
                    <span className="pa-sello">
                      <IconoEscudo size={14} /> Estudio jurídico
                    </span>
                  )}
                  <EtiquetaPropuesta confirmado={p.confirmado} nota={p.pendiente} />
                </div>
              </li>
            );
          })}
        </ol>

        {COMPRA_DESDE_EXTERIOR && (
          <aside className="pa-exterior">
            <h3>¿Compras desde el exterior?</h3>
            <ul>
              {COMPRA_DESDE_EXTERIOR.pasos.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
            <p className="pa-exterior-fuente">
              Validado por {COMPRA_DESDE_EXTERIOR.validadoPor} · {COMPRA_DESDE_EXTERIOR.fecha}
            </p>
          </aside>
        )}

        <div className="pa-cta">
          <div>
            <h3>Empieza por el paso 1</h3>
            <p>Cuéntanos qué buscas y armamos juntos el camino.</p>
          </div>
          <div className="pa-cta-botones">
            <a
              className="btn-primary"
              href={enlaceWhatsApp("Hola Rafael, quiero empezar por el paso 1: te cuento qué busco.")}
              target="_blank"
              rel="noopener noreferrer"
            >
              <IconoWhatsApp size={18} /> Hablar con un asesor
            </a>
            {GUIAS.compra.pdf && !guiaAbierta && (
              <button type="button" className="pa-btn-guia" onClick={() => setGuiaAbierta(true)}>
                Descargar la guía de compra
              </button>
            )}
          </div>
        </div>
        {GUIAS.compra.pdf && guiaAbierta && (
          <FormularioGuia
            titulo={GUIAS.compra.titulo}
            pdf={GUIAS.compra.pdf}
            origen={GUIAS.compra.origen}
            alCerrar={() => setGuiaAbierta(false)}
          />
        )}
      </div>
    </section>
  );
}
