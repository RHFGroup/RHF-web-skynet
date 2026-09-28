/**
 * Noticias de la Zona Norte: la sección de la home y la página /noticias.
 *
 * 28-sep-2026: Rafael pidió una «sección chica de newsletters y que abra en
 * una sección nueva, especialmente noticias que hablen de la zona y el
 * crecimiento y cosas positivas», con suscripción por correo.
 *
 * Reglas (research del vault:
 * `research/noticias-positivas-de-la-zona-norte-verificadas-el-28-sep-2026`):
 *  · Cada noticia es real y lleva su fuente, su fecha de publicación y el
 *    enlace al artículo original. Se abrió cada enlace y se confirmó el dato.
 *  · El título y el resumen van con palabras propias: no se copian frases del
 *    artículo. La noticia completa se lee en la fuente.
 *  · Lo que está en obra o solo anunciado se dice así (`tipo`), y la tarjeta
 *    lo marca. Nada de valorización prometida ni superlativos sin respaldo.
 *  · Una cifra de un promotor va atribuida («según su gestora»).
 *  · El nuevo aeropuerto no entra mientras no tenga un hito oficial.
 *  · Van de la más nueva a la más vieja; la home muestra las tres primeras.
 *    Las «en obra» se revisan cuando pasa su fecha: la del Gran Malecón,
 *    después del 15-oct-2026.
 */
export type TemaNoticia =
  | "infraestructura"
  | "vivienda"
  | "turismo"
  | "educacion-salud"
  | "inversion"
  | "medio-ambiente";

export type Noticia = {
  id: string;
  titulo: string;
  resumen: string;
  /** Hecho cumplido, obra en curso, anuncio o cifra del mercado. */
  tipo: "hecho" | "en obra" | "anuncio" | "cifra";
  tema: TemaNoticia;
  /** El medio o la entidad que la publicó. */
  fuente: string;
  /** Fecha de publicación del artículo, AAAA-MM-DD. */
  fecha: string;
  url: string;
};

export const TEMAS: Record<TemaNoticia, string> = {
  infraestructura: "Infraestructura",
  vivienda: "Vivienda",
  turismo: "Turismo",
  "educacion-salud": "Educación y salud",
  inversion: "Inversión",
  "medio-ambiente": "Medio ambiente",
};

/** La marca de la tarjeta para lo que todavía no está terminado. */
export const MARCA_TIPO: Partial<Record<Noticia["tipo"], string>> = {
  "en obra": "En obra",
  anuncio: "Anunciado",
};

