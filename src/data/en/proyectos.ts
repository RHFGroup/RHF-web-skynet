/**
 * LA CARTERA EN INGLÉS
 *
 * Se arma encima de `src/data/proyectos.ts`: copia cada proyecto y reemplaza
 * solo el texto visible. Precios, unidades, cortes, áreas, fotos, slugs y las
 * claves de lógica (`estado`, `zona`, `tipoInmueble`) salen del español tal
 * cual. Para mostrar `estado` y `tipoInmueble`: `etiquetaEstado` y
 * `etiquetaTipo` en src/i18n/datos.ts.
 *
 * Cada traducción se busca por el texto exacto en español. Si el español
 * cambia (un corte nuevo, una disponibilidad), el inglés muestra el español
 * nuevo hasta que alguien lo traduzca aquí: nunca una traducción vieja con
 * cifras que ya no valen (ver src/data/en/traducir.ts).
 *
 * Las mismas reglas del español: la fuente y la fecha de cada dato se citan
 * igual; el área lleva la etiqueta traducida con la literal de la fuente entre
 * paréntesis; nada de valorización ni rentabilidad prometidas (Ley 1480).
 */
import * as es from "@/data/proyectos";
import type { Foto, Plano, Precontractual, Proyecto, Tipologia } from "@/data/proyectos";
import {
  ETIQUETAS_AREA,
  MESES_EN,
  fechaEn,
  pesos,
  traductor,
  type Diccionario,
  type Regla,
} from "@/data/en/traducir";

// Los textos que proyectos.ts repite en varias fuentes. Tienen que ser iguales
// a los de allá, letra por letra: si allá cambian, esas fuentes salen en
// español hasta que se actualicen aquí.
const ES_LISTA_INVERCOLOMBIA =
  "LISTADO DE PRECIO Y DISPONIBILIDAD (Invercolombia), archivo del 12 de agosto de 2026";
const EN_LISTA_INVERCOLOMBIA =
  "Invercolombia's price and availability list (“LISTADO DE PRECIO Y DISPONIBILIDAD”), file dated August 12, 2026";
const ES_LISTA_DORAL =
  "«Disponibilidad y precios Doral Cartagena.xlsx», archivo original del constructor, modificado el 25 de junio de 2026";
const EN_LISTA_DORAL =
  "“Disponibilidad y precios Doral Cartagena.xlsx”, the builder's original file, modified June 25, 2026";
const ES_HOJA_COUNTRY =
  "Hoja «Disponibilidad y precios Doral Cartagena — Doral Country» del constructor, exportada el 23 de septiembre de 2026, con su tabla de precios por piso «TORRE 1-5»";
const EN_HOJA_COUNTRY =
  "The builder's sheet “Disponibilidad y precios Doral Cartagena — Doral Country”, exported September 23, 2026, with its price table by floor, “TORRE 1-5”";

