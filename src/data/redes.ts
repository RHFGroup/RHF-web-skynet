/**
 * Las redes que se publican en la web: la sección «Nuestras redes» de la home
 * y los íconos del pie.
 *
 * 25-sep-2026: Rafael pidió la sección («falta la sección de nuestras
 * redes»). La cuenta que existe y se usa es @rafaelhf.realestate (vault:
 * `research/mapa-de-la-carpeta-de-la-inmobiliaria-que-hay-hecho-que-esta-parado-y-que-contradice-al-vault`,
 * «Handle real»). El manual de marca proponía @rafaelhernandezfranco, pero esa
 * cuenta no es la que se usa.
 *
 * Reglas:
 *  · Solo redes que existan y que Rafael use. Si abre otra (Facebook, TikTok,
 *    YouTube), se agrega aquí con su enlace y aparece sola en la sección y en
 *    el pie.
 *  · Sin cifras de seguidores ni publicaciones: cambian todos los días y no
 *    tienen respaldo en el vault.
 *  · No se incrustan publicaciones: una publicación de un proyecto sin los
 *    datos del numeral 2.16.1 de la Circular 004 no puede ir en la página.
 */
export type Red = {
  id: "instagram";
  nombre: string;
  usuario: string;
  url: string;
};

export const REDES: Red[] = [
  {
    id: "instagram",
    nombre: "Instagram",
    usuario: "@rafaelhf.realestate",
    url: "https://www.instagram.com/rafaelhf.realestate/",
  },
];
