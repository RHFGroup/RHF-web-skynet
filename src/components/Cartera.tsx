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
 *
 * Desde el 25-sep-2026 los filtros son una sola barra de listas desplegables
 * (antes, un panel de botones que empujaba las tarjetas fuera de la primera
 * pantalla): lo primero que se ve de la sección son los proyectos. Las fotos
 * de cada tarjeta rotan, cada una con su desfase.
 *
 * 25-sep-2026, tarde: la cartera y los apartamentos disponibles van juntos,
 * en un mismo bloque (page.tsx). Arriba, a la derecha del título, dos saltos
 * —«Proyectos» y «Apartamentos»— dicen que hay dos listas (SaltosOferta).
 */
import { useMemo, useState } from "react";
import RevealGrupo from "@/components/RevealGrupo";
import SaltosOferta from "@/components/SaltosOferta";
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

export default function Cartera({
  fichas,
  saltos,
}: {
  fichas: Ficha[];
  /** Cuántos proyectos y apartamentos hay, para los saltos del bloque. */
  saltos?: { proyectos: number; apartamentos: number };
}) {
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
        <div className="oferta-cabeza">
          <div>
            <p className="section-kicker">Nuestra cartera</p>
            <h2 id="cartera-titulo">Proyectos que asesoramos</h2>
            <p className="section-lede">
              Cada precio va con la fecha de corte de la hoja del constructor. Pasa
              el cursor —o toca— para ver lo que hace especial a cada proyecto.
            </p>
          </div>
          {saltos && <SaltosOferta activo="proyectos" {...saltos} />}
        </div>

        <div className="cartera-barra">
          <div className="cartera-filtros" role="group" aria-label="Filtrar la cartera">
            <Filtro
              titulo="Zona"
              todas="Todas"
              opciones={zonas.map((z) => ({ id: z, etiqueta: z }))}
              valor={zona}
              alCambiar={setZona}
            />
            <Filtro
              titulo="Tipo"
              todas="Todos"
              opciones={tipos.map((t) => ({ id: t, etiqueta: TIPOS[t] ?? t }))}
              valor={tipo}
              alCambiar={setTipo}
            />
            <Filtro
              titulo="Estado"
              todas="Todos"
              opciones={estados.map((e) => ({ id: e, etiqueta: ESTADOS[e] }))}
              valor={estado}
              alCambiar={setEstado}
            />
            {hayPrecios && (
              <Filtro
                titulo="Precio desde"
                todas="Todos"
                opciones={RANGOS.map((r) => ({ id: r.id, etiqueta: r.etiqueta }))}
                valor={rango}
                alCambiar={setRango}
              />
            )}
          </div>
          <p className="cartera-conteo" aria-live="polite">
            <strong>{visibles.length}</strong> {visibles.length === 1 ? "proyecto" : "proyectos"}
            {filtrando && (
              <button type="button" className="cartera-limpiar" onClick={limpiar}>
                Ver toda la cartera
              </button>
            )}
          </p>
        </div>
        {rango && (
          <p className="cartera-nota-precio">
            Los proyectos con precio a consultar no entran en el filtro de precio.
          </p>
        )}

        {visibles.length > 0 ? (
          <RevealGrupo className="cartera-grilla">
            {visibles.map((f, i) => (
              <div key={f.slug} className="cartera-celda" style={{ "--i": i % 3 } as React.CSSProperties}>
                <TarjetaGiro ficha={f} desdeCartera prioritaria={i === 0} retraso={i * 900} />
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
