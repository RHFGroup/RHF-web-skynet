import type { Proyecto } from "@/data/proyectos";
import { proyectos } from "@/i18n/datos";
import type { Idioma } from "@/i18n/idioma";

/**
 * El bloque del numeral 2.16.1 de la Circular 004 de 2024 de la SIC.
 *
 * Va debajo de toda pieza que publique precio. Muestra los tres datos que la
 * norma exige —área, precio de referencia y ubicación exacta— cada uno con la
 * etiqueta literal y la fuente de donde salió.
 *
 * Lo importante es lo que NO hace: no llama «área privada construida» a un
 * área que la fuente no calificó así. Cuando el promotor todavía no certifica
 * esa equivalencia, el bloque lo dice a la vista. Informar el estado real de
 * un dato es cumplir; renombrarlo para que parezca completo es lo que el
 * artículo 5 de la Ley 1480 de 2011 llama publicidad engañosa.
 *
 * En inglés (29-sep-2026, sitio en inglés) el bloque dice lo mismo, con el
 * sentido exacto: las normas se nombran igual y el precio va en pesos (COP)
 * con su fecha de corte. El proyecto llega ya en inglés: la fecha de corte
 * («September 23, 2026») y cada etiqueta de área, traducida con la literal de
 * la fuente entre paréntesis (src/data/en/). Aquí se muestran tal cual llegan
 * (docs/i18n.md).
 */

/**
 * Los textos del bloque. Los espacios al borde son parte del texto: lo separan
 * del dato o de la negrilla que va al lado, y así el HTML en español sale
 * idéntico al de antes.
 */
const TEXTOS = {
  es: {
    etiquetaBloque: "Información de la Circular 004 de la SIC",
    titulo: "Información obligatoria",
    norma:
      "Numeral 2.16.1 de la Circular Externa 004 de 2024 de la Superintendencia de Industria y Comercio.",
    precio: "Precio de referencia",
    hasta: (cifra: string) => ` a ${cifra}`,
    pesos: "pesos colombianos",
    // En español, como siempre: en plural aunque quede una sola unidad.
    unidadesCorte: (n: number) => " unidades disponibles · corte ",
    ubicacion: "Ubicación exacta del proyecto",
    area: "Área",
    rotula: "La fuente la rotula «",
    rotulaCierre: "». ",
    sobreArea: "Sobre el área.",
    avisoArea1:
      " Las cifras anteriores se publican con la etiqueta textual que usa cada fuente. El promotor",
    noCertificado: "no ha certificado todavía",
    avisoArea2: " que correspondan al",
    privadaConstruida: "área privada construida",
    avisoArea3:
      " en el sentido del artículo 3 de la Ley 675 de 2001, que es un concepto distinto del área construida. La certificación fue solicitada por escrito y esta página se actualizará al recibirla. No tome estas cifras como área privada construida certificada.",
    sobrePrecio: "Sobre el precio.",
    avisoPrecio:
      " Es un precio de referencia a la fecha de corte indicada, sujeto a disponibilidad al momento de la separación. No incluye gastos de escrituración, impuestos ni cuota de administración. Esta página no constituye oferta comercial en los términos del artículo 845 del Código de Comercio.",
    reservas: "Unidades que no se ofrecen.",
    conflictos: "Datos en los que las fuentes del promotor no coinciden.",
    conflictosTexto: "Se publican las dos versiones en lugar de elegir una:",
    precontractual: "Información precontractual.",
    precontractual1:
      " El numeral 2.16.2 de la misma Circular exige entregar al comprador, antes de contratar:",
    precontractual2: ". Solicítala al asesor: se entrega por escrito antes de cualquier separación.",
  },
  en: {
    etiquetaBloque: "Information required by SIC Circular 004",
    titulo: "Mandatory information",
    norma:
      "Section 2.16.1 of External Circular 004 of 2024 of the Superintendence of Industry and Commerce (SIC).",
    precio: "Reference price",
    hasta: (cifra: string) => ` to ${cifra}`,
    pesos: "(Colombian pesos)",
    unidadesCorte: (n: number) =>
      n === 1 ? " unit available · price as of " : " units available · price as of ",
    ubicacion: "Exact location of the project",
    area: "Area",
    rotula: "Source label: “",
    rotulaCierre: "”. ",
    sobreArea: "About the area.",
    avisoArea1: " The figures above are published with the exact label each source uses. The developer",
    noCertificado: "has not yet certified",
    avisoArea2: " that they correspond to the",
    privadaConstruida: "private built area (área privada construida)",
    avisoArea3:
      " as defined in Article 3 of Law 675 of 2001, which is a different concept from built area. The certification was requested in writing, and this page will be updated once it is received. Do not take these figures as certified private built area.",
    sobrePrecio: "About the price.",
    avisoPrecio:
      " It is a reference price as of the cut-off date shown, subject to availability at the time of reservation. It does not include deed costs (gastos de escrituración), taxes or HOA fees (cuota de administración). This page is not a commercial offer under Article 845 of the Colombian Commercial Code.",
    reservas: "Units not offered for sale.",
    conflictos: "Figures on which the developer's sources disagree.",
    conflictosTexto: "Both versions are published instead of choosing one:",
    precontractual: "Pre-contractual information.",
    precontractual1:
      " Section 2.16.2 of the same Circular requires that the buyer be given the following before signing any contract:",
    precontractual2: ". Ask your advisor for it: it is provided in writing before any reservation.",
  },
} satisfies Record<Idioma, Record<string, string | ((...datos: never[]) => string)>>;

