/**
 * Pruebas del motor del simulador: `npm test`.
 *
 * Dos juegos de parámetros:
 *  · LIMITES_PROMPT: los del prompt de Luciano (30-sep-2026), con la regla del
 *    30 % para No VIS. Con ellos el motor debe dar, dentro de ±$1.000, cada
 *    resultado esperado de su sección 11. Así se prueba la aritmética.
 *  · Los VIGENTES, de src/data/simulador.config.json: 40 % para VIS y No VIS
 *    desde el Decreto 583 de 2025. Son los que usa la página, y cambian el
 *    ingreso requerido, la capacidad de compra y quién alcanza qué.
 *
 * Dos definiciones que el prompt dejaba implícitas y aquí van explícitas:
 * T5c y T7 usan leasing con opción de compra del 0 %, y T7 no resta seguros.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  cuotaFija,
  cuotaLeasing,
  creditoUVR,
  interesesPorAnio,
  montoParaCuota,
  tablaAmortizacion,
  tasaMensual,
} from "./financiero.ts";
import {
  aplicarLimites,
  cuotaInicialEnObra,
  derechosRegistro,
  estadoLegal,
  gastosDeCierre,
  ingresoRequerido,
  type LimitesCredito,
} from "./compra.ts";
import { capacidadDeCompra, evaluarItem, palancas, proyectosQueAlcanzan, type Condiciones, type ItemCartera, type Perfil } from "./cartera.ts";
import { arrendarOComprar, beneficioTributario, rentaCorta, sensibilidadTRM, tarifaMarginal } from "./inversion.ts";
import { compararEscenarios, pruebasDeEstres, simularCompra, type EntradaSimulador } from "./simular.ts";
import { etiquetaDe, limitesDesdeConfig, porActualizar, tarifasDesdeConfig, validarConfig, type ConfigSimulador } from "./config.ts";

const CONFIG = JSON.parse(
  readFileSync(new URL("../../data/simulador.config.json", import.meta.url), "utf8"),
) as ConfigSimulador;
const VIGENTES = limitesDesdeConfig(CONFIG);
const TARIFAS = tarifasDesdeConfig(CONFIG);
const LIMITES_PROMPT: LimitesCredito = { ...VIGENTES, cuotaIngresoMaxNoVIS: 0.3, cuotaIngresoMaxVIS: 0.4 };

const EA = 0.1471;
const I = tasaMensual(EA);
const SEGUROS = { vidaMensual: 0.000412, incendioMensual: 0.000099 };

/** ±$1.000, como piden los casos de prueba. */
function cerca(real: number, esperado: number, tolerancia = 1000, que = "") {
  assert.ok(
    Math.abs(real - esperado) <= tolerancia,
    `${que}: dio ${real.toFixed(2)}, se esperaba ${esperado} (±${tolerancia})`,
  );
}

/** La entrada de T1: Doral Country a $311.500.000, crédito al 70 % a 20 años. */
function entradaT1(extra: Partial<EntradaSimulador> = {}): EntradaSimulador {
  return {
    precio: 311_500_000,
    modalidad: "pesos",
    pctFinanciado: 0.7,
    plazoAnios: 20,
    tasaEA: EA,
    inflacionEA: 0.0624,
    opcionCompra: 0,
    esVIS: false,
    separacion: 2_000_000,
    ahorros: 0,
    cesantias: 0,
    mesesHastaEntrega: 18,
    ingresoHogar: 10_000_000,
    seguros: SEGUROS,
    ...extra,
  };
}

