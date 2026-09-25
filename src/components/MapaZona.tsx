"use client";

/**
 * «El territorio» — el mapa real de la zona (prompt 3, rama feat/territorio-mapa).
 *
 * El mapa ilustrado de la sección Zona Norte cuenta la historia; este es la
 * herramienta para explorar con precisión: proyectos, servicios, lo que viene
 * y el contacto. Filtros por categoría, tarjetas a la derecha, vuelo suave al
 * punto elegido y, al final, «Agendar recorrido».
 *
 * ⛔ **Cada pin es una afirmación.** Solo entran puntos con coordenada
 * verificada, y cada tarjeta dice «Coordenada verificada» con su fuente. Los
 * lugares salen de src/data/zona.ts (los mismos del mapa ilustrado) y los
 * proyectos de src/data/proyectos.ts: un proyecto sin coordenada verificada
 * está en la lista, con sus botones, pero no en el mapa. El resto del
 * territorio —la Ciénaga de la Virgen, la Vía al Mar— lo dibuja el mapa base
 * con sus propios datos: encuadrar no es afirmar.
 *
 * Leaflet se descarga cuando la sección está por entrar en pantalla, y si la
 * descarga falla la lista cuenta lo mismo. Las teselas y su atribución vienen
 * de src/lib/leaflet.ts (CARTO Voyager con llave; OpenStreetMap mientras no
 * exista la llave).
 *
 * Móvil: el mapa a todo el ancho y a un 70 % de la pantalla, los filtros en
 * una fila que se desliza, la tarjeta del punto tocado en una hoja inferior
 * con los botones siempre a la vista y la lista en carrusel debajo.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import FormularioGuia from "@/components/FormularioGuia";
import { IconoWhatsApp } from "@/components/Iconos";
import RevealGrupo from "@/components/RevealGrupo";
import type { PinProyecto } from "@/components/MapaIlustrado";
import { enlaceWhatsApp } from "@/data/contacto";
import { GUIAS } from "@/data/proceso";
import { CATEGORIAS, LUGARES, TIEMPOS_ZONA, type Categoria, type Lugar } from "@/data/zona";
import type { Ficha } from "@/lib/ficha";
import { svgGlifo } from "@/lib/glifos";
import { cargarLeaflet, TESELAS } from "@/lib/leaflet";
import { usePrefersReducedMotion } from "@/lib/motion";
import "@/styles/territorio.css";

type Filtro = "todo" | "proyectos" | Exclude<Categoria, "obras"> | "viene";

type Item =
  | { tipo: "proyecto"; id: string; ficha: Ficha; pin: PinProyecto | null }
  | { tipo: "lugar"; id: string; lugar: Lugar };

type Caja = [[number, number], [number, number]];

/** Arranca en Cartagena —el Centro, Bocagrande, Manga— y vuela a la Zona Norte. */
const CIUDAD: Caja = [
  [10.385, -75.565],
  [10.465, -75.49],
];
/** Del aeropuerto a Punta Canoa, con Serena del Mar y Tierra Baja. */
const ZONA_NORTE: Caja = [
  [10.435, -75.53],
  [10.565, -75.452],
];

const ESTADO: Record<Ficha["estado"], string> = {
  "en lanzamiento": "En lanzamiento",
  "en construcción": "En construcción",
  "entrega inmediata": "Entrega inmediata",
};
const TIPO: Record<NonNullable<Ficha["tipoInmueble"]>, string> = {
  apartamentos: "Apartamentos",
  casas: "Casas",
  apartaestudios: "Apartaestudios",
};

const claseEstado = (e: NonNullable<Lugar["estado"]>) =>
  e === "Entregado" ? "entregado" : e === "En obra" ? "obra" : "estudio";

function coincide(it: Item, f: Filtro): boolean {
  if (f === "todo") return true;
  if (f === "proyectos") return it.tipo === "proyecto";
  if (it.tipo === "proyecto") return false;
  if (f === "viene") return it.lugar.capa === "viene";
  // Las categorías muestran lo que funciona hoy; lo que viene tiene su filtro.
  return it.lugar.capa === "hoy" && it.lugar.categorias.includes(f);
}

