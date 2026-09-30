/**
 * LA CONFIGURACIÓN DEL SIMULADOR (M23)
 * ====================================
 *
 * Los valores viven en src/data/simulador.config.json: tasas, topes, tarifas,
 * seguros y supuestos, cada uno con su fuente, su enlace, su fecha y su tipo.
 * Se actualizan ahí, sin tocar el motor. Este archivo solo define su forma, la
 * valida y la traduce a los parámetros que usan las funciones.
 *
 * La regla del sitio («Datos con fuente») en tres campos:
 *  · `tipo`: «fuente» (dato oficial o de mercado con entidad y fecha) o
 *    «supuesto» (valor editable sin fuente oficial).
 *  · `verificado`: si alguien lo contrastó contra la fuente primaria. Un dato
 *    sin verificar NUNCA se muestra como «Fuente»: sale como «Supuesto».
 *  · `proximaActualizacion`: si ya pasó, la etiqueta lo dice («Dato de agosto;
 *    revisa si hay uno nuevo») en vez de mostrarlo como vigente.
 */

import type { LimitesCredito, TarifasCierre } from "./compra.ts";
import type { TramoRenta } from "./inversion.ts";

export type Parametro<T = number> = {
  valor: T;
  unidad?: string;
  /** Entidad y documento, en palabras: «DIAN, Resolución 000238 de 2025». */
  fuente: string;
  url?: string;
  /** Fecha del dato: AAAA-MM-DD o AAAA-MM. */
  fecha: string;
  tipo: "fuente" | "supuesto";
  verificado: boolean;
  /** AAAA-MM-DD o AAAA-MM. */
  proximaActualizacion?: string;
  nota?: string;
};

export type ConfigSimulador = {
  $comentario?: string;
  version: string;
  parametros: {
    smmlv: Parametro;
    uvt: Parametro;
    inflacionAnual: Parametro;
    inflacionProyectada: Parametro;
    uvr: Parametro;
    trmReferencia: Parametro;
    topeVISSmmlv: Parametro;
    topeVISRenovacionSmmlv: Parametro;
    topeVIPSmmlv: Parametro;
    financiacionMaxNoVIS: Parametro;
    financiacionMaxVIS: Parametro;
    cuotaIngresoMax: Parametro;
    plazoMinAnios: Parametro;
    plazoMaxAnios: Parametro;
    financiacionMaxLeasing: Parametro;
    opcionCompraLeasing: Parametro;
    exterior: Parametro<{
      financiacionMaxNoVIS: number;
      financiacionMaxVIS: number;
      plazoMaxAnios: number;
      ingresoMinSmmlv: number;
      paises: string[];
    }>;
    tasaViviendaPromedio: Parametro;
    tasaNoVISPesos: Parametro;
    tasaRealUVR: Parametro<number | null>;
    tasasPorEntidad: Parametro<{ entidad: string; tasaEA: number }[]>;
    seguroVidaMensual: Parametro;
    seguroIncendioMensual: Parametro;
    notarial: Parametro<Omit<TarifasCierre["notarial"], "parteComprador">>;
    parteCompradorNotarial: Parametro;
    registro: Parametro<TarifasCierre["registro"]>;
    impuestoRegistro: Parametro<TarifasCierre["impuestoRegistro"]>;
    deduccionInteresesUVT: Parametro;
    limiteRentasExentas: Parametro<{ pct: number; uvt: number }>;
    tarifasRenta: Parametro<TramoRenta[]>;
    miCasaYa: Parametro<{ disponible: boolean }>;
    frech: Parametro<{ disponible: boolean }>;
    ocupacionRentaCorta: Parametro;
    tarifaNocheUSD: Parametro;
    comisionOperador: Parametro;
    contribucionTurismo: Parametro;
    mesesVacancia: Parametro;
  };
};

