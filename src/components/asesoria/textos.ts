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
  aviso: string;
  waFallo: (nombre: string, resumen: string) => string;
};

export const TEXTOS: Record<Idioma, Textos> = {
  es: {
    titulo: "Asesoría inmobiliaria en Cartagena | RHF Living",
    descripcion: "Cuéntame qué buscas en tres toques y te escribo por WhatsApp con opciones que encajan con tu presupuesto y tu momento.",
    kicker: "Asesoría inmobiliaria en Cartagena",
    h1: "Cuéntame qué buscas. Te escribo con opciones.",
    lede: "Tres toques y tu WhatsApp. Te respondo yo.",
    confianza: [
      "Vivo y compré en la Zona Norte",
      "Comparo varias constructoras",
      "Precios con fecha y fuente",
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
          { valor: "vivir", texto: "Para vivir" },
          { valor: "invertir", texto: "Para invertir" },
          { valor: "ambas", texto: "Las dos" },
        ],
      },
      cuando: {
        titulo: "¿Para cuándo?",
        opciones: [
          { valor: "ya", texto: "Ya" },
          { valor: "3-6", texto: "3 a 6 meses" },
          { valor: "6-12", texto: "6 a 12 meses" },
          { valor: "explorando", texto: "Solo explorando" },
        ],
      },
      presupuesto: {
        titulo: "¿Tu presupuesto?",
        nota: "Aproximado, en pesos colombianos.",
        opciones: [
          { valor: "hasta-300", texto: "Hasta $300 M" },
          { valor: "300-500", texto: "$300 a $500 M" },
          { valor: "500-800", texto: "$500 a $800 M" },
          { valor: "mas-800", texto: "Más de $800 M" },
          { valor: "no-se", texto: "Aún no lo sé" },
        ],
      },
    },
    datosTitulo: "¿A dónde te escribo?",
    datosLede: "Por WhatsApp. Sin llamadas sorpresa.",
    nombre: "Tu nombre",
    nombrePlaceholder: "Nombre y apellido",
    whatsapp: "Tu WhatsApp",
    whatsappPlaceholder: "+57 300 000 0000",
    whatsappAyuda: "Con indicativo si estás fuera de Colombia.",
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
    graciasTitulo: "Gracias | RHF Living",
    graciasDescripcion: "Recibí tus datos. Te escribo por WhatsApp.",
    listo: (nombre) => `¡Listo, ${nombre}!`,
    listoSinNombre: "¡Listo!",
    recibido: "Te escribo por WhatsApp.",
    tuResumen: "Lo que me contaste",
    escribirYa: "Escríbeme ya por WhatsApp",
    waGracias: (resumen) => `Hola Rafael, acabo de dejar mis datos en tu página. ${resumen}`,
    waSinResumen: "Hola Rafael, acabo de dejar mis datos en tu página.",
    mientras: "Mientras tanto",
    simulador: "Simulador de crédito",
    aviso: "Rafael Hernández Franco — asesor inmobiliario independiente. Tus datos se usan solo para responder tu consulta.",
    waFallo: (nombre, resumen) => `Hola Rafael, soy ${nombre || "…"}. ${resumen}`,
  },
  en: {
    titulo: "Real estate advisory in Cartagena | RHF Living",
    descripcion: "Tell me what you're looking for in three taps and I'll message you on WhatsApp with options that fit your budget and timing.",
    kicker: "Real estate advisory in Cartagena",
    h1: "Tell me what you're looking for. I'll send you options.",
    lede: "Three taps and your WhatsApp. I reply personally.",
    confianza: [
      "I live and bought in the Zona Norte",
      "I compare several developers",
      "Prices with date and source",
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
          { valor: "vivir", texto: "To live in" },
          { valor: "invertir", texto: "To invest" },
          { valor: "ambas", texto: "Both" },
        ],
      },
      cuando: {
        titulo: "When?",
        opciones: [
          { valor: "ya", texto: "Now" },
          { valor: "3-6", texto: "3 to 6 months" },
          { valor: "6-12", texto: "6 to 12 months" },
          { valor: "explorando", texto: "Just exploring" },
        ],
      },
      presupuesto: {
        titulo: "Your budget?",
        nota: "Approximate, in Colombian pesos.",
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
    datosLede: "On WhatsApp. No surprise calls.",
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
    graciasTitulo: "Thank you | RHF Living",
    graciasDescripcion: "I got your details. I'll message you on WhatsApp.",
    listo: (nombre) => `All set, ${nombre}!`,
    listoSinNombre: "All set!",
    recibido: "I'll message you on WhatsApp.",
    tuResumen: "What you told me",
    escribirYa: "Message me now on WhatsApp",
    waGracias: (resumen) => `Hi Rafael, I just left my details on your website. ${resumen}`,
    waSinResumen: "Hi Rafael, I just left my details on your website.",
    mientras: "Meanwhile",
    simulador: "Mortgage simulator",
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
