/**
 * Las cifras del tablero (7-oct-2026, pedido de Rafael: «las 5 métricas
 * definitivas para auditar cada lunes si la inversión de Ads en YouTube/Meta
 * se está traduciendo en pipeline real»).
 *
 * Todo se calcula acá, en el Worker, sobre las oportunidades de las últimas
 * semanas: son pocas filas y así cada definición queda escrita en un solo
 * lugar. Las definiciones (también en la página, en «Cómo se calcula»):
 *
 *  1. Leads nuevos: oportunidades creadas en el período.
 *  2. Velocidad de respuesta: la mediana de los minutos hábiles hasta el
 *     primer intento de contacto, y qué parte quedó dentro de 15 minutos.
 *  3. Presentaciones: oportunidades que llegaron por primera vez a la fase de
 *     presentación (recorrido o Zoom agendado) en el período.
 *  4. Costo por lead calificado de anuncios: la inversión en anuncios del
 *     período dividida por los leads de anuncios calificados (con presupuesto
 *     y forma de pago definidos, o puntaje A o B, o que ya llegaron a la
 *     presentación).
 *  5. Pipeline generado: la suma del valor de referencia (crm/src/valor.ts)
 *     de las oportunidades que llegaron a la presentación en el período, y
 *     cuántas veces la inversión en anuncios representa.
 */
import { GRUPOS, grupoDe, type Grupo } from "./canales";
import { NO_SE } from "@/data/calificacion";
import { valorDe } from "./valor";
import { lunesDe, sumarDias, inicioDelDiaIso, hoy } from "./tiempo";

export type Fila = {
  id: number;
  tipo: "compra" | "venta";
  creado_en: string;
  canal: string | null;
  etapa: string;
  cerrada: number;
  puntaje: string;
  rango_presupuesto: string | null;
  pago: string | null;
  proposito: string | null;
  valor_estimado: number | null;
  interes: string | null;
  primer_intento_en: string | null;
  minutos_respuesta: number | null;
  espera_desde: string | null;
  fase_contactado_en: string | null;
  fase_presentacion_en: string | null;
  fase_cotizacion_en: string | null;
  fase_cierre_en: string | null;
};

export type Inversion = { semana: string; canal: string; monto: number };

export type Periodo = "semana" | "pasada" | "4s" | "12s";
export const PERIODOS: { id: Periodo; nombre: string; semanas: number }[] = [
  { id: "pasada", nombre: "Semana pasada", semanas: 1 },
  { id: "semana", nombre: "Esta semana", semanas: 1 },
  { id: "4s", nombre: "4 semanas", semanas: 4 },
  { id: "12s", nombre: "12 semanas", semanas: 12 },
];

/** Un rango de fechas locales [desde, hasta) como lunes, y su equivalente en UTC. */
export type Rango = { desde: string; hasta: string; ini: string; fin: string };

function rango(desde: string, hasta: string): Rango {
  return { desde, hasta, ini: inicioDelDiaIso(desde), fin: inicioDelDiaIso(hasta) };
}

/** El período elegido y el anterior del mismo largo. Las semanas van de lunes a domingo. */
export function rangos(periodo: Periodo, ahora = new Date()): { actual: Rango; anterior: Rango; semanas: number } {
  const lunes = lunesDe(hoy(ahora));
  const p = PERIODOS.find((x) => x.id === periodo) ?? PERIODOS[0];
  const fin = periodo === "pasada" ? lunes : sumarDias(lunes, 7);
  const ini = sumarDias(fin, -7 * p.semanas);
  return { actual: rango(ini, fin), anterior: rango(sumarDias(ini, -7 * p.semanas), ini), semanas: p.semanas };
}

const en = (iso: string | null, r: Rango) => !!iso && iso >= r.ini && iso < r.fin;

export function esAnuncio(canal: string | null): boolean {
  return ["meta_ads", "google_ads", "youtube_ads"].includes(grupoDe(canal)) || canal === "otros_ads";
}

