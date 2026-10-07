/**
 * Las gráficas del tablero, dibujadas en el servidor (7-oct-2026).
 *
 * SVG sin una línea de estilo en el código: la CSP del CRM no deja estilos en
 * línea, así que los colores van por clase (crm.css) y las medidas por
 * atributos. Las barras se miden en porcentajes del propio SVG, para que el
 * texto quede en HTML y se lea igual en el teléfono que en la pantalla grande.
 *
 * Siguen el método de la skill de visualización de datos: marcas finas,
 * extremos redondeados de 4 px con la base recta, 2 px de separación del color
 * de la superficie entre segmentos, rejilla de un pixel, la leyenda siempre que
 * hay más de una serie, un texto por cada valor que importa (nunca uno por
 * punto), el detalle al pasar el dedo o el mouse (crm.js, `data-tip`) y cada
 * gráfica con su tabla. Los colores de los canales siguen al canal, nunca a su
 * posición (validados con el validador de la skill contra la superficie).
 */
import { html, crudo, type Html } from "./html";

/** Un número corto para un eje o una etiqueta: 1.284 · 12,9 mil. */
export function numero(n: number | null | undefined, decimales = 0): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  return n.toLocaleString("es-CO", { maximumFractionDigits: decimales, minimumFractionDigits: 0 });
}

export function porcentaje(parte: number, total: number): string {
  if (!total) return "—";
  const p = (parte / total) * 100;
  return `${p < 10 && p > 0 ? p.toFixed(1).replace(".", ",") : Math.round(p)} %`;
}

/**
 * La línea chica de un indicador: las semanas anteriores en el gris de
 * contexto y la última en el color de acento. Sin ejes: es una tendencia.
 */
