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
 */
import { useEffect, useState } from "react";
import { IconoCerrar, IconoMenu, IconoWhatsApp } from "@/components/Iconos";
import SelectorMoneda from "@/components/SelectorMoneda";
import "@/styles/menu-movil.css";

/**
 * `destacado`: «Quiero vender / consignar», en otro color (29-sep-2026).
 * `actual`: la página en la que se está (aria-current).
 */
export type EnlaceMenu = { href: string; texto: string; destacado?: boolean; id?: string; actual?: boolean };

export default function MenuMovil({ enlaces, whatsapp }: { enlaces: EnlaceMenu[]; whatsapp: string }) {
  const [abierto, setAbierto] = useState(false);

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
        aria-label={abierto ? "Cerrar el menú" : "Abrir el menú"}
        onClick={() => setAbierto((a) => !a)}
      >
        {abierto ? <IconoCerrar size={22} /> : <IconoMenu size={22} />}
      </button>
      <div id="menu-movil" className={"menu-movil" + (abierto ? " abierto" : "")} inert={!abierto}>
        <nav aria-label="Secciones">
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
        <SelectorMoneda className="menu-movil-moneda" />
        <a
          className="menu-movil-wa"
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setAbierto(false)}
        >
          <IconoWhatsApp size={20} /> Escríbenos por WhatsApp
        </a>
      </div>
    </>
  );
}
