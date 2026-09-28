import Link from "next/link";
import Animador from "@/components/Animador";
import CabeceraSitio from "@/components/CabeceraSitio";
import ContactForm from "@/components/ContactForm";
import MeInteresaButton from "@/components/MeInteresaButton";
import PieSitio from "@/components/PieSitio";
import PortadaGaleria from "@/components/PortadaGaleria";
import RevealGrupo from "@/components/RevealGrupo";
import TarjetaGiro from "@/components/TarjetaGiro";
import VolverACartera from "@/components/VolverACartera";
import WhatsAppFlotante from "@/components/WhatsAppFlotante";
import { IconoAmenidad, IconoFlecha, IconoWhatsApp } from "@/components/Iconos";
import { enlaceWhatsApp } from "@/data/contacto";
import { INMUEBLES, precioInmueble, type Inmueble } from "@/data/inmuebles";
import { fichaDeInmueble } from "@/lib/ficha";
import "@/styles/proyecto.css";
import "@/styles/inmuebles.css";

/**
 * La página propia de un inmueble disponible — una plantilla para los cinco.
 *
 * Todo sale de `src/data/inmuebles.ts`. El orden: portada con las fotos (y el
 * plano al final), datos clave, lo que tiene el apartamento, el conjunto, la
 * ubicación, de dónde salen los datos, otros inmuebles y el contacto. Cada
 * bloque sin datos se oculta: nunca un marcador ni texto de relleno.
 *
 * Mismas reglas que la cartera: precio solo si está escrito, con su corte;
 * área con la etiqueta literal de su documento; cada foto con su crédito y su
 * fecha. Ni matrículas, ni números de escritura, ni datos del propietario.
 */
