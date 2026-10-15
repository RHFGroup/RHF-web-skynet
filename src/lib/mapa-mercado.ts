/**
 * La geometría del mapa de obras y entorno (MapaMercado.tsx): la proyección,
 * las zonas y sus encuadres. No es un módulo de datos: aquí no hay ningún
 * punto que afirme dónde queda algo. Los puntos van en su coordenada
 * verificada (src/data/zona.ts, src/data/mercado.ts, proyectos.ts e
 * inmuebles.ts); las pruebas comprueban que cada punto caiga en su zona.
 *
 * Las zonas son una agrupación nuestra para leer el mapa, no límites
 * oficiales. Por eso en el mapa se dibujan con los bordes suaves: se funden
 * entre sí y solo la costa queda nítida.
 */
import type { ZonaId } from "../data/mercado.ts";

/** [latitud, longitud] */
export type LL = [number, number];

/**
 * Equirectangular sobre la región (a 10,5° N un grado de longitud mide 109,2
 * km y uno de latitud 111 km). Unidad del SVG: 10 metros. El origen es la
 * esquina noroeste del dibujo (src/lib/geografia.ts, BORDE).
 */
export const PROYECCION = { lon0: -75.8, lat0: 10.75, kx: 10920, ky: 11100 };

export const px = (lon: number) => Math.round((lon - PROYECCION.lon0) * PROYECCION.kx * 10) / 10;
export const py = (lat: number) => Math.round((PROYECCION.lat0 - lat) * PROYECCION.ky * 10) / 10;

export type Marco = { x: number; y: number; w: number; h: number };

/** Un encuadre a partir de su caja en grados. */
export function marco(oeste: number, este: number, sur: number, norte: number): Marco {
  return { x: px(oeste), y: py(norte), w: px(este) - px(oeste), h: py(sur) - py(norte) };
}

/**
 * Las zonas del mapa principal, en grados: tres manchas que no se tocan, con
 * tierra sin zona entre ellas (15-oct-2026: los rectángulos que cubrían todo
 * se leían como límites). En el mapa se dibujan con curvas suaves por estos
 * vértices y la costa las recorta: por eso se extienden mar adentro. Pasan
 * entre el aeropuerto (ciudad) y Las Américas (Zona Norte), y entre El Pozón
 * (ciudad) y Ternera (corredor); las pruebas cuidan que cada punto caiga en la
 * suya. La costa del Atlántico no está aquí: va en un recuadro, en esquema.
 */
export const FORMAS: Record<Exclude<ZonaId, "costa-atlantico">, LL[]> = {
  "zona-norte": [
    [10.63, -75.6], [10.63, -75.37], [10.585, -75.352], [10.5, -75.368], [10.452, -75.405],
    [10.438, -75.452], [10.456, -75.484], [10.4565, -75.53], [10.462, -75.6],
  ],
  ciudad: [
    [10.452, -75.62], [10.4505, -75.53], [10.447, -75.49], [10.43, -75.47], [10.414, -75.448],
    [10.398, -75.452], [10.389, -75.482], [10.35, -75.505], [10.3, -75.522], [10.285, -75.62],
  ],
  "corredor-turbaco": [
    [10.389, -75.468], [10.398, -75.438], [10.378, -75.4], [10.347, -75.372], [10.312, -75.38],
    [10.305, -75.418], [10.326, -75.466], [10.36, -75.489], [10.381, -75.488],
  ],
};

/** Los encuadres: todo el mapa y cada zona. */
export const ENCUADRES: Record<"general" | Exclude<ZonaId, "costa-atlantico">, Marco> = {
  general: marco(-75.615, -75.375, 10.3, 10.615),
  "zona-norte": marco(-75.555, -75.395, 10.425, 10.605),
  ciudad: marco(-75.6, -75.43, 10.355, 10.475),
  "corredor-turbaco": marco(-75.53, -75.37, 10.315, 10.44),
};

/** Dónde va el rótulo de cada zona en la vista general (tierra adentro, lejos de los puntos). */
export const ROTULO_ZONA: Record<Exclude<ZonaId, "costa-atlantico">, LL> = {
  "zona-norte": [10.585, -75.428],
  // Sobre Manga y la bahía: más al este pisaba el nombre de Acacias en el teléfono.
  ciudad: [10.415, -75.535],
  "corredor-turbaco": [10.33, -75.43],
};

/** ¿El punto [lat, lon] cae dentro del polígono? (Regla del rayo.) */
export function dentro([lat, lon]: LL, poligono: LL[]): boolean {
  let adentro = false;
  for (let i = 0, j = poligono.length - 1; i < poligono.length; j = i++) {
    const [yi, xi] = poligono[i];
    const [yj, xj] = poligono[j];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) adentro = !adentro;
  }
  return adentro;
}

