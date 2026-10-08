/**
 * Pruebas del motor del comparador: `npm test` (node --test, sin instalar nada).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CRITERIOS,
  ESCENARIOS,
  PESOS,
  cuotaInicialMinima,
  curvaIngreso,
  evaluar,
  ingresoRequerido,
  notas,
  type DatosOpcion,
  type Perfil,
} from "./evaluar.ts";
import { cuotaFija, tasaMensual } from "../simulador/financiero.ts";

const TODO: DatosOpcion["documentado"] = { precio: true, ubicacion: true, areaSinConflicto: true, entrega: true, parqueadero: true };

/** Como Doral Suite: entrega inmediata, renta corta, 1 alcoba, terraza, sin zonas comunes listadas. */
const SUITE: DatosOpcion = {
  precio: 295_000_000,
  entrega: "inmediata",
  rentaCorta: true,
  alcobasMax: 1,
  exterior: "terraza",
  parqueadero: null,
  zonasComunes: 0,
  documentado: { ...TODO, parqueadero: false },
};

/** Como Blue Garden: en obra sin fecha, 3 alcobas, lote, 2 parqueaderos por casa, 7 zonas comunes. */
const CASA: DatosOpcion = {
  precio: 403_000_000,
  entrega: "sin-fecha",
  rentaCorta: false,
  alcobasMax: 3,
  exterior: "lote",
  parqueadero: "privado",
  zonasComunes: 7,
  documentado: { ...TODO, entrega: false },
};

test("los pesos de cada perfil suman 100", () => {
  for (const p of Object.keys(PESOS) as Perfil[]) {
    const suma = CRITERIOS.reduce((s, c) => s + PESOS[p][c], 0);
    assert.equal(suma, 100, p);
  }
});

test("el puntaje queda entre 0 y 100 y es la suma de los aportes", () => {
  for (const p of Object.keys(PESOS) as Perfil[]) {
    const r = evaluar(SUITE, CASA, p);
    for (const x of [r.puntajeA, r.puntajeB]) assert.ok(x >= 0 && x <= 100 + 1e-9, `${p}: ${x}`);
    const sumaA = r.aportes.reduce((s, a) => s + a.puntosA, 0);
    assert.ok(Math.abs(sumaA - r.puntajeA) < 1e-9);
    const pesos = r.aportes.reduce((s, a) => s + a.peso, 0);
    assert.ok(Math.abs(pesos - 100) < 1e-9, `${p}: los pesos efectivos suman ${pesos}`);
  }
});

test("el inversionista prefiere la entrega inmediata con renta corta; quien va a vivir, la casa", () => {
  assert.equal(evaluar(SUITE, CASA, "inversionista").ganador, "a");
  assert.equal(evaluar(SUITE, CASA, "vivir").ganador, "b");
});

test("intercambiar A y B intercambia los puntajes", () => {
  for (const p of Object.keys(PESOS) as Perfil[]) {
    const ab = evaluar(SUITE, CASA, p);
    const ba = evaluar(CASA, SUITE, p);
    assert.ok(Math.abs(ab.puntajeA - ba.puntajeB) < 1e-9);
    assert.ok(Math.abs(ab.puntajeB - ba.puntajeA) < 1e-9);
  }
});

test("la misma opción contra sí misma empata y no tiene factor decisivo", () => {
  const r = evaluar(CASA, CASA, "mixto");
  assert.equal(r.ganador, "empate");
  assert.equal(r.decisivo, null);
  assert.equal(r.contrapeso, null);
});

test("el precio: el más barato vale 100 y el otro en proporción", () => {
  const n = notas(SUITE, CASA);
  assert.equal(n.a.precio, 100);
  assert.ok(Math.abs((n.b.precio ?? 0) - (100 * 295) / 403) < 1e-9);
});

test("sin precio publicable el criterio no tiene nota y cuenta cero para esa opción", () => {
  const sinPrecio = { ...CASA, precio: null, documentado: { ...CASA.documentado, precio: false } };
  const r = evaluar(sinPrecio, SUITE, "inversionista");
  const precio = r.aportes.find((x) => x.criterio === "precio")!;
  assert.equal(precio.notaA, null);
  assert.equal(precio.puntosA, 0);
  assert.equal(precio.notaB, 100);
});

