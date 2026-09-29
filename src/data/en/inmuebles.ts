/**
 * LOS INMUEBLES DISPONIBLES EN INGLÉS
 *
 * Encima de `src/data/inmuebles.ts`: copia cada apartamento y reemplaza solo
 * el texto visible. Precio, corte, áreas, fotos y slugs salen del español.
 * `estado` («Terminado», «En construcción») no se traduce porque la ficha lo
 * usa para filtrar; se muestra con `etiquetaEstadoInmueble` (src/i18n/datos.ts).
 *
 * `zona` se traduce, pero conserva «Zona Norte» y «Atlántico» tal cual: la
 * página del inmueble y la ficha los buscan en el texto.
 *
 * Los créditos de las fotos: los renders dicen «render» también en inglés (la
 * página del inmueble lo busca para el aviso de imágenes ilustrativas).
 *
 * Cada traducción se busca por el texto exacto en español; si el español
 * cambia, sale el español nuevo hasta que se traduzca aquí.
 */
import * as es from "@/data/inmuebles";
import type { Inmueble } from "@/data/inmuebles";
import { ETIQUETAS_AREA, fechaEn, pesos, traductor, type Diccionario, type Regla } from "@/data/en/traducir";

const DESCRIPCION_MORROS_ES =
  "Morros Park es un proyecto de Novus Civitas y Epic diseño+construcción en Serena del Mar, la ciudad planeada de la Zona Norte donde ya funcionan el Hospital Serena del Mar y la sede Caribe de la Universidad de los Andes.";

