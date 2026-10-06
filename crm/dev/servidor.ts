/**
 * El CRM corriendo en Node, sin wrangler, para probarlo rápido (no se despliega).
 *
 *   npx tsx --tsconfig crm/tsconfig.json crm/dev/servidor.ts
 *
 * Arma una base en memoria con las migraciones del repo y los datos de prueba
 * (crm/dev/semilla.sql), monta el CRM en la ruta de prueba de abajo con la
 * clave de prueba, y reemplaza el aviso de Telegram por la consola. Lo que no
 * es del CRM responde 404, como haría el sitio. La cabecera X-D1-Sentencias
 * dice cuántas sentencias usó cada petición (el plan gratis permite 50).
 *
 * La prueba de verdad es con wrangler dev (ver crm/README.md): esto es para ir
 * rápido mientras se escribe.
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { D1Node } from "./d1-node.ts";
import { atenderCRM, mandarResumen } from "../src/index.ts";
import { huellaDe } from "../src/clave.ts";

/** La ruta y la clave de las pruebas. Nunca las de producción. */
export const RUTA_PRUEBA = process.env.CRM_RUTA ?? "/r/prueba-crm-0123456789abcdef";
export const CLAVE_PRUEBA = process.env.CRM_CLAVE_PRUEBA ?? "clave de prueba del CRM";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(aqui, "../..");
const PUERTO = Number(process.env.PUERTO ?? 8790);

const db = new DatabaseSync(process.env.DB_ARCHIVO ?? ":memory:");
const migraciones = fs.readdirSync(path.join(raiz, "migrations")).filter((f) => f.endsWith(".sql")).sort();
for (const m of migraciones) db.exec(fs.readFileSync(path.join(raiz, "migrations", m), "utf8"));
if (process.env.SIN_SEMILLA !== "1") db.exec(fs.readFileSync(path.join(aqui, "semilla.sql"), "utf8"));
const d1 = new D1Node(db);

const publico = path.join(raiz, "crm", "public");
const recursos = {
  css: fs.readFileSync(path.join(publico, "crm.css"), "utf8"),
  js: fs.readFileSync(path.join(publico, "crm.js"), "utf8"),
  fuentes: Object.fromEntries(
    fs
      .readdirSync(path.join(publico, "fuentes"))
      .filter((f) => f.endsWith(".woff2"))
      .map((f) => [f.replace(/\.woff2$/, ""), new Uint8Array(fs.readFileSync(path.join(publico, "fuentes", f)))]),
  ),
};

const mensajes: string[] = [];
async function avisar(html: string) {
  mensajes.push(html);
  console.log(`[telegram] ${html.replace(/\n/g, " | ")}`);
  return { ok: true };
}

// La huella se arma al arrancar (ver abajo): tsx corre este archivo como
// CommonJS, sin await en el nivel de arriba.
const env = { DB: d1, CRM_RUTA: RUTA_PRUEBA, CRM_CLAVE: "" } as { DB: D1Node; CRM_RUTA: string; CRM_CLAVE: string };

function leerCuerpo(req: http.IncomingMessage): Promise<Buffer> {
  return new Promise((resolver, rechazar) => {
    const partes: Buffer[] = [];
    req.on("data", (p: Buffer) => partes.push(p));
    req.on("end", () => resolver(Buffer.concat(partes)));
    req.on("error", rechazar);
  });
}

huellaDe(CLAVE_PRUEBA).then((huella) => {
  env.CRM_CLAVE = huella;
  arrancar();
});

function arrancar() {
http
  .createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? "/", `http://127.0.0.1:${PUERTO}`);
      if (url.pathname === "/__dev/telegram") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(mensajes));
        return;
      }
      if (url.pathname === "/__dev/sql" && req.method === "POST") {
        const sql = (await leerCuerpo(req)).toString("utf8");
        const st = db.prepare(sql);
        const filas = /^\s*(SELECT|WITH)/i.test(sql) ? st.all() : [st.run()];
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(filas, (_k, v) => (typeof v === "bigint" ? Number(v) : v)));
        return;
      }
      if (url.pathname === "/__dev/resumen") {
        await mandarResumen(env as never, avisar);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(mensajes.at(-1) ?? null));
        return;
      }
      const headers = new Headers();
      for (const [k, v] of Object.entries(req.headers)) {
        if (typeof v === "string") headers.set(k, v);
        else if (Array.isArray(v)) headers.set(k, v.join(", "));
      }
      const conCuerpo = req.method !== "GET" && req.method !== "HEAD";
      const cuerpo = conCuerpo ? await leerCuerpo(req) : undefined;
      d1.contador = 0;
      const pendientes: Promise<unknown>[] = [];
      const r =
        (await atenderCRM(new Request(url, { method: req.method, headers, body: cuerpo }), env as never, {
          avisar,
          recursos,
          esperar: (p) => pendientes.push(p),
        })) ?? new Response("No es del CRM: el sitio respondería esto.", { status: 404 });
      await Promise.all(pendientes);
      const h: Record<string, string> = {};
      r.headers.forEach((v, k) => (h[k] = v));
      const cookies = r.headers.getSetCookie?.() ?? [];
      h["x-d1-sentencias"] = String(d1.contador);
      if (d1.contador > 50) console.error(`[tope] ${req.method} ${url.pathname}: ${d1.contador} sentencias (> 50)`);
      res.writeHead(r.status, { ...h, ...(cookies.length ? { "set-cookie": cookies } : {}) });
      res.end(Buffer.from(await r.arrayBuffer()));
    } catch (e) {
      console.error(e);
      res.writeHead(500);
      res.end(String(e));
    }
  })
  .listen(PUERTO, "127.0.0.1", () => console.log(`CRM de prueba en http://127.0.0.1:${PUERTO}${RUTA_PRUEBA}`));
}
