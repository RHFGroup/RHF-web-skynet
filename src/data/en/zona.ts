/**
 * LA ZONA NORTE EN INGLÉS — LUGARES, OBRAS Y CIFRAS
 *
 * Encima de `src/data/zona.ts`: coordenadas, ids, íconos, capas, categorías y
 * cifras salen del español. Se traduce el texto visible, y las fechas escritas
 * («24 de septiembre de 2026») se pasan a inglés desde la misma fecha.
 *
 * Lo que NO se traduce porque es clave de lógica:
 *  · `estado` de las obras («Entregado», «En obra», «En estudio»): arma la
 *    clase CSS y agrupa. Se muestra con `etiquetaEstadoObra` (src/i18n/datos.ts).
 *  · `categorias`, `capa`, `icono` y el `tipo` de los rótulos.
 * Los nombres de los filtros van en `CATEGORIAS`, en inglés.
 *
 * Los nombres propios quedan como son: barrios, playas, colegios,
 * universidades y marcas. De los lugares se traduce solo la parte genérica
 * («Centro Comercial Las Ramblas» → «Las Ramblas Shopping Center»).
 *
 * Cada traducción se busca por el texto exacto en español; si el español
 * cambia, sale el español nuevo hasta que se traduzca aquí.
 */
import * as es from "@/data/zona";
import type { Coordenada, Lugar } from "@/data/zona";
import { fechaEn, traductor, type Diccionario } from "@/data/en/traducir";