const TEXTOS: Diccionario = {
  ...ETIQUETAS_AREA,

  // ── Lo que se repite ─────────────────────────────────────────────────────
  "Zona Norte de Cartagena": "Zona Norte, Cartagena",
  "Escritura pública del apartamento": "Public deed of the apartment",
  "Parqueadero privado": "Private parking space",
  "1 alcoba + estudio (el estudio puede ser la alcoba 2)": "1 bedroom + study (the study can serve as bedroom 2)",
  "Una alcoba, estudio, dos baños, sala-comedor, cocina y balcón":
    "One bedroom, study, two bathrooms, living-dining room, kitchen and balcony",
  "Presentación de venta del apartamento (octubre de 2023)": "Sales presentation of the apartment (October 2023)",
  "Book digital de Morros Park (enero de 2023)": "Morros Park digital book (January 2023)",
  "Plano oficial del promotor · diciembre de 2022": "Developer's official floor plan · December 2022",
  "Promotores e imágenes: book digital de Morros Park (enero de 2023). Las imágenes son renders.":
    "Developers and images: Morros Park digital book (January 2023). The images are renders.",
  [DESCRIPCION_MORROS_ES]:
    "Morros Park is a project by Novus Civitas and Epic diseño+construcción in Serena del Mar, the planned city in the Zona Norte where the Hospital Serena del Mar and the Caribbean campus of the Universidad de los Andes already operate.",

  // ── Créditos de las fotos ────────────────────────────────────────────────
  "Foto del apartamento · 28 de febrero de 2026": "Photo of the apartment · February 28, 2026",
  "Render del promotor · Morros Park, 2023": "Developer's render · Morros Park, 2023",
  "Foto del apartamento · presentación de venta de 2023": "Photo of the apartment · 2023 sales presentation",

  // ── Doral Suites 320 ─────────────────────────────────────────────────────
  "Doral Suites · apto 320": "Doral Suites · Apt. 320",
  "Doral Suites, Vía al Mar 90A, Zona Norte de Cartagena de Indias":
    "Doral Suites, Vía al Mar 90A, Zona Norte, Cartagena de Indias",
  "Brochure oficial Doral Cartagena y doralcartagena.com": "Official Doral Cartagena brochure and doralcartagena.com",
  "Escritura pública del apartamento, julio de 2025": "Public deed of the apartment, July 2025",
  "Uso exclusivo de un parqueadero asignado": "Exclusive use of an assigned parking space",
  "1 habitación · balcón · piso 3": "1 bedroom · balcony · floor 3",
  "Terminado, con balcón y parqueadero de uso exclusivo, en un proyecto aprobado para renta corta.":
    "Completed, with a balcony and an exclusive-use parking space, in a project approved for short-term rentals.",
  "Apartamento terminado en el piso 3 de Doral Suites, dentro del desarrollo Doral sobre la Vía al Mar: una habitación, un baño, cocina con muebles altos y bajos y mesón con lavaplatos, sala-comedor y balcón. La estufa la escoge quien compre.":
    "A completed apartment on floor 3 of Doral Suites, within the Doral development on the Vía al Mar: one bedroom, one bathroom, a kitchen with upper and lower cabinets and a countertop with sink, a living-dining room and a balcony. The buyer chooses the stove.",
  "Doral Suites está aprobado para renta corta, según su constructor: sirve para vivir o para rentar por días.":
    "Doral Suites is approved for short-term rentals, according to its builder: it works as a home or as a daily rental.",
  "Habitación, baño, cocina con muebles y mesón con lavaplatos (la estufa la escoge quien compre), sala-comedor, balcón y parqueadero de uso exclusivo":
    "Bedroom, bathroom, kitchen with cabinets and a countertop with sink (the buyer chooses the stove), living-dining room, balcony and exclusive-use parking space",
  "Plano oficial del apartamento tipo 5, escritura pública y fotos del apartamento del 28 de febrero de 2026":
    "Official floor plan of apartment type 5, public deed and photos of the apartment from February 28, 2026",
  "Aprobado para renta corta": "Approved for short-term rentals",
  "Dentro del desarrollo Doral, sobre la Vía al Mar": "Within the Doral development, on the Vía al Mar",
  "Precio de venta confirmado el 25 de septiembre de 2026": "Sale price confirmed on September 25, 2026",
  "Doral Suites 320 — sala-comedor con la puerta al balcón": "Doral Suites 320 — living-dining room with the door to the balcony",
  "Doral Suites 320 — balcón con vista a la Vía al Mar": "Doral Suites 320 — balcony overlooking the Vía al Mar",
  "Doral Suites 320 — cocina con muebles altos y bajos y mesón con lavaplatos":
    "Doral Suites 320 — kitchen with upper and lower cabinets and a countertop with sink",
  "Doral Suites 320 — habitación con ventana": "Doral Suites 320 — bedroom with a window",
  "Doral Suites 320 — clóset de la habitación": "Doral Suites 320 — bedroom closet",
  "Doral Suites 320 — baño con ducha en vidrio": "Doral Suites 320 — bathroom with a glass shower",
  "Plano del apartamento tipo 5 de Doral Suites: habitación, baño, cocina, sala-comedor y balcón":
    "Floor plan of Doral Suites apartment type 5: bedroom, bathroom, kitchen, living-dining room and balcony",
  "Plano del constructor · doralcartagena.com": "Builder's floor plan · doralcartagena.com",
  "Plano oficial del apartamento tipo 5 (doralcartagena.com)": "Official floor plan of apartment type 5 (doralcartagena.com)",
  "Piso, áreas y parqueadero: escritura pública del apartamento (julio de 2025).":
    "Floor, areas and parking: public deed of the apartment (July 2025).",
  "Distribución y balcón: plano oficial del apartamento tipo 5 (doralcartagena.com).":
    "Layout and balcony: official floor plan of apartment type 5 (doralcartagena.com).",
  "Cocina: fotos del apartamento del 28 de febrero de 2026; trae muebles y mesón con lavaplatos, y la estufa la escoge quien compre (confirmado el 27 de septiembre de 2026).":
    "Kitchen: photos of the apartment from February 28, 2026; it comes with cabinets and a countertop with sink, and the buyer chooses the stove (confirmed on September 27, 2026).",
  "Precio: vigente al 25 de septiembre de 2026.": "Price: current as of September 25, 2026.",
  "Renta corta: doralcartagena.com/doral-suites.": "Short-term rentals: doralcartagena.com/doral-suites.",
  "Fotos del apartamento: 28 de febrero de 2026.": "Photos of the apartment: February 28, 2026.",

  // ── Cavana 303, torre 10 ─────────────────────────────────────────────────
  "Cavana · apto 303, torre 10": "Cavana · Apt. 303, Tower 10",
  "Conjunto Residencial Cavana, Serena del Mar, Zona Norte de Cartagena de Indias":
    "Conjunto Residencial Cavana, Serena del Mar, Zona Norte, Cartagena de Indias",
  "3 alcobas · 5 baños · vista al lago · piso 3": "3 bedrooms · 5 bathrooms · lake view · floor 3",
  "Amplio y terminado, con balcones hacia el lago, en Serena del Mar.":
    "Spacious and completed, with balconies facing the lake, in Serena del Mar.",
  "Apartamento en el piso 3 de la torre 10 del Conjunto Residencial Cavana, en Serena del Mar: salón-comedor, cocina, zona de labores, alacena, hall, estudio, tres alcobas, cinco baños y vestier.":
    "An apartment on floor 3 of tower 10 at Conjunto Residencial Cavana, in Serena del Mar: living-dining room, kitchen, laundry area, pantry, hall, study, three bedrooms, five bathrooms and a walk-in closet.",
  "Los balcones miran al lago, y el apartamento tiene aire acondicionado. Serena del Mar reúne el Hospital Serena del Mar y la sede Caribe de la Universidad de los Andes.":
    "The balconies overlook the lake, and the apartment has air conditioning. Serena del Mar is home to the Hospital Serena del Mar and the Caribbean campus of the Universidad de los Andes.",
  "Salón-comedor, cocina, zona de labores, alacena, hall, estudio, tres alcobas, cinco baños, vestier y balcones":
    "Living-dining room, kitchen, laundry area, pantry, hall, study, three bedrooms, five bathrooms, walk-in closet and balconies",
  "Precio de venta confirmado el 26 de septiembre de 2026": "Sale price confirmed on September 26, 2026",
  "Cavana 303 — balcón con vista al lago": "Cavana 303 — balcony with a lake view",
  "Cavana 303 — sala con el ventanal hacia el lago": "Cavana 303 — living room with the large window facing the lake",
  "Cavana 303 — sala y cocina con isla": "Cavana 303 — living room and kitchen with island",
  "Cavana 303 — cocina integral": "Cavana 303 — fitted kitchen",
  "Cavana 303 — vista del lago desde el balcón": "Cavana 303 — view of the lake from the balcony",
  "Cavana 303 — alcoba con clóset": "Cavana 303 — bedroom with closet",
  "Cavana 303 — vestier": "Cavana 303 — walk-in closet",
  "Cavana 303 — baño": "Cavana 303 — bathroom",
  "Piso, torre, dependencias y áreas: escritura pública del apartamento.":
    "Floor, tower, rooms and areas: public deed of the apartment.",
  "Precio: vigente al 26 de septiembre de 2026.": "Price: current as of September 26, 2026.",
  "Vista al lago y aire acondicionado: fotos del apartamento del 28 de febrero de 2026.":
    "Lake view and air conditioning: photos of the apartment from February 28, 2026.",

  // ── Morros Park 421 y 519 ────────────────────────────────────────────────
  "Morros Park · apto 421": "Morros Park · Apt. 421",
  "Morros Park · apto 519": "Morros Park · Apt. 519",
  "Morros Park, Serena del Mar, Zona Norte de Cartagena de Indias":
    "Morros Park, Serena del Mar, Zona Norte, Cartagena de Indias",
  "Plano oficial del apartamento 421, diciembre de 2022": "Official floor plan of apartment 421, December 2022",
  "Plano oficial del apartamento 519, diciembre de 2022": "Official floor plan of apartment 519, December 2022",
  "Plano oficial: área interna de 71,80 m² y balcón de 9,20 m²":
    "Official floor plan: interior area of 71.80 m² and a 9.20 m² balcony",
  "Plano oficial: área interna de 71,80 m² y balcón de 10,20 m²":
    "Official floor plan: interior area of 71.80 m² and a 10.20 m² balcony",
  "Un parqueadero, por asignar": "One parking space, to be assigned",
  "1 alcoba + estudio · 2 baños · balcón · piso 4": "1 bedroom + study · 2 bathrooms · balcony · floor 4",
  "1 alcoba + estudio · 2 baños · balcón · piso 5": "1 bedroom + study · 2 bathrooms · balcony · floor 5",
  "En construcción en Serena del Mar, con balcón y un estudio que puede ser la segunda alcoba.":
    "Under construction in Serena del Mar, with a balcony and a study that can be the second bedroom.",
  "En construcción en Serena del Mar, en el piso 5, con balcón de 10,20 m².":
    "Under construction in Serena del Mar, on floor 5, with a 10.20 m² balcony.",
  "Apartamento en construcción en el piso 4 de Morros Park: una alcoba más estudio —que puede ser la segunda alcoba—, dos baños y balcón.":
    "An apartment under construction on floor 4 of Morros Park: one bedroom plus a study (which can be the second bedroom), two bathrooms and a balcony.",
  "Apartamento en construcción en el piso 5 de Morros Park: una alcoba más estudio —que puede ser la segunda alcoba—, dos baños y balcón de 10,20 m².":
    "An apartment under construction on floor 5 of Morros Park: one bedroom plus a study (which can be the second bedroom), two bathrooms and a 10.20 m² balcony.",
  "Plano oficial del apartamento 421 (diciembre de 2022)": "Official floor plan of apartment 421 (December 2022)",
  "Plano oficial del apartamento 519 (diciembre de 2022)": "Official floor plan of apartment 519 (December 2022)",
  "Morros Park — vista aérea de los edificios, la piscina y la vegetación (render)":
    "Morros Park — aerial view of the buildings, the pool and the greenery (render)",
  "Morros Park — piscina entre jardines y palmeras (render)": "Morros Park — pool among gardens and palm trees (render)",
  "Morros Park — piscina al atardecer frente a los edificios (render)":
    "Morros Park — pool at sunset in front of the buildings (render)",
  "Morros Park — balcón con vista al mar (render)": "Morros Park — balcony with an ocean view (render)",
  "Morros Park — sala con salida al jardín (render)": "Morros Park — living room opening onto the garden (render)",
  "Plano del apartamento 421 de Morros Park: alcoba, estudio, dos baños y balcón":
    "Floor plan of Morros Park apartment 421: bedroom, study, two bathrooms and balcony",
  "Plano del apartamento 519 de Morros Park: alcoba, estudio, dos baños y balcón":
    "Floor plan of Morros Park apartment 519: bedroom, study, two bathrooms and balcony",
  "Distribución y áreas: plano oficial del apartamento 421 (diciembre de 2022).":
    "Layout and areas: official floor plan of apartment 421 (December 2022).",
  "Distribución y áreas: plano oficial del apartamento 519 (diciembre de 2022).":
    "Layout and areas: official floor plan of apartment 519 (December 2022).",
  "Parqueadero: documento de compra del apartamento.": "Parking: the apartment's purchase document.",

  // ── Agua Marina Beach Resort 803 ─────────────────────────────────────────
  "Agua Marina Beach Resort · apto 803": "Agua Marina Beach Resort · Apt. 803",
  "8, con ascensor": "8, with elevator",
  "2 baños y 1 baño social": "2 bathrooms and 1 guest bathroom",
  "Presentación de venta del apartamento, octubre de 2023": "Sales presentation of the apartment, October 2023",
  "3 habitaciones · estudio · terraza con vista al mar · piso 8": "3 bedrooms · study · ocean-view terrace · floor 8",
  "En un condominio privado frente al mar, con una gran terraza que mira al Caribe desde el piso 8.":
    "In a private oceanfront community, with a large terrace overlooking the Caribbean from floor 8.",
  "Apartamento en el piso 8, con ascensor, en Agua Marina Beach Resort: un condominio privado frente al mar en Juan de Acosta, Atlántico.":
    "An apartment on floor 8, with elevator access, at Agua Marina Beach Resort: a private oceanfront community in Juan de Acosta, Atlántico.",
  "Tiene tres habitaciones, dos baños más baño social, estudio, sala-comedor, cocina tipo americana, zona de labores y una gran terraza con vista al mar.":
    "It has three bedrooms, two bathrooms plus a guest bathroom, a study, a living-dining room, an open kitchen, a laundry area and a large terrace with an ocean view.",
  "Tres habitaciones, dos baños y baño social, estudio, sala-comedor, cocina tipo americana, zona de labores, terraza con vista al mar y parqueadero privado":
    "Three bedrooms, two bathrooms and a guest bathroom, study, living-dining room, open kitchen, laundry area, ocean-view terrace and private parking space",
  "Condominio privado frente al mar": "Private oceanfront community",
  "Vigilancia privada con CCTV": "Private security with CCTV",
  "Piscinas y jacuzzis": "Pools and hot tubs",
  "Zonas húmedas": "Spa areas",
  "Gimnasios": "Gyms",
  "Minimarket y restaurante": "Mini-market and restaurant",
  "Zonas infantiles": "Children's areas",
  "Senderos para caminar": "Walking trails",
  "Agua Marina 803 — terraza con vista al mar y a las piscinas del condominio":
    "Agua Marina 803 — terrace overlooking the ocean and the community's pools",
  "Agua Marina 803 — atardecer desde la terraza": "Agua Marina 803 — sunset from the terrace",
  "Agua Marina 803 — sala-comedor": "Agua Marina 803 — living-dining room",
  "Agua Marina 803 — cocina tipo americana": "Agua Marina 803 — open kitchen",
  "Agua Marina 803 — habitación principal": "Agua Marina 803 — primary bedroom",
  "Agua Marina Beach Resort — edificios del condominio": "Agua Marina Beach Resort — the community's buildings",
  "Piso, área, dependencias y condominio: presentación de venta del apartamento (octubre de 2023).":
    "Floor, area, rooms and community: sales presentation of the apartment (October 2023).",
  "Fotos: presentación de venta de 2023.": "Photos: 2023 sales presentation.",
};

