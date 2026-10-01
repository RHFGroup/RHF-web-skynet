/**
 * LA COMPRA: CUOTA INICIAL EN OBRA, REGLA DE LA CUOTA FRENTE AL INGRESO,
 * GASTOS DE ESCRITURA Y REGISTRO, Y LÍMITES LEGALES
 * =====================================================================
 *
 * Funciones puras. Los topes y las tarifas llegan como parámetro desde
 * src/data/simulador.config.json, donde cada uno tiene su norma y su fecha.
 *
 * Lo que dice la norma vigente, verificado el 30-sep-2026 (detalle y enlaces
 * en la configuración y en la nota del vault):
 *  · Decreto 1077 de 2015, art. 2.1.11.1 — lit. a (Decreto 257 de 2021): el
 *    crédito hipotecario financia hasta el 70 % del inmueble, 80 % en VIS.
 *    Lit. b (Decreto 583 de 2025): la primera cuota no puede pasar del 40 % de
 *    los ingresos familiares, en VIS y en No VIS. El parágrafo extiende el
 *    lit. b al leasing habitacional; el tope del lit. a no aplica al leasing.
 *  · Ley 546 de 1999, art. 17 (num. 3 modificado por la Ley 2079 de 2021):
 *    plazo mínimo de 5 años; el máximo lo fija el Gobierno y no puede ser
 *    inferior a 30. El tope de 30 años del simulador es oferta de mercado.
 *
 * El prompt de Luciano (30-sep-2026) decía «30 % en No VIS» y «entre 5 y 30
 * años por ley»: era el régimen anterior al Decreto 583 de 2025 y a la Ley
 * 2079 de 2021.
 */

import type { Aviso } from "./tipos.ts";

// ── La cuota inicial durante la obra (M2) ────────────────────────────────

export type CuotaInicialEnObra = {
  /** Cuota inicial total. */
  cuotaInicial: number;
  /** Lo que financia el banco: precio − cuota inicial. */
  montoFinanciado: number;
  /** Lo que queda por pagar después de la separación, los ahorros y las cesantías. */
  pendiente: number;
  /** Pago mensual hasta la entrega. Con entrega inmediata es 0 y el pendiente va a la firma. */
  pagoMensual: number;
  /** El pendiente se paga completo a la firma (entrega inmediata). */
  alaFirma: boolean;
  /** Capacidad de ahorro − pago mensual. Positivo: sobra; negativo: falta. Solo si se dio el ahorro. */
  holguraMensual: number | null;
};

/**
 * Cuota inicial pagada durante la obra.
 *
 *   CI = precio × (1 − % financiado), o el % de cuota inicial del proyecto si es mayor
 *   pendiente = CI − separación − ahorros que aporta hoy − cesantías
 *   pago mensual = pendiente ÷ meses hasta la entrega
 *
 * La separación se paga al firmar, aparte de los ahorros que la persona
 * aporta ese día (así lo define el prompt y así dan sus casos de prueba).
 */
export function cuotaInicialEnObra(o: {
  precio: number;
  pctFinanciado: number;
  /** Porcentaje mínimo de cuota inicial que exige el proyecto, si lo define. */
  cuotaInicialPctProyecto?: number | null;
  separacion?: number;
  ahorros?: number;
  cesantias?: number;
  mesesHastaEntrega: number;
  /** Lo que la persona puede ahorrar al mes, si lo dijo. */
  ahorroMensual?: number | null;
}): CuotaInicialEnObra {
  const pctCI = Math.max(1 - o.pctFinanciado, o.cuotaInicialPctProyecto ?? 0);
  const cuotaInicial = o.precio * Math.min(1, Math.max(0, pctCI));
  const pendiente = Math.max(0, cuotaInicial - (o.separacion ?? 0) - (o.ahorros ?? 0) - (o.cesantias ?? 0));
  const meses = Math.max(0, Math.round(o.mesesHastaEntrega));
  const pagoMensual = meses > 0 ? pendiente / meses : 0;
  return {
    cuotaInicial,
    montoFinanciado: o.precio - cuotaInicial,
    pendiente,
    pagoMensual,
    alaFirma: meses === 0,
    holguraMensual: o.ahorroMensual == null || meses === 0 ? null : o.ahorroMensual - pagoMensual,
  };
}

