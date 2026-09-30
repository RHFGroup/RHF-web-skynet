import type { Metadata } from "next";
import CabeceraSitio from "@/components/CabeceraSitio";
import PieSitio from "@/components/PieSitio";
import WhatsAppFlotante from "@/components/WhatsAppFlotante";
import Simulador from "@/components/simulador/Simulador";
import { itemsDelSimulador } from "@/components/simulador/cartera";
import { LIMITES, PARAMETROS } from "@/components/simulador/parametros";
import { porcentaje } from "@/components/simulador/formato";
import { alternos, ruta, SITIO, type Idioma } from "@/i18n/idioma";
import "@/styles/secciones.css";
import "@/styles/simulador.css";

/**
 * /simulador y /en/mortgage-calculator — el simulador de compra de vivienda
 * (fase 4 del plan de los prompts de Luciano, 30-sep-2026). Una sola página
 * en los dos idiomas (docs/i18n.md).
 *
 * Arriba, el simulador (src/components/simulador), que corre entero en el
 * navegador. Abajo, la guía: cómo se calcula cada cifra, con la norma que la
 * fija. La guía sale en el HTML del build (la leen los buscadores); las
 * cifras de la norma salen de src/data/simulador.config.json, no se escriben
 * a mano aquí.
 *
 * Lo que la página no dice: que el simulador aprueba un crédito, que una tasa
 * es la oferta de un banco o que una renta está garantizada.
 */

const P = PARAMETROS;

