/**
 * «Inmuebles disponibles» — la sección aparte, debajo de la cartera.
 *
 * Pedido de Rafael del 25-sep-2026: los apartamentos puntuales (Doral Suites
 * 320, Cavana 303 torre 10, Morros Park 421 y 519, Agua Marina 803) van en su
 * propia sección, cada uno con su ficha y su página, sin decir de quién son.
 *
 * Usan la misma tarjeta que gira de la cartera (TarjetaGiro): foto que rota,
 * estado, precio solo si está escrito —con su corte—, área con la etiqueta
 * literal de su documento y, al girar, lo que lo hace especial. Los datos
 * llegan armados del servidor (`fichaDeInmueble`, src/lib/ficha.ts).
 */
import RevealGrupo from "@/components/RevealGrupo";
import TarjetaGiro from "@/components/TarjetaGiro";
import type { Ficha } from "@/lib/ficha";
import "@/styles/cartera.css";
import "@/styles/inmuebles.css";

export default function Inmuebles({ fichas }: { fichas: Ficha[] }) {
  if (fichas.length === 0) return null;
  return (
    <section className="section inmuebles" id="inmuebles" aria-labelledby="inmuebles-titulo">
      <div className="section-shell">
        <p className="section-kicker">Inmuebles disponibles</p>
        <h2 id="inmuebles-titulo">Apartamentos terminados y en construcción</h2>
        <p className="section-lede">
          Unidades puntuales, cada una con su ficha. Las áreas salen de la escritura o del plano oficial.
        </p>
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
