import {
  datosDePieza,
  faltaPrecontractual,
  formatoPesos,
  type Proyecto,
} from "@/data/proyectos";

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
 */
export default function BloqueLegal({ p }: { p: Proyecto }) {
  const pieza = datosDePieza(p);
  const pendientes = faltaPrecontractual(p);

  if (!pieza.completo || !p.precio) return null;

  return (
    <section className="bloque-legal" aria-label="Información de la Circular 004 de la SIC">
      <h2>Información obligatoria</h2>
      <p className="bloque-legal-norma">
        Numeral 2.16.1 de la Circular Externa 004 de 2024 de la Superintendencia
        de Industria y Comercio.
      </p>

      <dl className="bloque-legal-datos">
        <div>
          <dt>Precio de referencia</dt>
          <dd>
            <strong>
              {formatoPesos(p.precio.desde)}
              {p.precio.hasta !== p.precio.desde && ` a ${formatoPesos(p.precio.hasta)}`}
            </strong>{" "}
            pesos colombianos
            <span className="bloque-legal-fuente">
              {p.precio.unidadesDisponibles} unidades disponibles · corte {p.precio.corte} ·{" "}
              {p.precio.fuente}
            </span>
          </dd>
        </div>

        <div>
          <dt>Ubicación exacta del proyecto</dt>
          <dd>
            <strong>{p.ubicacion}</strong>
            <span className="bloque-legal-fuente">{p.ubicacionFuente}</span>
          </dd>
        </div>

        <div>
          <dt>Área</dt>
          <dd>
            <ul className="bloque-legal-areas">
              {p.tipologias.map((t) => (
                <li key={t.titulo}>
                  <strong>{t.area.valor}</strong> — {t.titulo}
                  <span className="bloque-legal-fuente">
                    La fuente la rotula «{t.area.etiqueta}». {t.area.fuente}
                  </span>
                </li>
              ))}
            </ul>
          </dd>
        </div>
      </dl>

      {pieza.certificacionPendiente && (
        <p className="bloque-legal-aviso">
          <strong>Sobre el área.</strong> Las cifras anteriores se publican con
          la etiqueta textual que usa cada fuente. El promotor{" "}
          <strong>no ha certificado todavía</strong> que correspondan al{" "}
          <em>área privada construida</em> en el sentido del artículo 3 de la
          Ley 675 de 2001, que es un concepto distinto del área construida.
          La certificación fue solicitada por escrito y esta página se
          actualizará al recibirla. No tome estas cifras como área privada
          construida certificada.
        </p>
      )}

      <p className="bloque-legal-precio">
        <strong>Sobre el precio.</strong> Es un precio de referencia a la fecha
        de corte indicada, sujeto a disponibilidad al momento de la separación.
        No incluye gastos de escrituración, impuestos ni cuota de
        administración. Esta página no constituye oferta comercial en los
        términos del artículo 845 del Código de Comercio.
      </p>

      {p.reservas.length > 0 && (
        <div className="bloque-legal-reservas">
          <p>
            <strong>Unidades que no se ofrecen.</strong>
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
            <strong>Datos en los que las fuentes del promotor no coinciden.</strong>{" "}
            Se publican las dos versiones en lugar de elegir una:
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
          <strong>Información precontractual.</strong> El numeral 2.16.2 de la
          misma Circular exige entregar al comprador, antes de contratar:{" "}
          {pendientes.join(", ")}. Solicítala al asesor: se entrega por escrito
          antes de cualquier separación.
        </p>
      )}
    </section>
  );
}
