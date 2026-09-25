"use client";

/**
 * El mapa ilustrado de la Zona Norte: Cartagena y su corredor norte, dibujado
 * por nosotros en SVG, en tono de mapa turístico.
 *
 * DOS COSAS DISTINTAS CONVIVEN AQUÍ, Y NO SE MEZCLAN:
 *  1. La ilustración —costa, bahía, ciénaga, Vía al Mar, olas, velero— es un
 *     dibujo guiado por OpenStreetMap, no cartografía. Lo dice la leyenda.
 *  2. Los puntos y los rótulos de lugares van en su coordenada verificada de
 *     src/data/zona.ts (lugares y obras) y src/data/proyectos.ts (proyectos).
 *     Un lugar sin coordenada verificada se nombra en la lista, nunca se marca.
 *
 * `progreso` (0 a 1) lo da la sección: 0 muestra la ciudad —el Centro,
 * Bocagrande, Manga y la bahía— y 1 el corredor norte, del aeropuerto a Punta
 * Canoa. En el teléfono (`compacto`) y con menos movimiento, el mapa se queda
 * en el corredor.
 *
 * Tamaños: todo lo que debe medir lo mismo en pantalla a cualquier zoom
 * (íconos, letras, grosores) se multiplica por `u`, las unidades del SVG que
 * ocupa un píxel. Por eso el mapa mide su lienzo.
 */
import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { LUGARES, ROTULOS, type Icono, type Lugar } from "@/data/zona";
import { useReveal } from "@/lib/motion";
import "@/styles/mapa-ilustrado.css";

// ── Proyección ─────────────────────────────────────────────────────────────
// Equirectangular sobre el corredor (a 10,5° N un grado de longitud mide
// 109,2 km y uno de latitud 111 km). Unidad del SVG: 10 metros.
const LON0 = -75.6;
const LAT0 = 10.63;
const KX = 10920;
const KY = 11100;
const x = (lon: number) => Math.round((lon - LON0) * KX * 10) / 10;
const y = (lat: number) => Math.round((LAT0 - lat) * KY * 10) / 10;

