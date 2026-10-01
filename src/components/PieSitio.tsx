import Link from "next/link";
import { IconoInstagram } from "@/components/Iconos";
import PreferenciaMovimiento from "@/components/PreferenciaMovimiento";
import BotonCookies from "@/components/BotonCookies";
import { seccionesHome } from "@/data/navegacion";
import { redes } from "@/i18n/datos";
import { ruta, type Idioma } from "@/i18n/idioma";

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
 *
 * 29-sep-2026 (sitio en inglés): el bloque legal en inglés dice lo mismo que
 * el español, sin quitar ni agregar compromisos. La ley y la circular se
 * nombran igual («Ley 675 de 2001», «Circular 004 de la SIC») y los términos
 * técnicos llevan el original entre paréntesis. Los enlaces van a la versión
 * en inglés de cada página (`ruta()`).
 */
const TEXTOS = {
  es: {
    inicio: "Inicio",
    mercado: "Inteligencia de mercado",
    vender: "Quiero vender / consignar",
    asesor: "Asesor inmobiliario independiente.",
    imagenesPropias:
      "La fotografía de portada es propia. Las imágenes de los proyectos son renders y material del promotor; en los inmuebles disponibles, cada imagen dice si es foto del apartamento o render.",
    imagenesPromotor: "Las imágenes de esta página son renders y material del promotor, y son ilustrativas.",
    vigencia:
      "Los precios, áreas y condiciones aquí publicados corresponden a la fecha indicada en cada proyecto y pueden variar sin previo aviso. Para información actualizada, contáctanos directamente.",
    circular:
      "Los precios aquí publicados son de referencia, en pesos colombianos, a la fecha de corte que acompaña a cada cifra, y están sujetos a disponibilidad. El valor en dólares que se puede ver con el selector de moneda es una referencia aproximada con la TRM del día: el precio es el de pesos. Cada proyecto publica su área con la etiqueta textual de la fuente del promotor y declara si su equivalencia con el área privada construida del artículo 3 de la Ley 675 de 2001 está pendiente de certificación. La información precontractual del numeral 2.16.2 de la Circular 004 de la SIC —estrato, cuota de administración, fecha de entrega, valor de desistimiento y plan de etapas— se entrega por escrito antes de cualquier separación.",
    privacidad: "Política de tratamiento de datos",
    terminos: "Términos de uso",
    derechos: "Todos los derechos reservados.",
  },
  en: {
    inicio: "Home",
    mercado: "Market intelligence",
    vender: "Sell or list your property",
    asesor: "Independent real estate advisor.",
    imagenesPropias:
      "The cover photo is our own. Project images are renders and developer material; for available properties, each image states whether it is a photo of the apartment or a render.",
    imagenesPromotor: "The images on this page are renders and developer material, and are for illustrative purposes.",
    vigencia:
      "The prices, areas and conditions published here correspond to the date indicated for each project and may change without prior notice. For up-to-date information, contact us directly.",
    circular:
      "The prices published here are reference prices, in Colombian pesos, as of the date shown with each figure, and are subject to availability. The dollar amount you can see with the currency selector is an approximate reference at the day's official exchange rate (TRM): the price is the amount in pesos. Each project publishes its area with the exact label used in the developer's source and states whether its equivalence to the private built area (área privada construida) as defined in Article 3 of Ley 675 de 2001 is pending certification. The pre-contractual information in numeral 2.16.2 of Circular 004 of the SIC—socioeconomic stratum (estrato), HOA fee (cuota de administración), delivery date, withdrawal penalty (valor de desistimiento) and phasing plan—is provided in writing before any reservation deposit (separación).",
    privacidad: "Data processing policy",
    terminos: "Terms of use",
    derechos: "All rights reserved.",
  },
} satisfies Record<Idioma, Record<string, string>>;

export default function PieSitio({
  portadaPropia = true,
  avisoImagenes,
  idioma = "es",
}: {
  /** La home abre con una foto propia; las páginas de proyecto, con material del promotor. */
  portadaPropia?: boolean;
  /**
   * Reemplaza el aviso de las imágenes cuando la página tiene el suyo (inmuebles, /asesor).
   * Llega ya en el idioma de la página.
   */
  avisoImagenes?: string;
  idioma?: Idioma;
}) {
  const t = TEXTOS[idioma];
  const { REDES } = redes(idioma);
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-top">
          <img className="footer-brand" src="/marca/rhf-living.svg" alt="RHF Living" width="196" height="44" />
          <div className="footer-links">
            <Link href={ruta(idioma, "/#inicio")}>{t.inicio}</Link>
            {seccionesHome(idioma)
              .filter((s) => !s.soloMovil)
              .map((s) => (
                <Link key={s.ancla} href={ruta(idioma, `/#${s.ancla}`)}>
                  {s.texto}
                </Link>
              ))}
            <Link href={ruta(idioma, "/inteligencia-de-mercado")}>{t.mercado}</Link>
            <Link href={ruta(idioma, "/vender")} data-evento="click_quiero_vender" data-ubicacion="pie">
              {t.vender}
            </Link>
          </div>
        </div>
        {/* Las redes (src/data/redes.ts), con su usuario a la vista. */}
        <div className="footer-redes">
          {REDES.map((r) => (
            <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer">
              <IconoInstagram size={18} /> {r.nombre} · {r.usuario}
            </a>
          ))}
        </div>
        {/* Animaciones: automáticas (lo que pida el sistema), activadas o reducidas. */}
        <PreferenciaMovimiento idioma={idioma} />
        <div className="footer-legal">
          <p>
            <strong>Rafael Hernández Franco</strong>
            {` — ${t.asesor}`}{" "}
            {avisoImagenes ?? (portadaPropia ? t.imagenesPropias : t.imagenesPromotor)}{" "}
            {t.vigencia}
          </p>
          <p className="footer-circular">{t.circular}</p>
          {/* La TRM de la referencia en dólares: la llena ReferenciaDolares.tsx
              cuando la persona elige USD. */}
          <p id="nota-trm" className="nota-trm" hidden aria-live="polite" />
          <p className="footer-legal-links">
            <Link href={ruta(idioma, "/privacidad")}>{t.privacidad}</Link>
            {" · "}
            <Link href={ruta(idioma, "/terminos")}>{t.terminos}</Link>
            <BotonCookies idioma={idioma} />
          </p>
          <p className="footer-copy">
            © {new Date().getFullYear()}
            {` RHF Living. ${t.derechos}`}
          </p>
        </div>
      </div>
    </footer>
  );
}
