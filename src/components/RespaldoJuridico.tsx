import Reveal from "@/components/Reveal";
import IconoProceso, { EtiquetaPropuesta } from "@/components/IconoProceso";
import { IconoEscudo } from "@/components/Iconos";
import { ESTUDIO_JURIDICO } from "@/data/proceso";
import { seMuestra } from "@/lib/revision";
import "@/styles/proceso.css";

/**
 * «Compras con respaldo jurídico en cada paso» — el estudio jurídico propio de
 * RHF Living, confirmado por Rafael el 24-sep-2026.
 *
 * Fondo marino y texto claro: es una garantía, no letra pequeña. Los
 * servicios salen de src/data/proceso.ts y solo se publican los que Rafael
 * confirme; en las vistas previas se ven todos, marcados como propuesta.
 */
export default function RespaldoJuridico() {
  const e = ESTUDIO_JURIDICO;
  const servicios = e.servicios.filter(seMuestra);
  const conFrase = seMuestra(e.frase);

  return (
    <section className="rj" id="respaldo-juridico" aria-labelledby="rj-titulo">
      <div className="section-shell rj-shell">
        <Reveal className="rj-cabeza" variant="up">
          <p className="rj-kicker">
            <IconoEscudo size={18} /> Estudio jurídico propio
          </p>
          <h2 id="rj-titulo">{e.titular}</h2>
          <p className="rj-frase">
            {conFrase ? e.frase.texto : e.base}
            {conFrase && <EtiquetaPropuesta confirmado={e.frase.confirmado} />}
          </p>
        </Reveal>

        {servicios.length > 0 && (
          <ul className="rj-servicios">
            {servicios.map((s, i) => (
              <li key={s.titulo}>
                <Reveal variant="up" delay={i * 110} className="rj-servicio">
                  <span className="rj-icono">
                    <IconoProceso icono={s.icono} />
                  </span>
                  <h3>{s.titulo}</h3>
                  <p>{s.texto}</p>
                  <EtiquetaPropuesta confirmado={s.confirmado} />
                </Reveal>
              </li>
            ))}
          </ul>
        )}

        {e.responsable && (
          <div className="rj-responsable">
            {e.responsable.foto && (
              <img src={e.responsable.foto} alt={e.responsable.nombre} width={72} height={72} loading="lazy" />
            )}
            <p>
              <strong>{e.responsable.nombre}</strong>
              <span>Responsable del estudio jurídico · tarjeta profesional {e.responsable.tarjetaProfesional}</span>
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
