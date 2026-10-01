"use client";

/**
 * Los campos del simulador y la etiqueta de cada cifra.
 *
 * Cada valor se mueve con un deslizador y con un campo numérico sincronizados,
 * con formato colombiano y teclado numérico en el teléfono. Y cada cifra dice
 * de dónde sale: «Fuente» (dato oficial o de mercado, con entidad y fecha),
 * «Supuesto» (editable, sin fuente oficial, o con una fuente que no se ha
 * verificado) o «Tu dato» (lo que escribió la persona).
 */
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { etiquetaDe, porActualizar, type Parametro } from "@/lib/simulador/config";
import { useSim } from "@/components/simulador/contexto";
import { digitos, leerDecimal, leerDinero } from "@/components/simulador/formato";

// ── La etiqueta de cada cifra ────────────────────────────────────────────

export type Origen = {
  tipo: "fuente" | "supuesto" | "tu-dato";
  fuente?: string;
  url?: string;
  fecha?: string;
  proxima?: string;
  nota?: string;
};

/** El origen de una cifra de la configuración, según la haya cambiado o no la persona. */
export function origenDe(p: Parametro<unknown>, editado = false): Origen {
  return {
    tipo: etiquetaDe(p, editado),
    fuente: p.fuente,
    url: p.url,
    fecha: p.fecha,
    proxima: p.proximaActualizacion,
    // Solo la nota pública: `nota` es para quien mantiene la configuración.
    nota: p.notaPublica,
  };
}

/**
 * La etiqueta: un botón pequeño que abre, al lado, de dónde sale la cifra.
 * Es un botón con spans (no un <details>) para que pueda ir dentro de un
 * párrafo sin romper el HTML. Se cierra con Escape o tocando afuera.
 */
export function Etiqueta({ origen }: { origen: Origen }) {
  const { t, hoy } = useSim();
  const [abierta, setAbierta] = useState(false);
  const caja = useRef<HTMLSpanElement>(null);
  const idPanel = useId();
  useEffect(() => {
    if (!abierta) return;
    const fuera = (e: PointerEvent) => {
      if (!caja.current?.contains(e.target as Node)) setAbierta(false);
    };
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierta(false);
    };
    document.addEventListener("pointerdown", fuera);
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("pointerdown", fuera);
      document.removeEventListener("keydown", tecla);
    };
  }, [abierta]);
  const viejo =
    origen.tipo !== "tu-dato" && hoy && origen.proxima
      ? porActualizar({ valor: 0, fuente: "", fecha: "", tipo: "fuente", verificado: true, proximaActualizacion: origen.proxima }, hoy)
      : false;
  return (
    <span ref={caja} className={`sim-etq sim-etq-${origen.tipo}${viejo ? " sim-etq-viejo" : ""}`}>
      <button type="button" className="sim-etq-boton" aria-expanded={abierta} aria-controls={idPanel} onClick={() => setAbierta(!abierta)}>
        {t.etq[origen.tipo]}
        <span className="sr-only">: {t.etqVerDetalle}</span>
      </button>
      <span className="sim-etq-panel" id={idPanel} role="note" hidden={!abierta}>
        {origen.tipo === "tu-dato" ? (
          <span className="sim-etq-linea">{t.etqTuDato}</span>
        ) : (
          <>
            {origen.fuente && <span className="sim-etq-linea">{t.fuente(origen.fuente)}</span>}
            {origen.fecha && (
              <span className="sim-etq-linea sim-etq-fecha">
                {t.etqFecha} {t.fechaDato(origen.fecha)}
                {origen.proxima ? ` · ${t.etqProxima} ${t.fechaDato(origen.proxima)}` : ""}
              </span>
            )}
            {viejo && <span className="sim-etq-linea sim-etq-aviso">{t.etqViejo}</span>}
            {origen.nota && <span className="sim-etq-linea sim-etq-nota">{t.fuente(origen.nota)}</span>}
            {origen.tipo === "supuesto" && <span className="sim-etq-linea sim-etq-nota">{t.etqSupuesto}</span>}
            {origen.url && (
              <a className="sim-etq-linea" href={origen.url} target="_blank" rel="noopener noreferrer">
                {t.etqVerFuente}
              </a>
            )}
          </>
        )}
      </span>
    </span>
  );
}

// ── Los campos ───────────────────────────────────────────────────────────

