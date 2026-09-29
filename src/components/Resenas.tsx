/**
 * Reseñas (28-sep-2026, pedido de Rafael).
 *
 * Hoy no hay reseñas publicables, así que la sección es chica: invita a
 * quien ya compró con nosotros a dejar la suya por WhatsApp. No lleva
 * reseñas de ejemplo: una reseña inventada es publicidad engañosa.
 *
 * Cuando haya reseñas reales con autorización escrita, van en
 * src/data/resenas.ts y aparecen solas, arriba de la invitación.
 */
import Reveal from "@/components/Reveal";
import { IconoWhatsApp } from "@/components/Iconos";
import { enlaceWhatsApp } from "@/data/contacto";
import type { Idioma } from "@/i18n/idioma";
import { noticias, resenas } from "@/i18n/datos";
import "@/styles/resenas.css";

/**
 * Los textos, en los dos idiomas (docs/i18n.md). Cada uno es un nodo de texto
 * tal como queda en el HTML, con sus espacios de borde: así el español sale
 * idéntico.
 */
const TEXTOS = {
  es: {
    whatsapp: "Hola Rafael, quiero dejarte mi reseña sobre tu asesoría: ",
    kicker: "Reseñas",
    titulo: "¿Ya compraste con nosotros? Cuéntanos cómo te fue",
    lede: "Tu experiencia ayuda a otras familias a decidir con calma. Escríbenos tu reseña por WhatsApp y, con tu permiso, la publicamos aquí.",
    boton: " Dejar mi reseña",
  },
  en: {
    whatsapp: "Hi Rafael, I'd like to leave you a review of your advisory service: ",
    kicker: "Reviews",
    titulo: "Already bought with us? Tell us how it went",
    lede: "Your experience helps other families decide with peace of mind. Send us your review on WhatsApp and, with your permission, we'll publish it here.",
    boton: " Leave my review",
  },
} satisfies Record<Idioma, Record<string, string>>;

export default function Resenas({ idioma = "es" }: { idioma?: Idioma }) {
  const t = TEXTOS[idioma];
  const { RESENAS } = resenas(idioma);
  const { fechaNoticia } = noticias(idioma);
  return (
    <section className="section resenas" id="resenas" aria-labelledby="resenas-titulo">
      <div className="section-shell">
        {RESENAS.length > 0 && (
          <ul className="resenas-lista">
            {RESENAS.map((r) => (
              <li key={`${r.nombre}-${r.fecha}`} className="resena">
                <blockquote>
                  <p>{r.texto}</p>
                </blockquote>
                <p className="resena-autor">
                  <strong>{r.nombre}</strong>
                  {r.sobre && <span> · {r.sobre}</span>}
                  <span> · {fechaNoticia(r.fecha)}</span>
                </p>
              </li>
            ))}
          </ul>
        )}
        <Reveal className="resenas-invitacion" variant="up">
          <span className="resenas-comillas" aria-hidden="true">
            “
          </span>
          <div className="resenas-texto">
            <p className="section-kicker">{t.kicker}</p>
            <h2 id="resenas-titulo">{t.titulo}</h2>
            <p className="section-lede">{t.lede}</p>
          </div>
          <a
            className="btn-whatsapp resenas-boton"
            href={enlaceWhatsApp(t.whatsapp)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <IconoWhatsApp />
            {t.boton}
          </a>
        </Reveal>
      </div>
    </section>
  );
}
