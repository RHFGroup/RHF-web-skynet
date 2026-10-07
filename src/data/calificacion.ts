/**
 * Las tres preguntas que califican a un comprador desde el primer mensaje
 * (7-oct-2026, pedido de Rafael: «filtrar curiosos» con el presupuesto real,
 * la forma de pago y el objetivo de compra). Decidió que fueran obligatorias,
 * en rangos y con «Aún no lo sé».
 *
 * Una sola fuente para el sitio (el formulario), el Worker (que valida lo que
 * llega) y el CRM (que lo muestra y lo cuenta en el tablero). Lo que viaja y
 * se guarda son los códigos: nunca cambian aunque cambie el texto.
 *
 * Los rangos de presupuesto salen de la cartera publicada en
 * src/data/proyectos.ts (de 172 a 835 millones al 7-oct-2026): los cortes
 * caen entre proyectos, para que el rango ya diga qué mostrarle a la persona.
 */

export type Opcion = { codigo: string; es: string; en: string };

/** «Aún no lo sé»: la respuesta honesta, que también cuenta como respuesta. */
export const NO_SE = "no_se";

export type RangoPresupuesto = Opcion & {
  /** En pesos colombianos. `null` = sin tope por ese lado. */
  desde: number | null;
  hasta: number | null;
};

export const RANGOS_PRESUPUESTO: RangoPresupuesto[] = [
  { codigo: "hasta_250", es: "Menos de 250 millones", en: "Under COP 250M", desde: null, hasta: 250_000_000 },
  { codigo: "250_400", es: "De 250 a 400 millones", en: "COP 250M to 400M", desde: 250_000_000, hasta: 400_000_000 },
  { codigo: "400_600", es: "De 400 a 600 millones", en: "COP 400M to 600M", desde: 400_000_000, hasta: 600_000_000 },
  { codigo: "600_900", es: "De 600 a 900 millones", en: "COP 600M to 900M", desde: 600_000_000, hasta: 900_000_000 },
  { codigo: "mas_900", es: "Más de 900 millones", en: "Over COP 900M", desde: 900_000_000, hasta: null },
  { codigo: NO_SE, es: "Aún no lo sé", en: "Not sure yet", desde: null, hasta: null },
];

export const FORMAS_PAGO: Opcion[] = [
  { codigo: "propios", es: "Recursos propios", en: "Own funds" },
  { codigo: "credito", es: "Crédito hipotecario o leasing", en: "Mortgage or leasing" },
  { codigo: "mixto", es: "Recursos propios y crédito", en: "Own funds plus financing" },
  { codigo: "venta_otro", es: "Con la venta de otro inmueble", en: "Selling another property" },
  { codigo: NO_SE, es: "Aún no lo sé", en: "Not sure yet" },
];

/**
 * Para qué compra. Los códigos son los mismos de `PROPOSITOS` del CRM
 * (crm/src/datos.ts), que además tiene «retiro» para cargarlo a mano.
 */
export const OBJETIVOS: Opcion[] = [
  { codigo: "vivir", es: "Para vivir", en: "To live in" },
  { codigo: "renta_corta", es: "Para renta corta (tipo Airbnb)", en: "Short-term rental (Airbnb-style)" },
  { codigo: "renta_tradicional", es: "Para renta tradicional", en: "Long-term rental" },
  { codigo: "patrimonio", es: "Para invertir y valorizar", en: "Investment and appreciation" },
  { codigo: NO_SE, es: "Aún no lo sé", en: "Not sure yet" },
];

function valida(lista: Opcion[], v: unknown): string | null {
  return typeof v === "string" && lista.some((o) => o.codigo === v) ? v : null;
}

/** El código si es uno de la lista; si no, null (nunca se guarda texto libre). */
export const presupuestoValido = (v: unknown) => valida(RANGOS_PRESUPUESTO, v);
export const formaPagoValida = (v: unknown) => valida(FORMAS_PAGO, v);
export const objetivoValido = (v: unknown) => valida(OBJETIVOS, v);

export function nombreDe(lista: Opcion[], codigo: string | null | undefined, idioma: "es" | "en" = "es"): string {
  const o = lista.find((x) => x.codigo === codigo);
  return o ? o[idioma] : "";
}

/**
 * Un valor de referencia para el tablero (el «pipeline»): el punto medio del
 * rango. En los extremos abiertos se toma el borde que existe. Es una
 * estimación para sumar oportunidades, nunca un precio: el valor real lo pone
 * Rafael en la ficha.
 */
export function valorDeRango(codigo: string | null | undefined): number | null {
  const r = RANGOS_PRESUPUESTO.find((x) => x.codigo === codigo);
  if (!r || (r.desde === null && r.hasta === null)) return null;
  if (r.desde === null) return r.hasta;
  if (r.hasta === null) return r.desde;
  return Math.round((r.desde + r.hasta) / 2);
}

/**
 * El rango que corresponde a un texto libre como «400 a 500 millones» o
 * «USD 150k» (el que manda el agente de atención). Toma los números en
 * millones de pesos y elige el rango donde cae el punto medio. Si no hay
 * números en pesos, null: no se adivina.
 */
export function rangoDeTexto(texto: string | null | undefined): string | null {
  const t = (texto ?? "").toLowerCase().replace(/\./g, "").replace(/,/g, ".");
  if (!t || /us\$|usd|d[oó]lar/.test(t)) return null;
  const numeros = [...t.matchAll(/(\d+(?:\.\d+)?)\s*(mil\s*millones|millones|millón|mill|m\b|mm\b)?/g)]
    .map((m) => {
      const n = Number(m[1]);
      if (!Number.isFinite(n) || n <= 0) return null;
      if (m[2] && /^mil\s*millones$/.test(m[2])) return n * 1_000_000_000;
      if (m[2]) return n * 1_000_000;
      // Sin unidad: «400 a 500 millones» trae la unidad solo al final; un
      // número suelto de 2 a 4 cifras se lee en millones, uno largo en pesos.
      if (n >= 1_000_000) return n;
      return n * 1_000_000;
    })
    .filter((n): n is number => n !== null);
  if (!numeros.length) return null;
  const medio = numeros.length > 1 ? (Math.min(...numeros) + Math.max(...numeros)) / 2 : numeros[0];
  const r = RANGOS_PRESUPUESTO.find(
    (x) => x.codigo !== NO_SE && (x.desde === null || medio >= x.desde) && (x.hasta === null || medio < x.hasta),
  );
  return r?.codigo ?? null;
}

/**
 * ¿Cuántas de las tres respuestas dicen algo? (0 a 3). «Aún no lo sé» no
 * suma: es honesto, pero todavía no califica.
 */
export function respuestasDefinidas(o: {
  presupuesto?: string | null;
  pago?: string | null;
  objetivo?: string | null;
}): number {
  return [o.presupuesto, o.pago, o.objetivo].filter((v) => v && v !== NO_SE).length;
}
