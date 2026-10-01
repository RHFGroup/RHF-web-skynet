/**
 * La base, el usuario y la auditoría.
 */
import type { Env } from "./env";
import { USUARIO } from "./datos";

/** ¿La petición llegó a una vista previa de Workers Builds? */
export function esVistaPrevia(url: URL): boolean {
  return /^[a-z0-9-]+-rhf-crm\.[a-z0-9-]+\.workers\.dev$/.test(url.hostname);
}

/** ¿Es una prueba en el Mac (wrangler dev)? */
export function esLocal(url: URL): boolean {
  return url.hostname === "127.0.0.1" || url.hostname === "localhost";
}

/**
 * La base de esta petición: la de pruebas en las vistas previas, para que lo
 * que se pruebe ahí no se mezcle con los leads reales.
 */
export function baseDe(env: Env, url: URL): D1Database {
  return env.DB_PREVIEW && esVistaPrevia(url) ? env.DB_PREVIEW : env.DB;
}

export function ahoraIso(): string {
  return new Date().toISOString();
}

/** Lo que el CRM sabe de cada petición. */
export type Ctx = {
  env: Env;
  db: D1Database;
  url: URL;
  request: Request;
  usuario: string;
  ip: string | null;
};

export function nuevoCtx(env: Env, request: Request): Ctx {
  const url = new URL(request.url);
  return {
    env,
    db: baseDe(env, url),
    url,
    request,
    usuario: USUARIO,
    ip: request.headers.get("CF-Connecting-IP"),
  };
}

/**
 * Deja constancia de quién vio, exportó, editó o suprimió qué (Prompt 3,
 * §2.1). Si la auditoría falla, la acción no se aplica: por eso va dentro del
 * mismo lote cuando hay escritura (ver `sentenciaAuditoria`).
 */
export async function auditar(
  c: Ctx,
  accion: string,
  entidad: string | null,
  entidadId: number | null,
  detalle?: string,
): Promise<void> {
  await sentenciaAuditoria(c, accion, entidad, entidadId, detalle).run();
}

export function sentenciaAuditoria(
  c: Ctx,
  accion: string,
  entidad: string | null,
  entidadId: number | null,
  detalle?: string,
): D1PreparedStatement {
  return c.db
    .prepare(
      `INSERT INTO crm_auditoria (creado_en, usuario, accion, entidad, entidad_id, detalle, ip)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(ahoraIso(), c.usuario, accion, entidad, entidadId, detalle ?? null, c.ip);
}

/**
 * ¿Existe la tabla? Las del CRM llegan con la migración 0006 y las del boletín
 * con la 0005. Se recuerda lo que existe; lo que falta se vuelve a mirar, por
 * si la migración se aplicó mientras el Worker seguía vivo.
 */
const tablas = new WeakMap<D1Database, Set<string>>();
export async function existeTabla(db: D1Database, nombre: string): Promise<boolean> {
  const s = tablas.get(db);
  if (s?.has(nombre)) return true;
  const r = await db.prepare(`SELECT name FROM sqlite_master WHERE type = 'table'`).all<{ name: string }>();
  const nuevo = new Set(r.results.map((f) => f.name));
  tablas.set(db, nuevo);
  return nuevo.has(nombre);
}
