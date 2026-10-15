/**
 * EL MAPA DE OBRAS Y ENTORNO — ZONAS, OBRAS Y PRECIOS (FUENTE ÚNICA)
 *
 * De aquí salen el mapa de la sección Inteligencia de mercado
 * (src/components/MapaMercado.tsx) y su bloque de precios
 * (src/components/PreciosVivienda.tsx). Los lugares de la Zona Norte y sus
 * obras siguen en src/data/zona.ts, y los proyectos e inmuebles en
 * proyectos.ts e inmuebles.ts: el mapa los lee de ahí.
 *
 * De dónde sale cada dato, en el vault (14-oct-2026):
 *  · research/el-mapa-de-obras-y-entorno-ubicaciones-y-obras-verificadas-al-14-oct-2026
 *  · research/precios-de-la-vivienda-en-cartagena-y-turbaco-que-dicen-los-datos-oficiales-y-que-no
 *  · research/valorizacion-en-la-publicidad-de-vivienda-lo-que-permite-la-ley-colombiana
 *  · el copy: projects/inmobiliaria/copy-del-mapa-de-obras-y-entorno-que-publicamos-y-que-no
 *
 * REGLAS (las de zona.ts, y cuatro más)
 *  · Cada punto lleva su coordenada VERIFICADA y su fuente. Sin coordenada
 *    verificada, el lugar se nombra en la lista, nunca se marca.
 *  · Cada obra lleva su estado, su fuente y su fecha. Lo que viene nunca se
 *    presenta como hecho: «Anunciado» es un anuncio oficial —con recursos
 *    anunciados o como propuesta— sin contrato publicado.
 *  · Ni fechas de trámite ni avances en porcentaje: caducan (criteria/una-
 *    pieza-permanente-no-publica-fechas-de-tramite). Las fechas que van son
 *    las de hechos cumplidos y las de las fuentes.
 *  · Las zonas son una agrupación nuestra para leer el mapa, no límites
 *    oficiales, y el mapa lo dice.
 *  · Nada de valorización: ni tasas futuras, ni «+%», ni proyecciones (Ley
 *    1480, arts. 29 y 30). Los escenarios de precio viven solo en la versión
 *    privada, con sus supuestos y advertencias.
 *  · El IPVN del DANE para «Cartagena» es el de «Cartagena AU (Cartagena y
 *    Turbaco)»: se rotula así.
 */
// Ruta relativa, no «@/»: así `npm test` (node --test) carga este módulo tal
// cual, igual que los motores de src/lib/.
import { LUGARES, type Coordenada } from "./zona.ts";

export type ZonaId = "zona-norte" | "ciudad" | "corredor-turbaco" | "costa-atlantico";

/**
 * El estado de una obra en el mapa. «Entregado», «En obra» y «En estudio» son
 * los de zona.ts; «Anunciado» es un anuncio oficial sin contrato publicado.
 */
export type EstadoObra = "Entregado" | "En obra" | "Anunciado" | "En estudio";

export type ZonaMapa = {
  id: ZonaId;
  nombre: string;
  /** El rótulo sobre el mapa. */
  rotulo: string;
  frase: string;
  /** La costa del Atlántico va en un recuadro aparte, en esquema. */
  recuadro?: boolean;
};

export const ZONAS: ZonaMapa[] = [
  {
    id: "zona-norte",
    nombre: "Zona Norte · Vía al Mar",
    rotulo: "Zona Norte",
    frase: "Del aeropuerto a Punta Canoa, entre el mar y la Ciénaga de la Virgen, y tierra adentro hasta Pontezuela.",
  },
  {
    id: "ciudad",
    nombre: "Cartagena · la ciudad",
    rotulo: "La ciudad",
    frase: "El Centro Histórico, Bocagrande, Manga y Crespo, alrededor de la bahía y de la ciénaga.",
  },
  {
    id: "corredor-turbaco",
    nombre: "Corredor Cartagena–Turbaco",
    rotulo: "Corredor a Turbaco",
    frase: "Ternera y la salida hacia Turbaco, al sureste de la ciudad.",
  },
  {
    id: "costa-atlantico",
    nombre: "Costa del Atlántico",
    rotulo: "Costa del Atlántico",
    frase: "Juan de Acosta, sobre el mar, entre Cartagena y Barranquilla.",
    recuadro: true,
  },
];