type LL = [number, number]; // [lat, lon]
/** Curva suave (Catmull-Rom → Bézier) por los puntos: se lee como dibujo. */
function curva(pts: LL[], cerrada = false): string {
  const p = pts.map(([lat, lon]) => [x(lon), y(lat)]);
  if (cerrada) p.push(p[0], p[1]);
  let d = `M${p[0][0]},${p[0][1]}`;
  for (let i = 0; i < p.length - (cerrada ? 2 : 1); i++) {
    const p0 = p[i - 1] ?? p[i];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0]},${p2[1]}`;
  }
  return cerrada ? d + " Z" : d;
}

// ── La ilustración (guiada por OSM; no es cartografía) ─────────────────────
// El dibujo se extiende bastante más allá de los encuadres: el lienzo cambia
// de proporción con la pantalla y nunca debe asomar un borde vacío.
const BORDE = { oeste: -75.8, este: -75.2, sur: 10.25, norte: 10.75 };

const COSTA: LL[] = [
  [10.383, -75.552], [10.389, -75.566], [10.398, -75.563], [10.41, -75.559], [10.42, -75.555],
  [10.428, -75.55], [10.432, -75.542], [10.436, -75.535], [10.441, -75.527], [10.447, -75.519],
  [10.453, -75.512], [10.46, -75.5072], [10.468, -75.502], [10.476, -75.4968], [10.4865, -75.4925],
  [10.496, -75.4955], [10.506, -75.4985], [10.515, -75.4995], [10.52, -75.4975], [10.5245, -75.4948],
  [10.532, -75.4968], [10.543, -75.4995], [10.551, -75.5018], [10.5568, -75.5035], [10.562, -75.501],
  [10.572, -75.495], [10.585, -75.488], [10.6, -75.48], [10.615, -75.472], [10.63, -75.465],
  [10.66, -75.448], [10.7, -75.425], [10.75, -75.395],
];
const TIERRA =
  curva(COSTA) +
  ` L${x(BORDE.este)},${y(BORDE.norte)} L${x(BORDE.este)},${y(BORDE.sur)} L${x(-75.548)},${y(BORDE.sur)} L${x(-75.548)},${y(10.36)} Z`;
const BAHIA = curva(
  [
    [10.3, -75.575], [10.34, -75.566], [10.372, -75.556], [10.384, -75.549], [10.394, -75.548],
    [10.404, -75.549], [10.413, -75.545], [10.419, -75.539], [10.417, -75.53], [10.409, -75.526],
    [10.397, -75.528], [10.384, -75.527], [10.37, -75.522], [10.34, -75.53], [10.3, -75.535],
  ],
  true,
);
const MANGA = curva(
  [[10.418, -75.538], [10.416, -75.53], [10.409, -75.5295], [10.404, -75.533], [10.407, -75.539], [10.413, -75.5415]],
  true,
);
/** Tierra Bomba, al suroeste de Bocagrande: solo silueta, sin rótulo. */
const TIERRA_BOMBA = curva(
  [
    [10.397, -75.566], [10.392, -75.579], [10.38, -75.588], [10.365, -75.59], [10.352, -75.585],
    [10.35, -75.572], [10.36, -75.563], [10.375, -75.56], [10.388, -75.559],
  ],
  true,
);
const CIENAGA = curva(
  [
    [10.4871, -75.4905], [10.483, -75.4855], [10.478, -75.476], [10.472, -75.466], [10.462, -75.459],
    [10.448, -75.457], [10.433, -75.462], [10.421, -75.47], [10.415, -75.48], [10.418, -75.49],
    [10.428, -75.497], [10.44, -75.502], [10.452, -75.501], [10.464, -75.4985], [10.474, -75.4935],
    [10.481, -75.4915],
  ],
  true,
);
const VIA_AL_MAR = curva([
  [10.425, -75.54], [10.436, -75.532], [10.442, -75.524], [10.449, -75.515], [10.456, -75.508],
  [10.463, -75.5025], [10.471, -75.4975], [10.478, -75.4925], [10.4855, -75.4885], [10.494, -75.4845],
  [10.503, -75.4775], [10.512, -75.4735], [10.5165, -75.4712], [10.526, -75.4675], [10.537, -75.463],
  [10.55, -75.459], [10.565, -75.4545], [10.585, -75.4485], [10.605, -75.442], [10.63, -75.435],
  [10.68, -75.415],
]);
const VIADUCTO = curva([[10.447, -75.508], [10.458, -75.5015], [10.468, -75.496], [10.477, -75.4905]]);
/** Trazado ilustrativo del Gran Malecón del Mar: La Tenaza → Playa Azul (~5,1 km). */
const MALECON = curva([
  [10.4302, -75.5462], [10.4345, -75.5385], [10.4385, -75.5315], [10.443, -75.5245], [10.4485, -75.5175],
  [10.457, -75.5088],
]);

/** Los encuadres: la ciudad, el corredor y el corredor en el teléfono. */
const marco = (oeste: number, este: number, sur: number, norte: number) => ({
  x: x(oeste),
  y: y(norte),
  w: x(este) - x(oeste),
  h: y(sur) - y(norte),
});
const CIUDAD = marco(-75.62, -75.44, 10.345, 10.53);
const CORREDOR = marco(-75.575, -75.425, 10.414, 10.59);
const CORREDOR_MOVIL = marco(-75.535, -75.415, 10.414, 10.59);

/**
 * El agua se rotula como parte del dibujo. «Mar Caribe» acompaña el encuadre
 * (de la ciudad al corredor) para no quedar nunca debajo del panel.
 */
const MAR_CARIBE: { ciudad: LL; corredor: LL; movil: LL } = {
  ciudad: [10.415, -75.593],
  corredor: [10.47, -75.553],
  // En el teléfono la franja de mar es angosta: el rótulo va vertical.
  movil: [10.527, -75.522],
};
const AGUAS: { texto: string; ll: LL; clase: string; px: number }[] = [
  { texto: "Ciénaga de la Virgen", ll: [10.4275, -75.479], clase: "mi-rotulo-agua", px: 10.5 },
  { texto: "Bahía de Cartagena", ll: [10.372, -75.5385], clase: "mi-rotulo-agua", px: 10.5 },
];

/** Olas: posiciones fijas para que el HTML del build y el del navegador coincidan. */
const OLAS: LL[] = [
  [10.585, -75.53], [10.565, -75.552], [10.545, -75.527], [10.525, -75.566], [10.505, -75.53],
  [10.485, -75.552], [10.47, -75.585], [10.445, -75.57], [10.425, -75.588], [10.6, -75.512],
  [10.49, -75.518], [10.405, -75.59], [10.53, -75.515], [10.575, -75.57],
];

export type PinProyecto = {
  slug: string;
  nombre: string;
  lat: number;
  lon: number;
  fuente: string;
  precio: string;
  corte: string | null;
  linea: string | null;
  foto: string | null;
  /** Tiempos reales de trayecto hacia lugares del mapa. Sin tiempos, no hay líneas. */
  tiempos: { lugar: string; minutos: number; fuente: string }[];
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const suave = (t: number) => t * t * (3 - 2 * t);
const n = (v: number) => Number(v.toFixed(2));

export default function MapaIlustrado({
  progreso,
  proyectos,
  compacto = false,
  resaltado = null,
}: {
  progreso: number;
  proyectos: PinProyecto[];
  /** Teléfono: encuadre fijo del corredor y la lista debajo del mapa. */
  compacto?: boolean;
  /** Proyecto resaltado desde fuera (la fila de proyectos). */
  resaltado?: string | null;
}) {
  const [capa, setCapa] = useState<"hoy" | "viene">("hoy");
  const [elegido, setElegido] = useState<string | null>(null);
  const idBase = "mi" + useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const { ref: raiz, armed, visible } = useReveal<HTMLDivElement>(0.2);

  // El lienzo se mide: las letras y los íconos se dibujan a su tamaño real.
  const lienzo = useRef<HTMLDivElement>(null);
  const [tam, setTam] = useState({ w: 560, h: 600 });
  useEffect(() => {
    const el = lienzo.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      if (width > 0 && height > 0) setTam({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const t = compacto ? 1 : suave(Math.max(0, Math.min(1, progreso)));
  const destino = compacto ? CORREDOR_MOVIL : CORREDOR;
  const vb = {
    x: lerp(CIUDAD.x, destino.x, t),
    y: lerp(CIUDAD.y, destino.y, t),
    w: lerp(CIUDAD.w, destino.w, t),
    h: lerp(CIUDAD.h, destino.h, t),
  };
  // Unidades del SVG por píxel de pantalla (preserveAspectRatio «meet»).
  const u = Math.max(vb.w / tam.w, vb.h / tam.h);
  const px = (v: number) => n(v * u);

  const lugaresCapa = (c: "hoy" | "viene") => LUGARES.filter((l) => l.capa === c);
  const deLaCapa = lugaresCapa(capa);
  const seleccion = LUGARES.find((l) => l.id === elegido) ?? null;
  const proyectoElegido = proyectos.find((p) => p.slug === elegido) ?? null;
  const visibles = new Set(deLaCapa.filter((l) => l.coordenada).map((l) => l.id));
  const oculto = armed && !visible;

  const cambiarCapa = (c: "hoy" | "viene") => {
    setCapa(c);
    setElegido(null);
  };
  const alternar = (id: string) => setElegido((actual) => (actual === id ? null : id));

  useEffect(() => {
    if (!elegido) return;
    const cerrar = (e: KeyboardEvent) => e.key === "Escape" && setElegido(null);
    window.addEventListener("keydown", cerrar);
    return () => window.removeEventListener("keydown", cerrar);
  }, [elegido]);

  const panel = (
    <div className="mi-panel" aria-live="polite">
      {seleccion ? (
        <TarjetaLugar lugar={seleccion} alCerrar={() => setElegido(null)} />
      ) : proyectoElegido ? (
        <TarjetaProyecto proyecto={proyectoElegido} alCerrar={() => setElegido(null)} />
      ) : (
        <>
          <p className="mi-panel-titulo">{capa === "hoy" ? "Hoy puedes disfrutar" : "Lo que viene"}</p>
          <ul className="mi-lista" id={`${idBase}-lista`}>
            {deLaCapa.map((l) => (
              <li key={l.id}>
                <button type="button" onClick={() => alternar(l.id)}>
                  <IconoLugar icono={l.icono} />
                  <span className="mi-lista-texto">
                    <span className="mi-lista-nombre">{l.nombreCorto ?? l.nombre}</span>
                    {l.estado && <span className={"mi-estado mi-estado-" + claseEstado(l.estado)}>{l.estado}</span>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );

  return (
    <div
      ref={raiz}
      className={"mi" + (compacto ? " mi-compacto" : "") + (oculto ? " mi-oculto" : "") + (elegido ? " mi-con-eleccion" : "")}
    >
      <div className="mi-pestanas" role="tablist" aria-label="Qué mostrar en el mapa">
        {(["hoy", "viene"] as const).map((c) => (
          <button
            key={c}
            type="button"
            role="tab"
            id={`${idBase}-tab-${c}`}
            aria-selected={capa === c}
            aria-controls={`${idBase}-panel`}
            tabIndex={capa === c ? 0 : -1}
            onClick={() => cambiarCapa(c)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                e.preventDefault();
                const otra = c === "hoy" ? "viene" : "hoy";
                cambiarCapa(otra);
                document.getElementById(`${idBase}-tab-${otra}`)?.focus();
              }
            }}
          >
            {c === "hoy" ? "Hoy puedes disfrutar" : "Lo que viene"}
          </button>
        ))}
      </div>

      <div className="mi-cuerpo" id={`${idBase}-panel`} role="tabpanel" aria-labelledby={`${idBase}-tab-${capa}`}>
        <div className="mi-lienzo" ref={lienzo}>
          <svg
            viewBox={`${vb.x.toFixed(1)} ${vb.y.toFixed(1)} ${vb.w.toFixed(1)} ${vb.h.toFixed(1)}`}
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-labelledby={`${idBase}-titulo`}
          >
            <title id={`${idBase}-titulo`}>
              Mapa ilustrado de Cartagena y su corredor norte, del aeropuerto a Punta Canoa
            </title>
            <defs>
              <linearGradient id={`${idBase}-mar`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#5fb0b7" />
                <stop offset="55%" stopColor="#7fc6c3" />
                <stop offset="100%" stopColor="#a6dbd3" />
              </linearGradient>
              <linearGradient id={`${idBase}-tierra`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#f5eedf" />
                <stop offset="100%" stopColor="#e9dcc0" />
              </linearGradient>
              <pattern id={`${idBase}-manglar`} width="60" height="60" patternUnits="userSpaceOnUse">
                <circle cx="12" cy="14" r="7" fill="#6fa37a" opacity="0.55" />
                <circle cx="42" cy="40" r="8" fill="#5f9870" opacity="0.5" />
                <circle cx="46" cy="10" r="5" fill="#7cae83" opacity="0.5" />
              </pattern>
            </defs>

            {/* Mar, tierra, bahía, islas y ciénaga */}
            <rect
              x={x(BORDE.oeste)}
              y={y(BORDE.norte)}
              width={x(BORDE.este) - x(BORDE.oeste)}
              height={y(BORDE.sur) - y(BORDE.norte)}
              fill={`url(#${idBase}-mar)`}
            />
            <g className="mi-olas" aria-hidden="true">
              {OLAS.map((o, i) => (
                <g key={i} transform={`translate(${x(o[1])},${y(o[0])}) scale(${n(u)})`}>
                  <path d="M0,0 q5,-4 10,0 t10,0 t10,0" style={{ animationDelay: `${(i % 5) * 1.3}s` }} strokeWidth={1.4} />
                </g>
              ))}
            </g>
            <path d={TIERRA} className="mi-tierra" fill={`url(#${idBase}-tierra)`} />
            <path d={curva(COSTA)} className="mi-playa" strokeWidth={px(7)} />
            <path d={curva(COSTA)} className="mi-espuma" strokeWidth={px(1.2)} transform={`translate(${px(-5)},${px(-2)})`} />
            <path d={BAHIA} className="mi-agua" />
            <path d={TIERRA_BOMBA} className="mi-tierra-isla" fill={`url(#${idBase}-tierra)`} strokeWidth={px(1)} />
            <path d={MANGA} className="mi-tierra-isla" fill={`url(#${idBase}-tierra)`} strokeWidth={px(1)} />
            <path d={CIENAGA} className="mi-cienaga" />
            <path d={CIENAGA} fill={`url(#${idBase}-manglar)`} className="mi-manglar-textura" />
            <path d={CIENAGA} className="mi-manglar" strokeWidth={px(5)} strokeDasharray={`${px(2)} ${px(5)}`} />

            {/* Vías */}
            <path d={VIA_AL_MAR} className="mi-via-borde" strokeWidth={px(7)} />
            <path d={VIA_AL_MAR} className="mi-via" strokeWidth={px(3.4)} />
            <path d={VIADUCTO} className="mi-via-borde" strokeWidth={px(7)} />
            <path d={VIADUCTO} className="mi-viaducto" strokeWidth={px(3.4)} strokeDasharray={`${px(6)} ${px(3)}`} />

            {/* Lo que viene: el malecón se dibuja por la costa */}
            <g className={"mi-trazado" + (capa === "viene" ? "" : " mi-trazado-oculto")} aria-hidden={capa !== "viene"}>
              <path d={MALECON} className="mi-malecon-halo" strokeWidth={px(12)} />
              <path d={MALECON} className="mi-malecon" pathLength={1} strokeWidth={px(4.5)} />
              <path
                d={MALECON}
                className="mi-malecon-toque"
                strokeWidth={px(24)}
                onClick={() => alternar("gran-malecon")}
              />
              <g transform={`translate(${x(-75.5125)},${y(10.4452)}) scale(${n(u)})`} className="mi-malecon-etiqueta">
                <text x={8} y={0} className="mi-etiqueta-titulo">
                  Gran Malecón del Mar
                </text>
                <text x={8} y={14} className="mi-etiqueta-fecha">
                  {LUGARES.find((l) => l.id === "gran-malecon")?.etiquetaTrazado}
                </text>
              </g>
            </g>

            {/* Detalles: velero en el mar y canoa en el manglar */}
            <g transform={`translate(${x(-75.532)},${y(10.492)}) scale(${n(u)})`} aria-hidden="true">
              <g className="mi-velero">
                <path d="M0,0 L0,-30 L17,-3 Z" className="mi-vela" />
                <path d="M-3,-5 L0,-26 L-13,-4 Z" className="mi-vela mi-vela-2" />
                <path d="M-17,0 L20,0 L13,8 L-12,8 Z" className="mi-casco" />
              </g>
            </g>
            <g transform={`translate(${x(-75.4845)},${y(10.4665)}) scale(${n(u)})`} aria-hidden="true">
              <g className="mi-canoa">
                <path d="M-14,0 Q0,8 14,0 L11,-2 Q0,4 -11,-2 Z" className="mi-casco" />
                <path d="M-3,-1 L7,-13" className="mi-remo" />
              </g>
            </g>

            {/* Rótulos: el agua como dibujo; barrios y pueblos en su coordenada */}
            <g className="mi-rotulos" aria-hidden="true">
              {compacto ? (
                <text
                  x={x(MAR_CARIBE.movil[1])}
                  y={y(MAR_CARIBE.movil[0])}
                  className="mi-rotulo-mar"
                  fontSize={px(15)}
                  transform={`rotate(-90 ${x(MAR_CARIBE.movil[1])} ${y(MAR_CARIBE.movil[0])})`}
                >
                  Mar Caribe
                </text>
              ) : (
                <text
                  x={n(lerp(x(MAR_CARIBE.ciudad[1]), x(MAR_CARIBE.corredor[1]), t))}
                  y={n(lerp(y(MAR_CARIBE.ciudad[0]), y(MAR_CARIBE.corredor[0]), t))}
                  className="mi-rotulo-mar"
                  fontSize={px(17)}
                >
                  Mar Caribe
                </text>
              )}
              {AGUAS.map((r) => (
                <text
                  key={r.texto}
                  x={x(r.ll[1])}
                  y={y(r.ll[0])}
                  className={r.clase}
                  fontSize={px(r.px)}
                  strokeWidth={px(2.5)}
                >
                  {r.texto}
                </text>
              ))}
              {ROTULOS.map((r) => {
                const cede = r.cedeA ? visibles.has(r.cedeA) : false;
                // Los barrios son la ciudad y los pueblos el corredor: cada
                // grupo se ve en su encuadre.
                const opacidad = r.tipo === "barrio" ? 1 - t : t;
                return (
                  <g
                    key={r.nombre}
                    transform={`translate(${x(r.coordenada.lon)},${y(r.coordenada.lat)}) scale(${n(u)})`}
                    className={"mi-rotulo-lugar mi-rotulo-" + r.tipo + (cede ? " mi-cede" : "")}
                    style={cede ? undefined : { opacity: n(Math.min(1, opacidad * 1.6)) }}
                  >
                    <circle r={2.6} />
                    <text x={6} y={4}>
                      {r.nombre}
                    </text>
                  </g>
                );
              })}
              <text
                x={x(-75.4502)}
                y={y(10.5635)}
                className="mi-rotulo-via"
                fontSize={px(10)}
                transform={`rotate(-73 ${x(-75.4502)} ${y(10.5635)})`}
              >
                Vía al Mar
              </text>
              <text
                x={x(-75.4905)}
                y={y(10.4525)}
                className={"mi-rotulo-viaducto" + (capa === "hoy" ? "" : " mi-cede")}
                fontSize={px(9.5)}
                strokeWidth={px(3)}
                transform={`rotate(-60 ${x(-75.4905)} ${y(10.4525)})`}
              >
                Viaducto del Gran Manglar
              </text>
            </g>

            {/* Puntos: las dos capas quedan montadas para que una se apague y
                la otra entre escalonada */}
            {(["hoy", "viene"] as const).map((c) => (
              <g
                key={c}
                className={"mi-puntos" + (capa === c ? "" : " mi-capa-oculta")}
                aria-hidden={capa !== c}
              >
                {lugaresCapa(c)
                  .filter((l) => l.coordenada)
                  .map((l, i) => (
                    <PuntoMapa
                      key={l.id}
                      lugar={l}
                      u={u}
                      i={i}
                      activa={capa === c}
                      activo={elegido === l.id}
                      alElegir={() => alternar(l.id)}
                    />
                  ))}
              </g>
            ))}

            {/* Tiempos de trayecto del proyecto elegido: solo con tiempos reales */}
            {proyectoElegido && proyectoElegido.tiempos.length > 0 && (
              <g className="mi-trayectos" aria-hidden="true">
                {proyectoElegido.tiempos.map((tr) => {
                  const destinoLugar = LUGARES.find((l) => l.id === tr.lugar)?.coordenada;
                  if (!destinoLugar) return null;
                  const x1 = x(proyectoElegido.lon);
                  const y1 = y(proyectoElegido.lat);
                  const x2 = x(destinoLugar.lon);
                  const y2 = y(destinoLugar.lat);
                  return (
                    <g key={tr.lugar}>
                      <line x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={px(1.6)} strokeDasharray={`${px(4)} ${px(4)}`} />
                      <text x={(x1 + x2) / 2} y={(y1 + y2) / 2} fontSize={px(10.5)}>
                        {tr.minutos} min
                      </text>
                    </g>
                  );
                })}
              </g>
            )}

            {/* Proyectos: en las dos capas, solo con coordenada verificada */}
            <g className="mi-proyectos">
              {proyectos.map((p) => (
                <g
                  key={p.slug}
                  transform={`translate(${x(p.lon)},${y(p.lat)}) scale(${n(u)})`}
                  className={"mi-proyecto" + (elegido === p.slug || resaltado === p.slug ? " activo" : "")}
                  role="button"
                  tabIndex={0}
                  aria-label={`${p.nombre}: ver detalle`}
                  onClick={() => alternar(p.slug)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      alternar(p.slug);
                    }
                  }}
                >
                  <circle r={15} className="mi-proyecto-halo" />
                  <circle r={8} className="mi-proyecto-punto" />
                  <text y={-15} className="mi-proyecto-nombre">
                    {p.nombre}
                  </text>
                </g>
              ))}
            </g>
          </svg>

          <span className="mi-direccion mi-direccion-norte" aria-hidden="true">
            hacia Barranquilla ↗
          </span>
          <span className="mi-direccion mi-direccion-sur" style={{ opacity: n(t) }} aria-hidden="true">
            ↙ hacia el Centro Histórico
          </span>
          <span className="mi-rosa" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="26" height="26">
              <path d="M12 2l3.2 10H8.8z" fill="currentColor" />
              <path d="M12 22l-3.2-10h6.4z" fill="currentColor" opacity="0.35" />
            </svg>
            N
          </span>
          {!compacto && panel}
        </div>

        <p className="mi-leyenda">Ilustración guiada por OpenStreetMap; los puntos van en su coordenada verificada.</p>
        {compacto && panel}
      </div>
    </div>
  );
}

