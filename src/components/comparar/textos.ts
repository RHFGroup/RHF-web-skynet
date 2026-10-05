/**
 * Los textos del comparador, en los dos idiomas. Ninguna cifra se escribe
 * aquí: las cifras llegan de la capa de datos o del motor.
 *
 * Lo que estos textos nunca dicen: que una opción «va a valorizarse», que da
 * una rentabilidad o que es «la mejor inversión». El puntaje es un criterio
 * de RHF Living sobre lo documentado, y así se presenta.
 */
import type { Criterio, Perfil } from "@/lib/comparar/evaluar";
import type { Grupo } from "@/components/comparar/opciones";
import type { Idioma } from "@/i18n/idioma";

type Textos = {
  grupos: Record<Grupo, { titulo: string; nota: string }>;
  grupoAria: string;
  opcionA: string;
  opcionB: string;
  elegir: string;
  perfilTitulo: string;
  perfiles: Record<Perfil, { titulo: string; nota: string }>;
  criterios: Record<Criterio, { titulo: string; regla: string }>;
  sinDato: string;
  consultar: string;
  // Puntaje
  puntajeKicker: string;
  puntajeTitulo: string;
  puntajeLede: (perfil: string) => string;
  sobre100: string;
  decisivoTitulo: string;
  decisivo: (ganador: string, criterio: string) => string;
  contrapeso: (otra: string, criterio: string) => string;
  decisivoSinDato: (ganador: string, otra: string, criterio: string) => string;
  empate: string;
  aportesTitulo: string;
  aportesLede: string;
  posibles: (peso: string) => string;
  totalAria: (a: string, pa: string, b: string, pb: string) => string;
  // Matriz
  matrizKicker: string;
  matrizTitulo: string;
  filas: {
    precio: string;
    precioM2: string;
    unidades: string;
    area: string;
    alcobas: string;
    banos: string;
    exterior: string;
    parqueadero: string;
    entrega: string;
    rentaCorta: string;
    zonas: string;
    ubicacion: string;
  };
  corte: (fecha: string) => string;
  alCorte: (fecha: string) => string;
  m2Nota: (area: string, etiqueta: string) => string;
  m2SinDato: string;
  areaConflicto: string;
  areaPendiente: string;
  rentaSi: (fuente: string) => string;
  rentaNo: string;
  zonasCuenta: (n: number) => string;
  cuentan: (n: number) => string;
  ubicacionSinDato: string;
  fuente: string;
  columnasTitulo: string;
  columnas: { precio: string; cuota: string; ingreso: string; m2: string };
  columnasNota: (tasa: string, plazo: string, limite: string, financiado: string) => string;
  menor: string;
  // Escenarios
  escenariosKicker: string;
  escenariosTitulo: string;
  inversionTitulo: string;
  inversionLede: string;
  habitabilidadTitulo: string;
  habitabilidadLede: string;
  queda: (nombre: string) => string;
  quedaEmpate: string;
  cuotaInicial: string;
  ingreso20: string;
  noProyectamos: string;
  simularRenta: (nombre: string) => string;
  simular: (nombre: string) => string;
  // Gráfica de área
  areaTitulo: string;
  areaLede: string;
  areaEje: string;
  areaAria: (a: string, b: string) => string;
  anios: (n: number) => string;
  // Cierre
  verFicha: string;
  whatsapp: string;
  mensajeWhatsapp: (a: string, b: string, perfil: string) => string;
  mismaOpcion: string;
  reglaKicker: string;
};