// ── La cuota frente al ingreso (Decreto 1077 de 2015, art. 2.1.11.1, lit. b) ─

/** Ingreso del hogar que exige una cuota: cuota ÷ límite. */
export function ingresoRequerido(cuota: number, limiteCuotaIngreso: number): number {
  return limiteCuotaIngreso > 0 ? cuota / limiteCuotaIngreso : Infinity;
}

export type EstadoLegal = "cumple" | "cerca" | "supera";

/**
 * El indicador del tablero. «Cerca» es el último 10 % antes del límite (con el
 * 40 % vigente, entre 36 % y 40 %).
 */
export function estadoLegal(cuota: number, ingresoHogar: number, limiteCuotaIngreso: number): EstadoLegal {
  if (ingresoHogar <= 0) return "supera";
  const pct = cuota / ingresoHogar;
  if (pct > limiteCuotaIngreso + 1e-12) return "supera";
  if (pct >= limiteCuotaIngreso * 0.9) return "cerca";
  return "cumple";
}

// ── Gastos de escritura y registro (M6) ──────────────────────────────────

/**
 * Tarifas vigentes. Resoluciones de la Superintendencia de Notariado y
 * Registro para 2026: RES-2026-000964-6 (notarial) y RES-2026-001726-6
 * (registro). El impuesto de registro lo fija cada departamento.
 */
export type TarifasCierre = {
  notarial: {
    /** Derechos fijos hasta el umbral: $30.900. */
    base: number;
    /** $259.300. */
    umbral: number;
    /** Tres por mil sobre lo que exceda el umbral. */
    tarifaExceso: number;
    iva: number;
    /** Qué parte de los derechos de la compraventa paga el comprador (costumbre: la mitad). */
    parteComprador: number;
    /** Hipoteca de vivienda con crédito de una entidad del sistema especializado: 70 % de la tarifa (art. 32). */
    factorHipoteca: number;
    /** VIS: la compraventa paga una tarifa única especial (art. 31, par. 3). */
    tarifaUnicaCompraventaVIS: number;
    /** Hipoteca VIS no subsidiable: 40 % de la tarifa; subsidiable: 10 % (art. 33). */
    factorHipotecaVIS: number;
    factorHipotecaVISSubsidiable: number;
  };
  registro: {
    /** Tramos por valor del acto. La tarifa del tramo se aplica al valor TOTAL del acto, no por partes. */
    tramos: { hasta: number | null; fijo?: number; porMil?: number }[];
    /** 2 % sobre el derecho ya calculado, por sistematización y conservación documental (art. 1, par. 8). */
    sistematizacion: number;
    /** Hipoteca de vivienda individual: 70 % de la tarifa (art. 20). */
    factorHipoteca: number;
    /** VIS: la adquisición paga la mitad (art. 17). */
    factorCompraventaVIS: number;
    /** Hipoteca VIS no subsidiable 40 %, subsidiable 10 % (art. 20). */
    factorHipotecaVIS: number;
    factorHipotecaVISSubsidiable: number;
  };
  /** Impuesto de registro departamental, sobre la compraventa y sobre la hipoteca. */
  impuestoRegistro: { compraventa: number; hipoteca: number };
};

/** Derechos notariales de un acto con cuantía, sin IVA. */
export function derechosNotariales(valor: number, t: TarifasCierre["notarial"]): number {
  return t.base + t.tarifaExceso * Math.max(0, valor - t.umbral);
}

