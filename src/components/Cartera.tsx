"use client";

/**
 * Nuestra cartera — las tarjetas que giran, con filtros.
 *
 * Reemplaza al recorrido anclado de fichas (una por vez al hacer scroll). El
 * visitante ve los cinco proyectos, filtra por lo que le importa y cada
 * tarjeta abre su página propia. Grilla de tres columnas en escritorio, dos
 * en tableta y carrusel que se desliza con el dedo en el teléfono.
 *
 * Los datos llegan armados del servidor (`fichaDe`): esta sección filtra y
 * ordena, no calcula precios. El filtro de precio usa solo precios
 * publicables; los proyectos «Consultar» no entran en él, y se dice.
 */
import { useMemo, useState } from "react";
import RevealGrupo from "@/components/RevealGrupo";
import TarjetaGiro from "@/components/TarjetaGiro";
import type { Ficha } from "@/lib/ficha";
import "@/styles/cartera.css";

type Rango = { id: string; etiqueta: string; min: number; max: number };

/** Tramos de «precio desde». Son cortes para filtrar, no precios de nadie. */
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

function unicos<T>(xs: (T | null)[]): T[] {
  return [...new Set(xs.filter((x): x is T => x !== null))];
}

export default function Cartera({ fichas }: { fichas: Ficha[] }) {
  const [zona, setZona] = useState<string | null>(null);
  const [tipo, setTipo] = useState<string | null>(null);
  const [estado, setEstado] = useState<string | null>(null);
  const [rango, setRango] = useState<string | null>(null);

  const zonas = unicos(fichas.map((f) => f.zona));
  const tipos = unicos(fichas.map((f) => f.tipoInmueble ?? null));
  const estados = unicos(fichas.map((f) => f.estado));
  const hayPrecios = fichas.some((f) => f.precioDesde !== null);

  const visibles = useMemo(() => {
    const r = RANGOS.find((x) => x.id === rango);
    return fichas.filter(
      (f) =>
        (!zona || f.zona === zona) &&
        (!tipo || f.tipoInmueble === tipo) &&
        (!estado || f.estado === estado) &&
        (!r || (f.precioDesde !== null && f.precioDesde >= r.min && f.precioDesde < r.max)),
    );
  }, [fichas, zona, tipo, estado, rango]);

  const filtrando = zona || tipo || estado || rango;
  const limpiar = () => {
    setZona(null);
    setTipo(null);
    setEstado(null);
    setRango(null);
  };

  return (
    <section className="cartera section" id="cartera" aria-labelledby="cartera-titulo">
      <div className="section-shell">
        <p className="section-kicker">Nuestra cartera</p>
        <h2 id="cartera-titulo">Proyectos que asesoramos</h2>
        <p className="section-lede">
          Cada precio va con la fecha de corte de la hoja del constructor. Pasa
          el cursor —o toca— para ver lo que hace especial a cada proyecto.
        </p>

        <div className="cartera-filtros" role="group" aria-label="Filtrar la cartera">
          <Grupo titulo="Zona" opciones={zonas.map((z) => ({ id: z, etiqueta: z }))} valor={zona} alCambiar={setZona} />
          <Grupo
            titulo="Tipo"
            opciones={tipos.map((t) => ({ id: t, etiqueta: TIPOS[t] ?? t }))}
            valor={tipo}
            alCambiar={setTipo}
          />
          <Grupo
            titulo="Estado"
            opciones={estados.map((e) => ({ id: e, etiqueta: ESTADOS[e] }))}
            valor={estado}
            alCambiar={setEstado}
          />
          {hayPrecios && (
            <Grupo
              titulo="Precio desde"
              opciones={RANGOS.map((r) => ({ id: r.id, etiqueta: r.etiqueta }))}
              valor={rango}
              alCambiar={setRango}
            />
          )}
        </div>

        <p className="cartera-conteo" aria-live="polite">
          {visibles.length === 1 ? "1 proyecto" : `${visibles.length} proyectos`}
          {rango && " · los proyectos con precio a consultar no entran en el filtro de precio"}
          {filtrando && (
            <button type="button" className="cartera-limpiar" onClick={limpiar}>
              Ver toda la cartera
            </button>
          )}
        </p>

        {visibles.length > 0 ? (
          <RevealGrupo className="cartera-grilla">
            {visibles.map((f, i) => (
              <div key={f.slug} className="cartera-celda" style={{ "--i": i % 3 } as React.CSSProperties}>
                <TarjetaGiro ficha={f} desdeCartera prioritaria={i === 0} />
              </div>
            ))}
          </RevealGrupo>
        ) : (
          <div className="cartera-vacia">
            <p>Con esa combinación no hay proyectos en la cartera hoy.</p>
            <button type="button" className="btn-primary" onClick={limpiar}>
              Ver toda la cartera
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function Grupo({
  titulo,
  opciones,
  valor,
  alCambiar,
}: {
  titulo: string;
  opciones: { id: string; etiqueta: string }[];
  valor: string | null;
  alCambiar: (v: string | null) => void;
}) {
  if (opciones.length < 2) return null;
  return (
    <div className="cartera-grupo">
      <span className="cartera-grupo-titulo">{titulo}</span>
      <div className="cartera-chips">
        <button type="button" aria-pressed={valor === null} onClick={() => alCambiar(null)}>
          Todos
        </button>
        {opciones.map((o) => (
          <button
            key={o.id}
            type="button"
            aria-pressed={valor === o.id}
            onClick={() => alCambiar(valor === o.id ? null : o.id)}
          >
            {o.etiqueta}
          </button>
        ))}
      </div>
    </div>
  );
}
