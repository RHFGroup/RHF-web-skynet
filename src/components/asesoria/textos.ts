/**
 * Los textos de la página de captación (/asesoria y /en/lets-talk) y de su
 * página de gracias. Pedido de Rafael del 7-oct-2026: «una sección entera
 * para que nos deje sus datos» quien llega de un video de YouTube, «rápido,
 * dinámico y convincente», sin mostrar ni nombrar proyectos.
 *
 * Reglas del copy (vault):
 *  · Lo que se dice de Rafael sale de
 *    projects/inmobiliaria/copy-del-bloque-quien-te-asesora-que-podemos-afirmar-de-rafael:
 *    vive y trabaja en la Zona Norte, asesora proyectos de varias
 *    constructoras y compró en la zona donde asesora. Sin años de
 *    experiencia ni número de operaciones, sin superlativos.
 *  · Primera persona del singular, en afirmativo.
 *  · Sin plazo de respuesta: lo que se publica obliga (Ley 1480), y Rafael
 *    eligió el 7-oct «sin plazo + botón de WhatsApp».
 *  · La autorización es la misma del formulario de contacto (AVISO_VERSION
 *    2026-09-18), palabra por palabra.
 *
 * Lo que viaja al Worker (rótulos del mensaje) va siempre en español, como
 * en ContactForm: Rafael lee los avisos en español.
 */
import type { Idioma } from "@/i18n/idioma";

export type Para = "vivir" | "invertir" | "ambas";
export type Cuando = "ya" | "3-6" | "6-12" | "explorando";
export type Presupuesto = "hasta-300" | "300-500" | "500-800" | "mas-800" | "no-se";

/** Los rótulos que llegan a Rafael en el aviso, siempre en español. */
export const ROTULOS_ES = {
  para: { vivir: "Para vivir", invertir: "Para invertir", ambas: "Para vivir e invertir" } satisfies Record<Para, string>,
  cuando: { ya: "Lo antes posible", "3-6": "En 3 a 6 meses", "6-12": "En 6 a 12 meses", explorando: "Está explorando" } satisfies Record<Cuando, string>,
  presupuesto: {
    "hasta-300": "Hasta $300 millones",
    "300-500": "$300 a $500 millones",
    "500-800": "$500 a $800 millones",
    "mas-800": "Más de $800 millones",
    "no-se": "Aún no lo sabe",
  } satisfies Record<Presupuesto, string>,
};

type Opcion<K extends string> = { valor: K; texto: string; nota?: string };

type Textos = {
  titulo: string;
  descripcion: string;
  kicker: string;
  h1: string;
  lede: string;
  confianza: string[];
  firma: string;
  firmaRol: string;
  alt: string;
  paso: (n: number, de: number) => string;
  atras: string;
  preguntas: {
    para: { titulo: string; opciones: Opcion<Para>[] };
    cuando: { titulo: string; opciones: Opcion<Cuando>[] };
    presupuesto: { titulo: string; nota: string; opciones: Opcion<Presupuesto>[] };
  };
  datosTitulo: string;
  datosLede: string;
  nombre: string;
  nombrePlaceholder: string;
  whatsapp: string;
  whatsappPlaceholder: string;
  whatsappAyuda: string;
  autorizo: string;
  tratar: string;
  conforme: string;
  politica: string;
  derechos: string;
  enviar: string;
  enviando: string;
  faltaNombre: string;
  faltaWhatsapp: string;
  faltaAutorizacion: string;
  fallo: string;
  falloWhatsapp: string;
  comoTitulo: string;
  como: { titulo: string; texto: string }[];
  graciasTitulo: string;
  graciasDescripcion: string;
  listo: (nombre: string) => string;
  listoSinNombre: string;
  recibido: string;
  tuResumen: string;
  escribirYa: string;
  waGracias: (resumen: string) => string;
  waSinResumen: string;
  mientras: string;
  simulador: string;
  simuladorTexto: string;
  redes: string;
  volver: string;
  aviso: string;
  waFallo: (nombre: string, resumen: string) => string;
};