export const NOTICIAS: Noticia[] = [
  {
    id: "gran-malecon-primer-tramo",
    titulo: "El Gran Malecón del Mar alista la entrega de su primer tramo",
    resumen:
      "El Distrito anunció que en octubre entregará los primeros dos kilómetros del Gran Malecón del Mar, desde La Boquilla. La obra tiene una inversión prevista de $197.000 millones y más de 100.000 m² de espacio público.",
    tipo: "en obra",
    tema: "infraestructura",
    fuente: "El Universal",
    fecha: "2026-09-18",
    url: "https://www.eluniversal.com.co/cartagena/2026/09/18/gran-malecon-del-mar-solo-falta-un-mes/",
  },
  {
    id: "tierra-baja-via-de-acceso",
    titulo: "Tierra Baja estrena vía de acceso con glorieta e iluminación",
    resumen:
      "La Alcaldía entregó el nuevo acceso vial de Tierra Baja, en la Zona Norte: 1.813 metros lineales de vías con andenes, glorieta de retorno, señalización e iluminación, con una inversión de $20.407 millones.",
    tipo: "hecho",
    tema: "infraestructura",
    fuente: "El Universal",
    fecha: "2026-09-15",
    url: "https://www.eluniversal.com.co/cartagena/2026/09/15/en-fotos-tierra-baja-estrena-nueva-via-de-acceso-en-la-zona-norte-de-cartagena/",
  },
  {
    id: "crespo-parque-lineal",
    titulo: "Crespo recibe su parque lineal y siete espolones de protección costera",
    resumen:
      "La ANI entregó al Distrito, sin costo, el Parque Lineal Paseo Marítimo de Crespo y las obras de protección costera con sus siete espolones, un paso para avanzar en el Gran Malecón del Mar.",
    tipo: "hecho",
    tema: "infraestructura",
    fuente: "ANI",
    fecha: "2026-08-01",
    url: "https://www.ani.gov.co/w/ani-entrega-a-cartagena-el-parque-lineal-de-crespo-y-las-obras-de-protecciones-costeras-junto-con-sus-siete-espolones-para-avanzar-en-el-gran-malec%C3%B3n-del-mar",
  },
  {
    id: "megacolegio-bayunca",
    titulo: "El megacolegio de Bayunca pasa del 59 % de avance",
    resumen:
      "A mediados de junio, la obra del nuevo megacolegio de Bayunca iba en 59,23 %, según la Secretaría de Infraestructura. Tendrá media técnica agroindustrial para la Zona Norte.",
    tipo: "en obra",
    tema: "educacion-salud",
    fuente: "El Universal",
    fecha: "2026-06-17",
    url: "https://www.eluniversal.com.co/cartagena/2026/06/17/asi-va-la-construccion-de-los-5-nuevos-megacolegios-de-cartagena/",
  },
  {
    id: "azul-de-arenas",
    titulo: "Azul de Arenas arranca obras a la salida hacia Barranquilla",
    resumen:
      "Arquitectura & Concreto inició las obras preliminares de Azul de Arenas, un desarrollo de más de 2 millones de m². Según la empresa, la primera etapa de su centro comercial, Kristal Malls, suma un billón de pesos y estaría lista en 2029.",
    tipo: "en obra",
    tema: "inversion",
    fuente: "El Tiempo",
    fecha: "2026-05-23",
    url: "https://www.eltiempo.com/economia/empresas/primer-centro-comercial-de-lujo-con-laguna-artificial-la-apuesta-de-arquitectura-concreto-3557924",
  },
  {
    id: "megacolegio-la-boquilla",
    titulo: "La Boquilla tendrá un megacolegio público frente al mar",
    resumen:
      "El Distrito anunció un megacolegio público con vocación turística en La Boquilla, para más de mil estudiantes y con una inversión que calcula en más de $20.000 millones. El plan prevé dos meses de diseños y doce de obra.",
    tipo: "anuncio",
    tema: "educacion-salud",
    fuente: "El Tiempo",
    fecha: "2026-05-20",
    url: "https://www.eltiempo.com/colombia/otras-ciudades/cartagena-el-pueblo-pesquero-de-la-boquilla-tendra-el-primer-megacolegio-publico-con-vocacion-turistica-ubicado-frente-al-mar-caribe-3557082",
  },
  {
    id: "alcantarillado-bayunca-pontezuela",
    titulo: "Bayunca y Pontezuela construyen su primera red de alcantarillado",
    resumen:
      "El Distrito construye el alcantarillado de Bayunca y Pontezuela, conectado a la planta de tratamiento de Punta Canoa, para más de 26.000 habitantes. La inversión es de $114.616 millones y el plazo, de 19 meses.",
    tipo: "en obra",
    tema: "infraestructura",
    fuente: "El Universal",
    fecha: "2026-04-10",
    url: "https://www.eluniversal.com.co/cartagena/2026/04/10/alcantarillado-en-bayunca-y-pontezuela-avanza-con-varios-frentes-de-trabajo/",
  },
  {
    id: "zona-norte-no-vis-2025",
    titulo: "La Zona Norte reúne casi el 70 % de las ventas de vivienda No VIS",
    resumen:
      "Según Camacol Bolívar, en 2025 la Zona Norte de Cartagena concentró casi el 70 % de las ventas de vivienda No VIS, la que supera el tope de interés social.",
    tipo: "cifra",
    tema: "vivienda",
    fuente: "El Universal",
    fecha: "2026-03-03",
    url: "https://www.eluniversal.com.co/economica/2026/03/02/esta-es-la-zona-de-cartagena-que-lidera-la-comercializacion-de-unidades-no-vis/",
  },
  {
    id: "hospital-serena-newsweek",
    titulo: "El hospital de Serena del Mar, en el ranking mundial de Newsweek",
    resumen:
      "El Centro Hospitalario Serena del Mar ocupa el puesto 18 entre los 50 hospitales de Colombia de World's Best Hospitals 2026, de Newsweek y Statista, y es el único de Cartagena en la lista.",
    tipo: "hecho",
    tema: "educacion-salud",
    fuente: "Newsweek",
    fecha: "2026-02-25",
    url: "https://rankings.newsweek.com/worlds-best-hospitals-2026/colombia",
  },
  {
    id: "punta-canoa-circuito-vial",
    titulo: "Punta Canoa construye cerca de dos kilómetros de calles en concreto",
    resumen:
      "El circuito vial interno de Punta Canoa, del programa distrital Vías para la Felicidad, llegó al 40 % de avance a mediados de febrero: cerca de 2 km de calles en concreto para unos 2.000 habitantes.",
    tipo: "en obra",
    tema: "infraestructura",
    fuente: "El Universal",
    fecha: "2026-02-15",
    url: "https://www.eluniversal.com.co/cartagena/2026/02/15/alcaldia-anuncia-avances-del-40-en-obras-del-circuito-vial-en-punta-canoa/",
  },
  {
    id: "mangle-rojo-cienaga",
    titulo: "Siembran mangle rojo en la orilla de la Ciénaga de la Virgen",
    resumen:
      "En el Día Mundial de los Humedales, guardias ambientales sembraron 100 plántulas de mangle rojo en La Boquilla, en una zona que Cardique ya había recuperado.",
    tipo: "hecho",
    tema: "medio-ambiente",
    fuente: "El Universal",
    fecha: "2026-02-03",
    url: "https://www.eluniversal.com.co/cartagena/2026/02/03/siembran-mangles-para-recuperar-orillas-de-la-cienaga-de-la-virgen/",
  },
  {
    id: "serena-del-mar-residentes",
    titulo: "Serena del Mar suma unos 8.000 residentes, según su gestora",
    resumen:
      "Según Novus Civitas, gestora de Serena del Mar, en 2025 las constructoras entregaron 1.300 apartamentos más y a diciembre vivían allí unas 8.000 personas. Para 2026 anunció 1.300 viviendas tope VIS cerca de Tierra Baja.",
    tipo: "cifra",
    tema: "vivienda",
    fuente: "El Universal",
    fecha: "2025-12-16",
    url: "https://www.eluniversal.com.co/economica/2025/12/15/los-nuevos-desarrollos-que-tendra-serena-del-mar-en-cartagena-en-el-2026/",
  },
  {
    id: "faranda-collection-cartagena",
    titulo: "Abre Faranda Collection Cartagena, con 242 habitaciones en la Zona Norte",
    resumen:
      "El hotel Faranda Collection Cartagena, miembro de Radisson Individuals, abrió el 10 de diciembre de 2025 en el sector de Morros, sobre el Anillo Vial, con 242 habitaciones.",
    tipo: "hecho",
    tema: "turismo",
    fuente: "Pasillo Turístico",
    fecha: "2025-12-10",
    url: "https://pasilloturistico.com/choice-hotels-inaugura-faranda-collection-cartagena-y-fortalece-su-expansion-en-el-segmento-upscale-en-colombia/",
  },
];

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

/**
 * «2026-09-18» → «18 de septiembre de 2026». A mano, sin `toLocaleDateString`:
 * el ICU del build y el del navegador pueden no coincidir y romper la
 * hidratación (ver `formatoPesos` en proyectos.ts).
 */
export function fechaNoticia(iso: string): string {
  const [a, m, d] = iso.split("-").map(Number);
  return `${d} de ${MESES[m - 1]} de ${a}`;
}

/** El dominio de la fuente, para decir a dónde lleva el enlace. */
export function dominio(url: string): string {
  return new URL(url).hostname.replace(/^www\./, "");
}
