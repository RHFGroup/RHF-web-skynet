/**
 * Las empresas detrás de los proyectos de la cartera, con su logo.
 *
 * 28-sep-2026: Rafael pidió «una sección chica sobre los desarrolladores,
 * que primero aparezca Invercolombia, con logos».
 *
 * De dónde sale cada dato:
 *  · El papel de cada una, de la última página de los brochures oficiales
 *    («Vende», «Gerencia y construcción», «Promotora») y de `promotor` en
 *    proyectos.ts. Invercolombia comercializa también Doral (vault:
 *    projects/doral-west, «Comercializa: INVERCOLOMBIA MB S.A.S.»).
 *  · Los logos, del material oficial que entregaron: Invercolombia y MB de la
 *    pág. 24 del brochure de Blue Garden 2026; Doral Cartagena de la pág. 35
 *    de su manual de marca. Sin retoques de forma ni de color: solo se quitó
 *    el fondo gris de la franja.
 *  · Las promotoras de cada proyecto (Promotora BG y Promotora AC) no van: son
 *    sociedades del proyecto, no marcas que el comprador reconozca.
 */
export type Desarrollador = {
  id: string;
  nombre: string;
  logo: { src: string; ancho: number; alto: number };
  papel: string;
  /** Slugs de proyectos.ts. */
  proyectos: string[];
};

export const DESARROLLADORES: Desarrollador[] = [
  {
    id: "invercolombia",
    nombre: "Invercolombia",
    logo: { src: "/desarrolladores/invercolombia.webp", ancho: 409, alto: 168 },
    papel: "Comercializa",
    proyectos: ["doral-country", "doral-suite", "doral-west", "blue-garden", "acacias-campestre"],
  },
  {
    id: "doral-cartagena",
    nombre: "Doral Cartagena",
    logo: { src: "/desarrolladores/doral-cartagena.webp", ancho: 531, alto: 168 },
    papel: "Desarrolla",
    proyectos: ["doral-country", "doral-suite", "doral-west"],
  },
  {
    id: "mb-gerencia-y-construcciones",
    nombre: "MB Gerencia y Construcciones",
    logo: { src: "/desarrolladores/mb-gerencia-y-construcciones.webp", ancho: 306, alto: 168 },
    papel: "Gerencia y construcción",
    proyectos: ["acacias-campestre", "blue-garden"],
  },
];
