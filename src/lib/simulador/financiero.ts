/**
 * EL NÚCLEO FINANCIERO DEL SIMULADOR
 * ==================================
 *
 * Funciones puras, sin dependencias y sin pantalla: reciben números y
 * devuelven números. Todo el simulador (la página, la versión compacta de cada
 * proyecto, el PDF del plan y lo que explica el agente) calcula con esto.
 *
 * Reglas del módulo:
 *  · Se trabaja en pesos con decimales. Se redondea solo al mostrar.
 *  · Ninguna tasa, tope ni tarifa vive aquí: llegan como parámetro. Los
 *    valores vigentes, con su fuente, están en src/data/simulador.config.json.
 *  · Cada fórmula es la de la sección 5 del prompt del simulador (30-sep-2026),
 *    comprobada con un motor independiente antes de escribir este archivo.
 */

/** Tasa mensual equivalente a una efectiva anual: i = (1 + EA)^(1/12) − 1. */
export function tasaMensual(efectivaAnual: number): number {
  return Math.pow(1 + efectivaAnual, 1 / 12) - 1;
}

/**
 * Cuota fija de un crédito en pesos (sistema de amortización francés):
 * C = P · i / (1 − (1 + i)^−n).
 */
export function cuotaFija(monto: number, i: number, meses: number): number {
  if (monto <= 0) return 0;
  if (meses <= 0) return monto;
  if (i === 0) return monto / meses;
  return (monto * i) / (1 - Math.pow(1 + i, -meses));
}

/**
 * Cuota de leasing habitacional con opción de compra B al final:
 * C = (P − B / (1 + i)^n) · i / (1 − (1 + i)^−n).
 * Con B = 0 es la misma cuota fija del crédito.
 */
export function cuotaLeasing(monto: number, opcionCompra: number, i: number, meses: number): number {
  if (monto <= 0) return 0;
  if (meses <= 0) return Math.max(0, monto - opcionCompra);
  if (i === 0) return (monto - opcionCompra) / meses;
  return ((monto - opcionCompra / Math.pow(1 + i, meses)) * i) / (1 - Math.pow(1 + i, -meses));
}

/**
 * Cuánto se puede financiar con una cuota: P = C · (1 − (1 + i)^−n) / i.
 * Es la inversa de `cuotaFija`.
 */
export function montoParaCuota(cuota: number, i: number, meses: number): number {
  if (cuota <= 0 || meses <= 0) return 0;
  if (i === 0) return cuota * meses;
  return (cuota * (1 - Math.pow(1 + i, -meses))) / i;
}

// ── La tabla de amortización ─────────────────────────────────────────────

/**
 * Abonos extraordinarios (M11). Por ley se puede abonar sin penalidad y quien
 * abona elige si baja la cuota o el plazo (Ley 546 de 1999, art. 17, num. 8).
 */
export type Abonos = {
  /** Abono adicional todos los meses, desde `desdeMes`. */
  mensual?: number;
  /** Abono una vez al año (la prima o las cesantías): en `desdeMes`, `desdeMes + 12`… */
  anual?: number;
  /** Mes del primer abono (1 = el mes de la primera cuota). */
  desdeMes: number;
  /** «plazo»: la cuota sigue igual y el crédito se acaba antes. «cuota»: el plazo sigue igual y la cuota baja. */
  reduce: "plazo" | "cuota";
};

/** Seguros obligatorios del crédito (M7), como tasa mensual. */
export type Seguros = {
  /** Vida deudor: tasa mensual sobre el saldo del crédito al empezar el mes. */
  vidaMensual: number;
  /** Incendio y terremoto: tasa mensual sobre el valor asegurado. */
  incendioMensual: number;
  /** Valor asegurado del inmueble (por defecto, su precio). */
  valorAsegurado: number;
};

export type FilaAmortizacion = {
  mes: number;
  /** Interés + capital del mes, sin seguros. */
  cuota: number;
  interes: number;
  capital: number;
  seguroVida: number;
  seguroIncendio: number;
  abono: number;
  /** Saldo después de la cuota y del abono del mes. */
  saldo: number;
  /** Qué parte del monto financiado ya se pagó (0 a 1). */
  pagado: number;
};

export type TablaAmortizacion = {
  filas: FilaAmortizacion[];
  /** Cuota del primer mes, sin seguros. */
  cuotaInicial: number;
  /** Seguros del primer mes. */
  segurosMes1: number;
  totalIntereses: number;
  totalSeguros: number;
  totalAbonos: number;
  /** Todo lo que se paga en cuotas, seguros y abonos (sin la opción de compra). */
  totalPagado: number;
  mesesPagados: number;
};

