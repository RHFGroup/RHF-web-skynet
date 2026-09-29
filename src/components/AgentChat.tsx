"use client";

import ChatWidget from "@tp3/chat-widget";
import type { Idioma } from "@/i18n/idioma";

// Widget flotante oficial (@tp3/chat-widget) → WebSocket directo al gateway
// del perfil de atención (plugin hermes-webchat, puerto 8767), expuesto por el
// túnel Cloudflare como wss://atencion-hrf.syberloop.com. Sin key en el
// navegador ni proxy: el canal WebSocket no lleva autenticación por request.
const WS_URL =
  process.env.NEXT_PUBLIC_CHAT_WS_URL || "wss://atencion-hrf.syberloop.com";

/**
 * Los textos del widget en los dos idiomas (29-sep-2026). El idioma llega de
 * ChatDiferido, que lo lee de `<html lang>`: el chat vive en el layout raíz.
 *
 * Sin «precios» en el saludo, en ninguno de los dos: el agente no los da (los
 * confirma el asesor), y el saludo no debe prometer lo que el chat no responde.
 * Auditoría del 25-sep-2026.
 *
 * Solo van las dos props de texto que ya usábamos. Los demás textos los pone
 * el widget, y la etiqueta «Abrir chat» de su botón es de la que depende
 * MeInteresaButton para abrirlo: no se traduce sin cambiar ese selector.
 */
const TEXTOS = {
  es: {
    subtitulo: "Asesoría inmobiliaria · Cartagena",
    bienvenida:
      "👋 ¡Hola! Soy el asistente de la cartera inmobiliaria. Pregúntame por Doral Country, Doral West, Acacias Campestre u otro proyecto: ubicación, disponibilidad, entregas y más.",
  },
  en: {
    subtitulo: "Real estate advisory · Cartagena",
    bienvenida:
      "👋 Hi! I'm the virtual assistant for RHF Living's portfolio. Ask me about Doral Country, Doral West, Acacias Campestre or any other project: location, availability, delivery dates and more.",
  },
} satisfies Record<Idioma, Record<string, string>>;

export default function AgentChat({ idioma = "es" }: { idioma?: Idioma }) {
  const t = TEXTOS[idioma];
  return (
    <div
      style={
        {
          "--chat-primary": "#1F2A3D", // marino RHF
          "--chat-primary-hover": "#2a3a52",
          "--chat-primary-fg": "#FFFFFF",
          "--chat-bot-text": "#1F2A3D",
          "--chat-code-bg": "rgba(194,165,120,.15)",
          "--chat-shadow": "0 8px 24px rgba(31,42,61,.18)",
          "--chat-shadow-lg": "0 12px 48px rgba(31,42,61,.22)",
        } as React.CSSProperties
      }
    >
      <ChatWidget
        hermesUrl={WS_URL}
        brandName="RHF"
        brandSubtitle={t.subtitulo}
        welcomeMessage={t.bienvenida}
      />
    </div>
  );
}
