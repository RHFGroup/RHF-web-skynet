import Link from "next/link";
import BloqueLegal from "@/components/BloqueLegal";
import BrochureGaleria from "@/components/BrochureGaleria";
import CabeceraSitio from "@/components/CabeceraSitio";
import ContactForm from "@/components/ContactForm";
import MeInteresaButton from "@/components/MeInteresaButton";
import MiniMapa from "@/components/MiniMapa";
import PieSitio from "@/components/PieSitio";
import PortadaGaleria from "@/components/PortadaGaleria";
import RevealGrupo from "@/components/RevealGrupo";
import TarjetaGiro from "@/components/TarjetaGiro";
import TipologiasTabs, { type TipologiaVista } from "@/components/TipologiasTabs";
import VolverACartera from "@/components/VolverACartera";
import {
  IconoAmenidad,
  IconoDocumento,
  IconoEscudo,
  IconoFlecha,
  IconoWhatsApp,
} from "@/components/Iconos";
import { enlaceWhatsApp } from "@/data/contacto";
import {
  datosDePieza,
  faltaPrecontractual,
  formatoPesos,
  puedePublicarPrecio,
  type Proyecto,
} from "@/data/proyectos";
import { areaDe, fichaDe, precioDe, proyectosEnOrden } from "@/lib/ficha";
import "@/styles/proyecto.css";

/**
 * La página propia de un proyecto — una sola plantilla para los cinco.
 *
 * Todo sale de `src/data/proyectos.ts`. Agregar un proyecto a la cartera es
 * agregar un elemento a ese archivo: la ruta, el mapa del sitio, la tarjeta y
 * esta página salen solos (`src/app/proyectos/[slug]/page.tsx`).
 *
 * Orden de la página, pedido en el prompt 4B: portada, datos clave,
 * tipologías, amenidades, ubicación, la opinión de Rafael, respaldo,
 * preguntas frecuentes y otros proyectos. **Cada bloque sin datos se oculta**:
 * nunca un marcador, nunca texto de relleno.
 *
 * Lo que se conserva de la landing anterior: la galería del brochure, el
 * bloque legal de la Circular 004 y «Me interesa», que abre el chat.
 *
 * Lo que ya no está, a propósito: los textos escritos a mano en cada página
 * («quedan 7 de 272 casas», «Torre 5 en venta») que no salían de la capa de
 * datos y ya contradecían la hoja vigente; y el pie que decía «en esta página
 * no publicamos precios» debajo de un precio publicado.
 */

const ESTADO: Record<Proyecto["estado"], string> = {
  "en lanzamiento": "En lanzamiento",
  "en construcción": "En construcción",
  "entrega inmediata": "Entrega inmediata",
};

const DESTINOS: Record<NonNullable<Proyecto["tiempos"]>[number]["destino"], string> = {
  playa: "a la playa",
  aeropuerto: "al aeropuerto",
  hospital: "al hospital",
  centro: "al Centro Histórico",
};

function tipologiasVista(p: Proyecto): TipologiaVista[] {
  const publica = puedePublicarPrecio(p) && p.precio !== null;
  return p.tipologias.map((t) => ({
    titulo: t.titulo,
    detalle: t.detalle,
    fuente: t.fuente,
    area: { etiqueta: t.area.etiqueta, valor: t.area.valor, fuente: t.area.fuente },
    alcobas: t.alcobas,
    banos: t.banos,
    exterior: t.exterior,
    planos: t.planos ?? [],
    precio:
      publica && t.precio && p.precio
        ? {
            cifra:
              t.precio.desde === t.precio.hasta
                ? formatoPesos(t.precio.desde)
                : `${formatoPesos(t.precio.desde)} a ${formatoPesos(t.precio.hasta)}`,
            detalle: `${t.precio.unidades} ${
              t.precio.unidades === 1 ? "unidad disponible" : "unidades disponibles"
            } · corte ${p.precio.corte}`,
          }
        : null,
  }));
}

/** Los tres proyectos que siguen en la cartera, dando la vuelta. */
function otrosProyectos(p: Proyecto) {
  const todos = proyectosEnOrden();
  const i = todos.findIndex((x) => x.slug === p.slug);
  const resto = [...todos.slice(i + 1), ...todos.slice(0, i)];
  return resto.slice(0, 3).map(fichaDe);
}

