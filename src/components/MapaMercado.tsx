"use client";

/**
 * EL MAPA DE OBRAS Y ENTORNO (Inteligencia de mercado, 14-oct-2026).
 *
 * Pedido de Rafael: un mapa «pro», como el selector de direcciones de Nepal de
 * 21st.dev, que muestre dónde están sus opciones y qué se construye
 * alrededor. Como allá: regiones de color que se tocan para acercarse, y
 * dentro de cada una sus puntos. Es SVG propio, sin teselas ni pedidos a
 * terceros (la CSP no cambia).
 *
 * LO QUE AFIRMA Y LO QUE NO (projects/inmobiliaria/copy-del-mapa-de-obras-y-
 * entorno-que-publicamos-y-que-no, en el vault):
 *  · El dibujo —costa, bahía, ciénaga, vías— es una ilustración guiada por
 *    OpenStreetMap (src/lib/geografia.ts), y la leyenda lo dice.
 *  · Las zonas son una agrupación nuestra, no límites oficiales: sus bordes
 *    entre sí no se dibujan como línea.
 *  · Cada punto va en su coordenada verificada, con su fuente en la tarjeta.
 *    Una opción sin coordenada verificada va en la lista con su dirección
 *    publicada, nunca en el centro de un sector.
 *  · Nada de valorización: ni «+%», ni flechas, ni tasas. El precio sale de la
 *    capa de datos con su corte (o «Consultar»), igual que en la cartera.
 *  · La costa del Atlántico va en un recuadro, en esquema y sin escala: la
 *    costa de Natural Earth dejaba Agua Marina 2 km tierra adentro.
 *
 * Tamaños: lo que debe medir lo mismo en pantalla a cualquier acercamiento
 * (pines, letras, grosores) se multiplica por `u`, las unidades del SVG que
 * ocupa un píxel. Por eso el mapa mide su lienzo (como MapaIlustrado.tsx).
 */
import { useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Coordenada } from "@/data/zona";
import type { EstadoObra, ZonaId } from "@/data/mercado";
import type { Idioma } from "@/i18n/idioma";
import { mercado } from "@/i18n/modulos/mercado";
import { zona as moduloZona } from "@/i18n/modulos/zona";
import {
  BORDE,
  COSTA,
  PUNTOS_BAHIA,
  PUNTOS_CIENAGA,
  PUNTOS_MALECON,
  PUNTOS_MANGA,
  PUNTOS_TIERRA_BOMBA,
  PUNTOS_VIA_AL_MAR,
  PUNTOS_VIADUCTO,
  curvaPor,
} from "@/lib/geografia";
import {
  ENCUADRES,
  FORMAS,
  ROTULO_ZONA,
  anchoTexto,
  cruzan,
  mezclar,
  px,
  py,
  suavizar,
  ubicarEtiquetas,
  type Caja,
  type Etiquetable,
  type LL,
  type Marco,
  type Ubicada,
} from "@/lib/mapa-mercado";
import { usePrefersReducedMotion } from "@/lib/motion";
import "@/styles/mapa-mercado.css";

/** Una opción de la cartera, ya armada en el servidor (PaginaMercado.tsx) desde la capa de datos. */
export type OpcionMapa = {
  slug: string;
  nombre: string;
  origen: "proyecto" | "apartamento";
  zona: ZonaId;
  /** «En construcción», «Terminado»… ya en el idioma de la página. */
  estado: string;
  /** «desde $403.000.000» o «Consultar»: sale de fichaDe / fichaDeInmueble. */
  precio: string;
  muestraPrecio: boolean;
  corte: string | null;
  /** El área con su etiqueta literal; `conflicto`: las fuentes del promotor no coinciden. */
  area: { texto: string; etiquetas: string[]; conflicto: boolean } | null;
  /** La ubicación publicada; null si el promotor no la publica. */
  ubicacion: string | null;
  href: string;
  verTexto: string;
  foto: { src: string; alt: string } | null;
  /** Solo con coordenada verificada (proyectos.ts / inmuebles.ts). */
  coordenada: { lat: number; lon: number; fuente: string } | null;
};

type Clase = "entregado" | "obra" | "anunciado" | "estudio";
const CLASE: Record<EstadoObra, Clase> = {
  Entregado: "entregado",
  "En obra": "obra",
  Anunciado: "anunciado",
  "En estudio": "estudio",
};
const ORDEN_ESTADO: EstadoObra[] = ["Entregado", "En obra", "Anunciado", "En estudio"];

const TEXTOS = {
  es: {
    titulo: "Mapa de obras y entorno de Cartagena, la Zona Norte, el corredor a Turbaco y la costa del Atlántico",
    elige: "Elige una zona",
    eligeAyuda: "Tócala en el mapa o en esta lista para acercarte.",
    todas: "← Todas las zonas",
    todasOpciones: "Todas nuestras opciones",
    opciones: (n: number) => (n === 1 ? "1 opción" : `${n} opciones`),
    obras: (n: number) => (n === 1 ? "1 obra" : `${n} obras`),
    nuestras: "Nuestras opciones aquí",
    sinOpciones: "En esta zona seguimos las obras; nuestras opciones están en las otras.",
    notaPuntos: "En el mapa marcamos el punto exacto cuando lo verificamos; las demás opciones van con la dirección publicada.",
    tituloObras: "Obras",
    funciona: "Lo que ya funciona",
    estado: { Entregado: "Entregado", "En obra": "En obra", Anunciado: "Anunciado", "En estudio": "En estudio" } as Record<EstadoObra, string>,
    corte: "corte ",
    consultar: "Consultar",
    ubicacion: "Ubicación: ",
    ubicacionPendiente: "Ubicación exacta por confirmar con el promotor",
    punto: "Punto en el mapa: ",
    areaConflicto: " (las fuentes del promotor publican cifras distintas)",
    verEnMapa: "Ver en el mapa",
    enMapa: "En el mapa",
    fuente: "Fuente: ",
    cerrar: "Cerrar",
    verDetalle: (nombre: string) => `${nombre}: ver detalle`,
    verZona: (nombre: string) => `${nombre}: acercar el mapa a esta zona`,
    marCaribe: "Mar Caribe",
    cienaga: "Ciénaga de la Virgen",
    bahia: "Bahía de Cartagena",
    viaAlMar: "Vía al Mar",
    malecon: "Gran Malecón del Mar (trazado ilustrativo)",
    recuadroTitulo: "Costa del Atlántico",
    recuadroLugar: "Juan de Acosta",
    recuadroCartagena: "↙ Cartagena",
    recuadroBarranquilla: "Barranquilla ↗",
    esquema: "Esquema, sin escala",
    leyendaOpcion: "Nuestras opciones",
    leyendaLugar: "Lo que ya funciona",
    norte: "N",
    acercado: (zona: string) => `Mapa acercado a ${zona}.`,
    general: "Mapa de todas las zonas.",
  },
  en: {
    titulo: "Map of public works and surroundings in Cartagena, the Zona Norte, the Turbaco corridor and the Atlántico coast",
    elige: "Choose an area",
    eligeAyuda: "Tap it on the map or in this list to zoom in.",
    todas: "← All areas",
    todasOpciones: "All our options",
    opciones: (n: number) => (n === 1 ? "1 option" : `${n} options`),
    obras: (n: number) => (n === 1 ? "1 public work" : `${n} public works`),
    nuestras: "Our options here",
    sinOpciones: "Here we follow the public works; our options are in the other areas.",
    notaPuntos: "We mark a property's exact point once we verify it; the other options are listed with their published address.",
    tituloObras: "Public works",
    funciona: "Already up and running",
    estado: { Entregado: "Completed", "En obra": "Under construction", Anunciado: "Announced", "En estudio": "Under study" } as Record<EstadoObra, string>,
    corte: "price as of ",
    consultar: "Price on request",
    ubicacion: "Location: ",
    ubicacionPendiente: "Exact location to be confirmed with the developer",
    punto: "Point on the map: ",
    areaConflicto: " (the developer's sources give different figures)",
    verEnMapa: "Show on the map",
    enMapa: "On the map",
    fuente: "Source: ",
    cerrar: "Close",
    verDetalle: (nombre: string) => `${nombre}: view details`,
    verZona: (nombre: string) => `${nombre}: zoom the map to this area`,
    marCaribe: "Caribbean Sea",
    cienaga: "Ciénaga de la Virgen",
    bahia: "Bahía de Cartagena",
    viaAlMar: "Vía al Mar",
    malecon: "Gran Malecón del Mar (illustrative route)",
    recuadroTitulo: "Atlántico coast",
    recuadroLugar: "Juan de Acosta",
    recuadroCartagena: "↙ Cartagena",
    recuadroBarranquilla: "Barranquilla ↗",
    esquema: "Diagram, not to scale",
    leyendaOpcion: "Our options",
    leyendaLugar: "Already up and running",
    norte: "N",
    acercado: (zona: string) => `Map zoomed in to ${zona}.`,
    general: "Map of all areas.",
  },
};

