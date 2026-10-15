/**
 * EL MAPA DE OBRAS Y ENTORNO EN INGLÉS
 *
 * Encima de `src/data/mercado.ts`: ids, zonas, estados, coordenadas y cifras
 * salen del español. Se traduce el texto visible, y las fechas escritas
 * («abril de 2026») se pasan a inglés desde la misma fecha. El `estado` de
 * cada obra no se traduce: es clave de lógica (el componente lo muestra en
 * inglés). Los nombres propios —lugares, medios, entidades— quedan como son.
 *
 * Cada traducción se busca por el texto exacto en español: si el español
 * cambia, sale el español nuevo hasta que se traduzca aquí.
 */
import * as es from "@/data/mercado";
import type { ObraMapa, ZonaMapa } from "@/data/mercado";
import { fechaEn, traductor, type Diccionario } from "@/data/en/traducir";

const TEXTOS: Diccionario = {
  // ── Zonas ────────────────────────────────────────────────────────────────
  "Zona Norte · Vía al Mar": "Zona Norte · Vía al Mar",
  "Del aeropuerto a Punta Canoa, entre el mar y la Ciénaga de la Virgen, y tierra adentro hasta Pontezuela.":
    "Cartagena's northern corridor: from the airport to Punta Canoa, between the sea and the Ciénaga de la Virgen lagoon, and inland to Pontezuela.",
  "Cartagena · la ciudad": "Cartagena · the city",
  "La ciudad": "The city",
  "El Centro Histórico, Bocagrande, Manga y Crespo, alrededor de la bahía y de la ciénaga.":
    "The historic center, Bocagrande, Manga and Crespo, around the bay and the lagoon.",
  "Corredor Cartagena–Turbaco": "Cartagena–Turbaco corridor",
  "Corredor a Turbaco": "Turbaco corridor",
  "Ternera y la salida hacia Turbaco, al sureste de la ciudad.": "Ternera and the road out to Turbaco, southeast of the city.",
  "Costa del Atlántico": "Atlántico coast",
  "Juan de Acosta, sobre el mar, entre Cartagena y Barranquilla.":
    "Juan de Acosta, on the sea, between Cartagena and Barranquilla.",

  // ── Obras: Zona Norte ────────────────────────────────────────────────────
  "Alcantarillado de Bayunca y Pontezuela": "Bayunca and Pontezuela sewer system",
  "Más de 55 km de redes y dos estaciones de bombeo hacia la planta de tratamiento de Punta Canoa, para más de 26.000 habitantes.":
    "More than 55 km of sewer lines and two pumping stations leading to the Punta Canoa treatment plant, for more than 26,000 residents.",
  "El Universal, 5-ene-2026 y 10-abr-2026: obra iniciada el 20 de octubre de 2025":
    "El Universal, January 5 and April 10, 2026: construction began on October 20, 2025",
  "El alcalde presentó la propuesta de un segundo viaducto de 4,7 km, paralelo al del Gran Manglar.":
    "The mayor presented a proposal for a second, 4.7 km viaduct, parallel to the Gran Manglar viaduct.",
  "El Universal y Valora Analitik, 27-nov-2025": "El Universal and Valora Analitik, November 27, 2025",

  // ── Obras: la ciudad ─────────────────────────────────────────────────────
  "Ampliación del Aeropuerto Rafael Núñez": "Rafael Núñez Airport expansion",
  "En obra desde marzo de 2025: la terminal pasa de 25.154 m² a 44.748 m², con una nueva terminal internacional.":
    "Under construction since March 2025: the terminal grows from 25,154 m² to 44,748 m², with a new international terminal.",
  "La República, 20-mar-2026 · El Universal, 10-jul-2026, con datos de la ANI":
    "La República, March 20, 2026 · El Universal, July 10, 2026, with data from the ANI",
  "Parque Lineal de Crespo y protección costera": "Crespo linear park and coastal protection",
  "La ANI entregó al Distrito el paseo marítimo de Crespo y la protección costera con siete espolones, un paso hacia el Gran Malecón del Mar.":
    "Colombia's National Infrastructure Agency (ANI) handed the city the Crespo seafront promenade and its coastal protection with seven groins, a step toward the Gran Malecón del Mar.",
  "Agencia Nacional de Infraestructura (ANI), 1-ago-2026 · El Heraldo, 2-ago-2026":
    "National Infrastructure Agency (ANI), August 1, 2026 · El Heraldo, August 2, 2026",
  "Vía Perimetral hasta el barrio 7 de Agosto": "Vía Perimetral extension to the 7 de Agosto neighborhood",
  "Una prolongación de 894 m en paralelo a la pista del aeropuerto; su primer tramo abrió al tránsito en septiembre de 2026.":
    "An 894 m extension running parallel to the airport runway; its first stretch opened to traffic in September 2026.",
  "El Universal, 17-sep-2026 · El Tiempo, 18-sep-2026": "El Universal, September 17, 2026 · El Tiempo, September 18, 2026",
  "Vía Perimetral hasta El Pozón": "Vía Perimetral extension to El Pozón",
  "El Gobierno nacional anunció $130.000 millones para los 4,8 km que faltan, a orillas de la Ciénaga de la Virgen.":
    "The national government announced COP 130,000 million for the remaining 4.8 km, along the shore of the Ciénaga de la Virgen lagoon.",
  "El Universal y El Tiempo, 18-sep-2026 · Forbes, 19-sep-2026":
    "El Universal and El Tiempo, September 18, 2026 · Forbes, September 19, 2026",
  "Gran Malecón del Mar, segunda fase": "Gran Malecón del Mar, second phase",
  "El Gobierno nacional anunció $87.703 millones para extenderlo de La Tenaza al Baluarte de Santo Domingo, a la entrada de Bocagrande.":
    "The national government announced COP 87,703 million to extend it from La Tenaza to the Baluarte de Santo Domingo, at the entrance to Bocagrande.",
  "El Tiempo, 18-sep-2026 · Valora Analitik y Forbes, 19-sep-2026":
    "El Tiempo, September 18, 2026 · Valora Analitik and Forbes, September 19, 2026",
  "Nuevo Plan de Ordenamiento Territorial": "New land-use plan (POT)",
  "El Distrito tramita la revisión del POT, que define hacia dónde y cómo crece la ciudad; el vigente es de 2001.":
    "The city is processing a revision of its land-use plan (POT), which sets where and how the city grows; the current plan dates from 2001.",
  "El Tiempo, 13-ago-2026 · El Universal, 22-jul-2026 y 8-oct-2026":
    "El Tiempo, August 13, 2026 · El Universal, July 22 and October 8, 2026",

  // ── Corredor Cartagena–Turbaco ───────────────────────────────────────────
  "Zona Franca Permanente Cristalina": "Cristalina Permanent Free Trade Zone",
  "Zona franca de 65 hectáreas en la zona rural de Turbaco, declarada por el Ministerio de Comercio en 2020.":
    "A 65-hectare free trade zone in rural Turbaco, declared by the Ministry of Commerce in 2020.",
  "MinCIT, listado de zonas francas declaradas (corte 8-nov-2023) · El Universal, 4-sep-2024":
    "MinCIT, list of declared free trade zones (as of November 8, 2023) · El Universal, September 4, 2024",

  // ── Costa del Atlántico ──────────────────────────────────────────────────
  "Acueducto Regional del Norte": "Northern Regional Aqueduct",
  "Toma agua del río Magdalena para ocho municipios del norte del Atlántico, entre ellos Juan de Acosta, Tubará y Puerto Colombia.":
    "It draws water from the Magdalena River for eight municipalities in northern Atlántico, including Juan de Acosta, Tubará and Puerto Colombia.",
  "Gobernación del Atlántico y El Tiempo, 11-may-2026 · Diario La Libertad, 24-sep-2026":
    "Atlántico Governor's Office and El Tiempo, May 11, 2026 · Diario La Libertad, September 24, 2026",
  "Alcantarillado de Juan de Acosta": "Juan de Acosta sewer system",
  "Una estación de bombeo y una planta de tratamiento de aguas residuales, para 16.000 habitantes al inicio.":
    "A pumping station and a wastewater treatment plant, serving 16,000 residents at first.",
  "Gobernación del Atlántico y El Heraldo, 30-jun-2026": "Atlántico Governor's Office and El Heraldo, June 30, 2026",
  "Recuperación de la playa de Santa Verónica": "Santa Verónica beach restoration",
  "Espolones y relleno hidráulico en 2,1 km de costa, para recuperar cerca de 80.000 m² de playa.":
    "Groins and hydraulic fill along 2.1 km of coastline, to restore about 80,000 m² of beach.",
  "El Tiempo, 8-ene-2026 · El Espectador, 8-mar-2026 · ANLA, 25-ago-2025":
    "El Tiempo, January 8, 2026 · El Espectador, March 8, 2026 · ANLA, August 25, 2025",

  // ── Precios: DANE, IPVN ──────────────────────────────────────────────────
  "Cartagena y Turbaco": "Cartagena and Turbaco",
  "II trimestre de 2026": "Q2 2026",
  "DANE, Índice de Precios de la Vivienda Nueva (IPVN), boletines técnicos del IV trimestre de 2018 a 2025 y del II trimestre de 2026 (publicado el 24 de agosto de 2026).":
    "DANE (Colombia's national statistics office), New Housing Price Index (IPVN), technical bulletins for Q4 2018 through Q4 2025 and for Q2 2026 (published August 24, 2026).",
  "El DANE publica a Cartagena como «Cartagena AU (Cartagena y Turbaco)». El IPVN mide la variación promedio de los precios de oferta de la vivienda nueva en construcción; no es el valor de ningún proyecto ni de ningún inmueble en particular, no descuenta la inflación, y su comportamiento pasado no anticipa ni garantiza resultados futuros.":
    "DANE reports Cartagena as “Cartagena AU (Cartagena and Turbaco)”. The IPVN measures the average change in the asking prices of new homes under construction; it is not the value of any particular project or property, it does not adjust for inflation, and its past performance neither predicts nor guarantees future results.",

  // ── Notas ────────────────────────────────────────────────────────────────
  "Mapa ilustrado: la costa, la bahía, la ciénaga y la Vía al Mar son un dibujo guiado por OpenStreetMap (© colaboradores de OpenStreetMap). Las zonas son una agrupación nuestra para leer el mapa, no límites oficiales. La costa del Atlántico va en esquema, sin escala. Cada punto va en su coordenada verificada, y su tarjeta dice la fuente. Obras y lugares verificados el 14 de octubre de 2026.":
    "Illustrated map: the coastline, the bay, the lagoon and the Vía al Mar are a drawing based on OpenStreetMap (© OpenStreetMap contributors). The areas are our own grouping to read the map, not official boundaries. The Atlántico coast is shown as a diagram, not to scale. Each point sits at its verified coordinates, and its card shows the source. Public works and places verified on October 14, 2026.",
  "Las obras son uno de los factores que pueden influir en el valor de los inmuebles cercanos; el efecto varía de un caso a otro y no está garantizado. El estado de cada obra es el de su fuente, en la fecha indicada.":
    "Public works are one of the factors that can influence the value of nearby properties; the effect varies from case to case and is not guaranteed. Each project's status is the one its source reports, as of the date shown.",
};

