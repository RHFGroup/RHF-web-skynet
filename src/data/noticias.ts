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
 *  · 1-oct-2026 (Rafael: «quiero que estas noticias se vean elaboradas por
 *    nosotros»): cada noticia es un artículo propio de RHF Living en
 *    /inteligencia-de-mercado/<id>, con firma, `cuerpo` y `lectura`. Los
 *    hechos y las cifras siguen siendo los de la fuente, atribuidos en el
 *    texto, y el artículo cierra con el medio, la fecha y el enlace. El
 *    análisis es nuestro; la noticia, no: no se presenta como reportería
 *    propia (Ley 1480, art. 30).
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
  /**
   * El artículo de RHF Living (/inteligencia-de-mercado/<id>): párrafos con
   * palabras propias y solo datos de la fuente, cada uno atribuido.
   */
  cuerpo: string[];
  /**
   * «Nuestra lectura»: qué significa para quien vive o busca en la Zona
   * Norte. Sin precios, sin valorización prometida y sin cifras nuevas.
   */
  lectura: string;
};

/** La firma de los artículos de Inteligencia de mercado. */
export const AUTOR = "Rafael Hernández Franco";

export function getNoticia(id: string): Noticia | undefined {
  return NOTICIAS.find((n) => n.id === id);
}

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
    cuerpo: [
      "El Distrito anunció que en octubre de 2026 entregará los primeros dos kilómetros del Gran Malecón del Mar, el tramo que arranca en La Boquilla. Lo informó El Universal el 18 de septiembre.",
      "Según esa nota, la obra tiene una inversión prevista de $197.000 millones y suma más de 100.000 m² de espacio público frente al mar. Hasta que se haga la entrega, la contamos como una obra en curso con fecha anunciada.",
    ],
    lectura:
      "El malecón le da a la Zona Norte un frente de playa para caminar donde hoy hay obra. Para quien vive o piensa vivir entre La Boquilla y Crespo, es espacio público nuevo a pocos minutos de casa. Seguimos la entrega y la contaremos aquí.",
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
    cuerpo: [
      "La Alcaldía de Cartagena entregó el nuevo acceso vial de Tierra Baja, en la Zona Norte: 1.813 metros lineales de vías con andenes, una glorieta de retorno, señalización e iluminación, según El Universal.",
      "La obra tuvo una inversión de $20.407 millones. Es una vía terminada y en uso, no un anuncio.",
    ],
    lectura:
      "Las vías internas son las que se notan en el día a día: llegar a casa con andén, luz y señalización. Que los corregimientos del norte reciban obra terminada acompaña el crecimiento de la zona.",
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
    cuerpo: [
      "La Agencia Nacional de Infraestructura (ANI) entregó al Distrito, sin costo, el Parque Lineal Paseo Marítimo de Crespo y las obras de protección costera con sus siete espolones.",
      "Según el comunicado de la ANI, la entrega es un paso para avanzar en el Gran Malecón del Mar.",
    ],
    lectura:
      "Los espolones protegen la playa y el parque la convierte en paseo. Para Crespo, la puerta de entrada a la Zona Norte, es espacio público frente al mar que ya está entregado.",
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
    cuerpo: [
      "A mediados de junio de 2026, la construcción del nuevo megacolegio de Bayunca iba en 59,23 % de avance, según la Secretaría de Infraestructura del Distrito, citada por El Universal.",
      "El colegio tendrá media técnica agroindustrial. Sigue en obra: actualizaremos esta nota cuando haya un nuevo avance o la entrega.",
    ],
    lectura:
      "Un colegio público nuevo en el norte es infraestructura para las familias que ya viven en los corregimientos y para las que llegan. La oferta educativa cerca de casa pesa al elegir dónde vivir.",
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
    cuerpo: [
      "Arquitectura & Concreto inició las obras preliminares de Azul de Arenas, un desarrollo de más de 2 millones de m² a la salida de Cartagena hacia Barranquilla, según El Tiempo.",
      "De acuerdo con la empresa, la primera etapa de su centro comercial, Kristal Malls, suma un billón de pesos y estaría lista en 2029. Son cifras y plazos del promotor.",
    ],
    lectura:
      "Comercio y servicios a gran escala en el norte significan menos desplazamientos al centro para quienes viven en la zona. Es un proyecto de largo plazo, y lo seguiremos etapa por etapa.",
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
    cuerpo: [
      "El Distrito anunció un megacolegio público con vocación turística en La Boquilla, frente al mar, para más de mil estudiantes. Lo publicó El Tiempo el 20 de mayo de 2026.",
      "La inversión que calcula el Distrito supera los $20.000 millones, y el plan prevé dos meses de diseños y doce de obra. Por ahora es un anuncio.",
    ],
    lectura:
      "Un colegio con vocación turística conecta la formación de los jóvenes de La Boquilla con el turismo, la actividad que los rodea. Contaremos cuándo empiece la obra.",
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
    cuerpo: [
      "El Distrito construye la primera red de alcantarillado de Bayunca y Pontezuela, conectada a la planta de tratamiento de Punta Canoa, para más de 26.000 habitantes, según El Universal.",
      "La inversión es de $114.616 millones y el plazo, de 19 meses. La meta es llevar la cobertura de alcantarillado de estos corregimientos de 0 % a 100 %.",
    ],
    lectura:
      "El saneamiento básico es la base de cualquier desarrollo ordenado. Es una obra menos visible que un malecón, pero de las que más cambian la vida diaria en los corregimientos del norte.",
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
    cuerpo: [
      "Según datos de Camacol Bolívar publicados por El Universal, en 2025 la Zona Norte de Cartagena concentró casi el 70 % de las ventas de vivienda No VIS de la ciudad, la que supera el tope de interés social.",
      "Es una cifra del año completo, no una proyección.",
    ],
    lectura:
      "El dato muestra dónde se está comprando vivienda No VIS en Cartagena: en el norte. Para quien busca, eso se traduce en más proyectos para comparar en la misma zona.",
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
    cuerpo: [
      "El Centro Hospitalario Serena del Mar ocupa el puesto 18 entre los 50 hospitales de Colombia incluidos en World's Best Hospitals 2026, el ranking de Newsweek y Statista.",
      "Es el único hospital de Cartagena en la lista.",
    ],
    lectura:
      "Tener un hospital así dentro de la Zona Norte pesa para las familias, para las personas mayores y para quienes llegan de otras ciudades o del exterior. Es un servicio que ya funciona, no un plan.",
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
    cuerpo: [
      "El circuito vial interno de Punta Canoa, del programa distrital Vías para la Felicidad, llegó al 40 % de avance a mediados de febrero de 2026, según El Universal.",
      "Son cerca de 2 km de calles en concreto para unos 2.000 habitantes. La obra sigue en curso.",
    ],
    lectura:
      "Calles pavimentadas en los corregimientos acompañan el crecimiento del norte y conectan mejor a sus comunidades.",
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
    cuerpo: [
      "En el Día Mundial de los Humedales, guardias ambientales sembraron 100 plántulas de mangle rojo en La Boquilla, en la orilla de la Ciénaga de la Virgen, según El Universal.",
      "La siembra se hizo en una zona que Cardique ya había recuperado.",
    ],
    lectura:
      "La Ciénaga de la Virgen es parte del paisaje y del equilibrio ambiental de la Zona Norte. Cuidar sus manglares es cuidar el entorno en el que se vive.",
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
    cuerpo: [
      "Según Novus Civitas, la gestora de Serena del Mar, en 2025 las constructoras entregaron 1.300 apartamentos más y a diciembre vivían allí unas 8.000 personas. Lo publicó El Universal.",
      "Para 2026, la gestora anunció 1.300 viviendas tope VIS cerca de Tierra Baja. Son cifras de la gestora.",
    ],
    lectura:
      "Una ciudad planeada se mide por la gente que la habita. Que Serena del Mar sume residentes y amplíe su oferta hacia la vivienda tope VIS abre la zona a más tipos de compradores.",
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
    cuerpo: [
      "El hotel Faranda Collection Cartagena, miembro de Radisson Individuals, abrió el 10 de diciembre de 2025 en el sector de Morros, sobre el Anillo Vial, según Pasillo Turístico.",
      "Tiene 242 habitaciones.",
    ],
    lectura:
      "Cada hotel nuevo en el Anillo Vial suma servicios y movimiento turístico a la Zona Norte, y afianza el corredor como destino.",
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