/** Por debajo de medio peso, un saldo es cero. */
const CENTAVOS = 0.5;

/**
 * La tabla mes a mes de un crédito en pesos o de un leasing.
 *
 * interés = saldo × i; capital = cuota − interés; saldo = saldo − capital.
 * La cuota del último mes ajusta el residuo, así que el saldo termina en cero
 * (o en la opción de compra, en el leasing).
 */
export function tablaAmortizacion(o: {
  monto: number;
  /** Tasa mensual (ver `tasaMensual`). */
  i: number;
  meses: number;
  /** Saldo que queda al final: la opción de compra del leasing. Por defecto, 0. */
  residuo?: number;
  seguros?: Seguros;
  abonos?: Abonos;
}): TablaAmortizacion {
  const residuo = Math.max(0, o.residuo ?? 0);
  const n = Math.max(0, Math.round(o.meses));
  let saldo = Math.max(0, o.monto);
  let cuota = residuo > 0 ? cuotaLeasing(saldo, residuo, o.i, n) : cuotaFija(saldo, o.i, n);
  const cuotaInicial = cuota;
  const filas: FilaAmortizacion[] = [];
  let totalIntereses = 0;
  let totalSeguros = 0;
  let totalAbonos = 0;
  let totalCuotas = 0;

  for (let mes = 1; mes <= n && saldo - residuo > CENTAVOS; mes++) {
    const seguroVida = o.seguros ? saldo * o.seguros.vidaMensual : 0;
    const seguroIncendio = o.seguros ? o.seguros.valorAsegurado * o.seguros.incendioMensual : 0;
    const interes = saldo * o.i;
    let capital = cuota - interes;
    // El último mes (o el mes en que un abono dejó el saldo corto) paga
    // exactamente lo que falta para llegar al residuo.
    if (mes === n || capital > saldo - residuo) capital = saldo - residuo;
    saldo -= capital;

    let abono = 0;
    if (o.abonos && mes >= o.abonos.desdeMes && saldo - residuo > CENTAVOS) {
      if (o.abonos.mensual) abono += o.abonos.mensual;
      if (o.abonos.anual && (mes - o.abonos.desdeMes) % 12 === 0) abono += o.abonos.anual;
      abono = Math.min(abono, saldo - residuo);
      saldo -= abono;
      if (abono > 0 && o.abonos.reduce === "cuota" && saldo - residuo > CENTAVOS && n - mes > 0) {
        cuota = residuo > 0 ? cuotaLeasing(saldo, residuo, o.i, n - mes) : cuotaFija(saldo, o.i, n - mes);
      }
    }

    totalIntereses += interes;
    totalSeguros += seguroVida + seguroIncendio;
    totalAbonos += abono;
    totalCuotas += interes + capital;
    filas.push({
      mes,
      cuota: interes + capital,
      interes,
      capital,
      seguroVida,
      seguroIncendio,
      abono,
      saldo,
      pagado: o.monto > 0 ? (o.monto - saldo) / o.monto : 1,
    });
  }

  return {
    filas,
    cuotaInicial,
    segurosMes1: filas.length ? filas[0].seguroVida + filas[0].seguroIncendio : 0,
    totalIntereses,
    totalSeguros,
    totalAbonos,
    totalPagado: totalCuotas + totalSeguros + totalAbonos,
    mesesPagados: filas.length,
  };
}

/** Intereses pagados en cada año del crédito (para el beneficio tributario). */
export function interesesPorAnio(filas: FilaAmortizacion[]): number[] {
  const anios: number[] = [];
  for (const f of filas) {
    const a = Math.floor((f.mes - 1) / 12);
    anios[a] = (anios[a] ?? 0) + f.interes;
  }
  return anios;
}

/** La tabla agrupada por años, como la muestra la página (expandible por meses). */
export function resumenPorAnio(filas: FilaAmortizacion[]): {
  anio: number;
  cuotas: number;
  interes: number;
  capital: number;
  seguros: number;
  abonos: number;
  saldoFinal: number;
  pagado: number;
}[] {
  const anios: ReturnType<typeof resumenPorAnio> = [];
  for (const f of filas) {
    const a = Math.floor((f.mes - 1) / 12);
    const r = (anios[a] ??= { anio: a + 1, cuotas: 0, interes: 0, capital: 0, seguros: 0, abonos: 0, saldoFinal: 0, pagado: 0 });
    r.cuotas += f.cuota;
    r.interes += f.interes;
    r.capital += f.capital;
    r.seguros += f.seguroVida + f.seguroIncendio;
    r.abonos += f.abono;
    r.saldoFinal = f.saldo;
    r.pagado = f.pagado;
  }
  return anios;
}