/** Derechos de registro de un acto con cuantía, sin el 2 %. */
export function derechosRegistro(valor: number, t: TarifasCierre["registro"]): number {
  for (const tramo of t.tramos) {
    if (tramo.hasta === null || valor <= tramo.hasta) {
      return tramo.fijo ?? (valor * (tramo.porMil ?? 0)) / 1000;
    }
  }
  return 0;
}

export type GastosCierre = {
  notarialCompraventa: number;
  notarialHipoteca: number;
  registroCompraventa: number;
  registroHipoteca: number;
  impuestoRegistroCompraventa: number;
  impuestoRegistroHipoteca: number;
  /** Estudio de títulos y avalúo: los fija cada banco. Lo escribe la persona. */
  estudioTitulosYAvaluo: number;
  total: number;
  /** Total como fracción del precio. */
  pctPrecio: number;
};

/**
 * Lo que le cuesta al comprador escriturar y registrar.
 *
 * Con crédito hipotecario hay dos actos: la compraventa y la hipoteca. En
 * leasing el banco compra el inmueble y no hay hipoteca: aquí se muestra solo la
 * compraventa, y cómo se reparten esos gastos lo define cada entidad. De
 * contado, solo la compraventa.
 *
 * Si el avalúo catastral es mayor que el precio, el registro se liquida sobre
 * el avalúo (RES-2026-001726-6). El simulador usa el precio.
 */
export function gastosDeCierre(o: {
  precio: number;
  /** Monto de la hipoteca. 0 si no hay (leasing o contado). */
  montoHipoteca: number;
  esVIS: boolean;
  /** Hipoteca VIS subsidiable (con subsidio familiar de vivienda). */
  visSubsidiable?: boolean;
  estudioTitulosYAvaluo?: number;
  tarifas: TarifasCierre;
}): GastosCierre {
  const { notarial: n, registro: r, impuestoRegistro: imp } = o.tarifas;
  const conIva = (v: number) => v * (1 + n.iva);
  const conSistematizacion = (v: number) => v * (1 + r.sistematizacion);
  const hayHipoteca = o.montoHipoteca > 0;

  const notarialCompraventa =
    conIva(o.esVIS ? n.tarifaUnicaCompraventaVIS : derechosNotariales(o.precio, n)) * n.parteComprador;
  const factorNotarialHip = o.esVIS
    ? o.visSubsidiable ? n.factorHipotecaVISSubsidiable : n.factorHipotecaVIS
    : n.factorHipoteca;
  const notarialHipoteca = hayHipoteca ? conIva(derechosNotariales(o.montoHipoteca, n) * factorNotarialHip) : 0;

  const registroCompraventa = conSistematizacion(
    derechosRegistro(o.precio, r) * (o.esVIS ? r.factorCompraventaVIS : 1),
  );
  const factorRegistroHip = o.esVIS
    ? o.visSubsidiable ? r.factorHipotecaVISSubsidiable : r.factorHipotecaVIS
    : r.factorHipoteca;
  const registroHipoteca = hayHipoteca ? conSistematizacion(derechosRegistro(o.montoHipoteca, r) * factorRegistroHip) : 0;

  const impuestoRegistroCompraventa = o.precio * imp.compraventa;
  const impuestoRegistroHipoteca = hayHipoteca ? o.montoHipoteca * imp.hipoteca : 0;
  const estudio = Math.max(0, o.estudioTitulosYAvaluo ?? 0);

  const total =
    notarialCompraventa +
    notarialHipoteca +
    registroCompraventa +
    registroHipoteca +
    impuestoRegistroCompraventa +
    impuestoRegistroHipoteca +
    estudio;

  return {
    notarialCompraventa,
    notarialHipoteca,
    registroCompraventa,
    registroHipoteca,
    impuestoRegistroCompraventa,
    impuestoRegistroHipoteca,
    estudioTitulosYAvaluo: estudio,
    total,
    pctPrecio: o.precio > 0 ? total / o.precio : 0,
  };
}

// ── Límites legales y de mercado (T9, T10, T11) ──────────────────────────

export type Modalidad = "pesos" | "uvr" | "leasing" | "contado";