describe("T1 · crédito en pesos", () => {
  const r = simularCompra(entradaT1(), { limites: LIMITES_PROMPT, tarifas: TARIFAS });
  test("cuota inicial en obra", () => {
    cerca(r.obra.montoFinanciado, 218_050_000, 1, "financiado");
    cerca(r.obra.cuotaInicial, 93_450_000, 1, "cuota inicial");
    cerca(r.obra.pagoMensual, 5_080_556, 1000, "pago en obra");
  });
  test("cuota, seguros e ingreso requerido (regla del prompt: 30 %)", () => {
    assert.ok(r.credito);
    cerca(r.credito.cuota, 2_680_273, 1000, "cuota");
    cerca(r.ingresoRequerido, 8_934_242, 1000, "ingreso requerido");
    cerca(r.credito.segurosMes1, 120_675, 1000, "seguros mes 1");
    cerca(r.credito.cuotaConSeguros, 2_800_948, 1000, "cuota con seguros");
    cerca(r.ingresoRequeridoConSeguros, 9_336_493, 1000, "ingreso con seguros");
  });
  test("intereses", () => {
    assert.ok(r.credito);
    cerca(r.credito.totalIntereses, 425_215_460, 1000, "intereses totales");
    const t = tablaAmortizacion({ monto: 218_050_000, i: I, meses: 240 });
    cerca(interesesPorAnio(t.filas)[0], 29_960_396, 1000, "intereses año 1");
  });
  test("con la regla vigente (40 %) el ingreso requerido baja", () => {
    const v = simularCompra(entradaT1(), { limites: VIGENTES, tarifas: TARIFAS });
    cerca(v.ingresoRequerido, 6_700_683, 1000, "ingreso requerido vigente");
    cerca(v.ingresoRequeridoConSeguros, 7_002_370, 1000, "ingreso con seguros vigente");
    assert.equal(v.estadoLegal, "cumple");
  });
});

describe("T2 · leasing", () => {
  const P = 295_000_000 * 0.8;
  const n = 180;
  test("opción de compra del 10 %", () => {
    const c = cuotaLeasing(P, 29_500_000, I, n);
    cerca(c, 3_062_007, 1000, "cuota");
    cerca(ingresoRequerido(c, 0.3), 10_206_691, 1000, "ingreso requerido (prompt)");
    cerca(ingresoRequerido(c, 0.4), 7_655_018, 1000, "ingreso requerido (vigente)");
  });
  test("opción de compra del 0 %", () => {
    cerca(cuotaLeasing(P, 0, I, n), 3_111_653, 1000, "cuota");
  });
  test("el saldo termina en la opción de compra", () => {
    const t = tablaAmortizacion({ monto: P, i: I, meses: n, residuo: 29_500_000 });
    cerca(t.filas[t.filas.length - 1].saldo, 29_500_000, 1, "saldo final");
    assert.equal(t.mesesPagados, n);
  });
});

describe("T3 · crédito en UVR", () => {
  const u = creditoUVR({ monto: 218_050_000, tasaRealEA: 0.075, inflacionEA: 0.0624, meses: 240, uvrHoy: 418.8527 });
  const cuota = (k: number) => u.filas[k - 1].cuota;
  test("cuotas que suben con la inflación", () => {
    cerca(cuota(1), 1_732_648, 1000, "mes 1");
    cerca(cuota(13), 1_840_766, 1000, "mes 13");
    cerca(cuota(61), 2_345_043, 1000, "mes 61");
    cerca(cuota(240), 5_784_702, 1000, "mes 240");
    cerca(ingresoRequerido(cuota(1), 0.3), 5_775_494, 1000, "ingreso requerido mes 1 (prompt)");
    cerca(ingresoRequerido(cuota(1), 0.4), 4_331_620, 1000, "ingreso requerido mes 1 (vigente)");
  });
  test("el saldo en pesos sube los primeros años", () => {
    cerca(u.filas[11].saldo, 226_306_868, 1000, "saldo mes 12");
    cerca(u.filas[59].saldo, 255_534_685, 1000, "saldo mes 60");
    assert.ok(u.filas[59].saldo > 218_050_000);
    cerca(u.filas[239].saldo, 0, 1, "saldo final");
  });
  test("total pagado nominal", () => {
    cerca(u.totalPagado, 807_068_539, 1000, "total");
  });
  test("la UVR de hoy no cambia las cifras en pesos", () => {
    const sinUVR = creditoUVR({ monto: 218_050_000, tasaRealEA: 0.075, inflacionEA: 0.0624, meses: 240 });
    cerca(sinUVR.primeraCuota, u.primeraCuota, 0.01, "primera cuota");
  });
});