test("un criterio sin dato en las dos opciones sale de la cuenta", () => {
  const a = { ...CASA, parqueadero: null };
  const b = { ...SUITE, parqueadero: null };
  const r = evaluar(a, b, "vivir");
  assert.ok(!r.aportes.some((x) => x.criterio === "parqueadero"));
  assert.ok(Math.abs(r.aportes.reduce((s, x) => s + x.peso, 0) - 100) < 1e-9);
});

test("el factor decisivo es el criterio que más le suma a la ganadora frente a la otra", () => {
  for (const p of Object.keys(PESOS) as Perfil[]) {
    for (const [x, y] of [[SUITE, CASA], [CASA, SUITE]] as const) {
      const r = evaluar(x, y, p);
      if (r.ganador === "empate") continue;
      const v = (a: { puntosA: number; puntosB: number }) => (r.ganador === "a" ? a.puntosA - a.puntosB : a.puntosB - a.puntosA);
      assert.ok(r.decisivo, p);
      // Siempre a favor de la ganadora: nunca un criterio donde gana la otra.
      assert.ok(v(r.decisivo!) > 0, p);
      assert.ok(Math.abs(v(r.decisivo!) - Math.max(...r.aportes.map(v))) < 1e-9, p);
      if (r.contrapeso) assert.ok(v(r.contrapeso) < 0, p);
    }
  }
});

test("caso Country contra West en mixto: gana West, el precio es contrapeso y no factor decisivo", () => {
  const country: DatosOpcion = { precio: 311_500_000, entrega: "sin-fecha", rentaCorta: false, alcobasMax: 3, exterior: "terraza", parqueadero: "comunal", zonasComunes: 4, documentado: { precio: true, ubicacion: true, areaSinConflicto: false, entrega: false, parqueadero: true } };
  const west: DatosOpcion = { precio: 525_000_000, entrega: "con-fecha", rentaCorta: false, alcobasMax: 2, exterior: "lote", parqueadero: "privado", zonasComunes: 5, documentado: { precio: true, ubicacion: true, areaSinConflicto: false, entrega: true, parqueadero: true } };
  const r = evaluar(country, west, "mixto");
  assert.equal(r.ganador, "b");
  assert.notEqual(r.decisivo?.criterio, "precio");
  assert.equal(r.contrapeso?.criterio, "precio");
});

test("los escenarios solo usan sus criterios", () => {
  const inv = evaluar(SUITE, CASA, "mixto", ESCENARIOS.inversion);
  assert.ok(inv.aportes.every((x) => ESCENARIOS.inversion.includes(x.criterio)));
  const hab = evaluar(SUITE, CASA, "mixto", ESCENARIOS.habitabilidad);
  assert.ok(hab.aportes.every((x) => ESCENARIOS.habitabilidad.includes(x.criterio)));
  assert.equal(hab.ganador, "b");
});

test("ningún criterio es de rentabilidad, retorno o valorización", () => {
  for (const c of CRITERIOS) assert.ok(!/rentab|retorno|roi|valoriz|plusval|flujo/i.test(c), c);
});

test("cuota inicial mínima: el 30 % con el tope No VIS del 70 %", () => {
  assert.ok(Math.abs(cuotaInicialMinima(403_000_000, 0.7) - 120_900_000) < 1e-6);
});

test("el ingreso requerido coincide con la cuota fija del motor del simulador", () => {
  const precio = 311_500_000;
  const o = { financiado: 0.7, tasaEA: 0.1548, plazoAnios: 20, limite: 0.4 };
  const cuota = cuotaFija(precio * 0.7, tasaMensual(0.1548), 240);
  assert.ok(Math.abs(ingresoRequerido(precio, o) - cuota / 0.4) < 1e-6);
});

test("la curva de ingreso baja con el plazo y va de 5 a 30 años", () => {
  const c = curvaIngreso(400_000_000, { financiado: 0.7, tasaEA: 0.1548, limite: 0.4 });
  assert.equal(c.length, 26);
  assert.equal(c[0].plazo, 5);
  assert.equal(c[c.length - 1].plazo, 30);
  for (let i = 1; i < c.length; i++) assert.ok(c[i].ingreso < c[i - 1].ingreso);
});