function claseEstado(e: NonNullable<Lugar["estado"]>) {
  return e === "Entregado" ? "entregado" : e === "En obra" ? "obra" : "estudio";
}

function TarjetaLugar({ lugar, alCerrar }: { lugar: Lugar; alCerrar: () => void }) {
  return (
    <div className="mi-tarjeta" role="group" aria-label={lugar.nombre}>
      <button type="button" className="mi-tarjeta-volver" onClick={alCerrar}>
        ← Ver la lista
      </button>
      {lugar.estado && <span className={"mi-estado mi-estado-" + claseEstado(lugar.estado)}>{lugar.estado}</span>}
      <strong>{lugar.nombre}</strong>
      <p>{lugar.frase}</p>
      {lugar.id === "gran-malecon" && <p className="mi-tarjeta-nota">Trazado ilustrativo sobre la costa.</p>}
      <small>
        {lugar.coordenada && (
          <>
            Coordenada verificada · {lugar.coordenada.fuente}.
            <br />
          </>
        )}
        Fuente: {lugar.fuente} · {lugar.fecha}
      </small>
    </div>
  );
}

function TarjetaProyecto({ proyecto, alCerrar }: { proyecto: PinProyecto; alCerrar: () => void }) {
  return (
    <div className="mi-tarjeta mi-tarjeta-proyecto" role="group" aria-label={proyecto.nombre}>
      <button type="button" className="mi-tarjeta-volver" onClick={alCerrar}>
        ← Ver la lista
      </button>
      {proyecto.foto && <img src={proyecto.foto} alt="" loading="lazy" decoding="async" />}
      <strong>{proyecto.nombre}</strong>
      {proyecto.linea && <p>{proyecto.linea}</p>}
      <p className="mi-tarjeta-precio">
        {proyecto.precio}
        {proyecto.corte && <small> · corte {proyecto.corte}</small>}
      </p>
      <Link href={`/proyectos/${proyecto.slug}`}>Ver proyecto →</Link>
      <small>Coordenada verificada · {proyecto.fuente}</small>
    </div>
  );
}