describe("T4 · abonos", () => {
  test("abono anual de $5.000.000 desde el mes 12, reduciendo el plazo", () => {
    const base = tablaAmortizacion({ monto: 218_050_000, i: I, meses: 240 });
    const con = tablaAmortizacion({
      monto: 218_050_000,
      i: I,
      meses: 240,
      abonos: { anual: 5_000_000, desdeMes: 12, reduce: "plazo" },
    });
    assert.equal(con.mesesPagados, 149);
    assert.equal(base.mesesPagados - con.mesesPagados, 91);
    cerca(base.totalIntereses, 425_215_460, 1000, "intereses sin abonos");
    cerca(con.totalIntereses, 241_208_901, 1000, "intereses con abonos");
    cerca(base.totalIntereses - con.totalIntereses, 184_006_559, 1000, "ahorro");
  });
  test("reduciendo la cuota, el plazo no cambia y la cuota baja", () => {
    const con = tablaAmortizacion({
      monto: 218_050_000,
      i: I,
      meses: 240,
      abonos: { anual: 5_000_000, desdeMes: 12, reduce: "cuota" },
    });
    assert.equal(con.mesesPagados, 240);
    assert.ok(con.filas[12].cuota < con.filas[0].cuota);
  });
});

/** El perfil de T5. */
const PERFIL: Perfil = { ingresoHogar: 10_000_000, ahorros: 40_000_000, cesantias: 10_000_000, ahorroMensual: 3_000_000 };
const credito = (limite: number): Condiciones => ({ modalidad: "pesos", pctFinanciado: 0.7, tasaEA: EA, plazoAnios: 20, limiteCuotaIngreso: limite });

describe("T5 · capacidad de compra", () => {
  test("con la regla del prompt (30 %)", () => {
    const c = capacidadDeCompra(PERFIL, credito(0.3), 18);
    cerca(c.cuotaMaxima, 3_000_000, 1, "cuota máxima");
    cerca(c.prestamoMaximo, 244_060_982, 1000, "préstamo máximo");
    cerca(c.precioMaxPorCredito, 348_658_546, 1000, "precio máximo por crédito");
    cerca(c.precioMaxPorCuotaInicial, 346_666_667, 1000, "precio máximo por cuota inicial");
    cerca(c.precioMaximo, 346_666_667, 1000, "precio máximo");
    assert.equal(c.limita, "cuota inicial");
  });
  test("con la regla vigente (40 %)", () => {
    const c = capacidadDeCompra(PERFIL, credito(0.4), 18);
    cerca(c.cuotaMaxima, 4_000_000, 1, "cuota máxima");
    cerca(c.prestamoMaximo, 325_414_643, 1000, "préstamo máximo");
    cerca(c.precioMaxPorCredito, 464_878_061, 1000, "precio máximo por crédito");
    cerca(c.precioMaximo, 346_666_667, 1000, "precio máximo");
    assert.equal(c.limita, "cuota inicial");
  });
  test("montoParaCuota es la inversa de cuotaFija", () => {
    cerca(montoParaCuota(cuotaFija(200_000_000, I, 240), I, 240), 200_000_000, 1, "inversa");
  });
});

/** La cartera de T5b, con los meses a la entrega de prueba (no son datos reales). */
const CARTERA: ItemCartera[] = [
  { slug: "doral-suite", nombre: "Doral Suite", tipo: "proyecto", precio: 295_000_000, mesesHastaEntrega: 0, separacion: 0 },
  { slug: "doral-suites-320", nombre: "Doral Suites 320", tipo: "inmueble", precio: 330_000_000, mesesHastaEntrega: 0, separacion: 0 },
  { slug: "doral-country", nombre: "Doral Country", tipo: "proyecto", precio: 311_500_000, mesesHastaEntrega: 18, separacion: 0 },
  { slug: "blue-garden", nombre: "Blue Garden", tipo: "proyecto", precio: 403_000_000, mesesHastaEntrega: 12, separacion: 0 },
  { slug: "doral-west", nombre: "Doral West", tipo: "proyecto", precio: 525_000_000, mesesHastaEntrega: 24, separacion: 0 },
  { slug: "cavana-303", nombre: "Cavana 303", tipo: "inmueble", precio: 1_280_000_000, mesesHastaEntrega: 0, separacion: 0 },
  { slug: "acacias-campestre", nombre: "Acacias Campestre", tipo: "proyecto", precio: null, mesesHastaEntrega: null },
];

