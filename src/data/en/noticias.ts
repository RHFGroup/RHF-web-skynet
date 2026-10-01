/**
 * LAS NOTICIAS DE LA ZONA NORTE EN INGLÉS
 *
 * Encima de `src/data/noticias.ts`: el título y el resumen van en inglés; el
 * medio, la fecha y el enlace son los mismos. `tema` y `tipo` no se traducen
 * (filtran y marcan la tarjeta): se muestran con `TEMAS` y `MARCA_TIPO`, que
 * aquí van en inglés.
 *
 * Mismas reglas que en español: lo que está en obra o anunciado se dice así,
 * la cifra de un promotor va atribuida y nada de valorización prometida. Los
 * pesos se escriben «COP …», con la cifra exacta del artículo (docs/i18n.md).
 *
 * Cada traducción se busca por el texto exacto en español; si el español
 * cambia, sale el español nuevo hasta que se traduzca aquí.
 */
import * as es from "@/data/noticias";
import { fechaLarga } from "@/i18n/idioma";
import { traducirValores, traductor, type Diccionario } from "@/data/en/traducir";

const TEXTOS: Diccionario = {
  // ── Temas y marcas ───────────────────────────────────────────────────────
  "Infraestructura": "Infrastructure",
  "Vivienda": "Housing",
  "Turismo": "Tourism",
  "Educación y salud": "Education and health",
  "Inversión": "Investment",
  "Medio ambiente": "Environment",
  "En obra": "Under construction",
  "Anunciado": "Announced",

  // ── gran-malecon-primer-tramo ────────────────────────────────────────────
  "El Gran Malecón del Mar alista la entrega de su primer tramo":
    "The Gran Malecón del Mar gets ready to open its first section",
  "El Distrito anunció que en octubre entregará los primeros dos kilómetros del Gran Malecón del Mar, desde La Boquilla. La obra tiene una inversión prevista de $197.000 millones y más de 100.000 m² de espacio público.":
    "The city government announced that in October it will deliver the first two kilometers of the Gran Malecón del Mar, starting from La Boquilla. The project has a planned investment of COP 197,000 million and more than 100,000 m² of public space.",

  // ── tierra-baja-via-de-acceso ────────────────────────────────────────────
  "Tierra Baja estrena vía de acceso con glorieta e iluminación":
    "Tierra Baja opens a new access road with a roundabout and lighting",
  "La Alcaldía entregó el nuevo acceso vial de Tierra Baja, en la Zona Norte: 1.813 metros lineales de vías con andenes, glorieta de retorno, señalización e iluminación, con una inversión de $20.407 millones.":
    "The Mayor's Office delivered Tierra Baja's new road access in the Zona Norte: 1,813 linear meters of roads with sidewalks, a turnaround roundabout, signage and lighting, with an investment of COP 20,407 million.",

  // ── crespo-parque-lineal ─────────────────────────────────────────────────
  "Crespo recibe su parque lineal y siete espolones de protección costera":
    "Crespo receives its linear park and seven coastal-protection groins",
  "La ANI entregó al Distrito, sin costo, el Parque Lineal Paseo Marítimo de Crespo y las obras de protección costera con sus siete espolones, un paso para avanzar en el Gran Malecón del Mar.":
    "Colombia's National Infrastructure Agency (ANI) handed over to the city, at no cost, the Parque Lineal Paseo Marítimo de Crespo and the coastal-protection works with their seven groins, a step forward for the Gran Malecón del Mar.",

  // ── megacolegio-bayunca ──────────────────────────────────────────────────
  "El megacolegio de Bayunca pasa del 59 % de avance": "The Bayunca mega-school passes 59% completion",
  "A mediados de junio, la obra del nuevo megacolegio de Bayunca iba en 59,23 %, según la Secretaría de Infraestructura. Tendrá media técnica agroindustrial para la Zona Norte.":
    "By mid-June, construction of the new Bayunca mega-school was 59.23% complete, according to the city's Infrastructure Department. It will offer a technical high school track in agribusiness for the Zona Norte.",

  // ── azul-de-arenas ───────────────────────────────────────────────────────
  "Azul de Arenas arranca obras a la salida hacia Barranquilla":
    "Azul de Arenas starts work at the city's exit toward Barranquilla",
  "Arquitectura & Concreto inició las obras preliminares de Azul de Arenas, un desarrollo de más de 2 millones de m². Según la empresa, la primera etapa de su centro comercial, Kristal Malls, suma un billón de pesos y estaría lista en 2029.":
    // «Un billón» en español es un millón de millones: en inglés, «one trillion».
    "Arquitectura & Concreto began preliminary works on Azul de Arenas, a development of more than 2 million m². According to the company, the first phase of its shopping center, Kristal Malls, amounts to COP 1 trillion (one million million pesos) and would be ready in 2029.",

  // ── megacolegio-la-boquilla ──────────────────────────────────────────────
  "La Boquilla tendrá un megacolegio público frente al mar": "La Boquilla will have a public oceanfront mega-school",
  "El Distrito anunció un megacolegio público con vocación turística en La Boquilla, para más de mil estudiantes y con una inversión que calcula en más de $20.000 millones. El plan prevé dos meses de diseños y doce de obra.":
    "The city government announced a tourism-focused public mega-school in La Boquilla, for more than a thousand students, with an investment it estimates at more than COP 20,000 million. The plan calls for two months of design and twelve of construction.",

  // ── alcantarillado-bayunca-pontezuela ────────────────────────────────────
  "Bayunca y Pontezuela construyen su primera red de alcantarillado":
    "Bayunca and Pontezuela build their first sewer network",
  "El Distrito construye el alcantarillado de Bayunca y Pontezuela, conectado a la planta de tratamiento de Punta Canoa, para más de 26.000 habitantes. La inversión es de $114.616 millones y el plazo, de 19 meses.":
    "The city government is building the sewer system for Bayunca and Pontezuela, connected to the Punta Canoa treatment plant, for more than 26,000 residents. The investment is COP 114,616 million and the timeline is 19 months.",

  // ── zona-norte-no-vis-2025 ───────────────────────────────────────────────
  "La Zona Norte reúne casi el 70 % de las ventas de vivienda No VIS":
    "The Zona Norte accounts for almost 70% of non-VIS housing sales",
  "Según Camacol Bolívar, en 2025 la Zona Norte de Cartagena concentró casi el 70 % de las ventas de vivienda No VIS, la que supera el tope de interés social.":
    "According to Camacol Bolívar, in 2025 Cartagena's Zona Norte accounted for almost 70% of non-VIS housing sales, that is, homes priced above the social-interest housing cap.",

  // ── hospital-serena-newsweek ─────────────────────────────────────────────
  "El hospital de Serena del Mar, en el ranking mundial de Newsweek":
    "The Serena del Mar hospital makes Newsweek's world ranking",
  "El Centro Hospitalario Serena del Mar ocupa el puesto 18 entre los 50 hospitales de Colombia de World's Best Hospitals 2026, de Newsweek y Statista, y es el único de Cartagena en la lista.":
    "Centro Hospitalario Serena del Mar ranks 18th among the 50 Colombian hospitals in Newsweek and Statista's World's Best Hospitals 2026, and it is the only one from Cartagena on the list.",

  // ── punta-canoa-circuito-vial ────────────────────────────────────────────
  "Punta Canoa construye cerca de dos kilómetros de calles en concreto":
    "Punta Canoa builds nearly two kilometers of concrete streets",
  "El circuito vial interno de Punta Canoa, del programa distrital Vías para la Felicidad, llegó al 40 % de avance a mediados de febrero: cerca de 2 km de calles en concreto para unos 2.000 habitantes.":
    "Punta Canoa's internal road loop, part of the city's Vías para la Felicidad program, reached 40% completion by mid-February: nearly 2 km of concrete streets for about 2,000 residents.",

  // ── mangle-rojo-cienaga ──────────────────────────────────────────────────
  "Siembran mangle rojo en la orilla de la Ciénaga de la Virgen":
    "Red mangroves planted on the shore of the Ciénaga de la Virgen",
  "En el Día Mundial de los Humedales, guardias ambientales sembraron 100 plántulas de mangle rojo en La Boquilla, en una zona que Cardique ya había recuperado.":
    "On World Wetlands Day, environmental guards planted 100 red mangrove seedlings in La Boquilla, in an area that Cardique, the regional environmental authority, had already restored.",

  // ── serena-del-mar-residentes ────────────────────────────────────────────
  "Serena del Mar suma unos 8.000 residentes, según su gestora":
    "Serena del Mar reaches about 8,000 residents, according to its developer",
  "Según Novus Civitas, gestora de Serena del Mar, en 2025 las constructoras entregaron 1.300 apartamentos más y a diciembre vivían allí unas 8.000 personas. Para 2026 anunció 1.300 viviendas tope VIS cerca de Tierra Baja.":
    "According to Novus Civitas, the developer of Serena del Mar, builders delivered 1,300 more apartments in 2025, and about 8,000 people lived there as of December. For 2026, it announced 1,300 homes at the VIS price cap near Tierra Baja.",

  // ── faranda-collection-cartagena ─────────────────────────────────────────
  "Abre Faranda Collection Cartagena, con 242 habitaciones en la Zona Norte":
    "Faranda Collection Cartagena opens with 242 rooms in the Zona Norte",
  "El hotel Faranda Collection Cartagena, miembro de Radisson Individuals, abrió el 10 de diciembre de 2025 en el sector de Morros, sobre el Anillo Vial, con 242 habitaciones.":
    "The Faranda Collection Cartagena hotel, a member of Radisson Individuals, opened on December 10, 2025, in the Morros area, on the Anillo Vial, with 242 rooms.",
};

const t = traductor(TEXTOS);

const NOTICIAS = es.NOTICIAS.map((n) => ({ ...n, titulo: t(n.titulo), resumen: t(n.resumen) }));

/** «2026-09-18» → «September 18, 2026». A mano, como en español: sin `toLocaleDateString`. */
function fechaNoticia(iso: string): string {
  return fechaLarga(iso, "en");
}

export const modulo: typeof import("@/data/noticias") = {
  ...es,
  TEMAS: traducirValores(es.TEMAS, t),
  MARCA_TIPO: traducirValores(es.MARCA_TIPO, t),
  NOTICIAS,
  fechaNoticia,
};