function PuntoMapa({
  lugar,
  u,
  i,
  activa,
  activo,
  alElegir,
}: {
  lugar: Lugar;
  u: number;
  i: number;
  activa: boolean;
  activo: boolean;
  alElegir: () => void;
}) {
  const c = lugar.coordenada!;
  return (
    <g
      transform={`translate(${x(c.lon)},${y(c.lat)}) scale(${n(u)})`}
      className={"mi-punto" + (activo ? " activo" : "") + (lugar.estado ? " mi-punto-" + claseEstado(lugar.estado) : "")}
      style={{ "--i": i } as React.CSSProperties}
      role="button"
      tabIndex={activa ? 0 : -1}
      aria-label={`${lugar.nombre}: ver detalle`}
      onClick={alElegir}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          alElegir();
        }
      }}
    >
      <g className="mi-punto-cuerpo">
        <ellipse cx={0} cy={15} rx={9} ry={2.6} className="mi-punto-sombra" />
        <circle r={13} className="mi-punto-fondo" />
        <g transform="translate(-8,-8) scale(0.6667)" className="mi-punto-glifo">
          <GlifoLugar icono={lugar.icono} />
        </g>
        <text y={29} className="mi-punto-nombre">
          {lugar.nombreCorto ?? lugar.nombre}
        </text>
      </g>
    </g>
  );
}

