/**
 * LA ZONA NORTE — LUGARES, OBRAS Y CIFRAS (FUENTE ÚNICA)
 *
 * De aquí salen el mapa ilustrado de la sección Zona Norte y los puntos del
 * mapa del territorio. Los proyectos NO viven aquí: siguen en proyectos.ts.
 *
 * REGLAS
 *  · Cada punto lleva su coordenada VERIFICADA y su fuente. Sin coordenada
 *    verificada, el lugar puede nombrarse en una lista, nunca marcarse en un
 *    mapa. Un pin mal puesto es un dato falso con mejor diseño.
 *  · Las coordenadas son de OpenStreetMap (nodo o vía), consultadas el
 *    24-sep-2026 a través de mapcarta.com, que publica el identificador OSM
 *    de cada elemento. La Boquilla y Serena del Mar ya estaban verificadas en
 *    el vault (research «Zona Norte de Cartagena — qué se puede afirmar») y
 *    coinciden con sus nodos OSM.
 *  · Cada obra lleva su estado —Entregado, En obra, En estudio— con fuente y
 *    fecha. Lo que viene nunca se presenta como un hecho.
 *  · Toda cifra nueva necesita nota en el vault antes de entrar aquí. La del
 *    Gran Malecón del Mar está en research/el-gran-malecon-del-mar-que-se-
 *    puede-afirmar-y-que-no.
 *  · 25-sep-2026 (pedido de Rafael): la sección «Lo que viene» se integró a
 *    las categorías. Cada obra va en su categoría con su estado —En obra, En
 *    estudio— y puede llevar una imagen del proceso (`imagen`), solo si es
 *    foto propia o material autorizado, con su fecha. Los lugares nuevos
 *    (colegios, universidades, comercio, golf, transporte) y sus fuentes
 *    están en research/el-territorio-de-la-zona-norte-lo-que-se-puede-
 *    afirmar-de-colegios-salud-comercio-y-transporte.
 */

export type Estado = "Entregado" | "En obra" | "En estudio";

export type Categoria = "turismo" | "salud" | "educacion" | "comercio" | "conectividad" | "obras";

export type Icono =
  | "playa"
  | "canoa"
  | "avion"
  | "hospital"
  | "convenciones"
  | "obra"
  | "centro"
  | "universidad"
  | "escuela"
  | "combustible"
  | "golf"
  | "bus";

/** Los filtros del mapa del territorio, en el orden en que se muestran. */
export const CATEGORIAS: { id: Exclude<Categoria, "obras">; nombre: string }[] = [
  { id: "turismo", nombre: "Playas y turismo" },
  { id: "salud", nombre: "Salud" },
  { id: "educacion", nombre: "Educación" },
  { id: "comercio", nombre: "Comercio y ocio" },
  { id: "conectividad", nombre: "Conectividad" },
];

export type Coordenada = {
  lat: number;
  lon: number;
  /** De dónde sale la coordenada: «OpenStreetMap, nodo 703211074». */
  fuente: string;
};

export type Lugar = {
  id: string;
  nombre: string;
  /** El nombre en el mapa, si el oficial es largo para un rótulo. */
  nombreCorto?: string;
  /** Una frase corta, en afirmativo. */
  frase: string;
  /** «hoy»: lo que ya existe y funciona. «viene»: obras en desarrollo. */
  capa: "hoy" | "viene";
  categorias: Categoria[];
  icono: Icono;
  /** Solo para obras. */
  estado?: Estado;
  /** null: se nombra en la lista, pero no se marca en ningún mapa. */
  coordenada: Coordenada | null;
  /** Qué respalda que existe y funciona (o su estado, si es una obra). */
  fuente: string;
  /** Fecha de la verificación o de la fuente. */
  fecha: string;
  /** Solo obras con trazado: la etiqueta que acompaña la línea en el mapa. */
  etiquetaTrazado?: string;
  /**
   * Una imagen del proceso de la obra. Solo foto propia o material que su
   * dueño autorice, con crédito y fecha. Sin imagen, la tarjeta va sin ella.
   */
  imagen?: { src: string; alt: string; credito: string; fecha: string };
};

