/**
 * EL MOTOR DEL COMPARADOR (/comparar)
 * ===================================
 *
 * Fase 5 del plan de los prompts de Luciano. Pedido de Rafael del 5-oct-2026:
 * un «simulador evaluador» que ponga dos opciones de la cartera lado a lado,
 * las puntúe según el perfil (inversionista, vivir o mixto) y diga qué
 * inclina la balanza.
 *
 * La regla que manda (decisión de Rafael del 5-oct-2026: «solo lo
 * verificado»): ningún criterio usa una cifra que no esté en la capa de
 * datos con su fuente. Por eso aquí NO hay rentabilidad, retorno, flujo de
 * caja ni valorización: ninguna de esas cifras tiene hoy una fuente por
 * proyecto, y «se va a valorizar un X %» es una frase prohibida. Tampoco hay
 * una «calificación de ubicación»: sería una opinión vestida de número.
 *
 * El puntaje es un criterio de RHF Living, con los pesos a la vista: dice qué
 * tan cerca está cada opción de lo que busca la persona, según lo que hoy
 * está documentado. No califica el proyecto.
 *
 * Funciones puras, sin dependencias: las pruebas corren con `node --test`.
 */

export type Perfil = "inversionista" | "vivir" | "mixto";

export type Criterio =
  | "precio"
  | "entrega"
  | "rentaCorta"
  | "espacio"
  | "exterior"
  | "parqueadero"
  | "zonasComunes"
  | "informacion";

export const CRITERIOS: Criterio[] = [
  "precio",
  "entrega",
  "rentaCorta",
  "espacio",
  "exterior",
  "parqueadero",
  "zonasComunes",
  "informacion",
];

/**
 * Los pesos de cada perfil. Suman 100. Si un criterio no tiene dato en
 * ninguna de las dos opciones, sale de la cuenta y los demás se reparten su
 * peso (`pesosEfectivos`).
 */
export const PESOS: Record<Perfil, Record<Criterio, number>> = {
  inversionista: {
    precio: 30,
    entrega: 25,
    rentaCorta: 25,
    espacio: 0,
    exterior: 0,
    parqueadero: 0,
    zonasComunes: 0,
    informacion: 20,
  },
  vivir: {
    precio: 10,
    entrega: 10,
    rentaCorta: 0,
    espacio: 25,
    exterior: 15,
    parqueadero: 15,
    zonasComunes: 15,
    informacion: 10,
  },
  mixto: {
    precio: 20,
    entrega: 15,
    rentaCorta: 10,
    espacio: 15,
    exterior: 10,
    parqueadero: 10,
    zonasComunes: 10,
    informacion: 10,
  },
};

/** Qué criterios cuentan en cada escenario del simulador. */
export const ESCENARIOS: Record<"inversion" | "habitabilidad", Criterio[]> = {
  inversion: ["precio", "entrega", "rentaCorta", "informacion"],
  habitabilidad: ["espacio", "exterior", "parqueadero", "zonasComunes"],
};

export type Exterior = "lote" | "terraza" | "balcon" | "ninguno";
export type Parqueadero = "privado" | "comunal" | "sin-precisar";
export type Entrega = "inmediata" | "con-fecha" | "sin-fecha";

/**
 * Lo que el motor necesita de una opción. Lo arma el servidor desde
 * src/data (src/components/comparar/opciones.ts). `null` = la fuente no lo
 * dice: nunca se reemplaza por un valor supuesto.
 */
export type DatosOpcion = {
  /** Precio desde, solo si es publicable (Circular 004). */
  precio: number | null;
  entrega: Entrega;
  /** Renta corta aprobada con una fuente escrita. */
  rentaCorta: boolean;
  /** Alcobas de la opción más grande, según la fuente. */
  alcobasMax: number | null;
  /** El mejor espacio exterior propio que ofrece, según la fuente. */
  exterior: Exterior | null;
  parqueadero: Parqueadero | null;
  /** Zonas comunes que lista la fuente (piscina, gimnasio, canchas…). */
  zonasComunes: number | null;
  /** Lo que está documentado, de cinco datos. */
  documentado: {
    precio: boolean;
    ubicacion: boolean;
    areaSinConflicto: boolean;
    entrega: boolean;
    parqueadero: boolean;
  };
};