export default function ProyectoLanding({ p }: { p: Proyecto }) {
  const precio = precioDe(p);
  const area = areaDe(p);
  const ficha = fichaDe(p);
  const pieza = datosDePieza(p);
  const pendientes = faltaPrecontractual(p);
  const whatsappVisita = enlaceWhatsApp(`Hola Rafael, quiero agendar una visita a ${p.nombre}.`);
  const otros = otrosProyectos(p);

  const franja: { titulo: string; valor: string; nota?: string }[] = [
    {
      titulo: precio.muestra ? "Precio de referencia" : "Precio",
      valor: precio.texto,
      nota: precio.corte ? `corte ${precio.corte}` : "Te lo damos con su respaldo documental",
    },
  ];
  if (area) {
    franja.push({
      titulo: "Área",
      valor: area.texto,
      nota:
        (area.etiquetas.length > 0
          ? `Como la rotula la fuente: ${area.etiquetas.map((e) => `«${e}»`).join(", ")}`
          : "Como la publica la fuente") + (area.conflicto ? " · las fuentes difieren, ver tipologías" : ""),
    });
  }
  if (ficha.alcobas) franja.push({ titulo: "Habitaciones", valor: ficha.alcobas });
  if (ficha.banos) franja.push({ titulo: "Baños", valor: ficha.banos });
  if (p.precontractual.fechaEntrega) franja.push({ titulo: "Entrega", valor: p.precontractual.fechaEntrega });
  if (p.precio) {
    franja.push({
      titulo: "Disponibles",
      valor: `${p.precio.unidadesDisponibles} ${p.precio.unidadesDisponibles === 1 ? "unidad" : "unidades"}`,
      nota: `corte ${p.precio.corte}`,
    });
  }

  return (
    <>
      <CabeceraSitio mensaje={`Hola Rafael, vi la página de ${p.nombre} y quiero más información.`} />

      <main className="pp">
        <div className="pp-migas">
          <div className="section-shell">
            <VolverACartera />
          </div>
        </div>

        {/* 1 · Portada ─────────────────────────────── */}
        <PortadaGaleria fotos={p.fotos?.galeria ?? []} nombre={p.nombre}>
          <p className="eyebrow">
            {p.zona} · {ESTADO[p.estado]}
          </p>
          <h1>{p.nombre}</h1>
          {p.presentacion && <p className="pp-portada-linea">{p.presentacion.linea}</p>}
          {p.revisionJuridica && (
            <p className="pp-sello">
              <IconoEscudo size={18} /> Revisado por nuestro estudio jurídico
            </p>
          )}
        </PortadaGaleria>

        <div className="pp-cuerpo section-shell">
          <div className="pp-contenido">
            {/* 2 · Datos clave ─────────────────────── */}
            <section className="pp-bloque" aria-label="Datos clave">
              <dl className="pp-franja">
                {franja.map((d) => (
                  <div key={d.titulo}>
                    <dt>{d.titulo}</dt>
                    <dd>
                      <strong>{d.valor}</strong>
                      {d.nota && <span>{d.nota}</span>}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="pp-resumen">{p.resumen}</p>
            </section>

            {/* 3 · Tipologías ──────────────────────── */}
            <section className="pp-bloque" id="tipologias">
              <p className="section-kicker">Tipologías</p>
              <h2>Qué se ofrece</h2>
              <TipologiasTabs tipologias={tipologiasVista(p)} />

              {p.conflictos.length > 0 && (
                <div className="pp-conflictos">
                  <p>
                    <strong>Datos en los que las fuentes del promotor no coinciden.</strong>{" "}
                    Publicamos todas las versiones en lugar de elegir una:
                  </p>
                  <ul>
                    {p.conflictos.map((c) => (
                      <li key={c.dato}>
                        <em>{c.dato}:</em>{" "}
                        {c.versiones.map((v, i) => (
                          <span key={v.fuente}>
                            {i > 0 && " · "}
                            {v.valor} <span className="pp-fuente-inline">({v.fuente})</span>
                          </span>
                        ))}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            {/* 4 · Amenidades ──────────────────────── */}
            {p.amenidades.length > 0 && (
              <section className="pp-bloque" id="amenidades">
                <p className="section-kicker">Amenidades</p>
                <h2>Lo que tiene el proyecto</h2>
                <ul className="pp-amenidades">
                  {p.amenidades.map((a) => (
                    <li key={a}>
                      <IconoAmenidad nombre={a} size={24} />
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
                <p className="pp-fuente">Según el material publicado por el promotor.</p>
              </section>
            )}

            {/* 5 · Ubicación ───────────────────────── */}
            <section className="pp-bloque" id="ubicacion">
              <p className="section-kicker">Ubicación</p>
              <h2>{p.ubicacion ?? "Ubicación exacta por confirmar con el promotor"}</h2>
              {p.coordenada && (
                <MiniMapa
                  lat={p.coordenada.lat}
                  lon={p.coordenada.lon}
                  nombre={p.nombre}
                  fuente={p.coordenada.fuente}
                />
              )}
              <p className="pp-fuente">Fuente: {p.ubicacionFuente}</p>
              {p.tiempos && p.tiempos.length > 0 && (
                <ul className="pp-tiempos">
                  {p.tiempos.map((t) => (
                    <li key={t.destino}>
                      <strong>{t.minutos} min</strong> {DESTINOS[t.destino]}
                      <small>{t.fuente}</small>
                    </li>
                  ))}
                </ul>
              )}
              {p.zona === "Zona Norte" && (
                <p className="pp-enlace-zona">
                  <Link href="/#zonanorte">
                    Lo que ya funciona en la Zona Norte <IconoFlecha size={16} />
                  </Link>
                </p>
              )}
            </section>

            {/* 6 · La opinión de Rafael ────────────── */}
            {p.opinionRafael && (
              <section className="pp-bloque pp-opinion" id="opinion">
                <img
                  className="pp-opinion-foto"
                  src="/rafael/retrato-520.jpg"
                  alt="Rafael Hernández Franco"
                  width={96}
                  height={120}
                  loading="lazy"
                />
                <div>
                  <p className="section-kicker">La opinión de Rafael</p>
                  <h2>Lo que debes saber antes de separar</h2>
                  <p className="pp-opinion-para">{p.opinionRafael.paraQuien}</p>
                  <div className="pp-opinion-listas">
                    <div>
                      <h3>Puntos fuertes</h3>
                      <ul>
                        {p.opinionRafael.fuertes.map((f) => (
                          <li key={f}>{f}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3>Lo que conviene tener en cuenta</h3>
                      <ul>
                        {p.opinionRafael.tenerEnCuenta.map((f) => (
                          <li key={f}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <p className="pp-fuente">Escrito por Rafael el {p.opinionRafael.fecha}.</p>
                </div>
              </section>
            )}

            {/* 7 · Respaldo ────────────────────────── */}
            <section className="pp-bloque" id="respaldo">
              <p className="section-kicker">Respaldo</p>
              <h2>Quién lo construye y de dónde salen los datos</h2>
              <dl className="pp-respaldo">
                <div>
                  <dt>Promotor y comercialización</dt>
                  <dd>{p.promotor}</dd>
                </div>
                <div>
                  <dt>Estado del proyecto</dt>
                  <dd>{ESTADO[p.estado]}</dd>
                </div>
                {p.precio && (
                  <div>
                    <dt>Precios y disponibilidad</dt>
                    <dd>
                      {p.precio.fuente} · corte {p.precio.corte}
                    </dd>
                  </div>
                )}
                {p.avanceObra && (
                  <div>
                    <dt>Avance de obra</dt>
                    <dd>
                      <a href={p.avanceObra.url} target="_blank" rel="noopener noreferrer">
                        Página de avance de la constructora
                      </a>{" "}
                      <span className="pp-fuente-inline">({p.avanceObra.fuente})</span>
                    </dd>
                  </div>
                )}
              </dl>
              {p.brochurePdf && p.brochurePaginas === 0 && (
                <p className="pp-brochure-solo">
                  <a href={p.brochurePdf} target="_blank" rel="noopener noreferrer">
                    <IconoDocumento size={18} /> Descargar el brochure oficial (PDF)
                  </a>
                </p>
              )}
              {p.brochurePaginas > 0 && (
                <BrochureGaleria
                  slug={p.slug}
                  paginas={p.brochurePaginas}
                  pdf={p.brochurePdf}
                  nombre={p.nombre}
                />
              )}
            </section>

            {/* 8 · Preguntas frecuentes ────────────── */}
            {p.faq && p.faq.length > 0 && (
              <section className="pp-bloque" id="preguntas">
                <p className="section-kicker">Preguntas frecuentes</p>
                <h2>Lo que más nos preguntan</h2>
                <div className="pp-faq">
                  {p.faq.map((q) => (
                    <details key={q.pregunta}>
                      <summary>{q.pregunta}</summary>
                      <p>{q.respuesta}</p>
                    </details>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Contacto: columna fija en escritorio ─────── */}
          <aside className="pp-lateral" aria-label={`Contacto sobre ${p.nombre}`}>
            <div className="pp-lateral-caja">
              <p className="pp-lateral-kicker">{precio.muestra ? "Precio de referencia" : "Precio"}</p>
              <p className="pp-lateral-precio">{precio.texto}</p>
              <p className="pp-lateral-corte">
                {precio.corte ? `corte ${precio.corte}` : "Te lo damos con su respaldo documental"}
              </p>
              <a className="btn-primary pp-btn" href={whatsappVisita} target="_blank" rel="noopener noreferrer">
                <IconoWhatsApp size={18} /> Agendar visita
              </a>
              <MeInteresaButton label="Me interesa" className="pp-btn pp-btn-secundario" />
              <a className="pp-lateral-form" href="#contacto">
                O déjanos tus datos
              </a>
            </div>
          </aside>
        </div>

        {/* 9 · Otros proyectos ────────────────────────── */}
        {otros.length > 0 && (
          <section className="section pp-otros" aria-labelledby="pp-otros-titulo">
            <div className="section-shell">
              <p className="section-kicker">Nuestra cartera</p>
              <h2 id="pp-otros-titulo">Otros proyectos que asesoramos</h2>
              <RevealGrupo className="pp-otros-grid">
                {otros.map((f, i) => (
                  <div key={f.slug} style={{ "--i": i } as React.CSSProperties}>
                    <TarjetaGiro ficha={f} />
                  </div>
                ))}
              </RevealGrupo>
            </div>
          </section>
        )}

        {/* Contacto con el proyecto ya elegido ──────────── */}
        <section className="section section-contacto" id="contacto">
          <div className="section-shell contacto-shell">
            <div className="contacto-texto">
              <p className="section-kicker">Contacto</p>
              <h2>¿Te interesa {p.nombre}?</h2>
              <p className="section-lede">
                Te pasamos disponibilidad, precios vigentes y condiciones de pago
                con la fecha de corte del documento del constructor.
              </p>
              <div className="contacto-canales">
                <a className="btn-whatsapp" href={whatsappVisita} target="_blank" rel="noopener noreferrer">
                  <IconoWhatsApp /> Agendar visita por WhatsApp
                </a>
              </div>
            </div>
            <ContactForm proyectoInicial={p.nombre} />
          </div>
        </section>

        {/* Avisos legales del proyecto ───────────────────── */}
        <section className="pp-avisos" aria-label="Avisos legales del proyecto">
          <div className="section-shell">
            <BloqueLegal p={p} />
            {!pieza.completo && (
              <div className="pp-sin-precio">
                <h2>Por qué este proyecto no publica precio</h2>
                <p>
                  La Circular 004 de 2024 de la Superintendencia de Industria y
                  Comercio (numeral 2.16.1) exige que toda pieza con precio lleve
                  también el área y la ubicación exacta del proyecto. Hoy falta:{" "}
                  {pieza.faltan.join(", ")}. Te damos el precio vigente y su
                  respaldo documental por el chat, por WhatsApp o en asesoría
                  directa.
                </p>
                {p.reservas.length > 0 && (
                  <ul>
                    {p.reservas.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                )}
                {pendientes.length > 0 && (
                  <p>
                    Información precontractual que se entrega por escrito antes de
                    cualquier separación (numeral 2.16.2): {pendientes.join(", ")}.
                  </p>
                )}
              </div>
            )}
            <p className="pp-avisos-texto">
              Los precios son de referencia, en pesos colombianos, a la fecha de
              corte indicada, y están sujetos a disponibilidad. Las áreas se citan
              con la etiqueta textual de la fuente y pueden cambiar por decisión
              de la constructora. Las imágenes son renders y material del
              promotor: son ilustrativas y no reproducen necesariamente acabados,
              mobiliario ni entorno definitivos. Esta página no constituye oferta
              comercial en los términos del artículo 845 del Código de Comercio.
            </p>
          </div>
        </section>
      </main>

      <PieSitio portadaPropia={false} />

      {/* Móvil: los dos botones siempre a mano, sin tapar el del chat ─── */}
      <div className="pp-barra-movil" role="region" aria-label={`Contactar sobre ${p.nombre}`}>
        <a className="pp-barra-visita" href={whatsappVisita} target="_blank" rel="noopener noreferrer">
          <IconoWhatsApp size={18} /> Agendar visita
        </a>
        <MeInteresaButton label="Me interesa" className="pp-barra-interesa" />
      </div>
    </>
  );
}