// ── El dibujo, en unidades del SVG (10 m) ───────────────────────────────────
const c = (pts: LL[], cerrada = false) => curvaPor(pts, px, py, cerrada);
const TIERRA =
  c(COSTA) +
  ` L${px(BORDE.este)},${py(BORDE.norte)} L${px(BORDE.este)},${py(BORDE.sur)} L${px(-75.548)},${py(BORDE.sur)} L${px(-75.548)},${py(10.36)} Z`;
const BAHIA = c(PUNTOS_BAHIA, true);
const MANGA = c(PUNTOS_MANGA, true);
const TIERRA_BOMBA = c(PUNTOS_TIERRA_BOMBA, true);
const CIENAGA = c(PUNTOS_CIENAGA, true);
const VIA_AL_MAR = c(PUNTOS_VIA_AL_MAR);
const VIADUCTO = c(PUNTOS_VIADUCTO);
const MALECON = c(PUNTOS_MALECON);
type ZonaPrincipal = Exclude<ZonaId, "costa-atlantico">;
const ZONAS_PRINCIPALES: ZonaPrincipal[] = ["zona-norte", "ciudad", "corredor-turbaco"];
/** Las zonas, con curvas suaves por sus vértices (src/lib/mapa-mercado.ts, FORMAS). */
const FORMA_D: Record<ZonaPrincipal, string> = {
  "zona-norte": c(FORMAS["zona-norte"], true),
  ciudad: c(FORMAS.ciudad, true),
  "corredor-turbaco": c(FORMAS["corredor-turbaco"], true),
};
const LIENZO = { x: px(BORDE.oeste), y: py(BORDE.norte), w: px(BORDE.este) - px(BORDE.oeste), h: py(BORDE.sur) - py(BORDE.norte) };

/** Dónde se rotula el agua (dibujo). */
const AGUAS: { clave: "cienaga" | "bahia"; ll: LL; zonas: ZonaId[] }[] = [
  { clave: "cienaga", ll: [10.4265, -75.481], zonas: ["ciudad", "corredor-turbaco"] },
  { clave: "bahia", ll: [10.372, -75.5385], zonas: ["ciudad"] },
];
/** Dónde se rotula el mar en cada encuadre: sobre el agua y dentro del cuadro (en el corredor no se ve). */
const MAR: Record<"general" | ZonaPrincipal, LL | null> = {
  general: [10.47, -75.565],
  "zona-norte": [10.5, -75.537],
  ciudad: [10.47, -75.565],
  "corredor-turbaco": null,
};

const n2 = (v: number) => Number(v.toFixed(2));

type Item = {
  id: string;
  zona: ZonaId;
  nombre: string;
  frase: string;
  estado: EstadoObra | null;
  coordenada: Coordenada | null;
  fuente: string;
  fecha: string;
};

type Elegido = { tipo: "opcion" | "obra" | "lugar"; id: string } | null;

