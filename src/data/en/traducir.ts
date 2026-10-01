/**
 * Ayudas para armar los módulos en inglés encima de los de español. No es un
 * módulo de datos: no tiene par en src/data/.
 *
 * La regla de todos los módulos de src/data/en/: los números, precios,
 * fechas ISO, URLs, fotos, coordenadas, slugs e ids salen del español tal
 * cual; el inglés solo reemplaza texto.
 */
import { fechaLarga, mesYAno } from "@/i18n/idioma";

/** Texto en español → su traducción. */
export type Diccionario = Record<string, string>;

/**
 * Un patrón de texto que se traduce solo, con la cifra copiada del español:
 * `[/^Brochure oficial, pág\. (\d+)$/, "Official brochure, p. $1"]`. El patrón
 * cubre el texto entero (^…$) y no lleva la bandera g.
 */
export type Regla = [RegExp, string];

/**
 * La función que traduce los textos de un módulo. Busca el texto exacto en
 * español en el diccionario y, si no está, prueba las reglas.
 *
 * Si nada coincide, devuelve el español tal cual. A propósito: cuando alguien
 * cambia un texto en src/data/ (un precio, una disponibilidad, un corte), la
 * traducción vieja deja de coincidir y la página en inglés muestra el español
 * nuevo hasta que se traduzca. Un texto sin traducir se nota; una traducción
 * vieja afirmaría algo que la fuente ya no dice.
 */
export function traductor(dic: Diccionario, reglas: Regla[] = []): (texto: string) => string {
  return (texto) => {
    if (Object.prototype.hasOwnProperty.call(dic, texto)) return dic[texto];
    for (const [patron, reemplazo] of reglas) {
      if (patron.test(texto)) return texto.replace(patron, reemplazo);
    }
    return texto;
  };
}

/** Las etiquetas de área, iguales en la cartera y en los inmuebles. */
export const ETIQUETAS_AREA: Diccionario = {
  // La etiqueta traducida y la literal de la fuente entre paréntesis
  // (docs/i18n.md): el concepto que cuenta ante la norma es el de la fuente.
  "Área construida": "Built area (área construida)",
  "Área privada construida": "Private built area (área privada construida)",
  "Área Privada construida": "Private built area (Área Privada construida)",
  "Área privada": "Private area (área privada)",
  "Área Total": "Total area (Área Total)",
  "AREA CASA": "House area (AREA CASA)",
  // «Área» a secas dice lo mismo que «Area»: no hace falta el paréntesis.
  "Área": "Area",
};

export const MESES_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const MESES_ES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

const dos = (n: number | string) => String(n).padStart(2, "0");

/**
 * Una fecha escrita en español, en inglés: «12 de agosto de 2026» → «August
 * 12, 2026»; «febrero de 2024» → «February 2024». La cifra sale del texto en
 * español, nunca se escribe a mano. Otro formato (o una fecha que ya está en
 * inglés) sale tal cual.
 */
export function fechaEn(texto: string): string {
  const s = texto.trim();
  const larga = s.match(/^(\d{1,2}) de ([a-záéíóú]+) de (\d{4})$/i);
  if (larga) {
    const mes = MESES_ES.indexOf(larga[2].toLowerCase());
    if (mes >= 0) return fechaLarga(`${larga[3]}-${dos(mes + 1)}-${dos(larga[1])}`, "en");
  }
  const corta = s.match(/^([a-záéíóú]+) de (\d{4})$/i);
  if (corta) {
    const mes = MESES_ES.indexOf(corta[1].toLowerCase());
    if (mes >= 0) return mesYAno(`${corta[2]}-${dos(mes + 1)}`, "en");
  }
  return texto;
}

/**
 * «COP 311,500,000». En inglés el peso va con su código: «$» se leería como
 * dólares (docs/i18n.md). A mano, sin `toLocaleString`, por lo mismo que
 * `formatoPesos`: el build y el navegador tienen que escribir lo mismo.
 */
export function pesos(n: number): string {
  const entero = String(Math.round(n));
  return "COP " + entero.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** Los valores de un registro de textos, traducidos, con las mismas claves. */
export function traducirValores<T extends Record<string, string | undefined>>(
  registro: T,
  t: (texto: string) => string,
): T {
  return Object.fromEntries(
    Object.entries(registro).map(([clave, valor]) => [clave, valor === undefined ? valor : t(valor)]),
  ) as T;
}