/** ¿Lead calificado? Con presupuesto y forma de pago definidos, o puntaje A o B, o ya en la presentación. */
export function calificado(f: Fila): boolean {
  const respondio = !!f.rango_presupuesto && f.rango_presupuesto !== NO_SE && !!f.pago && f.pago !== NO_SE;
  return respondio || f.puntaje === "A" || f.puntaje === "B" || !!f.fase_presentacion_en;
}

export function mediana(v: number[]): number | null {
  if (!v.length) return null;
  const s = [...v].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}

export type Resumen = {
  leads: number;
  leadsAnuncios: number;
  calificadosAnuncios: number;
  respuestaMediana: number | null;
  respuestasMedidas: number;
  dentroSla: number;
  sinRespuesta: number;
  presentaciones: number;
  cierres: number;
  valorCierres: number;
  inversionAnuncios: number;
  hayInversion: boolean;
  costoLeadCalificado: number | null;
  costoLead: number | null;
  pipeline: number;
  pipelineSinValor: number;
};

export function resumir(filas: Fila[], inversion: Inversion[], r: Rango): Resumen {
  const nuevas = filas.filter((f) => en(f.creado_en, r));
  const deAnuncios = nuevas.filter((f) => esAnuncio(f.canal));
  const medidas = nuevas.filter((f) => f.minutos_respuesta !== null).map((f) => f.minutos_respuesta as number);
  const presentadas = filas.filter((f) => en(f.fase_presentacion_en, r));
  const cerradas = filas.filter((f) => en(f.fase_cierre_en, r));
  const inv = inversion.filter((i) => i.semana >= r.desde && i.semana < r.hasta);
  const inversionAnuncios = inv.reduce((n, i) => n + i.monto, 0);
  const calificados = deAnuncios.filter(calificado).length;
  let pipeline = 0;
  let pipelineSinValor = 0;
  for (const f of presentadas) {
    const v = valorDe(f).valor;
    if (v) pipeline += v;
    else pipelineSinValor++;
  }
  return {
    leads: nuevas.length,
    leadsAnuncios: deAnuncios.length,
    calificadosAnuncios: calificados,
    respuestaMediana: mediana(medidas),
    respuestasMedidas: medidas.length,
    dentroSla: medidas.filter((m) => m <= 15).length,
    sinRespuesta: nuevas.filter((f) => f.espera_desde && !f.primer_intento_en && !f.cerrada).length,
    presentaciones: presentadas.length,
    cierres: cerradas.length,
    valorCierres: cerradas.reduce((n, f) => n + (valorDe(f).valor ?? 0), 0),
    inversionAnuncios,
    hayInversion: inv.length > 0,
    costoLeadCalificado: inv.length && calificados ? Math.round(inversionAnuncios / calificados) : null,
    costoLead: inv.length && deAnuncios.length ? Math.round(inversionAnuncios / deAnuncios.length) : null,
    pipeline,
    pipelineSinValor,
  };
}

/** Las últimas `n` semanas (lunes) que terminan con la del rango dado. */
export function semanasHasta(r: Rango, n: number): string[] {
  const ultima = sumarDias(r.hasta, -7);
  return Array.from({ length: n }, (_, i) => sumarDias(ultima, -7 * (n - 1 - i)));
}

/** Una serie semanal de cualquier cifra del resumen. */
export function serieSemanal(filas: Fila[], inversion: Inversion[], semanas: string[], cifra: (x: Resumen) => number | null): (number | null)[] {
  return semanas.map((s) => cifra(resumir(filas, inversion, rango(s, sumarDias(s, 7)))));
}

/** Leads por semana y por grupo de canal, para las columnas apiladas. */
export function leadsPorSemanaYGrupo(filas: Fila[], semanas: string[]): { semana: string; grupos: Record<Grupo, number>; total: number }[] {
  return semanas.map((s) => {
    const r = rango(s, sumarDias(s, 7));
    const grupos = Object.fromEntries(GRUPOS.map((g) => [g.id, 0])) as Record<Grupo, number>;
    let total = 0;
    for (const f of filas) {
      if (!en(f.creado_en, r)) continue;
      grupos[grupoDe(f.canal)]++;
      total++;
    }
    return { semana: s, grupos, total };
  });
}

