/**
 * Los desarrolladores: una franja chica debajo de la cartera, en el mismo
 * bloque blanco. Invercolombia va primero, como pidió Rafael (28-sep-2026).
 *
 * Los datos y de dónde sale cada logo: src/data/desarrolladores.ts. Los
 * nombres de los proyectos se leen de proyectos.ts, así que si uno cambia de
 * nombre, cambia aquí solo.
 */
import RevealGrupo from "@/components/RevealGrupo";
import { DESARROLLADORES } from "@/data/desarrolladores";
import { getProyecto } from "@/data/proyectos";
import "@/styles/desarrolladores.css";

/** «A, B y C». */
function enLista(xs: string[]): string {
  return xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} y ${xs[xs.length - 1]}`;
}

export default function Desarrolladores() {
  return (
    <section className="desarrolladores" aria-labelledby="desarrolladores-titulo">
      <div className="section-shell">
        <div className="desarrolladores-cabeza">
          <p className="section-kicker">Desarrolladores</p>
          <h2 id="desarrolladores-titulo" className="desarrolladores-titulo">
            Las empresas detrás de cada proyecto
          </h2>
        </div>
        <RevealGrupo className="desarrolladores-lista">
          {DESARROLLADORES.map((d, i) => {
            const proyectos = d.proyectos
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
                  <span className="desarrollador-proyectos">{enLista(proyectos)}</span>
                </div>
              </div>
            );
          })}
        </RevealGrupo>
      </div>
    </section>
  );
}