describe("T5b · proyectos que te alcanzan", () => {
  test("con la regla del prompt (30 %)", () => {
    const { evaluados, consultar } = proyectosQueAlcanzan(CARTERA, PERFIL, credito(0.3), 18);
    const de = (slug: string) => evaluados.find((e) => e.item.slug === slug)!;
    assert.equal(de("doral-country").estado, "alcanza");
    cerca(de("doral-country").pagoMensualObra ?? 0, 2_413_889, 1000, "Doral Country: pago en obra");
    assert.equal(de("doral-suite").estado, "falta-cuota-inicial");
    cerca(de("doral-suite").faltaCuotaInicial, 38_500_000, 1, "Doral Suite");
    assert.equal(de("doral-suites-320").estado, "falta-cuota-inicial");
    cerca(de("doral-suites-320").faltaCuotaInicial, 49_000_000, 1, "Doral Suites 320");
    assert.equal(de("blue-garden").estado, "faltan-ambos");
    cerca(de("blue-garden").ingresoRequerido, 11_558_587, 1000, "Blue Garden: ingreso");
    cerca(de("blue-garden").faltaCuotaInicial, 34_900_000, 1, "Blue Garden: cuota inicial");
    assert.equal(de("doral-west").estado, "faltan-ambos");
    cerca(de("doral-west").ingresoRequerido, 15_057_712, 1000, "Doral West: ingreso");
    cerca(de("doral-west").faltaCuotaInicial, 35_500_000, 1, "Doral West: cuota inicial");
    assert.equal(de("cavana-303").estado, "faltan-ambos");
    assert.deepEqual(consultar.map((c) => c.slug), ["acacias-campestre"]);
    assert.equal(evaluados[0].item.slug, "doral-country");
  });
  test("con la regla vigente (40 %) a Blue Garden solo le falta cuota inicial", () => {
    const { evaluados } = proyectosQueAlcanzan(CARTERA, PERFIL, credito(0.4), 18);
    const de = (slug: string) => evaluados.find((e) => e.item.slug === slug)!;
    assert.equal(de("blue-garden").estado, "falta-cuota-inicial");
    assert.equal(de("doral-west").estado, "faltan-ambos");
    cerca(de("doral-west").ingresoRequerido, 11_293_285, 1000, "Doral West: ingreso vigente");
  });
});

describe("T5c · palanca de leasing", () => {
  const suite = CARTERA[0] as ItemCartera & { precio: number };
  test("leasing al 80 % a 20 años, opción de compra 0 %", () => {
    const r = evaluarItem(suite, PERFIL, { ...credito(0.3), modalidad: "leasing", pctFinanciado: 0.8, opcionCompra: 0 }, 18);
    cerca(r.cuota, 2_900_914, 1000, "cuota");
    assert.equal(r.faltaIngreso, 0);
    cerca(r.faltaCuotaInicial, 9_000_000, 1, "falta de cuota inicial");
  });
  test("las palancas proponen ese leasing (regla del prompt)", () => {
    const ps = palancas(suite, PERFIL, credito(0.3), {
      mesesPorDefecto: 18,
      plazoMaxAnios: 30,
      financiacionMaxCredito: 0.7,
      financiacionMaxLeasing: 0.9,
      tasaLeasingEA: EA,
      opcionCompraLeasing: 0,
    });
    const leasing = ps.find((x) => x.palanca === "leasing");
    assert.ok(leasing, "debe aparecer la palanca de leasing");
    assert.equal(leasing.cambio.pctFinanciado, 0.8);
    cerca(leasing.resultado.faltaCuotaInicial, 9_000_000, 1, "falta con leasing");
    assert.ok(ps.length <= 3);
  });
  test("con la regla vigente, el leasing al 90 % resuelve", () => {
    const ps = palancas(suite, PERFIL, credito(0.4), {
      mesesPorDefecto: 18,
      plazoMaxAnios: 30,
      financiacionMaxCredito: 0.7,
      financiacionMaxLeasing: 0.9,
      tasaLeasingEA: EA,
      opcionCompraLeasing: 0.1,
    });
    assert.equal(ps[0].palanca, "leasing");
    assert.equal(ps[0].resuelve, true);
    assert.equal(ps[0].cambio.pctFinanciado, 0.9);
  });
});

