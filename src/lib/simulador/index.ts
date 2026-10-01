/**
 * El motor del simulador de compra de vivienda (Prompt 2 de Luciano, 30-sep-2026).
 *
 * Todo es puro y sin dependencias: la página, la versión compacta de cada
 * proyecto, el PDF del plan y el agente calculan con esto. Los valores
 * vigentes, con su fuente, están en src/data/simulador.config.json.
 *
 * Pruebas: `npm test` (node --test, sin instalar nada).
 */
export * from "./tipos.ts";
export * from "./financiero.ts";
export * from "./compra.ts";
export * from "./cartera.ts";
export * from "./inversion.ts";
export * from "./simular.ts";
export * from "./config.ts";
