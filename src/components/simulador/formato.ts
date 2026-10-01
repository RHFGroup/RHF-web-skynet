/**
 * Cómo se escriben las cifras del simulador, en los dos idiomas.
 *
 * Todo a mano, sin `toLocaleString`: el ICU de Node (que arma el HTML en el
 * build) y el del navegador pueden no coincidir, y una cifra que cambia al
 * hidratar rompe React (error #418). Es la misma regla de `formatoPesos`.
 */
import { fechaLarga, mesYAno, type Idioma } from "@/i18n/idioma";

function miles(entero: number, sep: string): string {
  return String(entero).replace(/\B(?=(\d{3})+(?!\d))/g, sep);
}

/** «$311.500.000» (es) o «COP 311,500,000» (en). El precio oficial va en pesos (Ley 1480, art. 26). */
export function pesos(n: number, idioma: Idioma): string {
  if (!Number.isFinite(n)) return "—";
  const r = Math.round(n);
  const signo = r < 0 ? "−" : "";
  const cuerpo = miles(Math.abs(r), idioma === "en" ? "," : ".");
  return idioma === "en" ? `${signo}COP ${cuerpo}` : `${signo}$${cuerpo}`;
}

/**
 * Para la hoja fija del teléfono, donde caben tres cifras: «$287.500» o
 * «$2,79 M» (es); «COP 287,500» o «COP 2.79M» (en).
 */
export function pesosCorto(n: number, idioma: Idioma): string {
  if (!Number.isFinite(n)) return "—";
  if (Math.abs(n) < 1_000_000) return pesos(n, idioma);
  const [ent, dec = ""] = (Math.abs(n) / 1_000_000).toFixed(2).split(".");
  const decimales = dec.replace(/0+$/, "");
  const signo = n < 0 ? "−" : "";
  if (idioma === "en") return `${signo}COP ${miles(Number(ent), ",")}${decimales ? "." + decimales : ""}M`;
  return `${signo}$${miles(Number(ent), ".")}${decimales ? "," + decimales : ""} M`;
}

/** Solo los dígitos con separador de miles, para los campos: «311.500.000» / «311,500,000». */
export function digitos(n: number, idioma: Idioma): string {
  if (!Number.isFinite(n) || n <= 0) return "";
  return miles(Math.round(n), idioma === "en" ? "," : ".");
}

/** Lo que escribió la persona en un campo de dinero, como número. «$ 10.000.000» → 10000000. */
export function leerDinero(texto: string): number {
  const solo = texto.replace(/[^\d]/g, "");
  return solo ? Number(solo) : 0;
}

/** Un decimal escrito con coma o con punto: «14,71» o «14.71» → 14.71. */
export function leerDecimal(texto: string): number {
  const limpio = texto.replace(/[^\d.,]/g, "").replace(",", ".");
  const n = Number(limpio);
  return Number.isFinite(n) ? n : 0;
}

/** «40 %» (es) o «40%» (en). Una fracción: 0.4 → «40 %». */
export function porcentaje(fraccion: number, idioma: Idioma, decimales = 0): string {
  if (!Number.isFinite(fraccion)) return "—";
  const v = (fraccion * 100).toFixed(decimales);
  const texto = idioma === "en" ? v : v.replace(".", ",");
  return idioma === "en" ? `${texto}%` : `${texto} %`;
}

/** Una tasa como se escribe en el campo: 0.1548 → «15,48» / «15.48». */
export function tasaEnCampo(fraccion: number, idioma: Idioma): string {
  const v = (fraccion * 100).toFixed(2).replace(/\.?0+$/, "");
  return idioma === "en" ? v : v.replace(".", ",");
}

/** «18 meses» / «18 months»; «1 mes» / «1 month». */
export function meses(n: number, idioma: Idioma): string {
  const r = Math.round(n);
  if (idioma === "en") return `${r} ${r === 1 ? "month" : "months"}`;
  return `${r} ${r === 1 ? "mes" : "meses"}`;
}

/** «20 años» / «20 years». */
export function anios(n: number, idioma: Idioma): string {
  const r = Math.round(n * 10) / 10;
  const t = idioma === "en" ? String(r) : String(r).replace(".", ",");
  if (idioma === "en") return `${t} ${r === 1 ? "year" : "years"}`;
  return `${t} ${r === 1 ? "año" : "años"}`;
}

/** Un mes contado desde hoy, como mes y año: mes 18 → «abril de 2028». */
export function mesDesdeHoy(desdeISO: string, mas: number, idioma: Idioma): string {
  const m = desdeISO.match(/^(\d{4})-(\d{2})/);
  if (!m) return "";
  const total = Number(m[1]) * 12 + (Number(m[2]) - 1) + Math.round(mas);
  const anio = Math.floor(total / 12);
  const mes = total % 12;
  const NOMBRES = {
    es: ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
    en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  };
  return idioma === "en" ? `${NOMBRES.en[mes]} ${anio}` : `${NOMBRES.es[mes]} de ${anio}`;
}

/**
 * La fecha de un dato de la configuración, para leer: «2026-09-30» → «30 de
 * septiembre de 2026»; «2026-12» → «diciembre de 2026». Un texto que ya viene
 * escrito (el corte de un precio) sale igual.
 */
export function fechaDato(texto: string, idioma: Idioma): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) return fechaLarga(texto, idioma);
  if (/^\d{4}-\d{2}$/.test(texto)) return mesYAno(texto, idioma);
  return texto;
}

/** La primera letra en minúscula, sin tocar el resto («COP» sigue en mayúsculas). */
export function inicialMinuscula(texto: string): string {
  return texto ? texto.charAt(0).toLowerCase() + texto.slice(1) : texto;
}

// ── Rangos para la analítica: nunca cifras exactas ───────────────────────

/** Rango de ingreso para GA4 y Meta (sección 8 del prompt). */
export function rangoIngreso(ingreso: number): string {
  if (ingreso <= 0) return "sin dato";
  if (ingreso <= 6_000_000) return "hasta 6M";
  if (ingreso <= 10_000_000) return "6M a 10M";
  if (ingreso <= 15_000_000) return "10M a 15M";
  if (ingreso <= 25_000_000) return "15M a 25M";
  return "más de 25M";
}

/** Rango de lo que la persona tiene para la cuota inicial. */
export function rangoAhorro(total: number): string {
  if (total <= 0) return "sin dato";
  if (total <= 30_000_000) return "hasta 30M";
  if (total <= 60_000_000) return "30M a 60M";
  if (total <= 100_000_000) return "60M a 100M";
  if (total <= 200_000_000) return "100M a 200M";
  return "más de 200M";
}