const TEXTOS: Diccionario = {
  "Según su constructor: doralcartagena.com/doral-suites": "According to its builder: doralcartagena.com/doral-suites",
  ...ETIQUETAS_AREA,

  // ── Fuentes y créditos que se repiten ───────────────────────────────────
  "Material del promotor": "Developer's material",
  "Brochure oficial": "Official brochure",
  "Brochure oficial (cita literal)": "Official brochure (verbatim)",
  "Brochure oficial Doral Cartagena": "Official Doral Cartagena brochure",
  "Brochure oficial Doral Cartagena (cita literal)": "Official Doral Cartagena brochure (verbatim)",
  "Brochure oficial, págs. 24-28 (rótulo de fotos)": "Official brochure, pp. 24–28 (photo captions)",
  [ES_LISTA_DORAL]: EN_LISTA_DORAL,
  [`Brochure oficial Doral Cartagena · ${ES_LISTA_DORAL}`]: `Official Doral Cartagena brochure · ${EN_LISTA_DORAL}`,
  [`${ES_LISTA_DORAL}, hoja «Lista de precios West»`]: `${EN_LISTA_DORAL}, sheet “Lista de precios West”`,
  [`${ES_LISTA_DORAL}, hoja «Doral suite»`]: `${EN_LISTA_DORAL}, sheet “Doral suite”`,
  [`${ES_LISTA_DORAL} (encabezado literal de la columna)`]: `${EN_LISTA_DORAL} (verbatim column header)`,
  [`${ES_LISTA_DORAL} (rótulo literal de la hoja)`]: `${EN_LISTA_DORAL} (verbatim sheet label)`,
  [`${ES_LISTA_DORAL}, columna «fecha entrega»`]: `${EN_LISTA_DORAL}, column “fecha entrega” (handover date)`,
  [`${ES_LISTA_DORAL} — registra ambas cifras sobre el mismo lote y al mismo precio`]:
    `${EN_LISTA_DORAL} — records both figures for the same lot and at the same price`,
  [`${ES_LISTA_INVERCOLOMBIA}, hoja «Blue Garden Disponibilidades»`]:
    `${EN_LISTA_INVERCOLOMBIA}, sheet “Blue Garden Disponibilidades”`,
  [`${ES_LISTA_INVERCOLOMBIA}, hoja «Acacias Disponibilidades»`]:
    `${EN_LISTA_INVERCOLOMBIA}, sheet “Acacias Disponibilidades”`,
  [ES_HOJA_COUNTRY]: EN_HOJA_COUNTRY,
  [`doralcartagena.com/country · ${ES_HOJA_COUNTRY}`]: `doralcartagena.com/country · ${EN_HOJA_COUNTRY}`,
  [`${ES_HOJA_COUNTRY} (encabezados de la grilla)`]: `${EN_HOJA_COUNTRY} (grid headers)`,
  "Brochure oficial Doral Cartagena y doralcartagena.com/country, verificados el 7-sep-2026":
    "Official Doral Cartagena brochure and doralcartagena.com/country, verified September 7, 2026",

  // ── Rótulos y valores de los datos clave ─────────────────────────────────
  "Área del lote": "Lot area",
  "Alcobas": "Bedrooms",
  "Baños": "Bathrooms",
  "Parqueaderos": "Parking spaces",
  "Parqueadero": "Parking",
  "Ampliación": "Expansion",
  "Segundo piso y terraza": "Second floor and terrace",
  "Torres": "Towers",
  "Apartamentos": "Apartments",
  "Etapas": "Phases",
  "VIS": "Social-interest housing (VIS)",
  "No es VIS": "Not social-interest housing (“No es VIS”)",
  "Casas disponibles": "Houses available",
  "Lotes": "Lots",
  "128, 150, 160 y 288 m²": "128, 150, 160 and 288 m²",
  "Privado": "Private",
  "Entregas": "Handovers",
  "Noviembre 2026 a noviembre 2028": "November 2026 to November 2028",
  "Pisos por torre": "Floors per tower",
  "5 + altillo": "5 + attic level",
  "Unidades por piso": "Units per floor",
  "10 (12 en la Torre 5)": "10 (12 in Tower 5)",
  "Torres en venta": "Towers for sale",
  "1 a 5": "1 to 5",
  "Comunal": "Shared",
  "Unidades totales": "Total units",
  "Disponibles": "Available",
  "Uso": "Use",
  "Aprobado para renta corta": "Approved for short-term rentals",
  "2 o 3": "2 or 3",

  // ── Amenidades ───────────────────────────────────────────────────────────
  "Club campestre con más de 20 amenidades": "Country club with more than 20 amenities",
  "Piscina y solárium": "Pool and sun deck",
  "Cancha múltiple": "Multi-sport court",
  "Coworking": "Coworking space",
  "Zona de meditación": "Meditation area",
  "Mini golf": "Mini golf",
  "Lago y senderos": "Lake and walking trails",
  "Parque infantil": "Children's playground",
  "Boulevard de acceso": "Entrance boulevard",
  "Salón social": "Community room",
  "Gimnasio": "Gym",
  "Jacuzzi": "Hot tub",
  "Zona BBQ": "BBQ area",
  "Zona pet": "Pet area",
  "Parqueaderos privados": "Private parking spaces",
  "Conjunto cerrado": "Gated community",
  "Parqueadero privado por casa": "Private parking space for each house",
  "Estructura preparada para ampliación": "Structure prepared for expansion",
  "Zonas verdes": "Green areas",
  "Cancha de pádel": "Padel court",
  "Cancha múltiple y de tenis": "Multi-sport and tennis courts",
  "Piscina de adultos y niños": "Adults' and children's pools",
  "Ascensor": "Elevator",
  "Parqueadero comunal": "Shared parking",
  "Piscina": "Pool",
  "Condominio cerrado": "Gated community",
  "Aprobado para rentas cortas": "Approved for short-term rentals",
  "Acabados premium": "Premium finishes",
  "Mall comercial en el mismo desarrollo": "Shopping mall in the same development",
  "Zona Norte, cerca del aeropuerto": "Zona Norte, near the airport",

  // ── Blue Garden ──────────────────────────────────────────────────────────
  "Invercolombia MB S.A.S. (comercializa) · Promotora BG":
    "Invercolombia MB S.A.S. (sales and marketing) · Promotora BG",
  "Condominio campestre sobre la vía a Turbaco, con casas de una planta ampliables a segundo piso dentro de un club campestre con más de veinte amenidades ya construidas. Es el proyecto de la cartera con el inventario mejor documentado.":
    "A country-style gated community on the road to Turbaco, with single-story houses that can be expanded to a second floor, inside a country club with more than twenty amenities already built. Of all the projects in our portfolio, it has the most thoroughly documented inventory.",
  "Casa de una planta": "Single-story house",
  "3 alcobas, 2 baños, sala, comedor, cocina y zona de labores, sobre lote de 250 m², con opción de ampliación a segundo piso y terraza.":
    "3 bedrooms, 2 bathrooms, living room, dining room, kitchen and laundry area, on a 250 m² lot, with the option to add a second floor and a terrace.",
  "Lote de 250 m²; terraza en la opción de ampliación a segundo piso":
    "250 m² lot; terrace included in the second-floor expansion option",
  "Plano de la casa de una planta de Blue Garden, con lote de 250 m² y área construida de 75 m²":
    "Floor plan of the Blue Garden single-story house, with a 250 m² lot and 75 m² of built area",
  "invercolombia.com.co/blue-garden (Vía Turbaco Km 1), consultada el 14-sep-2026 · municipio: ficha de la Feria de Vivienda de El Universal":
    "invercolombia.com.co/blue-garden (Vía Turbaco Km 1), accessed September 14, 2026 · municipality: El Universal's Feria de Vivienda (housing fair) listing",
  "2 parqueaderos por casa": "2 parking spaces per house",
  "Ver brochure oficial, págs. 13 a 24": "See the official brochure, pp. 13–24",
  "Casas ampliables · 3 habitaciones · jardín": "Expandable houses · 3 bedrooms · garden",
  "Casa familiar con lote generoso y posibilidad de ampliación.":
    "A family home with a generous lot and room to expand.",
  "Blue Garden — terraza de una casa del condominio": "Blue Garden — terrace of a house in the community",
  "Blue Garden — casas del condominio con su jardín y parqueadero":
    "Blue Garden — houses in the community with their gardens and parking",
  "Blue Garden — vista aérea del club campestre": "Blue Garden — aerial view of the country club",
  "Blue Garden — lago del club campestre": "Blue Garden — the country club's lake",
  "Blue Garden — piscina del club": "Blue Garden — the club's pool",
  "Blue Garden — parque infantil del club": "Blue Garden — the club's children's playground",
  "Blue Garden — sala de la casa modelo": "Blue Garden — living room of the model home",
  "Blue Garden — cocina y comedor de la casa modelo": "Blue Garden — kitchen and dining room of the model home",

  // ── Acacias Campestre ────────────────────────────────────────────────────
  "Invercolombia (vende) · MB Gerencia y Construcciones · Promotora AC":
    "Invercolombia (sales) · MB Gerencia y Construcciones · Promotora AC",
  "Veintidós torres y 904 apartamentos desarrollados en cinco etapas, con apartamentos de una, dos y tres alcobas. No es VIS: el promotor lo plantea como proyecto de inversión.":
    "Twenty-two towers and 904 apartments developed in five phases, with one-, two- and three-bedroom units. It is not social-interest housing (VIS): the developer presents it as an investment project.",
  "1 alcoba": "1 bedroom",
  "Sala-comedor, cocina, 1 habitación, 1 baño y zona de labores. Solo en el piso 5 de los bloques 1, 2 y 3.":
    "Living-dining room, kitchen, 1 bedroom, 1 bathroom and laundry area. Only on floor 5 of blocks 1, 2 and 3.",
  "Brochure oficial Acacias 2026, pág. 13 · presentación comercial de Invercolombia, septiembre de 2026, pág. 3":
    "Official Acacias 2026 brochure, p. 13 · Invercolombia sales presentation, September 2026, p. 3",
  "Apartamentos de 33m² a 35m²": "Apartments from 33 m² to 35 m² (Apartamentos de 33m² a 35m²)",
  "Plano del apartamento de 1 alcoba de Acacias Campestre": "Floor plan of the 1-bedroom apartment at Acacias Campestre",
  "2 y 3 alcobas": "2 and 3 bedrooms",
  "Balcón, sala-comedor, cocina, 2 o 3 habitaciones y 2 baños. Área interna 65,3 m² y externa 4,7 m².":
    "Balcony, living-dining room, kitchen, 2 or 3 bedrooms and 2 bathrooms. Interior area 65.3 m² and exterior area 4.7 m².",
  "Apartamentos de 70m²": "70 m² apartments (Apartamentos de 70m²)",
  "Balcón · área externa de 4,7 m²": "Balcony · 4.7 m² exterior area",
  "Plano del apartamento de 2 alcobas de Acacias Campestre": "Floor plan of the 2-bedroom apartment at Acacias Campestre",
  "Plano del apartamento de 3 alcobas de Acacias Campestre": "Floor plan of the 3-bedroom apartment at Acacias Campestre",
  "invercolombia.com.co/acacias-campestre publica únicamente la sala de ventas («Troncal Caribe, frente al SENA de Ternera»), no la ubicación del proyecto. Consultada el 14-sep-2026":
    "invercolombia.com.co/acacias-campestre publishes only the sales office address (Troncal Caribe, across from the SENA campus in Ternera), not the project location. Accessed September 14, 2026",
  "Área de la tipología pequeña": "Area of the smaller unit type",
  "33 a 35 m²": "33 to 35 m²",
  "32 a 35 m²": "32 to 35 m²",
  "Área de 2 y 3 alcobas": "Area of the 2- and 3-bedroom units",
  "70 m² las dos": "70 m² for both",
  "Entrega por etapas, sin fechas publicadas": "Handover in phases; dates not yet published",
  "Estimada por bloque, entre diciembre de 2026 y junio de 2030": "Estimated by block, between December 2026 and June 2030",
  "5 etapas; la lista vigente es la Etapa I-2, fase 1 (bloques 1 a 9). Zonas comunes por etapa sin detallar":
    "5 phases; the current price list is Phase I-2, stage 1 (blocks 1 to 9). Common areas per phase not yet detailed",
  "El listado registra un apartamento 503 de 35 m² a un precio muy por debajo del resto de su tipología. Es una duplicidad de numeración sin resolver: esa unidad no se cotiza hasta que el promotor la confirme.":
    "The list shows a 35 m² apartment numbered 503 at a price far below the rest of its unit type. It is an unresolved duplicate unit number: that unit will not be quoted until the developer confirms it.",
  "El brochure anuncia un precio de arranque inferior al mínimo disponible hoy. No se usa el brochure como fuente de precio.":
    "The brochure advertises a starting price lower than the lowest price available today. The brochure is not used as a price source.",
  "El listado registra el apartamento 207 de la torre 7, de 70 m², a $229.000.000: cien millones por debajo de los demás de su torre y piso ($329.560.000). La lista de precios de septiembre de 2026 no tiene ningún 70 m² a ese precio. Esa unidad no se cotiza hasta que el promotor la confirme.":
    "The list shows apartment 207 in tower 7, 70 m², at COP 229,000,000: one hundred million below the other units on its tower and floor (COP 329,560,000). The September 2026 price list has no 70 m² unit at that price. That unit will not be quoted until the developer confirms it.",
  "22 torres · 904 apartamentos · 5 etapas": "22 towers · 904 apartments · 5 phases",
  "Apartamentos de 1, 2 y 3 alcobas. El promotor lo plantea como proyecto de inversión.":
    "1-, 2- and 3-bedroom apartments. The developer presents it as an investment project.",
  "Acacias Campestre — piscina y solárium frente a las torres":
    "Acacias Campestre — pool and sun deck in front of the towers",
  "Acacias Campestre — vista aérea de la piscina y las torres":
    "Acacias Campestre — aerial view of the pool and the towers",
  "Acacias Campestre — cancha múltiple y parque infantil":
    "Acacias Campestre — multi-sport court and children's playground",
  "Acacias Campestre — parqueaderos junto a las torres": "Acacias Campestre — parking next to the towers",
  "Acacias Campestre — sala, cocina y comedor del apartamento modelo de 70 m²":
    "Acacias Campestre — living room, kitchen and dining room of the 70 m² model apartment",
  "Acacias Campestre — habitación principal del apartamento modelo de 70 m²":
    "Acacias Campestre — primary bedroom of the 70 m² model apartment",

  // ── Doral West ───────────────────────────────────────────────────────────
  "Doral West S.A.S. · NIT 901.641.288-2": "Doral West S.A.S. · Tax ID (NIT) 901.641.288-2",
  "Casas de uno y dos pisos con estructura preparada para crecer hasta un tercer nivel, dentro del desarrollo Doral sobre la Vía al Mar. Es el proyecto de la cartera con fechas de entrega documentadas por manzana.":
    "One- and two-story houses with a structure prepared to grow up to a third level, within the Doral development on the Vía al Mar. It is the project in our portfolio with handover dates documented block by block.",
  "Casa de un piso — lote de 150 m²": "One-story house — 150 m² lot",
  "2 habitaciones, 2 baños, sala-comedor, cocina integral, patio interno, zona de labores y parqueadero privado. Entregas entre abril y noviembre de 2028.":
    "2 bedrooms, 2 bathrooms, living-dining room, fitted kitchen, interior patio, laundry area and private parking space. Handovers between April and November 2028.",
  "Patio interno · lote de 150 m²": "Interior patio · 150 m² lot",
  "Casa de un piso — lote de 160 m²": "One-story house — 160 m² lot",
  "Misma distribución sobre lote más amplio. Entrega en noviembre de 2028.":
    "Same layout on a larger lot. Handover in November 2028.",
  "Patio interno · lote de 160 m²": "Interior patio · 160 m² lot",
  "Casa de dos pisos — lote de 128 m²": "Two-story house — 128 m² lot",
  "Dos niveles con estructura para ampliar hasta un tercero. Entregas entre noviembre de 2026 y octubre de 2028.":
    "Two levels with a structure to expand up to a third. Handovers between November 2026 and October 2028.",
  "Lote de 128 m²": "128 m² lot",
  "Casa de dos pisos — lote de 288 m²": "Two-story house — 288 m² lot",
  "Unidad única sobre lote esquinero. Entrega en abril de 2027.":
    "Single unit on a corner lot. Handover in April 2027.",
  "Lote esquinero de 288 m²": "288 m² corner lot",
  "Área construida de la casa de un piso sobre lote de 150 m²":
    "Built area of the one-story house on the 150 m² lot",
  "Brochure oficial e Instagram @doralcartagena": "Official brochure and Instagram @doralcartagena",
  "Privado, uno por casa": "Private, one per house",
  "Por manzana, entre noviembre de 2026 y noviembre de 2028": "By block, between November 2026 and November 2028",
  "Etapas 1 y 2; zonas comunes sin detallar": "Phases 1 and 2; common areas not yet detailed",
  "Casas bifamiliares de 1 y 2 pisos · lote propio": "1- and 2-story duplex homes · on their own lot",
  "Estructura preparada para crecer hasta un tercer nivel. Entregas documentadas por manzana.":
    "Structure prepared to grow up to a third level. Handover dates documented block by block.",
  "Doral West — vista aérea del condominio de casas": "Doral West — aerial view of the gated community of houses",
  "Doral West — vista aérea del condominio de casas junto a la Vía al Mar":
    "Doral West — aerial view of the gated community of houses next to the Vía al Mar",
  "Doral West — vista aérea del condominio y la zona de piscina":
    "Doral West — aerial view of the community and the pool area",
  "Doral West — canchas y casas del condominio": "Doral West — courts and houses in the community",
  "Doral West — senderos y zonas verdes del condominio": "Doral West — walking paths and green areas in the community",
  "Doral West — fachada de casa de un piso con parqueadero privado":
    "Doral West — facade of a one-story house with private parking",
  "Doral West — cocina de la casa modelo": "Doral West — kitchen of the model home",
  "Doral West — habitación de la casa modelo": "Doral West — bedroom of the model home",

  // ── Doral Country ────────────────────────────────────────────────────────
  "Conjunto cerrado de seis torres sobre la Vía al Mar, con ascensor por torre y diez unidades por piso. Es el lanzamiento más reciente del desarrollo Doral.":
    "A gated community of six towers on the Vía al Mar, with an elevator in each tower and ten units per floor. It is the most recent launch in the Doral development.",
  "Apartamento de 2 alcobas": "2-bedroom apartment",
  "2 habitaciones y 2 baños. En el piso 1 con terraza, en los pisos 2 a 5 con balcón.":
    "2 bedrooms and 2 bathrooms. Terrace on floor 1; balcony on floors 2 to 5.",
  "42 m² (pisos 2 a 5) · 50 m² (piso 1)": "42 m² (floors 2 to 5) · 50 m² (floor 1)",
  "Tabla de precios «TORRE 1-5» del constructor (encabezado literal «Area»), septiembre de 2026":
    "The builder's price table “TORRE 1-5” (verbatim header “Area”), September 2026",
  "Terraza en el piso 1 · balcón en los pisos 2 a 5": "Terrace on floor 1 · balcony on floors 2 to 5",
  "Plano del apartamento de 2 habitaciones de Doral Country; el brochure lo rotula 40 m²":
    "Floor plan of the 2-bedroom apartment at Doral Country; the brochure labels it 40 m²",
  "Apartamento de 3 alcobas": "3-bedroom apartment",
  "3 habitaciones y 2 baños. En el piso 1 con terraza, en los pisos 2 a 5 con balcón.":
    "3 bedrooms and 2 bathrooms. Terrace on floor 1; balcony on floors 2 to 5.",
  "62 m² (pisos 2 a 5) · 70 m² (piso 1)": "62 m² (floors 2 to 5) · 70 m² (floor 1)",
  "Plano del apartamento de 3 habitaciones de Doral Country; el brochure lo rotula 62 m²":
    "Floor plan of the 3-bedroom apartment at Doral Country; the brochure labels it 62 m²",
  "Áreas de las tipologías": "Unit type areas",
  "42 y 62 m² en los pisos 2 a 5 · 50 y 70 m² en el piso 1": "42 and 62 m² on floors 2 to 5 · 50 and 70 m² on floor 1",
  "Tabla de precios «TORRE 1-5» del constructor, septiembre de 2026, de donde salen los precios":
    "The builder's price table “TORRE 1-5”, September 2026, which is the source of the prices",
  "40 m² en las torres 1, 2, 3 y 5 · 42 m² en la Torre 4 · 62 m²":
    "40 m² in towers 1, 2, 3 and 5 · 42 m² in Tower 4 · 62 m²",
  "42, 50, 63 y 70 m²": "42, 50, 63 and 70 m²",
  "doralcartagena.com/country, consultada el 23-sep-2026": "doralcartagena.com/country, accessed September 23, 2026",
  "Seis torres; las torres 1 a 5 en venta, sin fechas de entrega publicadas":
    "Six towers; towers 1 to 5 for sale, with no handover dates published",
  "Apartamentos en torres · 6 torres · ascensor": "Apartments in towers · 6 towers · elevator",
  "El lanzamiento más reciente del desarrollo Doral, sobre la Vía al Mar.":
    "The most recent launch in the Doral development, on the Vía al Mar.",
  "Doral Country — torres y zona de piscina del condominio": "Doral Country — towers and pool area of the community",
  "Doral Country — torres, piscina y parqueadero del condominio":
    "Doral Country — towers, pool and parking of the community",
  "Doral Country — vista aérea del condominio con la piscina y el parque infantil":
    "Doral Country — aerial view of the community with the pool and the children's playground",
  "Doral Country — parque infantil y zonas verdes entre las torres":
    "Doral Country — children's playground and green areas between the towers",
  "Doral Country — fachada de las torres con la piscina y la zona social":
    "Doral Country — tower facades with the pool and the social area",
  "Doral Country — fachada de las torres desde el acceso al condominio":
    "Doral Country — tower facades seen from the community entrance",

  // ── Doral Suite ──────────────────────────────────────────────────────────
  "Doral Suites S.A.S. · NIT 901.602.295-8": "Doral Suites S.A.S. · Tax ID (NIT) 901.602.295-8",
  "Apartaestudios aprobados para renta corta dentro del desarrollo Doral. Al corte del 25 de junio de 2026 quedaban siete unidades de sesenta y seis: es inventario final.":
    "Studio apartments approved for short-term rentals within the Doral development. As of June 25, 2026, seven of sixty-six units remained: this is the final inventory.",
  "Apartaestudio — piso 3": "Studio apartment — floor 3",
  "1 alcoba y 1 baño. Área interna de 32,52 m² más balcón de 6,92 m².":
    "1 bedroom and 1 bathroom. Interior area of 32.52 m² plus a 6.92 m² balcony.",
  "Balcón de 6,92 m²": "6.92 m² balcony",
  "Apartaestudio — piso 4": "Studio apartment — floor 4",
  "El mismo apartaestudio del piso 3 —área interna de 32,35 m²— con terraza de 30,92 m² en vez de balcón. No es más grande por dentro: la diferencia está afuera.":
    "The same studio apartment as on floor 3 (interior area of 32.35 m²), with a 30.92 m² terrace instead of a balcony. Inside it is the same size: the difference is outdoors.",
  "Terraza de 30,92 m²": "30.92 m² terrace",
  "Acabados premium, según doralcartagena.com/doral-suites": "Premium finishes, according to doralcartagena.com/doral-suites",
  "No hay fotos ni video de la tipología del piso 4.": "There are no photos or videos of the floor 4 unit type.",
  "Apartaestudios · aprobados para renta corta": "Studio apartments · approved for short-term rentals",
  "Inventario final: 7 de 66 unidades disponibles al corte del 25 de junio de 2026.":
    "Final inventory: 7 of 66 units available as of June 25, 2026.",
  "Doral Suite — vista aérea del edificio entregado, con los condominios vecinos":
    "Doral Suite — aerial view of the completed building, with the neighboring communities",
  "Doral Suite — vista aérea del edificio y su piscina junto a la Vía al Mar":
    "Doral Suite — aerial view of the building and its pool next to the Vía al Mar",
  "Doral Suite — vista aérea del edificio sobre la Vía al Mar": "Doral Suite — aerial view of the building on the Vía al Mar",
  "Doral Suite — cocina de un apartaestudio": "Doral Suite — kitchen of a studio apartment",
  "Doral Suite — espacio principal de un apartaestudio con ventana":
    "Doral Suite — main room of a studio apartment, with a window",
  "Doral Suite — balcón de un apartaestudio con vista a la vía":
    "Doral Suite — balcony of a studio apartment overlooking the road",
  "Doral Suite — alcoba con clóset": "Doral Suite — bedroom with closet",
  "Doral Suite — baño": "Doral Suite — bathroom",
};

