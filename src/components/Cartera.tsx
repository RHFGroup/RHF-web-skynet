"use client";

/**
 * Nuestra cartera — proyectos y apartamentos, en las tarjetas que giran, con
 * filtros.
 *
 * El visitante ve todo lo que asesoramos, filtra por lo que le importa y cada
 * tarjeta abre su página propia. Grilla de tres columnas en escritorio, dos
 * en tableta y carrusel que se desliza con el dedo en el teléfono.
 *
 * 25-sep-2026 (pedido de Rafael): «los apartamentos terminados y en
 * construcción tienen que estar dentro de la cartera». Desde entonces es una
 * sola cartera: los proyectos de las constructoras y los apartamentos
 * disponibles van en la misma grilla. Arriba, un selector —Todo · Proyectos ·
 * Apartamentos— los separa de un toque, y cada apartamento lleva su marca en
 * la tarjeta. Los filtros de zona, tipo, estado y precio valen para los dos.
 *
 * Los enlaces de afuera llegan ya filtrados: `#proyectos`, `#apartamentos`,
 * `#en-lanzamiento`, `#en-construccion` y `#entrega-inmediata` (el menú y los
 * accesos de la portada). Cada uno tiene su ancla al principio de la sección,
 * así que sin JavaScript igual llevan a la cartera.
 *
 * Los datos llegan armados del servidor (`fichaDe` y `fichaDeInmueble`): esta
 * sección filtra y ordena, no calcula precios. El filtro de precio usa solo
 * precios publicables; lo que dice «Consultar» no entra en él, y se dice.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import RevealGrupo from "@/components/RevealGrupo";
import TarjetaGiro from "@/components/TarjetaGiro";
import type { Ficha } from "@/lib/ficha";
import "@/styles/cartera.css";

type Rango = { id: string; etiqueta: string; min: number; max: number };
type Oferta = "todo" | Ficha["origen"];

/** Tramos de precio. Son cortes para filtrar, no precios de nadie. */
const RANGOS: Rango[] = [
  { id: "hasta-350", etiqueta: "Hasta $350 millones", min: 0, max: 350_000_000 },
  { id: "350-500", etiqueta: "$350 a $500 millones", min: 350_000_000, max: 500_000_000 },
  { id: "mas-500", etiqueta: "Más de $500 millones", min: 500_000_000, max: Infinity },
];

const TIPOS: Record<string, string> = {
  apartamentos: "Apartamentos",
  casas: "Casas",
  apartaestudios: "Apartaestudios",
};

const ESTADOS: Record<Ficha["estado"], string> = {
  "en lanzamiento": "En lanzamiento",
  "en construcción": "En construcción",
  "entrega inmediata": "Entrega inmediata",
};

/** Los enlaces que llegan filtrados, y lo que filtra cada uno. */
const ANCLAS: Record<string, { oferta?: Oferta; estado?: Ficha["estado"] }> = {
  proyectos: { oferta: "proyecto" },
  apartamentos: { oferta: "apartamento" },
  "en-lanzamiento": { estado: "en lanzamiento" },
  "en-construccion": { estado: "en construcción" },
  "entrega-inmediata": { estado: "entrega inmediata" },
};

function unicos<T>(xs: (T | null)[]): T[] {
  return [...new Set(xs.filter((x): x is T => x !== null))];
}