/** El puntaje de un criterio (0 a 100), o null si la opción no tiene el dato. */
export type Nota = number | null;

const ENTREGA: Record<Entrega, number> = { inmediata: 100, "con-fecha": 60, "sin-fecha": 25 };
const EXTERIOR: Record<Exterior, number> = { lote: 100, terraza: 70, balcon: 40, ninguno: 0 };
const PARQUEADERO: Record<Parqueadero, number> = { privado: 100, "sin-precisar": 70, comunal: 40 };

/** Menor es mejor: el menor de los dos vale 100 y el otro, en proporción. */
function menorMejor(x: number | null, otro: number | null): Nota {
  if (x == null || !(x > 0)) return null;
  const min = otro != null && otro > 0 ? Math.min(x, otro) : x;
  return (100 * min) / x;
}

/** Mayor es mejor: el mayor de los dos vale 100 y el otro, en proporción. */
function mayorMejor(x: number | null, otro: number | null): Nota {
  if (x == null) return null;
  const max = Math.max(x, otro ?? 0);
  return max > 0 ? (100 * x) / max : 0;
}

/**
 * Las notas de A y de B en cada criterio. Algunos criterios son absolutos
 * (la entrega, la renta corta, el exterior, el parqueadero, lo documentado)
 * y otros se miden contra la otra opción (el precio, las alcobas, las zonas
 * comunes): por eso se calculan siempre de a dos.
 */
export function notas(a: DatosOpcion, b: DatosOpcion): { a: Record<Criterio, Nota>; b: Record<Criterio, Nota> } {
  const una = (x: DatosOpcion, y: DatosOpcion): Record<Criterio, Nota> => {
    const d = x.documentado;
    const hechos = [d.precio, d.ubicacion, d.areaSinConflicto, d.entrega, d.parqueadero];
    return {
      precio: menorMejor(x.precio, y.precio),
      entrega: ENTREGA[x.entrega],
      rentaCorta: x.rentaCorta ? 100 : 0,
      espacio: mayorMejor(x.alcobasMax, y.alcobasMax),
      exterior: x.exterior == null ? null : EXTERIOR[x.exterior],
      parqueadero: x.parqueadero == null ? null : PARQUEADERO[x.parqueadero],
      zonasComunes: mayorMejor(x.zonasComunes, y.zonasComunes),
      informacion: (100 * hechos.filter(Boolean).length) / hechos.length,
    };
  };
  return { a: una(a, b), b: una(b, a) };
}

/**
 * Los pesos que de verdad cuentan para esta pareja: un criterio sin dato en
 * las dos opciones sale, y los demás se escalan para volver a sumar 100.
 */
export function pesosEfectivos(
  perfil: Perfil,
  na: Record<Criterio, Nota>,
  nb: Record<Criterio, Nota>,
  solo?: Criterio[],
): Record<Criterio, number> {
  const base = PESOS[perfil];
  const cuenta = (c: Criterio) => (solo ? solo.includes(c) : true) && base[c] > 0 && (na[c] != null || nb[c] != null);
  const total = CRITERIOS.filter(cuenta).reduce((s, c) => s + base[c], 0);
  const salida = {} as Record<Criterio, number>;
  for (const c of CRITERIOS) salida[c] = cuenta(c) && total > 0 ? (100 * base[c]) / total : 0;
  return salida;
}

export type Aporte = { criterio: Criterio; peso: number; notaA: Nota; notaB: Nota; puntosA: number; puntosB: number };

export type Resultado = {
  puntajeA: number;
  puntajeB: number;
  aportes: Aporte[];
  /**
   * El criterio que más puntos le saca la ganadora a la otra. null si
   * empatan: un factor decisivo a favor de la que pierde sería un contrasentido.
   */
  decisivo: Aporte | null;
  /** El criterio que más pesa a favor de la que pierde, si lo hay. */
  contrapeso: Aporte | null;
  ganador: "a" | "b" | "empate";
};