/**
 * Los créditos y las citas de brochure que siguen un patrón: la página sale
 * del español, no se copia a mano. Una foto nueva con «brochure oficial, pág.
 * 22» queda traducida sola.
 */
const REGLAS: Regla[] = [
  [/^Material del promotor · brochure oficial, pág\. (\d+)$/, "Developer's material · official brochure, p. $1"],
  [
    /^Material del promotor · brochure Doral Cartagena, pág\. (\d+)$/,
    "Developer's material · Doral Cartagena brochure, p. $1",
  ],
  [/^Material del promotor · ([a-z0-9.-]+\.[a-z]{2,})$/, "Developer's material · $1"],
  [/^Brochure oficial ([^,]+?) (\d{4}), pág\. (\d+)$/, "Official $1 $2 brochure, p. $3"],
  [/^Brochure oficial ([^,]+?) (\d{4}), pág\. (\d+) \(cita literal\)$/, "Official $1 $2 brochure, p. $3 (verbatim)"],
  [/^Brochure oficial, pág\. (\d+)$/, "Official brochure, p. $1"],
  [/^Brochure del constructor, pág\. (\d+)$/, "Builder's brochure, p. $1"],
  [/^Brochure del constructor, pág\. (\d+) \(rotula (\d+) m²\)$/, "Builder's brochure, p. $1 (labeled $2 m²)"],
];

