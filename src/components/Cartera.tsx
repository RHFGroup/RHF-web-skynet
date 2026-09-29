"use client";

/**
 * Nuestra cartera — proyectos y apartamentos, en las tarjetas que giran, con
 * filtros.
 *
 * El visitante ve todo lo que asesoramos, filtra por lo que le importa y cada
 * tarjeta abre su página propia.
 *
 * 28-sep-2026 (pedido de Rafael: «que se muevan las propiedades de manera
 * horizontal» y «que floten»): la cartera es una fila horizontal en todas las
 * pantallas —tres tarjetas a la vista en escritorio, dos en tableta y una y
 * algo en el teléfono— y las tarjetas flotan suave, cada una a su ritmo.
 *
 * 28-sep-2026, tarde («agiliza el carrusel, más rápido, más fluido, como una
 * calesita»): la fila gira sin parar y sin final, a velocidad constante —una
 * tarjeta cada 4 s— en vez de avanzar a saltos. El motor está en
 * src/lib/calesita.ts: frena suave con el mouse o el foco encima, con una
 * tarjeta girada, mientras alguien la arrastra con el dedo y con el botón de
 * pausa (que también quieta la flotación). Con «reducir movimiento» no gira
 * ni flota: queda una fila que se desliza a mano. Debajo van las flechas.
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
 *
 * 29-sep-2026 (sitio en inglés): las fichas llegan ya en el idioma de la
 * página; aquí se traducen los filtros, el conteo y los controles. Las claves
 * de los filtros (la zona, el tipo, el estado) siguen siendo las del español:
 * cambia lo que se muestra, no la lógica.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import RevealGrupo from "@/components/RevealGrupo";
import TarjetaGiro from "@/components/TarjetaGiro";
import { etiquetaEstado, etiquetaTipo } from "@/i18n/datos";
import type { Idioma } from "@/i18n/idioma";
import type { Ficha } from "@/lib/ficha";
import { useCalesita } from "@/lib/calesita";
import { usePreferenciaMovimiento } from "@/lib/motion";
import "@/styles/cartera.css";

type Rango = { id: string; etiqueta: Record<Idioma, string>; min: number; max: number };
type Oferta = "todo" | Ficha["origen"];

/**
 * Tramos de precio. Son cortes para filtrar, no precios de nadie. En inglés el
 * precio en pesos se escribe «COP …», nunca «$» solo (docs/i18n.md).
 */
