"use client";

/**
 * El menú del teléfono: un botón de tres líneas que abre, debajo de la barra,
 * la lista de secciones y un botón de WhatsApp.
 *
 * 25-sep-2026: en el teléfono el menú no tenía enlaces (se ocultaban a menos
 * de 900 px) y solo quedaba «Escríbenos». Rafael pidió la web «más ordenada a
 * nivel móvil». Los enlaces entran uno detrás de otro al abrir; se cierra con
 * el mismo botón, con Escape o al elegir una sección. Mientras está abierto,
 * la página de atrás no se desplaza.
 *
 * 29-sep-2026 (sitio en inglés): los textos van en el idioma de la página y,
 * junto al selector de moneda, va el de idioma (en la barra del teléfono no
 * cabe). `rutaEs` es la ruta en español de la página en la que se está.
 */
import { useEffect, useState } from "react";
import { IconoCerrar, IconoMenu, IconoWhatsApp } from "@/components/Iconos";
import SelectorIdioma from "@/components/SelectorIdioma";
import SelectorMoneda from "@/components/SelectorMoneda";
import type { Idioma } from "@/i18n/idioma";
import "@/styles/menu-movil.css";

/**
 * `destacado`: «Quiero vender / consignar», en otro color (29-sep-2026).
 * `actual`: la página en la que se está (aria-current).
 */
export type EnlaceMenu = { href: string; texto: string; destacado?: boolean; id?: string; actual?: boolean };

const TEXTOS = {
  es: {
    abrir: "Abrir el menú",
    cerrar: "Cerrar el menú",
    secciones: "Secciones",
    whatsapp: "Escríbenos por WhatsApp",
  },
  en: {
    abrir: "Open menu",
    cerrar: "Close menu",
    secciones: "Sections",
    whatsapp: "Message us on WhatsApp",
  },
} satisfies Record<Idioma, Record<string, string>>;

export default function MenuMovil({
  enlaces,
  whatsapp,
  idioma = "es",
  rutaEs = "/",
}: {
  enlaces: EnlaceMenu[];
  whatsapp: string;
  idioma?: Idioma;
  /** La ruta en español de la página actual, para el selector de idioma. */
  rutaEs?: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const t = TEXTOS[idioma];

  useEffect(() => {
    if (!abierto) return;
    const alTecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierto(false);
    };
    const alAgrandar = () => {
      if (window.innerWidth > 900) setAbierto(false);
    };
    document.addEventListener("keydown", alTecla);
    window.addEventListener("resize", alAgrandar);
    document.documentElement.classList.add("menu-abierto");
    return () => {
      document.removeEventListener("keydown", alTecla);
      window.removeEventListener("resize", alAgrandar);
      document.documentElement.classList.remove("menu-abierto");
    };
  }, [abierto]);

  return (
    <>
      <button
        type="button"
        className={"menu-movil-boton" + (abierto ? " abierto" : "")}
        aria-expanded={abierto}
        aria-controls="menu-movil"
        aria-label={abierto ? t.cerrar : t.abrir}
        onClick={() => setAbierto((a) => !a)}
      >
        {abierto ? <IconoCerrar size={22} /> : <IconoMenu size={22} />}
      </button>
      <div id="menu-movil" className={"menu-movil" + (abierto ? " abierto" : "")} inert={!abierto}>
        <nav aria-label={t.secciones}>
          {enlaces.map((e, i) => (
            <a
              key={e.href}
              href={e.href}
              className={e.destacado ? "menu-movil-vender" : undefined}
              aria-current={e.actual ? "page" : undefined}
              data-evento={e.id === "vender" ? "click_quiero_vender" : undefined}
              data-ubicacion="menu-movil"
              style={{ "--i": i } as React.CSSProperties}
              onClick={() => setAbierto(false)}
            >
              {e.texto}
            </a>
          ))}
        </nav>
        <SelectorMoneda className="menu-movil-moneda" idioma={idioma} />
        <SelectorIdioma className="menu-movil-idioma" idioma={idioma} rutaEs={rutaEs} />
        <a
          className="menu-movil-wa"
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setAbierto(false)}
        >
          <IconoWhatsApp size={20} />
          {` ${t.whatsapp}`}
        </a>
      </div>
    </>
  );
}