export type FilaCanal = {
  grupo: Grupo;
  nombre: string;
  anuncios: boolean;
  inversion: number | null;
  leads: number;
  calificados: number;
  contactados: number;
  respuestaMediana: number | null;
  presentaciones: number;
  pipeline: number;
  cierres: number;
};

/** La tabla por canal: la que dice si la plata de los anuncios se vuelve oportunidades. */
export function porCanal(filas: Fila[], inversion: Inversion[], r: Rango): FilaCanal[] {
  const inv = inversion.filter((i) => i.semana >= r.desde && i.semana < r.hasta);
  return GRUPOS.map((g) => {
    const nuevas = filas.filter((f) => en(f.creado_en, r) && grupoDe(f.canal) === g.id);
    const presentadas = filas.filter((f) => en(f.fase_presentacion_en, r) && grupoDe(f.canal) === g.id);
    const cierres = filas.filter((f) => en(f.fase_cierre_en, r) && grupoDe(f.canal) === g.id).length;
    const montos = inv.filter((i) => grupoDe(i.canal) === g.id);
    return {
      grupo: g.id,
      nombre: g.nombre,
      anuncios: g.anuncios,
      inversion: montos.length ? montos.reduce((n, i) => n + i.monto, 0) : null,
      leads: nuevas.length,
      calificados: nuevas.filter(calificado).length,
      contactados: nuevas.filter((f) => f.fase_contactado_en).length,
      respuestaMediana: mediana(nuevas.filter((f) => f.minutos_respuesta !== null).map((f) => f.minutos_respuesta as number)),
      presentaciones: presentadas.length,
      pipeline: presentadas.reduce((n, f) => n + (valorDe(f).valor ?? 0), 0),
      cierres,
    };
  });
}

/** El embudo de una cohorte: de los leads del período, cuántos llegaron a cada fase. */
export function embudo(filas: Fila[], r: Rango): number[] {
  const cohorte = filas.filter((f) => en(f.creado_en, r));
  return [
    cohorte.length,
    cohorte.filter((f) => f.fase_contactado_en).length,
    cohorte.filter((f) => f.fase_presentacion_en).length,
    cohorte.filter((f) => f.fase_cotizacion_en).length,
    cohorte.filter((f) => f.fase_cierre_en).length,
  ];
}

/** Los tramos de la velocidad de respuesta, en minutos hábiles. */
export const TRAMOS_RESPUESTA = [
  { id: "t5", nombre: "Menos de 5 min", hasta: 5, estado: "bueno" },
  { id: "t15", nombre: "5 a 15 min", hasta: 15, estado: "bueno" },
  { id: "t60", nombre: "15 min a 1 h", hasta: 60, estado: "aviso" },
  { id: "t240", nombre: "1 a 4 h", hasta: 240, estado: "serio" },
  { id: "t600", nombre: "4 h a 1 día hábil", hasta: 600, estado: "critico" },
  { id: "tmas", nombre: "Más de 1 día hábil", hasta: Number.POSITIVE_INFINITY, estado: "critico" },
] as const;

export function tramosRespuesta(filas: Fila[], r: Rango): { conteos: number[]; sinRespuesta: number } {
  const nuevas = filas.filter((f) => en(f.creado_en, r));
  const conteos = TRAMOS_RESPUESTA.map(() => 0);
  for (const f of nuevas) {
    if (f.minutos_respuesta === null) continue;
    const i = TRAMOS_RESPUESTA.findIndex((t) => (f.minutos_respuesta as number) <= t.hasta);
    conteos[i === -1 ? conteos.length - 1 : i]++;
  }
  return { conteos, sinRespuesta: nuevas.filter((f) => f.espera_desde && !f.primer_intento_en && !f.cerrada).length };
}
