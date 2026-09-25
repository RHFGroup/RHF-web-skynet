import Link from "next/link";
import { enlaceWhatsApp, SALUDO_WHATSAPP } from "@/data/contacto";

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
          <Link href="/#cartera">Proyectos</Link>
          <Link href="/#inmuebles">Apartamentos</Link>
          <Link href="/#mapa">El territorio</Link>
          <Link href="/asesor">Quién te asesora</Link>
          <a href="#contacto">Contacto</a>
        </nav>
        <a className="nav-cta" href={enlaceWhatsApp(mensaje)} target="_blank" rel="noopener noreferrer">
          Escríbenos
        </a>
      </div>
    </header>
  );
}
