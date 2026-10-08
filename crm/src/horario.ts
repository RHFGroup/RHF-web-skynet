/**
 * El horario en que corre el reloj de la primera respuesta (7-oct-2026).
 *
 * El SLA es de 15 minutos hábiles, con aviso a los 10: lo que entra un sábado
 * a las 11:58 p. m. no cuenta como 15 minutos de espera a las 12:13 a. m. El
 * horario es el mismo que el agente de atención ofrece para las llamadas:
 * lunes a sábado, de 8:00 a. m. a 6:00 p. m., hora de Colombia (UTC−5 todo el
 * año). Los festivos cuentan como días hábiles: si Rafael no trabaja uno, el
 * aviso le llega igual y lo ignora.
 *
 * Va aparte y sin importar nada, para probarlo con `node --test`.
 */

export const HORARIO = {
  /** 0 = domingo … 6 = sábado. */
  dias: [1, 2, 3, 4, 5, 6] as number[],
  /** Minutos desde la medianoche, hora de Colombia. */
  inicio: 8 * 60,
  fin: 18 * 60,
};

/** El SLA: aviso a los 10 minutos hábiles, vencido a los 15. */
export const SLA = { aviso: 10, vence: 15 } as const;

const DESFASE_MS = -5 * 3600_000;
const DIA_MS = 86_400_000;

/** El inicio del día (medianoche de Colombia) que contiene el instante, en ms UTC. */
function inicioDelDia(ms: number): number {
  const local = ms + DESFASE_MS;
  return local - (((local % DIA_MS) + DIA_MS) % DIA_MS) - DESFASE_MS;
}

function diaDeLaSemana(inicioDia: number): number {
  return new Date(inicioDia + DESFASE_MS).getUTCDay();
}

/** Los minutos hábiles entre dos instantes (0 si `hasta` es anterior). */
export function minutosHabiles(desde: Date, hasta: Date): number {
  const a = desde.getTime();
  const b = hasta.getTime();
  if (!(b > a)) return 0;
  let total = 0;
  // Hasta 400 días: más que eso no es una espera, es un lead olvidado.
  let dia = inicioDelDia(a);
  for (let i = 0; i < 400 && dia < b; i++, dia += DIA_MS) {
    if (!HORARIO.dias.includes(diaDeLaSemana(dia))) continue;
    const abre = dia + HORARIO.inicio * 60_000;
    const cierra = dia + HORARIO.fin * 60_000;
    const x = Math.max(a, abre);
    const y = Math.min(b, cierra);
    if (y > x) total += y - x;
  }
  return Math.floor(total / 60_000);
}

/** El instante en que se cumplen `minutos` hábiles desde `desde`. */
export function cuandoSeCumplen(desde: Date, minutos: number): Date {
  let resta = minutos * 60_000;
  let dia = inicioDelDia(desde.getTime());
  for (let i = 0; i < 400; i++, dia += DIA_MS) {
    if (!HORARIO.dias.includes(diaDeLaSemana(dia))) continue;
    const abre = Math.max(desde.getTime(), dia + HORARIO.inicio * 60_000);
    const cierra = dia + HORARIO.fin * 60_000;
    if (cierra <= abre) continue;
    if (cierra - abre >= resta) return new Date(abre + resta);
    resta -= cierra - abre;
  }
  return new Date(desde.getTime() + minutos * 60_000);
}

/** ¿Este instante cae dentro del horario? */
export function enHorario(ahora: Date): boolean {
  const dia = inicioDelDia(ahora.getTime());
  const minutos = (ahora.getTime() - dia) / 60_000;
  return HORARIO.dias.includes(diaDeLaSemana(dia)) && minutos >= HORARIO.inicio && minutos < HORARIO.fin;
}

export type EstadoSla = "a_tiempo" | "por_vencer" | "vencido";

export function estadoSla(minutos: number): EstadoSla {
  if (minutos >= SLA.vence) return "vencido";
  if (minutos >= SLA.aviso) return "por_vencer";
  return "a_tiempo";
}

/** «8 min», «1 h 20 min», «3 días»: para mostrar una espera en minutos. */
export function duracion(minutos: number): string {
  if (minutos < 60) return `${minutos} min`;
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h < 24) return m ? `${h} h ${m} min` : `${h} h`;
  const d = Math.floor(h / 24);
  return d === 1 ? "1 día" : `${d} días`;
}