function textos(idioma: Idioma) {
  const pct = porcentaje(P.cuotaIngresoMax.valor, idioma);
  const noVis = porcentaje(LIMITES.financiacionMaxNoVIS, idioma);
  const vis = porcentaje(LIMITES.financiacionMaxVIS, idioma);
  const leasing = porcentaje(LIMITES.financiacionMaxLeasing, idioma);
  const min = LIMITES.plazoMinAnios;
  const max = LIMITES.plazoMaxAnios;
  const ext = LIMITES.plazoMaxAniosExterior;
  if (idioma === "en") {
    return {
      titulo: "Mortgage calculator for Cartagena, Colombia | RHF Living",
      descripcion:
        "Calculate what you pay during construction, your monthly payment, the income required and closing costs under Colombia's current rules, and see which properties in our portfolio fit your budget.",
      locale: "en_US",
      altOg: "RHF Living — Real estate advisory in Cartagena",
      nombreApp: "RHF Living home purchase calculator",
      inicio: "Home",
      miga: "Mortgage calculator",
      kicker: "Home purchase calculator",
      h1: "How much do you need to buy a home in Cartagena?",
      lede: "What you pay during construction, your monthly payment, the income the bank will ask for, closing costs, and which properties in our portfolio fit your budget. Under Colombia's current rules, with the source of every figure.",
      puntos: [
        `The first payment cannot exceed ${pct} of household income (Decree 583 of 2025).`,
        `Banks finance up to ${noVis} for non-VIS and ${vis} for VIS homes; a housing lease can finance more.`,
        "No sign-up: the math runs in your browser, and your simulation only reaches Rafael if you send it.",
      ],
      simuladorAria: "Calculator",
      guiaKicker: "How it works",
      guiaTitulo: "The rules behind each figure",
      guia: [
        {
          id: "como-se-calcula",
          titulo: "How the payment is calculated",
          texto: [
            "A peso loan has a fixed payment: it comes from the standard amortization formula, using the monthly rate equivalent to the effective annual rate the bank offers you. Borrower life insurance and fire and earthquake insurance are added to that payment every month.",
            "In the first years, most of each payment is interest; over time, more of it goes to principal. The amortization table shows it year by year.",
          ],
        },
        {
          id: "regla-del-40",
          titulo: `The ${pct} rule`,
          texto: [
            `Since Decree 583 of 2025, the first payment of a home loan or a housing lease cannot exceed ${pct} of household income, for both social-interest (VIS) and non-VIS housing. That's why the calculator shows the income required: the payment divided by ${pct}. Each lender may require less.`,
          ],
          fuente: { texto: "Decree 1077 of 2015, art. 2.1.11.1, as amended by Decree 583 of 2025", url: P.cuotaIngresoMax.url },
        },
        {
          id: "cuanto-financia",
          titulo: "How much the bank finances",
          texto: [
            `With a mortgage, the bank finances up to ${noVis} of the property for non-VIS housing and up to ${vis} for VIS housing. A housing lease (leasing habitacional) has no such cap: lenders currently finance up to ${leasing}. The difference is the down payment, which in an off-plan project is paid during construction.`,
          ],
          fuente: { texto: "Decree 1077 of 2015, art. 2.1.11.1, item a", url: P.financiacionMaxNoVIS.url },
        },
        {
          id: "pesos-uvr-leasing",
          titulo: "Pesos, UVR or a housing lease",
          texto: [
            "In pesos, the payment is fixed. In UVR, the debt is measured in a unit that rises with inflation: the first payment is lower and it keeps rising. With a housing lease, the bank buys the property and you pay a monthly lease; at the end you pay the purchase option to keep it.",
          ],
        },
        {
          id: "plazo",
          titulo: "The term",
          texto: [
            `By law, a home loan has a minimum term of ${min} years. The Government sets the maximum; lenders currently lend for up to ${max} years, and for people living outside Colombia a reference lender offers up to ${ext}.`,
          ],
          fuente: { texto: "Law 546 of 1999, art. 17, as amended by Law 2079 of 2021", url: P.plazoMinAnios.url },
        },
        {
          id: "gastos",
          titulo: "Deed and registration costs",
          texto: [
            "On top of the price, you pay the notary, the registration and the registration tax for the sale and, with a mortgage, for the mortgage too. The Superintendence of Notaries and Registry sets notary and registration fees every year; each department sets the registration tax. The calculator uses the 2026 resolutions and marks what isn't verified as an assumption.",
          ],
          fuente: { texto: "Resolutions RES-2026-000964-6 and RES-2026-001726-6", url: P.registro.url },
        },
        {
          id: "exterior",
          titulo: "If you live outside Colombia",
          texto: [
            "You can buy from abroad with a loan from a Colombian bank. The payment is in pesos: if your income is in another currency, the calculator shows how the payment weighs if the exchange rate goes up or down.",
          ],
        },
      ],
      faqTitulo: "Questions",
      faq: [
        {
          pregunta: "Does the calculator approve my loan?",
          respuesta:
            "No. It's a simulation for information only. The lender sets the rate, amount and term after reviewing your application.",
        },
        {
          pregunta: "What rate does it use?",
          respuesta:
            "It starts with an average of what banks disbursed in non-VIS peso home loans, marked as an assumption. Change it to the rate your bank offers you.",
        },
        {
          pregunta: "Is my data stored?",
          respuesta:
            "Not on our servers: the math runs in your browser. Only if you ask for the PDF plan or for help with your loan do your details and your simulation reach Rafael, with your consent.",
        },
        {
          pregunta: "What does “Assumption” mean?",
          respuesta:
            "That the figure has no verified official source or depends on your case: you can replace it with your own. “Source” is official or market data, with the entity and the date; “Your figure” is what you entered.",
        },
        {
          pregunta: "Why don't some projects show a price?",
          respuesta:
            "Because we only publish a price when the listing meets the Superintendence of Industry and Commerce's requirements (Circular 004 of 2024): price together with the area and the exact location. Rafael can give you the current price with its supporting documents.",
        },
      ],
      avisoImagenes: "This page does not publish property photos.",
      whatsapp: "Hi Rafael, I'm using the calculator on your website and I have a question: ",
    };
  }
  return {
    titulo: "Simulador de crédito de vivienda en Cartagena | RHF Living",
    descripcion:
      "Calcula cuánto pagas en obra, tu cuota, el ingreso que te piden y los gastos de escritura, con las reglas vigentes en Colombia. Y mira qué inmuebles de nuestra cartera te alcanzan.",
    locale: "es_CO",
    altOg: "RHF Living — Asesoría inmobiliaria en Cartagena",
    nombreApp: "Simulador de compra de vivienda de RHF Living",
    inicio: "Inicio",
    miga: "Simulador",
    kicker: "Simulador de compra",
    h1: "¿Cuánto necesitas para comprar vivienda en Cartagena?",
    lede: "Cuánto pagas durante la obra, tu cuota, el ingreso que te pide el banco, los gastos de escritura y qué inmuebles de nuestra cartera te alcanzan. Con las reglas vigentes en Colombia y la fuente de cada cifra.",
    puntos: [
      `La primera cuota no puede pasar del ${pct} del ingreso del hogar (Decreto 583 de 2025).`,
      `El banco financia hasta el ${noVis} en No VIS y el ${vis} en VIS; con leasing, más.`,
      "Sin registro: el cálculo se hace en tu navegador, y tu simulación solo le llega a Rafael si tú se la envías.",
    ],
    simuladorAria: "Simulador",
    guiaKicker: "Cómo funciona",
    guiaTitulo: "Las reglas detrás de cada cifra",
    guia: [
      {
        id: "como-se-calcula",
        titulo: "Cómo se calcula la cuota",
        texto: [
          "La cuota de un crédito en pesos es fija: sale de la fórmula de amortización de cuota fija, con la tasa mensual equivalente a la efectiva anual que te ofrece el banco. A esa cuota se suman cada mes los seguros de vida deudor y de incendio y terremoto.",
          "En los primeros años, la mayor parte de la cuota son intereses; con el tiempo, abona más a capital. La tabla de amortización lo muestra año por año.",
        ],
      },
      {
        id: "regla-del-40",
        titulo: `La regla del ${pct}`,
        texto: [
          `Desde el Decreto 583 de 2025, la primera cuota de un crédito de vivienda o de un leasing habitacional no puede pasar del ${pct} de los ingresos del hogar, en vivienda VIS y en No VIS. Por eso el simulador te dice el ingreso que te piden: la cuota dividida entre ${pct}. Cada entidad puede exigir menos.`,
        ],
        fuente: { texto: "Decreto 1077 de 2015, art. 2.1.11.1, modificado por el Decreto 583 de 2025", url: P.cuotaIngresoMax.url },
      },
      {
        id: "cuanto-financia",
        titulo: "Cuánto financia el banco",
        texto: [
          `Con crédito hipotecario, el banco financia hasta el ${noVis} del inmueble en vivienda No VIS y hasta el ${vis} en VIS. El leasing habitacional no tiene ese tope: hoy las entidades financian hasta el ${leasing}. La diferencia es la cuota inicial, que en un proyecto sobre planos se paga durante la obra.`,
        ],
        fuente: { texto: "Decreto 1077 de 2015, art. 2.1.11.1, lit. a", url: P.financiacionMaxNoVIS.url },
      },
      {
        id: "pesos-uvr-leasing",
        titulo: "Pesos, UVR o leasing",
        texto: [
          "En pesos, la cuota es fija. En UVR, la deuda se mide en una unidad que sube con la inflación: la primera cuota es más baja y va subiendo. En leasing habitacional, el banco compra el inmueble y tú pagas un canon; al final pagas la opción de compra para quedarte con él.",
        ],
      },
      {
        id: "plazo",
        titulo: "El plazo",
        texto: [
          `Por ley, un crédito de vivienda tiene un plazo mínimo de ${min} años. El máximo lo fija el Gobierno; hoy las entidades prestan hasta ${max} años, y a quien vive fuera de Colombia una entidad de referencia le presta hasta ${ext}.`,
        ],
        fuente: { texto: "Ley 546 de 1999, art. 17, modificado por la Ley 2079 de 2021", url: P.plazoMinAnios.url },
      },
      {
        id: "gastos",
        titulo: "Gastos de escritura y registro",
        texto: [
          "Además del precio, pagas la notaría, el registro y el impuesto de registro de la compraventa y, si hay crédito hipotecario, de la hipoteca. Las tarifas de notaría y registro las fija cada año la Superintendencia de Notariado y Registro; el impuesto de registro, el departamento. El simulador las calcula con las resoluciones de 2026 y marca como supuesto lo que no está verificado.",
        ],
        fuente: { texto: "Resoluciones RES-2026-000964-6 y RES-2026-001726-6", url: P.registro.url },
      },
      {
        id: "exterior",
        titulo: "Si vives fuera de Colombia",
        texto: [
          "Puedes comprar desde el exterior con crédito de un banco colombiano. La cuota se paga en pesos: si tu ingreso está en otra moneda, el simulador te muestra cómo pesa la cuota si la tasa de cambio sube o baja.",
        ],
      },
    ],
    faqTitulo: "Preguntas",
    faq: [
      {
        pregunta: "¿El simulador me aprueba el crédito?",
        respuesta:
          "No. Es una simulación con fines informativos. La tasa, el monto y el plazo los define la entidad financiera con tu estudio de crédito.",
      },
      {
        pregunta: "¿Qué tasa usa?",
        respuesta:
          "Arranca con un promedio de lo que desembolsaron los bancos en crédito de vivienda No VIS en pesos, marcado como supuesto. Cámbiala por la que te ofrezca tu banco.",
      },
      {
        pregunta: "¿Mis datos quedan guardados?",
        respuesta:
          "No en nuestros servidores: el cálculo se hace en tu navegador. Solo si pides el plan en PDF o ayuda con tu crédito, tus datos y tu simulación le llegan a Rafael, con tu autorización.",
      },
      {
        pregunta: "¿Qué quiere decir «Supuesto»?",
        respuesta:
          "Que la cifra no tiene una fuente oficial verificada o que depende de tu caso: la puedes cambiar por tu dato. «Fuente» es un dato oficial o de mercado, con la entidad y la fecha; «Tu dato», lo que escribiste.",
      },
      {
        pregunta: "¿Por qué algunos proyectos no tienen precio?",
        respuesta:
          "Porque solo publicamos precio cuando la pieza cumple lo que exige la Superintendencia de Industria y Comercio (Circular 004 de 2024): el precio con el área y la ubicación exacta. Rafael te da el precio vigente con su respaldo.",
      },
    ],
    avisoImagenes: "Esta página no publica imágenes de inmuebles.",
    whatsapp: "Hola Rafael, estoy usando el simulador de tu página y tengo una pregunta: ",
  };
}

