/**
 * EL SIMULADOR COMPLETO DE UNA COMPRA
 * ===================================
 *
 * Arma, con las piezas de financiero.ts y compra.ts, todo lo que muestra el
 * tablero para un escenario: cuota inicial en obra, crédito, seguros, ingreso
 * requerido con su indicador legal, gastos de cierre y la línea de tiempo
 * «Tu camino a la escritura». También las pruebas de estrés y la comparación
 * de escenarios.
 *
 * Es rápido a propósito (una tabla de 360 meses es trivial): la página lo
 * vuelve a correr completo en cada movimiento de un deslizador.
 */

import {
  creditoUVR,
  tablaAmortizacion,
  tasaMensual,
  type Abonos,
} from "./financiero.ts";
import {
  aplicarLimites,
  cuotaInicialEnObra,
  estadoLegal,
  gastosDeCierre,
  ingresoRequerido,
  limiteCuotaIngreso,
  type CuotaInicialEnObra,
  type EstadoLegal,
  type GastosCierre,
  type LimitesCredito,
  type Modalidad,
  type TarifasCierre,
} from "./compra.ts";
import type { Aviso } from "./tipos.ts";

export type EntradaSimulador = {
  precio: number;
  modalidad: Modalidad;
  pctFinanciado: number;
  plazoAnios: number;
  /** En pesos y leasing, la tasa efectiva anual. En UVR, la tasa real. */
  tasaEA: number;
  /** UVR: inflación supuesta. */
  inflacionEA: number;
  /** Leasing: opción de compra como fracción del precio. */
  opcionCompra: number;
  esVIS: boolean;
  visSubsidiable?: boolean;
  /** Colombiano en el exterior: plazo máximo menor. */
  exterior?: boolean;
  separacion: number;
  ahorros: number;
  cesantias: number;
  ahorroMensual?: number | null;
  mesesHastaEntrega: number;
  cuotaInicialPctProyecto?: number | null;
  ingresoHogar: number;
  otrasDeudas?: number;
  /** Tasas mensuales de los seguros. null: el escenario no los incluye. */
  seguros: { vidaMensual: number; incendioMensual: number; valorAsegurado?: number } | null;
  abonos?: Abonos;
  estudioTitulosYAvaluo?: number;
};

export type ParametrosSimulador = {
  limites: LimitesCredito;
  tarifas: TarifasCierre;
};

/** Un mes del crédito, igual para pesos, leasing y UVR. */
export type MesCredito = {
  mes: number;
  cuota: number;
  interes: number;
  capital: number;
  seguros: number;
  abono: number;
  saldo: number;
};

/** Un mes de «Tu camino a la escritura». El mes 0 es hoy. */
export type MesCamino = {
  mes: number;
  etapa: "separacion" | "obra" | "entrega" | "credito";
  /** Todo lo que se paga ese mes: separación y aportes, cuota de obra, gastos de cierre, cuota, seguros y abono. */
  pago: number;
  gastosCierre: number;
  abono: number;
  /** Saldo del crédito al cerrar el mes. */
  deuda: number;
  /** Qué parte del precio ya está pagada (0 a 1). */
  propio: number;
};

export type ResultadoSimulador = {
  /** La entrada después de aplicar los límites. */
  entrada: EntradaSimulador;
  avisos: Aviso[];
  obra: CuotaInicialEnObra;
  credito: {
    modalidad: Exclude<Modalidad, "contado">;
    montoFinanciado: number;
    opcionCompra: number;
    /** Primera cuota, sin seguros. */
    cuota: number;
    segurosMes1: number;
    cuotaConSeguros: number;
    totalIntereses: number;
    totalSeguros: number;
    /** Cuotas + seguros + abonos. En leasing no incluye la opción de compra. */
    totalPagado: number;
    mesesPagados: number;
    meses: MesCredito[];
  } | null;
  limiteCuotaIngreso: number;
  ingresoRequerido: number;
  /** Con los seguros del primer mes: referencia conservadora. */
  ingresoRequeridoConSeguros: number;
  estadoLegal: EstadoLegal;
  /** (Primera cuota + otras deudas) ÷ ingreso. Informativo: no hay límite legal para esto. */
  pctIngresoComprometido: number | null;
  gastos: GastosCierre;
  camino: MesCamino[];
  /** Mes del último pago, contado desde hoy. */
  mesUltimoPago: number;
};

