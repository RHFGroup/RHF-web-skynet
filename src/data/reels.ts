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
 *  · Más tarde el mismo 28-sep Rafael pidió más reels y más variados: «1 q
 *    se vea rafa y otro no». Entraron el del lanzamiento de Doral Country
 *    (14-ago) y el del dato de la sala de ventas (23-ago), que antes habían
 *    quedado fuera; el de la sala de ventas, con su aprobación. En la web
 *    van sin cifras ni fechas del lanzamiento: el título y la portada son
 *    neutros, el dato y las fechas quedan en Instagram.
 *  · Las portadas se turnan: con Rafael, sin Rafael (tipografía o render),
 *    con Rafael… Van del más nuevo al más viejo y, a la vez, se turnan. Para
 *    sumar uno: la portada en public/reels/ y una entrada en la lista que
 *    respete las dos cosas (si no se puede, manda la fecha).
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
  /** ¿Sale Rafael en la portada? Las portadas se turnan con y sin él. */
  conRafael: boolean;
};

export const REELS: Reel[] = [
  {
    id: "Dcw9ysqxkVw",
    titulo: "Quién compra vivienda en Cartagena, y por qué en la Zona Norte",
    fecha: "2026-09-02",
    url: "https://www.instagram.com/rafaelhf.realestate/reel/Dcw9ysqxkVw/",
    portada: "/reels/zona-norte-2026-09-02.webp",
    conRafael: true,
  },
  {
    id: "DcaDHrRzKTD",
    titulo: "El dato que no te muestran en una sala de ventas",
    fecha: "2026-08-23",
    url: "https://www.instagram.com/rafaelhf.realestate/reel/DcaDHrRzKTD/",
    // La portada es el cuadro del título, antes de la cifra.
    portada: "/reels/dato-sala-de-ventas-2026-08-23.webp",
    conRafael: false,
  },
  {
    id: "DcKdN3lsq1q",
    titulo: "Doral West: casas que crecen contigo",
    fecha: "2026-08-18",
    url: "https://www.instagram.com/rafaelhf.realestate/reel/DcKdN3lsq1q/",
    portada: "/reels/doral-west-2026-08-18.webp",
    proyecto: "doral-west",
    conRafael: true,
  },
  {
    id: "DcG_P7hPzUd",
    titulo: "Doral Country: ¿primer piso o piso alto?",
    fecha: "2026-08-16",
    url: "https://www.instagram.com/rafaelhf.realestate/reel/DcG_P7hPzUd/",
    // El cuadro de «Seis torres» (render del promotor), sin el subtítulo.
    portada: "/reels/doral-country-seis-torres-2026-08-16.webp",
    proyecto: "doral-country",
    conRafael: false,
  },
  {
    id: "DcCGPPihk3m",
    titulo: "El lanzamiento de Doral Country",
    fecha: "2026-08-14",
    url: "https://www.instagram.com/rafaelhf.realestate/reel/DcCGPPihk3m/",
    portada: "/reels/doral-country-lanzamiento-2026-08-14.webp",
    proyecto: "doral-country",
    conRafael: true,
  },
];
