/**
 * «Nuestras redes» — dónde seguirnos y por dónde escribirnos.
 *
 * 25-sep-2026: Rafael pidió la sección («falta la sección de nuestras
 * redes»). Las redes salen de `src/data/redes.ts` (hoy, Instagram
 * @rafaelhf.realestate); al lado van WhatsApp y el correo, los dos canales
 * donde se atiende.
 *
 * No se muestran cifras de seguidores: ver las reglas en redes.ts. Cada
 * tarjeta es un enlace entero, grande y fácil de tocar en el teléfono.
 *
 * 28-sep-2026: debajo van los últimos reels, en fila (UltimosReels.tsx), por
 * pedido de Rafael. No se incrustan: cada tarjeta lleva la portada y abre el
 * reel en Instagram.
 */
import RevealGrupo from "@/components/RevealGrupo";
import UltimosReels from "@/components/UltimosReels";
import { IconoCorreo, IconoFlecha, IconoInstagram, IconoWhatsApp } from "@/components/Iconos";
import { CORREO, TELEFONO_VISIBLE, enlaceWhatsApp } from "@/data/contacto";
import type { Idioma } from "@/i18n/idioma";
import { redes } from "@/i18n/datos";
import "@/styles/redes.css";

/** Los textos, en los dos idiomas (docs/i18n.md). */
const TEXTOS = {
  es: {
    whatsapp: "Hola Rafael, te encontré en la página y quiero hablar contigo sobre: ",
    seguir: "Seguir",
    escribirWhatsApp: "Escribir",
    correo: "Correo",
    escribirCorreo: "Escribir",
    kicker: "Nuestras redes",
    titulo: "Síguenos y escríbenos",
    lede: "Elige el canal que prefieras: Instagram, WhatsApp o correo.",
  },
  en: {
    whatsapp: "Hi Rafael, I found your website and I'd like to talk to you about: ",
    seguir: "Follow",
    escribirWhatsApp: "Message",
    correo: "Email",
    escribirCorreo: "Write",
    kicker: "Follow us",
    titulo: "Follow along and get in touch",
    lede: "Choose the channel you prefer: Instagram, WhatsApp or email.",
  },
} satisfies Record<Idioma, Record<string, string>>;

export default function NuestrasRedes({ idioma = "es" }: { idioma?: Idioma }) {
  const t = TEXTOS[idioma];
  const { REDES } = redes(idioma);
  const canales = [
    ...REDES.map((r) => ({
      clave: r.id,
      clase: "red-instagram",
      href: r.url,
      externo: true,
      icono: <IconoInstagram size={30} />,
      nombre: r.nombre,
      dato: r.usuario,
      accion: t.seguir,
    })),
    {
      clave: "whatsapp",
      clase: "red-whatsapp",
      href: enlaceWhatsApp(t.whatsapp),
      externo: true,
      icono: <IconoWhatsApp size={28} />,
      nombre: "WhatsApp",
      dato: TELEFONO_VISIBLE,
      accion: t.escribirWhatsApp,
    },
    {
      clave: "correo",
      clase: "red-correo",
      href: `mailto:${CORREO}`,
      externo: false,
      icono: <IconoCorreo size={28} />,
      nombre: t.correo,
      dato: CORREO,
      accion: t.escribirCorreo,
    },
  ];

  return (
    <section className="section redes" id="redes" aria-labelledby="redes-titulo">
      <div className="section-shell">
        <div className="redes-cabeza">
          <p className="section-kicker">{t.kicker}</p>
          <h2 id="redes-titulo">{t.titulo}</h2>
          <p className="section-lede">{t.lede}</p>
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
        <UltimosReels idioma={idioma} />
      </div>
    </section>
  );
}
