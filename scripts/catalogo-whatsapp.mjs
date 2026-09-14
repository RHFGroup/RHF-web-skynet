/**
 * Genera el feed CSV del catálogo de WhatsApp (Meta Commerce Manager)
 * desde la misma capa de datos que alimenta la web.
 *
 *   node scripts/catalogo-whatsapp.mjs > catalogo.csv
 *
 * CANDADO: solo salen los proyectos cuyos diez datos de la Circular 004
 * están completos. Hoy eso es ninguno, y el script lo dice en vez de
 * generar un feed que no se puede publicar. Es a propósito: el campo
 * `price` es obligatorio en el feed de Meta, así que un catálogo implica
 * publicar precio, y publicar precio implica los diez datos.
 *
 * Cuando un proyecto los complete en `src/data/proyectos.ts`, aparece aquí
 * solo, sin tocar este script.
 */

import { readFileSync } from "node:fs";

const SITIO = "https://rhfliving.com";

// Se lee el TS como texto y se extraen los objetos con una evaluación
// acotada, para no depender del toolchain de build.
const src = readFileSync(new URL("../src/data/proyectos.ts", import.meta.url), "utf8");

const slugs = [...src.matchAll(/slug:\s*"([^"]+)"/g)].map((m) => m[1]);
const nombres = [...src.matchAll(/nombre:\s*"([^"]+)"/g)].map((m) => m[1]);

// Estado de cumplimiento por proyecto, leído de los flags del archivo.
const bloques = src.split(/\n\s*\{\s*\n\s*slug:/).slice(1);

const filas = [];
const bloqueados = [];

bloques.forEach((b, i) => {
  const slug = slugs[i];
  const nombre = nombres[i];
  const tienePrecio = /precio:\s*\{/.test(b);
  // Se consideran completos solo si los diez flags están en true.
  const trues = (b.match(/:\s*true/g) || []).length;
  const completo = tienePrecio && trues >= 10;

  if (!completo) {
    const faltan = 10 - trues;
    bloqueados.push(
      `${nombre} (${slug}): ${tienePrecio ? "" : "sin precio cargado; "}faltan ${faltan} de los diez datos de la Circular 004`,
    );
    return;
  }

  const desde = Number((b.match(/desde:\s*([\d_]+)/) || [])[1]?.replace(/_/g, ""));
  filas.push([
    slug,
    nombre,
    `Vivienda nueva en ${(b.match(/zona:\s*"([^"]+)"/) || [])[1] || "Cartagena"}.`,
    "in stock",
    "new",
    `${desde}.00 COP`,
    `${SITIO}/proyectos/${slug}`,
    `${SITIO}/proyectos/${slug}/brochure/p01.jpg`,
    "RHF Asesoría Inmobiliaria",
  ]);
});

if (filas.length === 0) {
  console.error("No se generó feed. Ningún proyecto está habilitado todavía:\n");
  bloqueados.forEach((b) => console.error("  · " + b));
  console.error(
    "\nMientras tanto, los brochures se comparten por mensaje de documento\n" +
      "(Media API), que no exige catálogo ni campo de precio.\n",
  );
  process.exit(1);
}

const CABECERA = [
  "id",
  "title",
  "description",
  "availability",
  "condition",
  "price",
  "link",
  "image_link",
  "brand",
];

const esc = (v) => (/[",\n]/.test(v) ? `"${String(v).replace(/"/g, '""')}"` : v);
console.log(CABECERA.join(","));
filas.forEach((f) => console.log(f.map(esc).join(",")));
