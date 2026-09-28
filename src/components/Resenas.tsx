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
import { fechaNoticia } from "@/data/noticias";
import { RESENAS } from "@/data/resenas";
import "@/styles/resenas.css";

const WA_RESENA = enlaceWhatsApp("Hola Rafael, quiero dejarte mi reseña sobre tu asesoría: ");

export default function Resenas() {
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
            <p className="section-kicker">Reseñas</p>
            <h2 id="resenas-titulo">¿Ya compraste con nosotros? Cuéntanos cómo te fue</h2>
            <p className="section-lede">
              Tu experiencia ayuda a otras familias a decidir con calma. Escríbenos tu reseña por WhatsApp y, con tu
              permiso, la publicamos aquí.
            </p>
          </div>
          <a className="btn-whatsapp resenas-boton" href={WA_RESENA} target="_blank" rel="noopener noreferrer">
            <IconoWhatsApp /> Dejar mi reseña
          </a>
        </Reveal>
      </div>
    </section>
  );
}