const TEXTOS: Diccionario = {
  // ── Filtros del mapa ─────────────────────────────────────────────────────
  "Playas y turismo": "Beaches and tourism",
  "Salud": "Health",
  "Educación": "Education",
  "Comercio y ocio": "Shopping and leisure",
  "Conectividad": "Transportation",

  // ── Lo que se repite ─────────────────────────────────────────────────────
  "Seguimiento de obra": "Construction progress tracking",
  // Las notas entre paréntesis de las coordenadas de OpenStreetMap.
  "sector de Serena del Mar": "Serena del Mar area",
  "corregimiento de Tierra Baja": "Tierra Baja township",
  "barrio Centro": "Centro neighborhood",

  // ── Lugares: hoy ─────────────────────────────────────────────────────────
  "Playa, y recorridos en canoa por los túneles de manglar de la Ciénaga de la Virgen.":
    "Beach, and canoe tours through the mangrove tunnels of the Ciénaga de la Virgen.",
  "Recorridos ofrecidos en 2026 por varios operadores locales (GetYourGuide, Viator)":
    "Tours offered in 2026 by several local operators (GetYourGuide, Viator)",
  "Centro de Convenciones Las Américas": "Las Américas Convention Center",
  "Congresos, ferias y eventos junto a la playa, en el Hotel Las Américas.":
    "Conferences, trade fairs and events next to the beach, at the Hotel Las Américas.",
  "hotellasamericas.com.co, sección del centro de convenciones": "hotellasamericas.com.co, convention center section",
  "Playa y hoteles de playa sobre el corredor.": "Beach and beach hotels along the corridor.",
  "Reseñas de visitantes de 2026 (Tripadvisor) y hoteles en operación":
    "2026 visitor reviews (Tripadvisor) and hotels in operation",
  "Playa en el extremo norte del corredor.": "Beach at the northern end of the corridor.",
  "Playa de Punta Canoa, con reseñas de visitantes de 2026 (Tripadvisor)":
    "Punta Canoa beach, with 2026 visitor reviews (Tripadvisor)",
  "Aquí funciona el Hospital Serena del Mar, operado por la Fundación Santa Fe de Bogotá: más de 60 especialidades y urgencias las 24 horas. Es el único hospital de Cartagena en el ranking World's Best Hospitals 2026 de Newsweek.":
    "Home to the Hospital Serena del Mar, operated by the Fundación Santa Fe de Bogotá: more than 60 specialties and a 24-hour emergency room. It is the only Cartagena hospital in Newsweek's World's Best Hospitals 2026 ranking.",
  "hospitalserenadelmar.com (especialidades, urgencias y operador) · Newsweek y Statista, World's Best Hospitals 2026 – Colombia: puesto 18 de 50, único de Cartagena":
    "hospitalserenadelmar.com (specialties, emergency room and operator) · Newsweek and Statista, World's Best Hospitals 2026 – Colombia: ranked 18th of 50, the only one in Cartagena",
  "Universidad de los Andes · Sede Caribe": "Universidad de los Andes · Caribbean Campus",
  "La sede Caribe de la Universidad de los Andes abrió en mayo de 2018 en Serena del Mar.":
    "The Caribbean campus of the Universidad de los Andes opened in May 2018 in Serena del Mar.",
  "uniandes.edu.co, «Así fue la inauguración de la Sede Caribe»":
    "uniandes.edu.co, “Así fue la inauguración de la Sede Caribe”",
  "Universidad Jorge Tadeo Lozano · Campus Internacional del Caribe":
    "Universidad Jorge Tadeo Lozano · Caribbean International Campus",
  "Campus de pregrado sobre la Vía al Mar, en el kilómetro 13.": "Undergraduate campus on the Vía al Mar, at kilometer 13.",
  "utadeo.edu.co, ubicación de la Tadeo Caribe": "utadeo.edu.co, location of Tadeo Caribe",
  "Colegio de preescolar a grado 12, en el kilómetro 12 del Anillo Vial.":
    "School from preschool through grade 12, at kilometer 12 of the Anillo Vial.",
  "Colegio Jorge Washington: dirección y grados (Wikipedia)": "Colegio Jorge Washington: address and grades (Wikipedia)",
  "Colegio bilingüe con Bachillerato Internacional, en el kilómetro 12 del Anillo Vial.":
    "Bilingual school offering the International Baccalaureate, at kilometer 12 of the Anillo Vial.",
  "cognita.com, ficha del Colegio Británico de Cartagena (Redcol)":
    "cognita.com, Colegio Británico de Cartagena profile (Redcol)",
  "Colegio en el kilómetro 14 del Anillo Vial.": "School at kilometer 14 of the Anillo Vial.",
  "gimnasioaltair.edupage.org, contacto": "gimnasioaltair.edupage.org, contact page",
  "Centro Comercial Las Ramblas": "Las Ramblas Shopping Center",
  "Supermercado Carulla, restaurantes y estación de servicio.": "Carulla supermarket, restaurants and a gas station.",
  "OpenStreetMap: Carulla, restaurantes y estación Primax en Las Ramblas":
    "OpenStreetMap: Carulla, restaurants and the Primax station at Las Ramblas",
  "Estación Terpel con tienda Altoque": "Terpel gas station with Altoque store",
  "Estación de servicio con tienda de conveniencia Altoque.": "Gas station with an Altoque convenience store.",
  "OpenStreetMap: estación Terpel (vía 1353435219) y tienda Altoque (nodo 12523307430)":
    "OpenStreetMap: Terpel station (way 1353435219) and Altoque store (node 12523307430)",
  "Campo de golf de 18 hoyos diseñado por Nicklaus Design, abierto en 2012.":
    "18-hole golf course designed by Nicklaus Design, opened in 2012.",
  "Aeropuerto Rafael Núñez": "Rafael Núñez Airport",
  "Vuelos nacionales e internacionales, en el límite sur del corredor.":
    "Domestic and international flights, at the southern edge of the corridor.",
  "Terminal de Transportes del Norte": "Northern Bus Terminal",
  "Terminal del Norte": "Northern Terminal",
  "Abrió en noviembre de 2022 con buses hacia Barranquilla y Santa Marta.":
    "Opened in November 2022, with buses to Barranquilla and Santa Marta.",
  "Semana, 22-nov-2022: apertura y primeras rutas": "Semana, November 22, 2022: opening and first routes",
  "Ruta C017 de Transcaribe": "Transcaribe route C017",
  "Bodeguita – Zona Norte, desde febrero de 2024: pasa por la Terminal del Norte y Serena del Mar, de lunes a viernes en la mañana y en la tarde.":
    "Bodeguita – Zona Norte, since February 2024: it stops at the Northern Bus Terminal and Serena del Mar, Monday to Friday, mornings and afternoons.",
  "transcaribe.gov.co, inauguración de la ruta C017 · El Espectador, 13-feb-2024":
    "transcaribe.gov.co, launch of route C017 · El Espectador, February 13, 2024",

  // ── Lugares: obras ───────────────────────────────────────────────────────
  "5,1 km de malecón frente al mar, entre Playa Azul, en La Boquilla, y La Tenaza, junto al Centro Histórico.":
    "5.1 km of oceanfront boardwalk, between Playa Azul, in La Boquilla, and La Tenaza, next to the historic center.",
  "Alcaldía de Cartagena (cartagena.gov.co) · El Universal, 9-jul-2026: obra iniciada en agosto de 2025":
    "Cartagena Mayor's Office (cartagena.gov.co) · El Universal, July 9, 2026: construction began in August 2025",
  "En obra desde agosto de 2025": "Under construction since August 2025",
  "Doble calzada de Tierra Baja": "Tierra Baja divided highway",
  "La vía local del corredor, con 95 % de avance.": "The corridor's local road, 95% complete.",
  "Su constructora lo presenta como el primer shopping resort de Latinoamérica: comercio, hotel y una laguna cristalina abierta al público. Obras iniciadas en marzo de 2026.":
    "Its builder presents it as Latin America's first shopping resort: retail, a hotel and a crystal-clear lagoon open to the public. Construction began in March 2026.",
  "Arquitectura y Concreto (arquitecturayconcreto.com/kristal-mall) · Inmobiliare, 12-mar-2026 · La República, 25-may-2024":
    "Arquitectura y Concreto (arquitecturayconcreto.com/kristal-mall) · Inmobiliare, March 12, 2026 · La República, May 25, 2024",
  "Nuevo aeropuerto": "New airport",
  "La ANI evalúa la iniciativa privada de un nuevo aeropuerto cerca de Bayunca, al norte de la ciudad.":
    "Colombia's National Infrastructure Agency (ANI) is evaluating a private initiative for a new airport near Bayunca, north of the city.",
  "El Universal, 14-may-2026 · Agencia Nacional de Infraestructura (ANI)":
    "El Universal, May 14, 2026 · Agencia Nacional de Infraestructura (ANI)",

  // ── El bloque de Cartagena ───────────────────────────────────────────────
  "De la ciudad amurallada a la costa norte": "From the walled city to the northern coast",
  "Una ciudad para vivir frente al Caribe": "A city to live in by the Caribbean",
  "Cartagena reúne historia, mar Caribe y conexión con el mundo. Su Centro Histórico es Patrimonio de la Humanidad, la playa hace parte del día a día y el aeropuerto internacional queda a la entrada de la Zona Norte. Con el Centro, Bocagrande y Manga consolidados, la ciudad crece hacia el norte por la Vía al Mar, y ahí se concentra hoy la vivienda nueva.":
    "Cartagena brings together history, the Caribbean Sea and connections to the world. Its historic center is a UNESCO World Heritage Site, the beach is part of everyday life, and the international airport sits at the entrance to the Zona Norte, Cartagena's northern corridor. With the Centro, Bocagrande and Manga already established, the city is growing north along the Vía al Mar, and that is where new housing is concentrated today.",

  // ── La cifra de la oferta ────────────────────────────────────────────────
  "Aquí está la oferta": "This is where the supply is",
  "de la vivienda nueva que se comercializa en Bolívar está en la Zona Norte":
    "of the new housing on the market in Bolívar is in the Zona Norte",
  "Donde se concentra la oferta se concentra también la competencia entre constructores, y eso se nota en las condiciones de compra.":
    "Where supply is concentrated, so is competition among builders, and that shows in the purchase terms.",
  "resto de Bolívar": "rest of Bolívar",

  // ── Los hechos ───────────────────────────────────────────────────────────
  "La vía ya está hecha": "The road is already built",
  "El Viaducto del Gran Manglar opera desde 2018 y el corredor completo hacia Barranquilla desde 2021: $778.576 millones que conectan a cerca de 3 millones de personas.":
    "The Viaducto del Gran Manglar has operated since 2018, and the full corridor to Barranquilla since 2021: COP 778,576 million that connect nearly 3 million people.",
  // El sufijo va pegado a la cifra del contador: «8 years», «95%».
  " años": " years",
  " %": "%",
  "lleva el viaducto sobre la ciénaga en operación, desde 2018":
    "of operation for the viaduct over the lagoon, open since 2018",
  "Obra entregada": "Completed project",
  "El entorno ya funciona": "The area is already up and running",
  "El hospital Santa Fe y el campus de Uniandes funcionan aquí desde 2018, a 12 km del Centro.":
    "The Santa Fe hospital and the Uniandes campus have operated here since 2018, 12 km from the city center.",
  "Research de la Zona Norte, contrastada contra fuentes primarias":
    "Zona Norte research, checked against primary sources",
  "La vía local, casi lista": "The local road, almost ready",
  "La doble calzada de Tierra Baja entra en su tramo final de obra.":
    "The Tierra Baja divided highway is entering its final stretch of construction.",
  "de avance en la doble calzada de Tierra Baja": "complete on the Tierra Baja divided highway",
  "El comercio que viene": "The retail on the way",
  "Kristal Malls está en obra desde marzo de 2026, con apertura prevista para 2027.":
    "Kristal Malls has been under construction since March 2026, with its opening planned for 2027.",
  "Prensa local": "Local press",

  // ── Las notas de la sección ──────────────────────────────────────────────
  "Cifras contrastadas contra fuentes primarias. Concentración de oferta: Camacol Bolívar. Actualizado a agosto de 2026.":
    "Figures checked against primary sources. Supply concentration: Camacol Bolívar. Updated as of August 2026.",
  "Patrimonio de la Humanidad: UNESCO, Lista del Patrimonio Mundial. Lugares del mapa: OpenStreetMap, verificados el 24 y el 25 de septiembre de 2026. Gran Malecón del Mar: Alcaldía de Cartagena y El Universal, julio de 2026.":
    "World Heritage Site: UNESCO World Heritage List. Map locations: OpenStreetMap, verified on September 24 and 25, 2026. Gran Malecón del Mar: Cartagena Mayor's Office and El Universal, July 2026.",
};