/** Una obra del mapa, o un lugar que ya funciona y no está en zona.ts. */
export type ObraMapa = {
  id: string;
  zona: ZonaId;
  nombre: string;
  /** Una frase, en afirmativo, sin adjetivos de venta. */
  frase: string;
  /** null: es un lugar que ya funciona («Lo que ya funciona»), no una obra. */
  estado: EstadoObra | null;
  /** null: se nombra en la lista, pero no se marca en el mapa. */
  coordenada: Coordenada | null;
  fuente: string;
  /** Fecha de la fuente o del hecho. */
  fecha: string;
};

const aeropuerto = LUGARES.find((l) => l.id === "aeropuerto")?.coordenada ?? null;

/**
 * Las obras nuevas del mapa (las de la Zona Norte que ya estaban siguen en
 * zona.ts: el Gran Malecón, la doble calzada de Tierra Baja, Kristal Malls y
 * el nuevo aeropuerto). Fuera de esta lista, con su razón en la research: la
 * inversión del aeropuerto de Bayunca ([Disputado]), Buenavista Serena del Mar
 * ([Claim de proveedor]), el peaje de Turbaco (medida con plazo), la reversión
 * del corredor de carga a INVÍAS y todo lo que tiene una sola fuente.
 */
export const OBRAS: ObraMapa[] = [
  // ── Zona Norte ──────────────────────────────────────────────────────────
  {
    id: "alcantarillado-bayunca",
    zona: "zona-norte",
    nombre: "Alcantarillado de Bayunca y Pontezuela",
    frase:
      "Más de 55 km de redes y dos estaciones de bombeo hacia la planta de tratamiento de Punta Canoa, para más de 26.000 habitantes.",
    estado: "En obra",
    coordenada: null,
    fuente: "El Universal, 5-ene-2026 y 10-abr-2026: obra iniciada el 20 de octubre de 2025",
    fecha: "abril de 2026",
  },
  {
    id: "gran-viaducto-del-mar",
    zona: "zona-norte",
    nombre: "Gran Viaducto del Mar",
    frase: "El alcalde presentó la propuesta de un segundo viaducto de 4,7 km, paralelo al del Gran Manglar.",
    estado: "Anunciado",
    coordenada: null,
    fuente: "El Universal y Valora Analitik, 27-nov-2025",
    fecha: "noviembre de 2025",
  },

  // ── La ciudad ───────────────────────────────────────────────────────────
  {
    id: "aeropuerto-ampliacion",
    zona: "ciudad",
    nombre: "Ampliación del Aeropuerto Rafael Núñez",
    frase:
      "En obra desde marzo de 2025: la terminal pasa de 25.154 m² a 44.748 m², con una nueva terminal internacional.",
    estado: "En obra",
    // Las obras son en el aeropuerto: la coordenada es la del aeropuerto.
    coordenada: aeropuerto,
    fuente: "La República, 20-mar-2026 · El Universal, 10-jul-2026, con datos de la ANI",
    fecha: "julio de 2026",
  },
  {
    id: "parque-lineal-crespo",
    zona: "ciudad",
    nombre: "Parque Lineal de Crespo y protección costera",
    frase:
      "La ANI entregó al Distrito el paseo marítimo de Crespo y la protección costera con siete espolones, un paso hacia el Gran Malecón del Mar.",
    estado: "Entregado",
    coordenada: null,
    fuente: "Agencia Nacional de Infraestructura (ANI), 1-ago-2026 · El Heraldo, 2-ago-2026",
    fecha: "1 de agosto de 2026",
  },
  {
    id: "perimetral-7-de-agosto",
    zona: "ciudad",
    nombre: "Vía Perimetral hasta el barrio 7 de Agosto",
    frase: "Una prolongación de 894 m en paralelo a la pista del aeropuerto; su primer tramo abrió al tránsito en septiembre de 2026.",
    estado: "En obra",
    coordenada: null,
    fuente: "El Universal, 17-sep-2026 · El Tiempo, 18-sep-2026",
    fecha: "septiembre de 2026",
  },
  {
    id: "perimetral-el-pozon",
    zona: "ciudad",
    nombre: "Vía Perimetral hasta El Pozón",
    frase: "El Gobierno nacional anunció $130.000 millones para los 4,8 km que faltan, a orillas de la Ciénaga de la Virgen.",
    estado: "Anunciado",
    coordenada: null,
    fuente: "El Universal y El Tiempo, 18-sep-2026 · Forbes, 19-sep-2026",
    fecha: "septiembre de 2026",
  },
  {
    id: "malecon-segunda-fase",
    zona: "ciudad",
    nombre: "Gran Malecón del Mar, segunda fase",
    frase:
      "El Gobierno nacional anunció $87.703 millones para extenderlo de La Tenaza al Baluarte de Santo Domingo, a la entrada de Bocagrande.",
    estado: "Anunciado",
    coordenada: null,
    fuente: "El Tiempo, 18-sep-2026 · Valora Analitik y Forbes, 19-sep-2026",
    fecha: "septiembre de 2026",
  },
  {
    id: "pot-cartagena",
    zona: "ciudad",
    nombre: "Nuevo Plan de Ordenamiento Territorial",
    frase: "El Distrito tramita la revisión del POT, que define hacia dónde y cómo crece la ciudad; el vigente es de 2001.",
    estado: "En estudio",
    coordenada: null,
    fuente: "El Tiempo, 13-ago-2026 · El Universal, 22-jul-2026 y 8-oct-2026",
    fecha: "octubre de 2026",
  },

  // ── Corredor Cartagena–Turbaco ──────────────────────────────────────────
  {
    id: "zona-franca-cristalina",
    zona: "corredor-turbaco",
    nombre: "Zona Franca Permanente Cristalina",
    frase: "Zona franca de 65 hectáreas en la zona rural de Turbaco, declarada por el Ministerio de Comercio en 2020.",
    estado: null,
    coordenada: null,
    fuente: "MinCIT, listado de zonas francas declaradas (corte 8-nov-2023) · El Universal, 4-sep-2024",
    fecha: "septiembre de 2024",
  },

  // ── Costa del Atlántico ─────────────────────────────────────────────────
  {
    id: "acueducto-regional-norte",
    zona: "costa-atlantico",
    nombre: "Acueducto Regional del Norte",
    frase:
      "Toma agua del río Magdalena para ocho municipios del norte del Atlántico, entre ellos Juan de Acosta, Tubará y Puerto Colombia.",
    estado: "En obra",
    coordenada: null,
    fuente: "Gobernación del Atlántico y El Tiempo, 11-may-2026 · Diario La Libertad, 24-sep-2026",
    fecha: "septiembre de 2026",
  },
  {
    id: "alcantarillado-juan-de-acosta",
    zona: "costa-atlantico",
    nombre: "Alcantarillado de Juan de Acosta",
    frase: "Una estación de bombeo y una planta de tratamiento de aguas residuales, para 16.000 habitantes al inicio.",
    estado: "En obra",
    coordenada: null,
    fuente: "Gobernación del Atlántico y El Heraldo, 30-jun-2026",
    fecha: "junio de 2026",
  },
  {
    id: "playa-santa-veronica",
    zona: "costa-atlantico",
    nombre: "Recuperación de la playa de Santa Verónica",
    frase: "Espolones y relleno hidráulico en 2,1 km de costa, para recuperar cerca de 80.000 m² de playa.",
    estado: "En obra",
    coordenada: null,
    fuente: "El Tiempo, 8-ene-2026 · El Espectador, 8-mar-2026 · ANLA, 25-ago-2025",
    fecha: "marzo de 2026",
  },
];

