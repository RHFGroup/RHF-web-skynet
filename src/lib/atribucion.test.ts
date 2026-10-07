// Pruebas de src/lib/atribucion.ts (7-oct-2026): primer toque, el anuncio que
// llega después, el referente y el navegador que no deja guardar nada.
// Corre con `npm test`, sin navegador: window, document y sessionStorage son
// de mentira.
import { test } from "node:test";
import assert from "node:assert/strict";

type Almacen = { datos: Map<string, string>; roto: boolean };
const almacen: Almacen = { datos: new Map(), roto: false };
const g = globalThis as unknown as Record<string, unknown>;

function entrar(url: string, referente = "") {
  g.window = { location: { href: url } };
  g.document = { referrer: referente };
}
g.sessionStorage = {
  getItem: (k: string) => {
    if (almacen.roto) throw new Error("bloqueado");
    return almacen.datos.get(k) ?? null;
  },
  setItem: (k: string, v: string) => {
    if (almacen.roto) throw new Error("bloqueado");
    almacen.datos.set(k, v);
  },
};

const { capturarAtribucion, atribucionParaEnviar } = await import("./atribucion.ts");

test("la primera entrada desde un anuncio queda anotada", () => {
  almacen.datos.clear();
  entrar("https://rhfliving.com/proyectos/doral-west?utm_source=facebook&utm_medium=paid&utm_campaign=doral-oct&fbclid=IwAR1x", "https://l.facebook.com/");
  capturarAtribucion();
  const a = atribucionParaEnviar();
  assert.equal(a?.utm_source, "facebook");
  assert.equal(a?.utm_medium, "paid");
  assert.equal(a?.utm_campaign, "doral-oct");
  assert.equal(a?.fbclid, "IwAR1x");
  assert.equal(a?.landing, "/proyectos/doral-west");
  assert.equal(a?.referente, "l.facebook.com");
  assert.ok(a?.t && !Number.isNaN(Date.parse(a.t)));
});

test("una entrada posterior sin etiquetas no la pisa", () => {
  entrar("https://rhfliving.com/simulador", "https://www.google.com/");
  capturarAtribucion();
  assert.equal(atribucionParaEnviar()?.utm_campaign, "doral-oct");
});

test("si la primera no traía etiquetas, el anuncio que llega después manda", () => {
  almacen.datos.clear();
  entrar("https://rhfliving.com/", "");
  capturarAtribucion();
  assert.equal(atribucionParaEnviar()?.utm_source, undefined);
  entrar("https://rhfliving.com/?gclid=Cj0KCQ_abc-123", "https://www.google.com/");
  capturarAtribucion();
  const a = atribucionParaEnviar();
  assert.equal(a?.gclid, "Cj0KCQ_abc-123");
  assert.equal(a?.referente, "www.google.com");
});

test("la navegación dentro del mismo sitio no es un referente; la ruta va sin parámetros", () => {
  almacen.datos.clear();
  entrar("https://rhfliving.com/en/projects?x=1#arriba", "https://rhfliving.com/");
  capturarAtribucion();
  const a = atribucionParaEnviar();
  assert.equal(a?.referente, undefined);
  assert.equal(a?.landing, "/en/projects");
});

test("los valores se recortan antes de guardarlos", () => {
  almacen.datos.clear();
  entrar(`https://rhfliving.com/?utm_campaign=${"x".repeat(500)}`, "");
  capturarAtribucion();
  assert.equal(atribucionParaEnviar()?.utm_campaign?.length, 120);
});

// Va al final: deja el respaldo en memoria lleno, como en una página real.
test("si el navegador no deja guardar, vale en memoria para esta página", () => {
  almacen.roto = true;
  entrar("https://rhfliving.com/?utm_source=youtube&utm_medium=cpv", "");
  capturarAtribucion();
  assert.equal(atribucionParaEnviar()?.utm_source, "youtube");
  almacen.roto = false;
});
