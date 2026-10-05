import type { Metadata } from "next";
import CabeceraSitio from "@/components/CabeceraSitio";
import PieSitio from "@/components/PieSitio";
import WhatsAppFlotante from "@/components/WhatsAppFlotante";
import Comparador from "@/components/comparar/Comparador";
import { opcionesDelComparador } from "@/components/comparar/opciones";
import { LIMITE, LIMITES, PARAMETROS } from "@/components/simulador/parametros";
import { alternos, ruta, SITIO, type Idioma } from "@/i18n/idioma";
import "@/styles/secciones.css";
import "@/styles/comparar.css";

/**
 * /comparar y /en/compare — el comparador de la cartera (fase 5 del plan de
 * los prompts de Luciano; pedido de Rafael del 5-oct-2026). Una sola página
 * en los dos idiomas (docs/i18n.md).
 *
 * Lo que la página no dice: que una opción es «la mejor inversión», que se
 * va a valorizar o que da una rentabilidad. El puntaje es un criterio de RHF
 * Living sobre lo documentado, con los pesos a la vista (docs/comparar).
 */

function textos(idioma: Idioma) {
  if (idioma === "en") {
    return {
      titulo: "Compare projects and properties in Cartagena | RHF Living",
      descripcion:
        "Put two options from our portfolio side by side: price with its cut-off date, delivery, bedrooms, parking, shared amenities and a score for your profile, built only on documented facts.",
      locale: "en_US",
      altOg: "RHF Living — Real estate advisory in Cartagena",
      inicio: "Home",
      miga: "Compare",
      kicker: "Compare",
      h1: "Two options, side by side, with what is documented",
      lede: "Choose two projects or two ready-to-move-in properties and what it's for. You get a score out of 100, the deciding factor, two scenarios and the point-by-point matrix, with the source of every figure.",
      puntos: [
        "Only documented facts: price with its cut-off date, area with its source's label, delivery, parking and amenities.",
        "No projected returns or appreciation: no project has a source for them today.",
        "The weights of the score are visible, and the math runs in your browser.",
      ],
      aria: "Comparison",
      faqTitulo: "Questions",
      faq: [
        {
          pregunta: "Is the score a rating of the project?",
          respuesta:
            "No. It measures how close each option is to what you're looking for, using what is documented today and RHF Living's weights, which you can see. A missing fact counts as zero: lack of information weighs on a decision too.",
        },
        {
          pregunta: "Why doesn't it show return on investment or appreciation?",
          respuesta:
            "Because no project in the portfolio has a verifiable source for those figures, and what is advertised is binding (Law 1480 of 2011). To run short-term rental numbers with your own assumptions, use the calculator.",
        },
        {
          pregunta: "Why doesn't it rate the location?",
          respuesta:
            "A location score would be an opinion dressed as a number. The matrix shows the published location with its source; Rafael can tell you about travel times and the area in person.",
        },
        {
          pregunta: "Why do some options show “Price on request”?",
          respuesta:
            "We only publish a price when the listing meets the Superintendence of Industry and Commerce's requirements (Circular 004 of 2024): price together with the area and the exact location.",
        },
      ],
      avisoImagenes: "This page does not publish property photos.",
      whatsapp: "Hi Rafael, I'm using the comparison tool on your website and I have a question: ",
    };
  }
  return {
    titulo: "Compara proyectos e inmuebles en Cartagena | RHF Living",
    descripcion:
      "Pon dos opciones de nuestra cartera lado a lado: precio con su fecha de corte, entrega, alcobas, parqueadero, zonas comunes y un puntaje según tu perfil, hecho solo con lo documentado.",
    locale: "es_CO",
    altOg: "RHF Living — Asesoría inmobiliaria en Cartagena",
    inicio: "Inicio",
    miga: "Comparar",
    kicker: "Comparador",
    h1: "Dos opciones, lado a lado, con lo que está documentado",
    lede: "Elige dos proyectos o dos inmuebles de entrega inmediata y para qué los quieres. Te damos un puntaje sobre 100, el factor decisivo, dos escenarios y la matriz punto por punto, con la fuente de cada cifra.",
    puntos: [
      "Solo lo documentado: el precio con su fecha de corte, el área con la etiqueta de su fuente, la entrega, el parqueadero y las zonas comunes.",
      "Sin rentabilidades ni valorizaciones proyectadas: ningún proyecto tiene hoy una fuente que las respalde.",
      "Los pesos del puntaje están a la vista, y el cálculo se hace en tu navegador.",
    ],
    aria: "Comparador",
    faqTitulo: "Preguntas",
    faq: [
      {
        pregunta: "¿El puntaje es una calificación del proyecto?",
        respuesta:
          "No. Mide qué tan cerca está cada opción de lo que buscas, con lo que hoy está documentado y los pesos de RHF Living, que puedes ver. Un dato que falta cuenta como cero: la falta de información también pesa en una decisión.",
      },
      {
        pregunta: "¿Por qué no muestra rentabilidad ni valorización?",
        respuesta:
          "Porque ningún proyecto de la cartera tiene una fuente verificable para esas cifras, y lo que se anuncia obliga (Ley 1480 de 2011). Si quieres hacer la cuenta de renta corta con tus propios supuestos, usa el simulador.",
      },
      {
        pregunta: "¿Por qué no califica la ubicación?",
        respuesta:
          "Una nota de ubicación sería una opinión vestida de número. La matriz muestra la ubicación publicada con su fuente; los tiempos de trayecto y el entorno te los cuenta Rafael en persona.",
      },
      {
        pregunta: "¿Por qué algunas opciones dicen «Consultar»?",
        respuesta:
          "Porque solo publicamos precio cuando la pieza cumple lo que exige la Superintendencia de Industria y Comercio (Circular 004 de 2024): el precio con el área y la ubicación exacta.",
      },
    ],
    avisoImagenes: "Esta página no publica imágenes de inmuebles.",
    whatsapp: "Hola Rafael, estoy usando el comparador de tu página y tengo una pregunta: ",
  };
}