export const TEXTOS: Record<Idioma, Textos> = {
  es: {
    titulo: "Asesoría inmobiliaria en Cartagena | RHF Living",
    descripcion: "Cuéntame qué buscas en tres toques y te escribo por WhatsApp con opciones que encajan con tu presupuesto y tu momento.",
    kicker: "Asesoría inmobiliaria en Cartagena",
    h1: "Cuéntame qué buscas y te escribo con opciones que encajan contigo.",
    lede: "Tres toques y tu WhatsApp. Te respondo yo, con opciones de compra en Cartagena pensadas para tu presupuesto y tu momento.",
    confianza: [
      "Vivo y trabajo en la Zona Norte de Cartagena, y compré donde asesoro.",
      "Asesoro proyectos de varias constructoras: los comparo frente a ti.",
      "Cada precio que te paso lleva su fecha de corte y su fuente.",
    ],
    firma: "Rafael Hernández Franco",
    firmaRol: "Asesor inmobiliario · RHF Living",
    alt: "Rafael Hernández Franco, asesor inmobiliario de RHF Living",
    paso: (n, de) => `Paso ${n} de ${de}`,
    atras: "Atrás",
    preguntas: {
      para: {
        titulo: "¿Para qué buscas?",
        opciones: [
          { valor: "vivir", texto: "Para vivir", nota: "Mi casa o la de mi familia" },
          { valor: "invertir", texto: "Para invertir", nota: "Rentar o hacer crecer mi capital" },
          { valor: "ambas", texto: "Las dos", nota: "Vivir y que también rinda" },
        ],
      },
      cuando: {
        titulo: "¿Para cuándo?",
        opciones: [
          { valor: "ya", texto: "Lo antes posible" },
          { valor: "3-6", texto: "En 3 a 6 meses" },
          { valor: "6-12", texto: "En 6 a 12 meses" },
          { valor: "explorando", texto: "Estoy explorando" },
        ],
      },
      presupuesto: {
        titulo: "¿Con qué presupuesto aproximado?",
        nota: "En pesos colombianos. Sirve para mandarte solo lo que encaja.",
        opciones: [
          { valor: "hasta-300", texto: "Hasta $300 millones" },
          { valor: "300-500", texto: "$300 a $500 millones" },
          { valor: "500-800", texto: "$500 a $800 millones" },
          { valor: "mas-800", texto: "Más de $800 millones" },
          { valor: "no-se", texto: "Aún no lo sé" },
        ],
      },
    },
    datosTitulo: "¿A dónde te escribo?",
    datosLede: "Te escribo por WhatsApp. Nada de llamadas sorpresa.",
    nombre: "Tu nombre",
    nombrePlaceholder: "Nombre y apellido",
    whatsapp: "Tu WhatsApp",
    whatsappPlaceholder: "+57 300 000 0000",
    whatsappAyuda: "Si vives fuera de Colombia, escribe el indicativo de tu país.",
    autorizo: "Autorizo a ",
    tratar: " a tratar mis datos personales para contactarme sobre ",
    conforme: "esta consulta, conforme a la",
    politica: "política de tratamiento de datos",
    derechos: ". Puedo conocer, actualizar, rectificar o suprimir mis datos escribiendo a ",
    enviar: "Quiero que me escribas",
    enviando: "Enviando…",
    faltaNombre: "Escribe tu nombre.",
    faltaWhatsapp: "Escribe un WhatsApp con al menos 7 números.",
    faltaAutorizacion: "Para escribirte necesito tu autorización: marca la casilla.",
    fallo: "No se pudo enviar. Tus respuestas siguen aquí: vuelve a intentarlo o escríbeme directo.",
    falloWhatsapp: "Escribirme por WhatsApp",
    comoTitulo: "Así sigue",
    como: [
      { titulo: "Me cuentas", texto: "Tres toques y tu WhatsApp. Unos 20 segundos." },
      { titulo: "Te escribo", texto: "Por WhatsApp, para entender bien lo que buscas." },
      { titulo: "Te mando opciones", texto: "Las que encajan con tu presupuesto, con precio, fecha de corte y documentos." },
    ],
    graciasTitulo: "Gracias | RHF Living",
    graciasDescripcion: "Recibí tus datos. Te escribo por WhatsApp.",
    listo: (nombre) => `¡Listo, ${nombre}!`,
    listoSinNombre: "¡Listo!",
    recibido: "Recibí tus respuestas. Te escribo por WhatsApp para conocer bien lo que buscas.",
    tuResumen: "Lo que me contaste",
    escribirYa: "Escríbeme ya por WhatsApp",
    waGracias: (resumen) => `Hola Rafael, acabo de dejar mis datos en tu página. ${resumen}`,
    waSinResumen: "Hola Rafael, acabo de dejar mis datos en tu página.",
    mientras: "Mientras tanto",
    simulador: "Calcula cuánto necesitas",
    simuladorTexto: "Tu cuota, el ingreso que te pide el banco y los gastos de escritura.",
    redes: "Sígueme",
    volver: "Ir a rhfliving.com",
    aviso: "Rafael Hernández Franco — asesor inmobiliario independiente. Tus datos se usan solo para responder tu consulta.",
    waFallo: (nombre, resumen) => `Hola Rafael, soy ${nombre || "…"}. ${resumen}`,
  },
  en: {
    titulo: "Real estate advisory in Cartagena | RHF Living",
    descripcion: "Tell me what you're looking for in three taps and I'll message you on WhatsApp with options that fit your budget and timing.",
    kicker: "Real estate advisory in Cartagena",
    h1: "Tell me what you're looking for and I'll send you options that fit.",
    lede: "Three taps and your WhatsApp. I reply personally, with options to buy in Cartagena that fit your budget and your timing.",
    confianza: [
      "I live and work in Cartagena's Zona Norte, and I bought where I advise.",
      "I represent projects from several developers: I compare them with you.",
      "Every price I send you comes with its cut-off date and its source.",
    ],
    firma: "Rafael Hernández Franco",
    firmaRol: "Real estate advisor · RHF Living",
    alt: "Rafael Hernández Franco, real estate advisor at RHF Living",
    paso: (n, de) => `Step ${n} of ${de}`,
    atras: "Back",
    preguntas: {
      para: {
        titulo: "What is it for?",
        opciones: [
          { valor: "vivir", texto: "To live in", nota: "My home or my family's" },
          { valor: "invertir", texto: "To invest", nota: "Rent it out or grow my capital" },
          { valor: "ambas", texto: "Both", nota: "Live in it and have it pay off" },
        ],
      },
      cuando: {
        titulo: "When?",
        opciones: [
          { valor: "ya", texto: "As soon as possible" },
          { valor: "3-6", texto: "In 3 to 6 months" },
          { valor: "6-12", texto: "In 6 to 12 months" },
          { valor: "explorando", texto: "Just exploring" },
        ],
      },
      presupuesto: {
        titulo: "Approximate budget?",
        nota: "In Colombian pesos. It helps me send only what fits.",
        opciones: [
          { valor: "hasta-300", texto: "Up to COP 300M" },
          { valor: "300-500", texto: "COP 300M to 500M" },
          { valor: "500-800", texto: "COP 500M to 800M" },
          { valor: "mas-800", texto: "Over COP 800M" },
          { valor: "no-se", texto: "Not sure yet" },
        ],
      },
    },
    datosTitulo: "Where should I message you?",
    datosLede: "I'll message you on WhatsApp. No surprise calls.",
    nombre: "Your name",
    nombrePlaceholder: "First and last name",
    whatsapp: "Your WhatsApp",
    whatsappPlaceholder: "+1 305 000 0000",
    whatsappAyuda: "Include your country code.",
    autorizo: "I authorize ",
    tratar: " to process my personal data to contact me about ",
    conforme: "this inquiry, in accordance with the",
    politica: "data processing policy",
    derechos: ". I can access, update, correct or delete my data by writing to ",
    enviar: "Message me",
    enviando: "Sending…",
    faltaNombre: "Type your name.",
    faltaWhatsapp: "Type a WhatsApp number with at least 7 digits.",
    faltaAutorizacion: "I need your authorization to message you: tick the box.",
    fallo: "It didn't go through. Your answers are still here: try again or message me directly.",
    falloWhatsapp: "Message me on WhatsApp",
    comoTitulo: "What happens next",
    como: [
      { titulo: "You tell me", texto: "Three taps and your WhatsApp. About 20 seconds." },
      { titulo: "I message you", texto: "On WhatsApp, to understand what you're looking for." },
      { titulo: "I send you options", texto: "The ones that fit your budget, with price, cut-off date and documents." },
    ],
    graciasTitulo: "Thank you | RHF Living",
    graciasDescripcion: "I got your details. I'll message you on WhatsApp.",
    listo: (nombre) => `All set, ${nombre}!`,
    listoSinNombre: "All set!",
    recibido: "I got your answers. I'll message you on WhatsApp to understand what you're looking for.",
    tuResumen: "What you told me",
    escribirYa: "Message me now on WhatsApp",
    waGracias: (resumen) => `Hi Rafael, I just left my details on your website. ${resumen}`,
    waSinResumen: "Hi Rafael, I just left my details on your website.",
    mientras: "Meanwhile",
    simulador: "Work out what you need",
    simuladorTexto: "Your payment, the income the bank asks for and closing costs.",
    redes: "Follow me",
    volver: "Go to rhfliving.com",
    aviso: "Rafael Hernández Franco — independent real estate advisor. Your details are used only to answer your inquiry.",
    waFallo: (nombre, resumen) => `Hi Rafael, this is ${nombre || "…"}. ${resumen}`,
  },
};

/**
 * La versión del texto de autorización y la site key de Turnstile, las mismas
 * de src/components/ContactForm.tsx. Se repiten aquí para que esta página no
 * cargue en el navegador el formulario de contacto ni los datos de la cartera
 * que él importa. Si cambia el texto de la autorización, se cambian los dos.
 */
export const AVISO_VERSION = "2026-09-18";
export const TURNSTILE_SITE_KEY = "0x4AAAAAAE8W_1D4uDCgIB5S";

/** La clave de sessionStorage que une el formulario con la página de gracias. */
export const CLAVE_LEAD = "rhf-asesoria-lead";

/** Lo que la página de gracias necesita: el primer nombre y las tres respuestas, sin el teléfono. */
export type LeadGuardado = { nombre: string; para: Para; cuando: Cuando; presupuesto: Presupuesto; fuente: string; medido?: boolean };