describe("T6 · gastos de escritura y registro", () => {
  const g = gastosDeCierre({ precio: 311_500_000, montoHipoteca: 218_050_000, esVIS: false, tarifas: TARIFAS });
  test("cada línea", () => {
    cerca(g.notarialCompraventa, 573_950, 1000, "notarial compraventa (50 %)");
    cerca(g.notarialHipoteca, 569_999, 1000, "notarial hipoteca");
    cerca(g.impuestoRegistroCompraventa, 3_115_000, 1, "impuesto de registro compraventa");
    cerca(g.impuestoRegistroHipoteca, 2_180_500, 1, "impuesto de registro hipoteca");
    cerca(g.registroCompraventa, 3_593_526, 1000, "registro compraventa");
    cerca(g.registroHipoteca, 1_760_828, 1000, "registro hipoteca");
  });
  test("total", () => {
    cerca(g.total, 11_793_803, 1000, "total");
    assert.equal((g.pctPrecio * 100).toFixed(2), "3.79");
  });
  test("tramos del registro: la tarifa va sobre el valor total, no por partes", () => {
    assert.equal(derechosRegistro(12_852_101, TARIFAS.registro), 53_100);
    cerca(derechosRegistro(300_000_000, TARIFAS.registro), 3_393_000, 1, "$300 M × 11,31 por mil");
  });
  test("leasing y contado no tienen hipoteca", () => {
    const sin = gastosDeCierre({ precio: 311_500_000, montoHipoteca: 0, esVIS: false, tarifas: TARIFAS });
    assert.equal(sin.notarialHipoteca, 0);
    assert.equal(sin.registroHipoteca, 0);
    assert.equal(sin.impuestoRegistroHipoteca, 0);
  });
});

describe("T7 · renta corta", () => {
  const r = rentaCorta({
    precio: 295_000_000,
    trm: 3_341.33,
    tarifaNocheUSD: 85,
    ocupacion: 0.57,
    comisionOperador: 0.2,
    contribucionTurismo: 0.0025,
    administracion: 400_000,
    predialMensual: 100_000,
    servicios: 350_000,
    // Leasing al 80 % a 15 años con opción de compra del 0 %, sin seguros.
    cuotaCredito: cuotaLeasing(236_000_000, 0, I, 180),
  });
  test("ingresos y gastos", () => {
    cerca(r.tarifaNoche, 284_013, 1, "tarifa por noche");
    assert.equal(r.nochesMes.toFixed(2), "17.34");
    cerca(r.ingresoBruto, 4_924_076, 1000, "ingreso bruto");
    cerca(r.operador, 984_815, 1000, "operador");
    cerca(r.contribucionTurismo, 12_310, 1000, "contribución");
    cerca(r.fijos, 850_000, 1, "fijos");
  });
  test("flujos y rentabilidades", () => {
    cerca(r.flujoAntesCuota, 3_076_951, 1000, "flujo antes de la cuota");
    cerca(r.flujoDespuesCuota, -34_702, 1000, "flujo después de la cuota");
    assert.equal(((r.ocupacionEquilibrio ?? 0) * 100).toFixed(1), "57.5");
    assert.equal((r.rentabilidadBruta * 100).toFixed(2), "20.03");
    assert.equal((r.rentabilidadNeta * 100).toFixed(2), "12.52");
  });
  test("con la opción de compra del 10 % el flujo cambia de signo", () => {
    const r10 = rentaCorta({
      precio: 295_000_000, trm: 3_341.33, tarifaNocheUSD: 85, ocupacion: 0.57, comisionOperador: 0.2,
      contribucionTurismo: 0.0025, administracion: 400_000, predialMensual: 100_000, servicios: 350_000,
      cuotaCredito: cuotaLeasing(236_000_000, 29_500_000, I, 180),
    });
    cerca(r10.flujoDespuesCuota, 14_944, 1000, "flujo con opción del 10 %");
  });
});

