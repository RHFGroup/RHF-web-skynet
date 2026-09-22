"use client";

import { SALUDO_WHATSAPP, enlaceWhatsApp } from "@/data/contacto";

/**
 * Abre el widget de chat del agente de atención.
 *
 * `label` y `className` son opcionales para no romper los usos existentes
 * (`<MeInteresaButton />` en la home y en Cartera).
 */

/**
 * Selectores del botón que **abre** el widget, del más estable al más frágil.
 *
 * Por qué hay una lista y no un selector: hasta `@tp3/chat-widget` 0.2.4 el
 * toggle llevaba la clase `tp3-chat-toggle`. La 0.2.5 lo renderiza **sin
 * ninguna clase** — solo `aria-label` y `style` — y este componente buscaba
 * únicamente la clase vieja. Como la búsqueda terminaba en `?.click()`, el
 * fallo no lanzaba nada: los cinco botones quedaron muertos en silencio desde
 * el salto de versión, incluidos el CTA del nav y el botón principal de cada
 * página de proyecto. Medido en producción el 21-sep-2026.
 *
 * `aria-label="Abrir chat"` depende del texto en español de una etiqueta de
 * accesibilidad: es un parche, no un contrato. Lo estable sería que el widget
 * exponga `data-chat-toggle`; mientras no lo haga, esta lista absorbe el
 * próximo cambio de marcado sin volver a romperse.
 *
 * Importante: la lista **no** incluye `aria-label="Cerrar chat"`, que es lo que
 * el mismo botón anuncia cuando el panel ya está abierto. Incluirlo haría que
 * «Me interesa» cerrara el chat en vez de abrirlo. Ese caso lo resuelve
 * `panelAbierto()` antes de llegar acá.
 */
const SELECTORES_DEL_TOGGLE = [
  "[data-chat-toggle]",
  ".tp3-chat-toggle",
  ".chat-toggle",
  'button[aria-label="Abrir chat"]',
];

/**
 * El panel del chat si está abierto.
 *
 * La señal es la **presencia** del token exacto `chat-window`, y nada más:
 *
 * - cerrado → el panel no está en el DOM;
 * - abierto → está, con la clase `chat-window`;
 * - cerrándose → la clase pasa a `chat-window-out`, que `~=` no coincide, así
 *   que cuenta como cerrado. Es lo correcto: a mitad de la animación de salida
 *   lo que corresponde es volverlo a abrir.
 *
 * Medido el 21-sep-2026: no se puede usar `opacity` para esto. El contenedor
 * reporta `opacity: 0` en el estilo computado aun con el panel visible en
 * pantalla, así que una comprobación de opacidad da «cerrado» cuando está
 * abierto — y de ahí el botón se iba al respaldo de WhatsApp. La presencia de
 * la clase sí distingue los tres estados.
 */
function panelAbierto(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[class~="chat-window"]');
}

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
        // 1. Si ya está abierto, no se toca el toggle —lo cerraría— ni se abre
        //    nada más. Se lleva el cursor al campo y listo.
        const abierto = panelAbierto();
        if (abierto) {
          abierto.querySelector<HTMLElement>("input, textarea")?.focus();
          return;
        }

        // 2. Está cerrado: se busca el botón que lo abre.
        for (const selector of SELECTORES_DEL_TOGGLE) {
          const toggle = document.querySelector<HTMLElement>(selector);
          if (toggle) {
            toggle.click();
            return;
          }
        }

        // 3. No hay widget: volvió a cambiar de marcado o no cargó. Antes esto
        //    no hacía NADA y nadie se enteraba. Ahora hay dos cosas: rastro en
        //    consola para que la próxima regresión se vea, y salida a WhatsApp,
        //    que es un canal que sí responde.
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
