import Link from "next/link";
import MenuMovil from "@/components/MenuMovil";
import SelectorIdioma from "@/components/SelectorIdioma";
import SelectorMoneda from "@/components/SelectorMoneda";
import { enlaceWhatsApp, saludoWhatsApp } from "@/data/contacto";
import { menuPrincipal, type EntradaMenu } from "@/data/navegacion";
import { ruta, type Idioma } from "@/i18n/idioma";
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
 * página. `blanca`: fondo blanco en vez de marfil (hoy, /asesor). `actual`:
 * la entrada del menú de la página en la que se está (aria-current).
 *
 * 29-sep-2026 (sitio en inglés): `idioma` pone el menú en el idioma de la
 * página y `rutaEs` es la ruta en español de la página en la que se está: con
 * ella, el selector de idioma (junto al de moneda) lleva a la otra versión.
 */
const TEXTOS = {
  es: { inicio: "RHF Living — inicio", menu: "Menú principal" },
  en: { inicio: "RHF Living — home", menu: "Main menu" },
} satisfies Record<Idioma, Record<string, string>>;

export default function CabeceraSitio({
  mensaje,
  blanca = false,
  actual,
  idioma = "es",
  rutaEs = "/",
}: {
  mensaje?: string;
  blanca?: boolean;
  actual?: EntradaMenu["id"];
  idioma?: Idioma;
  /** La ruta en español de la página actual («/vender», «/proyectos/doral-west»). */
  rutaEs?: string;
}) {
  const t = TEXTOS[idioma];
  const menu = menuPrincipal(idioma);
  return (
    <header className={blanca ? "nav nav-blanca" : "nav"}>
      <div className="nav-inner">
        <Link className="brand" href={ruta(idioma, "/")} aria-label={t.inicio}>
          <img src="/marca/rhf-living-oscuro.svg" alt="RHF Living" width="215" height="48" />
        </Link>
        <nav className="nav-links" aria-label={t.menu}>
          {menu.map((e) => (
            <Link
              key={e.id}
              href={e.href}
              className={e.destacado ? "nav-vender" : undefined}
              aria-current={e.id === actual ? "page" : undefined}
              data-evento={e.id === "vender" ? "click_quiero_vender" : undefined}
              data-ubicacion="menu"
            >
              {e.texto}
            </Link>
          ))}
        </nav>
        <div className="nav-herramientas">
          <SelectorMoneda idioma={idioma} />
          <SelectorIdioma idioma={idioma} rutaEs={rutaEs} />
        </div>
        <MenuMovil
          enlaces={menu.map((e) => ({
            href: e.href,
            texto: e.texto,
            destacado: e.destacado,
            id: e.id,
            actual: e.id === actual,
          }))}
          whatsapp={enlaceWhatsApp(mensaje ?? saludoWhatsApp(idioma))}
          idioma={idioma}
          rutaEs={rutaEs}
        />
      </div>
    </header>
  );
}
