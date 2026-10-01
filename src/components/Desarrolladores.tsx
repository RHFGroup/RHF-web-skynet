/**
 * Los desarrolladores: una franja chica debajo de la cartera, en el mismo
 * bloque blanco. Invercolombia va primero, como pidió Rafael (28-sep-2026).
 *
 * Los datos y de dónde sale cada logo: src/data/desarrolladores.ts. Los
 * nombres de los proyectos se leen de proyectos.ts, así que si uno cambia de
 * nombre, cambia aquí solo.
 *
 * 29-sep-2026 (sitio en inglés): los datos llegan en el idioma de la página
 * (src/i18n/datos.ts); los nombres de empresas y proyectos no se traducen.
 */
import RevealGrupo from "@/components/RevealGrupo";
import { desarrolladores, proyectos } from "@/i18n/datos";
import type { Idioma } from "@/i18n/idioma";
import "@/styles/desarrolladores.css";

const TEXTOS = {
  es: { kicker: "Desarrolladores", titulo: "Las empresas detrás de cada proyecto" },
  en: { kicker: "Developers", titulo: "The companies behind each project" },
} satisfies Record<Idioma, Record<string, string>>;

/** «A, B y C»; en inglés, «A, B, and C». */
function enLista(xs: string[], idioma: Idioma): string {
  if (idioma === "en") {
    if (xs.length < 3) return xs.join(" and ");
    return `${xs.slice(0, -1).join(", ")}, and ${xs[xs.length - 1]}`;
  }
  return xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} y ${xs[xs.length - 1]}`;
}

export default function Desarrolladores({ idioma = "es" }: { idioma?: Idioma }) {
  const t = TEXTOS[idioma];
  const { DESARROLLADORES } = desarrolladores(idioma);
  const { getProyecto } = proyectos(idioma);
  return (
    <section className="desarrolladores" aria-labelledby="desarrolladores-titulo">
      <div className="section-shell">
        <div className="desarrolladores-cabeza">
          <p className="section-kicker">{t.kicker}</p>
          <h2 id="desarrolladores-titulo" className="desarrolladores-titulo">
            {t.titulo}
          </h2>
        </div>
        <RevealGrupo className="desarrolladores-lista">
          {DESARROLLADORES.map((d, i) => {
            const nombres = d.proyectos
              .map((s) => getProyecto(s)?.nombre)
              .filter((n): n is string => Boolean(n))
              .map((n) => n.replace(/ Condominio$/, ""));
            return (
              <div key={d.id} className="desarrollador" style={{ "--i": i } as React.CSSProperties}>
                <img
                  className="desarrollador-logo"
                  src={d.logo.src}
                  alt={d.nombre}
                  width={d.logo.ancho}
                  height={d.logo.alto}
                  loading="lazy"
                  decoding="async"
                />
                <div className="desarrollador-texto">
                  <span className="desarrollador-papel">{d.papel}</span>
                  <span className="desarrollador-proyectos">{enLista(nombres, idioma)}</span>
                </div>
              </div>
            );
          })}
        </RevealGrupo>
      </div>
    </section>
  );
}
