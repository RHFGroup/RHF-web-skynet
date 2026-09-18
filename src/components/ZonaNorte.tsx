"use client";

import CountUp from "@/components/CountUp";
import {
  capituloActivo,
  usePrefersReducedMotion,
  useScrollProgress,
} from "@/lib/motion";

/**
 * Acto 2 — «Zona Norte», como escenario anclado.
 *
 * La sección mide varias pantallas y adentro hay un escenario `position:
 * sticky` que queda quieto mientras el scroll avanza. El usuario no pasa de
 * largo: se queda ahí y el contenido cambia bajo sus ojos, un argumento por
 * vez, con su cifra. **Eso** es el scrollytelling; los fundidos al entrar
 * eran sólo la puerta.
 *
 * No secuestra el scroll: no toca la rueda ni su velocidad, sólo lee la
 * posición. Teclado, barra y Ctrl+F intactos.
 *
 * ⛔ El copy y las cifras salen de
 * `projects/inmobiliaria/copy-de-la-seccion-zona-norte-que-publicamos-y-que-no`,
 * nunca de la carpeta bruta. Prohibido: el aeropuerto como hecho, cualquier
 * cifra de valorización, superlativos y los minutos al centro.
 */

const capitulos = [
  {
    titulo: "Aquí está la oferta",
    texto:
      "Donde se concentra la oferta se concentra también la competencia entre constructores, y eso se nota en las condiciones de compra.",
    cifra: { to: 70, suffix: " %", decimals: 0 },
    rotulo: "de la vivienda nueva que se comercializa en Bolívar está en la Zona Norte",
    sr: "Cerca del 70 por ciento de la vivienda nueva que se comercializa en Bolívar está en la Zona Norte",
    fuente: "Camacol Bolívar",
  },
  {
    titulo: "La vía ya está hecha",
    texto:
      "El Viaducto del Gran Manglar opera desde 2018 y el corredor completo hacia Barranquilla desde 2021: $778.576 millones que conectan a cerca de 3 millones de personas.",
    // La cifra pasó de «5,4 km» a los años en operación (2026-09-04). Dos
    // fuentes independientes contradicen los 5,4: Wikipedia da 4,73 km y la
    // Sociedad Colombiana de Ingenieros 4,90 km, ambas más 360 m de retorno.
    // Los años en operación salen de un hecho que la research sí fija —
    // el viaducto opera desde el 28-jul-2018— y sostienen el mismo argumento.
    cifra: { to: 8, suffix: " años", decimals: 0 },
    rotulo: "lleva el viaducto sobre la ciénaga en operación, desde 2018",
    sr: "8 años lleva el viaducto sobre la ciénaga en operación, desde 2018",
    fuente: "Obra entregada",
  },
  {
    titulo: "El entorno ya funciona",
    texto:
      "El hospital Santa Fe y el campus de Uniandes funcionan aquí desde 2018, a 12 km del Centro. Kristal Malls está en obra desde marzo de 2026, con apertura prevista para 2027.",
    cifra: { to: 95, suffix: " %", decimals: 0 },
    rotulo: "de avance en la doble calzada de Tierra Baja",
    sr: "95 por ciento de avance en la doble calzada de Tierra Baja",
    fuente: "Seguimiento de obra",
  },
];

export default function ZonaNorte() {
  const reduced = usePrefersReducedMotion();
  const { ref, progress } = useScrollProgress<HTMLElement>(!reduced);
  const { indice } = capituloActivo(progress, capitulos.length);

  return (
    <>
      <section
        className={"scrolly" + (reduced ? " scrolly-plano" : "")}
        id="zonanorte"
        ref={ref}
        style={{ "--caps": capitulos.length } as React.CSSProperties}
      >
        <div className="scrolly-escenario">
          <div className="section-shell scrolly-grid">
            <div className="scrolly-texto">
              <p className="section-kicker">Zona Norte</p>
              <h2>La Zona Norte es donde Cartagena está creciendo</h2>
              <p className="section-lede">
                Siete de cada diez viviendas nuevas de Bolívar están aquí. Te
                contamos qué está hecho y qué está en estudio.
              </p>

              <div className="scrolly-capitulos">
                {capitulos.map((c, i) => (
                  <article
                    key={c.titulo}
                    className={
                      "scrolly-cap" +
                      (reduced || i === indice ? " activo" : "") +
                      (!reduced && i < indice ? " pasado" : "")
                    }
                  >
                    <p className="scrolly-cifra">
                      <strong>
                        <CountUp
                          to={c.cifra.to}
                          decimals={c.cifra.decimals}
                          suffix={c.cifra.suffix}
                          srText={c.sr}
                          trigger={reduced ? true : i === indice}
                        />
                      </strong>
                      <span>{c.rotulo}</span>
                    </p>
                    <h4>{c.titulo}</h4>
                    <p className="scrolly-cap-texto">{c.texto}</p>
                    <p className="scrolly-fuente">Fuente: {c.fuente}</p>
                  </article>
                ))}
              </div>

              <ol className="scrolly-rail" aria-hidden="true">
                {capitulos.map((c, i) => (
                  <li key={c.titulo} className={i <= indice ? "activo" : ""} />
                ))}
              </ol>
            </div>

            <div className="scrolly-visual">
              <img
                src="/proyectos/doral-west/home.jpg"
                alt="Doral West, en la Zona Norte de Cartagena — render del promotor"
                style={
                  reduced
                    ? undefined
                    : { transform: `scale(${(1.06 + progress * 0.14).toFixed(3)})` }
                }
              />
              <span
                className="scrolly-progreso"
                style={{ transform: `scaleX(${reduced ? 1 : progress.toFixed(3)})` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* El remate sale del escenario a propósito: llega cuando el usuario ya
          recorrió los tres argumentos.

          Escrito con la regla de oro de la marca: el dato malo vende si se
          gira. Dato → traducción → ventaja → cierre, y el cierre va SIEMPRE
          sobre el beneficio del comprador, nunca sobre lo creíbles que somos
          nosotros. Una línea por idea, ninguna pasa de once palabras. */}
      <section className="section section-honesto">
        <div className="section-shell">
          <div className="hook">
            <p className="hook-titular">
              Del aeropuerto hay un estudio. Del viaducto, ocho años.
            </p>
            <div className="hook-lineas">
              <p>La ANI evalúa la factibilidad del proyecto.</p>
              <p>Su concepto se espera en noviembre de 2026.</p>
              <p className="hook-giro">
                Traducción: hoy pagas por lo que ya está hecho.
              </p>
              <p>Pide que el precio se sostenga en obra entregada.</p>
              <p>Pregunta qué justifica cada peso antes de separar.</p>
              <p className="hook-cierre">
                Compra sobre lo construido. Ese es el criterio.
              </p>
            </div>
          </div>
          <p className="zone-fuentes">
            Cifras contrastadas contra fuentes primarias. Concentración de
            oferta: Camacol Bolívar. Actualizado a agosto de 2026.
          </p>
        </div>
      </section>
    </>
  );
}
