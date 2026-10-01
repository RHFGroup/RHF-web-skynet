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
 *
 * 29-sep-2026 (sitio en inglés): los textos van en el idioma de la página.
 */
import type { Idioma } from "@/i18n/idioma";
import { usePreferenciaMovimiento, type PreferenciaMovimiento as Preferencia } from "@/lib/motion";
import "@/styles/movimiento.css";

const TEXTOS = {
  es: {
    leyenda: "Animaciones",
    auto: "Automáticas",
    activo: "Activadas",
    reducido: "Reducidas",
    nota: "Tu dispositivo pide menos movimiento (ahorro de batería o accesibilidad) y el sitio lo respeta. Elige «Activadas» para ver las animaciones.",
  },
  en: {
    leyenda: "Animations",
    auto: "Automatic",
    activo: "Enabled",
    reducido: "Reduced",
    nota: "Your device asks for less motion (battery saver or accessibility settings), and the site respects that. Choose “Enabled” to see the animations.",
  },
} satisfies Record<Idioma, Record<string, string>>;

const OPCIONES: Preferencia[] = ["auto", "activo", "reducido"];

export default function PreferenciaMovimiento({ idioma = "es" }: { idioma?: Idioma }) {
  const { preferencia, sistema, listo, elegir } = usePreferenciaMovimiento();
  const t = TEXTOS[idioma];

  return (
    <fieldset className="movimiento-control">
      <legend className="movimiento-leyenda">{t.leyenda}</legend>
      <div className="movimiento-opciones">
        {OPCIONES.map((valor) => (
          <label key={valor} className="movimiento-opcion">
            <input
              type="radio"
              name="rhf-movimiento"
              value={valor}
              checked={preferencia === valor}
              onChange={() => elegir(valor)}
            />
            <span>{t[valor]}</span>
          </label>
        ))}
      </div>
      {listo && sistema && preferencia === "auto" && <p className="movimiento-nota">{t.nota}</p>}
    </fieldset>
  );
}