export function simularCompra(e: EntradaSimulador, p: ParametrosSimulador): ResultadoSimulador {
  const { entrada: lim, avisos } = aplicarLimites(
    {
      modalidad: e.modalidad,
      precio: e.precio,
      pctFinanciado: e.pctFinanciado,
      plazoAnios: e.plazoAnios,
      esVIS: e.esVIS,
      exterior: e.exterior,
    },
    p.limites,
  );
  const entrada: EntradaSimulador = { ...e, ...lim };

  const obra = cuotaInicialEnObra({
    precio: entrada.precio,
    pctFinanciado: entrada.pctFinanciado,
    cuotaInicialPctProyecto: entrada.cuotaInicialPctProyecto,
    separacion: entrada.separacion,
    ahorros: entrada.ahorros,
    cesantias: entrada.cesantias,
    mesesHastaEntrega: entrada.mesesHastaEntrega,
    ahorroMensual: entrada.ahorroMensual,
  });

  const n = Math.round(entrada.plazoAnios * 12);
  const seguros = entrada.seguros
    ? {
        vidaMensual: entrada.seguros.vidaMensual,
        incendioMensual: entrada.seguros.incendioMensual,
        valorAsegurado: entrada.seguros.valorAsegurado ?? entrada.precio,
      }
    : undefined;

  let credito: ResultadoSimulador["credito"] = null;
  if (entrada.modalidad !== "contado" && obra.montoFinanciado > 0) {
    if (entrada.modalidad === "uvr") {
      const u = creditoUVR({
        monto: obra.montoFinanciado,
        tasaRealEA: entrada.tasaEA,
        inflacionEA: entrada.inflacionEA,
        meses: n,
        seguros,
      });
      const meses = u.filas.map((f) => ({
        mes: f.mes,
        cuota: f.cuota,
        interes: f.interes,
        capital: f.capital,
        seguros: f.seguroVida + f.seguroIncendio,
        abono: 0,
        saldo: f.saldo,
      }));
      const segurosMes1 = meses[0]?.seguros ?? 0;
      credito = {
        modalidad: "uvr",
        montoFinanciado: obra.montoFinanciado,
        opcionCompra: 0,
        cuota: u.primeraCuota,
        segurosMes1,
        cuotaConSeguros: u.primeraCuota + segurosMes1,
        totalIntereses: meses.reduce((s, m) => s + m.interes, 0),
        totalSeguros: u.totalSeguros,
        totalPagado: u.totalPagado + u.totalSeguros,
        mesesPagados: meses.length,
        meses,
      };
    } else {
      const opcionCompra = entrada.modalidad === "leasing" ? entrada.precio * entrada.opcionCompra : 0;
      const t = tablaAmortizacion({
        monto: obra.montoFinanciado,
        i: tasaMensual(entrada.tasaEA),
        meses: n,
        residuo: opcionCompra,
        seguros,
        abonos: entrada.abonos,
      });
      credito = {
        modalidad: entrada.modalidad,
        montoFinanciado: obra.montoFinanciado,
        opcionCompra,
        cuota: t.cuotaInicial,
        segurosMes1: t.segurosMes1,
        cuotaConSeguros: t.cuotaInicial + t.segurosMes1,
        totalIntereses: t.totalIntereses,
        totalSeguros: t.totalSeguros,
        totalPagado: t.totalPagado,
        mesesPagados: t.mesesPagados,
        meses: t.filas.map((f) => ({
          mes: f.mes,
          cuota: f.cuota,
          interes: f.interes,
          capital: f.capital,
          seguros: f.seguroVida + f.seguroIncendio,
          abono: f.abono,
          saldo: f.saldo,
        })),
      };
    }
  }

  const limite = limiteCuotaIngreso(entrada.esVIS, p.limites);
  const cuota = credito?.cuota ?? 0;
  const gastos = gastosDeCierre({
    precio: entrada.precio,
    // En leasing el banco compra: no hay hipoteca. De contado, tampoco.
    montoHipoteca: credito && (credito.modalidad === "pesos" || credito.modalidad === "uvr") ? credito.montoFinanciado : 0,
    esVIS: entrada.esVIS,
    visSubsidiable: entrada.visSubsidiable,
    estudioTitulosYAvaluo: entrada.estudioTitulosYAvaluo,
    tarifas: p.tarifas,
  });

  const camino = caminoALaEscritura(entrada, obra, gastos.total, credito?.meses ?? []);

  return {
    entrada,
    avisos,
    obra,
    credito,
    limiteCuotaIngreso: limite,
    ingresoRequerido: ingresoRequerido(cuota, limite),
    ingresoRequeridoConSeguros: ingresoRequerido(credito?.cuotaConSeguros ?? 0, limite),
    estadoLegal: credito ? estadoLegal(cuota, entrada.ingresoHogar, limite) : "cumple",
    pctIngresoComprometido:
      entrada.ingresoHogar > 0 ? (cuota + (entrada.otrasDeudas ?? 0)) / entrada.ingresoHogar : null,
    gastos,
    camino,
    mesUltimoPago: camino.length ? camino[camino.length - 1].mes : 0,
  };
}

/**
 * «Tu camino a la escritura» (M16): toda la compra mes a mes, desde hoy.
 *
 *  · Mes 0: la separación y lo que se aporta hoy (ahorros y cesantías).
 *    Con entrega inmediata, además, el pendiente de la cuota inicial.
 *  · Meses 1 a N: las cuotas de la obra.
 *  · Mes N: la entrega, con los gastos de escritura y registro.
 *  · Después: las cuotas del crédito, con seguros y abonos.
 */