const t = traductor(TEXTOS, REGLAS);
const tn = (texto: string | null) => (texto === null ? null : t(texto));

function foto<F extends Foto>(f: F): F {
  return { ...f, alt: t(f.alt), credito: t(f.credito) };
}

function plano(p: Plano): Plano {
  return { ...foto(p), fuente: t(p.fuente) };
}

function tipologia(x: Tipologia): Tipologia {
  const y: Tipologia = {
    ...x,
    titulo: t(x.titulo),
    detalle: t(x.detalle),
    fuente: t(x.fuente),
    area: { ...x.area, etiqueta: t(x.area.etiqueta), valor: t(x.area.valor), fuente: t(x.area.fuente) },
  };
  if (x.alcobas !== undefined) y.alcobas = t(x.alcobas);
  if (x.banos !== undefined) y.banos = t(x.banos);
  if (x.exterior !== undefined) y.exterior = t(x.exterior);
  if (x.planos) y.planos = x.planos.map(plano);
  return y;
}

function precontractual(x: Precontractual): Precontractual {
  return {
    estrato: tn(x.estrato),
    parqueadero: tn(x.parqueadero),
    fechaEntrega: tn(x.fechaEntrega),
    administracion: tn(x.administracion),
    acabados: tn(x.acabados),
    planEtapas: tn(x.planEtapas),
    desistimiento: tn(x.desistimiento),
  };
}

