/**
 * Los últimos reels de Instagram, en fila, dentro de «Nuestras redes».
 *
 * 28-sep-2026: Rafael pidió «una sección con los últimos reels en forma
 * también horizontal».
 *
 * Reglas:
 *  · Solo reels publicados en @rafaelhf.realestate, con su enlace real. El
 *    video se ve en Instagram: la web muestra la portada y lleva allá.
 *  · La portada es un cuadro del propio video, sin subtítulos, guardado en
 *    public/reels/ sin metadatos.
 *  · El reel de un proyecto va con su ficha al lado: el precio con su corte,
 *    el área y la zona salen de proyectos.ts, como en la cartera (numeral
 *    2.16.1 de la Circular 004), nunca del video.
 *  · Quedaron fuera, al 28-sep-2026: el del lanzamiento de Doral Country
 *    (14-ago), porque anuncia unas fechas que ya pasaron, y el de la caída de
 *    las ventas No VIS (23-ago), porque la web va en positivo (regla de
 *    Rafael del 21-ago). Si Rafael los quiere, se agregan aquí.
 *  · Van del más nuevo al más viejo. Para sumar uno: la portada en
 *    public/reels/ y una entrada arriba de la lista.
 */
export type Reel = {
  /** El código del reel en Instagram. */
  id: string;
  titulo: string;
  /** Fecha de publicación, AAAA-MM-DD. */
  fecha: string;
  url: string;
  portada: string;
  /** El slug del proyecto en proyectos.ts, si el reel es de un proyecto. */
  proyecto?: string;
};

export const REELS: Reel[] = [
  {
    id: "Dcw9ysqxkVw",
    titulo: "Quién compra vivienda en Cartagena, y por qué en la Zona Norte",
    fecha: "2026-09-02",
    url: "https://www.instagram.com/rafaelhf.realestate/reel/Dcw9ysqxkVw/",
    portada: "/reels/zona-norte-2026-09-02.webp",
  },
  {
    id: "DcKdN3lsq1q",
    titulo: "Doral West: casas que crecen contigo",
    fecha: "2026-08-18",
    url: "https://www.instagram.com/rafaelhf.realestate/reel/DcKdN3lsq1q/",
    portada: "/reels/doral-west-2026-08-18.webp",
    proyecto: "doral-west",
  },
  {
    id: "DcG_P7hPzUd",
    titulo: "Doral Country: ¿primer piso o piso alto?",
    fecha: "2026-08-16",
    url: "https://www.instagram.com/rafaelhf.realestate/reel/DcG_P7hPzUd/",
    portada: "/reels/doral-country-2026-08-16.webp",
    proyecto: "doral-country",
  },
];