const OSM = (tipo: "nodo" | "vía", id: number) => `OpenStreetMap, ${tipo} ${id}`;
const VERIFICADO = "24 de septiembre de 2026";
const VERIFICADO_25 = "25 de septiembre de 2026";

export const LUGARES: Lugar[] = [
  // ── Hoy puedes disfrutar ────────────────────────────────────────────────
  {
    id: "la-boquilla",
    nombre: "La Boquilla",
    frase: "Playa, y recorridos en canoa por los túneles de manglar de la Ciénaga de la Virgen.",
    capa: "hoy",
    categorias: ["turismo"],
    icono: "canoa",
    coordenada: { lat: 10.476044, lon: -75.494705, fuente: OSM("nodo", 703211074) },
    fuente: "Recorridos ofrecidos en 2026 por varios operadores locales (GetYourGuide, Viator)",
    fecha: VERIFICADO,
  },
  {
    id: "las-americas",
    nombre: "Centro de Convenciones Las Américas",
    nombreCorto: "Las Américas",
    frase: "Congresos, ferias y eventos junto a la playa, en el Hotel Las Américas.",
    capa: "hoy",
    categorias: ["turismo", "comercio"],
    icono: "convenciones",
    coordenada: { lat: 10.4596, lon: -75.505102, fuente: OSM("vía", 96612330) },
    fuente: "hotellasamericas.com.co, sección del centro de convenciones",
    fecha: VERIFICADO,
  },
  {
    id: "manzanillo",
    nombre: "Manzanillo del Mar",
    frase: "Playa y hoteles de playa sobre el corredor.",
    capa: "hoy",
    categorias: ["turismo"],
    icono: "playa",
    coordenada: { lat: 10.51473, lon: -75.497729, fuente: OSM("nodo", 703211080) },
    fuente: "Reseñas de visitantes de 2026 (Tripadvisor) y hoteles en operación",
    fecha: VERIFICADO,
  },
  {
    id: "punta-canoa",
    nombre: "Punta Canoa",
    frase: "Playa en el extremo norte del corredor.",
    capa: "hoy",
    categorias: ["turismo"],
    icono: "playa",
    coordenada: { lat: 10.55646, lon: -75.50027, fuente: OSM("nodo", 703211901) },
    fuente: "Playa de Punta Canoa, con reseñas de visitantes de 2026 (Tripadvisor)",
    fecha: VERIFICADO,
  },
  // ── Salud ───────────────────────────────────────────────────────────────
  {
    // El id se conserva: los tiempos «al hospital» de proyectos.ts apuntan aquí.
    id: "serena-del-mar",
    nombre: "Serena del Mar",
    frase:
      "Aquí funciona el Hospital Serena del Mar, operado por la Fundación Santa Fe de Bogotá: más de 60 especialidades y urgencias las 24 horas. Es el único hospital de Cartagena en el ranking World's Best Hospitals 2026 de Newsweek.",
    capa: "hoy",
    categorias: ["salud"],
    icono: "hospital",
    // La coordenada es la del sector de Serena del Mar, donde queda el
    // hospital; el edificio no tiene nodo propio en OpenStreetMap.
    coordenada: { lat: 10.50637, lon: -75.47068, fuente: OSM("nodo", 8657336575) + " (sector de Serena del Mar)" },
    fuente:
      "hospitalserenadelmar.com (especialidades, urgencias y operador) · Newsweek y Statista, World's Best Hospitals 2026 – Colombia: puesto 18 de 50, único de Cartagena",
    fecha: VERIFICADO_25,
  },

  // ── Educación ───────────────────────────────────────────────────────────
  {
    id: "uniandes",
    nombre: "Universidad de los Andes · Sede Caribe",
    nombreCorto: "Uniandes",
    frase: "La sede Caribe de la Universidad de los Andes abrió en mayo de 2018 en Serena del Mar.",
    capa: "hoy",
    categorias: ["educacion"],
    icono: "universidad",
    coordenada: { lat: 10.507618, lon: -75.471567, fuente: OSM("vía", 1082170787) },
    fuente: "uniandes.edu.co, «Así fue la inauguración de la Sede Caribe»",
    fecha: VERIFICADO_25,
  },
  {
    id: "tadeo",
    nombre: "Universidad Jorge Tadeo Lozano · Campus Internacional del Caribe",
    nombreCorto: "Tadeo",
    frase: "Campus de pregrado sobre la Vía al Mar, en el kilómetro 13.",
    capa: "hoy",
    categorias: ["educacion"],
    icono: "universidad",
    coordenada: { lat: 10.550576, lon: -75.460701, fuente: OSM("vía", 95910511) },
    fuente: "utadeo.edu.co, ubicación de la Tadeo Caribe",
    fecha: VERIFICADO_25,
  },
  {
    id: "jorge-washington",
    nombre: "Colegio Jorge Washington",
    nombreCorto: "Jorge Washington",
    frase: "Colegio de preescolar a grado 12, en el kilómetro 12 del Anillo Vial.",
    capa: "hoy",
    categorias: ["educacion"],
    icono: "escuela",
    coordenada: { lat: 10.544022, lon: -75.461868, fuente: OSM("vía", 95705882) },
    fuente: "Colegio Jorge Washington: dirección y grados (Wikipedia)",
    fecha: VERIFICADO_25,
  },
  {
    id: "britanico",
    nombre: "Colegio Británico de Cartagena",
    nombreCorto: "Colegio Británico",
    frase: "Colegio bilingüe con Bachillerato Internacional, en el kilómetro 12 del Anillo Vial.",
    capa: "hoy",
    categorias: ["educacion"],
    icono: "escuela",
    coordenada: { lat: 10.539753, lon: -75.475011, fuente: OSM("vía", 96425276) },
    fuente: "cognita.com, ficha del Colegio Británico de Cartagena (Redcol)",
    fecha: VERIFICADO_25,
  },
  {
    id: "altair",
    nombre: "Gimnasio Altair",
    nombreCorto: "Altair",
    frase: "Colegio en el kilómetro 14 del Anillo Vial.",
    capa: "hoy",
    categorias: ["educacion"],
    icono: "escuela",
    coordenada: { lat: 10.545106, lon: -75.444991, fuente: OSM("vía", 95705026) },
    fuente: "gimnasioaltair.edupage.org, contacto",
    fecha: VERIFICADO_25,
  },

  // ── Comercio y ocio ─────────────────────────────────────────────────────
  {
    id: "las-ramblas",
    nombre: "Centro Comercial Las Ramblas",
    nombreCorto: "Las Ramblas",
    frase: "Supermercado Carulla, restaurantes y estación de servicio.",
    capa: "hoy",
    categorias: ["comercio"],
    icono: "centro",
    coordenada: { lat: 10.515624, lon: -75.470073, fuente: OSM("nodo", 10579157641) + " (Carulla Las Ramblas)" },
    fuente: "OpenStreetMap: Carulla, restaurantes y estación Primax en Las Ramblas",
    fecha: VERIFICADO_25,
  },
  {
    id: "terpel-altoque",
    nombre: "Estación Terpel con tienda Altoque",
    nombreCorto: "Terpel",
    frase: "Estación de servicio con tienda de conveniencia Altoque.",
    capa: "hoy",
    categorias: ["comercio"],
    icono: "combustible",
    coordenada: { lat: 10.535031, lon: -75.460724, fuente: OSM("vía", 1353435219) },
    fuente: "OpenStreetMap: estación Terpel (vía 1353435219) y tienda Altoque (nodo 12523307430)",
    fecha: VERIFICADO_25,
  },
  {
    id: "karibana",
    nombre: "Karibana",
    frase: "Campo de golf de 18 hoyos diseñado por Nicklaus Design, abierto en 2012.",
    capa: "hoy",
    categorias: ["comercio", "turismo"],
    icono: "golf",
    coordenada: { lat: 10.541669, lon: -75.491696, fuente: OSM("nodo", 4228091890) },
    fuente: "nicklausdesign.com, Club Karibana",
    fecha: VERIFICADO_25,
  },

  // ── Conectividad ────────────────────────────────────────────────────────
  {
    id: "aeropuerto",
    nombre: "Aeropuerto Rafael Núñez",
    frase: "Vuelos nacionales e internacionales, en el límite sur del corredor.",
    capa: "hoy",
    categorias: ["conectividad"],
    icono: "avion",
    coordenada: { lat: 10.44151, lon: -75.51291, fuente: OSM("vía", 100101180) },
    fuente: "aeropuertocartagena.com.co",
    fecha: VERIFICADO,
  },
  {
    id: "terminal-norte",
    nombre: "Terminal de Transportes del Norte",
    nombreCorto: "Terminal del Norte",
    frase: "Abrió en noviembre de 2022 con buses hacia Barranquilla y Santa Marta.",
    capa: "hoy",
    categorias: ["conectividad"],
    icono: "bus",
    coordenada: { lat: 10.492025, lon: -75.477685, fuente: OSM("vía", 1298648998) },
    fuente: "Semana, 22-nov-2022: apertura y primeras rutas",
    fecha: VERIFICADO_25,
  },
  {
    id: "transcaribe-c017",
    nombre: "Ruta C017 de Transcaribe",
    nombreCorto: "Transcaribe C017",
    frase:
      "Bodeguita – Zona Norte, desde febrero de 2024: pasa por la Terminal del Norte y Serena del Mar, de lunes a viernes en la mañana y en la tarde.",
    capa: "hoy",
    categorias: ["conectividad"],
    icono: "bus",
    // Es una ruta: no tiene un punto que marcar.
    coordenada: null,
    fuente: "transcaribe.gov.co, inauguración de la ruta C017 · El Espectador, 13-feb-2024",
    fecha: "febrero de 2024",
  },

  // ── Obras: cada una va en su categoría, con su estado ───────────────────
  {
    id: "gran-malecon",
    nombre: "Gran Malecón del Mar",
    frase: "5,1 km de malecón frente al mar, entre Playa Azul, en La Boquilla, y La Tenaza, junto al Centro Histórico.",
    capa: "viene",
    categorias: ["obras", "turismo"],
    icono: "obra",
    estado: "En obra",
    // El trazado se dibuja sobre la costa en el mapa ilustrado; como punto no
    // se marca en el mapa del territorio hasta tener su trazado verificado.
    coordenada: null,
    fuente: "Alcaldía de Cartagena (cartagena.gov.co) · El Universal, 9-jul-2026: obra iniciada en agosto de 2025",
    fecha: "julio de 2026",
    etiquetaTrazado: "En obra desde agosto de 2025",
  },
  {
    id: "doble-calzada-tierra-baja",
    nombre: "Doble calzada de Tierra Baja",
    frase: "La vía local del corredor, con 95 % de avance.",
    capa: "viene",
    categorias: ["obras", "conectividad"],
    icono: "obra",
    estado: "En obra",
    // Es la coordenada del corregimiento, no la del trazado de la vía.
    coordenada: { lat: 10.489864, lon: -75.475607, fuente: OSM("nodo", 703211079) + " (corregimiento de Tierra Baja)" },
    fuente: "Seguimiento de obra",
    fecha: "agosto de 2026",
  },
  {
    id: "kristal-malls",
    nombre: "Kristal Malls",
    // «El más grande de Latinoamérica» no tiene respaldo: la constructora lo
    // presenta como el primer shopping resort de Latinoamérica, y así se cita.
    frase:
      "Su constructora lo presenta como el primer shopping resort de Latinoamérica: comercio, hotel y una laguna cristalina abierta al público. Obras iniciadas en marzo de 2026.",
    capa: "viene",
    categorias: ["obras", "comercio"],
    icono: "centro",
    estado: "En obra",
    coordenada: null,
    fuente:
      "Arquitectura y Concreto (arquitecturayconcreto.com/kristal-mall) · Inmobiliare, 12-mar-2026 · La República, 25-may-2024",
    fecha: "marzo de 2026",
  },
  {
    id: "nuevo-aeropuerto",
    nombre: "Nuevo aeropuerto",
    frase:
      // Sin el plazo del evaluador (nov-2026): una pieza permanente no publica
      // fechas de trámite (criteria/una-pieza-permanente-no-publica-fechas-de-tramite).
      "La ANI evalúa la iniciativa privada de un nuevo aeropuerto cerca de Bayunca, al norte de la ciudad.",
    capa: "viene",
    categorias: ["obras", "conectividad"],
    icono: "avion",
    estado: "En estudio",
    coordenada: null,
    fuente: "El Universal, 14-may-2026 · Agencia Nacional de Infraestructura (ANI)",
    fecha: "mayo de 2026",
  },
];