const t = traductor(TEXTOS);

function zonaEn(z: ZonaMapa): ZonaMapa {
  return { ...z, nombre: t(z.nombre), rotulo: t(z.rotulo), frase: t(z.frase) };
}

function obraEn(o: ObraMapa): ObraMapa {
  return {
    ...o,
    nombre: t(o.nombre),
    frase: t(o.frase),
    fuente: t(o.fuente),
    fecha: fechaEn(o.fecha),
    // La fuente de la coordenada es la de zona.ts (el aeropuerto): se dice en inglés.
    coordenada:
      o.coordenada === null
        ? null
        : { ...o.coordenada, fuente: o.coordenada.fuente.replace(/^OpenStreetMap, vía /, "OpenStreetMap, way ").replace(/^OpenStreetMap, nodo /, "OpenStreetMap, node ") },
  };
}

export const modulo: typeof import("@/data/mercado") = {
  ...es,
  ZONAS: es.ZONAS.map(zonaEn),
  OBRAS: es.OBRAS.map(obraEn),
  // Los nombres de lugar no se traducen; la fuente sí (no se muestra, pero queda dicha).
  ROTULOS_MAPA: es.ROTULOS_MAPA.map((r) => ({
    ...r,
    coordenada: {
      ...r.coordenada,
      fuente: r.coordenada.fuente.replace("OpenStreetMap, nodo ", "OpenStreetMap, node ").replace("consultado el 15-oct-2026", "retrieved on October 15, 2026"),
    },
  })),
  IPVN: {
    ...es.IPVN,
    area: t(es.IPVN.area),
    ultimo: { ...es.IPVN.ultimo, periodo: t(es.IPVN.ultimo.periodo), publicado: fechaEn(es.IPVN.ultimo.publicado) },
    fuente: t(es.IPVN.fuente),
    aclaracion: t(es.IPVN.aclaracion),
  },
  // Las notas se declaran sin tipo: TypeScript les da el texto literal en
  // español como tipo. El `as` solo le dice que aquí va otro texto.
  NOTA_MAPA_MERCADO: t(es.NOTA_MAPA_MERCADO) as typeof es.NOTA_MAPA_MERCADO,
  NOTA_OBRAS: t(es.NOTA_OBRAS) as typeof es.NOTA_OBRAS,
};
