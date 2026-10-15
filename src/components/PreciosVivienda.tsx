"use client";

/**
 * Los precios de la vivienda nueva, según el DANE (Inteligencia de mercado,
 * 14-oct-2026). Va debajo del mapa de obras y entorno.
 *
 * Dos cifras y una gráfica, cada una con su fuente, su periodo y su fecha:
 *  · el último dato del IPVN para «Cartagena AU (Cartagena y Turbaco)»;
 *  · el 70 % de las ventas de vivienda nueva No VIS de 2025 en la Zona Norte
 *    (Camacol Bolívar), el mismo de la portada (src/data/zona.ts);
 *  · la serie anual del IPVN de 2018 a 2025, frente al total nacional.
 *
 * Lo que NO hace, a propósito (research/valorizacion-en-la-publicidad-de-
 * vivienda-lo-que-permite-la-ley-colombiana, en el vault): no proyecta, no
 * multiplica el trimestral, no pone flechas ni «+%», y la aclaración del DANE
 * va completa. La serie va entera, con los años débiles: elegir el mejor año
 * sería publicidad engañosa.
 *
 * La gráfica sigue el método del skill de visualización: un eje, barras con
 * el borde de arriba redondeado, etiquetas solo en el máximo y el último año,
 * colores validados para daltonismo sobre el fondo oscuro y la tabla a un
 * toque.
 */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ruta, type Idioma } from "@/i18n/idioma";
import { mercado } from "@/i18n/modulos/mercado";
import { zona } from "@/i18n/modulos/zona";

const TEXTOS = {
  es: {
    kicker: "Los precios, según el DANE",
    titulo: "Cómo se han movido los precios de la vivienda nueva",
    ultimo: (periodo: string) => `Último dato del DANE · ${periodo}`,
    ultimoTexto: "variación anual de los precios de la vivienda nueva en Cartagena y Turbaco",
    nacional: "Total nacional: ",
    publicado: (fecha: string) => `DANE, IPVN · publicado el ${fecha}`,
    ventas: "Ventas de vivienda nueva en 2025",
    cerca: "Cerca del ",
    fuente: "Fuente: ",
    grafica: "Variación anual del IPVN, de 2018 a 2025",
    graficaAyuda:
      "Cartagena y Turbaco frente al total nacional. Cuarto trimestre de cada año contra el del año anterior; cifras nominales.",
    serieArea: "Cartagena y Turbaco",
    serieNacional: "Total nacional",
    resumen: (min: string, max: string, anio: number, ultimo: string) =>
      `Gráfica de barras: la variación anual del IPVN en Cartagena y Turbaco fue de ${min} a ${max} entre 2018 y 2025; el máximo fue en ${anio}. En 2025 fue de ${ultimo}. La tabla tiene todos los valores.`,
    tabla: "Ver los datos en tabla",
    anio: "Año",
    cierre: "¿Quieres revisar escenarios de precio con sus supuestos y riesgos? ",
    cierreEnlace: "Agenda una asesoría",
  },
  en: {
    kicker: "Prices, according to DANE",
    titulo: "How new-home prices have moved",
    ultimo: (periodo: string) => `Latest DANE data · ${periodo}`,
    ultimoTexto: "annual change in new-home prices in Cartagena and Turbaco",
    nacional: "National total: ",
    publicado: (fecha: string) => `DANE, IPVN · published ${fecha}`,
    ventas: "New-home sales in 2025",
    cerca: "About ",
    fuente: "Source: ",
    grafica: "Annual change in the IPVN, 2018 to 2025",
    graficaAyuda:
      "Cartagena and Turbaco compared with the national total. Fourth quarter of each year against the previous year's; nominal figures.",
    serieArea: "Cartagena and Turbaco",
    serieNacional: "National total",
    resumen: (min: string, max: string, anio: number, ultimo: string) =>
      `Bar chart: the annual change in the IPVN for Cartagena and Turbaco ranged from ${min} to ${max} between 2018 and 2025; the peak was in ${anio}. In 2025 it was ${ultimo}. The table has every value.`,
    tabla: "View the data as a table",
    anio: "Year",
    cierre: "Want to review price scenarios, with their assumptions and risks? ",
    cierreEnlace: "Book a consultation",
  },
};