/**
 * Lugares que se rotulan en el mapa como geografía, sin tarjeta. También con
 * su coordenada verificada: un rótulo en el lugar equivocado también afirma.
 * El rótulo lleva un punto pequeño en la coordenada y el nombre al lado.
 *
 * Los barrios solo se ven en el encuadre de la ciudad: son geografía, no
 * ubicación de proyectos. «Centro Histórico» es el nodo del barrio Centro de
 * OSM, no el centroide del municipio que devuelve una búsqueda por nombre
 * (ese caía ~10 km al norte; ver la nota de copy de la Zona Norte).
 */
export type Rotulo = {
  nombre: string;
  tipo: "barrio" | "pueblo";
  coordenada: Coordenada;
  /** Se oculta mientras ese lugar esté a la vista: comparten coordenada. */
  cedeA?: string;
};

export const ROTULOS: Rotulo[] = [
  { nombre: "Centro Histórico", tipo: "barrio", coordenada: { lat: 10.42361, lon: -75.55168, fuente: OSM("nodo", 1348541634) + " (barrio Centro)" } },
  { nombre: "Bocagrande", tipo: "barrio", coordenada: { lat: 10.40409, lon: -75.55342, fuente: OSM("nodo", 9509460195) } },
  { nombre: "Manga", tipo: "barrio", coordenada: { lat: 10.4144, lon: -75.53754, fuente: OSM("nodo", 1258197261) } },
  {
    nombre: "Tierra Baja",
    tipo: "pueblo",
    coordenada: { lat: 10.489864, lon: -75.475607, fuente: OSM("nodo", 703211079) },
    cedeA: "doble-calzada-tierra-baja",
  },
  { nombre: "Pontezuela", tipo: "pueblo", coordenada: { lat: 10.5438, lon: -75.43956, fuente: OSM("nodo", 703211082) } },
];

