/**
 * CAPACIDAD DE COMPRA, «PROYECTOS QUE TE ALCANZAN» Y «¿QUÉ MOVER PARA QUE TE
 * ALCANCE?» (M8 y M9)
 * ==========================================================================
 *
 * La pregunta que ningún simulador del mercado responde con la cartera propia:
 * de lo que asesoramos, ¿qué le alcanza a esta persona, y qué le falta para lo
 * demás? Funciones puras; los proyectos llegan de src/data (precio publicable,
 * meses a la entrega y separación), nunca escritos aquí.
 */

import { cuotaFija, cuotaLeasing, tasaMensual } from "./financiero.ts";
import { cuotaInicialEnObra } from "./compra.ts";

/** Lo que la persona dijo de su hogar. */
export type Perfil = {
  /** Ingreso mensual del hogar, con el del codeudor si lo hay. */
  ingresoHogar: number;
  ahorros: number;
  cesantias: number;
  /** Lo que puede ahorrar al mes hasta la entrega. */
  ahorroMensual: number;
};

/** Cómo se financiaría. */
export type Condiciones = {
  modalidad: "pesos" | "uvr" | "leasing";
  pctFinanciado: number;
  /** En pesos y leasing, la tasa efectiva anual. En UVR, la tasa real. */
  tasaEA: number;
  plazoAnios: number;
  /** Leasing: opción de compra como fracción del precio. */
  opcionCompra?: number;
  /** UVR: inflación supuesta, para la primera cuota en pesos. */
  inflacionEA?: number;
  /** Primera cuota máxima frente al ingreso del hogar (hoy 40 %). */
  limiteCuotaIngreso: number;
};

/**
 * Primera cuota (sin seguros) de un inmueble de ese precio.
 * Si el proyecto exige más cuota inicial que la que deja el % financiado, se
 * financia menos.
 */
export function primeraCuota(precio: number, c: Condiciones, cuotaInicialPctProyecto?: number | null): number {
  const pctCI = Math.max(1 - c.pctFinanciado, cuotaInicialPctProyecto ?? 0);
  const financiado = precio * (1 - Math.min(1, pctCI));
  const n = Math.round(c.plazoAnios * 12);
  const i = tasaMensual(c.tasaEA);
  if (c.modalidad === "leasing") return cuotaLeasing(financiado, precio * (c.opcionCompra ?? 0), i, n);
  if (c.modalidad === "uvr") return cuotaFija(financiado, i, n) * Math.pow(1 + (c.inflacionEA ?? 0), 1 / 12);
  return cuotaFija(financiado, i, n);
}

export type Capacidad = {
  cuotaMaxima: number;
  prestamoMaximo: number;
  precioMaxPorCredito: number;
  precioMaxPorCuotaInicial: number;
  precioMaximo: number;
  /** Qué pone el techo: el ingreso (la cuota) o la plata para la cuota inicial. */
  limita: "ingreso" | "cuota inicial";
};

/**
 * «¿Cuánto puedo comprar?»
 *
 *   cuota máxima   = ingreso del hogar × límite legal
 *   precio máximo por crédito = el precio cuya primera cuota es la cuota máxima
 *   precio máximo por cuota inicial = recursos ÷ (1 − % financiado),
 *     con recursos = ahorros + cesantías + ahorro mensual × meses a la entrega
 *   precio máximo = el menor de los dos
 */
export function capacidadDeCompra(p: Perfil, c: Condiciones, mesesHastaEntrega: number): Capacidad {
  const cuotaMaxima = p.ingresoHogar * c.limiteCuotaIngreso;
  // La primera cuota es proporcional al precio: basta con la de un peso.
  const cuotaPorPeso = primeraCuota(1, c);
  const precioMaxPorCredito = cuotaPorPeso > 0 ? cuotaMaxima / cuotaPorPeso : Infinity;
  const recursos = p.ahorros + p.cesantias + p.ahorroMensual * Math.max(0, Math.round(mesesHastaEntrega));
  const pctCI = 1 - c.pctFinanciado;
  const precioMaxPorCuotaInicial = pctCI > 0 ? recursos / pctCI : Infinity;
  const precioMaximo = Math.min(precioMaxPorCredito, precioMaxPorCuotaInicial);
  return {
    cuotaMaxima,
    prestamoMaximo: precioMaxPorCredito * c.pctFinanciado,
    precioMaxPorCredito,
    precioMaxPorCuotaInicial,
    precioMaximo,
    limita: precioMaxPorCredito <= precioMaxPorCuotaInicial ? "ingreso" : "cuota inicial",
  };
}

// ── Proyectos que te alcanzan ────────────────────────────────────────────

