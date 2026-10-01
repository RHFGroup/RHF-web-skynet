/**
 * Fechas en hora de Colombia.
 *
 * En la base todo va en UTC (ISO 8601), salvo lo que Rafael escribe como fecha
 * o fecha y hora local: vencimiento de tareas, próxima acción y recorridos. Esas
 * van como `AAAA-MM-DD` o `AAAA-MM-DDTHH:MM`, en hora de Colombia, que es
 * UTC−5 todo el año (no tiene horario de verano).
 */

const DESFASE_MS = -5 * 3600_000;

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const DIAS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

/** Un instante pasado a la hora de Colombia, leído con los getters UTC. */
function local(d: Date): Date {
  return new Date(d.getTime() + DESFASE_MS);
}

const dos = (n: number) => String(n).padStart(2, "0");

/** La fecha de hoy en Colombia: AAAA-MM-DD. */
export function hoy(ahora = new Date()): string {
  const l = local(ahora);
  return `${l.getUTCFullYear()}-${dos(l.getUTCMonth() + 1)}-${dos(l.getUTCDate())}`;
}

/** Suma días a una fecha AAAA-MM-DD. */
export function sumarDias(fecha: string, dias: number): string {
  const [a, m, d] = fecha.split("-").map(Number);
  const x = new Date(Date.UTC(a, m - 1, d + dias));
  return `${x.getUTCFullYear()}-${dos(x.getUTCMonth() + 1)}-${dos(x.getUTCDate())}`;
}

/** «1 oct, 11:04» (hora de Colombia), para un instante ISO en UTC. */
export function fechaCorta(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const l = local(d);
  return `${l.getUTCDate()} ${MESES[l.getUTCMonth()]}, ${dos(l.getUTCHours())}:${dos(l.getUTCMinutes())}`;
}

/** «1 oct 2026», para un instante ISO en UTC. */
export function fechaLarga(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const l = local(d);
  return `${l.getUTCDate()} ${MESES[l.getUTCMonth()]} ${l.getUTCFullYear()}`;
}

/** «jue 2 oct» para una fecha local AAAA-MM-DD, o «jue 2 oct, 10:00» si trae hora. */
export function fechaLocal(texto: string | null | undefined): string {
  if (!texto) return "";
  const m = texto.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/);
  if (!m) return texto;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  const base = `${DIAS[d.getUTCDay()]} ${d.getUTCDate()} ${MESES[d.getUTCMonth()]}`;
  return m[4] ? `${base}, ${m[4]}:${m[5]}` : base;
}

/** «hace 5 min», «hace 3 h», «hace 2 días». */
export function hace(iso: string | null | undefined, ahora = new Date()): string {
  if (!iso) return "";
  const ms = ahora.getTime() - new Date(iso).getTime();
  if (Number.isNaN(ms)) return "";
  const min = Math.max(0, Math.floor(ms / 60_000));
  if (min < 1) return "hace un momento";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return d === 1 ? "hace 1 día" : `hace ${d} días`;
}

/** Valida y devuelve una fecha AAAA-MM-DD, o null. */
export function fechaValida(v: string): string | null {
  const m = v.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return d.getUTCMonth() === Number(m[2]) - 1 ? v.trim() : null;
}

/** Valida y devuelve una fecha y hora local AAAA-MM-DDTHH:MM, o null. */
export function fechaHoraValida(v: string): string | null {
  const m = v.trim().match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/);
  if (!m || !fechaValida(m[1]) || Number(m[2]) > 23 || Number(m[3]) > 59) return null;
  return `${m[1]}T${m[2]}:${m[3]}`;
}
