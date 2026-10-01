/**
 * INVERSIÓN, IMPUESTOS, EXTERIOR Y ARRENDAR O COMPRAR (M12 a M15)
 * ===============================================================
 *
 * Funciones puras. Todo lo que sale de aquí es una ESTIMACIÓN con supuestos
 * visibles: la página lo dice junto a cada cifra («Estimación, no garantía de
 * ingresos»; «Consulta a tu contador»).
 */

// ── Renta corta (M13) ────────────────────────────────────────────────────

export type RentaCorta = {
  tarifaNoche: number;
  nochesMes: number;
  ingresoBruto: number;
  operador: number;
  contribucionTurismo: number;
  fijos: number;
  seguros: number;
  flujoAntesCuota: number;
  flujoDespuesCuota: number;
  /** Ocupación a la que el flujo después de la cuota es cero. null si ni al 100 % alcanza. */
  ocupacionEquilibrio: number | null;
  /** Ingreso bruto anual ÷ precio. */
  rentabilidadBruta: number;
  /** Flujo antes de la cuota, anual, ÷ precio. */
  rentabilidadNeta: number;
  /** Flujo anual después de la cuota ÷ capital propio. null si no se dio el capital. */
  retornoCapital: number | null;
};

/**
 * Solo para inmuebles con renta corta aprobada (reglamento de propiedad
 * horizontal y Registro Nacional de Turismo). Los demás usan renta tradicional.
 *
 *   noches al mes = 365 ÷ 12 × ocupación
 *   ingreso bruto = noches × tarifa por noche (USD × TRM)
 *   gastos        = operador + contribución al turismo (sobre el bruto)
 *                   + administración + predial + servicios + seguros
 */
export function rentaCorta(o: {
  precio: number;
  trm: number;
  tarifaNocheUSD: number;
  ocupacion: number;
  comisionOperador: number;
  /** Contribución parafiscal para el turismo: 2,5 por mil de los ingresos operacionales. */
  contribucionTurismo: number;
  administracion: number;
  predialMensual: number;
  servicios: number;
  /** Seguros del crédito del mes, si se quieren restar. */
  seguros?: number;
  cuotaCredito: number;
  /** Cuota inicial + gastos de cierre + dotación, para el retorno sobre el capital propio. */
  capitalPropio?: number;
}): RentaCorta {
  const tarifaNoche = o.tarifaNocheUSD * o.trm;
  const nochesMes = (365 / 12) * o.ocupacion;
  const ingresoBruto = nochesMes * tarifaNoche;
  const operador = ingresoBruto * o.comisionOperador;
  const contribucionTurismo = ingresoBruto * o.contribucionTurismo;
  const fijos = o.administracion + o.predialMensual + o.servicios;
  const seguros = o.seguros ?? 0;
  const flujoAntesCuota = ingresoBruto - operador - contribucionTurismo - fijos - seguros;
  const flujoDespuesCuota = flujoAntesCuota - o.cuotaCredito;
  const margen = (1 - o.comisionOperador - o.contribucionTurismo) * (365 / 12) * tarifaNoche;
  const equilibrio = margen > 0 ? (fijos + seguros + o.cuotaCredito) / margen : Infinity;
  return {
    tarifaNoche,
    nochesMes,
    ingresoBruto,
    operador,
    contribucionTurismo,
    fijos,
    seguros,
    flujoAntesCuota,
    flujoDespuesCuota,
    ocupacionEquilibrio: equilibrio <= 1 ? Math.max(0, equilibrio) : null,
    rentabilidadBruta: o.precio > 0 ? (ingresoBruto * 12) / o.precio : 0,
    rentabilidadNeta: o.precio > 0 ? (flujoAntesCuota * 12) / o.precio : 0,
    retornoCapital: o.capitalPropio && o.capitalPropio > 0 ? (flujoDespuesCuota * 12) / o.capitalPropio : null,
  };
}

/** Renta tradicional: canon editable, un mes de vacancia al año como supuesto. */
export function rentaTradicional(o: {
  precio: number;
  canon: number;
  administracion: number;
  predialMensual: number;
  mesesVacancia: number;
  seguros?: number;
  cuotaCredito: number;
  capitalPropio?: number;
}): {
  ingresoAnual: number;
  flujoMensualAntesCuota: number;
  flujoMensualDespuesCuota: number;
  rentabilidadBruta: number;
  rentabilidadNeta: number;
  retornoCapital: number | null;
} {
  const ingresoAnual = o.canon * Math.max(0, 12 - o.mesesVacancia);
  const gastosAnuales = (o.administracion + o.predialMensual + (o.seguros ?? 0)) * 12;
  const flujoMensualAntesCuota = (ingresoAnual - gastosAnuales) / 12;
  const flujoMensualDespuesCuota = flujoMensualAntesCuota - o.cuotaCredito;
  return {
    ingresoAnual,
    flujoMensualAntesCuota,
    flujoMensualDespuesCuota,
    rentabilidadBruta: o.precio > 0 ? (o.canon * 12) / o.precio : 0,
    rentabilidadNeta: o.precio > 0 ? (ingresoAnual - gastosAnuales) / o.precio : 0,
    retornoCapital: o.capitalPropio && o.capitalPropio > 0 ? (flujoMensualDespuesCuota * 12) / o.capitalPropio : null,
  };
}

// ── Beneficio tributario (M12) ───────────────────────────────────────────

/**
 * Deducción de intereses de vivienda (Estatuto Tributario, art. 119): hasta
 * 1.200 UVT al año, solo para la vivienda donde vive quien declara. Entra en el
 * tope conjunto del art. 336 (40 % y 1.340 UVT), con las demás rentas exentas
 * y deducciones. El ahorro es una estimación: deducible × tarifa marginal.
 */
