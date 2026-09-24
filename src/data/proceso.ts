/**
 * EL RESPALDO JURÍDICO Y EL PASO A PASO DE COMPRA — DATOS EDITABLES
 *
 * De aquí salen el bloque «Compras con respaldo jurídico en cada paso» y la
 * línea de tiempo «Cómo comprar con nosotros» de la home.
 *
 * REGLA: cada servicio y cada paso lleva `confirmado`. Lo confirmado se
 * publica; lo que está en `false` solo aparece en las vistas previas de las
 * ramas, marcado como propuesta (ver src/lib/revision.ts). Para publicar uno,
 * se cambia su `confirmado` a `true` después del OK de Rafael.
 *
 * Lo que ya está confirmado: RHF Living tiene estudio jurídico propio (Rafael,
 * 24-sep-2026; nota en el vault). Los servicios, el equipo y los proyectos
 * revisados se describen solo con los datos que él entregue.
 *
 * Palabra que no va en el sitio: «fiducia».
 */

export type Icono =
  | "documento"
  | "escudo"
  | "llave"
  | "conversacion"
  | "pin"
  | "calendario"
  | "edificio"
  | "destello";

export type Servicio = {
  titulo: string;
  texto: string;
  icono: Icono;
  confirmado: boolean;
};

export type Paso = {
  titulo: string;
  texto: string;
  icono: Icono;
  /** Interviene el estudio jurídico: el paso lleva su sello. */
  juridico: boolean;
  confirmado: boolean;
  /** Lo que Rafael tiene que decidir antes de confirmar este paso. */
  pendiente?: string;
};

export const ESTUDIO_JURIDICO = {
  titular: "Compras con respaldo jurídico en cada paso",
  /** Confirmado por Rafael el 24-sep-2026: se publica siempre. */
  base: "RHF Living cuenta con estudio jurídico propio.",
  /** La frase completa describe servicios: espera la confirmación. */
  frase: {
    texto:
      "Contamos con estudio jurídico propio: revisamos el proyecto y los documentos antes de que firmes, y te acompañamos hasta la escritura.",
    confirmado: false,
  },
  servicios: [
    {
      titulo: "Títulos y situación legal",
      texto: "Revisión de títulos y de la situación legal del inmueble.",
      icono: "documento",
      confirmado: false,
    },
    {
      titulo: "Licencias y constructora",
      texto: "Verificación de las licencias del proyecto y de la constructora.",
      icono: "escudo",
      confirmado: false,
    },
    {
      titulo: "Promesa y contratos",
      texto: "Revisión de la promesa de compraventa y de los contratos antes de firmar.",
      icono: "documento",
      confirmado: false,
    },
    {
      titulo: "Escritura y registro",
      texto: "Acompañamiento en la escrituración y el registro del inmueble.",
      icono: "llave",
      confirmado: false,
    },
  ] satisfies Servicio[],
  /**
   * El abogado o abogada responsable. Solo con los datos que Rafael entregue:
   * nombre, tarjeta profesional y, si quiere, foto (en public/).
   */
  responsable: null as null | { nombre: string; tarjetaProfesional: string; foto: string | null },
};

export const PASOS: Paso[] = [
  {
    titulo: "Conversamos",
    texto: "Entendemos qué buscas, para qué —vivir, invertir o rentar— y tu presupuesto.",
    icono: "conversacion",
    juridico: false,
    confirmado: false,
  },
  {
    titulo: "Te mostramos opciones",
    texto: "Seleccionamos los proyectos que encajan contigo y los visitamos juntos.",
    icono: "pin",
    juridico: false,
    confirmado: false,
  },
  {
    titulo: "Revisión jurídica",
    texto: "Nuestro estudio jurídico revisa el proyecto, la constructora y los documentos.",
    icono: "escudo",
    juridico: true,
    confirmado: false,
  },
  {
    titulo: "Separas tu unidad",
    texto: "Firmas la separación y la promesa de compraventa, ya revisadas.",
    icono: "documento",
    juridico: true,
    confirmado: false,
  },
  {
    titulo: "Plan de pagos y financiación",
    texto: "Te ayudamos con la cuota inicial y con el crédito hipotecario o el leasing.",
    icono: "calendario",
    juridico: false,
    confirmado: false,
  },
  {
    titulo: "Seguimiento de obra",
    texto: "Te mantenemos al tanto del avance de la obra hasta la entrega.",
    icono: "edificio",
    juridico: false,
    confirmado: false,
  },
  {
    titulo: "Escritura y registro",
    texto: "Te acompañamos en la notaría y en el registro del inmueble.",
    icono: "llave",
    juridico: true,
    confirmado: false,
  },
  {
    titulo: "Entrega y después",
    texto: "Recibes tu inmueble y, si quieres, te ayudamos con su administración o su arriendo.",
    icono: "destello",
    juridico: false,
    confirmado: false,
    pendiente: "Solo si ofreces administración o arriendo.",
  },
];

/**
 * «¿Compras desde el exterior?» — los pasos adicionales para extranjeros o
 * colombianos en el exterior. Solo con el texto validado por el estudio
 * jurídico; mientras sea null, la nota no aparece.
 */
export const COMPRA_DESDE_EXTERIOR: null | { pasos: string[]; validadoPor: string; fecha: string } = null;

/**
 * Las guías en PDF. Cada botón aparece solo cuando su PDF existe en
 * public/guias/ y su ruta está aquí.
 */
export const GUIAS = {
  compra: { pdf: null as string | null, titulo: "Guía de compra", origen: "guia-compra" },
  zona: { pdf: null as string | null, titulo: "Guía de la zona", origen: "guia-zona" },
};
