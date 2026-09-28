/**
 * «Nuestras redes» — dónde seguirnos y por dónde escribirnos.
 *
 * 25-sep-2026: Rafael pidió la sección («falta la sección de nuestras
 * redes»). Las redes salen de `src/data/redes.ts` (hoy, Instagram
 * @rafaelhf.realestate); al lado van WhatsApp y el correo, los dos canales
 * donde se atiende.
 *
 * No se incrustan publicaciones ni se muestran cifras de seguidores: ver las
 * reglas en redes.ts. Cada tarjeta es un enlace entero, grande y fácil de
 * tocar en el teléfono.
 */
import RevealGrupo from "@/components/RevealGrupo";
import { IconoCorreo, IconoFlecha, IconoInstagram, IconoWhatsApp } from "@/components/Iconos";
import { CORREO, TELEFONO_VISIBLE, enlaceWhatsApp } from "@/data/contacto";
import { REDES } from "@/data/redes";
import "@/styles/redes.css";

const WA_LINK = enlaceWhatsApp("Hola Rafael, te encontré en la página y quiero hablar contigo sobre: ");

export default function NuestrasRedes() {
  const canales = [
    ...REDES.map((r) => ({
      clave: r.id,
      clase: "red-instagram",
      href: r.url,
      externo: true,
      icono: <IconoInstagram size={30} />,
      nombre: r.nombre,
      dato: r.usuario,
      accion: "Seguir",
    })),
    {
      clave: "whatsapp",
      clase: "red-whatsapp",
      href: WA_LINK,
      externo: true,
      icono: <IconoWhatsApp size={28} />,
      nombre: "WhatsApp",
      dato: TELEFONO_VISIBLE,
      accion: "Escribir",
    },
    {
      clave: "correo",
      clase: "red-correo",
      href: `mailto:${CORREO}`,
      externo: false,
      icono: <IconoCorreo size={28} />,
      nombre: "Correo",
      dato: CORREO,
      accion: "Escribir",
    },
  ];

  return (
    <section className="section redes" id="redes" aria-labelledby="redes-titulo">
      <div className="section-shell">
        <div className="redes-cabeza">
          <p className="section-kicker">Nuestras redes</p>
          <h2 id="redes-titulo">Síguenos y escríbenos</h2>
          <p className="section-lede">Elige el canal que prefieras: Instagram, WhatsApp o correo.</p>
        </div>
        <RevealGrupo className="redes-lista">
          {/* La celda entra con el grupo; la tarjeta guarda sus propias
              transiciones para el hover. */}
          {canales.map((c, i) => (
            <div key={c.clave} className="red-celda" style={{ "--i": i } as React.CSSProperties}>
              <a
                className={`red ${c.clase}`}
                href={c.href}
                {...(c.externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                <span className="red-icono">{c.icono}</span>
                <span className="red-texto">
                  <strong>{c.nombre}</strong>
                  <span>{c.dato}</span>
                </span>
                <span className="red-accion">
                  {c.accion} <IconoFlecha size={16} />
                </span>
              </a>
            </div>
          ))}
        </RevealGrupo>
      </div>
    </section>
  );
}
