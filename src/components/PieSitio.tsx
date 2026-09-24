import Link from "next/link";

/**
 * El pie de página de todo el sitio, con los avisos legales.
 *
 * Antes vivía escrito dentro de la home y cada página de proyecto traía el
 * suyo, con textos que se habían quedado viejos («en esta página no
 * publicamos precios» debajo de un precio publicado). Ahora es uno solo.
 *
 * Lo que no se puede romper: precio de referencia con fecha de corte, área con
 * la etiqueta textual de la fuente, la Ley 675 de 2001, el numeral 2.16.2 de
 * la Circular 004 de la SIC y los enlaces a privacidad y términos.
 */
export default function PieSitio({
  portadaPropia = true,
}: {
  /** La home abre con una foto propia; las páginas de proyecto, con material del promotor. */
  portadaPropia?: boolean;
}) {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-top">
          <img className="footer-brand" src="/marca/rhf-living.svg" alt="RHF Living" width="196" height="44" />
          <div className="footer-links">
            <Link href="/#inicio">Inicio</Link>
            <Link href="/#cartera">Nuestra cartera</Link>
            <Link href="/#zonanorte">Zona Norte</Link>
            <Link href="/#asesor">Quién te asesora</Link>
            <Link href="/#contacto">Contacto</Link>
          </div>
        </div>
        <div className="footer-legal">
          <p>
            <strong>Rafael Hernández Franco</strong> — Asesor inmobiliario independiente.{" "}
            {portadaPropia
              ? "La fotografía de portada es propia. Las imágenes de los proyectos son renders y material del promotor."
              : "Las imágenes de esta página son renders y material del promotor, y son ilustrativas."}{" "}
            Los precios,
            áreas y condiciones aquí publicados corresponden a la fecha
            indicada en cada proyecto y pueden variar sin previo aviso.
            Para información actualizada, contáctanos directamente.
          </p>
          <p className="footer-circular">
            Los precios aquí publicados son de referencia, en pesos
            colombianos, a la fecha de corte que acompaña a cada cifra, y
            están sujetos a disponibilidad. Cada proyecto publica su área
            con la etiqueta textual de la fuente del promotor y declara si
            su equivalencia con el área privada construida del artículo 3 de
            la Ley 675 de 2001 está pendiente de certificación. La
            información precontractual del numeral 2.16.2 de la Circular 004
            de la SIC —estrato, cuota de administración, fecha de entrega,
            valor de desistimiento y plan de etapas— se entrega por escrito
            antes de cualquier separación.
          </p>
          <p className="footer-legal-links">
            <Link href="/privacidad">Política de tratamiento de datos</Link>
            {" · "}
            <Link href="/terminos">Términos de uso</Link>
          </p>
          <p className="footer-copy">© {new Date().getFullYear()} RHF Living. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
