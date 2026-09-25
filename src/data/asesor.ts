/**
 * «Quién te asesora», más allá de la biografía (prompt 5, 25-sep-2026): la
 * propuesta de valor, los tres pilares y el «Te asesoro si…».
 *
 * REGLA: todo lleva `confirmado`. Lo propuesto se ve en las vistas previas con
 * la etiqueta «Propuesta · por confirmar» y NO sale en producción hasta que
 * Rafael lo confirme (ver src/lib/revision.ts). Para publicar una pieza, se
 * cambia su `confirmado` a `true` después de su OK.
 *
 * Copy en afirmativo (`rhf-copy-afirmativo` en el vault): los textos del
 * prompt que nombraban lo que falta —«Comparo, no empujo», «con datos, no con
 * promesas»— van reescritos en afirmativo. El original queda anotado al lado.
 *
 * Lo que NO entra aquí hasta que Rafael lo entregue: video de presentación,
 * cifras (familias asesoradas, proyectos, años), testimonios, reseñas,
 * gremios, Instagram, Calendly y tiempo de respuesta. Sin el dato, el bloque
 * no existe: nada de marcadores ni texto de relleno.
 */

export type Confirmable = { confirmado: boolean };

/** La frase grande debajo del nombre. Rafael elige una. */
export const PROPUESTA_VALOR: (Confirmable & { id: "a" | "b"; texto: string })[] = [
  {
    id: "a",
    texto: "Te ayudo a comprar en la Zona Norte con la información completa, antes de separar.",
    confirmado: false,
  },
  {
    // Prompt: «Comparo proyectos de distintas constructoras para que elijas
    // con datos, no con promesas».
    id: "b",
    texto: "Comparo proyectos de distintas constructoras para que elijas con los datos en la mano.",
    confirmado: false,
  },
];

export type Pilar = Confirmable & {
  icono: "comparar" | "escudo" | "llave";
  titulo: string;
  texto: string;
};

/** «Por qué asesorarte conmigo»: tres tarjetas. */
export const PILARES: Pilar[] = [
  {
    // Prompt: «Comparo, no empujo … aunque no sea el primero que te mostré».
    icono: "comparar",
    titulo: "Comparo a tu favor",
    texto:
      "Represento proyectos de varias constructoras y te digo cuál encaja contigo, sea el primero que te mostré o el último.",
    confirmado: false,
  },
  {
    icono: "escudo",
    titulo: "Respaldo jurídico propio",
    texto: "Nuestro estudio jurídico revisa el proyecto y los documentos antes de que firmes.",
    confirmado: false,
  },
  {
    icono: "llave",
    titulo: "Compré aquí",
    texto:
      "Vivo e invertí en la Zona Norte: conozco la decisión desde el lado del comprador. Cada cifra que te doy tiene fuente y fecha.",
    confirmado: false,
  },
];

export type Perfil = Confirmable & {
  id: string;
  titulo: string;
  texto: string;
  /** El mensaje de WhatsApp, ya escrito para ese caso. */
  mensaje: string;
};

/** «Te asesoro si…»: una pestaña por tipo de comprador. */
export const PERFILES: Perfil[] = [
  {
    id: "cartagena",
    titulo: "Vives en Cartagena",
    texto: "Recorremos los proyectos juntos y comparamos en sitio.",
    mensaje: "Hola Rafael, vivo en Cartagena y quiero recorrer contigo proyectos de la Zona Norte.",
    confirmado: false,
  },
  {
    id: "otra-ciudad",
    titulo: "Compras desde otra ciudad",
    texto: "Te muestro los proyectos por videollamada y organizamos tu visita en un solo viaje.",
    mensaje: "Hola Rafael, compro desde otra ciudad y quiero ver proyectos de Cartagena por videollamada.",
    confirmado: false,
  },
  {
    id: "exterior",
    titulo: "Estás en el exterior",
    // Lo de la firma a distancia entra solo con el texto validado por el
    // estudio jurídico.
    texto: "Recorridos en vivo por videollamada y documentos revisados por nuestro estudio jurídico.",
    mensaje: "Hola Rafael, vivo en el exterior y quiero invertir en Cartagena. ¿Me muestras proyectos por videollamada?",
    confirmado: false,
  },
];