export function beneficioTributario(o: {
  interesesAnio: number;
  /** Tarifa marginal de renta que eligió la persona. «No sé» = 0. */
  tarifaMarginal: number;
  uvt: number;
  topeUVT: number;
}): { tope: number; deducible: number; ahorro: number } {
  const tope = o.topeUVT * o.uvt;
  const deducible = Math.min(Math.max(0, o.interesesAnio), tope);
  return { tope, deducible, ahorro: deducible * o.tarifaMarginal };
}

/** Un tramo de la tabla del art. 241 del Estatuto Tributario, en UVT. */
export type TramoRenta = { desdeUVT: number; tarifa: number; /** Impuesto acumulado al empezar el tramo, en UVT. */ baseUVT: number };

/** Tarifa marginal para una renta líquida gravable anual (en pesos). */
export function tarifaMarginal(rentaGravable: number, uvt: number, tabla: TramoRenta[]): number {
  const enUVT = rentaGravable / uvt;
  let tarifa = 0;
  for (const t of tabla) if (enUVT > t.desdeUVT) tarifa = t.tarifa;
  return tarifa;
}

// ── Vivo fuera de Colombia (M14) ─────────────────────────────────────────

/**
 * Cuánto pesa la cuota sobre un ingreso en otra moneda si la TRM cambia.
 * Si el peso se aprecia, la TRM baja, el ingreso en pesos baja y la cuota pesa
 * más.
 */
export function sensibilidadTRM(o: {
  cuota: number;
  /** Ingreso mensual del hogar en la otra moneda. */
  ingresoMonedaExtranjera: number;
  /** Pesos por unidad de esa moneda hoy. */
  tasaCambio: number;
  variaciones?: number[];
}): { variacion: number; tasaCambio: number; ingresoPesos: number; pctCuota: number }[] {
  return (o.variaciones ?? [-0.2, -0.1, 0, 0.1, 0.2]).map((v) => {
    const tasaCambio = o.tasaCambio * (1 + v);
    const ingresoPesos = o.ingresoMonedaExtranjera * tasaCambio;
    return { variacion: v, tasaCambio, ingresoPesos, pctCuota: ingresoPesos > 0 ? o.cuota / ingresoPesos : Infinity };
  });
}

// ── Arrendar o comprar (M15) ─────────────────────────────────────────────

export type AnioArriendoCompra = {
  anio: number;
  /** Salida mensual promedio del año si compra: cuota, seguros y costos del propietario. */
  salidaComprar: number;
  /** Arriendo mensual de ese año. */
  salidaArrendar: number;
  /** Valor estimado del inmueble − saldo de la deuda. */
  patrimonio: number;
  /** Lo que comprar cuesta hasta ese año y no vuelve: intereses, seguros, gastos de cierre, costos del propietario y costo de oportunidad, menos la valorización. */
  costoNetoComprar: number;
  /** Arriendo pagado hasta ese año. */
  arriendoAcumulado: number;
};

/**
 * Año a año: la salida mensual y lo que cada camino cuesta de verdad. Comprar
 * «supera» a arrendar el primer año en que su costo neto acumulado queda por
 * debajo del arriendo acumulado. La cuota inicial y el capital no son costo:
 * se vuelven patrimonio. La valorización y el costo de oportunidad son
 * supuestos editables.
 */
export function arrendarOComprar(o: {
  precio: number;
  cuotaInicial: number;
  gastosCierre: number;
  /** Mes a mes del crédito desde la entrega: cuota, interés, seguros y saldo. */
  credito: { cuota: number; interes: number; seguros: number; saldo: number }[];
  /** Administración + predial mensual del propietario. */
  costosPropietarioMensual: number;
  arriendoMensual: number;
  incrementoArriendo: number;
  valorizacion: number;
  /** Rentabilidad que habría dado la plata de la cuota inicial y los gastos si no se compra. Supuesto; 0 por defecto. */
  rentabilidadAlternativa?: number;
  anios: number;
}): { anios: AnioArriendoCompra[]; anioEnQueComprarSupera: number | null } {
  const resultado: AnioArriendoCompra[] = [];
  let arriendoAcumulado = 0;
  let costosAcumulados = o.gastosCierre;
  let anioCruce: number | null = null;
  for (let a = 1; a <= o.anios; a++) {
    const meses = o.credito.slice((a - 1) * 12, a * 12);
    const arriendo = o.arriendoMensual * Math.pow(1 + o.incrementoArriendo, a - 1);
    arriendoAcumulado += arriendo * 12;
    let salida = 0;
    for (const m of meses) {
      costosAcumulados += m.interes + m.seguros;
      salida += m.cuota + m.seguros;
    }
    costosAcumulados += o.costosPropietarioMensual * 12;
    salida = salida / 12 + o.costosPropietarioMensual;
    const valor = o.precio * Math.pow(1 + o.valorizacion, a);
    // Sin meses de crédito ese año: ya se pagó (o se compró de contado).
    const saldo = meses.length ? meses[meses.length - 1].saldo : 0;
    const oportunidad = (o.cuotaInicial + o.gastosCierre) * (Math.pow(1 + (o.rentabilidadAlternativa ?? 0), a) - 1);
    const costoNetoComprar = costosAcumulados + oportunidad - (valor - o.precio);
    if (anioCruce === null && costoNetoComprar < arriendoAcumulado) anioCruce = a;
    resultado.push({
      anio: a,
      salidaComprar: salida,
      salidaArrendar: arriendo,
      patrimonio: valor - saldo,
      costoNetoComprar,
      arriendoAcumulado,
    });
  }
  return { anios: resultado, anioEnQueComprarSupera: anioCruce };
}
