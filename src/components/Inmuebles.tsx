/**
 * «Inmuebles disponibles» — los apartamentos puntuales, en el mismo bloque de
 * la cartera.
 *
 * Pedido de Rafael del 25-sep-2026: los apartamentos puntuales (Doral Suites
 * 320, Cavana 303 torre 10, Morros Park 421 y 519, Agua Marina 803) van cada
 * uno con su ficha y su página, sin decir de quién son. Primero fueron una
 * sección aparte, con su color; ya publicada la home, pidió que «Proyectos que
 * asesoramos» y «Apartamentos terminados y en construcción» fueran juntos.
 * Desde entonces esta lista va debajo de la cartera, sobre el mismo fondo y
 * separada por una línea (page.tsx e inmuebles.css), con los mismos saltos
 * arriba (SaltosOferta).
 *
 * Usan la misma tarjeta que gira de la cartera (TarjetaGiro): foto que rota,
 * estado, precio solo si está escrito —con su corte—, área con la etiqueta
 * literal de su documento y, al girar, lo que lo hace especial. Los datos
 * llegan armados del servidor (`fichaDeInmueble`, src/lib/ficha.ts).
 */
import RevealGrupo from "@/components/RevealGrupo";
import SaltosOferta from "@/components/SaltosOferta";
import TarjetaGiro from "@/components/TarjetaGiro";
import type { Ficha } from "@/lib/ficha";
import "@/styles/cartera.css";
import "@/styles/inmuebles.css";

export default function Inmuebles({
  fichas,
  saltos,
}: {
  fichas: Ficha[];
  /** Cuántos proyectos y apartamentos hay, para los saltos del bloque. */
  saltos?: { proyectos: number; apartamentos: number };
}) {
  if (fichas.length === 0) return null;
  return (
    <section className="section inmuebles" id="inmuebles" aria-labelledby="inmuebles-titulo">
      <div className="section-shell">
        <div className="oferta-cabeza">
          <div>
            <p className="section-kicker">Inmuebles disponibles</p>
            <h2 id="inmuebles-titulo">Apartamentos terminados y en construcción</h2>
            <p className="section-lede">
              Unidades puntuales, cada una con su ficha. Las áreas salen de la escritura o del plano oficial.
            </p>
          </div>
          {saltos && <SaltosOferta activo="apartamentos" {...saltos} />}
        </div>
        <RevealGrupo className="cartera-grilla inmuebles-grilla">
          {fichas.map((f, i) => (
            <div key={f.slug} className="cartera-celda" style={{ "--i": i % 3 } as React.CSSProperties}>
              <TarjetaGiro ficha={f} desdeCartera retraso={400 + i * 900} />
            </div>
          ))}
        </RevealGrupo>
      </div>
    </section>
  );
}
