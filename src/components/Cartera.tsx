"use client";

import Link from "next/link";
import MeInteresaButton from "@/components/MeInteresaButton";
import {
  capituloActivo,
  usePrefersReducedMotion,
  useScrollProgress,
} from "@/lib/motion";

/**
 * Acto 4 — la cartera como capítulos, no como grilla.
 *
 * El escenario queda anclado y los proyectos pasan de a uno: la imagen se
 * funde, la ficha cambia. El usuario recorre la cartera en vez de barrerla de
 * un vistazo, que era justamente el diagnóstico del plan («cinco tarjetas
 * iguales, todas visibles al mismo tiempo»).
 *
 * Se descartó el scroll horizontal que proponía el plan —rompe teclado y
 * Ctrl+F— pero NO la progresión: eso se logra anclando, sin tocar la rueda.
 *
 * ⚠️ Los datos de ficha no son fuente de verdad acá: su cadena es Excel de la
 * constructora con fecha de corte → nota del proyecto en el vault → este
 * componente. El precio de Acacias está en disputa ($161M publicado vs $138M
 * en la fuente) y por eso no se destaca ni se anima.
 */

type Proyecto = {
  nombre: string;
  /** Landing propia del proyecto, o null si todavia no tiene: la ficha queda
   *  con «Me interesa» y sin enlace, nunca con un enlace roto. */
  href: string | null;
  zona: string;
  precio: string;
  /** El candado del numeral 2.16.1: si es false, `precio` dice «Consultar». */
  muestraPrecio: boolean;
  /** Fecha de corte del precio. Va junto a la cifra, no en letra chica. */
  corte: string | null;
  area: string;
  tipologia: string;
  descripcion: string;
  destacado: boolean;
  imagen: string;
  variante: "zoom" | "up" | "left" | "blur";
};

export default function Cartera({ proyectos }: { proyectos: Proyecto[] }) {
  const reduced = usePrefersReducedMotion();
  const { ref, progress } = useScrollProgress<HTMLElement>(!reduced);
  const { indice } = capituloActivo(progress, proyectos.length);

  return (
    <section
      className={"scrolly" + (reduced ? " scrolly-plano" : "")}
      id="cartera"
      ref={ref}
      style={{ "--caps": proyectos.length } as React.CSSProperties}
    >
      <div className="scrolly-escenario">
        <div className="section-shell scrolly-grid scrolly-grid-invertida">
          <div className="scrolly-visual cartera-visual">
            {proyectos.map((p, i) => (
              <img
                key={p.nombre}
                src={p.imagen}
                alt={p.nombre}
                loading={i === 0 ? undefined : "lazy"}
                className={reduced || i === indice ? "activo" : ""}
              />
            ))}
            <span
              className="scrolly-progreso"
              style={{ transform: `scaleX(${reduced ? 1 : progress.toFixed(3)})` }}
            />
          </div>

          <div className="scrolly-texto">
            <p className="section-kicker">
              Nuestra cartera{reduced ? "" : ` · ${indice + 1} de ${proyectos.length}`}
            </p>
            <h2>Proyectos que asesoramos</h2>

            <div className="scrolly-capitulos cartera-capitulos">
              {proyectos.map((p, i) => (
                <article
                  key={p.nombre}
                  className={"scrolly-cap" + (reduced || i === indice ? " activo" : "")}
                  aria-hidden={reduced ? undefined : i !== indice}
                  // `aria-hidden` sin `inert` deja el boton y el enlace
                  // alcanzables con Tab dentro de un bloque oculto al lector.
                  inert={!reduced && i !== indice}
                >
                  <p className="proyecto-tipo">
                    {p.zona} · {p.tipologia}
                  </p>
                  <h3>
                    {p.nombre}
                    {p.destacado && <span className="cartera-badge">Nuevo</span>}
                  </h3>
                  <p className="scrolly-cap-texto">{p.descripcion}</p>
                  <div className="proyecto-datos">
                    <span className="dato">
                      <strong>{p.precio}</strong>{" "}
                      <em>{p.muestraPrecio ? `corte ${p.corte}` : "desde"}</em>
                    </span>
                    <span className="dato-sep" />
                    <span className="dato">{p.area}</span>
                  </div>
                  <div className="proyecto-acciones">
                    <MeInteresaButton />
                    {p.href && (
                      <Link className="proyecto-link" href={p.href}>
                        Ver el proyecto
                      </Link>
                    )}
                  </div>
                </article>
              ))}
            </div>

            <ol className="scrolly-rail" aria-hidden="true">
              {proyectos.map((p, i) => (
                <li key={p.nombre} className={i <= indice ? "activo" : ""} />
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