/**
 * El bloque de Cartagena, en el medio de la sección: la ciudad → por qué
 * crece hacia el norte → la Zona Norte. Sin cifras. Los dos hechos que
 * nombra tienen fuente: el Centro Histórico es parte del bien «Puerto,
 * fortalezas y conjunto monumental de Cartagena» de la Lista del Patrimonio
 * Mundial de la UNESCO (1984), y el aeropuerto opera vuelos nacionales e
 * internacionales. Research en el vault: research/el-gran-malecon-del-mar-
 * que-se-puede-afirmar-y-que-no (sección «Cartagena»).
 *
 * Rafael elige el titular: `titulo` es la opción A y se publica;
 * `tituloAlterno` (opción B) solo se ve en la vista previa.
 */
export const CARTAGENA = {
  titulo: "De la ciudad amurallada a la costa norte",
  tituloAlterno: "Una ciudad para vivir frente al Caribe",
  texto:
    "Cartagena reúne historia, mar Caribe y conexión con el mundo. Su Centro Histórico es Patrimonio de la Humanidad, la playa hace parte del día a día y el aeropuerto internacional queda a la entrada de la Zona Norte. Con el Centro, Bocagrande y Manga consolidados, la ciudad crece hacia el norte por la Vía al Mar, y ahí se concentra hoy la vivienda nueva.",
};

