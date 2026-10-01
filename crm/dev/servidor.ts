/**
 * El CRM corriendo en Node, sin wrangler, para probarlo rápido (no se despliega).
 *
 *   npx tsx --tsconfig crm/tsconfig.json crm/dev/servidor.ts
 *
 * Arma una base en memoria con las migraciones del repo y los datos de prueba
 * (crm/dev/semilla.sql), sirve crm/public como ASSETS y reemplaza el aviso de
 * Telegram por la consola. El código de acceso se puede leer en
 * GET /__dev/codigo. La cabecera X-D1-Sentencias dice cuántas sentencias usó
 * cada petición (el plan gratis permite 50).
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
import worker from "../src/index.ts";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(aqui, "../..");
const PUERTO = Number(process.env.PUERTO ?? 8790);

const db = new DatabaseSync(process.env.DB_ARCHIVO ?? ":memory:");
const migraciones = fs.readdirSync(path.join(raiz, "migrations")).filter((f) => f.endsWith(".sql")).sort();
for (const m of migraciones) db.exec(fs.readFileSync(path.join(raiz, "migrations", m), "utf8"));
if (process.env.SIN_SEMILLA !== "1") db.exec(fs.readFileSync(path.join(aqui, "semilla.sql"), "utf8"));
const d1 = new D1Node(db);

const TIPOS: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".woff2": "font/woff2",
};
const publico = path.join(raiz, "crm", "public");
const ASSETS = {
  async fetch(req: Request): Promise<Response> {
    const u = new URL(req.url);
    const archivo = path.normalize(path.join(publico, u.pathname));
    if (!archivo.startsWith(publico) || !fs.existsSync(archivo) || fs.statSync(archivo).isDirectory()) {
      return new Response("No existe", { status: 404 });
    }
    return new Response(fs.readFileSync(archivo), {
      headers: { "Content-Type": TIPOS[path.extname(archivo)] ?? "application/octet-stream" },
    });
  },
};

const mensajes: string[] = [];
const AVISOS = {
  async telegram(html: string) {
    mensajes.push(html);
    console.log(`[telegram] ${html.replace(/\n/g, " | ")}`);
    return { ok: true };
  },
};

const env = { DB: d1, ASSETS, AVISOS, CRM_CODIGO_EN_CONSOLA: "1" } as never;

function leerCuerpo(req: http.IncomingMessage): Promise<Buffer> {
  return new Promise((resolver, rechazar) => {
    const partes: Buffer[] = [];
    req.on("data", (p: Buffer) => partes.push(p));
    req.on("end", () => resolver(Buffer.concat(partes)));
    req.on("error", rechazar);
  });
}

http
  .createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? "/", `http://127.0.0.1:${PUERTO}`);
      if (url.pathname === "/__dev/codigo") {
        const ultimo = [...mensajes].reverse().find((m) => m.includes("<code>"));
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end(ultimo?.match(/<code>(\d{6})<\/code>/)?.[1] ?? "");
        return;
      }
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
        await worker.scheduled({} as never, env, { waitUntil: (p: Promise<unknown>) => p } as never);
        await new Promise((r) => setTimeout(r, 50));
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
      const r = await worker.fetch(new Request(url, { method: req.method, headers, body: cuerpo }), env);
      const h: Record<string, string> = {};
      r.headers.forEach((v, k) => (h[k] = v));
      h["x-d1-sentencias"] = String(d1.contador);
      if (d1.contador > 50) console.error(`[tope] ${req.method} ${url.pathname}: ${d1.contador} sentencias (> 50)`);
      res.writeHead(r.status, h);
      res.end(Buffer.from(await r.arrayBuffer()));
    } catch (e) {
      console.error(e);
      res.writeHead(500);
      res.end(String(e));
    }
  })
  .listen(PUERTO, "127.0.0.1", () => console.log(`CRM de prueba en http://127.0.0.1:${PUERTO}`));