/** La zona del mapa principal donde cae un punto, o null si cae fuera de las tres. */
export function zonaDelPunto(ll: LL): Exclude<ZonaId, "costa-atlantico"> | null {
  for (const id of Object.keys(FORMAS) as Exclude<ZonaId, "costa-atlantico">[]) {
    if (dentro(ll, FORMAS[id])) return id;
  }
  return null;
}

/** Interpola dos encuadres (t de 0 a 1). */
export function mezclar(a: Marco, b: Marco, t: number): Marco {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, w: a.w + (b.w - a.w) * t, h: a.h + (b.h - a.h) * t };
}

/** Entrada y salida suaves (cúbica). */
export const suavizar = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

// ── Las etiquetas del mapa acercado: que no se pisen ───────────────────────

/** Una caja en píxeles de pantalla. */
export type Caja = { x: number; y: number; w: number; h: number };

/** Un punto que pide etiqueta, ya en píxeles de pantalla. */
export type Etiquetable = {
  id: string;
  x: number;
  y: number;
  texto: string;
  /** Radio del marcador, en píxeles: la etiqueta empieza afuera de él. */
  radio: number;
  /** Los rótulos de barrio o pueblo van centrados sobre su punto, sin moverse. */
  centrada?: boolean;
};

/** Dónde va la etiqueta, relativa a su punto (en píxeles); `dy` es la línea de base. */
export type Ubicada = { dx: number; dy: number; ancla: "start" | "middle" | "end" };

/** El ancho aproximado de un texto en Montserrat seminegrita: 0,6 em por letra. */
export function anchoTexto(texto: string, letra: number): number {
  return texto.length * letra * 0.6;
}

/** ¿Se tocan dos cajas? (con 2 px de aire entre ellas) */
export const cruzan = (a: Caja, b: Caja, holgura = 2) =>
  a.x < b.x + b.w + holgura && b.x < a.x + a.w + holgura && a.y < b.y + b.h + holgura && b.y < a.y + a.h + holgura;

const cabe = (a: Caja, l: Caja) => a.x >= l.x && a.y >= l.y && a.x + a.w <= l.x + l.w && a.y + a.h <= l.y + l.h;

/**
 * Coloca las etiquetas en el orden en que llegan (el de su importancia): cada
 * una prueba a la derecha, a la izquierda, arriba y abajo de su punto, y toma
 * el primer lugar libre dentro de `limites`. Si no cabe en ninguno, el punto
 * va sin etiqueta: su nombre sigue en el globo, en la lista del panel y al
 * tocarlo. Mejor un punto sin nombre que dos nombres encimados.
 */
export function ubicarEtiquetas(
  items: Etiquetable[],
  obstaculos: Caja[],
  limites: Caja,
  letra = 10.5,
): Map<string, Ubicada> {
  const ocupadas = [...obstaculos];
  const salida = new Map<string, Ubicada>();
  const alto = letra * 1.25;
  const base = letra * 0.36; // del centro de la letra a su línea de base
  for (const it of items) {
    const w = anchoTexto(it.texto, letra);
    const sep = it.radio + 4;
    // Un nombre de lugar no tiene marcador: va sobre su punto o, si ahí no
    // cabe, apenas arriba o abajo de él.
    const candidatas: { caja: Caja; u: Ubicada }[] = it.centrada
      ? [0, -alto, alto].map((d) => ({
          caja: { x: it.x - w / 2, y: it.y - alto / 2 + d, w, h: alto },
          u: { dx: 0, dy: base + d, ancla: "middle" as const },
        }))
      : [
          { caja: { x: it.x + sep, y: it.y - alto / 2, w, h: alto }, u: { dx: sep, dy: base, ancla: "start" } },
          { caja: { x: it.x - sep - w, y: it.y - alto / 2, w, h: alto }, u: { dx: -sep, dy: base, ancla: "end" } },
          { caja: { x: it.x - w / 2, y: it.y - sep - alto, w, h: alto }, u: { dx: 0, dy: -sep - alto / 2 + base, ancla: "middle" } },
          { caja: { x: it.x - w / 2, y: it.y + sep, w, h: alto }, u: { dx: 0, dy: sep + alto / 2 + base, ancla: "middle" } },
        ];
    const libre = candidatas.find((c) => cabe(c.caja, limites) && !ocupadas.some((o) => cruzan(c.caja, o)));
    if (!libre) continue;
    ocupadas.push(libre.caja);
    salida.set(it.id, libre.u);
  }
  return salida;
}
