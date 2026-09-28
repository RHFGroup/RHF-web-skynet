import Link from "next/link";
import MenuMovil from "@/components/MenuMovil";
import { enlaceWhatsApp, SALUDO_WHATSAPP } from "@/data/contacto";
import { SECCIONES_HOME } from "@/data/navegacion";

/**
 * A dónde lleva cada sección desde una página interna: la home con su ancla,
 * salvo el asesor (tiene página propia) y el contacto (cada página interna
 * tiene su formulario al final).
 */
function destino(ancla: string): string {
  if (ancla === "asesor") return "/asesor";
  if (ancla === "contacto") return "#contacto";
  return `/#${ancla}`;
}

/**
 * La barra de navegación de las páginas internas: la misma de la home, con
 * los enlaces apuntando a sus secciones y el «Escríbenos» con el mensaje ya
 * escrito para la página en la que está la persona.
 *
 * `blanca`: fondo blanco en vez de marfil, para las páginas que van en azul y
 * blanco como la home (hoy, /asesor).
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
        <nav className="nav-links" aria-label="Secciones">
          {SECCIONES_HOME.filter((s) => !s.soloMovil).map((s) =>
            s.ancla === "contacto" ? (
              <a key={s.ancla} href="#contacto">
                {s.texto}
              </a>
            ) : (
              <Link key={s.ancla} href={destino(s.ancla)}>
                {s.texto}
              </Link>
            ),
          )}
        </nav>
        <a className="nav-cta" href={enlaceWhatsApp(mensaje)} target="_blank" rel="noopener noreferrer">
          Escríbenos
        </a>
        <MenuMovil
          enlaces={SECCIONES_HOME.map((s) => ({ href: destino(s.ancla), texto: s.texto }))}
          whatsapp={enlaceWhatsApp(mensaje)}
        />
      </div>
    </header>
  );
}