/** Las áreas, con el decimal en punto: «35,26 m²» → «35.26 m²». La cifra no se reescribe. */
const REGLAS: Regla[] = [[/^(\d+),(\d+) m²$/, "$1.$2 m²"]];

const t = traductor(TEXTOS, REGLAS);

/** El inmueble en inglés: el mismo objeto, con el texto visible traducido. */
function traducir(i: Inmueble): Inmueble {
  return {
    ...i,
    nombre: t(i.nombre),
    zona: t(i.zona),
    ubicacion: t(i.ubicacion),
    ubicacionFuente: t(i.ubicacionFuente),
    piso: t(i.piso),
    habitaciones: t(i.habitaciones),
    banos: t(i.banos),
    areas: i.areas.map((a) => ({ ...a, etiqueta: t(a.etiqueta), valor: t(a.valor), fuente: t(a.fuente) })),
    parqueadero: i.parqueadero === null ? null : t(i.parqueadero),
    linea: t(i.linea),
    frase: t(i.frase),
    descripcion: i.descripcion.map((d) => t(d)),
    dependencias: { ...i.dependencias, texto: t(i.dependencias.texto), fuente: t(i.dependencias.fuente) },
    conjunto:
      i.conjunto === null
        ? null
        : { ...i.conjunto, items: i.conjunto.items.map((x) => t(x)), fuente: t(i.conjunto.fuente) },
    // El corte, de la fecha en español: «25 de septiembre de 2026» → «September 25, 2026».
    precio: i.precio === null ? null : { ...i.precio, corte: fechaEn(i.precio.corte), fuente: t(i.precio.fuente) },
    fotos: i.fotos.map((f) => ({ ...f, alt: t(f.alt), credito: t(f.credito) })),
    plano:
      i.plano === null
        ? null
        : { ...i.plano, alt: t(i.plano.alt), credito: t(i.plano.credito), fuente: t(i.plano.fuente) },
    fuentes: i.fuentes.map((f) => t(f)),
  };
}

const INMUEBLES: Inmueble[] = es.INMUEBLES.map(traducir);

function getInmueble(slug: string): Inmueble | undefined {
  return INMUEBLES.find((i) => i.slug === slug);
}

/** «COP 330,000,000» o «Price on request». El corte, en inglés aunque llegue el inmueble en español. */
function precioInmueble(i: Inmueble): { texto: string; corte: string | null } {
  return i.precio
    ? { texto: pesos(i.precio.valor), corte: fechaEn(i.precio.corte) }
    : { texto: "Price on request", corte: null };
}

export const modulo: typeof import("@/data/inmuebles") = {
  ...es,
  INMUEBLES,
  getInmueble,
  precioInmueble,
};