describe("T8 · beneficio tributario", () => {
  test("intereses del año 1 de T1, tarifa marginal del 28 %", () => {
    const t = tablaAmortizacion({ monto: 218_050_000, i: I, meses: 240 });
    const b = beneficioTributario({
      interesesAnio: interesesPorAnio(t.filas)[0],
      tarifaMarginal: 0.28,
      uvt: CONFIG.parametros.uvt.valor,
      topeUVT: CONFIG.parametros.deduccionInteresesUVT.valor,
    });
    cerca(b.tope, 62_848_800, 1, "tope");
    cerca(b.deducible, 29_960_396, 1000, "deducible");
    cerca(b.ahorro, 8_388_911, 1000, "ahorro");
  });
  test("tabla del art. 241", () => {
    const uvt = CONFIG.parametros.uvt.valor;
    const tabla = CONFIG.parametros.tarifasRenta.valor;
    assert.equal(tarifaMarginal(1000 * uvt, uvt, tabla), 0);
    assert.equal(tarifaMarginal(2000 * uvt, uvt, tabla), 0.28);
    assert.equal(tarifaMarginal(40000 * uvt, uvt, tabla), 0.39);
  });
});

describe("T9, T10 y T11 · límites", () => {
  const base = { modalidad: "pesos" as const, precio: 311_500_000, pctFinanciado: 0.7, plazoAnios: 20, esVIS: false };
  test("T9: crédito No VIS al 85 % se corrige al 70 % y sugiere leasing", () => {
    const { entrada, avisos } = aplicarLimites({ ...base, pctFinanciado: 0.85 }, VIGENTES);
    assert.equal(entrada.pctFinanciado, 0.7);
    assert.equal(avisos[0].codigo, "credito-financiacion-max");
    assert.equal(avisos[0].sugerencia, "leasing");
  });
  test("T10: 35 años se corrige a 30 (máximo de mercado)", () => {
    const { entrada, avisos } = aplicarLimites({ ...base, plazoAnios: 35 }, VIGENTES);
    assert.equal(entrada.plazoAnios, 30);
    assert.equal(avisos[0].codigo, "plazo-max");
  });
  test("T10b: menos de 5 años se corrige al mínimo legal", () => {
    const { entrada } = aplicarLimites({ ...base, plazoAnios: 3 }, VIGENTES);
    assert.equal(entrada.plazoAnios, 5);
  });
  test("T11: $300.000.000 no puede ser VIS en Cartagena", () => {
    cerca(VIGENTES.topeVIS, 262_635_750, 1, "tope VIS de 150 SMMLV");
    const { entrada, avisos } = aplicarLimites({ ...base, precio: 300_000_000, esVIS: true }, VIGENTES);
    assert.equal(entrada.esVIS, false);
    assert.equal(avisos[0].codigo, "vis-supera-tope");
  });
  test("en el exterior el plazo máximo es 20 años", () => {
    const { entrada } = aplicarLimites({ ...base, plazoAnios: 25, exterior: true }, VIGENTES);
    assert.equal(entrada.plazoAnios, 20);
  });
  test("el leasing pasa del 70 % sin aviso hasta su máximo", () => {
    const { entrada, avisos } = aplicarLimites({ ...base, modalidad: "leasing", pctFinanciado: 0.85 }, VIGENTES);
    assert.equal(entrada.pctFinanciado, 0.85);
    assert.equal(avisos.length, 0);
  });
});