export default function Cartera({ fichas }: { fichas: Ficha[] }) {
  const [oferta, setOferta] = useState<Oferta>("todo");
  const [zona, setZona] = useState<string | null>(null);
  const [tipo, setTipo] = useState<string | null>(null);
  const [estado, setEstado] = useState<string | null>(null);
  const [rango, setRango] = useState<string | null>(null);
  // Hasta que la persona filtra, la grilla entra con el scroll (RevealGrupo);
  // después, cada cambio de filtro vuelve a repartir las tarjetas con una
  // entrada corta (cartera.css, `.cartera-grilla-filtrada`).
  const [filtro, setFiltro] = useState(0);

  const cuantos = {
    todo: fichas.length,
    proyecto: fichas.filter((f) => f.origen === "proyecto").length,
    apartamento: fichas.filter((f) => f.origen === "apartamento").length,
  };
  const base = oferta === "todo" ? fichas : fichas.filter((f) => f.origen === oferta);
  const zonas = unicos(base.map((f) => f.zonaFiltro));
  const tipos = unicos(base.map((f) => f.tipoInmueble ?? null));
  const estados = unicos(base.map((f) => f.estado));
  const hayPrecios = base.some((f) => f.precioDesde !== null);

  const visibles = useMemo(() => {
    const r = RANGOS.find((x) => x.id === rango);
    return fichas.filter(
      (f) =>
        (oferta === "todo" || f.origen === oferta) &&
        (!zona || f.zonaFiltro === zona) &&
        (!tipo || f.tipoInmueble === tipo) &&
        (!estado || f.estado === estado) &&
        (!r || (f.precioDesde !== null && f.precioDesde >= r.min && f.precioDesde < r.max)),
    );
  }, [fichas, oferta, zona, tipo, estado, rango]);

  const filtrando = oferta !== "todo" || zona || tipo || estado || rango;
  const cambiar = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setFiltro((n) => n + 1);
  };
  const limpiar = () => {
    setOferta("todo");
    setZona(null);
    setTipo(null);
    setEstado(null);
    setRango(null);
    setFiltro((n) => n + 1);
  };

  // Los enlaces que llegan filtrados (#apartamentos, #entrega-inmediata…).
  const aplicarAncla = useRef<() => void>(() => {});
  aplicarAncla.current = () => {
    const ancla = ANCLAS[window.location.hash.slice(1)];
    if (!ancla) return;
    setOferta(ancla.oferta ?? "todo");
    setEstado(ancla.estado ?? null);
    setZona(null);
    setTipo(null);
    setRango(null);
    setFiltro((n) => n + 1);
    // Se deja el ancla de la sección: así el mismo enlace vuelve a funcionar
    // si se toca otra vez.
    window.history.replaceState(null, "", "#cartera");
  };
  useEffect(() => {
    const alCambiar = () => aplicarAncla.current();
    alCambiar();
    window.addEventListener("hashchange", alCambiar);
    return () => window.removeEventListener("hashchange", alCambiar);
  }, []);

  const conteo =
    oferta === "apartamento"
      ? visibles.length === 1
        ? "apartamento"
        : "apartamentos"
      : oferta === "proyecto"
        ? visibles.length === 1
          ? "proyecto"
          : "proyectos"
        : visibles.length === 1
          ? "opción"
          : "opciones";

  const OFERTAS: { id: Oferta; texto: string }[] = [
    { id: "todo", texto: "Todo" },
    { id: "proyecto", texto: "Proyectos" },
    { id: "apartamento", texto: "Apartamentos" },
  ];
  const indice = OFERTAS.findIndex((o) => o.id === oferta);

  const celdas = visibles.map((f, i) => (
    <div key={f.slug} className="cartera-celda" style={{ "--i": i % 6 } as React.CSSProperties}>
      <TarjetaGiro ficha={f} desdeCartera prioritaria={i === 0} retraso={i * 900} />
    </div>
  ));

  return (
    <section className="cartera section" id="cartera" aria-labelledby="cartera-titulo">
      {/* Anclas de los enlaces que llegan filtrados. */}
      {Object.keys(ANCLAS).map((a) => (
        <span key={a} id={a} className="cartera-ancla" aria-hidden="true" />
      ))}
      <div className="section-shell">
        <div className="cartera-cabeza">
          <div>
            <p className="section-kicker">Nuestra cartera</p>
            <h2 id="cartera-titulo">Proyectos y apartamentos que asesoramos</h2>
            <p className="section-lede">
              Proyectos de varias constructoras y apartamentos terminados o en construcción. Cada precio va con su
              fecha de corte; pasa el cursor —o toca— para ver lo que hace especial a cada uno.
            </p>
          </div>
          {cuantos.apartamento > 0 && (
            <div
              className="cartera-oferta"
              role="group"
              aria-label="Qué ver"
              style={{ "--indice": indice } as React.CSSProperties}
            >
              <span className="cartera-oferta-marca" aria-hidden="true" />
              {OFERTAS.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  aria-pressed={oferta === o.id}
                  className={oferta === o.id ? "activo" : undefined}
                  onClick={() => {
                    cambiar(setOferta)(o.id);
                    // Los filtros que ya no aplican a esa oferta se sueltan: la
                    // zona y el tipo siempre; el estado, si esa oferta no lo tiene.
                    setZona(null);
                    setTipo(null);
                    const nuevos = o.id === "todo" ? fichas : fichas.filter((f) => f.origen === o.id);
                    if (estado && !nuevos.some((f) => f.estado === estado)) setEstado(null);
                  }}
                >
                  {o.texto} <span>{cuantos[o.id]}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="cartera-barra">
          <div className="cartera-filtros" role="group" aria-label="Filtrar la cartera">
            <Filtro
              titulo="Zona"
              todas="Todas"
              opciones={zonas.map((z) => ({ id: z, etiqueta: z }))}
              valor={zona}
              alCambiar={cambiar(setZona)}
            />
            <Filtro
              titulo="Tipo"
              todas="Todos"
              opciones={tipos.map((t) => ({ id: t, etiqueta: TIPOS[t] ?? t }))}
              valor={tipo}
              alCambiar={cambiar(setTipo)}
            />
            <Filtro
              titulo="Estado"
              todas="Todos"
              opciones={estados.map((e) => ({ id: e, etiqueta: ESTADOS[e] }))}
              valor={estado}
              alCambiar={cambiar(setEstado)}
            />
            {hayPrecios && (
              <Filtro
                titulo="Precio"
                todas="Todos"
                opciones={RANGOS.map((r) => ({ id: r.id, etiqueta: r.etiqueta }))}
                valor={rango}
                alCambiar={cambiar(setRango)}
              />
            )}
          </div>
          <p className="cartera-conteo" aria-live="polite">
            <strong>{visibles.length}</strong> {conteo}
            {filtrando && (
              <button type="button" className="cartera-limpiar" onClick={limpiar}>
                Ver toda la cartera
              </button>
            )}
          </p>
        </div>
        {rango && (
          <p className="cartera-nota-precio">Lo que tiene precio a consultar no entra en el filtro de precio.</p>
        )}

        {visibles.length > 0 ? (
          filtro === 0 ? (
            <RevealGrupo className="cartera-grilla">{celdas}</RevealGrupo>
          ) : (
            <div key={filtro} className="cartera-grilla cartera-grilla-filtrada">
              {celdas}
            </div>
          )
        ) : (
          <div className="cartera-vacia">
            <p>Con esa combinación no hay nada en la cartera hoy.</p>
            <button type="button" className="btn-primary" onClick={limpiar}>
              Ver toda la cartera
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

/** Una lista desplegable nativa: compacta, accesible y cómoda en el teléfono. */
function Filtro({
  titulo,
  todas,
  opciones,
  valor,
  alCambiar,
}: {
  titulo: string;
  todas: string;
  opciones: { id: string; etiqueta: string }[];
  valor: string | null;
  alCambiar: (v: string | null) => void;
}) {
  if (opciones.length < 2) return null;
  return (
    <label className={"cartera-filtro" + (valor ? " activo" : "")}>
      <span>{titulo}</span>
      <select value={valor ?? ""} onChange={(e) => alCambiar(e.target.value || null)}>
        <option value="">{todas}</option>
        {opciones.map((o) => (
          <option key={o.id} value={o.id}>
            {o.etiqueta}
          </option>
        ))}
      </select>
    </label>
  );
}
