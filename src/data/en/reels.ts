/**
 * LOS ÚLTIMOS REELS, EN INGLÉS
 *
 * Encima de `src/data/reels.ts`: código, fecha, enlace, portada y proyecto
 * salen del español. Se traduce el título que muestra la web; el video sigue
 * en español en Instagram.
 */
import * as es from "@/data/reels";
import { traductor, type Diccionario } from "@/data/en/traducir";

const TEXTOS: Diccionario = {
  "Quién compra vivienda en Cartagena, y por qué en la Zona Norte":
    "Who buys homes in Cartagena, and why in the Zona Norte",
  "El dato que no te muestran en una sala de ventas": "The figure a sales office doesn't show you",
  "Doral West: casas que crecen contigo": "Doral West: homes that grow with you",
  "Doral Country: ¿primer piso o piso alto?": "Doral Country: ground floor or upper floor?",
  "El lanzamiento de Doral Country": "The Doral Country launch",
};

const t = traductor(TEXTOS);

export const modulo: typeof import("@/data/reels") = {
  ...es,
  REELS: es.REELS.map((r) => ({ ...r, titulo: t(r.titulo) })),
};