/**
 * El puntaje sobre 100 de cada opción para el perfil: la suma de nota × peso.
 * Sin dato, la nota cuenta como cero para esa opción —la falta de información
 * también pesa en una decisión—, y la página lo dice («sin dato»).
 * Con `solo`, el puntaje de un escenario (inversión o habitabilidad).
 */
export function evaluar(a: DatosOpcion, b: DatosOpcion, perfil: Perfil, solo?: Criterio[]): Resultado {
  const n = notas(a, b);
  const pesos = pesosEfectivos(perfil, n.a, n.b, solo);
  const aportes: Aporte[] = CRITERIOS.filter((c) => pesos[c] > 0).map((c) => ({
    criterio: c,
    peso: pesos[c],
    notaA: n.a[c],
    notaB: n.b[c],
    puntosA: ((n.a[c] ?? 0) * pesos[c]) / 100,
    puntosB: ((n.b[c] ?? 0) * pesos[c]) / 100,
  }));
  const puntajeA = aportes.reduce((s, x) => s + x.puntosA, 0);
  const puntajeB = aportes.reduce((s, x) => s + x.puntosB, 0);
  const dif = puntajeA - puntajeB;
  const ganador: Resultado["ganador"] = Math.abs(dif) < 0.5 ? "empate" : dif > 0 ? "a" : "b";
  // Ventaja de la ganadora en cada criterio (positiva: a su favor).
  const ventaja = (x: Aporte) => (ganador === "b" ? x.puntosB - x.puntosA : x.puntosA - x.puntosB);
  const ordenados = [...aportes].sort((x, y) => ventaja(y) - ventaja(x));
  const primero = ordenados[0];
  const ultimo = ordenados[ordenados.length - 1];
  return {
    puntajeA,
    puntajeB,
    aportes,
    decisivo: ganador !== "empate" && primero && ventaja(primero) >= 0.5 ? primero : null,
    contrapeso: ganador !== "empate" && ultimo && ventaja(ultimo) <= -0.5 ? ultimo : null,
    ganador,
  };
}

// ── Lo que se calcula con las reglas vigentes (no con supuestos de retorno) ──

/**
 * Cuota inicial mínima con crédito hipotecario: lo que el banco no financia.
 * Con el tope legal No VIS del 70 %, es el 30 % del precio (Decreto 1077 de
 * 2015, art. 2.1.11.1, lit. a).
 */
export function cuotaInicialMinima(precio: number, financiacionMax: number): number {
  return precio * (1 - financiacionMax);
}

/**
 * Ingreso mensual del hogar que pide la regla del 40 % para la primera cuota
 * (Decreto 583 de 2025), con crédito en pesos a cuota fija y sin seguros. La
 * tasa y el plazo los pone la página, con su etiqueta («Fuente» o «Supuesto»).
 */
export function ingresoRequerido(precio: number, o: { financiado: number; tasaEA: number; plazoAnios: number; limite: number }): number {
  const monto = precio * o.financiado;
  const n = Math.round(o.plazoAnios * 12);
  const i = Math.pow(1 + o.tasaEA, 1 / 12) - 1;
  const cuota = i === 0 ? monto / n : (monto * i) / (1 - Math.pow(1 + i, -n));
  return cuota / o.limite;
}

/** La curva de ingreso requerido de 5 a 30 años (la gráfica de área). */
export function curvaIngreso(
  precio: number,
  o: { financiado: number; tasaEA: number; limite: number; desde?: number; hasta?: number },
): { plazo: number; ingreso: number }[] {
  const salida: { plazo: number; ingreso: number }[] = [];
  for (let plazo = o.desde ?? 5; plazo <= (o.hasta ?? 30); plazo++) {
    salida.push({ plazo, ingreso: ingresoRequerido(precio, { ...o, plazoAnios: plazo }) });
  }
  return salida;
}
