"use client";

/**
 * Las cuatro gráficas del comparador, en canvas y SVG propios, sin librerías
 * nuevas. Toman la idea de cuatro componentes de 21st.dev que Rafael pasó el
 * 5-oct-2026, no su código (son React con reaviz y motion):
 *
 *  · DonaDither — de «dither-donut-chart»: el puntaje en un anillo sombreado
 *    con trama de un bit (Bayer 4×4) que se mueve con resorte al cambiar.
 *  · BarrasDivergentes — de «stacked-diverging-bar»: los puntos de cada
 *    criterio, A hacia la izquierda y B hacia la derecha, con el total
 *    apilado arriba.
 *  · AreaPlazo — de «area-chart-2»: el ingreso que pide el banco de 5 a 30
 *    años, dos áreas con degradado y lectura al pasar el cursor.
 *  · Columnas — de «value-columns»: columnas simples desde cero, la cifra
 *    encima y la menor resaltada.
 *
 * Cada una tiene su lectura en texto para lectores de pantalla, y con
 * movimiento reducido no se anima.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { movimientoReducido } from "@/lib/motion";

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

// ── La dona con trama ────────────────────────────────────────────────────

export function DonaDither({ valor, color, etiqueta, sobre }: { valor: number; color: string; etiqueta: string; sobre: string }) {
  const lienzo = useRef<HTMLCanvasElement>(null);
  const actual = useRef(0);
  const velocidad = useRef(0);

  useEffect(() => {
    const c = lienzo.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const lado = c.clientWidth || 200;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = Math.round(lado * dpr);
    c.height = Math.round(lado * dpr);
    const fondo = getComputedStyle(c).getPropertyValue("--cmp-pista").trim() || "#e9e2d3";

    const pintar = (frac: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, lado, lado);
      const px = Math.max(2, Math.round(lado / 72));
      const centro = lado / 2;
      const rExt = centro - 2;
      const rInt = rExt * 0.7;
      for (let y = 0; y < lado; y += px) {
        for (let x = 0; x < lado; x += px) {
          const dx = x + px / 2 - centro;
          const dy = y + px / 2 - centro;
          const r = Math.hypot(dx, dy);
          if (r < rInt || r > rExt) continue;
          let ang = Math.atan2(dx, -dy) / (2 * Math.PI);
          if (ang < 0) ang += 1;
          const umbral = (BAYER[(y / px) % 4][(x / px) % 4] + 0.5) / 16;
          if (ang <= frac) {
            // Más denso hacia el borde exterior y hacia la punta del arco.
            const radial = (r - rInt) / (rExt - rInt);
            const densidad = 0.42 + 0.38 * radial + 0.2 * (frac > 0 ? ang / frac : 0);
            if (densidad > umbral) {
              ctx.fillStyle = color;
              ctx.fillRect(x, y, px, px);
            }
          } else if (0.22 > umbral) {
            ctx.fillStyle = fondo;
            ctx.fillRect(x, y, px, px);
          }
        }
      }
    };

    const destino = Math.max(0, Math.min(1, valor / 100));
    if (movimientoReducido()) {
      actual.current = destino;
      pintar(destino);
      return;
    }
    let cuadro = 0;
    const paso = () => {
      // Resorte: rigidez 120, amortiguación 16, a 60 cuadros por segundo.
      const dt = 1 / 60;
      const fuerza = 120 * (destino - actual.current) - 16 * velocidad.current;
      velocidad.current += fuerza * dt;
      actual.current += velocidad.current * dt;
      pintar(Math.max(0, Math.min(1, actual.current)));
      if (Math.abs(destino - actual.current) > 0.0005 || Math.abs(velocidad.current) > 0.0005) {
        cuadro = requestAnimationFrame(paso);
      } else {
        actual.current = destino;
        pintar(destino);
      }
    };
    cuadro = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(cuadro);
  }, [valor, color]);

  return (
    <figure className="cmp-dona" role="img" aria-label={`${etiqueta}: ${Math.round(valor)} ${sobre}`}>
      <canvas ref={lienzo} aria-hidden="true" />
      <figcaption aria-hidden="true">
        <strong>{Math.round(valor)}</strong>
        <span>{sobre}</span>
      </figcaption>
    </figure>
  );
}

// ── Las barras divergentes ───────────────────────────────────────────────

export type FilaDivergente = { clave: string; titulo: string; peso: number; puntosA: number; puntosB: number; textoA: string; textoB: string };

export function BarrasDivergentes({
  filas,
  nombreA,
  nombreB,
  totalA,
  totalB,
  posibles,
  aria,
}: {
  filas: FilaDivergente[];
  nombreA: string;
  nombreB: string;
  totalA: number;
  totalB: number;
  posibles: (peso: string) => string;
  aria: string;
}) {
  const maxPeso = Math.max(1, ...filas.map((f) => f.peso));
  const ancho = (v: number, max: number) => `${Math.max(0, Math.min(100, (100 * v) / max))}%`;
  return (
    <div className="cmp-div">
      <div className="cmp-div-total" role="img" aria-label={aria}>
        <div className="cmp-div-lado cmp-div-lado-a">
          <span className="cmp-div-cifra">{Math.round(totalA)}</span>
          <div className="cmp-div-pila cmp-div-pila-a" aria-hidden="true">
            {filas.map((f, i) => (
              <span key={f.clave} className={`cmp-seg cmp-seg-${i % 2}`} style={{ width: `${f.puntosA}%` }} title={`${f.titulo}: ${f.puntosA.toFixed(1)}`} />
            ))}
          </div>
        </div>
        <div className="cmp-div-lado cmp-div-lado-b">
          <div className="cmp-div-pila cmp-div-pila-b" aria-hidden="true">
            {filas.map((f, i) => (
              <span key={f.clave} className={`cmp-seg cmp-seg-${i % 2}`} style={{ width: `${f.puntosB}%` }} title={`${f.titulo}: ${f.puntosB.toFixed(1)}`} />
            ))}
          </div>
          <span className="cmp-div-cifra">{Math.round(totalB)}</span>
        </div>
      </div>
      <div className="cmp-div-nombres" aria-hidden="true">
        <span>{nombreA}</span>
        <span>{nombreB}</span>
      </div>
      <ul className="cmp-div-filas">
        {filas.map((f) => (
          <li key={f.clave} className="cmp-div-fila">
            <p className="cmp-div-titulo">
              <span>{f.titulo}</span>
              <small>{posibles(f.peso.toFixed(0))}</small>
            </p>
            <span className="cmp-div-valor cmp-div-valor-a">{f.textoA}</span>
            <div className="cmp-div-barra cmp-div-barra-a" aria-hidden="true">
              <span className="cmp-div-pista" style={{ width: ancho(f.peso, maxPeso) }} />
              <span className="cmp-div-lleno" style={{ width: ancho(f.puntosA, maxPeso) }} />
            </div>
            <div className="cmp-div-barra cmp-div-barra-b" aria-hidden="true">
              <span className="cmp-div-pista" style={{ width: ancho(f.peso, maxPeso) }} />
              <span className="cmp-div-lleno" style={{ width: ancho(f.puntosB, maxPeso) }} />
            </div>
            <span className="cmp-div-valor cmp-div-valor-b">{f.textoB}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── El área por plazo ────────────────────────────────────────────────────

const AW = 600;
const AH = 220;

export function AreaPlazo({
  serieA,
  serieB,
  nombreA,
  nombreB,
  formato,
  anios,
  eje,
  aria,
}: {
  serieA: { plazo: number; ingreso: number }[] | null;
  serieB: { plazo: number; ingreso: number }[] | null;
  nombreA: string;
  nombreB: string;
  formato: (n: number) => string;
  anios: (n: number) => string;
  eje: string;
  aria: string;
}) {
  const [cursor, setCursor] = useState<number | null>(null);
  const series = [serieA, serieB].filter((s): s is { plazo: number; ingreso: number }[] => !!s && s.length > 0);
  const base = series[0] ?? [];
  const max = Math.max(1, ...series.flatMap((s) => s.map((p) => p.ingreso))) * 1.08;
  const x = (i: number) => (base.length > 1 ? (i / (base.length - 1)) * AW : 0);
  const y = (v: number) => AH - (v / max) * AH;
  const camino = (s: { ingreso: number }[]) => s.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.ingreso).toFixed(1)}`).join(" ");
  const relleno = (s: { ingreso: number }[]) => `${camino(s)} L${AW},${AH} L0,${AH} Z`;
  const sel = cursor != null ? cursor : base.findIndex((p) => p.plazo === 20);
  const marcas = useMemo(() => base.map((p, i) => ({ p, i })).filter(({ p }) => p.plazo % 5 === 0), [base]);

  if (base.length === 0) return null;

  const mover = (clientX: number, caja: DOMRect) => {
    const i = Math.round(((clientX - caja.left) / caja.width) * (base.length - 1));
    setCursor(Math.max(0, Math.min(base.length - 1, i)));
  };

  return (
    <div className="cmp-area">
      <div className="cmp-area-cabeza" aria-live="polite">
        <p className="cmp-area-plazo">{anios(base[sel]?.plazo ?? 20)}</p>
        {serieA && serieA[sel] && (
          <p className="cmp-area-dato cmp-a">
            <span>{nombreA}</span>
            <strong>{formato(serieA[sel].ingreso)}</strong>
          </p>
        )}
        {serieB && serieB[sel] && (
          <p className="cmp-area-dato cmp-b">
            <span>{nombreB}</span>
            <strong>{formato(serieB[sel].ingreso)}</strong>
          </p>
        )}
      </div>
      <div
        className="cmp-area-lienzo"
        role="img"
        aria-label={aria}
        tabIndex={0}
        onPointerMove={(e) => mover(e.clientX, e.currentTarget.getBoundingClientRect())}
        onPointerDown={(e) => mover(e.clientX, e.currentTarget.getBoundingClientRect())}
        onPointerLeave={() => setCursor(null)}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") setCursor(Math.min(base.length - 1, sel + 1));
          if (e.key === "ArrowLeft") setCursor(Math.max(0, sel - 1));
        }}
      >
        <svg viewBox={`0 0 ${AW} ${AH}`} preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="cmp-grad-a" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--cmp-a)" stopOpacity="0.32" />
              <stop offset="100%" stopColor="var(--cmp-a)" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="cmp-grad-b" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--cmp-b)" stopOpacity="0.42" />
              <stop offset="100%" stopColor="var(--cmp-b)" stopOpacity="0.03" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} className="cmp-area-guia" x1={0} x2={AW} y1={AH * f} y2={AH * f} vectorEffect="non-scaling-stroke" />
          ))}
          {serieB && <path d={relleno(serieB)} fill="url(#cmp-grad-b)" />}
          {serieA && <path d={relleno(serieA)} fill="url(#cmp-grad-a)" />}
          {serieB && <path d={camino(serieB)} className="cmp-area-linea cmp-area-linea-b" vectorEffect="non-scaling-stroke" />}
          {serieA && <path d={camino(serieA)} className="cmp-area-linea cmp-area-linea-a" vectorEffect="non-scaling-stroke" />}
          {sel >= 0 && <line className="cmp-area-cursor" x1={x(sel)} x2={x(sel)} y1={0} y2={AH} vectorEffect="non-scaling-stroke" />}
        </svg>
        {sel >= 0 && serieA?.[sel] && <span className="cmp-area-punto cmp-a" style={{ left: `${(x(sel) / AW) * 100}%`, top: `${(y(serieA[sel].ingreso) / AH) * 100}%` }} />}
        {sel >= 0 && serieB?.[sel] && <span className="cmp-area-punto cmp-b" style={{ left: `${(x(sel) / AW) * 100}%`, top: `${(y(serieB[sel].ingreso) / AH) * 100}%` }} />}
      </div>
      <div className="cmp-area-eje" aria-hidden="true">
        {marcas.map(({ p, i }) => (
          <span key={p.plazo} style={{ left: `${(x(i) / AW) * 100}%` }}>
            {p.plazo}
          </span>
        ))}
      </div>
      <p className="cmp-area-eje-titulo">{eje}</p>
    </div>
  );
}

// ── Las columnas de valor ────────────────────────────────────────────────

export type GrupoColumnas = {
  clave: string;
  titulo: string;
  a: { valor: number | null; texto: string };
  b: { valor: number | null; texto: string };
};

export function Columnas({ grupos, nombreA, nombreB, menor }: { grupos: GrupoColumnas[]; nombreA: string; nombreB: string; menor: string }) {
  return (
    <div className="cmp-cols">
      {grupos.map((g) => {
        const max = Math.max(1, g.a.valor ?? 0, g.b.valor ?? 0);
        const ambos = g.a.valor != null && g.b.valor != null;
        const ganaA = ambos && g.a.valor! < g.b.valor! - 0.5;
        const ganaB = ambos && g.b.valor! < g.a.valor! - 0.5;
        const col = (lado: "a" | "b", d: GrupoColumnas["a"], gana: boolean, nombre: string) => (
          <div className={`cmp-col cmp-col-${lado}${gana ? " cmp-col-hero" : ""}${d.valor == null ? " cmp-col-vacia" : ""}`}>
            <span className="cmp-col-cifra">{d.texto}</span>
            <span className="cmp-col-pozo" aria-hidden="true">
              <span className="cmp-col-barra" style={{ height: d.valor != null ? `${Math.max(4, (100 * d.valor) / max)}%` : "0%" }} />
            </span>
            <span className="cmp-col-nombre">
              {nombre}
              {gana && <em>{menor}</em>}
            </span>
          </div>
        );
        return (
          <figure key={g.clave} className="cmp-cols-grupo">
            <figcaption>{g.titulo}</figcaption>
            <div className="cmp-cols-par">
              {col("a", g.a, ganaA, nombreA)}
              {col("b", g.b, ganaB, nombreB)}
            </div>
          </figure>
        );
      })}
    </div>
  );
}
