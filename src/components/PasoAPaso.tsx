"use client";

/**
 * «Cómo comprar con nosotros» — la línea de tiempo del paso a paso.
 *
 * 25-sep-2026 (pedido de Rafael): cada paso dice quién te acompaña —el
 * asesor, el estudio jurídico o los dos— y la sección es más dinámica. La
 * línea baja por el centro en escritorio, con los pasos a un lado y al otro
 * (a la izquierda en el teléfono); se llena a medida que la persona baja, y
 * cada paso entra desde su lado al llegar y queda encendido. Los pasos del estudio jurídico
 * llevan su color, para que se lea de un vistazo quién hace qué.
 *
 * Los pasos salen de src/data/proceso.ts y solo se publican los confirmados;
 * en las vistas previas se ven todos, con un solo aviso de propuesta para la
 * sección. Si ninguno está confirmado, en producción la sección no aparece.
 *
 * El avance se mide en el evento de scroll (sin IntersectionObserver, que se
 * congela en pestañas de fondo). Con menos movimiento, todo aparece dibujado.
 */
import { useEffect, useRef, useState } from "react";
import FormularioGuia from "@/components/FormularioGuia";
import IconoProceso, { AvisoPropuesta } from "@/components/IconoProceso";
import { IconoEscudo, IconoPersona, IconoWhatsApp } from "@/components/Iconos";
import { enlaceWhatsApp } from "@/data/contacto";
import { COMPRA_DESDE_EXTERIOR, GUIAS, PASOS, type Quien } from "@/data/proceso";
import { MODO_REVISION, seMuestra } from "@/lib/revision";
import { usePrefersReducedMotion } from "@/lib/motion";
import "@/styles/proceso.css";

const QUIEN: Record<Quien, { texto: string; icono: React.ReactNode }> = {
  asesor: { texto: "Asesor", icono: <IconoPersona size={14} /> },
  juridico: { texto: "Estudio jurídico", icono: <IconoEscudo size={14} /> },
  ambos: { texto: "Asesor y estudio jurídico", icono: <IconoEscudo size={14} /> },
};

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
      // 0 cuando la lista asoma por abajo; 1 cuando su final pasa el 60 %.
      const p = (vh * 0.7 - r.top) / (r.height + vh * 0.1);
      // Solo avanza: un paso que ya se leyó no se apaga al volver a subir.
      setAvance((a) => Math.max(a, Math.min(1, p)));
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
        <div className="pa-cabeza">
          <div>
            <p className="section-kicker">Paso a paso</p>
            <h2 id="pa-titulo">Cómo comprar con nosotros</h2>
            <p className="section-lede">Sabes en qué paso vas, qué sigue y quién te acompaña.</p>
          </div>
          <ul className="pa-leyenda" aria-label="Quién te acompaña">
            <li className="pa-quien pa-quien-asesor">
              <IconoPersona size={14} /> Asesor
            </li>
            <li className="pa-quien pa-quien-juridico">
              <IconoEscudo size={14} /> Estudio jurídico
            </li>
          </ul>
        </div>
        <AvisoPropuesta pendiente={pasos.some((p) => !p.confirmado)} nota="todos los pasos" />

        <ol
          className="pa-linea"
          ref={lista}
          style={{ "--avance": (reduced ? 1 : avance).toFixed(3) } as React.CSSProperties}
        >
          {pasos.map((p, i) => {
            const activo = recorrido > i + 0.15;
            return (
              <li
                key={p.titulo}
                className={
                  "pa-paso pa-" + (i % 2 === 0 ? "izq" : "der") + " pa-es-" + p.quien + (activo ? " activo" : "")
                }
              >
                <span className="pa-punto" aria-hidden="true">
                  <IconoProceso icono={p.icono} size={20} />
                </span>
                <div className="pa-tarjeta">
                  <div className="pa-tarjeta-cabeza">
                    <span className="pa-numero">{String(i + 1).padStart(2, "0")}</span>
                    <span className={"pa-quien pa-quien-" + (p.quien === "asesor" ? "asesor" : "juridico")}>
                      {QUIEN[p.quien].icono} {QUIEN[p.quien].texto}
                    </span>
                  </div>
                  <h3>{p.titulo}</h3>
                  <p>{p.texto}</p>
                  {/* Nota para Rafael: solo en las vistas previas. */}
                  {p.pendiente && MODO_REVISION && !p.confirmado && <p className="pa-pendiente">{p.pendiente}</p>}
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