/** El proyecto en inglés: el mismo objeto, con el texto visible traducido. */
function traducir(p: Proyecto): Proyecto {
  const q: Proyecto = {
    ...p,
    promotor: t(p.promotor),
    resumen: t(p.resumen),
    tipologias: p.tipologias.map(tipologia),
    amenidades: p.amenidades.map((a) => t(a)),
    datos: p.datos.map((d) => ({ ...d, label: t(d.label), valor: t(d.valor), fuente: t(d.fuente) })),
    ubicacion: tn(p.ubicacion),
    ubicacionFuente: t(p.ubicacionFuente),
    conflictos: p.conflictos.map((c) => ({
      ...c,
      dato: t(c.dato),
      versiones: c.versiones.map((v) => ({ ...v, valor: t(v.valor), fuente: t(v.fuente) })),
    })),
    // El corte, de la fecha en español: «12 de agosto de 2026» → «August 12, 2026».
    precio: p.precio === null ? null : { ...p.precio, corte: fechaEn(p.precio.corte), fuente: t(p.precio.fuente) },
    precontractual: precontractual(p.precontractual),
    reservas: p.reservas.map((r) => t(r)),
  };
  if (p.heroPin) q.heroPin = { ...p.heroPin, fuente: t(p.heroPin.fuente) };
  if (p.presentacion) {
    q.presentacion = { ...p.presentacion, linea: t(p.presentacion.linea), frase: t(p.presentacion.frase) };
  }
  if (p.fraseDestacada !== undefined) q.fraseDestacada = t(p.fraseDestacada);
  if (p.fotos) {
    q.fotos = { ...p.fotos, tarjeta: foto(p.fotos.tarjeta), galeria: p.fotos.galeria.map((f) => foto(f)) };
    if (p.fotos.escaparate) q.fotos.escaparate = foto(p.fotos.escaparate);
  }
  if (p.coordenada) q.coordenada = { ...p.coordenada, fuente: t(p.coordenada.fuente) };
  if (p.tiempos) q.tiempos = p.tiempos.map((x) => ({ ...x, fuente: t(x.fuente) }));
  if (p.opinionRafael) {
    q.opinionRafael = {
      paraQuien: t(p.opinionRafael.paraQuien),
      fuertes: p.opinionRafael.fuertes.map((f) => t(f)),
      tenerEnCuenta: p.opinionRafael.tenerEnCuenta.map((f) => t(f)),
      fecha: fechaEn(p.opinionRafael.fecha),
    };
  }
  if (p.faq) q.faq = p.faq.map((f) => ({ pregunta: t(f.pregunta), respuesta: t(f.respuesta) }));
  if (p.avanceObra) q.avanceObra = { ...p.avanceObra, fuente: t(p.avanceObra.fuente) };
  if (p.rentaCorta) q.rentaCorta = { fuente: t(p.rentaCorta.fuente) };
  return q;
}