/** Los topes que usan los límites, en pesos del año de la configuración. */
export function limitesDesdeConfig(c: ConfigSimulador): LimitesCredito {
  const p = c.parametros;
  return {
    financiacionMaxNoVIS: p.financiacionMaxNoVIS.valor,
    financiacionMaxVIS: p.financiacionMaxVIS.valor,
    financiacionMaxLeasing: p.financiacionMaxLeasing.valor,
    cuotaIngresoMaxNoVIS: p.cuotaIngresoMax.valor,
    cuotaIngresoMaxVIS: p.cuotaIngresoMax.valor,
    plazoMinAnios: p.plazoMinAnios.valor,
    plazoMaxAnios: p.plazoMaxAnios.valor,
    plazoMaxAniosExterior: p.exterior.valor.plazoMaxAnios,
    topeVIS: p.smmlv.valor * p.topeVISSmmlv.valor,
  };
}

export function tarifasDesdeConfig(c: ConfigSimulador): TarifasCierre {
  const p = c.parametros;
  return {
    notarial: { ...p.notarial.valor, parteComprador: p.parteCompradorNotarial.valor },
    registro: p.registro.valor,
    impuestoRegistro: p.impuestoRegistro.valor,
  };
}

/** Cómo se etiqueta una cifra en la página. */
export type Etiqueta = "fuente" | "supuesto" | "tu-dato";

export function etiquetaDe(p: Parametro<unknown>, editadoPorLaPersona = false): Etiqueta {
  if (editadoPorLaPersona) return "tu-dato";
  return p.tipo === "fuente" && p.verificado ? "fuente" : "supuesto";
}

/** true si la fecha de próxima actualización ya pasó: la etiqueta avisa que puede haber un dato nuevo. */
export function porActualizar(p: Parametro<unknown>, hoyISO: string): boolean {
  return !!p.proximaActualizacion && p.proximaActualizacion <= hoyISO.slice(0, p.proximaActualizacion.length);
}

const FECHA = /^\d{4}-\d{2}(-\d{2})?$/;

/**
 * Revisa que cada parámetro diga de dónde sale. Devuelve la lista de
 * problemas (vacía si todo está bien). Corre en las pruebas: una cifra sin
 * fuente no pasa.
 */
export function validarConfig(c: ConfigSimulador): string[] {
  const problemas: string[] = [];
  for (const [clave, p] of Object.entries(c.parametros) as [string, Parametro<unknown>][]) {
    if (!p || typeof p !== "object") {
      problemas.push(`${clave}: no es un parámetro`);
      continue;
    }
    if (!("valor" in p)) problemas.push(`${clave}: sin valor`);
    if (!p.fuente?.trim()) problemas.push(`${clave}: sin fuente`);
    if (!FECHA.test(p.fecha ?? "")) problemas.push(`${clave}: fecha «${p.fecha}» no es AAAA-MM o AAAA-MM-DD`);
    if (p.tipo !== "fuente" && p.tipo !== "supuesto") problemas.push(`${clave}: tipo «${p.tipo}»`);
    if (typeof p.verificado !== "boolean") problemas.push(`${clave}: sin «verificado»`);
    if (p.tipo === "fuente" && !p.url) problemas.push(`${clave}: es «fuente» y no tiene enlace`);
    if (p.proximaActualizacion && !FECHA.test(p.proximaActualizacion)) {
      problemas.push(`${clave}: próxima actualización «${p.proximaActualizacion}» no es una fecha`);
    }
  }
  const tramos = c.parametros.registro?.valor?.tramos ?? [];
  if (!tramos.length || tramos[tramos.length - 1].hasta !== null) problemas.push("registro: el último tramo debe ser abierto (hasta: null)");
  for (let k = 1; k < tramos.length - 1; k++) {
    if ((tramos[k].hasta ?? Infinity) <= (tramos[k - 1].hasta ?? Infinity)) problemas.push(`registro: el tramo ${k + 1} no es creciente`);
  }
  return problemas;
}