type Base = {
  etiqueta: ReactNode;
  valor: number;
  onChange: (v: number) => void;
  min?: number;
  max: number;
  paso: number;
  origen?: Origen;
  ayuda?: ReactNode;
  /** Sin deslizador: solo el campo. */
  sinDeslizador?: boolean;
  deshabilitado?: boolean;
};

/** Pesos: «$ 311.500.000». Con `prefijo`, otra moneda («USD 4,500»). */
export function CampoDinero(p: Base & { prefijo?: string }) {
  const { idioma } = useSim();
  const id = useId();
  const [texto, setTexto] = useState<string | null>(null);
  const min = p.min ?? 0;
  return (
    <div className={`sim-campo${p.deshabilitado ? " sim-campo-apagado" : ""}`}>
      <div className="sim-campo-cabeza">
        <label htmlFor={id}>{p.etiqueta}</label>
        {p.origen && <Etiqueta origen={p.origen} />}
      </div>
      <div className="sim-campo-entrada sim-campo-dinero">
        <span aria-hidden="true">{p.prefijo ?? (idioma === "en" ? "COP" : "$")}</span>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          disabled={p.deshabilitado}
          value={texto ?? digitos(p.valor, idioma)}
          onFocus={() => setTexto(digitos(p.valor, idioma))}
          onChange={(e) => {
            setTexto(e.target.value);
            p.onChange(Math.max(min, leerDinero(e.target.value)));
          }}
          onBlur={() => setTexto(null)}
          aria-describedby={p.ayuda ? `${id}-ayuda` : undefined}
        />
      </div>
      {!p.sinDeslizador && (
        <input
          className="sim-deslizador"
          type="range"
          min={min}
          max={Math.max(p.max, p.valor)}
          step={p.paso}
          value={Math.min(Math.max(p.valor, min), Math.max(p.max, p.valor))}
          disabled={p.deshabilitado}
          onChange={(e) => p.onChange(Number(e.target.value))}
          aria-label={typeof p.etiqueta === "string" ? p.etiqueta : undefined}
          aria-valuetext={digitos(p.valor, idioma)}
        />
      )}
      {p.ayuda && (
        <p className="sim-campo-ayuda" id={`${id}-ayuda`}>
          {p.ayuda}
        </p>
      )}
    </div>
  );
}

/**
 * Un número con unidad: porcentaje (la fracción se muestra ×100), años o
 * meses. `porcentaje` dice si el valor es una fracción.
 */
export function CampoNumero(p: Base & { sufijo: string; porcentaje?: boolean; decimales?: number }) {
  const { idioma } = useSim();
  const id = useId();
  const factor = p.porcentaje ? 100 : 1;
  const dec = p.decimales ?? 0;
  const mostrar = (v: number) => {
    // Los ceros de la derecha se quitan solo después de la coma: 15,50 → 15,5, pero 70 sigue siendo 70.
    const fijo = (v * factor).toFixed(dec);
    const s = dec > 0 ? fijo.replace(/\.?0+$/, "") || "0" : fijo;
    return idioma === "en" ? s : s.replace(".", ",");
  };
  const [texto, setTexto] = useState<string | null>(null);
  const min = p.min ?? 0;
  const acotar = (v: number) => Math.min(p.max, Math.max(min, v));
  return (
    <div className={`sim-campo${p.deshabilitado ? " sim-campo-apagado" : ""}`}>
      <div className="sim-campo-cabeza">
        <label htmlFor={id}>{p.etiqueta}</label>
        {p.origen && <Etiqueta origen={p.origen} />}
      </div>
      <div className="sim-campo-entrada">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          disabled={p.deshabilitado}
          value={texto ?? mostrar(p.valor)}
          onFocus={() => setTexto(mostrar(p.valor))}
          onChange={(e) => {
            setTexto(e.target.value);
            p.onChange(acotar(leerDecimal(e.target.value) / factor));
          }}
          onBlur={() => setTexto(null)}
        />
        <span aria-hidden="true">{p.sufijo}</span>
      </div>
      {!p.sinDeslizador && (
        <input
          className="sim-deslizador"
          type="range"
          min={min * factor}
          max={p.max * factor}
          step={p.paso * factor}
          value={acotar(p.valor) * factor}
          disabled={p.deshabilitado}
          onChange={(e) => p.onChange(acotar(Number(e.target.value) / factor))}
          aria-label={typeof p.etiqueta === "string" ? p.etiqueta : undefined}
          aria-valuetext={`${mostrar(p.valor)} ${p.sufijo}`}
        />
      )}
      {p.ayuda && <p className="sim-campo-ayuda">{p.ayuda}</p>}
    </div>
  );
}