export const TEXTOS: Record<Idioma, Textos> = {
  es: {
    grupos: {
      planos: { titulo: "Sobre planos y en construcción", nota: "Proyectos en lanzamiento u obra y apartamentos en construcción." },
      inmediata: { titulo: "Entrega inmediata", nota: "Proyectos entregados y apartamentos terminados." },
    },
    grupoAria: "Qué quieres comparar",
    opcionA: "Opción A",
    opcionB: "Opción B",
    elegir: "Elige una opción",
    perfilTitulo: "¿Para qué es?",
    perfiles: {
      inversionista: { titulo: "Invertir", nota: "Pesan el precio de entrada, cuándo se entrega, la renta corta documentada y lo documentado." },
      vivir: { titulo: "Vivir", nota: "Pesan las alcobas, el espacio exterior, el parqueadero y las zonas comunes." },
      mixto: { titulo: "Las dos", nota: "Un poco de cada uno." },
    },
    criterios: {
      precio: { titulo: "Precio de entrada", regla: "El precio desde publicado, con su fecha de corte. El más bajo de los dos vale 100; el otro, en proporción." },
      entrega: { titulo: "Cuándo lo usas", regla: "Entrega inmediata, 100. Con fecha de entrega publicada por la fuente, 60. Sin fecha publicada, 25." },
      rentaCorta: { titulo: "Renta corta documentada", regla: "100 si una fuente escrita la aprueba (hoy, la del constructor); 0 si no." },
      espacio: { titulo: "Alcobas", regla: "Las de la opción más grande de cada uno. La que tiene más vale 100." },
      exterior: { titulo: "Espacio exterior propio", regla: "Lote o patio, 100. Terraza, 70. Balcón, 40. Es la mejor opción que ofrece, según la fuente." },
      parqueadero: { titulo: "Parqueadero", regla: "Privado o de uso exclusivo, 100. Sin precisar, 70. Comunal, 40." },
      zonasComunes: { titulo: "Zonas comunes", regla: "Las que lista la fuente: piscina, gimnasio, canchas, parque infantil… La que tiene más vale 100." },
      informacion: {
        titulo: "Información documentada",
        regla: "De cinco datos: precio publicable, ubicación exacta, área sin contradicciones entre fuentes, entrega y parqueadero. Cada uno vale 20.",
      },
    },
    sinDato: "Sin dato",
    consultar: "Consultar",
    puntajeKicker: "Puntaje",
    puntajeTitulo: "¿Cuál se acerca más a lo que buscas?",
    puntajeLede: (perfil) =>
      `Sobre 100, para «${perfil}». Es un criterio de RHF Living con los pesos a la vista, calculado solo con lo que está documentado: no califica el proyecto ni promete una rentabilidad.`,
    sobre100: "de 100",
    decisivoTitulo: "Factor decisivo",
    decisivo: (ganador, criterio) => `${ganador} toma la delantera sobre todo por ${criterio.toLowerCase()}.`,
    contrapeso: (otra, criterio) => `A favor de ${otra} pesa sobre todo ${criterio.toLowerCase()}.`,
    decisivoSinDato: (ganador, otra, criterio) => `${ganador} toma la delantera sobre todo porque ${otra} no tiene publicado el dato de ${criterio.toLowerCase()}.`,
    empate: "Con lo documentado, las dos quedan parejas para este perfil.",
    aportesTitulo: "De dónde sale cada punto",
    aportesLede: "A la izquierda suma la opción A; a la derecha, la B. La franja clara es lo máximo que da cada criterio con estos pesos.",
    posibles: (peso) => `${peso} posibles`,
    totalAria: (a, pa, b, pb) => `${a}: ${pa} de 100. ${b}: ${pb} de 100.`,
    matrizKicker: "Matriz",
    matrizTitulo: "Punto por punto",
    filas: {
      precio: "Precio",
      precioM2: "Precio por m² de la opción base",
      unidades: "Unidades disponibles",
      area: "Área",
      alcobas: "Alcobas",
      banos: "Baños",
      exterior: "Exterior",
      parqueadero: "Parqueadero",
      entrega: "Entrega",
      rentaCorta: "Renta corta",
      zonas: "Lo que lista la fuente",
      ubicacion: "Ubicación",
    },
    corte: (fecha) => `Precio de referencia en pesos, corte del ${fecha}, sujeto a disponibilidad.`,
    alCorte: (fecha) => `al ${fecha}`,
    m2Nota: (area, etiqueta) => `Sobre ${area} («${etiqueta}», como lo rotula la fuente).`,
    m2SinDato: "Sin cálculo: las fuentes no coinciden en el área o no hay precio publicable.",
    areaConflicto: "Las fuentes del promotor publican cifras distintas.",
    areaPendiente: "Con la etiqueta de su fuente. Que sea el área privada construida (Ley 675, art. 3) está pendiente de certificación del promotor, salvo donde la escritura la dice.",
    rentaSi: (fuente) => `Aprobada · ${fuente}`,
    rentaNo: "No documentada",
    zonasCuenta: (n) => (n === 1 ? "1 zona común" : `${n} zonas comunes`),
    cuentan: (n) => `Cuentan como zonas comunes: ${n}. Lo demás de la lista se muestra, pero no suma.`,
    ubicacionSinDato: "El promotor no publica la ubicación del proyecto.",
    fuente: "Fuente",
    columnasTitulo: "Las cifras, lado a lado",
    columnas: { precio: "Precio desde", cuota: "Cuota inicial mínima con crédito", ingreso: "Ingreso del hogar que pide el banco", m2: "Precio por m²" },
    columnasNota: (tasa, plazo, limite, financiado) =>
      `Cuota inicial: lo que el banco no financia con crédito hipotecario No VIS (hasta el ${financiado}, Decreto 1077 de 2015). Ingreso: la primera cuota no puede pasar del ${limite} del ingreso (Decreto 583 de 2025), a ${plazo} y con la tasa promedio de lo desembolsado en No VIS en pesos (${tasa}, Superintendencia Financiera). Tu banco puede ofrecerte otra.`,
    menor: "Menor",
    escenariosKicker: "Escenarios",
    escenariosTitulo: "Dos maneras de mirar la misma decisión",
    inversionTitulo: "Escenario 1 · Invertir",
    inversionLede: "Precio de entrada, cuándo empieza a servir, renta corta documentada y lo documentado.",
    habitabilidadTitulo: "Escenario 2 · Vivir",
    habitabilidadLede: "Alcobas, espacio exterior, parqueadero y zonas comunes.",
    queda: (nombre) => `Con lo documentado, ${nombre} queda mejor parado en este escenario.`,
    quedaEmpate: "Con lo documentado, quedan parejas en este escenario.",
    cuotaInicial: "Cuota inicial mínima",
    ingreso20: "Ingreso del hogar a 20 años",
    noProyectamos:
      "No proyectamos renta, retorno ni valorización: ninguna de esas cifras tiene hoy una fuente por proyecto, y lo que se publica obliga (Ley 1480 de 2011).",
    simularRenta: (nombre) => `Haz la cuenta de renta corta de ${nombre} con tus supuestos`,
    simular: (nombre) => `Simular la compra de ${nombre}`,
    areaTitulo: "El ingreso que te pide el banco, según el plazo",
    areaLede: "Para el precio desde de cada opción, con crédito en pesos al tope No VIS. A más años, menor cuota y menor ingreso; también más intereses.",
    areaEje: "Plazo del crédito",
    areaAria: (a, b) => `Ingreso mensual del hogar requerido de 5 a 30 años de plazo para ${a} y ${b}.`,
    anios: (n) => `${n} años`,
    verFicha: "Ver la ficha",
    whatsapp: "Hablar con Rafael sobre esta comparación",
    mensajeWhatsapp: (a, b, perfil) => `Hola Rafael, estoy comparando ${a} y ${b} en tu página (para ${perfil.toLowerCase()}). ¿Me ayudas a decidir?`,
    mismaOpcion: "Elige dos opciones distintas.",
    reglaKicker: "Cómo se calcula",
  },
  en: {
    grupos: {
      planos: { titulo: "Off-plan and under construction", nota: "Projects launching or under construction, and apartments under construction." },
      inmediata: { titulo: "Ready to move in", nota: "Completed projects and finished apartments." },
    },
    grupoAria: "What do you want to compare",
    opcionA: "Option A",
    opcionB: "Option B",
    elegir: "Choose an option",
    perfilTitulo: "What is it for?",
    perfiles: {
      inversionista: { titulo: "Invest", nota: "Entry price, delivery, documented short-term rental and documentation weigh most." },
      vivir: { titulo: "Live in", nota: "Bedrooms, outdoor space, parking and shared amenities weigh most." },
      mixto: { titulo: "Both", nota: "A bit of each." },
    },
    criterios: {
      precio: { titulo: "Entry price", regla: "The published starting price, with its cut-off date. The lower of the two scores 100; the other, in proportion." },
      entrega: { titulo: "When you can use it", regla: "Ready to move in, 100. Delivery date published by the source, 60. No published date, 25." },
      rentaCorta: { titulo: "Documented short-term rental", regla: "100 if a written source approves it (today, the developer's); 0 if not." },
      espacio: { titulo: "Bedrooms", regla: "Those of each option's largest unit. The one with more scores 100." },
      exterior: { titulo: "Private outdoor space", regla: "Lot or patio, 100. Terrace, 70. Balcony, 40. It is the best option offered, per the source." },
      parqueadero: { titulo: "Parking", regla: "Private or exclusive use, 100. Not specified, 70. Shared, 40." },
      zonasComunes: { titulo: "Shared amenities", regla: "Those the source lists: pool, gym, courts, playground… The one with more scores 100." },
      informacion: {
        titulo: "Documented information",
        regla: "Out of five facts: publishable price, exact location, area without conflicting sources, delivery and parking. Each is worth 20.",
      },
    },
    sinDato: "No data",
    consultar: "Price on request",
    puntajeKicker: "Score",
    puntajeTitulo: "Which one is closer to what you're looking for?",
    puntajeLede: (perfil) =>
      `Out of 100, for “${perfil}”. It is RHF Living's criterion with visible weights, computed only from documented facts: it doesn't rate the project or promise a return.`,
    sobre100: "out of 100",
    decisivoTitulo: "Deciding factor",
    decisivo: (ganador, criterio) => `${ganador} takes the lead mainly on ${criterio.toLowerCase()}.`,
    contrapeso: (otra, criterio) => `In favor of ${otra}, ${criterio.toLowerCase()} weighs the most.`,
    decisivoSinDato: (ganador, otra, criterio) => `${ganador} takes the lead mainly because ${otra} has no published ${criterio.toLowerCase()}.`,
    empate: "With what is documented, both come out even for this profile.",
    aportesTitulo: "Where each point comes from",
    aportesLede: "Option A adds to the left; option B, to the right. The light band is the most each criterion can give with these weights.",
    posibles: (peso) => `${peso} possible`,
    totalAria: (a, pa, b, pb) => `${a}: ${pa} out of 100. ${b}: ${pb} out of 100.`,
    matrizKicker: "Matrix",
    matrizTitulo: "Point by point",
    filas: {
      precio: "Price",
      precioM2: "Price per m² of the base unit",
      unidades: "Units available",
      area: "Area",
      alcobas: "Bedrooms",
      banos: "Bathrooms",
      exterior: "Outdoor",
      parqueadero: "Parking",
      entrega: "Delivery",
      rentaCorta: "Short-term rental",
      zonas: "What the source lists",
      ubicacion: "Location",
    },
    corte: (fecha) => `Reference price in Colombian pesos as of ${fecha}, subject to availability.`,
    alCorte: (fecha) => `as of ${fecha}`,
    m2Nota: (area, etiqueta) => `Over ${area} (“${etiqueta}”, as the source labels it).`,
    m2SinDato: "Not computed: the sources disagree on the area or there is no publishable price.",
    areaConflicto: "The developer's sources publish different figures.",
    areaPendiente: "With its source's label. That it is the private built area (Law 675, art. 3) is pending the developer's certification, except where the deed states it.",
    rentaSi: (fuente) => `Approved · ${fuente}`,
    rentaNo: "Not documented",
    zonasCuenta: (n) => (n === 1 ? "1 shared amenity" : `${n} shared amenities`),
    cuentan: (n) => `Counted as shared amenities: ${n}. The rest of the list is shown but doesn't add points.`,
    ubicacionSinDato: "The developer doesn't publish the project's location.",
    fuente: "Source",
    columnasTitulo: "The figures, side by side",
    columnas: { precio: "Starting price", cuota: "Minimum down payment with a mortgage", ingreso: "Household income the bank asks for", m2: "Price per m²" },
    columnasNota: (tasa, plazo, limite, financiado) =>
      `Down payment: what the bank doesn't finance with a non-VIS mortgage (up to ${financiado}, Decree 1077 of 2015). Income: the first payment cannot exceed ${limite} of income (Decree 583 of 2025), over ${plazo} at the average rate disbursed for non-VIS peso loans (${tasa}, Financial Superintendence). Your bank may offer a different one.`,
    menor: "Lower",
    escenariosKicker: "Scenarios",
    escenariosTitulo: "Two ways to look at the same decision",
    inversionTitulo: "Scenario 1 · Invest",
    inversionLede: "Entry price, when it can start being used, documented short-term rental and documentation.",
    habitabilidadTitulo: "Scenario 2 · Live in",
    habitabilidadLede: "Bedrooms, outdoor space, parking and shared amenities.",
    queda: (nombre) => `With what is documented, ${nombre} comes out ahead in this scenario.`,
    quedaEmpate: "With what is documented, they come out even in this scenario.",
    cuotaInicial: "Minimum down payment",
    ingreso20: "Household income over 20 years",
    noProyectamos:
      "We don't project rent, returns or appreciation: none of those figures has a source per project today, and what is published is binding (Law 1480 of 2011).",
    simularRenta: (nombre) => `Run the short-term rental numbers for ${nombre} with your assumptions`,
    simular: (nombre) => `Simulate buying ${nombre}`,
    areaTitulo: "The income the bank asks for, by loan term",
    areaLede: "For each option's starting price, with a peso loan at the non-VIS cap. More years means a lower payment and lower income; also more interest.",
    areaEje: "Loan term",
    areaAria: (a, b) => `Monthly household income required for 5 to 30-year terms for ${a} and ${b}.`,
    anios: (n) => `${n} years`,
    verFicha: "View listing",
    whatsapp: "Talk to Rafael about this comparison",
    mensajeWhatsapp: (a, b, perfil) => `Hi Rafael, I'm comparing ${a} and ${b} on your website (to ${perfil.toLowerCase()}). Can you help me decide?`,
    mismaOpcion: "Choose two different options.",
    reglaKicker: "How it's calculated",
  },
};
