import Link from "next/link";
import MenuMovil from "@/components/MenuMovil";
import SelectorMoneda from "@/components/SelectorMoneda";
import { enlaceWhatsApp, SALUDO_WHATSAPP } from "@/data/contacto";
import { MENU_PRINCIPAL } from "@/data/navegacion";
import "@/styles/menu-principal.css";

/**
 * La barra de navegación de las páginas internas.
 *
 * 29-sep-2026 (informe de Luciano): el menú deja de repetir las secciones de
 * la home y lleva cuatro entradas —Inicio, Proyectos, «Quiero vender /
 * consignar» como botón destacado e Inteligencia de mercado— y, a la derecha,
 * el selector de moneda. WhatsApp sigue a un toque: el botón flotante de cada
 * página y el del menú del teléfono.
 *
 * `mensaje`: el texto ya escrito del WhatsApp del menú del teléfono, según la
 * página. `blanca`: fondo blanco en vez de marfil (hoy, /asesor).
 */
export default function CabeceraSitio({
  mensaje = SALUDO_WHATSAPP,
  blanca = false,
}: {
  mensaje?: string;
  blanca?: boolean;
}) {
  return (
    <header className={blanca ? "nav nav-blanca" : "nav"}>
      <div className="nav-inner">
        <Link className="brand" href="/" aria-label="RHF Living — inicio">
          <img src="/marca/rhf-living-oscuro.svg" alt="RHF Living" width="215" height="48" />
        </Link>
        <nav className="nav-links" aria-label="Menú principal">
          {MENU_PRINCIPAL.map((e) => (
            <Link
              key={e.id}
              href={e.href}
              className={e.destacado ? "nav-vender" : undefined}
              data-evento={e.id === "vender" ? "click_quiero_vender" : undefined}
              data-ubicacion="menu"
            >
              {e.texto}
            </Link>
          ))}
        </nav>
        <div className="nav-herramientas">
          <SelectorMoneda />
        </div>
        <MenuMovil
          enlaces={MENU_PRINCIPAL.map((e) => ({ href: e.href, texto: e.texto, destacado: e.destacado, id: e.id }))}
          whatsapp={enlaceWhatsApp(mensaje)}
        />
      </div>
    </header>
  );
}
