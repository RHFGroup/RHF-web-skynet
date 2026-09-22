"use client";

import { SALUDO_WHATSAPP, enlaceWhatsApp } from "@/data/contacto";

/**
 * Abre el widget de chat del agente de atención.
 *
 * `label` y `className` son opcionales para no romper los usos existentes
 * (`<MeInteresaButton />` en la home y en Cartera).
 */

/**
 * Selectores del botón que abre el widget, del más estable al más frágil.
 *
 * Por qué hay una lista y no un selector: hasta `@tp3/chat-widget` 0.2.4 el
 * toggle llevaba la clase `tp3-chat-toggle`. La 0.2.5 lo renderiza **sin
 * ninguna clase** — solo `aria-label` y `style` — y este componente buscaba
 * únicamente la clase vieja. Como la búsqueda terminaba en `?.click()`, el
 * fallo no lanzaba nada: los cinco botones quedaron muertos en silencio desde
 * el salto de versión, incluidos el CTA del nav y el botón principal de cada
 * página de proyecto. Medido en producción el 21-sep-2026.
 *
 * El último de la lista es el que funciona hoy, y depende del texto en español
 * de una etiqueta de accesibilidad: es un parche, no un contrato. Lo estable
 * sería que el widget exponga `data-chat-toggle`; mientras no lo haga, esta
 * lista absorbe el próximo cambio de marcado sin volver a romperse.
 */
const SELECTORES_DEL_TOGGLE = [
  "[data-chat-toggle]",
  ".tp3-chat-toggle",
  ".chat-toggle",
  'button[aria-label="Abrir chat"]',
];

export default function MeInteresaButton({
  label = "Me interesa",
  className = "btn-card",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <button
      className={className}
      onClick={() => {
        for (const selector of SELECTORES_DEL_TOGGLE) {
          const toggle = document.querySelector<HTMLElement>(selector);
          if (toggle) {
            toggle.click();
            return;
          }
        }

        // Si llegamos acá, el widget volvió a cambiar de marcado. Antes esto
        // no hacía NADA y nadie se enteraba. Ahora hay dos cosas: rastro en
        // consola para que la próxima regresión se vea, y salida a WhatsApp,
        // que es un canal que sí responde. Un botón que hace lo segundo mejor
        // es preferible a uno muerto.
        console.error(
          "[MeInteresaButton] no encontré el botón del chat; abro WhatsApp. " +
            "Selectores probados: " +
            SELECTORES_DEL_TOGGLE.join(", ")
        );
        window.open(
          enlaceWhatsApp(SALUDO_WHATSAPP),
          "_blank",
          "noopener,noreferrer"
        );
      }}
    >
      {label}
    </button>
  );
}