export type LimitesCredito = {
  /** Crédito hipotecario No VIS: 70 %. */
  financiacionMaxNoVIS: number;
  /** Crédito hipotecario VIS: 80 %. */
  financiacionMaxVIS: number;
  /** Leasing: tope de mercado (no hay tope legal). */
  financiacionMaxLeasing: number;
  /** Primera cuota frente al ingreso del hogar: 40 %, VIS y No VIS. */
  cuotaIngresoMaxNoVIS: number;
  cuotaIngresoMaxVIS: number;
  plazoMinAnios: number;
  /** Máximo que ofrecen hoy las entidades. */
  plazoMaxAnios: number;
  /** Colombianos en el exterior (referencia de una entidad). */
  plazoMaxAniosExterior: number;
  /** Tope VIS en pesos para el municipio del inmueble. */
  topeVIS: number;
};

export type EntradaCredito = {
  modalidad: Modalidad;
  precio: number;
  pctFinanciado: number;
  plazoAnios: number;
  esVIS: boolean;
  exterior?: boolean;
};

/** El límite de la cuota frente al ingreso para esta compra. */
export function limiteCuotaIngreso(esVIS: boolean, l: LimitesCredito): number {
  return esVIS ? l.cuotaIngresoMaxVIS : l.cuotaIngresoMaxNoVIS;
}

/**
 * Corrige lo que pase de los límites y dice por qué. Nunca cambia nada en
 * silencio: cada corrección sale en `avisos`, con el valor que había y el nuevo.
 */
export function aplicarLimites(e: EntradaCredito, l: LimitesCredito): { entrada: EntradaCredito; avisos: Aviso[] } {
  const entrada = { ...e };
  const avisos: Aviso[] = [];

  // T11: un precio por encima del tope no puede ser VIS.
  if (entrada.esVIS && entrada.precio > l.topeVIS) {
    entrada.esVIS = false;
    avisos.push({ codigo: "vis-supera-tope", campo: "esVIS", antes: 1, despues: 0, limite: l.topeVIS });
  }

  if (entrada.modalidad === "contado") {
    entrada.pctFinanciado = 0;
    return { entrada, avisos };
  }

  // T9: el crédito hipotecario tiene tope legal; el leasing, tope de mercado.
  const maxFin =
    entrada.modalidad === "leasing"
      ? l.financiacionMaxLeasing
      : entrada.esVIS ? l.financiacionMaxVIS : l.financiacionMaxNoVIS;
  if (entrada.pctFinanciado > maxFin) {
    avisos.push({
      codigo: entrada.modalidad === "leasing" ? "leasing-financiacion-max" : "credito-financiacion-max",
      campo: "pctFinanciado",
      antes: entrada.pctFinanciado,
      despues: maxFin,
      limite: maxFin,
      sugerencia: entrada.modalidad === "leasing" ? undefined : "leasing",
    });
    entrada.pctFinanciado = maxFin;
  }
  if (entrada.pctFinanciado < 0) entrada.pctFinanciado = 0;

  // T10: plazo mínimo legal y máximo de mercado.
  const maxPlazo = entrada.exterior ? Math.min(l.plazoMaxAniosExterior, l.plazoMaxAnios) : l.plazoMaxAnios;
  if (entrada.plazoAnios > maxPlazo) {
    avisos.push({
      codigo: entrada.exterior ? "plazo-max-exterior" : "plazo-max",
      campo: "plazoAnios",
      antes: entrada.plazoAnios,
      despues: maxPlazo,
      limite: maxPlazo,
    });
    entrada.plazoAnios = maxPlazo;
  }
  if (entrada.plazoAnios < l.plazoMinAnios) {
    avisos.push({ codigo: "plazo-min", campo: "plazoAnios", antes: entrada.plazoAnios, despues: l.plazoMinAnios, limite: l.plazoMinAnios });
    entrada.plazoAnios = l.plazoMinAnios;
  }

  return { entrada, avisos };
}