export function metadataComparar(idioma: Idioma): Metadata {
  const t = textos(idioma);
  const { canonical, languages } = alternos("/comparar", idioma);
  return {
    title: { absolute: t.titulo },
    description: t.descripcion,
    alternates: { canonical, languages },
    openGraph: {
      title: t.titulo,
      description: t.descripcion,
      url: canonical,
      siteName: "RHF Living",
      locale: t.locale,
      type: "website",
      images: [{ url: `${SITIO}/og.jpg`, width: 1200, height: 630, alt: t.altOg }],
    },
    twitter: { card: "summary_large_image", title: t.titulo, description: t.descripcion, images: [`${SITIO}/og.jpg`] },
  };
}

function datosEstructurados(idioma: Idioma) {
  const t = textos(idioma);
  const url = alternos("/comparar", idioma).canonical;
  const inicio = ruta(idioma, "/");
  return [
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      inLanguage: idioma,
      mainEntity: t.faq.map((q) => ({ "@type": "Question", name: q.pregunta, acceptedAnswer: { "@type": "Answer", text: q.respuesta } })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: t.inicio, item: `${SITIO}${inicio === "/" ? "" : inicio}` },
        { "@type": "ListItem", position: 2, name: t.miga, item: url },
      ],
    },
  ];
}

export default function PaginaComparar({ idioma = "es" }: { idioma?: Idioma }) {
  const t = textos(idioma);
  const opciones = opcionesDelComparador(idioma);
  const reglas = {
    financiado: LIMITES.financiacionMaxNoVIS,
    tasa: PARAMETROS.tasaNoVISPesos.valor,
    limite: LIMITE,
    plazo: 20,
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(datosEstructurados(idioma)) }} />
      <CabeceraSitio mensaje={t.whatsapp} idioma={idioma} rutaEs="/comparar" />

      <main className="cmpp">
        <section className="cmpp-portada" aria-labelledby="cmpp-titulo">
          <div className="section-shell">
            <p className="section-kicker">{t.kicker}</p>
            <h1 id="cmpp-titulo">{t.h1}</h1>
            <p className="section-lede">{t.lede}</p>
            <ul className="cmpp-puntos">
              {t.puntos.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="cmpp-comparador" aria-label={t.aria}>
          <div className="section-shell">
            <Comparador idioma={idioma} opciones={opciones} reglas={reglas} />
          </div>
        </section>

        <section className="cmpp-faq" aria-labelledby="cmpp-faq-titulo">
          <div className="section-shell">
            <h2 id="cmpp-faq-titulo">{t.faqTitulo}</h2>
            <div className="cmpp-faq-lista">
              {t.faq.map((q) => (
                <details key={q.pregunta}>
                  <summary>{q.pregunta}</summary>
                  <p>{q.respuesta}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <PieSitio avisoImagenes={t.avisoImagenes} idioma={idioma} />
      <WhatsAppFlotante trasDe=".cmpp-portada" soloEscritorio mensaje={t.whatsapp} idioma={idioma} />
    </>
  );
}
