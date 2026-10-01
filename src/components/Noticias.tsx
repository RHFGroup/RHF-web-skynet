/**
 * Inteligencia de mercado, en la home (28-sep-2026, pedido de Rafael; nombre
 * nuevo el 29-sep-2026, informe de Luciano).
 *
 * Las tres noticias más nuevas, el botón a /inteligencia-de-mercado con todas y
 * la suscripción al boletín. Las noticias y sus reglas: src/data/noticias.ts.
 * El nombre le da peso de firma a la sección; la atribución no cambia: cada
 * noticia sigue con su medio, su fecha y el enlace al artículo original.
 */
import Link from "next/link";
import RevealGrupo from "@/components/RevealGrupo";
import Suscripcion from "@/components/Suscripcion";
import TarjetaNoticia from "@/components/TarjetaNoticia";
import { IconoFlecha } from "@/components/Iconos";
import { ruta, type Idioma } from "@/i18n/idioma";
import { noticias } from "@/i18n/datos";
import "@/styles/noticias.css";

/**
 * Los textos, en los dos idiomas (docs/i18n.md). Cada uno es un nodo de texto
 * tal como queda en el HTML, con sus espacios de borde: así el español sale
 * idéntico.
 */
const TEXTOS = {
  es: {
    kicker: "Inteligencia de mercado",
    titulo: "La zona que crece",
    lede: "Obras, inversión y vida nueva en el norte de Cartagena, cada noticia con su fuente y su fecha.",
    todas: "Ver toda la inteligencia de mercado ",
  },
  en: {
    kicker: "Market intelligence",
    titulo: "The area that's growing",
    lede: "Public works, investment and new life in northern Cartagena, each story with its source and date.",
    todas: "See all market intelligence ",
  },
} satisfies Record<Idioma, Record<string, string>>;

export default function Noticias({ idioma = "es" }: { idioma?: Idioma }) {
  const t = TEXTOS[idioma];
  const { NOTICIAS } = noticias(idioma);
  const ultimas = NOTICIAS.slice(0, 3);
  return (
    <section className="section noticias" id="noticias" aria-labelledby="noticias-titulo">
      <div className="section-shell">
        <div className="noticias-cabeza">
          <div>
            <p className="section-kicker">{t.kicker}</p>
            <h2 id="noticias-titulo">{t.titulo}</h2>
            <p className="section-lede">{t.lede}</p>
          </div>
          <Link className="noticias-todas" href={ruta(idioma, "/inteligencia-de-mercado")}>
            {t.todas}<IconoFlecha size={16} />
          </Link>
        </div>
        <RevealGrupo className="noticias-lista">
          {ultimas.map((n, i) => (
            <TarjetaNoticia key={n.id} noticia={n} i={i} idioma={idioma} />
          ))}
        </RevealGrupo>
        <Suscripcion idioma={idioma} />
      </div>
    </section>
  );
}
