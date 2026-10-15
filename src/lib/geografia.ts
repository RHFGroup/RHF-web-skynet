/**
 * La geografía de nuestros mapas ilustrados: la costa, la bahía, las islas, la
 * ciénaga, la Vía al Mar, el viaducto y el trazado del Gran Malecón del Mar,
 * en latitud y longitud.
 *
 * Es un dibujo guiado por OpenStreetMap, no cartografía, y cada mapa lo dice
 * en su leyenda. Los puntos y los rótulos de lugares NO viven aquí: van en su
 * coordenada verificada (src/data/zona.ts y src/data/mercado.ts).
 *
 * La comparten el mapa ilustrado de la Zona Norte (MapaIlustrado.tsx) y el
 * mapa de obras y entorno de Inteligencia de mercado (MapaMercado.tsx). Cada
 * uno proyecta a su manera; los trazos son los mismos, para que la costa no
 * cambie de forma de un mapa a otro.
 */

/** [latitud, longitud] */
export type LL = [number, number];

/**
 * Hasta dónde se extiende el dibujo. Va bastante más allá de los encuadres:
 * el lienzo cambia de proporción con la pantalla y nunca debe asomar un borde
 * vacío.
 */
export const BORDE = { oeste: -75.8, este: -75.2, sur: 10.25, norte: 10.75 };

/** La costa, de Bocagrande hacia el norte. */
export const COSTA: LL[] = [
  [10.383, -75.552], [10.389, -75.566], [10.398, -75.563], [10.41, -75.559], [10.42, -75.555],
  [10.428, -75.55], [10.432, -75.542], [10.436, -75.535], [10.441, -75.527], [10.447, -75.519],
  [10.453, -75.512], [10.46, -75.5072], [10.468, -75.502], [10.476, -75.4968], [10.4865, -75.4925],
  [10.496, -75.4955], [10.506, -75.4985], [10.515, -75.4995], [10.52, -75.4975], [10.5245, -75.4948],
  [10.532, -75.4968], [10.543, -75.4995], [10.551, -75.5018], [10.5568, -75.5035], [10.562, -75.501],
  [10.572, -75.495], [10.585, -75.488], [10.6, -75.48], [10.615, -75.472], [10.63, -75.465],
  [10.66, -75.448], [10.7, -75.425], [10.75, -75.395],
];

/** La Bahía de Cartagena (cerrada). */
export const PUNTOS_BAHIA: LL[] = [
  [10.3, -75.575], [10.34, -75.566], [10.372, -75.556], [10.384, -75.549], [10.394, -75.548],
  [10.404, -75.549], [10.413, -75.545], [10.419, -75.539], [10.417, -75.53], [10.409, -75.526],
  [10.397, -75.528], [10.384, -75.527], [10.37, -75.522], [10.34, -75.53], [10.3, -75.535],
];

/** La isla de Manga (cerrada). */
export const PUNTOS_MANGA: LL[] = [
  [10.418, -75.538], [10.416, -75.53], [10.409, -75.5295], [10.404, -75.533], [10.407, -75.539], [10.413, -75.5415],
];

/** Tierra Bomba, al suroeste de Bocagrande: solo silueta, sin rótulo (cerrada). */
export const PUNTOS_TIERRA_BOMBA: LL[] = [
  [10.397, -75.566], [10.392, -75.579], [10.38, -75.588], [10.365, -75.59], [10.352, -75.585],
  [10.35, -75.572], [10.36, -75.563], [10.375, -75.56], [10.388, -75.559],
];

/** La Ciénaga de la Virgen (cerrada). */
export const PUNTOS_CIENAGA: LL[] = [
  [10.4871, -75.4905], [10.483, -75.4855], [10.478, -75.476], [10.472, -75.466], [10.462, -75.459],
  [10.448, -75.457], [10.433, -75.462], [10.421, -75.47], [10.415, -75.48], [10.418, -75.49],
  [10.428, -75.497], [10.44, -75.502], [10.452, -75.501], [10.464, -75.4985], [10.474, -75.4935],
  [10.481, -75.4915],
];

/** La Vía al Mar, del Centro hacia Barranquilla. */
export const PUNTOS_VIA_AL_MAR: LL[] = [
  [10.425, -75.54], [10.436, -75.532], [10.442, -75.524], [10.449, -75.515], [10.456, -75.508],
  [10.463, -75.5025], [10.471, -75.4975], [10.478, -75.4925], [10.4855, -75.4885], [10.494, -75.4845],
  [10.503, -75.4775], [10.512, -75.4735], [10.5165, -75.4712], [10.526, -75.4675], [10.537, -75.463],
  [10.55, -75.459], [10.565, -75.4545], [10.585, -75.4485], [10.605, -75.442], [10.63, -75.435],
  [10.68, -75.415],
];

/** El Viaducto del Gran Manglar, sobre la ciénaga. */
export const PUNTOS_VIADUCTO: LL[] = [[10.447, -75.508], [10.458, -75.5015], [10.468, -75.496], [10.477, -75.4905]];

/** Trazado ilustrativo del Gran Malecón del Mar: La Tenaza → Playa Azul (~5,1 km). */
export const PUNTOS_MALECON: LL[] = [
  [10.4302, -75.5462], [10.4345, -75.5385], [10.4385, -75.5315], [10.443, -75.5245], [10.4485, -75.5175],
  [10.457, -75.5088],
];

/**
 * Curva suave (Catmull-Rom → Bézier) por los puntos, con la proyección que
 * pase cada mapa: se lee como dibujo.
 */
export function curvaPor(
  pts: LL[],
  px: (lon: number) => number,
  py: (lat: number) => number,
  cerrada = false,
): string {
  const p = pts.map(([lat, lon]) => [px(lon), py(lat)]);
  if (cerrada) p.push(p[0], p[1]);
  let d = `M${p[0][0]},${p[0][1]}`;
  for (let i = 0; i < p.length - (cerrada ? 2 : 1); i++) {
    const p0 = p[i - 1] ?? p[i];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0]},${p2[1]}`;
  }
  return cerrada ? d + " Z" : d;
}
