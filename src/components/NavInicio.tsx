"use client";

/**
 * El menú de la home.
 *
 * Sobre la portada va transparente —logo claro, enlaces en blanco— para que
 * las imágenes lleguen hasta arriba. Apenas la página baja, se vuelve blanco
 * con desenfoque y el logo oscuro. En el borde de abajo, una línea camel se
 * llena a medida que se lee la página.
 *
 * Los enlaces siguen el orden de la home (25-sep-2026): proyectos,
 * apartamentos, el territorio, quién te asesora y contacto.
 *
 * Es fijo en vez de pegajoso (`sticky`): la portada empieza debajo de él, en
 * el borde de la pantalla. La altura no cambia al bajar, así `--nav-h` sigue
 * valiendo para los elementos que se anclan debajo del menú.
 */
import { useEffect, useRef, useState } from "react";
import "@/styles/nav-inicio.css";

export default function NavInicio({ whatsapp }: { whatsapp: string }) {
  const [solida, setSolida] = useState(false);
  const barra = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ultimo = 0;
    let pendiente = 0;
    const medir = () => {
      const y = window.scrollY;
      setSolida(y > 24);
      const total = document.documentElement.scrollHeight - window.innerHeight;
      barra.current?.style.setProperty("--avance", String(total > 0 ? Math.min(1, y / total) : 0));
    };
    const alMover = () => {
      // La última posición siempre se mide, aunque llegue entre dos cuadros.
      window.clearTimeout(pendiente);
      pendiente = window.setTimeout(medir, 60);
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
  }, []);

  return (
    <header className={"nav nav-inicio" + (solida ? " nav-solida" : "")}>
      <div className="nav-inner">
        <a className="brand" href="#inicio" aria-label="RHF Living — inicio">
          <img className="brand-claro" src="/marca/rhf-living.svg" alt="RHF Living" width="215" height="48" />
          <img className="brand-oscuro" src="/marca/rhf-living-oscuro.svg" alt="RHF Living" width="215" height="48" />
        </a>
        <nav className="nav-links" aria-label="Secciones">
          <a href="#cartera">Proyectos</a>
          <a href="#inmuebles">Apartamentos</a>
          <a href="#mapa">El territorio</a>
          <a href="#asesor">Quién te asesora</a>
          <a href="#contacto">Contacto</a>
        </nav>
        <a className="nav-cta" href={whatsapp} target="_blank" rel="noopener noreferrer">
          Escríbenos
        </a>
      </div>
      <div className="nav-avance" ref={barra} aria-hidden="true" />
    </header>
  );
}