export default function InmuebleLanding({ i }: { i: Inmueble }) {
  const precio = precioInmueble(i);
  const whatsappVisita = enlaceWhatsApp(`Hola Rafael, quiero agendar una visita a ${i.nombre}.`);
  const otros = INMUEBLES.filter((x) => x.slug !== i.slug)
    .slice(0, 3)
    .map(fichaDeInmueble);
  const fotos = [...i.fotos, ...(i.plano ? [i.plano] : [])];
  const soloRenders = i.fotos.every((f) => /render/i.test(f.credito));

  const franja: { titulo: string; valor: string; nota?: string }[] = [
    {
      titulo: i.precio ? "Precio de referencia" : "Precio",
      valor: precio.texto,
      nota: precio.corte ? `corte ${precio.corte}` : "Te lo damos por WhatsApp o en asesoría directa",
    },
    ...i.areas.map((a) => ({ titulo: a.etiqueta, valor: a.valor, nota: a.fuente })),
    { titulo: "Habitaciones", valor: i.habitaciones },
    { titulo: "Baños", valor: i.banos },
    { titulo: "Piso", valor: i.piso },
    ...(i.parqueadero ? [{ titulo: "Parqueadero", valor: i.parqueadero }] : []),
  ];

  return (
    <>
      <CabeceraSitio mensaje={`Hola Rafael, vi ${i.nombre} en tu página y quiero más información.`} />

      <main className="pp pi">
        <div className="pp-migas">
          <div className="section-shell">
            <VolverACartera href="/#apartamentos" texto="Volver a los apartamentos" />
          </div>
        </div>

        {/* 1 · Portada ─────────────────────────────── */}
        <PortadaGaleria fotos={fotos} nombre={i.nombre}>
          <p className="eyebrow">
            {i.zona} · {i.estado}
          </p>
          <h1>{i.nombre}</h1>
          <p className="pp-portada-linea">{i.linea}</p>
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
              {i.descripcion.map((p) => (
                <p key={p} className="pp-resumen">
                  {p}
                </p>
              ))}
            </section>

            {/* 3 · El apartamento ──────────────────── */}
            <section className="pp-bloque" id="apartamento">
              <p className="section-kicker">El apartamento</p>
              <h2>Lo que tiene</h2>
              <p className="pi-dependencias">{i.dependencias.texto}.</p>
              <p className="pp-fuente">Según: {i.dependencias.fuente}.</p>
              {i.plano && (
                <figure className="pi-plano">
                  <img src={i.plano.src} alt={i.plano.alt} width={i.plano.ancho} height={i.plano.alto} loading="lazy" />
                  <figcaption>{i.plano.credito}</figcaption>
                </figure>
              )}
            </section>

            {/* 4 · El conjunto ─────────────────────── */}
            {i.conjunto && (
              <section className="pp-bloque" id="conjunto">
                <p className="section-kicker">El conjunto</p>
                <h2>{i.proyecto}</h2>
                <ul className="pp-amenidades">
                  {i.conjunto.items.map((a) => (
                    <li key={a}>
                      <IconoAmenidad nombre={a} size={24} />
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
                <p className="pp-fuente">Según: {i.conjunto.fuente}.</p>
              </section>
            )}

            {/* 5 · Ubicación ───────────────────────── */}
            <section className="pp-bloque" id="ubicacion">
              <p className="section-kicker">Ubicación</p>
              <h2>{i.ubicacion}</h2>
              <p className="pp-fuente">Fuente: {i.ubicacionFuente}.</p>
              {/Zona Norte/.test(i.zona) && (
                <p className="pp-enlace-zona">
                  <Link href="/#mapa">
                    Colegios, salud, comercio y vías de la Zona Norte <IconoFlecha size={16} />
                  </Link>
                </p>
              )}
            </section>

            {/* 6 · De dónde salen los datos ────────── */}
            <section className="pp-bloque" id="fuentes">
              <p className="section-kicker">Respaldo</p>
              <h2>De dónde salen los datos</h2>
              <ul className="pi-fuentes">
                {i.fuentes.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </section>
          </div>

          {/* Contacto: columna fija en escritorio ─────── */}
          <aside className="pp-lateral" aria-label={`Contacto sobre ${i.nombre}`}>
            <div className="pp-lateral-caja">
              <p className="pp-lateral-kicker">{i.precio ? "Precio de referencia" : "Precio"}</p>
              <p className="pp-lateral-precio">{precio.texto}</p>
              <p className="pp-lateral-corte">
                {precio.corte ? `corte ${precio.corte}` : "Te lo damos por WhatsApp o en asesoría directa"}
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

        {/* 7 · Otros inmuebles ─────────────────────────── */}
        {otros.length > 0 && (
          <section className="section pp-otros" aria-labelledby="pi-otros-titulo">
            <div className="section-shell">
              <p className="section-kicker">Inmuebles disponibles</p>
              <h2 id="pi-otros-titulo">Otros apartamentos disponibles</h2>
              <RevealGrupo className="pp-otros-grid">
                {otros.map((f, n) => (
                  <div key={f.slug} style={{ "--i": n } as React.CSSProperties}>
                    <TarjetaGiro ficha={f} retraso={n * 900} />
                  </div>
                ))}
              </RevealGrupo>
            </div>
          </section>
        )}

        {/* Contacto con el inmueble ya elegido ──────────── */}
        <section className="section section-contacto" id="contacto">
          <div className="section-shell contacto-shell">
            <div className="contacto-texto">
              <p className="section-kicker">Contacto</p>
              <h2>¿Te interesa {i.nombre}?</h2>
              <p className="section-lede">
                Te contamos las condiciones, resolvemos tus preguntas y agendamos la visita.
              </p>
              <div className="contacto-canales">
                <a className="btn-whatsapp" href={whatsappVisita} target="_blank" rel="noopener noreferrer">
                  <IconoWhatsApp /> Agendar visita por WhatsApp
                </a>
              </div>
            </div>
            <ContactForm proyectoInicial={i.nombre} />
          </div>
        </section>

        {/* Avisos legales ───────────────────────────────── */}
        <section className="pp-avisos" aria-label="Avisos legales del inmueble">
          <div className="section-shell">
            <p className="pp-avisos-texto">
              {i.precio
                ? `El precio es de referencia, en pesos colombianos, a la fecha de corte indicada (${i.precio.corte}), y está sujeto a disponibilidad. `
                : "El precio vigente se entrega con su respaldo por WhatsApp o en asesoría directa. "}
              Las áreas se citan con la etiqueta textual de su documento —escritura pública, plano oficial o
              presentación de venta— y la información precontractual se entrega por escrito antes de cualquier
              separación.{" "}
              {soloRenders
                ? "Las imágenes son renders y planos del promotor: son ilustrativas y no reproducen necesariamente acabados, mobiliario ni entorno definitivos."
                : "Cada foto lleva su crédito y su fecha; el mobiliario que aparece en ellas no hace parte de la venta salvo que se acuerde por escrito."}{" "}
              Esta página no constituye oferta comercial en los términos del artículo 845 del Código de Comercio.
            </p>
          </div>
        </section>
      </main>

      <PieSitio
        avisoImagenes={
          soloRenders
            ? "Las imágenes de esta página son renders y planos del promotor, y son ilustrativas."
            : "Las fotos de esta página son del apartamento, con su fecha; el plano, cuando aparece, es material del constructor."
        }
      />

      {/* Escritorio: la foto de Rafael, encima del botón del chat ─── */}
      <WhatsAppFlotante
        trasDe=".pp-portada"
        soloEscritorio
        mensaje={`Hola Rafael, vi ${i.nombre} en tu página y me interesa: `}
      />

      <Animador />

      {/* Móvil: los dos botones siempre a mano, sin tapar el del chat ─── */}
      <div className="pp-barra-movil" role="region" aria-label={`Contactar sobre ${i.nombre}`}>
        <a className="pp-barra-visita" href={whatsappVisita} target="_blank" rel="noopener noreferrer">
          <IconoWhatsApp size={18} /> Agendar visita
        </a>
        <MeInteresaButton label="Me interesa" className="pp-barra-interesa" />
      </div>
    </>
  );
}
