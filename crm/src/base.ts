/**
 * La base, el usuario y la auditoría.
 */
import type { Avisar, Env } from "./env";
import { USUARIO } from "./datos";

export { rutaCRM } from "./seguridad";

/**
 * ¿La petición llegó a una vista previa de Workers Builds? El CRM vive dentro
 * del Worker del sitio, así que sus vistas previas son las del sitio:
 * `<versión o rama>-rhf-web-skynet.<subdominio>.workers.dev` (la misma regla
 * de worker/comun.ts).
 */
export function esVistaPrevia(url: URL): boolean {
  return /^[a-z0-9-]+-rhf-web-skynet\.[a-z0-9-]+\.workers\.dev$/.test(url.hostname);
}

/** ¿Es una prueba en el Mac (wrangler dev o el arnés de Node)? */
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
  /**
   * La dirección **interna**: sin la ruta secreta delante («/hoy»,
   * «/contacto/3»…). Las páginas y las redirecciones se escriben con estas
   * direcciones, y src/index.ts les antepone la ruta secreta al responder.
   */
  url: URL;
  /** La ruta secreta, por ejemplo «/k3m9…». */
  ruta: string;
  request: Request;
  usuario: string;
  ip: string | null;
  avisar: Avisar;
  esperar: (p: Promise<unknown>) => void;
  /** El token anti-CSRF de la sesión abierta (src/acceso.ts), o "" sin sesión. */
  csrf: string;
};

export function nuevoCtx(
  env: Env,
  request: Request,
  url: URL,
  ruta: string,
  avisar: Avisar,
  esperar: (p: Promise<unknown>) => void,
): Ctx {
  return {
    env,
    db: baseDe(env, url),
    url,
    ruta,
    request,
    usuario: USUARIO,
    ip: request.headers.get("CF-Connecting-IP"),
    avisar,
    esperar,
    csrf: "",
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
 * ¿Existe la tabla? Las del CRM llegan con las migraciones 0006 y 0007, y las
 * del boletín con la 0005. Se recuerda lo que existe; lo que falta se vuelve a
 * mirar, por si la migración se aplicó mientras el Worker seguía vivo.
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