const t = traductor(TEXTOS);

/**
 * «OpenStreetMap, nodo 703211074 (sector de …)» → «OpenStreetMap, node
 * 703211074 (… area)». El identificador sale del español, nunca se copia a mano.
 */
function fuenteOsm(fuente: string): string {
  const m = fuente.match(/^OpenStreetMap, (nodo|vía) (\d+)(?: \((.+)\))?$/);
  if (!m) return t(fuente);
  const tipo = m[1] === "nodo" ? "node" : "way";
  const nota = m[3] === undefined ? "" : ` (${t(m[3])})`;
  return `OpenStreetMap, ${tipo} ${m[2]}${nota}`;
}

function coordenada(c: Coordenada): Coordenada {
  return { ...c, fuente: fuenteOsm(c.fuente) };
}

function lugar(l: Lugar): Lugar {
  const x: Lugar = {
    ...l,
    nombre: t(l.nombre),
    frase: t(l.frase),
    coordenada: l.coordenada === null ? null : coordenada(l.coordenada),
    fuente: t(l.fuente),
    fecha: fechaEn(l.fecha),
  };
  if (l.nombreCorto !== undefined) x.nombreCorto = t(l.nombreCorto);
  if (l.etiquetaTrazado !== undefined) x.etiquetaTrazado = t(l.etiquetaTrazado);
  if (l.imagen) {
    x.imagen = { ...l.imagen, alt: t(l.imagen.alt), credito: t(l.imagen.credito), fecha: fechaEn(l.imagen.fecha) };
  }
  return x;
}

