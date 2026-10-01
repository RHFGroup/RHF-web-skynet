/**
 * Los parámetros vigentes del simulador, leídos una vez de
 * src/data/simulador.config.json (cada uno con su fuente, su fecha y si está
 * verificado). Todas las piezas de la página los toman de aquí.
 */
import CONFIG_JSON from "@/data/simulador.config.json";
import { limitesDesdeConfig, tarifasDesdeConfig, type ConfigSimulador } from "@/lib/simulador/config";
import { limiteCuotaIngreso } from "@/lib/simulador/compra";

export const CONFIG = CONFIG_JSON as unknown as ConfigSimulador;
export const PARAMETROS = CONFIG.parametros;
export const LIMITES = limitesDesdeConfig(CONFIG);
export const TARIFAS = tarifasDesdeConfig(CONFIG);

/** Hoy la primera cuota puede llegar al 40 % del ingreso, en VIS y en No VIS (Decreto 583 de 2025). */
export const LIMITE = limiteCuotaIngreso(false, LIMITES);
