import type { Metadata } from "next";
import Link from "next/link";
import BrochureGaleria from "@/components/BrochureGaleria";
import MeInteresaButton from "@/components/MeInteresaButton";
import BloqueLegal from "@/components/BloqueLegal";
import { getProyecto, puedePublicarPrecio, rangoPrecio } from "@/data/proyectos";

/**
 * Blue Garden. Todo el contenido sale de `src/data/proyectos.ts`.
 *
 * El precio se publica con el bloque legal del numeral 2.16.1 debajo. El área
 * va con la etiqueta literal del brochure («Área construida») y el bloque
 * declara que su equivalencia con el área privada construida del art. 3 de la
 * Ley 675 de 2001 está pendiente de certificación de Invercolombia.
 *
 * ⛔ Blue Garden NO está en la Zona Norte: está sobre la vía a Turbaco. No
 * reusar el bloque de copy de Zona Norte de `ProyectoLanding`.
 */

const p = getProyecto("blue-garden")!;

export const metadata: Metadata = {
  title: "Blue Garden Condominio — Casas campestres en la vía a Turbaco",
  description:
    "Casas de una planta de 75 m² sobre lote de 250 m², ampliables a segundo piso, en un club campestre con más de 50 amenidades. Asesoría independiente RHF.",
  keywords: [
    "Blue Garden Cartagena",
    "condominio campestre Turbaco",
    "casas campestres Cartagena",
    "Invercolombia Blue Garden",
  ],
  alternates: { canonical: "/proyectos/blue-garden" },
  openGraph: {
    title: "Blue Garden Condominio — Casas campestres en la vía a Turbaco",
    description:
      "Casas de una planta de 75 m² sobre lote de 250 m², dentro de un club campestre con más de 50 amenidades.",
    url: "/proyectos/blue-garden",
    siteName: "RHF Asesoría Inmobiliaria",
    locale: "es_CO",
    type: "website",
  },
};

export default function BlueGarden() {
  const muestraPrecio = puedePublicarPrecio(p);

  return (
    <main className="proyecto">
      <div className="proyecto-wrap">
        <Link href="/" className="proyecto-volver">
          ← Toda la cartera
        </Link>

        <header className="proyecto-hero">
          <span className="proyecto-zona">
            {p.zona} · {p.estado}
          </span>
          <h1>{p.nombre}</h1>
          <p className="proyecto-intro">{p.resumen}</p>
        </header>

        <section className="proyecto-bloque">
          <h2>La casa</h2>
          {p.tipologias.map((t) => (
            <div key={t.titulo} className="proyecto-tipologia">
              <h3>{t.titulo}</h3>
              <p>{t.detalle}</p>
              <p className="proyecto-fuente">Fuente: {t.fuente}</p>
            </div>
          ))}

          <dl className="proyecto-datos">
            {p.tipologias.map((tp) => (
              <div key={tp.area.etiqueta}>
                <dt>{tp.area.etiqueta}</dt>
                <dd>{tp.area.valor}</dd>
              </div>
            ))}
            {p.datos.map((d) => (
              <div key={d.label}>
                <dt>{d.label}</dt>
                <dd>{d.valor}</dd>
              </div>
            ))}
          </dl>

          {muestraPrecio && p.precio && (
            <p className="proyecto-precio">
              <strong>{rangoPrecio(p.precio.desde, p.precio.hasta)}</strong>{" "}
              <span>
                precio de referencia · {p.precio.unidadesDisponibles} casas
                disponibles · corte {p.precio.corte}
              </span>
            </p>
          )}
        </section>

        <section className="proyecto-bloque">
          <h2>El club</h2>
          <ul className="proyecto-amenidades">
            {p.amenidades.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </section>

        <section className="proyecto-bloque">
          <h2>Dónde queda</h2>
          <p>{p.ubicacion}</p>
          <p className="proyecto-fuente">Fuente: {p.ubicacionFuente}</p>
        </section>

        <BrochureGaleria
          slug={p.slug}
          paginas={p.brochurePaginas}
          pdf={p.brochurePdf}
          nombre={p.nombre}
        />

        <BloqueLegal p={p} />

        <section className="proyecto-legal">
          <p>
            Material ilustrativo del proyecto. Las áreas se citan con la
            etiqueta que usa la fuente y están sujetas a confirmación
            documental; el <strong>área privada construida</strong> en el
            sentido del artículo 3 de la Ley 675 de 2001 está pendiente de
            certificación por parte del promotor. Los renders no reproducen
            necesariamente acabados, mobiliario ni entorno definitivos.
          </p>
          <p>
            Esta página <strong>no constituye oferta comercial</strong> en los
            términos del artículo 845 del Código de Comercio. Para
            disponibilidad al día de hoy, estrato, cuota de administración,
            fecha de entrega y condiciones de desistimiento, consulta
            directamente con el asesor. {p.promotor}.
          </p>
        </section>

        <div className="proyecto-cta">
          <MeInteresaButton label="Me interesa Blue Garden" className="btn-card" />
        </div>
      </div>
    </main>
  );
}