const PROYECTOS: Proyecto[] = es.PROYECTOS.map(traducir);

function getProyecto(slug: string): Proyecto | undefined {
  return PROYECTOS.find((p) => p.slug === slug);
}

/** Lo que le falta a la pieza (numeral 2.16.1), con las etiquetas en inglés. */
const FALTAN: Diccionario = {
  "área": "area",
  "precio de referencia": "reference price",
  "ubicación exacta del proyecto": "exact project location",
};

/** La lógica es la del español; solo cambian las etiquetas de lo que falta. */
function datosDePieza(p: Proyecto): ReturnType<typeof es.datosDePieza> {
  const r = es.datosDePieza(p);
  return { ...r, faltan: r.faltan.map((f) => FALTAN[f] ?? f) };
}

/** La información precontractual del numeral 2.16.2, con los nombres en inglés. */
const PRECONTRACTUAL: Diccionario = {
  "estrato": "socioeconomic stratum (estrato)",
  "naturaleza del parqueadero": "type of parking",
  "fecha estimada de entrega": "estimated handover date",
  "cuota de administración estimada": "estimated HOA fee (cuota de administración)",
  "muebles, equipos y acabados": "furniture, fixtures and finishes",
  "plan de etapas y zonas comunes": "phasing plan and common areas",
  "valor de desistimiento": "withdrawal fee (valor de desistimiento)",
};