/** Un proyecto o inmueble de la cartera, con lo que el simulador necesita. */
export type ItemCartera = {
  slug: string;
  nombre: string;
  tipo: "proyecto" | "inmueble";
  /** Precio desde, solo si se puede publicar (Circular 004). Sin él: «Consultar». */
  precio: number | null;
  /** Meses hasta la entrega. Sin el dato, se usa el supuesto que dé la página. */
  mesesHastaEntrega: number | null;
  separacion?: number | null;
  cuotaInicialPct?: number | null;
};

export type EstadoItem = "alcanza" | "falta-cuota-inicial" | "falta-ingreso" | "faltan-ambos";

export type ResultadoItem = {
  item: ItemCartera;
  estado: EstadoItem;
  precio: number;
  cuota: number;
  ingresoRequerido: number;
  /** Cuánto ingreso mensual falta (0 si alcanza). */
  faltaIngreso: number;
  cuotaInicial: number;
  recursos: number;
  /** Cuánto falta para la cuota inicial (0 si alcanza). */
  faltaCuotaInicial: number;
  /** Pago mensual en obra si alcanza la cuota inicial y hay meses de obra. */
  pagoMensualObra: number | null;
  meses: number;
  /** true si los meses a la entrega no vienen del proyecto sino del supuesto. */
  mesesSupuestos: boolean;
};

/** Evalúa un inmueble de la cartera para este perfil y estas condiciones. */
export function evaluarItem(item: ItemCartera & { precio: number }, p: Perfil, c: Condiciones, mesesPorDefecto: number): ResultadoItem {
  const mesesSupuestos = item.mesesHastaEntrega == null;
  const meses = Math.max(0, Math.round(item.mesesHastaEntrega ?? mesesPorDefecto));
  const cuota = primeraCuota(item.precio, c, item.cuotaInicialPct);
  const ingresoRequerido = cuota / c.limiteCuotaIngreso;
  const faltaIngreso = Math.max(0, ingresoRequerido - p.ingresoHogar);
  const obra = cuotaInicialEnObra({
    precio: item.precio,
    pctFinanciado: c.pctFinanciado,
    cuotaInicialPctProyecto: item.cuotaInicialPct,
    separacion: item.separacion ?? 0,
    ahorros: p.ahorros,
    cesantias: p.cesantias,
    mesesHastaEntrega: meses,
  });
  const recursos = p.ahorros + p.cesantias + p.ahorroMensual * meses;
  // Igual que en la cuota inicial en obra: la separación se paga aparte.
  const faltaCuotaInicial = Math.max(0, obra.cuotaInicial - (item.separacion ?? 0) - recursos);
  const faltaI = faltaIngreso > 0.5;
  const faltaC = faltaCuotaInicial > 0.5;
  return {
    item,
    estado: faltaI && faltaC ? "faltan-ambos" : faltaI ? "falta-ingreso" : faltaC ? "falta-cuota-inicial" : "alcanza",
    precio: item.precio,
    cuota,
    ingresoRequerido,
    faltaIngreso: faltaI ? faltaIngreso : 0,
    cuotaInicial: obra.cuotaInicial,
    recursos,
    faltaCuotaInicial: faltaC ? faltaCuotaInicial : 0,
    pagoMensualObra: !faltaC && meses > 0 ? obra.pagoMensual : null,
    meses,
    mesesSupuestos,
  };
}

/** Faltante en una sola cifra para ordenar: cuota inicial + un año del ingreso que falta. */
function faltanteEquivalente(r: ResultadoItem): number {
  return r.faltaCuotaInicial + 12 * r.faltaIngreso;
}

const RANGO: Record<EstadoItem, number> = {
  alcanza: 0,
  "falta-cuota-inicial": 1,
  "falta-ingreso": 1,
  "faltan-ambos": 2,
};

/**
 * La lista «Proyectos que te alcanzan»: primero los que alcanzan (de menor a
 * mayor precio), luego los que tienen una sola falta y al final los que tienen
 * dos, cada grupo por menor faltante. Lo que no tiene precio publicable va
 * aparte, como «Consultar»: no se evalúa con un precio inventado.
 */
export function proyectosQueAlcanzan(
  items: ItemCartera[],
  p: Perfil,
  c: Condiciones,
  mesesPorDefecto: number,
): { evaluados: ResultadoItem[]; consultar: ItemCartera[] } {
  const evaluados: ResultadoItem[] = [];
  const consultar: ItemCartera[] = [];
  for (const item of items) {
    if (item.precio == null || item.precio <= 0) consultar.push(item);
    else evaluados.push(evaluarItem(item as ItemCartera & { precio: number }, p, c, mesesPorDefecto));
  }
  evaluados.sort((a, b) => {
    const r = RANGO[a.estado] - RANGO[b.estado];
    if (r !== 0) return r;
    if (a.estado === "alcanza") return a.precio - b.precio;
    return faltanteEquivalente(a) - faltanteEquivalente(b);
  });
  return { evaluados, consultar };
}

