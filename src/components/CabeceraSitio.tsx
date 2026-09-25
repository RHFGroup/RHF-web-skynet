import Link from "next/link";
import { enlaceWhatsApp, SALUDO_WHATSAPP } from "@/data/contacto";

/**
 * La barra de navegación de las páginas internas: la misma de la home, con
 * los enlaces apuntando a sus secciones y el «Escríbenos» con el mensaje ya
 * escrito para la página en la que está la persona.
 */
export default function CabeceraSitio({ mensaje = SALUDO_WHATSAPP }: { mensaje?: string }) {
  return (
    <header className="nav">
      <div className="nav-inner">
        <Link className="brand" href="/" aria-label="RHF Living — inicio">
          <img src="/marca/rhf-living-oscuro.svg" alt="RHF Living" width="215" height="48" />
        </Link>
        <nav className="nav-links" aria-label="Secciones">
          <Link href="/#mapa">El territorio</Link>
          <Link href="/asesor">Quién te asesora</Link>
          <Link href="/#cartera">Nuestra cartera</Link>
          <Link href="/#inmuebles">Inmuebles</Link>
          <a href="#contacto">Contacto</a>
        </nav>
        <a className="nav-cta" href={enlaceWhatsApp(mensaje)} target="_blank" rel="noopener noreferrer">
          Escríbenos
        </a>
      </div>
    </header>
  );
}