const RANGOS: Rango[] = [
  {
    id: "hasta-350",
    etiqueta: { es: "Hasta $350 millones", en: "Up to COP 350 million" },
    min: 0,
    max: 350_000_000,
  },
  {
    id: "350-500",
    etiqueta: { es: "$350 a $500 millones", en: "COP 350 to 500 million" },
    min: 350_000_000,
    max: 500_000_000,
  },
  {
    id: "mas-500",
    etiqueta: { es: "Más de $500 millones", en: "Over COP 500 million" },
    min: 500_000_000,
    max: Infinity,
  },
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

const TEXTOS = {
  es: {
    todo: "Todo",
    proyectos: "Proyectos",
    apartamentos: "Apartamentos",
    kicker: "Nuestra cartera",
    titulo: "Proyectos y apartamentos que asesoramos",
    lede: "Proyectos de varias constructoras y apartamentos terminados o en construcción. Cada precio va con su fecha de corte; pasa el cursor —o toca— para ver lo que hace especial a cada uno.",
    queVer: "Qué ver",
    filtrar: "Filtrar la cartera",
    zona: "Zona",
    tipo: "Tipo",
    estado: "Estado",
    precio: "Precio",
    todas: "Todas",
    todos: "Todos",
    unApartamento: "apartamento",
    apartamentosConteo: "apartamentos",
    unProyecto: "proyecto",
    proyectosConteo: "proyectos",
    unaOpcion: "opción",
    opciones: "opciones",
    verToda: "Ver toda la cartera",
    notaPrecio: "Lo que tiene precio a consultar no entra en el filtro de precio.",
    activar: "Activar animaciones",
    mover: "Mover la cartera",
    anteriores: "Ver las anteriores",
    siguientes: "Ver las siguientes",
    pausar: "Pausar el movimiento",
    reanudar: "Reanudar el movimiento",
    vacia: "Con esa combinación no hay nada en la cartera hoy.",
  },
  en: {
    todo: "All",
    proyectos: "Projects",
    apartamentos: "Apartments",
    kicker: "Our portfolio",
    titulo: "Projects and apartments we advise on",
    lede: "Projects from several builders, and apartments that are finished or under construction. Every price shows its as-of date; hover—or tap—to see what makes each one special.",
    queVer: "What to show",
    filtrar: "Filter the portfolio",
    zona: "Location",
    tipo: "Type",
    estado: "Status",
    precio: "Price",
    todas: "All",
    todos: "All",
    unApartamento: "apartment",
    apartamentosConteo: "apartments",
    unProyecto: "project",
    proyectosConteo: "projects",
    unaOpcion: "option",
    opciones: "options",
    verToda: "View the full portfolio",
    notaPrecio: "Listings with the price on request are not included in the price filter.",
    activar: "Turn on animations",
    mover: "Move the portfolio",
    anteriores: "Show previous",
    siguientes: "Show next",
    pausar: "Pause the motion",
    reanudar: "Resume the motion",
    vacia: "Nothing in the portfolio matches that combination today.",
  },
} satisfies Record<Idioma, Record<string, string>>;

const mayuscula = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** El tipo en el filtro: el de siempre en español; en inglés, el de `etiquetaTipo`. */
function textoTipo(tipo: NonNullable<Ficha["tipoInmueble"]>, idioma: Idioma): string {
  return idioma === "es" ? TIPOS[tipo] ?? tipo : mayuscula(etiquetaTipo(tipo, idioma));
}

/** El estado en el filtro: el de siempre en español; en inglés, el de `etiquetaEstado`. */
function textoEstado(estado: Ficha["estado"], idioma: Idioma): string {
  return idioma === "es" ? ESTADOS[estado] : mayuscula(etiquetaEstado(estado, idioma));
}

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

export default function Cartera({ fichas, idioma = "es" }: { fichas: Ficha[]; idioma?: Idioma }) {
  const t = TEXTOS[idioma];
  const [oferta, setOferta] = useState<Oferta>("todo");
  const [zona, setZona] = useState<string | null>(null);
  const [tipo, setTipo] = useState<string | null>(null);
  const [estado, setEstado] = useState<string | null>(null);
  const [rango, setRango] = useState<string | null>(null);
  // Hasta que la persona filtra, la grilla entra con el scroll (RevealGrupo);
  // después, cada cambio de filtro vuelve a repartir las tarjetas con una
  // entrada corta (cartera.css, `.cartera-grilla-filtrada`).
  const [filtro, setFiltro] = useState(0);
  // La calesita (src/lib/calesita.ts): la zona con las flechas y el recorte
  // visible, que contiene la fila de tarjetas.
  const carril = useRef<HTMLDivElement>(null);
  const vista = useRef<HTMLDivElement>(null);
  const [pausada, setPausada] = useState(false);

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

  const calesita = useCalesita({ carril, vista, clave: `${filtro}:${visibles.length}`, pausada });
  // Si el sistema pide reducir el movimiento (ahorro de batería, accesibilidad)
  // la cartera no gira; se ofrece activarlo aquí mismo, donde se nota.
  const movimiento = usePreferenciaMovimiento();
  const ofrecerMovimiento = movimiento.listo && movimiento.sistema && movimiento.preferencia === "auto";

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
        ? t.unApartamento
        : t.apartamentosConteo
      : oferta === "proyecto"
        ? visibles.length === 1
          ? t.unProyecto
          : t.proyectosConteo
        : visibles.length === 1
          ? t.unaOpcion
          : t.opciones;

  const OFERTAS: { id: Oferta; texto: string }[] = [
    { id: "todo", texto: t.todo },
    { id: "proyecto", texto: t.proyectos },
    { id: "apartamento", texto: t.apartamentos },
  ];
  const indice = OFERTAS.findIndex((o) => o.id === oferta);

  const celdas = visibles.map((f, i) => (
    <div key={f.slug} className="cartera-celda" style={{ "--i": i % 6 } as React.CSSProperties}>
      {/* Tres capas, cada una con su transform: la celda gira con la calesita,
          `.cartera-entra` hace la entrada con el scroll o el filtro, y
          `.cartera-flota` la flotación. */}
      <div className="cartera-entra">
        <div className="cartera-flota" style={{ "--f": i % 4 } as React.CSSProperties}>
          <TarjetaGiro ficha={f} desdeCartera prioritaria={i === 0} retraso={i * 900} idioma={idioma} />
        </div>
      </div>
    </div>
  ));

  return (
    <section
      className={"cartera section" + (pausada ? " cartera-quieta" : "")}
      id="cartera"
      aria-labelledby="cartera-titulo"
    >
      {/* Anclas de los enlaces que llegan filtrados. */}
      {Object.keys(ANCLAS).map((a) => (
        <span key={a} id={a} className="cartera-ancla" aria-hidden="true" />
      ))}
      <div className="section-shell">
        <div className="cartera-cabeza">
          <div>
            <p className="section-kicker">{t.kicker}</p>
            <h2 id="cartera-titulo">{t.titulo}</h2>
            <p className="section-lede">{t.lede}</p>
          </div>
          {cuantos.apartamento > 0 && (
            <div
              className="cartera-oferta"
              role="group"
              aria-label={t.queVer}
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
          <div className="cartera-filtros" role="group" aria-label={t.filtrar}>
            {/* Las zonas son nombres de lugar: no se traducen. */}
            <Filtro
              titulo={t.zona}
              todas={t.todas}
              opciones={zonas.map((z) => ({ id: z, etiqueta: z }))}
              valor={zona}
              alCambiar={cambiar(setZona)}
            />
            <Filtro
              titulo={t.tipo}
              todas={t.todos}
              opciones={tipos.map((x) => ({ id: x, etiqueta: textoTipo(x, idioma) }))}
              valor={tipo}
              alCambiar={cambiar(setTipo)}
            />
            <Filtro
              titulo={t.estado}
              todas={t.todos}
              opciones={estados.map((e) => ({ id: e, etiqueta: textoEstado(e, idioma) }))}
              valor={estado}
              alCambiar={cambiar(setEstado)}
            />
            {hayPrecios && (
              <Filtro
                titulo={t.precio}
                todas={t.todos}
                opciones={RANGOS.map((r) => ({ id: r.id, etiqueta: r.etiqueta[idioma] }))}
                valor={rango}
                alCambiar={cambiar(setRango)}
              />
            )}
          </div>
          <p className="cartera-conteo" aria-live="polite">
            <strong>{visibles.length}</strong> {conteo}
            {filtrando && (
              <button type="button" className="cartera-limpiar" onClick={limpiar}>
                {t.verToda}
              </button>
            )}
          </p>
        </div>
        {rango && <p className="cartera-nota-precio">{t.notaPrecio}</p>}

        {visibles.length > 0 ? (
          <div className={"cartera-carril" + (calesita.activa ? " calesita-activa" : "")} ref={carril}>
            <div className="cartera-vista" ref={vista}>
              {filtro === 0 ? (
                <RevealGrupo className="cartera-grilla">{celdas}</RevealGrupo>
              ) : (
                <div key={filtro} className="cartera-grilla cartera-grilla-filtrada">
                  {celdas}
                </div>
              )}
            </div>
            {calesita.desborda && (
              <div className="cartera-mando">
                {ofrecerMovimiento && (
                  <button type="button" className="cartera-mando-activar" onClick={() => movimiento.elegir("activo")}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M8 5.5v13l11-6.5z" />
                    </svg>
                    {t.activar}
                  </button>
                )}
                <div className="cartera-mando-botones" role="group" aria-label={t.mover}>
                  <button type="button" className="cartera-mando-boton" onClick={() => calesita.mover(-1)} aria-label={t.anteriores}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="m15 18-6-6 6-6" />
                    </svg>
                  </button>
                  {calesita.activa && (
                    <button
                      type="button"
                      className="cartera-mando-boton"
                      onClick={() => setPausada((v) => !v)}
                      aria-pressed={pausada}
                      aria-label={pausada ? t.reanudar : t.pausar}
                    >
                      {pausada ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M8 5.5v13l11-6.5z" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <rect x="6.5" y="5" width="3.6" height="14" rx="1" />
                          <rect x="13.9" y="5" width="3.6" height="14" rx="1" />
                        </svg>
                      )}
                    </button>
                  )}
                  <button type="button" className="cartera-mando-boton" onClick={() => calesita.mover(1)} aria-label={t.siguientes}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="cartera-vacia">
            <p>{t.vacia}</p>
            <button type="button" className="btn-primary" onClick={limpiar}>
              {t.verToda}
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