// ── ¿Qué mover para que te alcance? (M9) ────────────────────────────────

export type NombrePalanca = "plazo" | "leasing" | "financiacion-max" | "codeudor" | "ahorro-adicional" | "unidad-menor";

export type Palanca = {
  palanca: NombrePalanca;
  /** El cambio que se prueba: plazo nuevo, % financiado, ingreso del codeudor… */
  cambio: Record<string, number>;
  /** true si con este cambio ya alcanza. */
  resuelve: boolean;
  resultado: ResultadoItem;
};

/**
 * Prueba las palancas de a una, dentro de los límites, y devuelve las tres que
 * más acercan: primero las que resuelven, después las que dejan menos faltante.
 * Ejemplo del prompt: «Con leasing al 80 % a 20 años te falta solo $9.000.000
 * de cuota inicial».
 */
export function palancas(
  item: ItemCartera & { precio: number },
  p: Perfil,
  c: Condiciones,
  o: {
    mesesPorDefecto: number;
    plazoMaxAnios: number;
    /** Tope legal del crédito hipotecario para este inmueble (70 % No VIS, 80 % VIS). */
    financiacionMaxCredito: number;
    financiacionMaxLeasing: number;
    /** Tasa y opción con las que se prueba el leasing. */
    tasaLeasingEA: number;
    opcionCompraLeasing: number;
    /** Unidades más pequeñas del mismo proyecto, si los datos existen. */
    alternativas?: { nombre: string; precio: number }[];
  },
): Palanca[] {
  const base = evaluarItem(item, p, c, o.mesesPorDefecto);
  if (base.estado === "alcanza") return [];
  const candidatas: Palanca[] = [];
  const probar = (palanca: NombrePalanca, cambio: Record<string, number>, r: ResultadoItem) =>
    candidatas.push({ palanca, cambio, resuelve: r.estado === "alcanza", resultado: r });

  if (c.plazoAnios < o.plazoMaxAnios) {
    probar("plazo", { plazoAnios: o.plazoMaxAnios }, evaluarItem(item, p, { ...c, plazoAnios: o.plazoMaxAnios }, o.mesesPorDefecto));
  }

  if (c.modalidad !== "leasing") {
    // Se prueba al 80 % y al máximo, y queda la versión que más acerca.
    const pcts = [...new Set([Math.min(0.8, o.financiacionMaxLeasing), o.financiacionMaxLeasing])];
    const pruebas = pcts.map((pct) => {
      const cl: Condiciones = { ...c, modalidad: "leasing", pctFinanciado: pct, tasaEA: o.tasaLeasingEA, opcionCompra: o.opcionCompraLeasing };
      return { pct, r: evaluarItem(item, p, cl, o.mesesPorDefecto) };
    });
    pruebas.sort((a, b) => Number(b.r.estado === "alcanza") - Number(a.r.estado === "alcanza") || faltanteEquivalente(a.r) - faltanteEquivalente(b.r));
    probar("leasing", { pctFinanciado: pruebas[0].pct, plazoAnios: c.plazoAnios }, pruebas[0].r);
  }

  if (c.modalidad !== "leasing" && c.pctFinanciado < o.financiacionMaxCredito) {
    probar(
      "financiacion-max",
      { pctFinanciado: o.financiacionMaxCredito },
      evaluarItem(item, p, { ...c, pctFinanciado: o.financiacionMaxCredito }, o.mesesPorDefecto),
    );
  }

  if (base.faltaIngreso > 0) {
    // El codeudor tiene que sumar al menos lo que falta de ingreso.
    const ingresoCodeudor = Math.ceil(base.faltaIngreso);
    probar("codeudor", { ingresoCodeudor }, evaluarItem(item, { ...p, ingresoHogar: p.ingresoHogar + ingresoCodeudor }, c, o.mesesPorDefecto));
  }

  if (base.faltaCuotaInicial > 0 && base.meses > 0) {
    const ahorroExtra = Math.ceil(base.faltaCuotaInicial / base.meses);
    probar("ahorro-adicional", { ahorroMensualExtra: ahorroExtra }, evaluarItem(item, { ...p, ahorroMensual: p.ahorroMensual + ahorroExtra }, c, o.mesesPorDefecto));
  }

  const menor = (o.alternativas ?? []).filter((a) => a.precio < item.precio).sort((a, b) => a.precio - b.precio)[0];
  if (menor) {
    probar("unidad-menor", { precio: menor.precio }, evaluarItem({ ...item, precio: menor.precio }, p, c, o.mesesPorDefecto));
  }

  return candidatas
    .filter((x) => faltanteEquivalente(x.resultado) < faltanteEquivalente(base))
    .sort((a, b) => Number(b.resuelve) - Number(a.resuelve) || faltanteEquivalente(a.resultado) - faltanteEquivalente(b.resultado))
    .slice(0, 3);
}
