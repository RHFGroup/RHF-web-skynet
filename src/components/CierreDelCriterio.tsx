/**
 * El cierre del argumento de territorio — el contraste del aeropuerto.
 *
 * **Por qué vive acá y no dentro de `ZonaNorte`.** Este texto es un remate:
 * contrapone una obra que está en estudio con una que lleva ocho años
 * operando. Nació como apertura del bloque del criterio, Rafael lo señaló
 * como demasiado técnico para abrir, y bajó al final de los capítulos de
 * Zona Norte. Ahí seguía fallando por una razón de arco, medida el
 * 2026-09-19 sobre la página en vivo: el remate llegaba **y el tema
 * continuaba** — venía el mapa, que vuelve a hablar de la Zona Norte. Un
 * cierre al que le sigue más argumento deja de ser cierre.
 *
 * Ahora va después del mapa. Cierra los tres tramos de territorio
 * —capítulos, mapa, remate— y entrega al visitante al bloque de Rafael.
 * Nada vuelve al tema después del golpe.
 *
 * **Sin imagen, a propósito.** El plan pedía acompañarlo con una foto del
 * viaducto. No existe: la carpeta `Tomas aereas viaducto` del Mac contiene
 * 34 s de dron de la **Vía al Mar**, que es la toma que ya usa la portada,
 * y no hay ningún registro del viaducto sobre la ciénaga. Poner esa foto
 * al lado de «Del viaducto, ocho años» sería afirmar que eso es el
 * viaducto — una imagen afirma igual que una frase. El ancho se resuelve
 * con el par editorial, que no necesita material que no tenemos.
 *
 * ⛔ El copy sale de
 * `projects/inmobiliaria/copy-de-la-seccion-zona-norte-que-publicamos-y-que-no`.
 * El aeropuerto se nombra como estudio en evaluación, nunca como hecho.
 * **Sin fechas de trámite**: la línea «su concepto se espera en noviembre
 * de 2026» salió el 2026-09-19 porque vencía en dos meses y nadie iba a
 * volver a entrar a cambiarla. Un dato con fecha de caducidad en la home
 * es una deuda de mantenimiento, no una prueba de rigor.
 */
import Reveal from "@/components/Reveal";

/** Una línea por idea, ninguna de más de once palabras. */
const LINEAS = [
  { texto: "La ANI evalúa la factibilidad del proyecto.", clase: "" },
  { texto: "Traducción: hoy pagas por lo que ya está hecho.", clase: "hook-giro" },
  { texto: "Pide que el precio se sostenga en obra entregada.", clase: "" },
  { texto: "Pregunta qué justifica cada peso antes de separar.", clase: "" },
];

export default function CierreDelCriterio() {
  return (
    <section className="section section-honesto" id="criterio">
      <div className="section-shell hook">
        <Reveal className="hook-titular-col" variant="up">
          <p className="section-kicker">El criterio</p>
          <p className="hook-titular">
            Del aeropuerto hay un estudio.
            <br />
            Del viaducto, ocho años.
          </p>
        </Reveal>

        <Reveal className="hook-lineas-col" variant="up" delay={120}>
          <div className="hook-lineas">
            {LINEAS.map((l) => (
              <p key={l.texto} className={l.clase}>
                {l.texto}
              </p>
            ))}
            <p className="hook-cierre">Compra sobre lo construido. Ese es el criterio.</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