export default function MapaMercado({ opciones, idioma = "es" }: { opciones: OpcionMapa[]; idioma?: Idioma }) {
  const t = TEXTOS[idioma];
  const { ZONAS, OBRAS, ZONA_DE_LUGAR, ROTULOS_MAPA, NOTA_MAPA_MERCADO, NOTA_OBRAS } = mercado(idioma);
  const { LUGARES, ROTULOS } = moduloZona(idioma);
  /** Los nombres de barrio y de pueblo: los de zona.ts y los que solo usa este mapa. */
  const rotulos = useMemo(
    () => [
      ...ROTULOS.map((r) => ({
        nombre: r.nombre,
        zona: (r.tipo === "barrio" ? "ciudad" : "zona-norte") as ZonaId,
        coordenada: r.coordenada,
      })),
      ...ROTULOS_MAPA,
    ],
    [ROTULOS, ROTULOS_MAPA],
  );
  const base = "mm" + useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const reducido = usePrefersReducedMotion();

  const [activa, setActiva] = useState<ZonaId | null>(null);
  const [sobre, setSobre] = useState<ZonaId | null>(null);
  const [elegido, setElegido] = useState<Elegido>(null);
  const [globo, setGlobo] = useState<{ x: number; y: number; titulo: string; sub?: string } | null>(null);

  // ── Obras y lugares, por zona ──
  const { obras, lugares } = useMemo(() => {
    const deZona = (id: string): ZonaId => ZONA_DE_LUGAR[id] ?? "zona-norte";
    const obras: Item[] = [
      ...LUGARES.filter((l) => l.estado).map((l) => ({
        id: l.id,
        zona: deZona(l.id),
        nombre: l.nombre,
        frase: l.frase,
        estado: l.estado as EstadoObra,
        coordenada: l.coordenada,
        fuente: l.fuente,
        fecha: l.fecha,
      })),
      ...OBRAS.filter((o) => o.estado).map((o) => ({ ...o })),
    ].sort((a, b) => ORDEN_ESTADO.indexOf(a.estado!) - ORDEN_ESTADO.indexOf(b.estado!));
    const lugares: Item[] = [
      ...LUGARES.filter((l) => !l.estado).map((l) => ({
        id: l.id,
        zona: deZona(l.id),
        nombre: l.nombreCorto ?? l.nombre,
        frase: l.frase,
        estado: null,
        coordenada: l.coordenada,
        fuente: l.fuente,
        fecha: l.fecha,
      })),
      ...OBRAS.filter((o) => !o.estado).map((o) => ({ ...o })),
    ];
    return { obras, lugares };
  }, [LUGARES, OBRAS, ZONA_DE_LUGAR]);

  const cuenta = (z: ZonaId) => ({
    opciones: opciones.filter((o) => o.zona === z).length,
    obras: obras.filter((o) => o.zona === z).length,
  });
  /** «2 opciones · 6 obras»; lo que está en cero no se nombra. */
  const resumen = (z: ZonaId) => {
    const k = cuenta(z);
    return [k.opciones > 0 ? t.opciones(k.opciones) : null, k.obras > 0 ? t.obras(k.obras) : null].filter(Boolean).join(" · ");
  };

  // ── El encuadre: se anima hacia el de la zona activa ──
  const destino: Marco = activa && activa !== "costa-atlantico" ? ENCUADRES[activa] : ENCUADRES.general;
  const [enVuelo, setEnVuelo] = useState<Marco | null>(null);
  const ultimo = useRef<Marco>(ENCUADRES.general);
  const cuadro = useRef(0);
  useEffect(() => {
    cancelAnimationFrame(cuadro.current);
    const desde = ultimo.current;
    if (reducido) {
      ultimo.current = destino;
      return;
    }
    const t0 = performance.now();
    const duracion = 650;
    const paso = (ahora: number) => {
      const k = Math.min(1, (ahora - t0) / duracion);
      const m = mezclar(desde, destino, suavizar(k));
      ultimo.current = m;
      setEnVuelo(k < 1 ? m : null);
      if (k < 1) cuadro.current = requestAnimationFrame(paso);
    };
    cuadro.current = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(cuadro.current);
    // `destino` sale de `activa`: animar cuando cambia la zona.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activa, reducido]);
  const vb = enVuelo ?? destino;

  // ── El lienzo se mide: los pines y las letras se dibujan a su tamaño real ──
  const lienzo = useRef<HTMLDivElement>(null);
  const [tam, setTam] = useState({ w: 560, h: 680 });
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
  const u = Math.max(vb.w / tam.w, vb.h / tam.h);
  const s = (v: number) => n2(v * u);

  // ── En el teléfono la leyenda va debajo del mapa, no encima ──
  const [movil, setMovil] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(max-width: 640px)");
    const alCambiar = () => setMovil(mq.matches);
    alCambiar();
    mq.addEventListener?.("change", alCambiar);
    return () => mq.removeEventListener?.("change", alCambiar);
  }, []);

  /**
   * Las etiquetas, ubicadas para el encuadre de llegada (no cuadro a cuadro):
   * de qué lado va el nombre de cada pin y, en la zona acercada, dónde cabe el
   * nombre de cada obra, lugar y barrio sin pisar otro (src/lib/mapa-mercado.ts).
   */
  const etiquetas = useMemo(() => {
    const ue = Math.max(destino.w / tam.w, destino.h / tam.h);
    const ox = (tam.w - destino.w / ue) / 2;
    const oy = (tam.h - destino.h / ue) / 2;
    const enPantalla = (lat: number, lon: number) => ({
      x: ox + (px(lon) - destino.x) / ue,
      y: oy + (py(lat) - destino.y) / ue,
    });
    const LETRA_PIN = 11.5;
    const ladoPin = new Map<string, "derecha" | "izquierda">();
    const ubicadas = new Map<string, Ubicada>();
    const obstaculos: Caja[] = [
      // El acceso a la costa del Atlántico (arriba a la izquierda) y la rosa (arriba a la derecha).
      { x: 0, y: 0, w: Math.min(260, tam.w * 0.62), h: 48 },
      { x: tam.w - 60, y: 0, w: 60, h: 42 },
    ];
    // La leyenda, abajo a la izquierda, cuando va encima del mapa.
    if (!movil) obstaculos.push({ x: 0, y: tam.h - 54, w: Math.min(500, tam.w), h: 54 });
    // En la vista general, los rótulos de las zonas (nombre y cuenta).
    const cajasPin: Caja[] = [];
    if (activa === null) {
      for (const z of ZONAS_PRINCIPALES) {
        const [lat, lon] = ROTULO_ZONA[z];
        const p = enPantalla(lat, lon);
        const nombre = ZONAS.find((x) => x.id === z)?.rotulo ?? "";
        const w = Math.max(nombre.length * 17 * 0.5, 24 * 10.5 * 0.6);
        cajasPin.push({ x: p.x - w / 2, y: p.y - 15, w, h: 36 });
      }
    }
    // El nombre de cada pin va a la derecha; a la izquierda si a la derecha no cabe.
    for (const o of opciones) {
      if (!o.coordenada || o.zona === "costa-atlantico") continue;
      const p = enPantalla(o.coordenada.lat, o.coordenada.lon);
      const w = anchoTexto(o.nombre, LETRA_PIN) * 1.05;
      const derecha: Caja = { x: p.x + 13, y: p.y - 14 - LETRA_PIN, w, h: LETRA_PIN * 1.4 };
      const izquierda: Caja = { ...derecha, x: p.x - 13 - w };
      const enLienzo = (k: Caja) => k.x >= 6 && k.x + k.w <= tam.w - 6;
      const libre = (k: Caja) => enLienzo(k) && !cajasPin.some((c) => cruzan(k, c));
      // A la derecha si está libre; si no, a la izquierda si lo está; si ninguno, donde no se corte.
      const cabe = libre(derecha) || (!libre(izquierda) && enLienzo(derecha));
      ladoPin.set(o.slug, cabe ? "derecha" : "izquierda");
      obstaculos.push({ x: p.x - 11, y: p.y - 30, w: 22, h: 31 });
      if (activa === null || activa === o.zona) {
        const caja = cabe ? derecha : izquierda;
        cajasPin.push(caja);
        obstaculos.push(caja);
      }
    }
    if (activa === null || activa === "costa-atlantico") return { ladoPin, ubicadas };

    // El rótulo de la Vía al Mar, casi vertical, en la Zona Norte.
    if (activa === "zona-norte") {
      const v = enPantalla(10.5635, -75.4502);
      obstaculos.push({ x: v.x - 10, y: v.y - 46, w: 20, h: 92 });
    }
    // El orden es el de la importancia: las obras, los nombres de lugar (que
    // no se mueven de su punto) y lo que ya funciona (que busca hueco).
    const items: Etiquetable[] = [];
    for (const o of obras) {
      if (o.zona !== activa || !o.coordenada) continue;
      const p = enPantalla(o.coordenada.lat, o.coordenada.lon);
      obstaculos.push({ x: p.x - 9, y: p.y - 9, w: 18, h: 18 });
      items.push({ id: "obra:" + o.id, ...p, texto: o.nombre, radio: 9 });
    }
    for (const r of rotulos) {
      if (r.zona !== activa) continue;
      const p = enPantalla(r.coordenada.lat, r.coordenada.lon);
      items.push({ id: "rotulo:" + r.nombre, ...p, texto: r.nombre, radio: 0, centrada: true });
    }
    for (const l of lugares) {
      if (l.zona !== activa || !l.coordenada) continue;
      const p = enPantalla(l.coordenada.lat, l.coordenada.lon);
      obstaculos.push({ x: p.x - 5, y: p.y - 5, w: 10, h: 10 });
      items.push({ id: "lugar:" + l.id, ...p, texto: l.nombre, radio: 5 });
    }
    for (const [id, ub] of ubicarEtiquetas(items, obstaculos, { x: 4, y: 4, w: tam.w - 8, h: tam.h - 8 })) {
      ubicadas.set(id, ub);
    }
    return { ladoPin, ubicadas };
  }, [activa, destino, tam, movil, opciones, obras, lugares, rotulos, ZONAS]);
  /** Las etiquetas aparecen cuando el mapa termina de acercarse. */
  const quieto = enVuelo === null;

  // ── Escape: primero suelta lo elegido; después vuelve a todas las zonas ──
  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (elegido) setElegido(null);
      else if (activa) setActiva(null);
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [elegido, activa]);

  const panel = useRef<HTMLDivElement>(null);
  const irAZona = (z: ZonaId | null) => {
    setActiva(z);
    setElegido(null);
    setGlobo(null);
    panel.current?.scrollTo?.({ top: 0 });
  };
  const elegir = (e: NonNullable<Elegido>, z: ZonaId) => {
    if (activa !== z) setActiva(z);
    setElegido((a) => (a && a.tipo === e.tipo && a.id === e.id ? null : e));
  };

  // La tarjeta elegida entra en vista dentro del panel.
  useEffect(() => {
    if (!elegido) return;
    const el = panel.current?.querySelector<HTMLElement>(`[data-id="${elegido.tipo}:${elegido.id}"]`);
    el?.scrollIntoView?.({ block: "nearest", behavior: reducido ? "auto" : "smooth" });
  }, [elegido, reducido]);

  const nombreZona = (z: ZonaId) => ZONAS.find((x) => x.id === z)?.nombre ?? z;
  const zonaActiva = activa ? ZONAS.find((z) => z.id === activa) ?? null : null;
  const esElegido = (tipo: NonNullable<Elegido>["tipo"], id: string) => elegido?.tipo === tipo && elegido.id === id;

  // El globo de ayuda sigue al puntero dentro del lienzo.
  const mostrarGlobo = (e: React.PointerEvent, titulo: string, sub?: string) => {
    if (e.pointerType === "touch") return;
    const r = lienzo.current?.getBoundingClientRect();
    if (!r) return;
    setGlobo({ x: e.clientX - r.left, y: e.clientY - r.top, titulo, sub });
  };
  const ocultarGlobo = () => setGlobo(null);

  const alTeclaBoton = (fn: () => void) => (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fn();
    }
  };

  const visible = (z: ZonaId) => activa === null || activa === z;
  const opcionesConPunto = opciones.filter((o) => o.coordenada && o.zona !== "costa-atlantico");
  const aguaMarina = opciones.find((o) => o.zona === "costa-atlantico") ?? null;
  // La leyenda dice solo lo que el mapa muestra.
  const estadosEnMapa = ORDEN_ESTADO.filter((e) =>
    obras.some((o) => o.estado === e && o.coordenada && o.zona !== "costa-atlantico"),
  );

  return (
    <div className={"mm" + (activa ? " mm-con-zona mm-zona-" + activa : "")}>
      <div className="mm-cuerpo">
        {/* ── El mapa (el lienzo y, debajo o encima según la pantalla, la leyenda) ── */}
        <div className="mm-mapa">
          <div className="mm-lienzo" ref={lienzo} onPointerLeave={ocultarGlobo}>
            <svg
              className="mm-svg"
              viewBox={`${vb.x.toFixed(1)} ${vb.y.toFixed(1)} ${vb.w.toFixed(1)} ${vb.h.toFixed(1)}`}
              preserveAspectRatio="xMidYMid meet"
              role="group"
              aria-labelledby={`${base}-titulo`}
            >
              <title id={`${base}-titulo`}>{t.titulo}</title>
              <defs>
                <linearGradient id={`${base}-mar`} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#0e1a2b" />
                  <stop offset="100%" stopColor="#14263d" />
                </linearGradient>
                <linearGradient id={`${base}-tierra`} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#2a3a55" />
                  <stop offset="100%" stopColor="#24334b" />
                </linearGradient>
                {/* El brillo del borde de cada zona, difuminado: son una agrupación nuestra, no límites. */}
                <filter
                  id={`${base}-suave`}
                  filterUnits="userSpaceOnUse"
                  x={LIENZO.x - 400}
                  y={LIENZO.y - 400}
                  width={LIENZO.w + 800}
                  height={LIENZO.h + 800}
                >
                  <feGaussianBlur stdDeviation={s(5)} />
                </filter>
                {ZONAS_PRINCIPALES.map((z) => (
                  <clipPath key={z} id={`${base}-recorte-${z}`}>
                    <path d={FORMA_D[z]} />
                  </clipPath>
                ))}
                <mask id={`${base}-solo-tierra`} maskUnits="userSpaceOnUse" x={LIENZO.x} y={LIENZO.y} width={LIENZO.w} height={LIENZO.h}>
                  <rect x={LIENZO.x} y={LIENZO.y} width={LIENZO.w} height={LIENZO.h} fill="#000" />
                  <path d={TIERRA} fill="#fff" />
                  <path d={BAHIA} fill="#000" />
                  <path d={CIENAGA} fill="#000" />
                  <path d={MANGA} fill="#fff" />
                </mask>
              </defs>

              {/* Mar, tierra, bahía, ciénaga e islas */}
              <rect x={LIENZO.x} y={LIENZO.y} width={LIENZO.w} height={LIENZO.h} fill={`url(#${base}-mar)`} />
              <path d={TIERRA} fill={`url(#${base}-tierra)`} />
              <path d={BAHIA} className="mm-agua" />
              <path d={CIENAGA} className="mm-agua mm-cienaga" />
              <path d={MANGA} fill={`url(#${base}-tierra)`} />
              <path d={TIERRA_BOMBA} fill={`url(#${base}-tierra)`} className="mm-isla" />

              {/* Cada zona: un relleno tenue y un brillo de su color en el borde, hacia adentro.
                  El color va en el brillo (vivo) y no en el relleno: un ámbar tenue sobre el azul
                  se vuelve café. La costa las recorta. */}
              <g mask={`url(#${base}-solo-tierra)`} className="mm-zonas">
                {ZONAS_PRINCIPALES.map((z) => (
                  <g
                    key={z}
                    className={
                      "mm-zona mm-zona-color-" +
                      z +
                      (activa === z ? " activa" : activa ? " apagada" : "") +
                      (sobre === z ? " sobre" : "")
                    }
                  >
                    <path d={FORMA_D[z]} className="mm-zona-relleno" />
                    <path
                      d={FORMA_D[z]}
                      className="mm-zona-borde"
                      strokeWidth={s(16)}
                      clipPath={`url(#${base}-recorte-${z})`}
                      filter={`url(#${base}-suave)`}
                    />
                  </g>
                ))}
              </g>

              {/* La costa, la Vía al Mar y el viaducto */}
              <path d={c(COSTA)} className="mm-costa" strokeWidth={s(1.2)} />
              <path d={VIA_AL_MAR} className="mm-via" strokeWidth={s(2)} />
              <path d={VIADUCTO} className="mm-via mm-viaducto" strokeWidth={s(2.2)} strokeDasharray={`${s(5)} ${s(3)}`} />

              {/* El Gran Malecón: trazado ilustrativo, cuando se mira la ciudad o la Zona Norte */}
              <g className={"mm-malecon" + (activa === "zona-norte" || activa === "ciudad" ? "" : " mm-oculto")}>
                <path d={MALECON} className="mm-malecon-linea" strokeWidth={s(3)} strokeDasharray={`${s(6)} ${s(4)}`} />
                <path
                  d={MALECON}
                  className="mm-toque"
                  strokeWidth={s(18)}
                  role="button"
                  tabIndex={activa === "zona-norte" || activa === "ciudad" ? 0 : -1}
                  aria-label={t.verDetalle("Gran Malecón del Mar")}
                  onClick={() => elegir({ tipo: "obra", id: "gran-malecon" }, activa === "ciudad" ? "ciudad" : "zona-norte")}
                  onKeyDown={alTeclaBoton(() => elegir({ tipo: "obra", id: "gran-malecon" }, activa === "ciudad" ? "ciudad" : "zona-norte"))}
                  onPointerMove={(e) => mostrarGlobo(e, t.malecon)}
                  onPointerLeave={ocultarGlobo}
                />
              </g>

              {/* Rótulos del agua y de los barrios (dibujo y geografía) */}
              <g className="mm-rotulos" aria-hidden="true">
                {(() => {
                  const mar = MAR[activa && activa !== "costa-atlantico" ? activa : "general"];
                  return mar && quieto ? (
                    <text x={px(mar[1])} y={py(mar[0])} fontSize={s(13)} className="mm-rotulo-mar mm-aparece">
                      {t.marCaribe}
                    </text>
                  ) : null;
                })()}
                {AGUAS.map((a) => (
                  <text
                    key={a.clave}
                    x={px(a.ll[1])}
                    y={py(a.ll[0])}
                    fontSize={s(9.5)}
                    className={"mm-rotulo-agua" + (activa && a.zonas.includes(activa) ? "" : " mm-oculto")}
                  >
                    {t[a.clave]}
                  </text>
                ))}
                {activa === "zona-norte" && (
                  <text
                    x={px(-75.4502)}
                    y={py(10.5635)}
                    fontSize={s(9.5)}
                    className="mm-rotulo-via"
                    transform={`rotate(-73 ${px(-75.4502)} ${py(10.5635)})`}
                  >
                    {t.viaAlMar}
                  </text>
                )}
                {/* Barrios y pueblos: nombre de lugar, centrado y sin punto; solo si cabe sin pisar otro. */}
                {rotulos.map((r) => {
                  const ub = activa === r.zona ? etiquetas.ubicadas.get("rotulo:" + r.nombre) : undefined;
                  return (
                    <g
                      key={r.nombre}
                      transform={`translate(${px(r.coordenada.lon)},${py(r.coordenada.lat)}) scale(${n2(u)})`}
                      className={"mm-rotulo-lugar" + (ub && quieto ? "" : " mm-oculto")}
                    >
                      <text x={ub?.dx ?? 0} y={ub?.dy ?? 3.6} textAnchor="middle">
                        {r.nombre}
                      </text>
                    </g>
                  );
                })}
              </g>

              {/* Los rótulos de las zonas, en la vista general */}
              <g className={"mm-rotulos-zona" + (activa ? " mm-oculto" : "")}>
                {ZONAS_PRINCIPALES.map((z) => {
                  const [lat, lon] = ROTULO_ZONA[z];
                  const zz = ZONAS.find((x) => x.id === z)!;
                  return (
                    <g key={z} transform={`translate(${px(lon)},${py(lat)}) scale(${n2(u)})`} className={"mm-rotulo-zona mm-rotulo-zona-" + z}>
                      <text y={0} className="mm-rotulo-zona-nombre">
                        {zz.rotulo}
                      </text>
                      <text y={15} className="mm-rotulo-zona-cuenta">
                        {resumen(z)}
                      </text>
                    </g>
                  );
                })}
              </g>

              {/* Toques de las zonas: invisibles, encima del dibujo y debajo de los puntos */}
              <g className="mm-toques">
                {ZONAS_PRINCIPALES.map((z) => {
                  const zz = ZONAS.find((x) => x.id === z)!;
                  return (
                    <path
                      key={z}
                      d={FORMA_D[z]}
                      className={"mm-toque-zona" + (activa === z ? " activa" : "")}
                      role="button"
                      tabIndex={activa === z ? -1 : 0}
                      aria-label={t.verZona(zz.nombre)}
                      onClick={() => activa !== z && irAZona(z)}
                      onKeyDown={alTeclaBoton(() => activa !== z && irAZona(z))}
                      onPointerEnter={() => setSobre(z)}
                      onPointerLeave={() => {
                        setSobre(null);
                        ocultarGlobo();
                      }}
                      onPointerMove={(e) => activa !== z && mostrarGlobo(e, zz.nombre, resumen(z))}
                    />
                  );
                })}
              </g>

              {/* Lo que ya funciona: puntos chicos, solo dentro de la zona activa */}
              <g className="mm-lugares">
                {lugares
                  .filter((l) => l.coordenada && l.zona !== "costa-atlantico")
                  .map((l) => {
                    const cc = l.coordenada!;
                    const ver = activa === l.zona;
                    const ub = ver ? etiquetas.ubicadas.get("lugar:" + l.id) : undefined;
                    const nombrar = esElegido("lugar", l.id) || (ub !== undefined && quieto);
                    return (
                      <g
                        key={l.id}
                        transform={`translate(${px(cc.lon)},${py(cc.lat)}) scale(${n2(u)})`}
                        className={"mm-lugar" + (ver ? "" : " mm-oculto") + (esElegido("lugar", l.id) ? " elegido" : "")}
                        role="button"
                        tabIndex={ver ? 0 : -1}
                        aria-label={t.verDetalle(l.nombre)}
                        onClick={() => elegir({ tipo: "lugar", id: l.id }, l.zona)}
                        onKeyDown={alTeclaBoton(() => elegir({ tipo: "lugar", id: l.id }, l.zona))}
                        onPointerMove={(e) => mostrarGlobo(e, l.nombre)}
                        onPointerLeave={ocultarGlobo}
                      >
                        <circle r={9} className="mm-blanco" />
                        <circle r={3.4} className="mm-lugar-punto" />
                        {nombrar && (
                          <text x={ub?.dx ?? 9} y={ub?.dy ?? 3.8} textAnchor={ub?.ancla ?? "start"} className="mm-etiqueta mm-etiqueta-lugar">
                            {l.nombre}
                          </text>
                        )}
                      </g>
                    );
                  })}
              </g>

              {/* Las obras con coordenada: marcador por estado (forma y texto, no solo color) */}
              <g className="mm-obras">
                {obras
                  .filter((o) => o.coordenada && o.zona !== "costa-atlantico")
                  .map((o) => {
                    const cc = o.coordenada!;
                    const ver = visible(o.zona);
                    const clase = CLASE[o.estado!];
                    const ub = activa === o.zona ? etiquetas.ubicadas.get("obra:" + o.id) : undefined;
                    const nombrar = esElegido("obra", o.id) || (ub !== undefined && quieto);
                    return (
                      <g
                        key={o.id}
                        transform={`translate(${px(cc.lon)},${py(cc.lat)}) scale(${n2(u)})`}
                        className={"mm-obra mm-obra-" + clase + (ver ? "" : " mm-oculto") + (esElegido("obra", o.id) ? " elegido" : "")}
                        role="button"
                        tabIndex={ver ? 0 : -1}
                        aria-label={t.verDetalle(`${o.nombre} (${t.estado[o.estado!]})`)}
                        onClick={() => elegir({ tipo: "obra", id: o.id }, o.zona)}
                        onKeyDown={alTeclaBoton(() => elegir({ tipo: "obra", id: o.id }, o.zona))}
                        onPointerMove={(e) => mostrarGlobo(e, o.nombre, t.estado[o.estado!])}
                        onPointerLeave={ocultarGlobo}
                      >
                        <circle r={13} className="mm-blanco" />
                        <MarcadorObra clase={clase} />
                        {nombrar && (
                          <text x={ub?.dx ?? 13} y={ub?.dy ?? 3.8} textAnchor={ub?.ancla ?? "start"} className="mm-etiqueta">
                            {o.nombre}
                          </text>
                        )}
                      </g>
                    );
                  })}
              </g>

              {/* Nuestras opciones con punto verificado */}
              <g className="mm-opciones">
                {opcionesConPunto.map((o) => {
                  const cc = o.coordenada!;
                  const activo = esElegido("opcion", o.slug);
                  const izquierda = etiquetas.ladoPin.get(o.slug) === "izquierda";
                  // Con otra zona acercada, el pin queda tenue y sin nombre.
                  const nombrar = activo || activa === null || activa === o.zona;
                  return (
                    <g
                      key={o.slug}
                      transform={`translate(${px(cc.lon)},${py(cc.lat)}) scale(${n2(u)})`}
                      className={"mm-pin" + (activo ? " elegido" : "") + (visible(o.zona) ? "" : " apagado")}
                      role="button"
                      tabIndex={0}
                      aria-label={t.verDetalle(o.nombre)}
                      onClick={() => elegir({ tipo: "opcion", id: o.slug }, o.zona)}
                      onKeyDown={alTeclaBoton(() => elegir({ tipo: "opcion", id: o.slug }, o.zona))}
                      onPointerMove={(e) => mostrarGlobo(e, o.nombre, nombreZona(o.zona))}
                      onPointerLeave={ocultarGlobo}
                    >
                      <circle r={18} cy={-14} className="mm-blanco" />
                      <path d="M0,0 C-5,-7 -10,-12 -10,-18 A10,10 0 1 1 10,-18 C10,-12 5,-7 0,0 Z" className="mm-pin-gota" />
                      <circle cy={-18} r={3.6} className="mm-pin-ojo" />
                      <text
                        x={izquierda ? -13 : 13}
                        y={-14}
                        textAnchor={izquierda ? "end" : "start"}
                        className={"mm-pin-nombre" + (nombrar ? "" : " mm-oculto")}
                      >
                        {o.nombre}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>

            {/* La costa del Atlántico: recuadro aparte, en esquema; con otra zona acercada, solo su acceso */}
            <Recuadro
              modo={activa === "costa-atlantico" ? "abierto" : activa ? "acceso" : "general"}
              opcion={aguaMarina}
              elegida={aguaMarina ? esElegido("opcion", aguaMarina.slug) : false}
              alAbrir={() => irAZona("costa-atlantico")}
              alElegir={() => aguaMarina && elegir({ tipo: "opcion", id: aguaMarina.slug }, "costa-atlantico")}
              textos={t}
              base={base}
            />

            <span className="mm-norte" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22">
                <path d="M12 2l3.2 10H8.8z" fill="currentColor" />
                <path d="M12 22l-3.2-10h6.4z" fill="currentColor" opacity="0.35" />
              </svg>
              {t.norte}
            </span>

            {globo && (
              <div className="mm-globo" style={{ left: globo.x, top: globo.y }} aria-hidden="true">
                <strong>{globo.titulo}</strong>
                {globo.sub && <span>{globo.sub}</span>}
              </div>
            )}
          </div>

          <ul className="mm-leyenda" aria-hidden="true">
            <li>
              <svg width="14" height="16" viewBox="-11 -30 22 31">
                <path d="M0,0 C-5,-7 -10,-12 -10,-18 A10,10 0 1 1 10,-18 C10,-12 5,-7 0,0 Z" className="mm-pin-gota" />
              </svg>
              {t.leyendaOpcion}
            </li>
            {estadosEnMapa.map((e) => (
              <li key={e} className={"mm-obra mm-obra-" + CLASE[e]}>
                <svg width="16" height="16" viewBox="-9 -9 18 18">
                  <MarcadorObra clase={CLASE[e]} />
                </svg>
                {t.estado[e]}
              </li>
            ))}
            <li>
              <svg width="10" height="10" viewBox="-5 -5 10 10">
                <circle r={3.4} className="mm-lugar-punto" />
              </svg>
              {t.leyendaLugar}
            </li>
          </ul>
        </div>

        {/* ── El panel ── */}
        <div className="mm-panel" ref={panel}>
          <p className="sr-only" aria-live="polite">
            {zonaActiva ? t.acercado(zonaActiva.nombre) : t.general}
          </p>
          {zonaActiva === null ? (
            <>
              <h3 className="mm-panel-titulo">{t.elige}</h3>
              <p className="mm-panel-ayuda">{t.eligeAyuda}</p>
              <ul className="mm-lista-zonas">
                {ZONAS.map((z) => {
                  return (
                    <li key={z.id}>
                      <button
                        type="button"
                        className={"mm-boton-zona mm-zona-color-" + z.id}
                        onClick={() => irAZona(z.id)}
                        onPointerEnter={() => setSobre(z.id)}
                        onPointerLeave={() => setSobre(null)}
                        onFocus={() => setSobre(z.id)}
                        onBlur={() => setSobre(null)}
                      >
                        <span className="mm-muestra" aria-hidden="true" />
                        <span className="mm-boton-zona-texto">
                          <strong>{z.nombre}</strong>
                          <small>{resumen(z.id)}</small>
                        </span>
                        <span className="mm-flecha" aria-hidden="true">
                          →
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              {/* La lista corta: el nombre y la zona. El precio va en la tarjeta de su
                  zona, junto a su corte, su área y su ubicación (numeral 2.16.1). */}
              <h3 className="mm-panel-subtitulo">{t.todasOpciones}</h3>
              <ul className="mm-lista-opciones mm-lista-corta">
                {opciones.map((o) => (
                  <li key={o.slug}>
                    <button type="button" className="mm-fila-opcion" onClick={() => elegir({ tipo: "opcion", id: o.slug }, o.zona)}>
                      <span className={"mm-muestra mm-zona-color-" + o.zona} aria-hidden="true" />
                      <span className="mm-fila-texto">
                        <strong>{o.nombre}</strong>
                        <small className="mm-fila-datos">{nombreZona(o.zona)}</small>
                      </span>
                      {o.coordenada && <span className="mm-marca-mapa">{t.enMapa}</span>}
                      <span className="mm-flecha" aria-hidden="true">
                        →
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <button type="button" className="mm-volver" onClick={() => irAZona(null)}>
                {t.todas}
              </button>
              <h3 className="mm-panel-titulo mm-con-muestra">
                <span className={"mm-muestra mm-zona-color-" + zonaActiva.id} aria-hidden="true" />
                {zonaActiva.nombre}
              </h3>
              <p className="mm-panel-ayuda">{zonaActiva.frase}</p>

              <h4 className="mm-panel-subtitulo">{t.nuestras}</h4>
              {opciones.filter((o) => o.zona === zonaActiva.id).length === 0 ? (
                <p className="mm-nota">{t.sinOpciones}</p>
              ) : (
                <>
                  <ul className="mm-lista-opciones">
                    {opciones
                      .filter((o) => o.zona === zonaActiva.id)
                      .map((o) => (
                        <li key={o.slug} data-id={`opcion:${o.slug}`}>
                          <TarjetaOpcion
                            o={o}
                            abierta={esElegido("opcion", o.slug)}
                            alTocar={() => elegir({ tipo: "opcion", id: o.slug }, o.zona)}
                            t={t}
                          />
                        </li>
                      ))}
                  </ul>
                  {opciones.some((o) => o.zona === zonaActiva.id && !o.coordenada) && <p className="mm-nota">{t.notaPuntos}</p>}
                </>
              )}

              {obras.some((o) => o.zona === zonaActiva.id) && (
                <>
                  <h4 className="mm-panel-subtitulo">{t.tituloObras}</h4>
                  <ul className="mm-lista-obras">
                    {obras
                      .filter((o) => o.zona === zonaActiva.id)
                      .map((o) => (
                        <li key={o.id} data-id={`obra:${o.id}`}>
                          <TarjetaItem
                            item={o}
                            abierta={esElegido("obra", o.id)}
                            alTocar={() => elegir({ tipo: "obra", id: o.id }, o.zona)}
                            t={t}
                          />
                        </li>
                      ))}
                  </ul>
                </>
              )}

              {lugares.some((l) => l.zona === zonaActiva.id) && (
                <>
                  <h4 className="mm-panel-subtitulo">{t.funciona}</h4>
                  <ul className="mm-lista-obras mm-lista-lugares">
                    {lugares
                      .filter((l) => l.zona === zonaActiva.id)
                      .map((l) => (
                        <li key={l.id} data-id={`lugar:${l.id}`}>
                          <TarjetaItem
                            item={l}
                            abierta={esElegido("lugar", l.id)}
                            alTocar={() => elegir({ tipo: "lugar", id: l.id }, l.zona)}
                            t={t}
                          />
                        </li>
                      ))}
                  </ul>
                </>
              )}
            </>
          )}
        </div>
      </div>

      <div className="mm-letra-chica">
        <p>{NOTA_OBRAS}</p>
        <p>{NOTA_MAPA_MERCADO}</p>
      </div>
    </div>
  );
}

/** El marcador de una obra: la forma dice el estado (además del texto). */
function MarcadorObra({ clase }: { clase: Clase }) {
  if (clase === "entregado") {
    return (
      <g className="mm-marca">
        <circle r={7} className="mm-marca-fondo" />
        <path d="M-3.2,0.2 L-0.8,2.6 L3.4,-2.4" className="mm-marca-trazo" />
      </g>
    );
  }
  if (clase === "obra") {
    return (
      <g className="mm-marca">
        <circle r={6.6} className="mm-marca-fondo" />
        <circle r={2.4} className="mm-marca-centro" />
      </g>
    );
  }
  return (
    <g className="mm-marca">
      <rect x={-5} y={-5} width={10} height={10} transform="rotate(45)" className="mm-marca-fondo" />
    </g>
  );
}

type T = (typeof TEXTOS)["es"];

/**
 * Lo que dice una opción en su fila: el precio nunca sale suelto. Con él van
 * su corte, el área con la etiqueta literal de la fuente y la ubicación
 * publicada (numeral 2.16.1 de la Circular 004), como en el comparador.
 */
function DatosOpcion({ o, t }: { o: OpcionMapa; t: T }) {
  return (
    <span className="mm-fila-texto">
      <strong>{o.nombre}</strong>
      <span className="mm-fila-precio">
        {o.precio}
        {o.corte ? <small>{` · ${t.corte}${o.corte}`}</small> : null}
      </span>
      <small className="mm-fila-datos">
        {o.area
          ? `${o.area.etiquetas.length > 0 ? `${o.area.etiquetas.join(" / ")}: ` : ""}${o.area.texto}${o.area.conflicto ? t.areaConflicto : ""} · `
          : ""}
        {t.ubicacion}
        {o.ubicacion ?? t.ubicacionPendiente}
      </small>
    </span>
  );
}

function TarjetaOpcion({ o, abierta, alTocar, t }: { o: OpcionMapa; abierta: boolean; alTocar: () => void; t: T }) {
  return (
    <div className={"mm-tarjeta" + (abierta ? " abierta" : "")}>
      <button type="button" className="mm-tarjeta-cabeza" aria-expanded={abierta} onClick={alTocar}>
        {o.foto ? <img src={o.foto.src} alt="" loading="lazy" decoding="async" width={52} height={52} /> : <span className="mm-sin-foto" aria-hidden="true" />}
        <DatosOpcion o={o} t={t} />
        {o.coordenada && <span className="mm-marca-mapa">{t.enMapa}</span>}
      </button>
      {abierta && (
        <div className="mm-tarjeta-cuerpo">
          <p className="mm-estado-opcion">{o.estado}</p>
          {o.coordenada && (
            <p className="mm-fuente">
              {t.punto}
              {o.coordenada.fuente}
            </p>
          )}
          <Link className="mm-ver" href={o.href}>
            {o.verTexto} →
          </Link>
        </div>
      )}
    </div>
  );
}

function TarjetaItem({ item, abierta, alTocar, t }: { item: Item; abierta: boolean; alTocar: () => void; t: T }) {
  return (
    <div className={"mm-tarjeta mm-tarjeta-item" + (abierta ? " abierta" : "")}>
      <button type="button" className="mm-tarjeta-cabeza" aria-expanded={abierta} onClick={alTocar}>
        {item.estado && <span className={"mm-chip mm-chip-" + CLASE[item.estado]}>{t.estado[item.estado]}</span>}
        <strong>{item.nombre}</strong>
        {item.coordenada && <span className="mm-marca-mapa">{t.enMapa}</span>}
      </button>
      {abierta && (
        <div className="mm-tarjeta-cuerpo">
          <p>{item.frase}</p>
          <p className="mm-fuente">
            {t.fuente}
            {item.fuente} · {item.fecha}
          </p>
          {item.coordenada && (
            <p className="mm-fuente">
              {t.punto}
              {item.coordenada.fuente}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * La costa del Atlántico, en esquema y sin escala: del lado de Cartagena al de
 * Barranquilla, con Agua Marina sobre la costa de Juan de Acosta. No es
 * cartografía: no lleva coordenadas, solo el orden de los lugares.
 *
 * Tres modos: en la vista general es un recuadro arriba a la izquierda, sobre
 * el mar; con otra zona acercada queda solo su acceso (un botón chico, para
 * no tapar el mapa), y abierto ocupa el lienzo. El dibujo va en píxeles (el
 * recuadro se mide), así que las letras miden lo mismo chico y abierto.
 */
function Recuadro({
  modo,
  opcion,
  elegida,
  alAbrir,
  alElegir,
  textos: t,
  base,
}: {
  modo: "general" | "acceso" | "abierto";
  opcion: OpcionMapa | null;
  elegida: boolean;
  alAbrir: () => void;
  alElegir: () => void;
  textos: T;
  base: string;
}) {
  const caja = useRef<HTMLDivElement>(null);
  const [tam, setTam] = useState({ w: 236, h: 157 });
  useEffect(() => {
    const el = caja.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      if (width > 0 && height > 0) setTam({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [modo]);

  if (modo === "acceso") {
    return (
      <button type="button" className="mm-recuadro-acceso" onClick={alAbrir} aria-label={t.verZona(t.recuadroTitulo)}>
        <span className="mm-muestra mm-zona-color-costa-atlantico" aria-hidden="true" />
        {t.recuadroTitulo}
        <span aria-hidden="true">→</span>
      </button>
    );
  }

  const abierto = modo === "abierto";
  const { w, h } = tam;
  // Agua Marina en el origen. La costa sube de Cartagena (abajo a la
  // izquierda) a Barranquilla (arriba a la derecha); la tierra queda debajo.
  const vb = abierto ? `${n2(-w * 0.34)} ${n2(-h * 0.5)} ${n2(w)} ${n2(h)}` : `${n2(-w * 0.52)} ${n2(-h * 0.56)} ${n2(w)} ${n2(h)}`;
  const costa = "M-1600,640 C-1100,450 -500,210 0,0 S1000,-400 1600,-640";
  const gota = "M0,0 C-5,-7 -10,-12 -10,-18 A10,10 0 1 1 10,-18 C10,-12 5,-7 0,0 Z";
  // «Agua Marina Beach Resort · apto 803» en dos líneas, para que quepa en el teléfono.
  const [linea1, ...resto] = (opcion?.nombre ?? "").split(" · ");
  const linea2 = resto.join(" · ");

  const dibujo = (
    <svg viewBox={vb} preserveAspectRatio="xMidYMid meet" aria-hidden={abierto ? undefined : true}>
      <defs>
        <linearGradient id={`${base}-mar-recuadro`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0e1a2b" />
          <stop offset="100%" stopColor="#14263d" />
        </linearGradient>
      </defs>
      <rect x={-1700} y={-1200} width={3400} height={2400} fill={`url(#${base}-mar-recuadro)`} />
      <path d={`${costa} L1600,1200 L-1600,1200 Z`} className="mm-recuadro-tierra" />
      <path d={costa} className="mm-costa" strokeWidth={1.2} />
      {abierto && (
        <text x={n2(-w * 0.12)} y={n2(-h * 0.24)} className="mm-rotulo-mar mm-recuadro-mar" textAnchor="middle">
          {t.marCaribe}
        </text>
      )}
      <text x={abierto ? 26 : 0} y={abierto ? 46 : 31} className="mm-recuadro-lugar" textAnchor={abierto ? "start" : "middle"}>
        {t.recuadroLugar}
      </text>
      {opcion &&
        (abierto ? (
          <g
            className={"mm-pin" + (elegida ? " elegido" : "")}
            role="button"
            tabIndex={0}
            aria-label={t.verDetalle(opcion.nombre)}
            onClick={alElegir}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                alElegir();
              }
            }}
          >
            <circle r={18} cy={-14} className="mm-blanco" />
            <path d={gota} className="mm-pin-gota" />
            <circle cy={-18} r={3.6} className="mm-pin-ojo" />
            <text x={14} y={linea2 ? -20 : -14} className="mm-pin-nombre">
              {linea1}
            </text>
            {linea2 && (
              <text x={14} y={-5} className="mm-pin-nombre mm-pin-nombre-2">
                {linea2}
              </text>
            )}
          </g>
        ) : (
          <g className="mm-pin">
            <path d={gota} className="mm-pin-gota" />
            <circle cy={-18} r={3.6} className="mm-pin-ojo" />
          </g>
        ))}
    </svg>
  );
  const rotulos = (
    <>
      <span className="mm-recuadro-titulo">{t.recuadroTitulo}</span>
      <span className="mm-recuadro-esquina mm-recuadro-barranquilla" aria-hidden="true">
        {t.recuadroBarranquilla}
      </span>
      <span className="mm-recuadro-esquina mm-recuadro-cartagena" aria-hidden="true">
        {t.recuadroCartagena}
      </span>
      <span className="mm-recuadro-esquema">{t.esquema}</span>
    </>
  );

  if (abierto) {
    return (
      <div ref={caja} className="mm-recuadro abierto">
        {dibujo}
        {rotulos}
      </div>
    );
  }
  return (
    <div ref={caja} className="mm-recuadro">
      <button type="button" className="mm-recuadro-boton" onClick={alAbrir} aria-label={t.verZona(t.recuadroTitulo)}>
        {dibujo}
        {rotulos}
      </button>
    </div>
  );
}