export function sparkline(valores: (number | null)[], etiqueta: string): Html {
  const puntos = valores.map((v, i) => ({ i, v })).filter((p): p is { i: number; v: number } => p.v !== null);
  if (puntos.length < 2) return html`<span class="sparkline-vacia">Sin tendencia todavía</span>`;
  const max = Math.max(...puntos.map((p) => p.v), 1);
  const min = Math.min(...puntos.map((p) => p.v), 0);
  const ancho = 120;
  const alto = 28;
  const x = (i: number) => (i / Math.max(valores.length - 1, 1)) * (ancho - 4) + 2;
  const y = (v: number) => alto - 3 - ((v - min) / (max - min || 1)) * (alto - 6);
  const linea = puntos.map((p) => `${x(p.i).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ");
  const [a, b] = puntos.slice(-2);
  return html`<svg class="sparkline" viewBox="0 0 ${ancho} ${alto}" preserveAspectRatio="none" role="img" aria-label="${etiqueta}">
  <polyline class="sparkline-contexto" points="${linea}" vector-effect="non-scaling-stroke"/>
  <polyline class="sparkline-ultimo" points="${x(a.i).toFixed(1)},${y(a.v).toFixed(1)} ${x(b.i).toFixed(1)},${y(b.v).toFixed(1)}" vector-effect="non-scaling-stroke"/>
</svg>`;
}

/**
 * Una barra horizontal medida en porcentaje del ancho disponible: el extremo
 * de los datos redondeado (4 px) y la base recta.
 */
export function barra(fraccion: number, clase: string, tip?: string): Html {
  const p = Math.max(0, Math.min(1, fraccion)) * 100;
  if (p <= 0) return html`<svg class="barra-dato" aria-hidden="true"><rect class="barra-pista" x="0" y="0" width="100%" height="100%" rx="4"/></svg>`;
  return html`<svg class="barra-dato" aria-hidden="true"${tip ? html` data-tip="${tip}"` : ""}>
  <rect class="barra-pista" x="0" y="0" width="100%" height="100%" rx="4"/>
  <rect class="${clase}" x="0" y="0" width="${p.toFixed(2)}%" height="100%" rx="4"/>
  ${p > 2 ? crudo(`<rect class="${clase}" x="0" y="0" width="6" height="100%"/>`) : ""}
</svg>`;
}

/** Un tope de eje «redondo» y par (la mitad también es entera): 2, 4, 6, 8, 10, 12, 16, 20, 30, 40, 50… */
export function topeRedondo(max: number): number {
  const lindos = [2, 4, 6, 8, 10, 12, 16, 20, 30, 40, 50, 60, 80, 100];
  const directo = lindos.find((x) => x >= max);
  if (directo) return directo;
  const base = 10 ** Math.floor(Math.log10(max));
  const paso = [1, 2, 4, 5, 10].map((m) => m * base).find((x) => x >= max / 1) ?? 10 * base;
  return paso % 2 ? paso * 2 : paso;
}

export type Segmento = { clase: string; valor: number; nombre: string };

/**
 * Columnas apiladas (una por semana): cada columna es un SVG del alto del
 * gráfico, con los segmentos en porcentaje del máximo. El borde del color de
 * la superficie hace la separación de 2 px entre segmentos.
 */
export function columnasApiladas(opciones: {
  columnas: { etiqueta: string; segmentos: Segmento[]; destacada?: boolean; tip: string }[];
  leyenda: { clase: string; nombre: string }[];
  titulo: string;
}): Html {
  const totales = opciones.columnas.map((c) => c.segmentos.reduce((n, s) => n + s.valor, 0));
  const max = Math.max(...totales, 1);
  const tope = topeRedondo(max);
  const marcas = [0, tope / 2, tope];
  return html`<div class="apiladas" role="img" aria-label="${opciones.titulo}">
  <div class="apiladas-eje" aria-hidden="true">${[...marcas].reverse().map((m) => html`<span>${numero(m)}</span>`)}</div>
  <div class="apiladas-area">
    <div class="apiladas-rejilla" aria-hidden="true"><i></i><i></i><i></i></div>
    ${opciones.columnas.map((c, i) => {
      let acumulado = 0;
      const total = totales[i];
      const visibles = c.segmentos.filter((s) => s.valor > 0);
      const partes: Html[] = [];
      const cortes: number[] = [];
      visibles.forEach((s, j) => {
        const alto = (s.valor / tope) * 100;
        const y = 100 - ((acumulado + s.valor) / tope) * 100;
        acumulado += s.valor;
        const tip = `${s.nombre}: ${numero(s.valor)}`;
        if (j === visibles.length - 1) {
          // El de arriba lleva el extremo redondeado (4 px); la mitad de abajo, recta.
          partes.push(
            html`<rect class="${s.clase}" x="0" y="${y.toFixed(2)}%" width="100%" height="${alto.toFixed(2)}%" rx="4" data-tip="${tip}"/><rect class="${s.clase}" x="0" y="${(y + alto / 2).toFixed(2)}%" width="100%" height="${(alto / 2).toFixed(2)}%" data-tip="${tip}"/>`,
          );
        } else {
          partes.push(html`<rect class="${s.clase}" x="0" y="${y.toFixed(2)}%" width="100%" height="${alto.toFixed(2)}%" data-tip="${tip}"/>`);
          cortes.push(y);
        }
      });
      // La separación de 2 px, del color de la superficie, entre segmentos.
      const separaciones = cortes.map((y) => crudo(`<rect class="separacion" x="0" y="${y.toFixed(2)}%" width="100%" height="2"/>`));
      return html`<div class="apiladas-col${c.destacada ? " apiladas-col--destacada" : ""}" tabindex="0" data-tip="${c.tip}">
  <span class="apiladas-total" aria-hidden="true">${total ? numero(total) : ""}</span>
  <svg class="apiladas-svg" aria-hidden="true">${partes}${separaciones}</svg>
  <span class="apiladas-etiqueta${(opciones.columnas.length - 1 - i) % 3 ? " apiladas-etiqueta--menor" : ""}">${c.etiqueta}</span>
</div>`;
    })}
  </div>
</div>
<ul class="leyenda">${opciones.leyenda.map((l) => html`<li><i class="muestra ${l.clase}" aria-hidden="true"></i>${l.nombre}</li>`)}</ul>`;
}

/** Columnas simples (un valor por columna), con el valor arriba. */
export function columnas(opciones: {
  datos: { etiqueta: string; valor: number; clase: string; tip: string }[];
  titulo: string;
}): Html {
  const max = Math.max(...opciones.datos.map((d) => d.valor), 1);
  return html`<div class="columnas" role="img" aria-label="${opciones.titulo}">
  ${opciones.datos.map((d) => {
    const alto = (d.valor / max) * 100;
    return html`<div class="columnas-col" tabindex="0" data-tip="${d.tip}">
  <span class="columnas-valor">${numero(d.valor)}</span>
  <svg class="columnas-svg" aria-hidden="true">${d.valor
    ? html`<rect class="${d.clase}" x="0" y="${(100 - alto).toFixed(2)}%" width="100%" height="${alto.toFixed(2)}%" rx="4"/>${
        alto > 4 ? crudo(`<rect class="${d.clase}" x="0" y="${Math.max(0, 100 - Math.min(alto, 100) + 2).toFixed(2)}%" width="100%" height="${Math.max(0, alto - 2).toFixed(2)}%"/>`) : ""
      }`
    : crudo('<rect class="columnas-cero" x="0" y="98%" width="100%" height="2"/>')}</svg>
  <span class="columnas-etiqueta">${d.etiqueta}</span>
</div>`;
  })}
</div>`;
}

/** La tabla que acompaña a cada gráfica: el mismo dato, legible sin colores ni mouse. */
export function tablaDatos(titulo: string, cabeza: string[], filas: (string | number | Html)[][]): Html {
  return html`<details class="ver-tabla"><summary>Ver como tabla</summary>
<div class="tabla-contenedor"><table class="tabla-datos">
  <caption class="solo-lector">${titulo}</caption>
  <thead><tr>${cabeza.map((c, i) => html`<th scope="col"${i ? crudo(' class="num"') : ""}>${c}</th>`)}</tr></thead>
  <tbody>${filas.map((f) => html`<tr>${f.map((v, i) => (i ? html`<td class="num">${v}</td>` : html`<th scope="row">${v}</th>`))}</tr>`)}</tbody>
</table></div></details>`;
}
