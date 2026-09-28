/**
 * La barra de confianza, entre la portada y la cartera.
 *
 * 25-sep-2026: Rafael pidió mirar el orden de las inmobiliarias que más venden.
 * Varios agentes de alto volumen ponen, justo debajo de la portada, una barra
 * corta con lo que los distingue. Aquí va solo lo que se puede sostener:
 *
 *  · cuántos proyectos y cuántos apartamentos hay: se cuentan de los datos
 *    (proyectos.ts e inmuebles.ts), nunca se escriben a mano;
 *  · el estudio jurídico propio (confirmado por Rafael el 24-sep-2026);
 *  · que cada precio publicado lleva su fecha de corte (la regla de la
 *    Circular 004 que ya cumple toda la web).
 *
 * Años de experiencia, ventas cerradas o constructoras representadas no van
 * hasta que Rafael los entregue con su respaldo en el vault.
 *
 * Los números crecen al entrar en pantalla (CountUp), pero el HTML ya trae el
 * valor final: sin JavaScript o con menos movimiento se lee el dato correcto.
 */
import CountUp from "@/components/CountUp";
import RevealGrupo from "@/components/RevealGrupo";
import { IconoCalendario, IconoEscudo } from "@/components/Iconos";
import "@/styles/confianza.css";

export default function BarraConfianza({ proyectos, apartamentos }: { proyectos: number; apartamentos: number }) {
  return (
    <section className="confianza" aria-label="Lo que encuentras aquí">
      <div className="section-shell">
        <RevealGrupo className="confianza-lista">
          <div className="confianza-item" style={{ "--i": 0 } as React.CSSProperties}>
            <strong className="confianza-cifra">
              <CountUp to={proyectos} duration={1200} srText={`${proyectos} proyectos`} />
            </strong>
            <span>proyectos de varias constructoras</span>
          </div>
          {apartamentos > 0 && (
            <div className="confianza-item" style={{ "--i": 1 } as React.CSSProperties}>
              <strong className="confianza-cifra">
                <CountUp to={apartamentos} duration={1200} srText={`${apartamentos} apartamentos`} />
              </strong>
              <span>apartamentos terminados y en construcción</span>
            </div>
          )}
          <div className="confianza-item" style={{ "--i": 2 } as React.CSSProperties}>
            <span className="confianza-icono">
              <IconoEscudo size={24} />
            </span>
            <span>Estudio jurídico propio</span>
          </div>
          <div className="confianza-item" style={{ "--i": 3 } as React.CSSProperties}>
            <span className="confianza-icono">
              <IconoCalendario size={24} />
            </span>
            <span>Cada precio, con su fecha de corte</span>
          </div>
        </RevealGrupo>
      </div>
    </section>
  );
}