export function caminoALaEscritura(
  e: EntradaSimulador,
  obra: CuotaInicialEnObra,
  gastosCierre: number,
  meses: MesCredito[],
): MesCamino[] {
  const camino: MesCamino[] = [];
  const mesesObra = Math.max(0, Math.round(e.mesesHastaEntrega));
  const aporteHoy = Math.min(obra.cuotaInicial, e.separacion + e.ahorros + e.cesantias);
  let pagadoCI = aporteHoy + (mesesObra === 0 ? obra.pendiente : 0);
  const propio = (x: number) => (e.precio > 0 ? Math.min(1, x / e.precio) : 0);

  camino.push({
    mes: 0,
    etapa: mesesObra === 0 ? "entrega" : "separacion",
    pago: pagadoCI + (mesesObra === 0 ? gastosCierre : 0),
    gastosCierre: mesesObra === 0 ? gastosCierre : 0,
    abono: 0,
    deuda: mesesObra === 0 ? obra.montoFinanciado : 0,
    propio: propio(pagadoCI),
  });

  for (let m = 1; m <= mesesObra; m++) {
    pagadoCI += obra.pagoMensual;
    const entrega = m === mesesObra;
    camino.push({
      mes: m,
      etapa: entrega ? "entrega" : "obra",
      pago: obra.pagoMensual + (entrega ? gastosCierre : 0),
      gastosCierre: entrega ? gastosCierre : 0,
      abono: 0,
      deuda: entrega ? obra.montoFinanciado : 0,
      propio: propio(pagadoCI),
    });
  }

  for (const c of meses) {
    camino.push({
      mes: mesesObra + c.mes,
      etapa: "credito",
      pago: c.cuota + c.seguros + c.abono,
      gastosCierre: 0,
      abono: c.abono,
      deuda: c.saldo,
      propio: propio(e.precio - c.saldo),
    });
  }
  return camino;
}

// ── Pruebas de estrés (M17) y escenarios comparados (M18) ────────────────

export type Diferencias = {
  cuota: number;
  ingresoRequerido: number;
  totalIntereses: number;
  totalPagado: number;
  mesesPagados: number;
};

/** Cuánto cambia un escenario frente a otro (otro − base). */
export function diferencias(base: ResultadoSimulador, otro: ResultadoSimulador): Diferencias {
  return {
    cuota: (otro.credito?.cuota ?? 0) - (base.credito?.cuota ?? 0),
    ingresoRequerido: otro.ingresoRequerido - base.ingresoRequerido,
    totalIntereses: (otro.credito?.totalIntereses ?? 0) - (base.credito?.totalIntereses ?? 0),
    totalPagado: (otro.credito?.totalPagado ?? 0) - (base.credito?.totalPagado ?? 0),
    mesesPagados: (otro.credito?.mesesPagados ?? 0) - (base.credito?.mesesPagados ?? 0),
  };
}

/**
 * Los botones de estrés: tasa +2 puntos y, en UVR, inflación +2 puntos. El de
 * la TRM (exterior) se calcula con `sensibilidadTRM`, sobre el ingreso.
 */
export function pruebasDeEstres(
  e: EntradaSimulador,
  p: ParametrosSimulador,
  puntos = 0.02,
): { tasa: Diferencias; inflacion: Diferencias | null } {
  const base = simularCompra(e, p);
  return {
    tasa: diferencias(base, simularCompra({ ...e, tasaEA: e.tasaEA + puntos }, p)),
    inflacion: e.modalidad === "uvr" ? diferencias(base, simularCompra({ ...e, inflacionEA: e.inflacionEA + puntos }, p)) : null,
  };
}

export type FilaComparada = {
  clave: "pagoObra" | "cuota" | "ingresoRequerido" | "totalIntereses" | "gastosCierre" | "mesUltimoPago";
  valores: number[];
  /** Posición del mejor (el menor). Empates: el primero. */
  mejor: number;
};

/** Hasta tres escenarios lado a lado, con el mejor de cada fila marcado. */
export function compararEscenarios(escenarios: ResultadoSimulador[]): FilaComparada[] {
  const filas: [FilaComparada["clave"], (r: ResultadoSimulador) => number][] = [
    ["pagoObra", (r) => r.obra.pagoMensual],
    ["cuota", (r) => r.credito?.cuota ?? 0],
    ["ingresoRequerido", (r) => r.ingresoRequerido],
    ["totalIntereses", (r) => r.credito?.totalIntereses ?? 0],
    ["gastosCierre", (r) => r.gastos.total],
    ["mesUltimoPago", (r) => r.mesUltimoPago],
  ];
  return filas.map(([clave, f]) => {
    const valores = escenarios.slice(0, 3).map(f);
    let mejor = 0;
    valores.forEach((v, i) => {
      if (v < valores[mejor]) mejor = i;
    });
    return { clave, valores, mejor };
  });
}