describe("Propiedades", () => {
  const casos = [
    { monto: 218_050_000, ea: 0.1471, meses: 240, residuo: 0 },
    { monto: 236_000_000, ea: 0.1471, meses: 180, residuo: 29_500_000 },
    { monto: 150_000_000, ea: 0.12, meses: 60, residuo: 0 },
    { monto: 400_000_000, ea: 0.18, meses: 360, residuo: 0 },
    { monto: 100_000_000, ea: 0, meses: 120, residuo: 0 },
  ];
  for (const c of casos) {
    test(`capital pagado = monto − residuo (${c.monto}, ${c.ea}, ${c.meses})`, () => {
      const t = tablaAmortizacion({
        monto: c.monto,
        i: tasaMensual(c.ea),
        meses: c.meses,
        residuo: c.residuo,
        abonos: { anual: 3_000_000, desdeMes: 12, reduce: "plazo" },
      });
      const capital = t.filas.reduce((s, f) => s + f.capital + f.abono, 0);
      cerca(capital, c.monto - c.residuo, 1, "capital");
      cerca(t.filas[t.filas.length - 1].saldo, c.residuo, 1, "saldo final");
      assert.ok(t.mesesPagados <= c.meses);
    });
  }
  test("el ingreso requerido nunca es menor que cuota ÷ límite", () => {
    for (const precio of [150e6, 300e6, 600e6]) {
      const r = simularCompra(entradaT1({ precio }), { limites: VIGENTES, tarifas: TARIFAS });
      assert.ok(r.credito);
      assert.ok(r.ingresoRequerido >= r.credito.cuota / VIGENTES.cuotaIngresoMaxNoVIS - 1e-6);
    }
  });
  test("indicador legal: cumple, cerca y supera", () => {
    assert.equal(estadoLegal(3_000_000, 10_000_000, 0.4), "cumple");
    assert.equal(estadoLegal(3_800_000, 10_000_000, 0.4), "cerca");
    assert.equal(estadoLegal(4_100_000, 10_000_000, 0.4), "supera");
  });
  test("entrega inmediata: el pendiente va a la firma", () => {
    const o = cuotaInicialEnObra({ precio: 295_000_000, pctFinanciado: 0.7, separacion: 2_000_000, ahorros: 10_000_000, mesesHastaEntrega: 0 });
    assert.equal(o.alaFirma, true);
    assert.equal(o.pagoMensual, 0);
    cerca(o.pendiente, 88_500_000 - 12_000_000, 1, "pendiente");
  });
  test("el % de cuota inicial del proyecto manda si es mayor", () => {
    const o = cuotaInicialEnObra({ precio: 300_000_000, pctFinanciado: 0.8, cuotaInicialPctProyecto: 0.3, mesesHastaEntrega: 10 });
    cerca(o.cuotaInicial, 90_000_000, 1, "cuota inicial");
    cerca(o.montoFinanciado, 210_000_000, 1, "financiado");
  });
});

describe("El simulador completo", () => {
  const r = simularCompra(entradaT1({ ahorros: 10_000_000, abonos: { anual: 5_000_000, desdeMes: 12, reduce: "plazo" } }), {
    limites: VIGENTES,
    tarifas: TARIFAS,
  });
  test("la línea de tiempo va de hoy al último pago", () => {
    assert.equal(r.camino[0].mes, 0);
    assert.equal(r.camino[0].etapa, "separacion");
    const entrega = r.camino.find((m) => m.etapa === "entrega");
    assert.ok(entrega);
    assert.equal(entrega.mes, 18);
    cerca(entrega.gastosCierre, r.gastos.total, 1, "gastos en la entrega");
    const ultimo = r.camino[r.camino.length - 1];
    assert.equal(ultimo.mes, 18 + (r.credito?.mesesPagados ?? 0));
    cerca(ultimo.deuda, 0, 1, "deuda final");
    cerca(ultimo.propio, 1, 1e-6, "todo es propio al final");
  });
  test("de contado no hay crédito", () => {
    const c = simularCompra(entradaT1({ modalidad: "contado" }), { limites: VIGENTES, tarifas: TARIFAS });
    assert.equal(c.credito, null);
    assert.equal(c.obra.montoFinanciado, 311_500_000 * 0 + 0);
    assert.equal(c.gastos.notarialHipoteca, 0);
  });
  test("estrés: la tasa +2 puntos sube la cuota", () => {
    const e = pruebasDeEstres(entradaT1(), { limites: VIGENTES, tarifas: TARIFAS });
    assert.ok(e.tasa.cuota > 0);
    assert.equal(e.inflacion, null);
  });
  test("escenarios comparados marcan el mejor", () => {
    const a = simularCompra(entradaT1(), { limites: VIGENTES, tarifas: TARIFAS });
    const b = simularCompra(entradaT1({ plazoAnios: 15 }), { limites: VIGENTES, tarifas: TARIFAS });
    const filas = compararEscenarios([a, b]);
    const intereses = filas.find((f) => f.clave === "totalIntereses")!;
    assert.equal(intereses.mejor, 1);
    const cuota = filas.find((f) => f.clave === "cuota")!;
    assert.equal(cuota.mejor, 0);
  });
  test("recalcular un escenario completo es instantáneo", () => {
    const inicio = performance.now();
    for (let k = 0; k < 20; k++) simularCompra(entradaT1({ plazoAnios: 30 }), { limites: VIGENTES, tarifas: TARIFAS });
    const porCorrida = (performance.now() - inicio) / 20;
    assert.ok(porCorrida < 16, `tardó ${porCorrida.toFixed(2)} ms por corrida`);
  });
});

