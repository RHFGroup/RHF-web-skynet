"use client";

import ChatWidget from "@tp3/chat-widget";

// Widget flotante oficial (@tp3/chat-widget) → WebSocket directo al gateway
// del perfil de atención (plugin hermes-webchat, puerto 8767), expuesto por el
// túnel Cloudflare como wss://atencion-hrf.syberloop.com. Sin key en el
// navegador ni proxy: el canal WebSocket no lleva autenticación por request.
const WS_URL =
  process.env.NEXT_PUBLIC_CHAT_WS_URL || "wss://atencion-hrf.syberloop.com";

export default function AgentChat() {
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
        brandSubtitle="Asesoría inmobiliaria · Cartagena"
        // Sin «precios»: el agente no los da (los confirma el asesor), y el saludo
        // no debe prometer lo que el chat no responde. Auditoría del 25-sep-2026.
        welcomeMessage="👋 ¡Hola! Soy el asistente de la cartera inmobiliaria. Pregúntame por Doral Country, Doral West, Acacias Campestre u otro proyecto: ubicación, disponibilidad, entregas y más."
      />
    </div>
  );
}