/** «6,28 %» en español; «6.28%» en inglés. */
function porcentaje(v: number, idioma: Idioma): string {
  const fijo = v.toFixed(2);
  return idioma === "en" ? `${fijo}%` : `${fijo.replace(".", ",")} %`;
}

// ── La gráfica, en píxeles ──────────────────────────────────────────────────
// El lienzo se mide y el SVG se dibuja a su ancho real: las letras miden lo
// mismo en el teléfono que en la pantalla grande.
const M = { arriba: 30, derecha: 8, abajo: 34, izquierda: 42 };
const TOPE = 25;
const MARCAS = [0, 5, 10, 15, 20, 25];

/** Una barra con el borde de arriba redondeado (4 px) y la base recta. */
function barra(x: number, ancho: number, y0: number, y1: number): string {
  const r = Math.max(0, Math.min(4, ancho / 2, (y0 - y1) / 2));
  return `M${x},${y0} L${x},${y1 + r} Q${x},${y1} ${x + r},${y1} L${x + ancho - r},${y1} Q${x + ancho},${y1} ${x + ancho},${y1 + r} L${x + ancho},${y0} Z`;
}

export default function PreciosVivienda({ idioma = "es" }: { idioma?: Idioma }) {
  const t = TEXTOS[idioma];
  const { IPVN } = mercado(idioma);
  const { CIFRA_OFERTA } = zona(idioma);
  const [sobre, setSobre] = useState<number | null>(null);

  const lienzo = useRef<HTMLDivElement>(null);
  const [ANCHO, setAncho] = useState(680);
  useEffect(() => {
    const el = lienzo.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([e]) => {
      const w = Math.round(e.contentRect.width);
      if (w > 0) setAncho(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const ALTO = ANCHO < 520 ? 230 : 300;
  const y = (v: number) => M.arriba + (1 - v / TOPE) * (ALTO - M.arriba - M.abajo);

  const serie = IPVN.serie;
  const paso = (ANCHO - M.izquierda - M.derecha) / serie.length;
  const ancho = Math.max(6, Math.min(26, paso * 0.32));
  const max = serie.reduce((a, b) => (b.area > a.area ? b : a));
  const min = serie.reduce((a, b) => (b.area < a.area ? b : a));
  const ultimo = serie[serie.length - 1];
  const rotular = (anio: number) => anio === max.anio || anio === ultimo.anio;

  return (
    <div className="pv">
      <p className="section-kicker">{t.kicker}</p>
      <h3 className="pv-titulo">{t.titulo}</h3>

      <div className="pv-cifras">
        <article className="pv-cifra">
          <p className="pv-cifra-rotulo">{t.ultimo(IPVN.ultimo.periodo)}</p>
          <p className="pv-cifra-valor">{porcentaje(IPVN.ultimo.anual, idioma)}</p>
          <p className="pv-cifra-texto">{t.ultimoTexto}</p>
          <p className="pv-cifra-comparacion">
            {t.nacional}
            {porcentaje(IPVN.ultimo.nacional, idioma)}
          </p>
          <p className="pv-fuente">{t.publicado(IPVN.ultimo.publicado)}</p>
        </article>
        <article className="pv-cifra">
          <p className="pv-cifra-rotulo">{t.ventas}</p>
          <p className="pv-cifra-valor">
            <small>{t.cerca}</small>
            {idioma === "en" ? `${CIFRA_OFERTA.valor}%` : `${CIFRA_OFERTA.valor} %`}
          </p>
          <p className="pv-cifra-texto">{CIFRA_OFERTA.rotulo}</p>
          <p className="pv-fuente">
            {t.fuente}
            {CIFRA_OFERTA.fuente}
          </p>
        </article>
      </div>

      <figure className="pv-grafica">
        <figcaption>
          <strong>{t.grafica}</strong>
          <span>{t.graficaAyuda}</span>
        </figcaption>
        <ul className="pv-leyenda">
          <li>
            <span className="pv-muestra pv-muestra-area" aria-hidden="true" />
            {t.serieArea}
          </li>
          <li>
            <span className="pv-muestra pv-muestra-nacional" aria-hidden="true" />
            {t.serieNacional}
          </li>
        </ul>
        <div className="pv-lienzo" ref={lienzo} onPointerLeave={() => setSobre(null)}>
          <svg
            viewBox={`0 0 ${ANCHO} ${ALTO}`}
            role="img"
            aria-label={t.resumen(porcentaje(min.area, idioma), porcentaje(max.area, idioma), max.anio, porcentaje(ultimo.area, idioma))}
          >
            {MARCAS.map((m) => (
              <g key={m} className="pv-marca">
                <line x1={M.izquierda} x2={ANCHO - M.derecha} y1={y(m)} y2={y(m)} className={m === 0 ? "pv-base" : "pv-rejilla"} />
                <text x={M.izquierda - 8} y={y(m) + 4} textAnchor="end">
                  {idioma === "en" ? `${m}%` : `${m} %`}
                </text>
              </g>
            ))}
            {serie.map((s, i) => {
              const x0 = M.izquierda + i * paso + (paso - ancho * 2 - 2) / 2;
              const activo = sobre === s.anio;
              return (
                <g
                  key={s.anio}
                  className={"pv-grupo" + (sobre !== null && !activo ? " pv-tenue" : "")}
                  onPointerEnter={() => setSobre(s.anio)}
                >
                  <rect x={M.izquierda + i * paso} y={M.arriba} width={paso} height={ALTO - M.arriba - M.abajo} className="pv-toque" />
                  <path d={barra(x0, ancho, y(0), y(s.area))} className="pv-barra pv-barra-area" />
                  <path d={barra(x0 + ancho + 2, ancho, y(0), y(s.nacional))} className="pv-barra pv-barra-nacional" />
                  {rotular(s.anio) && (
                    <text x={x0 + ancho / 2} y={y(s.area) - 7} textAnchor="middle" className="pv-valor pv-valor-area">
                      {porcentaje(s.area, idioma)}
                    </text>
                  )}
                  {s.anio === ultimo.anio && (
                    <text x={x0 + ancho * 1.5 + 2} y={y(s.nacional) - 7 - (Math.abs(y(s.nacional) - y(s.area)) < 14 ? 13 : 0)} textAnchor="middle" className="pv-valor pv-valor-nacional">
                      {porcentaje(s.nacional, idioma)}
                    </text>
                  )}
                  <text x={M.izquierda + i * paso + paso / 2} y={ALTO - M.abajo + 20} textAnchor="middle" className="pv-anio">
                    {s.anio}
                  </text>
                </g>
              );
            })}
          </svg>
          {sobre !== null &&
            (() => {
              const i = serie.findIndex((s) => s.anio === sobre);
              const s = serie[i];
              // El globo se queda dentro del lienzo, también en los años de las puntas.
              const izquierda = Math.min(Math.max(M.izquierda + i * paso + paso / 2, 100), ANCHO - 100);
              return (
                <div className="pv-globo" style={{ left: izquierda }} aria-hidden="true">
                  <strong>{s.anio}</strong>
                  <span>
                    <i className="pv-muestra pv-muestra-area" /> {t.serieArea}: {porcentaje(s.area, idioma)}
                  </span>
                  <span>
                    <i className="pv-muestra pv-muestra-nacional" /> {t.serieNacional}: {porcentaje(s.nacional, idioma)}
                  </span>
                </div>
              );
            })()}
        </div>
        <details className="pv-tabla">
          <summary>{t.tabla}</summary>
          <table>
            <thead>
              <tr>
                <th scope="col">{t.anio}</th>
                <th scope="col">{t.serieArea}</th>
                <th scope="col">{t.serieNacional}</th>
              </tr>
            </thead>
            <tbody>
              {serie.map((s) => (
                <tr key={s.anio}>
                  <th scope="row">{s.anio}</th>
                  <td>{porcentaje(s.area, idioma)}</td>
                  <td>{porcentaje(s.nacional, idioma)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </figure>

      <p className="pv-letra-chica">
        {IPVN.fuente} {IPVN.aclaracion}
      </p>

      <p className="pv-cierre">
        {t.cierre}
        <Link href={ruta(idioma, "/asesoria")}>{t.cierreEnlace} →</Link>
      </p>
    </div>
  );
}
