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
import { NOTICIAS } from "@/data/noticias";
import "@/styles/noticias.css";

export default function Noticias() {
  const ultimas = NOTICIAS.slice(0, 3);
  return (
    <section className="section noticias" id="noticias" aria-labelledby="noticias-titulo">
      <div className="section-shell">
        <div className="noticias-cabeza">
          <div>
            <p className="section-kicker">Inteligencia de mercado</p>
            <h2 id="noticias-titulo">La zona que crece</h2>
            <p className="section-lede">
              Obras, inversión y vida nueva en el norte de Cartagena, cada noticia con su fuente y su fecha.
            </p>
          </div>
          <Link className="noticias-todas" href="/inteligencia-de-mercado">
            Ver toda la inteligencia de mercado <IconoFlecha size={16} />
          </Link>
        </div>
        <RevealGrupo className="noticias-lista">
          {ultimas.map((n, i) => (
            <TarjetaNoticia key={n.id} noticia={n} i={i} />
          ))}
        </RevealGrupo>
        <Suscripcion />
      </div>
    </section>
  );
}
