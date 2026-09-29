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
 *
 * 29-sep-2026 (sitio en inglés): el menú va en el idioma de la página y, junto
 * al selector de moneda, va el de idioma (ES | EN). Las anclas de la home son
 * las mismas en los dos idiomas, así que el logo y las entradas de la home
 * siguen llevando a `#inicio` y `#proyectos`.
 */
import { useEffect, useRef, useState } from "react";
import MenuMovil from "@/components/MenuMovil";
import SelectorIdioma from "@/components/SelectorIdioma";
import SelectorMoneda from "@/components/SelectorMoneda";
import { menuPrincipal } from "@/data/navegacion";
import type { Idioma } from "@/i18n/idioma";
import "@/styles/nav-inicio.css";
import "@/styles/menu-principal.css";

const TEXTOS = {
  es: { inicio: "RHF Living — inicio", menu: "Menú principal" },
  en: { inicio: "RHF Living — home", menu: "Main menu" },
} satisfies Record<Idioma, Record<string, string>>;

export default function NavInicio({ whatsapp, idioma = "es" }: { whatsapp: string; idioma?: Idioma }) {
  const [solida, setSolida] = useState(false);
  const barra = useRef<HTMLDivElement>(null);
  const t = TEXTOS[idioma];
  const menu = menuPrincipal(idioma);

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
        <a className="brand" href="#inicio" aria-label={t.inicio}>
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
        <nav className="nav-links" aria-label={t.menu}>
          {menu.map((e) => (
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
          <SelectorMoneda idioma={idioma} />
          <SelectorIdioma idioma={idioma} rutaEs="/" />
        </div>
        <MenuMovil
          enlaces={menu.map((e) => ({ href: e.enHome ?? e.href, texto: e.texto, destacado: e.destacado, id: e.id }))}
          whatsapp={whatsapp}
          idioma={idioma}
          rutaEs="/"
        />
      </div>
      <div className="nav-avance" ref={barra} aria-hidden="true" />
    </header>
  );
}
