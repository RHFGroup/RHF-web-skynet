"use client";

/**
 * «Te asesoro si…» — una pestaña por tipo de comprador (prompt 5), cada una
 * con su frase y un botón de WhatsApp con el mensaje ya escrito para ese caso.
 *
 * Pestañas accesibles: flechas izquierda y derecha, Inicio y Fin. Los datos
 * llegan filtrados desde el servidor (solo lo que `seMuestra`).
 */
import { useRef, useState } from "react";
import { EtiquetaPropuesta } from "@/components/IconoProceso";
import { IconoWhatsApp } from "@/components/Iconos";
import { enlaceWhatsApp } from "@/data/contacto";
import type { Perfil } from "@/data/asesor";

export default function PerfilesAsesor({ perfiles }: { perfiles: Perfil[] }) {
  const [activo, setActivo] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  if (perfiles.length === 0) return null;
  const p = perfiles[Math.min(activo, perfiles.length - 1)];

  const alTeclado = (e: React.KeyboardEvent, i: number) => {
    const n = perfiles.length;
    let j = -1;
    if (e.key === "ArrowRight") j = (i + 1) % n;
    else if (e.key === "ArrowLeft") j = (i - 1 + n) % n;
    else if (e.key === "Home") j = 0;
    else if (e.key === "End") j = n - 1;
    if (j < 0) return;
    e.preventDefault();
    setActivo(j);
    tabs.current[j]?.focus();
  };

  return (
    <div className="asesor-perfiles">
      <h3 className="asesor-bloque-titulo">Te asesoro si…</h3>
      <div className="asesor-perfiles-tabs" role="tablist" aria-label="Tipo de comprador">
        {perfiles.map((x, i) => (
          <button
            key={x.id}
            ref={(el) => {
              tabs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`perfil-tab-${x.id}`}
            aria-selected={i === activo}
            aria-controls="perfil-panel"
            tabIndex={i === activo ? 0 : -1}
            className={i === activo ? "activa" : undefined}
            onClick={() => setActivo(i)}
            onKeyDown={(e) => alTeclado(e, i)}
          >
            {x.titulo}
          </button>
        ))}
      </div>
      <div className="asesor-perfil" id="perfil-panel" role="tabpanel" aria-labelledby={`perfil-tab-${p.id}`}>
        <p key={p.id} className="asesor-perfil-texto">
          {p.texto}
          <EtiquetaPropuesta confirmado={p.confirmado} />
        </p>
        <a className="btn-whatsapp" href={enlaceWhatsApp(p.mensaje)} target="_blank" rel="noopener noreferrer">
          <IconoWhatsApp /> Escríbeme con este mensaje
        </a>
      </div>
    </div>
  );
}