// ── Crédito en UVR (M4) ──────────────────────────────────────────────────

export type FilaUVR = {
  mes: number;
  /** Cuota del mes en pesos: sube con la inflación. */
  cuota: number;
  /** Parte de la cuota que es interés real, en pesos del mes. */
  interes: number;
  /** Parte de la cuota que abona al saldo en UVR, en pesos del mes. */
  capital: number;
  /** Saldo en pesos después de la cuota: puede subir los primeros años. */
  saldo: number;
  /** Valor proyectado de la UVR ese mes. */
  uvr: number;
  seguroVida: number;
  seguroIncendio: number;
};

/**
 * Crédito en UVR con cuota constante en UVR.
 *
 *   monto en UVR   P_uvr = P ÷ UVR_hoy
 *   cuota en UVR   C_uvr = P_uvr · i_r / (1 − (1 + i_r)^−n), con la tasa real
 *   cuota en pesos del mes k = C_uvr × UVR_hoy × (1 + inflación)^(k/12)
 *   saldo en pesos del mes k = saldo en UVR × UVR proyectada del mes k
 *
 * La UVR de hoy se cancela en todas las cifras en pesos: solo cambia la que se
 * muestra en UVR. La inflación es un supuesto, y por eso la página muestra
 * tres escenarios.
 */
export function creditoUVR(o: {
  monto: number;
  /** Tasa real efectiva anual (lo que se cobra por encima de la UVR). */
  tasaRealEA: number;
  /** Inflación anual supuesta para proyectar la UVR. */
  inflacionEA: number;
  meses: number;
  /** UVR de hoy. Si no llega, las cifras en pesos no cambian: vale 1. */
  uvrHoy?: number;
  seguros?: Seguros;
}): {
  cuotaUVR: number;
  primeraCuota: number;
  filas: FilaUVR[];
  totalPagado: number;
  totalSeguros: number;
} {
  const uvrHoy = o.uvrHoy && o.uvrHoy > 0 ? o.uvrHoy : 1;
  const ir = tasaMensual(o.tasaRealEA);
  const n = Math.max(0, Math.round(o.meses));
  let saldoUVR = o.monto / uvrHoy;
  const cuotaUVR = cuotaFija(saldoUVR, ir, n);
  const filas: FilaUVR[] = [];
  let totalPagado = 0;
  let totalSeguros = 0;

  for (let k = 1; k <= n; k++) {
    const uvrAntes = uvrHoy * Math.pow(1 + o.inflacionEA, (k - 1) / 12);
    const uvr = uvrHoy * Math.pow(1 + o.inflacionEA, k / 12);
    const seguroVida = o.seguros ? saldoUVR * uvrAntes * o.seguros.vidaMensual : 0;
    const seguroIncendio = o.seguros ? o.seguros.valorAsegurado * o.seguros.incendioMensual : 0;
    const interesUVR = saldoUVR * ir;
    saldoUVR = k === n ? 0 : saldoUVR * (1 + ir) - cuotaUVR;
    const cuota = cuotaUVR * uvr;
    totalPagado += cuota;
    totalSeguros += seguroVida + seguroIncendio;
    filas.push({
      mes: k,
      cuota,
      interes: interesUVR * uvr,
      capital: (cuotaUVR - interesUVR) * uvr,
      saldo: Math.max(0, saldoUVR) * uvr,
      uvr,
      seguroVida,
      seguroIncendio,
    });
  }

  return { cuotaUVR, primeraCuota: filas[0]?.cuota ?? 0, filas, totalPagado, totalSeguros };
}

/** Los tres escenarios de inflación de la página: base, −2 y +2 puntos (nunca bajo cero). */
export function escenariosInflacion(base: number, puntos = 0.02): { nombre: "baja" | "base" | "alta"; inflacion: number }[] {
  return [
    { nombre: "baja", inflacion: Math.max(0, base - puntos) },
    { nombre: "base", inflacion: base },
    { nombre: "alta", inflacion: base + puntos },
  ];
}
