"use client";

/**
 * El control «Animaciones» del pie de página (28-sep-2026).
 *
 * Rafael no veía las animaciones en Brave. Los navegadores informan lo que
 * pide el sistema, y un teléfono en ahorro de batería o con «reducir
 * movimiento» en accesibilidad pide reducir: el sitio lo respeta y se queda
 * quieto. Este control deja elegir:
 *
 *  · Automáticas: lo que pida el sistema (lo de siempre).
 *  · Activadas: se mueve aunque el sistema pida reducir.
 *  · Reducidas: quieto aunque el sistema no lo pida.
 *
 * La elección vive en el navegador del visitante (src/lib/motion.ts) y se
 * aplica al instante, sin recargar.
 */
import { usePreferenciaMovimiento, type PreferenciaMovimiento as Preferencia } from "@/lib/motion";
import "@/styles/movimiento.css";

const OPCIONES: { valor: Preferencia; texto: string }[] = [
  { valor: "auto", texto: "Automáticas" },
  { valor: "activo", texto: "Activadas" },
  { valor: "reducido", texto: "Reducidas" },
];

export default function PreferenciaMovimiento() {
  const { preferencia, sistema, listo, elegir } = usePreferenciaMovimiento();

  return (
    <fieldset className="movimiento-control">
      <legend className="movimiento-leyenda">Animaciones</legend>
      <div className="movimiento-opciones">
        {OPCIONES.map((o) => (
          <label key={o.valor} className="movimiento-opcion">
            <input
              type="radio"
              name="rhf-movimiento"
              value={o.valor}
              checked={preferencia === o.valor}
              onChange={() => elegir(o.valor)}
            />
            <span>{o.texto}</span>
          </label>
        ))}
      </div>
      {listo && sistema && preferencia === "auto" && (
        <p className="movimiento-nota">
          Tu dispositivo pide menos movimiento (ahorro de batería o accesibilidad) y el sitio lo respeta. Elige
          «Activadas» para ver las animaciones.
        </p>
      )}
    </fieldset>
  );
}