/**
 * Las cifras de la sección, con su fuente. Ya estaban publicadas y salen del
 * copy del vault (projects/inmobiliaria/copy-de-la-seccion-zona-norte-que-
 * publicamos-y-que-no).
 */
export const CIFRA_OFERTA = {
  valor: 70,
  titulo: "Aquí está la oferta",
  rotulo: "de la vivienda nueva que se comercializa en Bolívar está en la Zona Norte",
  texto:
    "Donde se concentra la oferta se concentra también la competencia entre constructores, y eso se nota en las condiciones de compra.",
  resto: "resto de Bolívar",
  fuente: "Camacol Bolívar",
};

export const HECHOS: {
  titulo: string;
  texto: string;
  cifra: { valor: number; sufijo: string; rotulo: string } | null;
  estado: Estado;
  fuente: string;
  /** Fecha del dato. */
  fecha: string;
}[] = [
  {
    titulo: "La vía ya está hecha",
    texto:
      "El Viaducto del Gran Manglar opera desde 2018 y el corredor completo hacia Barranquilla desde 2021: $778.576 millones que conectan a cerca de 3 millones de personas.",
    cifra: { valor: 8, sufijo: " años", rotulo: "lleva el viaducto sobre la ciénaga en operación, desde 2018" },
    estado: "Entregado",
    fuente: "Obra entregada",
    fecha: "agosto de 2026",
  },
  {
    titulo: "El entorno ya funciona",
    texto: "El hospital Santa Fe y el campus de Uniandes funcionan aquí desde 2018, a 12 km del Centro.",
    cifra: null,
    estado: "Entregado",
    fuente: "Research de la Zona Norte, contrastada contra fuentes primarias",
    fecha: "agosto de 2026",
  },
  {
    titulo: "La vía local, casi lista",
    texto: "La doble calzada de Tierra Baja entra en su tramo final de obra.",
    cifra: { valor: 95, sufijo: " %", rotulo: "de avance en la doble calzada de Tierra Baja" },
    estado: "En obra",
    fuente: "Seguimiento de obra",
    fecha: "agosto de 2026",
  },
  {
    titulo: "El comercio que viene",
    texto: "Kristal Malls está en obra desde marzo de 2026, con apertura prevista para 2027.",
    cifra: null,
    estado: "En obra",
    fuente: "Prensa local",
    fecha: "agosto de 2026",
  },
];

export const NOTA_FUENTES =
  "Cifras contrastadas contra fuentes primarias. Concentración de oferta: Camacol Bolívar. Actualizado a agosto de 2026.";

/** Las fuentes del mapa y del bloque de Cartagena, para el pie de la sección. */
export const NOTA_MAPA =
  "Patrimonio de la Humanidad: UNESCO, Lista del Patrimonio Mundial. Lugares del mapa: OpenStreetMap, verificados el 24 y el 25 de septiembre de 2026. Gran Malecón del Mar: Alcaldía de Cartagena y El Universal, julio de 2026.";

/**
 * Tiempos de trayecto desde la Zona Norte, medidos y entregados por Rafael,
 * con su fuente y fecha. Vacío: la franja de datos rápidos del mapa del
 * territorio no se muestra. Nunca se estiman ni se copian de un portal.
 */
export const TIEMPOS_ZONA: {
  destino: string;
  minutos: number;
  desde: string;
  fuente: string;
  fecha: string;
}[] = [];
