"use client";

/**
 * El menú de la home.
 *
 * Sobre la portada va transparente —logo claro, enlaces en blanco— para que
 * las imágenes lleguen hasta arriba. Apenas la página baja, se vuelve blanco
 * con desenfoque y el logo oscuro. En el borde de abajo, una línea camel se
 * llena a medida que se lee la página.
 *
 * 29-sep-2026 (informe de Luciano): los enlaces son el menú principal
 * (src/data/navegacion.ts) —Inicio, Proyectos, «Quiero vender / consignar»
 * destacado e Inteligencia de mercado— y a la derecha el selector de moneda.
 * En el teléfono, el botón de tres líneas abre el mismo menú (MenuMovil).
 *
 * Es fijo en vez de pegajoso (`sticky`): la portada empieza debajo de él, en
 * el borde de la pantalla. La altura no cambia al bajar, así `--nav-h` sigue
 * valiendo para los elementos que se anclan debajo del menú.
 */
import { useEffect, useRef, useState } from "react";
import MenuMovil from "@/components/MenuMovil";
import SelectorMoneda from "@/components/SelectorMoneda";
import { MENU_PRINCIPAL } from "@/data/navegacion";
import "@/styles/nav-inicio.css";
import "@/styles/menu-principal.css";

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
          {/* El logo claro es lo primero que se ve sobre la portada (y lo que
              Lighthouse mide como elemento principal): va con prioridad. El
              oscuro solo aparece al bajar. En las páginas de proyecto y de
              apartamento el logo no lleva prioridad: allí lo principal es la
              primera foto (PortadaGaleria), y el logo le quitaba el turno. */}
          <img
            className="brand-claro"
            src="/marca/rhf-living.svg"
            alt="RHF Living"
            width="215"
            height="48"
            fetchPriority="high"
          />
          <img
            className="brand-oscuro"
            src="/marca/rhf-living-oscuro.svg"
            alt="RHF Living"
            width="215"
            height="48"
            fetchPriority="low"
          />
        </a>
        <nav className="nav-links" aria-label="Menú principal">
          {MENU_PRINCIPAL.map((e) => (
            <a
              key={e.id}
              href={e.enHome ?? e.href}
              className={e.destacado ? "nav-vender" : undefined}
              data-evento={e.id === "vender" ? "click_quiero_vender" : undefined}
              data-ubicacion="menu"
            >
              {e.texto}
            </a>
          ))}
        </nav>
        <div className="nav-herramientas">
          <SelectorMoneda />
        </div>
        <MenuMovil
          enlaces={MENU_PRINCIPAL.map((e) => ({ href: e.enHome ?? e.href, texto: e.texto, destacado: e.destacado, id: e.id }))}
          whatsapp={whatsapp}
        />
      </div>
      <div className="nav-avance" ref={barra} aria-hidden="true" />
    </header>
  );
}