/**
 * En qué zona del mapa va cada lugar de zona.ts. Todos son de la Zona Norte,
 * salvo el aeropuerto, que queda en su límite sur: en el mapa va con la ciudad.
 */
export const ZONA_DE_LUGAR: Record<string, ZonaId> = { aeropuerto: "ciudad" };

/**
 * Nombres de lugar que solo usa este mapa (los del centro y de la Zona Norte
 * están en zona.ts, ROTULOS): dan contexto donde hay pocos puntos, como el
 * corredor a Turbaco. Son geografía, no afirmaciones sobre nuestras opciones,
 * y van en el nodo de OpenStreetMap del lugar (consultado el 15-oct-2026),
 * nunca en un centro calculado.
 */
export type RotuloMapa = {
  nombre: string;
  zona: Exclude<ZonaId, "costa-atlantico">;
  coordenada: Coordenada;
};

export const ROTULOS_MAPA: RotuloMapa[] = [
  {
    nombre: "Turbaco",
    zona: "corredor-turbaco",
    coordenada: { lat: 10.3305871, lon: -75.4127345, fuente: "OpenStreetMap, nodo 703169669 (place=town), consultado el 15-oct-2026" },
  },
  {
    nombre: "El Pozón",
    zona: "ciudad",
    coordenada: { lat: 10.4137224, lon: -75.4598907, fuente: "OpenStreetMap, nodo 1488485592 (place=neighbourhood), consultado el 15-oct-2026" },
  },
];