/** Opciones de una sola elección, como chips: radios de verdad, con teclado. */
export function Chips<T extends string>({
  leyenda,
  opciones,
  valor,
  onChange,
  nombre,
}: {
  leyenda: ReactNode;
  opciones: { valor: T; texto: string; detalle?: string }[];
  valor: T;
  onChange: (v: T) => void;
  nombre: string;
}) {
  return (
    <fieldset className="sim-chips">
      <legend>{leyenda}</legend>
      <div className="sim-chips-lista">
        {opciones.map((o) => (
          <label key={o.valor} className={o.valor === valor ? "sim-chip sim-chip-activo" : "sim-chip"}>
            <input type="radio" name={nombre} value={o.valor} checked={o.valor === valor} onChange={() => onChange(o.valor)} />
            <span>{o.texto}</span>
            {o.detalle && <small>{o.detalle}</small>}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Un sí/no. */
export function Interruptor({ texto, valor, onChange, ayuda }: { texto: ReactNode; valor: boolean; onChange: (v: boolean) => void; ayuda?: ReactNode }) {
  return (
    <label className="sim-interruptor">
      <input type="checkbox" checked={valor} onChange={(e) => onChange(e.target.checked)} />
      <span>{texto}</span>
      {ayuda && <small>{ayuda}</small>}
    </label>
  );
}

/**
 * Una cifra de la frase resumen que se puede tocar para escribirla o, con el
 * mouse, arrastrar hacia los lados para cambiarla (el «documento reactivo» de
 * Bret Victor). En el teléfono se toca y se escribe: arrastrar dentro de un
 * texto es difícil con el dedo.
 */
export function Ficha({
  valor,
  onChange,
  min,
  max,
  paso,
  formato,
  etiqueta,
  anchoCh,
}: {
  valor: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  paso: number;
  formato: (v: number) => string;
  etiqueta: string;
  anchoCh?: number;
}) {
  const [texto, setTexto] = useState<string | null>(null);
  const [arrastre, setArrastre] = useState<{ x: number; v: number } | null>(null);
  const campo = useRef<HTMLInputElement>(null);
  const acotar = (v: number) => Math.min(max, Math.max(min, Math.round(v / paso) * paso));

  // Con el mouse: si se arrastra, cambia la cifra; si solo se hace clic, se
  // abre para escribir. Con el dedo, el toque abre el teclado sin más.
  useEffect(() => {
    if (!arrastre) return;
    let movio = false;
    const mover = (e: PointerEvent) => {
      const dx = e.clientX - arrastre.x;
      if (!movio && Math.abs(dx) < 4) return;
      movio = true;
      onChange(acotar(arrastre.v + Math.round(dx / 6) * paso));
    };
    const soltar = () => {
      setArrastre(null);
      if (!movio) campo.current?.focus();
    };
    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", soltar, { once: true });
    return () => {
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", soltar);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arrastre]);

  return (
    <input
      ref={campo}
      className={arrastre ? "sim-ficha sim-ficha-arrastrando" : "sim-ficha"}
      type="text"
      inputMode="numeric"
      aria-label={etiqueta}
      title={etiqueta}
      style={anchoCh ? { width: `${anchoCh}ch` } : undefined}
      value={texto ?? formato(valor)}
      onFocus={(e) => {
        setTexto(String(Math.round(valor)));
        e.currentTarget.select();
      }}
      onChange={(e) => {
        setTexto(e.target.value);
        const n = leerDecimal(e.target.value.replace(/\./g, "").replace(/,/g, ""));
        if (n > 0) onChange(Math.min(max, Math.max(min, n)));
      }}
      onBlur={() => setTexto(null)}
      onPointerDown={(e) => {
        if (e.pointerType !== "mouse" || texto !== null) return;
        e.preventDefault();
        setArrastre({ x: e.clientX, v: valor });
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowUp" || e.key === "ArrowRight") {
          e.preventDefault();
          onChange(acotar(valor + paso));
        } else if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
          e.preventDefault();
          onChange(acotar(valor - paso));
        }
      }}
    />
  );
}