function faltaPrecontractual(p: Proyecto): string[] {
  return es.faltaPrecontractual(p).map((f) => PRECONTRACTUAL[f] ?? f);
}

/**
 * «August 12, 2026» → «2026-08-12», para los datos estructurados. Acepta
 * también la fecha en español: el corte puede llegar de cualquiera de los dos
 * módulos. Una fecha que no se entiende devuelve null, como en español.
 */
function fechaISO(texto: string): string | null {
  const desdeEspanol = es.fechaISO(texto);
  if (desdeEspanol) return desdeEspanol;
  const m = texto.trim().match(/^([a-z]+) (\d{1,2}), (\d{4})$/i);
  if (!m) return null;
  const mes = MESES_EN.findIndex((nombre) => nombre.toLowerCase() === m[1].toLowerCase());
  if (mes < 0) return null;
  return `${m[3]}-${String(mes + 1).padStart(2, "0")}-${m[2].padStart(2, "0")}`;
}

/** «from COP 403,000,000», o «COP 525,000,000» si no hay rango. */
function rangoPrecio(desde: number, hasta: number): string {
  return desde === hasta ? pesos(desde) : `from ${pesos(desde)}`;
}

export const modulo: typeof import("@/data/proyectos") = {
  ...es,
  PROYECTOS,
  getProyecto,
  datosDePieza,
  faltaPrecontractual,
  formatoPesos: pesos,
  fechaISO,
  rangoPrecio,
};
