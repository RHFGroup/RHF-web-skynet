/**
 * Los glifos de los lugares de la zona (24 × 24, en trazo), en texto SVG.
 *
 * Los usan los dos mapas: el ilustrado de la sección Zona Norte (dentro de su
 * SVG) y el del territorio (dentro de los íconos de Leaflet, que piden HTML).
 * Un solo dibujo por lugar: si cambia aquí, cambia en los dos.
 */
import type { Icono } from "@/data/zona";

export const GLIFOS: Record<Icono, string> = {
  playa: '<path d="M4 20h16M12 20V9M4 9a8 5 0 0 1 16 0z"/><circle cx="19" cy="4" r="2"/>',
  canoa: '<path d="M2 14q10 6 20 0M5 16q7 3 14 0M9 13l7-9"/>',
  avion: '<path d="M3 13l18-7-5 14-3-6zM13 14l-4 5"/>',
  hospital: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 8v8M8 12h8"/>',
  convenciones: '<path d="M3 9l9-5 9 5M5 9v9M9.5 9v9M14.5 9v9M19 9v9M3 19h18"/>',
  centro: '<path d="M6 8h12l-1 12H7zM9 8a3 3 0 0 1 6 0"/>',
  obra: '<path d="M3 20h18M6 20l3-12h6l3 12M10 12h4M9 16h6"/>',
};

/** El glifo como <svg> suelto, para HTML (íconos de Leaflet, listas). */
export function svgGlifo(icono: Icono, tam = 16): string {
  return (
    `<svg width="${tam}" height="${tam}" viewBox="0 0 24 24" fill="none" stroke="currentColor" ` +
    `stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${GLIFOS[icono]}</svg>`
  );
}