describe("Exterior y arrendar o comprar", () => {
  test("si el peso se aprecia, la cuota pesa más", () => {
    const s = sensibilidadTRM({ cuota: 2_680_273, ingresoMonedaExtranjera: 3_000, tasaCambio: 3_341.23 });
    const aprecia = s.find((x) => x.variacion === -0.1)!;
    const hoy = s.find((x) => x.variacion === 0)!;
    assert.ok(aprecia.pctCuota > hoy.pctCuota);
  });
  test("el cruce de arrendar o comprar existe con valorización", () => {
    const t = tablaAmortizacion({ monto: 218_050_000, i: I, meses: 240 });
    const r = arrendarOComprar({
      precio: 311_500_000,
      cuotaInicial: 93_450_000,
      gastosCierre: 11_793_803,
      credito: t.filas.map((f) => ({ cuota: f.cuota, interes: f.interes, seguros: 0, saldo: f.saldo })),
      costosPropietarioMensual: 400_000,
      arriendoMensual: 2_000_000,
      incrementoArriendo: 0.07,
      valorizacion: 0.07,
      anios: 20,
    });
    assert.equal(r.anios.length, 20);
    assert.ok(r.anios[19].patrimonio > r.anios[0].patrimonio);
  });
});

describe("La configuración", () => {
  test("cada cifra dice de dónde sale", () => {
    assert.deepEqual(validarConfig(CONFIG), []);
  });
  test("una cifra sin verificar nunca se muestra como fuente", () => {
    assert.equal(etiquetaDe(CONFIG.parametros.tasaViviendaPromedio), "supuesto");
    assert.equal(etiquetaDe(CONFIG.parametros.uvt), "fuente");
    assert.equal(etiquetaDe(CONFIG.parametros.uvt, true), "tu-dato");
  });
  test("la etiqueta avisa cuando el dato puede estar viejo", () => {
    assert.equal(porActualizar(CONFIG.parametros.inflacionAnual, "2026-09-30"), false);
    assert.equal(porActualizar(CONFIG.parametros.inflacionAnual, "2026-10-08"), true);
  });
  test("Mi Casa Ya y la cobertura FRECH no aparecen como disponibles", () => {
    assert.equal(CONFIG.parametros.miCasaYa.valor.disponible, false);
    assert.equal(CONFIG.parametros.frech.valor.disponible, false);
  });
  test("topes derivados del salario mínimo", () => {
    const s = CONFIG.parametros.smmlv.valor;
    assert.equal(s * CONFIG.parametros.topeVISSmmlv.valor, 262_635_750);
    assert.equal(s * CONFIG.parametros.topeVIPSmmlv.valor, 157_581_450);
    assert.equal(s * CONFIG.parametros.topeVISRenovacionSmmlv.valor, 306_408_375);
    assert.equal(s * CONFIG.parametros.exterior.valor.ingresoMinSmmlv, 5_252_715);
  });
});