export const modulo: typeof import("@/data/zona") = {
  ...es,
  CATEGORIAS: es.CATEGORIAS.map((c) => ({ ...c, nombre: t(c.nombre) })),
  LUGARES: es.LUGARES.map(lugar),
  // Los rótulos son nombres de barrios y pueblos: no se traducen. Solo la fuente.
  ROTULOS: es.ROTULOS.map((r) => ({ ...r, coordenada: coordenada(r.coordenada) })),
  CARTAGENA: {
    ...es.CARTAGENA,
    titulo: t(es.CARTAGENA.titulo),
    tituloAlterno: t(es.CARTAGENA.tituloAlterno),
    texto: t(es.CARTAGENA.texto),
  },
  CIFRA_OFERTA: {
    ...es.CIFRA_OFERTA,
    titulo: t(es.CIFRA_OFERTA.titulo),
    rotulo: t(es.CIFRA_OFERTA.rotulo),
    texto: t(es.CIFRA_OFERTA.texto),
    resto: t(es.CIFRA_OFERTA.resto),
    fuente: t(es.CIFRA_OFERTA.fuente),
  },
  HECHOS: es.HECHOS.map((h) => ({
    ...h,
    titulo: t(h.titulo),
    texto: t(h.texto),
    cifra: h.cifra === null ? null : { ...h.cifra, sufijo: t(h.cifra.sufijo), rotulo: t(h.cifra.rotulo) },
    fuente: t(h.fuente),
    fecha: fechaEn(h.fecha),
  })),
  // zona.ts declara las dos notas sin tipo, así que TypeScript les da como tipo
  // el texto literal en español. El `as` solo le dice que aquí va otro texto.
  NOTA_FUENTES: t(es.NOTA_FUENTES) as typeof es.NOTA_FUENTES,
  NOTA_MAPA: t(es.NOTA_MAPA) as typeof es.NOTA_MAPA,
  TIEMPOS_ZONA: es.TIEMPOS_ZONA.map((x) => ({
    ...x,
    destino: t(x.destino),
    desde: t(x.desde),
    fuente: t(x.fuente),
    fecha: fechaEn(x.fecha),
  })),
};
