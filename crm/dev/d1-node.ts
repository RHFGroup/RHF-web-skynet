/**
 * Una D1 de mentira sobre node:sqlite, para probar el CRM sin wrangler
 * (crm/dev/servidor.ts). Implementa lo que usa el CRM: prepare().bind(),
 * first(), all(), run() y batch(). Cuenta las sentencias de cada petición,
 * para vigilar el tope del plan gratis (50 por petición).
 *
 * Solo para pruebas: nunca se despliega.
 */
import { DatabaseSync } from "node:sqlite";

type Valor = string | number | bigint | null | Uint8Array;

function limpiar(args: unknown[]): Valor[] {
  return args.map((a) => {
    if (a === undefined || a === null) return null;
    if (typeof a === "boolean") return a ? 1 : 0;
    return a as Valor;
  });
}

function fila(r: unknown): Record<string, unknown> {
  return { ...(r as Record<string, unknown>) };
}

export class SentenciaNode {
  constructor(
    private readonly base: D1Node,
    readonly sql: string,
    readonly args: unknown[] = [],
  ) {}

  bind(...args: unknown[]): SentenciaNode {
    return new SentenciaNode(this.base, this.sql, args);
  }

  private preparada() {
    this.base.contador++;
    return this.base.db.prepare(this.sql);
  }

  async first<T>(columna?: string): Promise<T | null> {
    const r = this.preparada().get(...limpiar(this.args));
    if (!r) return null;
    return (columna ? fila(r)[columna] : fila(r)) as T;
  }

  async all<T>(): Promise<{ results: T[]; success: true; meta: Record<string, unknown> }> {
    const rs = this.preparada().all(...limpiar(this.args));
    return { results: rs.map(fila) as T[], success: true, meta: {} };
  }

  async run(): Promise<{ results: unknown[]; success: true; meta: { last_row_id: number; changes: number } }> {
    return this.correr();
  }

  correr() {
    const p = this.preparada();
    if (/^\s*(SELECT|WITH)/i.test(this.sql)) {
      return { results: p.all(...limpiar(this.args)).map(fila), success: true as const, meta: { last_row_id: 0, changes: 0 } };
    }
    const r = p.run(...limpiar(this.args));
    return { results: [], success: true as const, meta: { last_row_id: Number(r.lastInsertRowid), changes: Number(r.changes) } };
  }
}

export class D1Node {
  /** Sentencias ejecutadas desde el último reinicio del contador. */
  contador = 0;
  constructor(readonly db: DatabaseSync) {}

  prepare(sql: string): SentenciaNode {
    return new SentenciaNode(this, sql);
  }

  async batch(sentencias: SentenciaNode[]) {
    this.db.exec("BEGIN");
    try {
      const salida = sentencias.map((s) => s.correr());
      this.db.exec("COMMIT");
      return salida;
    } catch (e) {
      this.db.exec("ROLLBACK");
      throw e;
    }
  }

  async exec(sql: string) {
    this.db.exec(sql);
    return { count: 1, duration: 0 };
  }
}
