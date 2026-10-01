/**
 * El enlace que reconstruye un escenario del simulador.
 *
 * El escenario va después del «#» (/simulador#p=doral-west&modo=pesos&…), no
 * en la consulta (?…): ahí van el ingreso y los ahorros de la persona, y lo
 * que va después del «#» no llega al servidor ni a la analítica, que solo
 * recibe rangos (analitica.ts). La consulta queda para lo que no es
 * personal: `?p=doral-west` desde el botón «Simular cuota» de cada proyecto,
 * y las UTM de los anuncios.
 */
import type { Modalidad } from "@/lib/simulador/compra";
import { PARAMETROS } from "@/components/simulador/parametros";
import type { EstadoSim, ItemSimulador } from "@/components/simulador/tipos";

const MODALIDADES: Modalidad[] = ["pesos", "uvr", "leasing", "contado"];

export const CLAVES_ENLACE = ["p", "modo", "fin", "plazo", "tasa", "ingreso", "ahorros", "cesantias", "mensual", "meses", "precio", "sep"] as const;

/** Los parámetros del escenario: los del «#» si hay; si no, los de la consulta. */
function parametros(): { q: URLSearchParams; deHash: boolean } {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  if (CLAVES_ENLACE.some((k) => hash.has(k))) return { q: hash, deHash: true };
  return { q: new URLSearchParams(window.location.search), deHash: false };
}

/** El escenario del enlace, encima de `base`. `hubo`: el enlace traía algo. */
export function leerEnlace(items: ItemSimulador[], base: EstadoSim): { estado: EstadoSim; hubo: boolean; deHash: boolean } {
  const { q, deHash } = parametros();
  if (!CLAVES_ENLACE.some((k) => q.has(k))) return { estado: base, hubo: false, deHash };
  const n = (k: string) => {
    const v = Number((q.get(k) ?? "").replace(",", "."));
    return q.has(k) && Number.isFinite(v) && v >= 0 ? v : null;
  };
  const e: EstadoSim = { ...base, vista: "experto" };
  const editados = new Set<string>();
  const item = items.find((i) => i.slug === q.get("p"));
  if (item) {
    e.item = item.slug;
    if (item.precio) e.precio = item.precio;
    e.meses = item.meses ?? PARAMETROS.mesesEntregaSupuesto.valor;
  } else if (q.has("precio")) {
    e.item = "";
  }
  const modo = q.get("modo") as Modalidad | null;
  if (modo && MODALIDADES.includes(modo)) {
    e.modalidad = modo;
    editados.add("modalidad");
  }
  const fin = n("fin");
  if (fin !== null && fin <= 100) {
    e.pctFinanciado = fin / 100;
    editados.add("pctFinanciado");
  }
  const plazo = n("plazo");
  if (plazo !== null && plazo > 0) {
    e.plazoAnios = plazo;
    editados.add("plazoAnios");
  }
  const tasa = n("tasa");
  if (tasa !== null && tasa > 0 && tasa < 60) {
    if (e.modalidad === "uvr") e.tasaUVR = tasa / 100;
    else e.tasa = tasa / 100;
    editados.add(e.modalidad === "uvr" ? "tasaUVR" : "tasa");
  }
  const cifras: [string, "ingreso" | "ahorros" | "cesantias" | "ahorroMensual" | "meses" | "precio" | "separacion"][] = [
    ["ingreso", "ingreso"],
    ["ahorros", "ahorros"],
    ["cesantias", "cesantias"],
    ["mensual", "ahorroMensual"],
    ["meses", "meses"],
    ["precio", "precio"],
    ["sep", "separacion"],
  ];
  for (const [k, campo] of cifras) {
    const v = n(k);
    if (v !== null) {
      e[campo] = v;
      editados.add(campo);
    }
  }
  e.editados = [...editados];
  return { estado: e, hubo: true, deHash };
}

/** Los parámetros del escenario, para después del «#». */
export function escribirEnlace(e: EstadoSim): string {
  const q = new URLSearchParams();
  if (e.item) q.set("p", e.item);
  else q.set("precio", String(Math.round(e.precio)));
  q.set("modo", e.modalidad);
  if (e.modalidad !== "contado") {
    q.set("fin", String(Math.round(e.pctFinanciado * 100)));
    q.set("plazo", String(e.plazoAnios));
    const tasa = e.modalidad === "uvr" ? e.tasaUVR : e.tasa;
    if (tasa != null) q.set("tasa", (tasa * 100).toFixed(2).replace(/\.?0+$/, ""));
  }
  const hogar = e.ingreso + (e.conCodeudor ? e.ingresoCodeudor : 0);
  if (hogar > 0) q.set("ingreso", String(Math.round(hogar)));
  if (e.ahorros > 0) q.set("ahorros", String(Math.round(e.ahorros)));
  if (e.cesantias > 0) q.set("cesantias", String(Math.round(e.cesantias)));
  if (e.ahorroMensual > 0) q.set("mensual", String(Math.round(e.ahorroMensual)));
  q.set("meses", String(Math.round(e.meses)));
  if (e.separacion > 0) q.set("sep", String(Math.round(e.separacion)));
  return q.toString();
}

/** El enlace completo para compartir (solo en el navegador). */
export function enlaceDelEscenario(e: EstadoSim): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}${window.location.pathname}#${escribirEnlace(e)}`;
}
