/**
 * Genera el feed CSV del catálogo de Meta Commerce Manager desde la capa de
 * datos única. Un ítem por TIPOLOGÍA, no por proyecto: Meta exige `price` por
 * ítem y cada tipología tiene el suyo.
 *
 * Un proyecto entra al feed solo si tiene los tres datos del numeral 2.16.1 de
 * la Circular 004 (área, precio de referencia y ubicación exacta) y una página
 * propia en el dominio, porque `link` e `image_link` son obligatorios.
 *
 *   node scripts/catalogo-whatsapp.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const RAIZ = new URL("..", import.meta.url).pathname;
const DOMINIO = "https://rhfliving.com";
const fuente = readFileSync(join(RAIZ, "src/data/proyectos.ts"), "utf8");

// Se lee el TS como texto a propósito: el script no compila el proyecto.
const bloques = fuente.split(/\n  \{\n    slug: /).slice(1);
const filas = [];
const bloqueados = [];

for (const b of bloques) {
  const slug = b.match(/^"([a-z-]+)"/)?.[1];
  if (!slug) continue;
  const nombre = b.match(/nombre: "([^"]+)"/)?.[1] ?? slug;

  const tienePrecio = /\n    precio: \{/.test(b);
  const tieneUbicacion = !/\n    ubicacion: null/.test(b);
  const tienePagina = existsSync(join(RAIZ, `src/app/proyectos/${slug}/page.tsx`));
  // Meta rechaza el ítem si `image_link` da 404, así que se exige el archivo.
  // Portada propia si existe; si no, la primera página del brochure.
  const candidatas = [`proyectos/${slug}/portada.jpg`, `proyectos/${slug}/brochure/p01.jpg`];
  const imagen = candidatas.find((c) => existsSync(join(RAIZ, "public", c)));
  const tieneImagen = Boolean(imagen);

  const faltan = [];
  if (!tienePrecio) faltan.push("precio de referencia");
  if (!tieneUbicacion) faltan.push("ubicación exacta del proyecto");
  if (!tienePagina) faltan.push(`página propia en el dominio (/proyectos/${slug})`);
  if (!tieneImagen) faltan.push(`imagen en el dominio (public/${candidatas[0]})`);

  if (faltan.length) {
    bloqueados.push(`${nombre} (${slug}): falta ${faltan.join(", ")}`);
    continue;
  }

  const zona = b.match(/zona: "([^"]+)"/)?.[1] ?? "";
  const corte = b.match(/corte: "([^"]+)"/)?.[1] ?? "";

  // Una fila por tipología con precio.
  const tips = b.split(/\n      \{\n        titulo: /).slice(1);
  tips.forEach((tp, i) => {
    const titulo = tp.match(/^"([^"]+)"/)?.[1];
    const area = tp.match(/valor: "([^"]+)"/)?.[1] ?? "";
    const etiqueta = tp.match(/etiqueta: "([^"]+)"/)?.[1] ?? "área";
    const desde = tp.match(/precio: \{ desde: ([\d_]+)/)?.[1];
    if (!titulo || !desde) return;
    const pesos = Number(desde.replace(/_/g, ""));

    filas.push([
      `${slug}-${i + 1}`,
      `${nombre} — ${titulo}`,
      // La descripción lleva la etiqueta textual del área y la fecha de corte:
      // el ítem del catálogo es una pieza publicitaria más.
      `${titulo}. ${etiqueta}: ${area}. Precio de referencia a corte ${corte}, sujeto a disponibilidad. ${zona}, Cartagena.`,
      "in stock",
      "new",
      `${pesos} COP`,
      `${DOMINIO}/proyectos/${slug}`,
      `${DOMINIO}/${imagen}`,
      "RHF Asesoría Inmobiliaria",
    ]);
  });
}

if (!filas.length) {
  console.log("No se generó feed. Ningún proyecto está habilitado todavía:\n");
  bloqueados.forEach((b) => console.log("  · " + b));
  console.log(
    "\nMientras tanto, los brochures se comparten por mensaje de documento\n(Media API), que no exige catálogo ni campo de precio.\n",
  );
  process.exit(0);
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
const csv = [CABECERA, ...filas]
  .map((f) => f.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
  .join("\n");

const salida = join(RAIZ, "catalogo-whatsapp.csv");
writeFileSync(salida, csv, "utf8");
console.log(`✅ ${filas.length} ítems escritos en catalogo-whatsapp.csv\n`);
filas.forEach((f) => console.log(`  · ${f[1]} — ${f[5]}`));
if (bloqueados.length) {
  console.log("\nFuera del feed por ahora:");
  bloqueados.forEach((b) => console.log("  · " + b));
}
