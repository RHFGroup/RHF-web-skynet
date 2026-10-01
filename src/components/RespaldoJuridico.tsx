import Reveal from "@/components/Reveal";
import IconoProceso, { AvisoPropuesta } from "@/components/IconoProceso";
import { IconoEscudo, IconoWhatsApp } from "@/components/Iconos";
import { enlaceWhatsApp } from "@/data/contacto";
import type { Idioma } from "@/i18n/idioma";
import { proceso } from "@/i18n/datos";
import { seMuestra } from "@/lib/revision";
import "@/styles/proceso.css";

/**
 * «Compras con respaldo jurídico en cada paso» — el estudio jurídico propio de
 * RHF Living, confirmado por Rafael el 24-sep-2026.
 *
 * Fondo marino y texto claro: es una garantía, no letra pequeña. Los
 * servicios salen de src/data/proceso.ts y solo se publican los que Rafael
 * confirme; en las vistas previas se ven todos.
 *
 * 25-sep-2026 (pedido de Rafael): un solo «por confirmar» para toda la
 * sección —antes iba uno por tarjeta— y un solo llamado a la acción, al pie.
 */

/**
 * Los textos, en los dos idiomas (docs/i18n.md). Cada uno es un nodo de texto
 * tal como queda en el HTML, con sus espacios de borde: así el español sale
 * idéntico. «Estudio jurídico» es «legal team» en inglés.
 */
const TEXTOS = {
  es: {
    consulta: "Hola Rafael, quiero hacerle una consulta al estudio jurídico sobre: ",
    kicker: " Estudio jurídico propio",
    notaPropuesta: "toda la sección",
    responsable: "Responsable del estudio jurídico · tarjeta profesional ",
    pregunta: "¿Tienes una duda legal sobre un proyecto o un documento?",
    boton: " Consulta al estudio jurídico",
  },
  en: {
    consulta: "Hi Rafael, I'd like to ask the legal team about: ",
    kicker: " Our own legal team",
    notaPropuesta: "the whole section",
    responsable: "Head of the legal team · professional license no. ",
    pregunta: "Have a legal question about a project or a document?",
    boton: " Ask our legal team",
  },
} satisfies Record<Idioma, Record<string, string>>;

export default function RespaldoJuridico({ idioma = "es" }: { idioma?: Idioma }) {
  const t = TEXTOS[idioma];
  const e = proceso(idioma).ESTUDIO_JURIDICO;
  const servicios = e.servicios.filter(seMuestra);
  const conFrase = seMuestra(e.frase);
  const pendiente = (conFrase && !e.frase.confirmado) || servicios.some((s) => !s.confirmado);

  return (
    <section className="rj" id="respaldo-juridico" aria-labelledby="rj-titulo">
      <div className="section-shell rj-shell">
        <Reveal className="rj-cabeza" variant="up">
          <p className="rj-kicker">
            <IconoEscudo size={18} />
            {t.kicker}
          </p>
          <h2 id="rj-titulo">{e.titular}</h2>
          <p className="rj-frase">{conFrase ? e.frase.texto : e.base}</p>
          <AvisoPropuesta pendiente={pendiente} nota={t.notaPropuesta} idioma={idioma} />
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
              <span>
                {t.responsable}
                {e.responsable.tarjetaProfesional}
              </span>
            </p>
          </div>
        )}

        {/* El único llamado a la acción de la sección. */}
        <Reveal className="rj-cta" variant="up" delay={200}>
          <p>{t.pregunta}</p>
          <a className="rj-cta-boton" href={enlaceWhatsApp(t.consulta)} target="_blank" rel="noopener noreferrer">
            <IconoWhatsApp size={18} />
            {t.boton}
          </a>
        </Reveal>
      </div>
    </section>
  );
}