export function metadataSimulador(idioma: Idioma): Metadata {
  const t = textos(idioma);
  const { canonical, languages } = alternos("/simulador", idioma);
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

/** schema.org: la aplicación, las preguntas y la miga de pan. Sin valores inventados. */
function datosEstructurados(idioma: Idioma) {
  const t = textos(idioma);
  const url = alternos("/simulador", idioma).canonical;
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: t.nombreApp,
      url,
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web",
      inLanguage: idioma,
      isAccessibleForFree: true,
      provider: { "@type": "RealEstateAgent", name: "RHF Living — Rafael Hernández Franco", url: SITIO },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      inLanguage: idioma,
      mainEntity: t.faq.map((q) => ({
        "@type": "Question",
        name: q.pregunta,
        acceptedAnswer: { "@type": "Answer", text: q.respuesta },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: t.inicio, item: `${SITIO}${ruta(idioma, "/") === "/" ? "" : ruta(idioma, "/")}` },
        { "@type": "ListItem", position: 2, name: t.miga, item: url },
      ],
    },
  ];
}

export default function PaginaSimulador({ idioma = "es" }: { idioma?: Idioma }) {
  const t = textos(idioma);
  const items = itemsDelSimulador(idioma);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(datosEstructurados(idioma)) }} />
      <CabeceraSitio mensaje={t.whatsapp} actual="simulador" idioma={idioma} rutaEs="/simulador" />

      <main className="simp">
        <section className="simp-portada tono tono-claro tono-blanco-1" aria-labelledby="simp-titulo">
          <div className="section-shell">
            <p className="section-kicker">{t.kicker}</p>
            <h1 id="simp-titulo">{t.h1}</h1>
            <p className="section-lede">{t.lede}</p>
            <ul className="simp-puntos">
              {t.puntos.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="simp-simulador" aria-label={t.simuladorAria}>
          <div className="section-shell">
            <Simulador idioma={idioma} items={items} />
          </div>
        </section>

        <section className="simp-guia" aria-labelledby="simp-guia-titulo">
          <div className="section-shell">
            <p className="section-kicker">{t.guiaKicker}</p>
            <h2 id="simp-guia-titulo">{t.guiaTitulo}</h2>
            <div className="simp-guia-grid">
              {t.guia.map((g) => (
                <article key={g.id} id={g.id} className="simp-articulo">
                  <h3>{g.titulo}</h3>
                  {g.texto.map((p) => (
                    <p key={p.slice(0, 40)}>{p}</p>
                  ))}
                  {"fuente" in g && g.fuente && (
                    <p className="simp-fuente">
                      {g.fuente.url ? (
                        <a href={g.fuente.url} target="_blank" rel="noopener noreferrer">
                          {g.fuente.texto}
                        </a>
                      ) : (
                        g.fuente.texto
                      )}
                    </p>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="simp-faq" aria-labelledby="simp-faq-titulo">
          <div className="section-shell">
            <h2 id="simp-faq-titulo">{t.faqTitulo}</h2>
            <div className="simp-faq-lista">
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
      <WhatsAppFlotante trasDe=".simp-portada" soloEscritorio mensaje={t.whatsapp} idioma={idioma} />
    </>
  );
}
