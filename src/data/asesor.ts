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

/**
 * El nombre completo, como Rafael pidió que aparezca en la sección
 * (25-sep-2026). En el resto del sitio la marca sigue siendo «Rafael
 * Hernández Franco».
 */
export const NOMBRE_COMPLETO = "Medardo Rafael Hernández Franco";

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

/**
 * «Por qué asesorarte conmigo»: tres tarjetas. El 25-sep-2026 Rafael pidió
 * esta información «más básica»: un titular y una línea por tarjeta. Ese
 * mismo día, al revisarlas en la vista previa, pidió quitar la marca de
 * propuesta y dejar la web lista: quedan confirmadas tal como las vio.
 */
export const PILARES: Pilar[] = [
  {
    icono: "comparar",
    titulo: "Comparo por ti",
    texto: "Proyectos de varias constructoras, lado a lado.",
    confirmado: true,
  },
  {
    icono: "escudo",
    titulo: "Respaldo jurídico",
    texto: "Nuestro estudio jurídico revisa antes de que firmes.",
    confirmado: true,
  },
  {
    icono: "llave",
    titulo: "Datos con fuente",
    texto: "Cada precio, con su fuente y su fecha de corte.",
    confirmado: true,
  },
];

export type Perfil = Confirmable & {
  id: string;
  titulo: string;
  texto: string;
  /** El mensaje de WhatsApp, ya escrito para ese caso. */
  mensaje: string;
};

/**
 * «Te asesoro si…»: Rafael pidió quitarlo entero el 25-sep-2026. El tipo se
 * conserva para el componente PerfilesAsesor, que ya no se usa.
 */
export const PERFILES: Perfil[] = [];

/**
 * El equipo, para la página /asesor. Solo con los datos que Rafael entregue:
 * nombre, cargo y foto de cada integrante. Mientras falten, la página muestra
 * a Rafael y al estudio jurídico propio (confirmado el 24-sep-2026), y en las
 * vistas previas avisa qué falta.
 */
export type Integrante = Confirmable & {
  nombre: string;
  rol: string;
  foto: string | null;
  texto?: string;
};

export const EQUIPO: Integrante[] = [];