/** Los glifos de los puntos, en trazo cálido (24 × 24). */
function GlifoLugar({ icono }: { icono: Icono }) {
  const trazo = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (icono) {
    case "playa":
      return (
        <g {...trazo}>
          <path d="M4 20h16M12 20V9M4 9a8 5 0 0 1 16 0z" />
          <circle cx="19" cy="4" r="2" />
        </g>
      );
    case "canoa":
      return (
        <g {...trazo}>
          <path d="M2 14q10 6 20 0M5 16q7 3 14 0M9 13l7-9" />
        </g>
      );
    case "avion":
      return (
        <g {...trazo}>
          <path d="M3 13l18-7-5 14-3-6zM13 14l-4 5" />
        </g>
      );
    case "hospital":
      return (
        <g {...trazo}>
          <rect x="4" y="4" width="16" height="16" rx="3" />
          <path d="M12 8v8M8 12h8" />
        </g>
      );
    case "convenciones":
      return (
        <g {...trazo}>
          <path d="M3 9l9-5 9 5M5 9v9M9.5 9v9M14.5 9v9M19 9v9M3 19h18" />
        </g>
      );
    case "centro":
      return (
        <g {...trazo}>
          <path d="M6 8h12l-1 12H7zM9 8a3 3 0 0 1 6 0" />
        </g>
      );
    default:
      return (
        <g {...trazo}>
          <path d="M3 20h18M6 20l3-12h6l3 12M10 12h4M9 16h6" />
        </g>
      );
  }
}

function IconoLugar({ icono }: { icono: Icono }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" className="mi-lista-icono">
      <GlifoLugar icono={icono} />
    </svg>
  );
}
