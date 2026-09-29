/**
 * EL RESPALDO JURÍDICO Y EL PASO A PASO DE COMPRA, EN INGLÉS
 *
 * Encima de `src/data/proceso.ts`: `confirmado`, `juridico`, `quien`,
 * `icono` y las rutas de los PDF salen del español. `quien` no se traduce (es
 * la clave del sello de cada paso); su texto lo pone el componente.
 *
 * Los nombres de los documentos colombianos van con el original entre
 * paréntesis la primera vez: son lo que el comprador va a firmar.
 *
 * Cada traducción se busca por el texto exacto en español; si el español
 * cambia, sale el español nuevo hasta que se traduzca aquí.
 */
import * as es from "@/data/proceso";
import type { Paso } from "@/data/proceso";
import { fechaEn, traductor, type Diccionario } from "@/data/en/traducir";

const TEXTOS: Diccionario = {
  // ── El estudio jurídico ──────────────────────────────────────────────────
  "Compras con respaldo jurídico en cada paso": "Purchases with legal support at every step",
  "RHF Living cuenta con estudio jurídico propio.": "RHF Living has its own legal team.",
  "Contamos con estudio jurídico propio: revisamos el proyecto y los documentos antes de que firmes, y te acompañamos hasta la escritura.":
    "We have our own legal team: we review the project and the documents before you sign, and we guide you all the way to the signing of the deed.",
  "Títulos y situación legal": "Title and legal status",
  "Revisión de títulos y de la situación legal del inmueble.": "Review of the property's title and legal status.",
  "Licencias y constructora": "Permits and builder",
  "Verificación de las licencias del proyecto y de la constructora.":
    "Verification of the project's permits and of the builder.",
  "Promesa y contratos": "Purchase agreement and contracts",
  "Revisión de la promesa de compraventa y de los contratos antes de firmar.":
    "Review of the purchase agreement (promesa de compraventa) and the contracts before you sign.",
  "Escritura y registro": "Deed and registration",
  "Acompañamiento en la escrituración y el registro del inmueble.":
    "Support with the deed (escritura pública) and the property's registration.",

  // ── Los pasos ────────────────────────────────────────────────────────────
  "Conversamos": "We talk",
  "Entendemos qué buscas, para qué —vivir, invertir o rentar— y tu presupuesto.":
    "We learn what you are looking for, your goal (living in it, investing or renting it out) and your budget.",
  "Te mostramos opciones": "We show you options",
  "Seleccionamos los proyectos que encajan contigo y los visitamos juntos.":
    "We select the projects that fit you and visit them together.",
  "Revisión jurídica": "Legal review",
  "Nuestro estudio jurídico revisa el proyecto, la constructora y los documentos.":
    "Our legal team reviews the project, the builder and the documents.",
  "Separas tu unidad": "You reserve your unit",
  "Firmas la separación y la promesa de compraventa, ya revisadas.":
    "You sign the reservation and the purchase agreement, both already reviewed.",
  "Plan de pagos y financiación": "Payment plan and financing",
  "Te ayudamos con la cuota inicial y con el crédito hipotecario o el leasing.":
    "We help you with the down payment and with the mortgage or housing lease (leasing habitacional).",
  "Seguimiento de obra": "Construction follow-up",
  "Te mantenemos al tanto del avance de la obra hasta la entrega.":
    "We keep you up to date on construction progress until handover.",
  "Te acompañamos en la notaría y en el registro del inmueble.":
    "We go with you to the notary's office and through the property's registration.",
  "Entrega": "Handover",
  "Recibes tu inmueble y te acompañamos en la entrega.": "You receive your property, and we are with you at the handover.",

  // ── Las guías ────────────────────────────────────────────────────────────
  "Guía de compra": "Buying guide",
  "Guía de la zona": "Area guide",
};

const t = traductor(TEXTOS);

function paso(p: Paso): Paso {
  const x: Paso = { ...p, titulo: t(p.titulo), texto: t(p.texto) };
  if (p.pendiente !== undefined) x.pendiente = t(p.pendiente);
  return x;
}

const exterior = es.COMPRA_DESDE_EXTERIOR;

export const modulo: typeof import("@/data/proceso") = {
  ...es,
  ESTUDIO_JURIDICO: {
    ...es.ESTUDIO_JURIDICO,
    titular: t(es.ESTUDIO_JURIDICO.titular),
    base: t(es.ESTUDIO_JURIDICO.base),
    frase: { ...es.ESTUDIO_JURIDICO.frase, texto: t(es.ESTUDIO_JURIDICO.frase.texto) },
    servicios: es.ESTUDIO_JURIDICO.servicios.map((s) => ({ ...s, titulo: t(s.titulo), texto: t(s.texto) })),
    // El responsable (nombre y tarjeta profesional) es el mismo en los dos idiomas.
  },
  PASOS: es.PASOS.map(paso),
  COMPRA_DESDE_EXTERIOR:
    exterior === null
      ? null
      : { ...exterior, pasos: exterior.pasos.map((x) => t(x)), fecha: fechaEn(exterior.fecha) },
  GUIAS: Object.fromEntries(
    Object.entries(es.GUIAS).map(([clave, guia]) => [clave, { ...guia, titulo: t(guia.titulo) }]),
  ) as typeof es.GUIAS,
};