export default function BloqueLegal({ p, idioma = "es" }: { p: Proyecto; idioma?: Idioma }) {
  const t = TEXTOS[idioma];
  const { datosDePieza, faltaPrecontractual, formatoPesos } = proyectos(idioma);
  const pieza = datosDePieza(p);
  const pendientes = faltaPrecontractual(p);

  if (!pieza.completo || !p.precio) return null;

  return (
    <section className="bloque-legal" aria-label={t.etiquetaBloque}>
      <h2>{t.titulo}</h2>
      <p className="bloque-legal-norma">{t.norma}</p>

      <dl className="bloque-legal-datos">
        <div>
          <dt>{t.precio}</dt>
          <dd>
            <strong>
              {formatoPesos(p.precio.desde)}
              {p.precio.hasta !== p.precio.desde && t.hasta(formatoPesos(p.precio.hasta))}
            </strong>{" "}
            {t.pesos}
            <span className="bloque-legal-fuente">
              {p.precio.unidadesDisponibles}
              {t.unidadesCorte(p.precio.unidadesDisponibles)}
              {p.precio.corte} ·{" "}
              {p.precio.fuente}
            </span>
          </dd>
        </div>

        <div>
          <dt>{t.ubicacion}</dt>
          <dd>
            <strong>{p.ubicacion}</strong>
            <span className="bloque-legal-fuente">{p.ubicacionFuente}</span>
          </dd>
        </div>

        <div>
          <dt>{t.area}</dt>
          <dd>
            <ul className="bloque-legal-areas">
              {p.tipologias.map((tipo) => (
                <li key={tipo.titulo}>
                  <strong>{tipo.area.valor}</strong> — {tipo.titulo}
                  <span className="bloque-legal-fuente">
                    {t.rotula}
                    {tipo.area.etiqueta}
                    {t.rotulaCierre}
                    {tipo.area.fuente}
                  </span>
                </li>
              ))}
            </ul>
          </dd>
        </div>
      </dl>

      {pieza.certificacionPendiente && (
        <p className="bloque-legal-aviso">
          <strong>{t.sobreArea}</strong>
          {t.avisoArea1}{" "}
          <strong>{t.noCertificado}</strong>
          {t.avisoArea2}{" "}
          <em>{t.privadaConstruida}</em>
          {t.avisoArea3}
        </p>
      )}

      <p className="bloque-legal-precio">
        <strong>{t.sobrePrecio}</strong>
        {t.avisoPrecio}
      </p>

      {p.reservas.length > 0 && (
        <div className="bloque-legal-reservas">
          <p>
            <strong>{t.reservas}</strong>
          </p>
          <ul>
            {p.reservas.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      {p.conflictos.length > 0 && (
        <div className="bloque-legal-conflictos">
          <p>
            <strong>{t.conflictos}</strong>{" "}
            {t.conflictosTexto}
          </p>
          <ul>
            {p.conflictos.map((c) => (
              <li key={c.dato}>
                <em>{c.dato}:</em>{" "}
                {c.versiones.map((v, i) => (
                  <span key={v.fuente}>
                    {i > 0 && " · "}
                    {v.valor} <span className="bloque-legal-fuente-inline">({v.fuente})</span>
                  </span>
                ))}
              </li>
            ))}
          </ul>
        </div>
      )}

      {pendientes.length > 0 && (
        <p className="bloque-legal-precontractual">
          <strong>{t.precontractual}</strong>
          {t.precontractual1}{" "}
          {pendientes.join(", ")}
          {t.precontractual2}
        </p>
      )}
    </section>
  );
}