/**
 * En qué zona va cada proyecto o inmueble. Acacias Campestre: su promotor dice
 * «Cartagena», y su punto (frente al SENA de Ternera) está en el corredor a
 * Turbaco, que en este mapa incluye a Ternera. La zona del mapa es geografía,
 * no municipio.
 */
export const ZONA_DE_OPCION: Record<string, ZonaId> = {
  "doral-west": "zona-norte",
  "doral-country": "zona-norte",
  "doral-suite": "zona-norte",
  "doral-suites-320": "zona-norte",
  "cavana-303-torre-10": "zona-norte",
  "morros-park-421": "zona-norte",
  "morros-park-519": "zona-norte",
  "blue-garden": "corredor-turbaco",
  "acacias-campestre": "corredor-turbaco",
  "aguamarina-803": "costa-atlantico",
};

/** La zona de una opción nueva que aún no está en la tabla: por su filtro de cartera. */
export function zonaDeOpcion(slug: string, zonaFiltro: string): ZonaId {
  const fija = ZONA_DE_OPCION[slug];
  if (fija) return fija;
  if (zonaFiltro === "Vía Turbaco") return "corredor-turbaco";
  if (zonaFiltro === "Atlántico") return "costa-atlantico";
  if (zonaFiltro === "Cartagena") return "ciudad";
  return "zona-norte";
}

// ── Los precios de la vivienda nueva: DANE, IPVN ────────────────────────────

/**
 * Variación anual del IPVN: IV trimestre de cada año contra el IV del año
 * anterior, en porcentaje, para «Cartagena AU (Cartagena y Turbaco)» y el
 * total nacional. Cada cifra, de su boletín (la tabla con el boletín de cada
 * año está en la research de precios del vault). En 2018 y 2020 el boletín
 * trae también 6,81 y 0,73 en una tabla, probablemente sin Turbaco: se usa la
 * cifra del área urbana.
 */
export const IPVN = {
  area: "Cartagena y Turbaco",
  serie: [
    { anio: 2018, area: 6.84, nacional: 8.11 },
    { anio: 2019, area: 1.4, nacional: 5.79 },
    { anio: 2020, area: 0.88, nacional: 2.95 },
    { anio: 2021, area: 6.59, nacional: 6.76 },
    { anio: 2022, area: 1.43, nacional: 8.78 },
    { anio: 2023, area: 23.87, nacional: 12.4 },
    { anio: 2024, area: 3.72, nacional: 9.07 },
    { anio: 2025, area: 8.73, nacional: 9.17 },
  ],
  /** El último boletín. El del III trimestre de 2026 se espera hacia fines de noviembre. */
  ultimo: {
    periodo: "II trimestre de 2026",
    anual: 6.28,
    nacional: 8.8,
    publicado: "24 de agosto de 2026",
  },
  fuente:
    "DANE, Índice de Precios de la Vivienda Nueva (IPVN), boletines técnicos del IV trimestre de 2018 a 2025 y del II trimestre de 2026 (publicado el 24 de agosto de 2026).",
  aclaracion:
    "El DANE publica a Cartagena como «Cartagena AU (Cartagena y Turbaco)». El IPVN mide la variación promedio de los precios de oferta de la vivienda nueva en construcción; no es el valor de ningún proyecto ni de ningún inmueble en particular, no descuenta la inflación, y su comportamiento pasado no anticipa ni garantiza resultados futuros.",
  enlace: "https://www.dane.gov.co/index.php/estadisticas-por-tema/precios-y-costos/indice-de-precios-de-la-vivienda-nueva-ipvn",
};

/** La letra pequeña del mapa. */
export const NOTA_MAPA_MERCADO =
  "Mapa ilustrado: la costa, la bahía, la ciénaga y la Vía al Mar son un dibujo guiado por OpenStreetMap (© colaboradores de OpenStreetMap). Las zonas son una agrupación nuestra para leer el mapa, no límites oficiales. La costa del Atlántico va en esquema, sin escala. Cada punto va en su coordenada verificada, y su tarjeta dice la fuente. Obras y lugares verificados el 14 de octubre de 2026.";

/** La aclaración de las obras, en letra pequeña. */
export const NOTA_OBRAS =
  "Las obras son uno de los factores que pueden influir en el valor de los inmuebles cercanos; el efecto varía de un caso a otro y no está garantizado. El estado de cada obra es el de su fuente, en la fecha indicada.";
