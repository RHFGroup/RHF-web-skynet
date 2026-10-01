/**
 * Los eventos del simulador para la capa de datos (sección 8 del prompt).
 *
 * Van a `dataLayer` como los demás del sitio (src/components/Analitica.tsx):
 * GTM solo los manda a GA4 y a Meta si la persona aceptó las cookies. Nunca
 * llevan cifras exactas de ingreso, nombres ni teléfonos: solo rangos.
 *
 *   simulator_view                 entrada
 *   simulator_quickstart_complete  proposito, rango_ingreso, rango_ahorro
 *   simulator_mode_change          modalidad
 *   simulator_complete             proyecto, modalidad, plazo_anios, rango_ingreso, cumple_limite
 *   simulator_matches_view         n_alcanzan
 *   simulator_lever_click          palanca
 *   simulator_scenario_save        n_escenarios
 *   simulator_whatsapp             proyecto
 *   simulator_pdf_lead             puntaje, event_id   → «Lead» de compra en Meta
 *   simulator_prequal_lead         puntaje, event_id   → «Lead» de compra en Meta
 */
export function evento(nombre: string, datos: Record<string, string | number | boolean> = {}): void {
  if (typeof window === "undefined") return;
  const w = window as unknown as { dataLayer?: unknown[] };
  (w.dataLayer ||= []).push({ event: nombre, ...datos });
}

/** Un id único para deduplicar el Lead entre el píxel y la API de conversiones. */
export function idDeEvento(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `sim-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  }
}
