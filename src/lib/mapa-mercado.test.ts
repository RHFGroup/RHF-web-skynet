/**
 * Pruebas del mapa de obras y entorno: `npm test` (node --test, sin instalar nada).
 *
 * Cuidan las reglas que un diseño bonito podría romper sin que nadie lo note:
 * que cada punto caiga en su zona y dentro del encuadre que se abre al
 * tocarla, y que el texto del mapa no prometa valorización ni publique
 * fechas de trámite.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { ENCUADRES, FORMAS, ROTULO_ZONA, dentro, mezclar, px, py, suavizar, ubicarEtiquetas, zonaDelPunto, type LL } from "./mapa-mercado.ts";
import { LUGARES } from "../data/zona.ts";
import { IPVN, NOTA_OBRAS, OBRAS, ROTULOS_MAPA, ZONAS, ZONA_DE_LUGAR, ZONA_DE_OPCION, zonaDeOpcion } from "../data/mercado.ts";
import { PROYECTOS } from "../data/proyectos.ts";

const enEncuadre = ([lat, lon]: LL, id: keyof typeof ENCUADRES) => {
  const m = ENCUADRES[id];
  const x = px(lon);
  const y = py(lat);
  return x >= m.x && x <= m.x + m.w && y >= m.y && y <= m.y + m.h;
};

test("cada lugar de zona.ts con coordenada cae en la zona del mapa que le toca y en su encuadre", () => {
  for (const l of LUGARES) {
    if (!l.coordenada) continue;
    const esperada = ZONA_DE_LUGAR[l.id] ?? "zona-norte";
    const ll: LL = [l.coordenada.lat, l.coordenada.lon];
    assert.equal(zonaDelPunto(ll), esperada, `${l.id} cae en ${zonaDelPunto(ll)}, no en ${esperada}`);
    if (esperada !== "costa-atlantico") assert.ok(enEncuadre(ll, esperada), `${l.id} queda fuera del encuadre de ${esperada}`);
  }
});

test("cada obra con coordenada cae en su zona y en su encuadre", () => {
  for (const o of OBRAS) {
    if (!o.coordenada || o.zona === "costa-atlantico") continue;
    const ll: LL = [o.coordenada.lat, o.coordenada.lon];
    assert.equal(zonaDelPunto(ll), o.zona, o.id);
    assert.ok(enEncuadre(ll, o.zona), o.id);
  }
});

test("los proyectos con punto caen en la zona que les asigna el mapa", () => {
  const conPunto = PROYECTOS.filter((p) => p.coordenada);
  assert.ok(conPunto.length >= 2, "Blue Garden y Acacias llevan punto");
  for (const p of conPunto) {
    const zona = zonaDeOpcion(p.slug, p.zona);
    const ll: LL = [p.coordenada!.lat, p.coordenada!.lon];
    assert.equal(zonaDelPunto(ll), zona, p.slug);
    if (zona !== "costa-atlantico") assert.ok(enEncuadre(ll, zona), p.slug);
    assert.ok(enEncuadre(ll, "general"), `${p.slug} queda fuera de la vista general`);
  }
});

test("cada proyecto de la cartera tiene zona en el mapa", () => {
  for (const p of PROYECTOS) assert.ok(ZONA_DE_OPCION[p.slug], `${p.slug} sin zona en ZONA_DE_OPCION`);
});

test("las zonas no se pisan", () => {
  // Una rejilla fina sobre toda la región: ningún punto cae en dos zonas.
  for (let i = 0; i <= 120; i++) {
    for (let j = 0; j <= 120; j++) {
      const lon = -75.64 + (0.3 * i) / 120;
      const lat = 10.28 + (0.36 * j) / 120;
      const en = Object.values(FORMAS).filter((f) => dentro([lat, lon], f)).length;
      assert.ok(en <= 1, `(${lat}, ${lon}) cae en ${en} zonas`);
    }
  }
});

test("el rótulo de cada zona cae dentro de ella y en la vista general", () => {
  for (const [id, ll] of Object.entries(ROTULO_ZONA) as [keyof typeof ROTULO_ZONA, LL][]) {
    assert.equal(zonaDelPunto(ll), id, id);
    assert.ok(enEncuadre(ll, "general"), id);
  }
});

test("dentro() con un cuadrado", () => {
  const cuadrado: LL[] = [[0, 0], [0, 1], [1, 1], [1, 0]];
  assert.equal(dentro([0.5, 0.5], cuadrado), true);
  assert.equal(dentro([1.5, 0.5], cuadrado), false);
});

test("mezclar y suavizar van de un encuadre al otro", () => {
  const a = ENCUADRES.general;
  const b = ENCUADRES["zona-norte"];
  assert.deepEqual(mezclar(a, b, 0), a);
  assert.deepEqual(mezclar(a, b, 1), b);
  assert.equal(suavizar(0), 0);
  assert.equal(suavizar(1), 1);
  assert.ok(Math.abs(suavizar(0.5) - 0.5) < 1e-9);
});

test("la serie del IPVN va de 2018 a 2025 sin huecos, con el último boletín aparte", () => {
  const anios = IPVN.serie.map((s) => s.anio);
  assert.deepEqual(anios, [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025]);
  for (const s of IPVN.serie) {
    assert.ok(s.area > -50 && s.area < 50 && s.nacional > -50 && s.nacional < 50);
  }
  assert.equal(IPVN.area, "Cartagena y Turbaco");
  assert.equal(IPVN.ultimo.anual, 6.28);
  assert.equal(IPVN.ultimo.nacional, 8.8);
});

test("el texto del mapa no promete valorización ni publica avances o fechas de trámite", () => {
  const prohibido = /valoriz|rentab|garantiz|asegurad|sin riesgo|la mejor|la mayor|duplic|\+\s?\d|se espera|previst|abrirá|estará list/i;
  const textos = [
    ...ZONAS.flatMap((z) => [z.nombre, z.rotulo, z.frase]),
    ...OBRAS.flatMap((o) => [o.nombre, o.frase]),
  ];
  for (const t of textos) {
    assert.doesNotMatch(t, prohibido, t);
    // Los avances en porcentaje caducan: no van en el mapa.
    assert.doesNotMatch(t, /\d\s?%/, t);
  }
  // La única «garantía» del mapa es la que se niega, en la letra pequeña.
  assert.match(NOTA_OBRAS, /no está garantizado/);
  assert.match(IPVN.aclaracion, /ni garantiza resultados futuros/);
});

test("cada obra dice su fuente y su fecha", () => {
  for (const o of OBRAS) {
    assert.ok(o.fuente.length > 8, o.id);
    assert.ok(/\d{4}/.test(o.fecha), o.id);
  }
});

test("las etiquetas no se pisan, no tapan marcadores y no se salen del lienzo", () => {
  const limites = { x: 0, y: 0, w: 400, h: 300 };
  const obstaculos = [{ x: 190, y: 140, w: 20, h: 20 }];
  const items = [
    { id: "a", x: 100, y: 100, texto: "Primera obra", radio: 8 },
    // Pegada a la anterior: no cabe a la derecha (pisaría la de «a»), va a otro lado.
    { id: "b", x: 104, y: 104, texto: "Segunda", radio: 8 },
    // Junto al borde derecho: va a la izquierda.
    { id: "c", x: 390, y: 250, texto: "Al borde", radio: 4 },
    // Rodeada: sin lugar libre, va sin etiqueta.
    { id: "d", x: 200, y: 150, texto: "Encerrada en el obstáculo", radio: 4, centrada: true },
  ];
  const u = ubicarEtiquetas(items, obstaculos, limites);
  assert.equal(u.get("a")?.ancla, "start");
  assert.ok(u.get("b") && u.get("b")!.ancla !== "start", "«b» no va a la derecha");
  assert.equal(u.get("c")?.ancla, "end");
  assert.equal(u.has("d"), false);
});

test("los nombres de lugar propios del mapa caen en su zona y su encuadre, con su nodo de OpenStreetMap", () => {
  assert.ok(ROTULOS_MAPA.length >= 1);
  for (const r of ROTULOS_MAPA) {
    const ll: LL = [r.coordenada.lat, r.coordenada.lon];
    assert.equal(zonaDelPunto(ll), r.zona, r.nombre);
    assert.ok(enEncuadre(ll, r.zona), `${r.nombre} queda fuera del encuadre de ${r.zona}`);
    assert.match(r.coordenada.fuente, /^OpenStreetMap, nodo \d+/, r.nombre);
  }
});