function coordenadaDe(it: Item): { lat: number; lon: number } | null {
  if (it.tipo === "lugar") return it.lugar.coordenada;
  return it.pin ? { lat: it.pin.lat, lon: it.pin.lon } : null;
}

const nombreDe = (it: Item) => (it.tipo === "proyecto" ? it.ficha.nombre : it.lugar.nombre);
const agendarVisita = (nombre: string) => enlaceWhatsApp(`Hola Rafael, quiero agendar una visita a ${nombre}.`);

/* eslint-disable @typescript-eslint/no-explicit-any -- Leaflet llega de la CDN, sin tipos */
export default function MapaZona({ proyectos, pines }: { proyectos: Ficha[]; pines: PinProyecto[] }) {
  const reducido = usePrefersReducedMotion();
  const seccion = useRef<HTMLElement | null>(null);
  const contenedor = useRef<HTMLDivElement | null>(null);
  const lista = useRef<HTMLUListElement | null>(null);
  const mapaRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const marcadores = useRef<Map<string, any>>(new Map());
  const trayectos = useRef<any>(null);

  const [cerca, setCerca] = useState(false);
  const [enPantalla, setEnPantalla] = useState(false);
  const [listo, setListo] = useState(false);
  const [falló, setFalló] = useState(false);
  const [yaVoló, setYaVoló] = useState(false);
  const [rueda, setRueda] = useState(false);
  const [movil, setMovil] = useState(false);
  const [filtro, setFiltro] = useState<Filtro>("todo");
  const [cambióFiltro, setCambióFiltro] = useState(false);
  const [elegido, setElegido] = useState<{ id: string; desde: "mapa" | "lista" } | null>(null);
  const [guia, setGuia] = useState(false);

  const items: Item[] = useMemo(
    () => [
      ...proyectos.map((f) => ({
        tipo: "proyecto" as const,
        id: f.slug,
        ficha: f,
        pin: pines.find((p) => p.slug === f.slug) ?? null,
      })),
      ...LUGARES.filter((l) => l.capa === "hoy").map((l) => ({ tipo: "lugar" as const, id: l.id, lugar: l })),
      ...LUGARES.filter((l) => l.capa === "viene").map((l) => ({ tipo: "lugar" as const, id: l.id, lugar: l })),
    ],
    [proyectos, pines],
  );
  const filtros: { id: Filtro; nombre: string }[] = [
    { id: "todo", nombre: "Todo" },
    { id: "proyectos", nombre: "Proyectos" },
    ...CATEGORIAS,
    { id: "viene", nombre: "Lo que viene" },
  ].filter((f) => items.some((it) => coincide(it, f.id as Filtro))) as { id: Filtro; nombre: string }[];
  const visibles = items.filter((it) => coincide(it, filtro));
  const itemElegido = elegido ? items.find((it) => it.id === elegido.id) ?? null : null;

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const actualizar = () => setMovil(mq.matches);
    actualizar();
    mq.addEventListener("change", actualizar);
    return () => mq.removeEventListener("change", actualizar);
  }, []);

  // Dos pestillos de una sola vía, medidos en el propio scroll (sin
  // IntersectionObserver: sus avisos se congelan en pestañas de fondo):
  // `cerca` descarga Leaflet con margen; `enPantalla` dispara el vuelo.
  useEffect(() => {
    const el = seccion.current;
    if (!el) return;
    let ultimo = 0;
    const revisar = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      if (r.top < vh + 400 && r.bottom > -400) setCerca(true);
      const lienzo = contenedor.current?.getBoundingClientRect();
      if (lienzo && lienzo.top < vh * 0.72 && lienzo.bottom > vh * 0.2) {
        setEnPantalla(true);
        window.removeEventListener("scroll", alMover);
        window.removeEventListener("resize", alMover);
      }
    };
    const alMover = () => {
      const ahora = performance.now();
      if (ahora - ultimo < 80) return;
      ultimo = ahora;
      revisar();
    };
    revisar();
    window.addEventListener("scroll", alMover, { passive: true });
    window.addEventListener("resize", alMover, { passive: true });
    return () => {
      window.removeEventListener("scroll", alMover);
      window.removeEventListener("resize", alMover);
    };
  }, []);

  // El mapa se arma una vez. El clic de un pin usa la forma funcional de
  // setElegido: así lee la selección vigente, no la del momento en que el
  // pin se creó.
  useEffect(() => {
    if (!cerca || mapaRef.current || !contenedor.current) return;
    let cancelado = false;
    cargarLeaflet()
      .then((L: any) => {
        if (cancelado || !contenedor.current) return;
        const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const mapa = L.map(contenedor.current, {
          zoomControl: false,
          scrollWheelZoom: false, // la rueda es del usuario hasta que haga clic en el mapa
          keyboard: false,
          zoomSnap: 0.25,
          zoomAnimation: !quieto,
          fadeAnimation: !quieto,
          markerZoomAnimation: !quieto,
        });
        mapa.fitBounds(quieto ? ZONA_NORTE : CIUDAD, { padding: [28, 28], animate: false });
        L.tileLayer(TESELAS.url, {
          subdomains: TESELAS.subdominios,
          maxZoom: TESELAS.maxZoom,
          attribution: TESELAS.atribucion,
        }).addTo(mapa);

        items.forEach((it, i) => {
          const c = coordenadaDe(it);
          if (!c) return;
          const html =
            it.tipo === "proyecto"
              ? `<span class="tr-pin-cuerpo" style="--i:${i}"><span class="tr-pin-halo"></span><span class="tr-pin-punto"></span></span>`
              : `<span class="tr-pin-cuerpo" style="--i:${i}"><span class="tr-pin-icono">${svgGlifo(it.lugar.icono, 15)}</span></span>`;
          const clase =
            "tr-pin " +
            (it.tipo === "proyecto" ? "tr-pin-proyecto" : "tr-pin-lugar") +
            (it.tipo === "lugar" && it.lugar.capa === "viene" ? " tr-pin-viene" : "");
          const tam = it.tipo === "proyecto" ? 34 : 30;
          const marcador = L.marker([c.lat, c.lon], {
            icon: L.divIcon({ className: clase, html, iconSize: [tam, tam], iconAnchor: [tam / 2, tam / 2] }),
            title: nombreDe(it),
            keyboard: false,
            riseOnHover: true,
          });
          marcador.on("click", () =>
            setElegido((actual) => (actual?.id === it.id ? null : { id: it.id, desde: "mapa" })),
          );
          marcadores.current.set(it.id, marcador);
        });

        mapa.on("click", () => {
          mapa.scrollWheelZoom.enable();
          setRueda(true);
        });
        mapa.on("mouseout", () => {
          mapa.scrollWheelZoom.disable();
          setRueda(false);
        });
        trayectos.current = L.layerGroup().addTo(mapa);
        mapaRef.current = mapa;
        leafletRef.current = L;
        setListo(true);
      })
      .catch(() => {
        if (!cancelado) setFalló(true);
      });
    return () => {
      cancelado = true;
    };
  }, [cerca, items]);

  // Los pines que corresponden al filtro, y solo esos.
  useEffect(() => {
    const mapa = mapaRef.current;
    if (!listo || !mapa) return;
    items.forEach((it) => {
      const m = marcadores.current.get(it.id);
      if (!m) return;
      if (coincide(it, filtro)) {
        if (!mapa.hasLayer(m)) m.addTo(mapa);
      } else if (mapa.hasLayer(m)) {
        m.remove();
      }
    });
  }, [listo, filtro, items]);

  // Al entrar en pantalla: de Cartagena a la Zona Norte, y los pines caen.
  useEffect(() => {
    const mapa = mapaRef.current;
    if (!listo || !mapa || yaVoló) return;
    if (reducido) {
      setYaVoló(true);
      return;
    }
    if (!enPantalla) return;
    mapa.once("moveend", () => setYaVoló(true));
    mapa.flyToBounds(ZONA_NORTE, { padding: [28, 28], duration: 2.2, easeLinearity: 0.2 });
    // Respaldo: si el vuelo no avisa que terminó, los pines igual aparecen.
    const respaldo = setTimeout(() => setYaVoló(true), 3200);
    return () => clearTimeout(respaldo);
  }, [listo, enPantalla, reducido, yaVoló]);

  // Si el lienzo cambia de tamaño (girar el teléfono), Leaflet se entera.
  useEffect(() => {
    if (!listo) return;
    let t: ReturnType<typeof setTimeout>;
    const alCambiar = () => {
      clearTimeout(t);
      t = setTimeout(() => mapaRef.current?.invalidateSize(), 180);
    };
    window.addEventListener("resize", alCambiar);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", alCambiar);
    };
  }, [listo]);

  // El punto elegido: su pin se resalta, el mapa vuela hasta él, su tarjeta se
  // ve en la lista y, si es un proyecto con tiempos reales, salen las líneas.
  useEffect(() => {
    const mapa = mapaRef.current;
    const L = leafletRef.current;
    marcadores.current.forEach((m, id) => m.getElement()?.classList.toggle("activo", id === elegido?.id));
    trayectos.current?.clearLayers();
    if (!elegido) return;
    const it = items.find((x) => x.id === elegido.id);
    if (!it) return;

    const c = coordenadaDe(it);
    if (mapa && c) {
      mapa.flyTo([c.lat, c.lon], Math.max(mapa.getZoom(), 14.5), { duration: reducido ? 0 : 1.1 });
    }
    if (mapa && L && it.tipo === "proyecto" && it.pin) {
      it.pin.tiempos.forEach((tr) => {
        const destino = LUGARES.find((l) => l.id === tr.lugar)?.coordenada;
        if (!destino) return;
        L.polyline(
          [
            [it.pin!.lat, it.pin!.lon],
            [destino.lat, destino.lon],
          ],
          { className: "tr-trayecto", dashArray: "6 7", weight: 2 },
        )
          .bindTooltip(`${tr.minutos} min`, { permanent: true, direction: "center", className: "tr-trayecto-tiempo" })
          .addTo(trayectos.current);
      });
    }

    // La tarjeta a la vista dentro de la lista, sin mover la página.
    const ul = lista.current;
    const tarjeta = ul?.querySelector<HTMLElement>(`[data-id="${elegido.id}"]`);
    if (ul && tarjeta) {
      if (ul.scrollWidth > ul.clientWidth + 4) {
        ul.scrollTo({ left: tarjeta.offsetLeft - ul.offsetLeft - 16, behavior: reducido ? "auto" : "smooth" });
      } else {
        ul.scrollTo({ top: tarjeta.offsetTop - ul.offsetTop - 12, behavior: reducido ? "auto" : "smooth" });
      }
    }
  }, [elegido, items, reducido]);

  useEffect(() => {
    if (!elegido) return;
    const cerrar = (e: KeyboardEvent) => e.key === "Escape" && setElegido(null);
    window.addEventListener("keydown", cerrar);
    return () => window.removeEventListener("keydown", cerrar);
  }, [elegido]);

  const cambiarFiltro = (f: Filtro) => {
    setFiltro(f);
    setCambióFiltro(true);
    if (elegido && !coincide(items.find((it) => it.id === elegido.id)!, f)) setElegido(null);
  };
  const verTodo = () => {
    setElegido(null);
    mapaRef.current?.flyToBounds(ZONA_NORTE, { padding: [28, 28], duration: reducido ? 0 : 1 });
  };

  const hoja = movil && elegido?.desde === "mapa" && itemElegido;

  return (
    <section className="section section-mapa tr" id="mapa" ref={seccion}>
      <div className="section-shell">
        <p className="section-kicker">El territorio</p>
        <h2>Mira la zona antes de mirar el apartamento</h2>
        <p className="section-lede">
          Mueve el mapa y reconoce el terreno: la Ciénaga de la Virgen, la Vía al Mar y los servicios que ya
          funcionan.
        </p>

        <div className="tr-filtros" role="group" aria-label="Qué mostrar en el mapa">
          {filtros.map((f) => (
            <button
              key={f.id}
              type="button"
              className="tr-chip"
              aria-pressed={filtro === f.id}
              onClick={() => cambiarFiltro(filtro === f.id && f.id !== "todo" ? "todo" : f.id)}
            >
              {f.nombre}
            </button>
          ))}
        </div>

        {/* Datos rápidos: solo con tiempos reales que entregue Rafael (hoy no hay). */}
        {TIEMPOS_ZONA.length > 0 && (
          <div className="tr-tiempos">
            <ul>
              {TIEMPOS_ZONA.map((t) => (
                <li key={t.destino}>
                  <strong>{t.minutos} min</strong>
                  <span>{t.destino}</span>
                </li>
              ))}
            </ul>
            <p>
              Desde {TIEMPOS_ZONA[0].desde} · {TIEMPOS_ZONA[0].fuente} · {TIEMPOS_ZONA[0].fecha}
            </p>
          </div>
        )}

        <div className="tr-grid">
          <div
            className={
              "tr-mapa" +
              (listo && !yaVoló && !reducido ? " tr-armado" : "") +
              (yaVoló ? " tr-caen" : "") +
              (rueda ? " tr-rueda" : "")
            }
          >
            <div ref={contenedor} className="tr-lienzo" aria-hidden="true" />
            {!listo && (
              <p className="tr-cargando">
                {falló
                  ? "El mapa quedó fuera de alcance. La lista tiene los mismos puntos."
                  : "Preparando el mapa de la zona…"}
              </p>
            )}
            {listo && (
              <>
                <div className="tr-controles">
                  <button type="button" aria-label="Acercar el mapa" onClick={() => mapaRef.current?.zoomIn()}>
                    +
                  </button>
                  <button type="button" aria-label="Alejar el mapa" onClick={() => mapaRef.current?.zoomOut()}>
                    −
                  </button>
                  <button type="button" aria-label="Ver toda la zona" className="tr-control-todo" onClick={verTodo}>
                    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                      <path
                        d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </div>
                <p className="tr-pista" aria-hidden="true">
                  Haz clic en el mapa para acercar con la rueda
                </p>
              </>
            )}

            {/* Teléfono: la tarjeta del punto tocado sube desde abajo. */}
            {hoja && (
              <div className="tr-hoja" role="dialog" aria-label={nombreDe(itemElegido)}>
                <button type="button" className="tr-hoja-cerrar" onClick={() => setElegido(null)} aria-label="Cerrar">
                  ×
                </button>
                <Detalle it={itemElegido} enHoja />
              </div>
            )}
          </div>

          <div className="tr-panel">
            <RevealGrupo>
              <ul
                ref={lista}
                key={filtro}
                className={"tr-lista" + (cambióFiltro ? " tr-lista-nueva" : "")}
                aria-label="Puntos del mapa"
              >
                {visibles.map((it, i) => (
                  <li
                    key={it.id}
                    data-id={it.id}
                    className={
                      "tr-item tr-item-" + it.tipo + (elegido?.id === it.id ? " activo" : "")
                    }
                    style={{ "--i": i } as React.CSSProperties}
                  >
                    <button
                      type="button"
                      className="tr-item-elegir"
                      aria-pressed={elegido?.id === it.id}
                      onClick={() =>
                        setElegido(elegido?.id === it.id ? null : { id: it.id, desde: "lista" })
                      }
                    >
                      <Cabeza it={it} />
                    </button>
                    <Detalle it={it} />
                  </li>
                ))}
              </ul>
            </RevealGrupo>
          </div>
        </div>

        <p className="tr-nota">
          El mapa base dibuja el resto del territorio con datos de OpenStreetMap. Aquí marcamos solo los puntos cuya
          coordenada verificamos; cada tarjeta dice su fuente.
        </p>

        {/* ── El cierre: recorrer la zona con un asesor ── */}
        <div className="tr-cierre">
          <div>
            <h3>¿Quieres recorrer la zona con un asesor?</h3>
            <p>Recorre la Zona Norte con nosotros: los proyectos, las vías y lo que ya funciona, en una sola visita.</p>
          </div>
          <div className="tr-cierre-acciones">
            <a
              className="tr-boton tr-boton-camel"
              href={enlaceWhatsApp("Hola Rafael, quiero agendar un recorrido por la Zona Norte.")}
              target="_blank"
              rel="noopener noreferrer"
            >
              <IconoWhatsApp size={18} /> Agendar recorrido
            </a>
            {GUIAS.zona.pdf && (
              <button type="button" className="tr-boton tr-boton-borde" onClick={() => setGuia(true)}>
                Recibir la guía de la zona
              </button>
            )}
          </div>
          {guia && GUIAS.zona.pdf && (
            <div className="tr-guia">
              <FormularioGuia
                titulo={GUIAS.zona.titulo}
                pdf={GUIAS.zona.pdf}
                origen={GUIAS.zona.origen}
                alCerrar={() => setGuia(false)}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** La parte de la tarjeta que se toca para elegir el punto. */
function Cabeza({ it }: { it: Item }) {
  if (it.tipo === "proyecto") {
    const f = it.ficha;
    return (
      <span className="tr-cabeza">
        {f.foto ? (
          <img className="tr-foto" src={f.foto.src} alt="" loading="lazy" decoding="async" width={64} height={64} />
        ) : (
          <span className="tr-foto tr-foto-vacia" aria-hidden="true" />
        )}
        <span className="tr-cabeza-texto">
          <span className="tr-eyebrow">
            {f.tipoInmueble ? TIPO[f.tipoInmueble] : "Proyecto"} · {ESTADO[f.estado]}
          </span>
          <strong>{f.nombre}</strong>
          <span className="tr-precio">
            {f.precio}
            {f.corte && <small> · corte {f.corte}</small>}
          </span>
        </span>
      </span>
    );
  }
  const l = it.lugar;
  return (
    <span className="tr-cabeza">
      <span
        className={"tr-icono" + (l.capa === "viene" ? " tr-icono-viene" : "")}
        dangerouslySetInnerHTML={{ __html: svgGlifo(l.icono, 18) }}
      />
      <span className="tr-cabeza-texto">
        {l.estado && <span className={"tr-estado tr-estado-" + claseEstado(l.estado)}>{l.estado}</span>}
        <strong>{l.nombre}</strong>
        <span className="tr-frase">{l.frase}</span>
      </span>
    </span>
  );
}

/** Lo que acompaña a la tarjeta: fuente, coordenada y, en proyectos, los botones. */
function Detalle({ it, enHoja = false }: { it: Item; enHoja?: boolean }) {
  if (it.tipo === "proyecto") {
    const f = it.ficha;
    return (
      <div className="tr-detalle">
        {enHoja && <Cabeza it={it} />}
        {f.entrega && <p className="tr-dato">Entrega: {f.entrega}</p>}
        {it.pin && <p className="tr-fuente">Coordenada verificada · {it.pin.fuente}</p>}
        <div className="tr-acciones">
          <Link className="tr-boton tr-boton-marino" href={f.href}>
            Ver proyecto
          </Link>
          <a className="tr-boton tr-boton-wa" href={agendarVisita(f.nombre)} target="_blank" rel="noopener noreferrer">
            <IconoWhatsApp size={16} /> Agendar visita
          </a>
        </div>
      </div>
    );
  }
  const l = it.lugar;
  return (
    <div className="tr-detalle">
      {enHoja && <Cabeza it={it} />}
      {l.coordenada && <p className="tr-fuente">Coordenada verificada · {l.coordenada.fuente}</p>}
      <p className="tr-fuente">
        Fuente: {l.fuente} · {l.fecha}
      </p>
      {enHoja && (
        <div className="tr-acciones">
          <a
            className="tr-boton tr-boton-wa"
            href={enlaceWhatsApp(`Hola Rafael, quiero conocer la Zona Norte cerca de ${l.nombre}.`)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <IconoWhatsApp size={16} /> Agendar recorrido
          </a>
        </div>
      )}
    </div>
  );
}
