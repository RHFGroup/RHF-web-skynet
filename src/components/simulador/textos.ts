/**
 * Los textos del simulador, en los dos idiomas (docs/i18n.md).
 *
 * `en` tiene el tipo de `es`: si falta una clave o cambia la forma de una
 * función, no compila. Las cifras llegan ya escritas (formato.ts) o salen de
 * la configuración; aquí no se escribe ninguna cifra a mano, salvo en los
 * textos de la norma que la citan con su fuente.
 *
 * Las fuentes y las notas públicas de la configuración están en español
 * (src/data/simulador.config.json). En inglés se traducen con FUENTES_EN,
 * buscadas por el texto exacto: si alguien cambia el español, sale el español
 * nuevo hasta que se traduzca aquí (la misma regla de src/data/en/traducir.ts).
 */
import type { Idioma } from "@/i18n/idioma";
import type { Aviso } from "@/lib/simulador/tipos";
import type { Palanca } from "@/lib/simulador/cartera";
import type { Modalidad } from "@/lib/simulador/compra";
import type { FilaComparada } from "@/lib/simulador/simular";
import type { Cuando, Pestana, TipoIngreso } from "@/components/simulador/tipos";
import { fechaDato, pesos, porcentaje } from "@/components/simulador/formato";

/** Un entero con separador de miles: 1200 → «1.200» / «1,200». */
function entero(n: number, idioma: Idioma): string {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, idioma === "en" ? "," : ".");
}

// ── Las fuentes de la configuración, en inglés ───────────────────────────

const FUENTES_EN: Record<string, string> = {
  // Fuentes
  "Decreto 1469 de 2025. El Consejo de Estado lo suspendió el 12-feb-2026, el Decreto 159 de 2026 fijó el mismo valor y la suspensión se levantó el 17-jul-2026: el valor no cambió.":
    "Decree 1469 of 2025. The Council of State suspended it on Feb 12, 2026; Decree 159 of 2026 set the same amount and the suspension was lifted on Jul 17, 2026: the amount did not change.",
  "DIAN, Resolución 000238 del 15 de diciembre de 2025": "DIAN (Colombian tax authority), Resolution 000238 of December 15, 2025",
  "DANE, IPC de agosto de 2026 (variación anual)": "DANE (national statistics office), August 2026 CPI (annual change)",
  "BBVA Research, Situación Colombia, septiembre de 2026: la inflación cerraría 2026 en 7,0 %":
    "BBVA Research, Situación Colombia, September 2026: inflation would end 2026 at 7.0%",
  "Banco de la República, Junta Directiva, Boletín 24 de 2026 (valores del 16-sep al 15-oct-2026)":
    "Banco de la República (central bank), Board of Directors, Bulletin 24 of 2026 (values from Sep 16 to Oct 15, 2026)",
  "Superintendencia Financiera, TRM vigente el 30-sep-2026 (datos.gov.co, conjunto 32sa-8pi3)":
    "Financial Superintendence of Colombia, official exchange rate (TRM) for Sep 30, 2026 (datos.gov.co, dataset 32sa-8pi3)",
  "Decreto 1077 de 2015, art. 2.1.9.1, modificado por el Decreto 584 de 2025: aglomeración urbana de Cartagena (Cartagena, Clemencia y Turbaco)":
    "Decree 1077 of 2015, art. 2.1.9.1, as amended by Decree 584 of 2025: Cartagena urban area (Cartagena, Clemencia and Turbaco)",
  "Decreto 949 de 2022, art. 2.2.2.1.5.2.2 (proyectos de renovación urbana)": "Decree 949 of 2022, art. 2.2.2.1.5.2.2 (urban renewal projects)",
  "Ley 2294 de 2023, art. 293, según el concepto jurídico de Minvivienda del 1-abr-2025":
    "Law 2294 of 2023, art. 293, per the Housing Ministry's legal opinion of Apr 1, 2025",
  "Decreto 1077 de 2015, art. 2.1.11.1, lit. a (adicionado por el Decreto 257 de 2021)":
    "Decree 1077 of 2015, art. 2.1.11.1, item a (added by Decree 257 of 2021)",
  "Decreto 1077 de 2015, art. 2.1.11.1, lit. b, modificado por el Decreto 583 de 2025: la primera cuota no puede pasar del 40 % de los ingresos familiares, en VIS y en No VIS. Aplica también al leasing habitacional.":
    "Decree 1077 of 2015, art. 2.1.11.1, item b, as amended by Decree 583 of 2025: the first payment cannot exceed 40% of household income, for social-interest (VIS) and non-VIS housing alike. It also applies to housing leases (leasing habitacional).",
  "Ley 546 de 1999, art. 17, num. 3, modificado por la Ley 2079 de 2021, art. 9": "Law 546 of 1999, art. 17, no. 3, as amended by Law 2079 of 2021, art. 9",
  "Lo que ofrecen hoy las entidades. La ley no fija el máximo: lo fija el Gobierno y no puede ser inferior a 30 años (Ley 2079 de 2021, art. 9).":
    "What lenders offer today. The law does not set the maximum: the Government sets it, and it cannot be less than 30 years (Law 2079 of 2021, art. 9).",
  "Oferta de Bancolombia (80 % o 90 %), BBVA (hasta 90 % en proyectos que financia) y el Fondo Nacional del Ahorro (hasta 90 %). No es un tope legal.":
    "Offers from Bancolombia (80% or 90%), BBVA (up to 90% in projects it finances) and the Fondo Nacional del Ahorro (up to 90%). It is not a legal cap.",
  "Supuesto: cada entidad define la opción de compra del leasing.": "Assumption: each lender sets the lease's purchase option.",
  "Bancolombia, crédito de vivienda desde el exterior: condiciones y países (referencia de una entidad)":
    "Bancolombia, home loans from abroad: terms and countries (one lender's reference)",
  "Superintendencia Financiera: promedio ponderado del crédito de vivienda de 16 entidades, septiembre de 2026, citado por Noticias Caracol":
    "Financial Superintendence: weighted average home-loan rate across 16 lenders, September 2026, as cited by Noticias Caracol",
  "Cálculo sobre los microdatos de tasas de la Superintendencia Financiera en datos.gov.co (conjunto qzsc-9esp): vivienda No VIS en pesos, ponderado por monto desembolsado, semana del 18-sep-2026":
    "Calculation on the Financial Superintendence's rate microdata at datos.gov.co (dataset qzsc-9esp): non-VIS housing in pesos, weighted by amount disbursed, week of Sep 18, 2026",
  "Pendiente: tasa real promedio del crédito de vivienda en UVR, Superintendencia Financiera":
    "Pending: average real rate of UVR home loans, Financial Superintendence",
  "Superintendencia Financiera: promedio ponderado de lo que desembolsó cada entidad en crédito de vivienda, septiembre de 2026, citado por Noticias Caracol":
    "Financial Superintendence: weighted average of what each lender disbursed in home loans, September 2026, as cited by Noticias Caracol",
  "Banco Serfinanza, licitación 001-2025 del seguro de vida grupo deudores: MAPFRE, 0,0412 % mensual (adjudicada el 15-oct-2025)":
    "Banco Serfinanza, tender 001-2025 for group borrower life insurance: MAPFRE, 0.0412% per month (awarded Oct 15, 2025)",
  "Banco Serfinanza, licitación 002-2025 del seguro de incendio y terremoto: La Previsora, 0,0099 % mensual (15-ene-2026)":
    "Banco Serfinanza, tender 002-2025 for fire and earthquake insurance: La Previsora, 0.0099% per month (Jan 15, 2026)",
  "Superintendencia de Notariado y Registro, Resolución RES-2026-000964-6 del 20-ene-2026: art. 2 (actos con cuantía), art. 31, par. 3 (compraventa VIS), art. 32 (hipoteca de vivienda, 70 %) y art. 33 (hipoteca VIS). IVA del 19 % por regla general.":
    "Superintendence of Notaries and Registry, Resolution RES-2026-000964-6 of Jan 20, 2026: art. 2 (acts with a stated value), art. 31, par. 3 (VIS sale), art. 32 (home mortgage, 70%) and art. 33 (VIS mortgage). 19% VAT as a general rule.",
  "Costumbre: comprador y vendedor pagan por mitades los derechos notariales de la compraventa":
    "Custom: buyer and seller split the notary fees for the sale in half",
  "Superintendencia de Notariado y Registro, Resolución RES-2026-001726-6 del 29-ene-2026 (vigente desde el 2-feb-2026): art. 1, lit. b (tramos sobre el valor total del acto), par. 8 (2 % de sistematización y conservación documental), art. 17 (VIS, la mitad) y art. 20 (hipoteca de vivienda, 70 %; VIS, 40 % o 10 %)":
    "Superintendence of Notaries and Registry, Resolution RES-2026-001726-6 of Jan 29, 2026 (in force since Feb 2, 2026): art. 1, item b (brackets on the act's total value), par. 8 (2% for systematization and document preservation), art. 17 (VIS, half) and art. 20 (home mortgage, 70%; VIS, 40% or 10%)",
  "Supuesto: la Ley 223 de 1995 (art. 230) fija para los departamentos entre 0,5 % y 1 % en actos con cuantía. La tarifa de Bolívar (Ordenanza 384 de 2024) no se pudo verificar.":
    "Assumption: Law 223 of 1995 (art. 230) lets each department set between 0.5% and 1% for acts with a stated value. Bolívar's rate (Ordinance 384 of 2024) could not be verified.",
  "Estatuto Tributario, art. 119. En leasing habitacional se deduce el componente financiero del canon (art. 127-1).":
    "Tax Code (Estatuto Tributario), art. 119. With a housing lease, the financial component of the payment is deductible (art. 127-1).",
  "Estatuto Tributario, art. 336 (Ley 2277 de 2022). Los intereses de vivienda entran en este tope (Concepto DIAN 9067 de 2026).":
    "Tax Code, art. 336 (Law 2277 of 2022). Mortgage interest counts toward this cap (DIAN Concept 9067 of 2026).",
  "Estatuto Tributario, art. 241 (Ley 2010 de 2019), tabla de la DIAN": "Tax Code, art. 241 (Law 2010 of 2019), DIAN table",
  "Fonvivienda, Circular 0012 de 2024, y Fondo Nacional del Ahorro: sin postulaciones nuevas. El 24-sep-2026 el Gobierno anunció «Mi Casa Milagro», sin reglamentar.":
    "Fonvivienda, Circular 0012 of 2024, and Fondo Nacional del Ahorro: no new applications. On Sep 24, 2026 the Government announced «Mi Casa Milagro», not yet regulated.",
  "Sin cupos de cobertura a la tasa abiertos para 2026: Fonvivienda, Circular 0012 de 2024 (cupos agotados), y ninguna norma nueva hallada al 30-sep-2026":
    "No interest-rate subsidy slots open for 2026: Fonvivienda, Circular 0012 of 2024 (slots exhausted), and no new rule found as of Sep 30, 2026",
  "Airbtics, Cartagena: ocupación mediana de febrero de 2025 a enero de 2026 (página actualizada el 12-mar-2026)":
    "Airbtics, Cartagena: median occupancy from February 2025 to January 2026 (page updated Mar 12, 2026)",
  "Airbtics, Cartagena: tarifa diaria promedio de febrero de 2025 a enero de 2026 (página actualizada el 12-mar-2026)":
    "Airbtics, Cartagena: average daily rate from February 2025 to January 2026 (page updated Mar 12, 2026)",
  "Supuesto: comisión del operador de renta corta": "Assumption: short-term rental operator's fee",
  "Ley 2068 de 2020, art. 36: 2,5 por mil de los ingresos operacionales; Decreto 1074 de 2015, art. 2.2.4.2.1.4 (vivienda turística)":
    "Law 2068 of 2020, art. 36: 2.5 per thousand of operating income; Decree 1074 of 2015, art. 2.2.4.2.1.4 (tourist housing)",
  "Supuesto: el proyecto no publica su fecha estimada de entrega. Cámbialo por la que te den en la sala de ventas.":
    "Assumption: the project does not publish its estimated handover date. Change it to the date the sales office gives you.",
  "Supuesto: plazo con el que arranca el simulador": "Assumption: the term the calculator starts with",
  "Supuesto: el simulador arranca con el máximo del crédito hipotecario No VIS": "Assumption: the calculator starts at the maximum for a non-VIS mortgage",
  "Supuesto: un mes al año sin arrendatario en renta tradicional": "Assumption: one month a year without a tenant in a long-term rental",
  // Notas públicas
  "Cada entidad puede exigir menos.": "Each lender may require less.",
  "Es el tope del crédito hipotecario. No aplica al leasing habitacional.": "It is the cap for mortgages. It does not apply to housing leases.",
  "Es el pronóstico de un banco, no un dato oficial.": "It is a bank's forecast, not official data.",
  "Es el promedio de todo el crédito de vivienda desembolsado, no la oferta que te hará un banco.":
    "It is the average across all home loans disbursed, not the offer a bank will make you.",
  "Es un promedio de lo desembolsado, no la oferta que te hará un banco: la tasa la define la entidad con tu estudio de crédito.":
    "It is an average of what was disbursed, not the offer a bank will make you: the lender sets your rate after reviewing your application.",
  "Son promedios de lo que desembolsó cada entidad, no la oferta que te harán. Mezclan segmentos (VIS, No VIS, pesos y UVR).":
    "These are averages of what each lender disbursed, not the offer you will get. They mix segments (VIS, non-VIS, pesos and UVR).",
  "Tasa de una sola entidad. Cada banco licita la suya y el seguro de vida depende de la edad. Se aplica sobre el saldo del crédito.":
    "One lender's rate. Each bank tenders its own, and life insurance depends on age. It applies to the loan balance.",
  "Tasa de una sola entidad, sobre el valor asegurado del inmueble.": "One lender's rate, on the property's insured value.",
  "Son las condiciones de una sola entidad; las de cada banco cambian.": "These are one lender's terms; each bank's differ.",
  "Si el avalúo catastral es mayor que el precio, el registro se liquida sobre el avalúo.":
    "If the cadastral value is higher than the price, registration is charged on the cadastral value.",
  "Minvivienda publicó en enero de 2026 un borrador para un tope nacional de 135 SMMLV. Al 30-sep-2026 no se había expedido.":
    "In January 2026 the Housing Ministry published a draft for a national cap of 135 monthly minimum wages. As of Sep 30, 2026 it had not been issued.",
  "Un proyecto de reforma tributaria (004 de 2026) propone subir la tarifa máxima al 41 %; al 14-sep-2026 seguía en comisión.":
    "A tax reform bill (004 of 2026) proposes raising the top rate to 41%; as of Sep 14, 2026 it was still in committee.",
  "Si vuelve, la cobertura es un monto mensual fijo en pesos, no puntos de tasa.": "If it returns, the subsidy is a fixed monthly amount in pesos, not rate points.",
  "Dato de un proveedor, promedio de toda la ciudad: la Zona Norte puede ser distinta.":
    "A data provider's figure, averaged across the whole city: the Zona Norte may differ.",
  "Dato de un proveedor, promedio de toda la ciudad.": "A data provider's figure, averaged across the whole city.",
  "Confírmalo con la oficina de registro antes de firmar.": "Confirm it with the registry office before signing.",
  "La tarifa única de la compraventa VIS aplica cuando se cumplen las condiciones de los Decretos 2158 de 1995 y 371 de 1996.":
    "The single VIS sale fee applies when the conditions of Decrees 2158 of 1995 and 371 of 1996 are met.",
};

/** Los países de la referencia para colombianos en el exterior. */
const PAISES_EN: Record<string, string> = {
  "Estados Unidos": "United States",
  "Canadá": "Canada",
  "Panamá": "Panama",
  "México": "Mexico",
  "Perú": "Peru",
  "Reino Unido": "United Kingdom",
  "España": "Spain",
  "Italia": "Italy",
  "Francia": "France",
  "Alemania": "Germany",
  "Suiza": "Switzerland",
  "Holanda": "Netherlands",
  "Bélgica": "Belgium",
  "Nueva Zelanda": "New Zealand",
  "Emiratos Árabes": "United Arab Emirates",
};

// ── Español ──────────────────────────────────────────────────────────────

const MODALIDAD_ES: Record<Modalidad, string> = {
  pesos: "crédito en pesos",
  uvr: "crédito en UVR",
  leasing: "leasing habitacional",
  contado: "de contado",
};

const es = {
  // Formato
  fuente: (texto: string) => texto,
  fechaDato: (texto: string) => fechaDato(texto, "es"),
  pais: (pais: string) => pais,

  // Inicio rápido
  inicioTitulo: "¿Cuánto te alcanza?",
  comoEmpezar: "Cómo quieres empezar",
  desdeIngreso: "Desde mi ingreso",
  desdeCuota: "Desde la cuota que quiero pagar",
  cuotaComoda: "Cuota mensual con la que estarías cómodo",
  cuotaComodaAyuda: "Sin seguros. Te decimos qué precio te alcanza con ella.",
  paraQue: "¿Para qué compras?",
  propositoVivir: "Para vivir",
  propositoInvertir: "Para invertir",
  propositoAmbas: "Las dos cosas",
  ingresoHogar: "Ingreso mensual del hogar",
  ingresoHogarAyuda: "Lo que ganan al mes quienes compran, como lo certificarían ante el banco.",
  sumarCodeudor: "Sumar el ingreso de un codeudor",
  ingresoCodeudor: "Ingreso mensual del codeudor",
  paraLaCuotaInicial: "Para la cuota inicial",
  ahorros: "Ahorros que tienes hoy",
  cesantias: "Cesantías",
  ahorroMensual: "Lo que puedes ahorrar al mes",
  ahorroMensualAyuda: "Hasta la entrega: con eso pagas la cuota inicial durante la obra.",
  vacioIngreso:
    "Escribe tu ingreso y lo que tienes para la cuota inicial: te mostramos cuánto te alcanza y qué inmuebles de la cartera entran.",
  vacioCuota: "Escribe la cuota con la que estarías cómodo.",
  teAlcanzaHasta: "Te alcanza hasta",
  limitaIngreso: (cuotaMax: string, pct: string) => `Lo pone tu ingreso: la primera cuota puede llegar a ${cuotaMax}, el ${pct} de tu ingreso.`,
  limitaCuotaInicial: (pctCI: string, meses: string) =>
    `Lo pone la cuota inicial: el ${pctCI} del precio, con lo que tienes hoy y lo que ahorres en ${meses} (supuesto de entrega).`,
  ajustarDetalle: "Ajustar el detalle",
  conEsaCuota: "Con esa cuota te alcanza hasta",
  conEsaCuotaDetalle: (pct: string, plazo: string, ingreso: string, limite: string) =>
    `Financiando el ${pct} a ${plazo}. Para esa cuota, el banco pide un ingreso del hogar de al menos ${ingreso}: la cuota no puede pasar del ${limite} del ingreso.`,
  detalleTitulo: "El detalle de tu compra",
  carteraConEstas: "La cartera con estas condiciones",
  avisoFinal:
    "Simulación con fines informativos. No es una oferta ni una aprobación de crédito: la tasa, el monto y el plazo los define la entidad financiera con tu estudio de crédito. Los precios son de referencia, en pesos colombianos, a la fecha de corte indicada y sujetos a disponibilidad.",
  pestanas: {
    compra: "Compra",
    financiacion: "Financiación",
    gastos: "Gastos",
    beneficios: "Beneficios",
    inversion: "Inversión",
    escenarios: "Escenarios",
  } as Record<Pestana, string>,
  nombreEscenario: (nombre: string, modalidad: Modalidad, pct: number, plazo: number) =>
    modalidad === "contado"
      ? `${nombre} · de contado`
      : `${nombre} · ${MODALIDAD_ES[modalidad]} ${porcentaje(pct, "es")} · ${entero(plazo, "es")} años`,
  otroPrecio: "Otro precio",
  esteInmueble: "este inmueble",
  inmueble: "Inmueble",
  plazo: "Plazo",
  probarLeasing: "Probar con leasing",

  // La frase
  fraseSi: "Si en tu hogar ganan",
  fraseAlMes: "al mes y tienes",
  fraseParaCI: "para la cuota inicial,",
  fraseContado: (precio: string) => `lo pagas de contado: ${precio}.`,
  fraseFaltaTasa: "necesita la tasa real del crédito en UVR para calcular la cuota: escríbela en Financiación.",
  fraseTeAlcanza: "te alcanza con una cuota de",
  frasePide: "pide una cuota de",
  fraseA: "a",
  fraseAnios: "años",
  fraseFalta: (ingreso: string | null, ci: string | null) =>
    ", pero te faltan " + [ingreso ? `${ingreso} de ingreso al mes` : null, ci ? `${ci} de cuota inicial` : null].filter(Boolean).join(" y "),

  // El tablero
  tableroTitulo: "Resumen de tu compra",
  pagasEnObra: "Pagas en obra",
  pagasALaFirma: "Pagas a la firma",
  enUnSoloPago: "en un solo pago",
  ciCubierta: "ya tienes la cuota inicial",
  ciCubiertaCorta: "la cuota inicial ya la tienes",
  alMesDurante: (m: string) => `al mes durante ${m}`,
  canonLeasing: "Canon del leasing",
  primeraCuotaUVR: "Primera cuota en UVR",
  cuotaCredito: "Cuota del crédito",
  escribeTasaUVR: "Escribe la tasa real en Financiación",
  alMes: "al mes",
  conSeguros: "con seguros",
  ingresoRequerido: "Ingreso que te piden",
  ingresoRequeridoDetalle: (pct: string) => `para que la cuota no pase del ${pct} del ingreso`,
  legalCumple: (pct: string) => `La cuota queda dentro del ${pct} de tu ingreso`,
  legalCerca: (pct: string) => `La cuota está cerca del límite del ${pct} de tu ingreso`,
  legalSupera: (pct: string) => `La cuota pasa del ${pct} de tu ingreso: así no se puede aprobar`,
  interesesTotales: "Intereses en todo el crédito",
  gastosCierre: "Escritura y registro",
  ultimoPago: "Último pago",
  cambioCuota: (d: string) => `${d} al mes`,
  cambioAnios: (d: string) => `${d} años`,
  cambioObra: (d: string) => `${d} al mes en obra`,
  hojaObra: "En obra",
  hojaFirma: "A la firma",
  hojaCuota: "Cuota",
  hojaIngreso: "Ingreso",
  aviso: (a: Aviso, idioma: Idioma): string => {
    const pct = porcentaje(a.limite, idioma);
    switch (a.codigo) {
      case "vis-supera-tope":
        return `El precio pasa del tope VIS de la zona (${pesos(a.limite, idioma)}): lo calculamos como vivienda No VIS.`;
      case "credito-financiacion-max":
        return `Con crédito hipotecario el banco financia hasta el ${pct} del inmueble (Decreto 1077 de 2015). Usamos ${pct}; con leasing habitacional puedes financiar más.`;
      case "leasing-financiacion-max":
        return `Hoy las entidades financian con leasing hasta el ${pct}. Usamos ${pct}.`;
      case "plazo-max":
        return `Hoy las entidades prestan hasta ${a.limite} años. Usamos ${a.limite}.`;
      case "plazo-max-exterior":
        return `Si vives fuera de Colombia, la referencia es de hasta ${a.limite} años. Usamos ${a.limite}.`;
      case "plazo-min":
        return `Por ley, el plazo mínimo de un crédito de vivienda es de ${a.limite} años (Ley 546 de 1999). Usamos ${a.limite}.`;
    }
  },

  // La etiqueta de cada cifra
  etq: { fuente: "Fuente", supuesto: "Supuesto", "tu-dato": "Tu dato" } as Record<"fuente" | "supuesto" | "tu-dato", string>,
  etqVerDetalle: "de dónde sale",
  etqTuDato: "Lo escribiste tú.",
  etqFecha: "Dato de",
  etqProxima: "próxima actualización",
  etqViejo: "Puede haber un dato más reciente: pregúntale a Rafael.",
  etqSupuesto: "Es un supuesto: cámbialo por tu dato si lo tienes.",
  etqVerFuente: "Ver la fuente",

  // Proyectos que te alcanzan
  teAlcanzanN: (n: number, total: number) => `Te ${n === 1 ? "alcanza" : "alcanzan"} ${n} de ${total} inmuebles con precio publicado`,
  ningunoAlcanza: "Con estos datos, todavía no te alcanza ninguno de los inmuebles con precio publicado",
  condicionesLista: (modalidad: string, pct: string, plazo: string) => `con ${modalidad} al ${pct} a ${plazo}`,
  modalidades: MODALIDAD_ES,
  verTodos: (n: number) => `Ver los ${n} inmuebles`,
  verMenos: "Ver menos",
  sinPrecioPublicado: "Sin precio publicado:",
  consultaloConRafael: "Rafael te da el precio vigente con su respaldo.",
  waPreguntarPor: (nombre: string) => `Hola Rafael, simulé ${nombre} en tu página y quiero saber más`,
  desde: "Desde",
  corte: (fecha: string) => `corte ${fecha}`,
  teAlcanza: "Te alcanza",
  faltaIngreso: (x: string) => `Te faltan ${x} de ingreso al mes`,
  faltaCuotaInicial: (x: string) => `Te faltan ${x} de cuota inicial`,
  cuotaEstimada: (x: string) => `Cuota estimada: ${x}`,
  enObra: (x: string, m: string) => `en obra, ${x} al mes por ${m}`,
  mesesSupuestos: (m: string) => `Entrega supuesta en ${m}: el proyecto no publica su fecha.`,
  simularEste: "Simular este",
  preguntarWA: "Preguntar por WhatsApp",
  queMover: "¿Qué mover para que te alcance?",
  sinPalancas: "Dentro de los límites, ningún cambio lo resuelve solo. Rafael puede revisar otras opciones contigo.",
  palanca: (p: Palanca, idioma: Idioma): string => {
    switch (p.palanca) {
      case "plazo":
        return `A ${p.cambio.plazoAnios} años:`;
      case "leasing":
        return `Con leasing al ${porcentaje(p.cambio.pctFinanciado, idioma)}:`;
      case "financiacion-max":
        return `Financiando el ${porcentaje(p.cambio.pctFinanciado, idioma)}:`;
      case "codeudor":
        return `Con un codeudor que gane ${pesos(p.cambio.ingresoCodeudor, idioma)} al mes:`;
      case "ahorro-adicional":
        return `Ahorrando ${pesos(p.cambio.ahorroMensualExtra, idioma)} más al mes:`;
      case "unidad-menor":
        return `Con una unidad de ${pesos(p.cambio.precio, idioma)}:`;
    }
  },
  probarEsto: "Probar esto",

  // Las gráficas
  caminoTitulo: "Tu camino a la escritura",
  caminoLede: "Toda tu compra mes a mes, de hoy al último pago.",
  caminoAria: (entrega: string, fin: string) =>
    `Pagos mes a mes: entrega en ${entrega}, último pago en ${fin}. Usa las flechas para recorrerla.`,
  marcaHoy: "Hoy",
  marcaEntrega: "Entrega",
  marcaFin: "Último pago",
  caminoMes: (mes: number, fecha: string) => `Mes ${mes} · ${fecha}`,
  caminoPagas: (x: string) => `pagas ${x}`,
  caminoIncluyeCierre: (x: string) => `incluye ${x} de escritura y registro`,
  caminoDebes: (x: string) => `debes ${x}`,
  caminoTuyo: (pct: string) => `${pct} ya es tuyo`,
  caminoAyuda: "Pasa el cursor o el dedo por la gráfica, o usa las flechas del teclado, para ver cada mes.",
  leyendaObra: "Cuota inicial en obra",
  leyendaFirma: "Pago a la firma",
  leyendaCierre: "Escritura y registro",
  leyendaCredito: "Cuota y seguros",
  leyendaAbono: "Mes con abono",
  leyendaDeuda: "Lo que debes",
  colMes: "Mes",
  colPago: "Pago",
  colDeuda: "Deuda",
  composicionTitulo: "Qué pagas cada año",
  composicionLede: (pct: string) => `El primer año, el ${pct} de lo que pagas son intereses. Con los años, la cuota abona más a capital.`,
  composicionAnio: (anio: number, capital: string, interes: string, seguros: string) =>
    `Año ${anio}: capital ${capital}, intereses ${interes}, seguros ${seguros}`,
  anioN: (n: number) => `Año ${n}`,
  mesN: (n: number) => `Mes ${n}`,
  leyendaCapital: "Capital",
  leyendaInteres: "Intereses",
  leyendaSeguros: "Seguros",
  tablaTitulo: "Tabla de amortización",
  colAnio: "Año",
  colCuotas: "Cuotas",
  colInteres: "Intereses",
  colCapital: "Capital",
  colSeguros: "Seguros",
  colAbonos: "Abonos",
  colSaldo: "Saldo",
  colPagado: "Pagado",

  // Pestaña «Compra»
  grupoInmueble: "El inmueble",
  fuentePrecio: (nombre: string) => `Precio de referencia de ${nombre} publicado en rhfliving.com, según el documento del constructor`,
  fuenteEntregaInmediata: (nombre: string) => `${nombre} se entrega de inmediato, según su ficha en rhfliving.com`,
  precio: "Precio",
  precioAyudaCartera: "Precio desde, a la fecha de corte y sujeto a disponibilidad. Cámbialo por el de la unidad que te interesa.",
  precioAyudaPropio: "Escribe el precio del inmueble que quieres simular.",
  separacion: "Separación",
  separacionAyuda: "Lo que pagas al separar la unidad. Cuenta como parte de la cuota inicial.",
  mesesEntrega: "Meses hasta la entrega",
  sufijoMeses: "meses",
  mesesAyuda: "La cuota inicial que falta se reparte en estos meses.",
  mesesCeroAyuda: "Entrega inmediata: la cuota inicial que falta se paga a la firma.",
  esVIS: "Es vivienda de interés social (VIS)",
  esVISAyuda: (smmlv: number, tope: string) => `En Cartagena, Clemencia y Turbaco, hasta ${entero(smmlv, "es")} salarios mínimos: ${tope}.`,
  grupoHogar: "Tu hogar",
  otrasDeudas: "Cuotas de otras deudas",
  otrasDeudasAyuda: "Al mes. No cambian el límite legal de la cuota, pero el banco las tiene en cuenta en tu estudio.",
  comprometido: (pct: string) => `Con tus otras deudas, el ${pct} de tu ingreso se va en cuotas.`,
  ciTitulo: "Tu cuota inicial",
  ciContadoTitulo: "Tu pago de contado",
  ciTotal: (pct: string) => `Cuota inicial (${pct})`,
  ciContado: "Precio completo",
  ciYaTienes: "Ya tienes",
  ciYaTienesNota: "separación, ahorros y cesantías",
  ciPendiente: "Te falta",
  ciALaFirma: "A la firma",
  ciPorMes: (m: string) => `Al mes, durante ${m}`,
  ciSobra: (ahorro: string, x: string) => `Con tu ahorro de ${ahorro} al mes te sobran ${x}.`,
  ciFalta: (ahorro: string, x: string) => `Con tu ahorro de ${ahorro} al mes te faltan ${x} cada mes.`,

  // Pestaña «Financiación»
  modalidad: "Cómo lo financias",
  modalidadTitulo: {
    pesos: "Crédito en pesos",
    uvr: "Crédito en UVR",
    leasing: "Leasing habitacional",
    contado: "De contado",
  } as Record<Modalidad, string>,
  modalidadDetalle: {
    pesos: "Cuota fija en pesos",
    uvr: "La cuota sube con la inflación",
    leasing: "El banco compra y tú pagas un canon",
    contado: "Sin crédito",
  } as Record<Modalidad, string>,
  contadoNota:
    "De contado pagas el precio completo, sin crédito: lo que no tienes hoy se reparte en los meses de la obra. Solo pagas la escritura y el registro de la compraventa.",
  grupoCredito: "El crédito",
  pctFinanciado: "Qué parte financias",
  pctFinanciadoAyuda: (noVis: string, vis: string, leasing: string) =>
    `Con crédito hipotecario, hasta el ${noVis} (No VIS) o el ${vis} (VIS). Con leasing, hasta el ${leasing} según la entidad.`,
  sufijoAnios: "años",
  plazoAyuda: (min: number, max: number) => `Por ley, mínimo ${min} años. Hoy las entidades prestan hasta ${max}.`,
  tasaRealUVR: "Tasa real (sobre la UVR)",
  sufijoUVR: "% + UVR",
  tasaUVRFalta:
    "Escribe la tasa que te ofrece el banco (por ejemplo, UVR + 8 %). No ponemos un promedio porque no lo tenemos verificado.",
  tasaUVRAyuda: "La cuota en UVR sube cada mes con la inflación; la tasa real es lo que cobra el banco por encima.",
  inflacionSupuesta: "Inflación supuesta",
  inflacionAyuda: (ipc: string) => `La última inflación anual del DANE fue ${ipc}.`,
  tasaLeasing: "Tasa del leasing (efectiva anual)",
  tasa: "Tasa de interés (efectiva anual)",
  sufijoEA: "% E.A.",
  tasaAyuda: "Empieza con un promedio de lo que desembolsaron los bancos. Cámbiala por la que te ofrezcan.",
  tasaLeasingAyuda: "Cada entidad fija la suya: empieza con el promedio del crédito No VIS en pesos. Cámbiala por la que te ofrezcan.",
  opcionCompra: "Opción de compra",
  opcionCompraAyuda: (x: string) => `Lo que pagas al final para quedarte con el inmueble: ${x}.`,
  entidadesTitulo: "Tasas promedio por entidad",
  entidadesLede: (mes: string) => `Lo que desembolsó en promedio cada entidad (${mes}). No es la oferta que te harán.`,
  colEntidad: "Entidad",
  colTasa: "Tasa E.A.",
  colCuota: "Tu cuota",
  usarTasa: "Usar esta tasa",
  grupoSeguros: "Seguros",
  incluirSeguros: "Incluir los seguros del crédito",
  segurosAyuda: (vida: string, incendio: string) =>
    `Vida deudor (${vida} al mes sobre el saldo) e incendio y terremoto (${incendio} al mes sobre el valor del inmueble).`,
  segurosResultado: (mes1: string, total: string) => `El primer mes pagas ${mes1} de seguros; ${total} en todo el crédito.`,
  grupoAbonos: "Abonos extra",
  abonosLede: "En el crédito de vivienda puedes abonar sin penalidad y eliges si baja la cuota o el plazo (Ley 546 de 1999, art. 17).",
  abonosLedeLeasing: "En el leasing, las condiciones de los abonos las fija cada entidad: revísalas en tu contrato.",
  abonoAnual: "Abono una vez al año",
  abonoAnualAyuda: "La prima o las cesantías, por ejemplo.",
  abonoMensual: "Abono extra cada mes",
  abonoDesde: "Desde el mes",
  sufijoMesCredito: "del crédito",
  abonoReduce: "¿Qué quieres que baje?",
  reducePlazo: "El plazo",
  reduceCuota: "La cuota",
  abonoResultadoPlazo: (tiempo: string, ahorro: string) => `Terminas ${tiempo} antes y te ahorras ${ahorro} en intereses.`,
  abonoResultadoCuota: (cuota: string, ahorro: string) => `Tu cuota baja a ${cuota} y te ahorras ${ahorro} en intereses.`,
  estresTitulo: "¿Y si cambian las condiciones?",
  estresTasa: "Tasa + 2 puntos",
  estresInflacion: "Inflación + 2 puntos",
  estresResultado: (cuota: string, ingreso: string, intereses: string) =>
    `Tu cuota cambiaría ${cuota} al mes, el ingreso que te piden ${ingreso} y los intereses totales ${intereses}.`,

  // Pestaña «Gastos»
  gastosTitulo: "Gastos de escritura y registro",
  gastosLede:
    "Lo que pagas al escriturar y registrar, además del precio. Tarifas de la Superintendencia de Notariado y Registro para 2026.",
  gNotarialCompraventa: (pct: string) => `Notaría de la compraventa (tu parte: ${pct})`,
  gRegistroCompraventa: "Registro de la compraventa",
  gImpuestoCompraventa: "Impuesto de registro de la compraventa",
  gNotarialHipoteca: "Notaría de la hipoteca",
  gRegistroHipoteca: "Registro de la hipoteca",
  gImpuestoHipoteca: "Impuesto de registro de la hipoteca",
  gEstudio: "Estudio de títulos y avalúo",
  gEstudioAyuda: "Los cobra el banco y cada uno fija los suyos: escribe lo que te coticen.",
  gTotal: "Total",
  gDelPrecio: (pct: string) => `${pct} del precio`,
  gNotaLeasing: "En leasing el banco compra el inmueble: no hay hipoteca, y cómo se reparten estos gastos lo define cada entidad.",
  gNotaContado: "De contado no hay hipoteca: solo la compraventa.",
  gNotaVIS: "En VIS, la notaría y el registro tienen tarifas especiales, ya incluidas.",
  gNotaReparto:
    "Por costumbre, comprador y vendedor pagan la notaría de la compraventa por mitades; la promesa de compraventa puede decir otra cosa.",
  gNotaAvaluo: "Si el avalúo catastral es mayor que el precio, el registro se liquida sobre el avalúo.",

  // Pestaña «Beneficios»
  rentaTitulo: "Deducción de intereses en la renta",
  rentaSinCredito: "Sin crédito no hay intereses que deducir.",
  tarifaMarginal: "Tu tarifa marginal de renta",
  noSe: "No sé",
  rentaIntereses: "Intereses del primer año",
  rentaDeducible: "Deducible",
  rentaTope: (uvt: number, valor: string) => `tope: ${entero(uvt, "es")} UVT al año (${valor})`,
  rentaAhorro: "Ahorro estimado en tu impuesto",
  rentaElige: "Elige tu tarifa para estimar el ahorro.",
  rentaCondiciones: "Solo si vives en el inmueble y declaras renta.",
  rentaCondicionesLeasing: "En leasing habitacional se deduce el componente financiero del canon, solo si vives en el inmueble y declaras renta.",
  rentaTopeConjunto: (pct: string, uvt: number) =>
    `Entra en el tope conjunto del ${pct} y ${entero(uvt, "es")} UVT con tus otras deducciones y rentas exentas.`,
  rentaEstimacion: "Es una estimación: consulta a tu contador.",
  subsidiosTitulo: "Subsidios del Gobierno",
  miCasaYaNo: "Mi Casa Ya: hoy no recibe postulaciones nuevas.",
  miCasaYaSi: "Mi Casa Ya: recibe postulaciones. Pregúntale a Rafael si aplicas.",
  frechNo: "Cobertura a la tasa (FRECH): sin cupos abiertos para 2026.",
  frechSi: "Cobertura a la tasa (FRECH): hay cupos. Pregúntale a Rafael si aplicas.",
  exteriorTitulo: "Si vives fuera de Colombia",
  vivoFuera: "Vivo fuera de Colombia",
  exteriorCondiciones: (noVis: string, vis: string, plazo: number, smmlv: number) =>
    `Referencia de una entidad: financia hasta el ${noVis} (No VIS) o el ${vis} (VIS), a máximo ${plazo} años, con ingresos desde ${smmlv} salarios mínimos.`,
  exteriorPaises: (lista: string) => `Países donde la ofrece: ${lista}.`,
  moneda: "Moneda de tu ingreso",
  ingresoExterior: (m: string) => `Ingreso mensual del hogar en ${m}`,
  tasaCambio: (m: string) => `Pesos por cada ${m}`,
  fuenteTRM: "Superintendencia Financiera: TRM del día",
  tasaCambioEUR: "Escribe cuántos pesos vale hoy un euro.",
  usarComoIngreso: (x: string) => `Usar ${x} como ingreso del hogar`,
  trmLede: "Si el peso se revalúa, tu ingreso en pesos baja y la cuota pesa más:",
  colVariacion: "Cambio de la tasa",
  colTasaCambio: "Tasa de cambio",
  colIngresoPesos: "Tu ingreso en pesos",
  colCuotaIngreso: "Cuota / ingreso",
  hoy: "Hoy",
  arrendarTitulo: "¿Arrendar o comprar?",
  arrendarLede:
    "Compara lo que pagas cada mes y lo que cada camino te cuesta de verdad: los intereses, los seguros y los gastos no vuelven; la cuota inicial y el capital se vuelven patrimonio.",
  arriendoActual: "Arriendo que pagas hoy",
  administracion: "Administración al mes",
  predialMensual: "Predial, al mes",
  incrementoArriendo: "Aumento anual del arriendo",
  valorizacion: "Valorización anual",
  valorizacionAyuda: "Supuesto: que el inmueble suba como la inflación. Nadie garantiza la valorización.",
  comprarSupera: (n: number) => `Con estos supuestos, comprar te sale mejor que arrendar desde el año ${n}.`,
  arrendarSigue: (n: number) => `Con estos supuestos, en ${n} años arrendar sigue saliendo más barato.`,
  colSalidaComprar: "Si compras, al mes",
  colArriendo: "Si arriendas, al mes",
  colPatrimonio: "Tu patrimonio",
  arrendarNota:
    "No incluye lo que rendiría tu cuota inicial si no compras, ni cambios de tasa. Es una comparación, no una recomendación.",

  // Pestaña «Inversión»
  rentaCortaSolo: (nombres: string) =>
    `La renta corta solo se calcula para inmuebles cuyo reglamento la permite. En la cartera: ${nombres}.`,
  rentaCortaTitulo: "Renta corta",
  rentaCortaAviso: (fuente: string) =>
    `Estimación, no garantía de ingresos. La renta corta depende del reglamento de propiedad horizontal y del Registro Nacional de Turismo. Que este inmueble la permite: ${fuente}.`,
  tarifaNoche: "Tarifa por noche",
  tarifaNocheAyuda: (x: string) => `En pesos, con la TRM: ${x}.`,
  ocupacion: "Ocupación",
  comisionOperador: "Comisión del operador",
  servicios: "Servicios al mes",
  dotacion: "Dotación (una vez)",
  dotacionAyuda: "Muebles y equipos para arrendar. Se suma a lo que pones de tu bolsillo.",
  nochesMes: "Noches ocupadas al mes",
  ingresoBruto: "Ingreso bruto al mes",
  gastosOperacion: "Gastos al mes",
  gastosOperacionNota: (pct: string) =>
    `operador, contribución al turismo (${pct} del ingreso), administración, predial, servicios y seguros`,
  flujoAntes: "Flujo antes de la cuota",
  flujoDespues: "Flujo después de la cuota",
  ocupacionEquilibrio: "Ocupación para no poner plata",
  ningunaOcupacion: "ni al 100 %",
  rentabilidadBruta: "Rentabilidad bruta anual",
  rentabilidadNeta: "Rentabilidad neta anual",
  retornoCapital: "Retorno sobre tu capital",
  retornoCapitalNota: "después de la cuota, sobre lo que pones de tu bolsillo",
  rentaTradicionalTitulo: "Renta tradicional",
  rentaTradicionalAviso: "Estimación, no garantía de ingresos. El canon es tu dato: pregúntale a Rafael por los arriendos de la zona.",
  canon: "Canon mensual",
  canonAyuda: "Lo que pagaría un arrendatario al mes.",
  vacancia: (n: number) => `Supuesto: ${n} ${n === 1 ? "mes" : "meses"} al año sin arrendatario.`,
  ingresoAnual: "Ingreso anual",

  // Pestaña «Escenarios»
  escenariosLede: "Guarda hasta tres escenarios y compáralos lado a lado. Marcamos el mejor de cada fila.",
  maximoEscenarios: "Ya guardaste tres",
  guardarEscenario: "Guardar este escenario",
  concepto: "Concepto",
  quitarEscenario: (nombre: string) => `Quitar ${nombre}`,
  filaComparada: {
    pagoObra: "Pago mensual en obra",
    cuota: "Cuota del crédito",
    ingresoRequerido: "Ingreso que te piden",
    totalIntereses: "Intereses en total",
    gastosCierre: "Escritura y registro",
    mesUltimoPago: "Último pago",
  } as Record<FilaComparada["clave"], string>,
  mejor: "el mejor",

  // Acciones
  accionesTitulo: "Llévate tu simulación",
  accionesLede:
    "Guárdala, compártela o pídele a Rafael que la revise contigo. Tus datos de contacto solo se piden para enviarte el plan o para ayudarte con el crédito.",
  enviarWhatsApp: "Enviar a Rafael por WhatsApp",
  copiarEnlace: "Copiar enlace",
  enlaceCopiado: "Enlace copiado",
  copiaManual: "Copia este enlace:",
  descargarPlan: "Descargar mi plan en PDF",
  quieroAyuda: "Quiero ayuda con mi crédito",
  okPlan: "Listo. Se abrió la ventana de impresión: elige «Guardar como PDF». Rafael también recibió tu simulación.",
  okAyuda: "Listo. Rafael ya tiene tu simulación y te escribe al contacto que nos dejaste.",
  abrirOtraVez: "Abrir otra vez",
  formPlanTitulo: "Tu plan en PDF",
  formPlanLede:
    "Déjanos tu nombre y tu contacto: te dejamos el plan listo para guardar, y Rafael recibe tu simulación por si quieres revisarla con él.",
  formAyudaTitulo: "Ayuda con tu crédito",
  formAyudaLede: "Rafael revisa tu simulación y te dice qué necesitas para pedir el crédito o el leasing.",
  cerrar: "Cerrar",
  nombre: "Nombre",
  contacto: "Teléfono o email",
  contactoPlaceholder: "¿Cómo te contactamos?",
  cuandoCompras: "¿Cuándo piensas comprar?",
  cuando: {
    "0-3": "En menos de 3 meses",
    "3-6": "De 3 a 6 meses",
    "6-12": "De 6 a 12 meses",
    "12+": "En más de un año",
  } as Record<Cuando, string>,
  tusIngresos: "Tus ingresos vienen de",
  tipoIngreso: {
    empleado: "Un empleo",
    independiente: "Trabajo independiente",
    pensionado: "Una pensión",
    exterior: "Trabajo fuera de Colombia",
  } as Record<TipoIngreso, string>,
  // El texto de la autorización, idéntico al de ContactForm (versión 2026-09-18).
  autorizo: "Autorizo a ",
  tratar: " a tratar mis datos personales para contactarme sobre esta consulta",
  conforme: ", conforme a la",
  politica: "política de tratamiento de datos",
  derechos: ". Puedo conocer, actualizar, rectificar o suprimir mis datos escribiendo a ",
  faltaAutorizacion: "Necesitamos tu autorización para tratar tus datos antes de continuar.",
  enviando: "Enviando…",
  prepararPlan: "Preparar mi PDF",
  pedirAyuda: "Pedir ayuda",
  falloTitulo: "El envío falló.",
  falloTexto: "Mándale tu simulación a Rafael por WhatsApp, o vuelve a intentarlo en un momento.",
  disclaimer:
    "Guardamos tu consulta para responderte. La conservamos hasta dos años desde nuestro último contacto, y la borramos antes si nos lo pides.",
  waIntro: "Hola Rafael, hice esta simulación en rhfliving.com:",
  waCondiciones: (modalidad: string, pct: string, plazo: string) => `${modalidad} al ${pct} a ${plazo}`,
  waALaFirma: (x: string) => `A la firma: ${x}`,
  waEnObra: (x: string, m: string) => `En obra: ${x} al mes por ${m}`,
  waCuota: (x: string) => `Cuota: ${x} al mes`,
  waIngreso: (x: string) => `Ingreso que piden: ${x}`,
  waCierre: "Quiero revisarla contigo.",

  // El plan para imprimir
  planTitulo: "Tu plan de compra",
  planFecha: (fecha: string) => `Simulación del ${fecha} en rhfliving.com`,
  planInmueble: "El inmueble",
  planComoPagas: "Cómo lo pagas",
  planCredito: "El crédito",
  montoFinanciado: "Monto financiado",
  planTuIngreso: (ingreso: string, pct: string) => `con tu ingreso de ${ingreso}, la cuota es el ${pct}`,
  planFechas: "Las fechas",
  planSupuestos: "Lo que es supuesto",
  planSupuestoTasa: (x: string) => `La tasa (${x} E.A.) es un promedio del mercado, no una oferta.`,
  planSupuestoMeses: (m: string) => `La entrega en ${m}: el proyecto no publica su fecha.`,
  planSupuestoImpuesto: (x: string) => `El impuesto de registro (${x}): la tarifa de Bolívar no está verificada.`,
  planSupuestoSeguros: "Los seguros: tasas de una sola entidad; las de tu banco pueden ser otras.",
  planSupuestoInflacion: (x: string) => `La inflación del crédito en UVR (${x} al año).`,
  planEnlace: "Vuelve a abrir esta simulación:",
  planContacto: (tel: string) => `Rafael Hernández Franco · RHF Living · WhatsApp ${tel} · rhfliving.com`,
};

export type Textos = typeof es;

// ── English ──────────────────────────────────────────────────────────────

const MODALIDAD_EN: Record<Modalidad, string> = {
  pesos: "peso loan",
  uvr: "UVR loan",
  leasing: "housing lease",
  contado: "cash purchase",
};

const en: Textos = {
  fuente: (texto) => (Object.prototype.hasOwnProperty.call(FUENTES_EN, texto) ? FUENTES_EN[texto] : texto),
  fechaDato: (texto) => fechaDato(texto, "en"),
  pais: (pais) => PAISES_EN[pais] ?? pais,

  inicioTitulo: "How much can you afford?",
  comoEmpezar: "How do you want to start?",
  desdeIngreso: "From my income",
  desdeCuota: "From the payment I want",
  cuotaComoda: "Monthly payment you'd be comfortable with",
  cuotaComodaAyuda: "Before insurance. We'll tell you what price it gets you.",
  paraQue: "What are you buying for?",
  propositoVivir: "To live in",
  propositoInvertir: "To invest",
  propositoAmbas: "Both",
  ingresoHogar: "Monthly household income",
  ingresoHogarAyuda: "What the buyers earn per month, as they would certify it to the bank.",
  sumarCodeudor: "Add a co-borrower's income",
  ingresoCodeudor: "Co-borrower's monthly income",
  paraLaCuotaInicial: "For the down payment",
  ahorros: "Savings you have today",
  cesantias: "Severance savings (cesantías)",
  ahorroMensual: "What you can save each month",
  ahorroMensualAyuda: "Until handover: it goes toward the down payment during construction.",
  vacioIngreso:
    "Enter your income and what you have for the down payment: we'll show you how much you can afford and which properties in our portfolio fit.",
  vacioCuota: "Enter the monthly payment you'd be comfortable with.",
  teAlcanzaHasta: "You can afford up to",
  limitaIngreso: (cuotaMax, pct) => `Your income sets the limit: the first payment can be up to ${cuotaMax}, ${pct} of your income.`,
  limitaCuotaInicial: (pctCI, meses) =>
    `Your down payment sets the limit: ${pctCI} of the price, with what you have today and what you save in ${meses} (assumed handover).`,
  ajustarDetalle: "Fine-tune the details",
  conEsaCuota: "With that payment you can afford up to",
  conEsaCuotaDetalle: (pct, plazo, ingreso, limite) =>
    `Financing ${pct} over ${plazo}. For that payment, the bank requires a household income of at least ${ingreso}: the payment cannot exceed ${limite} of income.`,
  detalleTitulo: "Your purchase in detail",
  carteraConEstas: "Our portfolio under these terms",
  avisoFinal:
    "This simulation is for information only. It is not a loan offer or approval: the lender sets the rate, amount and term after reviewing your application. Prices are reference prices in Colombian pesos as of the stated cut-off date and subject to availability.",
  pestanas: {
    compra: "Purchase",
    financiacion: "Financing",
    gastos: "Closing costs",
    beneficios: "Benefits",
    inversion: "Investment",
    escenarios: "Scenarios",
  },
  nombreEscenario: (nombre, modalidad, pct, plazo) =>
    modalidad === "contado" ? `${nombre} · cash` : `${nombre} · ${MODALIDAD_EN[modalidad]} ${porcentaje(pct, "en")} · ${entero(plazo, "en")} yrs`,
  otroPrecio: "Another price",
  esteInmueble: "this property",
  inmueble: "Property",
  plazo: "Term",
  probarLeasing: "Try a housing lease",

  fraseSi: "If your household earns",
  fraseAlMes: "a month and you have",
  fraseParaCI: "for the down payment,",
  fraseContado: (precio) => `you pay it in cash: ${precio}.`,
  fraseFaltaTasa: "needs the UVR loan's real rate to calculate the payment: enter it under Financing.",
  fraseTeAlcanza: "is within reach with a monthly payment of",
  frasePide: "needs a monthly payment of",
  fraseA: "over",
  fraseAnios: "years",
  fraseFalta: (ingreso, ci) =>
    ", but you're short " + [ingreso ? `${ingreso} of monthly income` : null, ci ? `${ci} for the down payment` : null].filter(Boolean).join(" and "),

  tableroTitulo: "Your purchase at a glance",
  pagasEnObra: "During construction",
  pagasALaFirma: "At signing",
  enUnSoloPago: "in a single payment",
  ciCubierta: "you already have the down payment",
  ciCubiertaCorta: "down payment already covered",
  alMesDurante: (m) => `a month for ${m}`,
  canonLeasing: "Lease payment",
  primeraCuotaUVR: "First UVR payment",
  cuotaCredito: "Loan payment",
  escribeTasaUVR: "Enter the real rate under Financing",
  alMes: "a month",
  conSeguros: "with insurance",
  ingresoRequerido: "Income required",
  ingresoRequeridoDetalle: (pct) => `so the payment stays within ${pct} of income`,
  legalCumple: (pct) => `The payment is within ${pct} of your income`,
  legalCerca: (pct) => `The payment is close to the ${pct}-of-income limit`,
  legalSupera: (pct) => `The payment exceeds ${pct} of your income: it can't be approved this way`,
  interesesTotales: "Total interest over the loan",
  gastosCierre: "Deed and registration",
  ultimoPago: "Last payment",
  cambioCuota: (d) => `${d} a month`,
  cambioAnios: (d) => `${d} years`,
  cambioObra: (d) => `${d} a month during construction`,
  hojaObra: "Build",
  hojaFirma: "At signing",
  hojaCuota: "Payment",
  hojaIngreso: "Income",
  aviso: (a, idioma) => {
    const pct = porcentaje(a.limite, idioma);
    switch (a.codigo) {
      case "vis-supera-tope":
        return `The price is above the social-interest housing (VIS) cap for the area (${pesos(a.limite, idioma)}): we calculate it as non-VIS housing.`;
      case "credito-financiacion-max":
        return `With a mortgage, banks finance up to ${pct} of the property (Decree 1077 of 2015). We use ${pct}; a housing lease can finance more.`;
      case "leasing-financiacion-max":
        return `Lenders currently finance up to ${pct} with a housing lease. We use ${pct}.`;
      case "plazo-max":
        return `Lenders currently lend for up to ${a.limite} years. We use ${a.limite}.`;
      case "plazo-max-exterior":
        return `If you live outside Colombia, the reference is up to ${a.limite} years. We use ${a.limite}.`;
      case "plazo-min":
        return `By law, the minimum home-loan term is ${a.limite} years (Law 546 of 1999). We use ${a.limite}.`;
    }
  },

  etq: { fuente: "Source", supuesto: "Assumption", "tu-dato": "Your figure" },
  etqVerDetalle: "where it comes from",
  etqTuDato: "You entered it.",
  etqFecha: "As of",
  etqProxima: "next update",
  etqViejo: "There may be a newer figure: ask Rafael.",
  etqSupuesto: "It's an assumption: replace it with your own figure if you have one.",
  etqVerFuente: "See the source",

  teAlcanzanN: (n, total) => `${n} of ${total} properties with a published price ${n === 1 ? "is" : "are"} within reach`,
  ningunoAlcanza: "With these figures, none of the properties with a published price is within reach yet",
  condicionesLista: (modalidad, pct, plazo) => `with a ${modalidad} at ${pct} over ${plazo}`,
  modalidades: MODALIDAD_EN,
  verTodos: (n) => `See all ${n} properties`,
  verMenos: "Show fewer",
  sinPrecioPublicado: "No published price:",
  consultaloConRafael: "Rafael can give you the current price with its supporting documents.",
  waPreguntarPor: (nombre) => `Hi Rafael, I ran the numbers on ${nombre} on your website and I'd like to know more`,
  desde: "From",
  corte: (fecha) => `price as of ${fecha}`,
  teAlcanza: "It's within reach",
  faltaIngreso: (x) => `You're short ${x} of monthly income`,
  faltaCuotaInicial: (x) => `You're short ${x} for the down payment`,
  cuotaEstimada: (x) => `Estimated payment: ${x}`,
  enObra: (x, m) => `during construction, ${x} a month for ${m}`,
  mesesSupuestos: (m) => `Handover assumed in ${m}: the project doesn't publish its date.`,
  simularEste: "Simulate this one",
  preguntarWA: "Ask on WhatsApp",
  queMover: "What could make it fit?",
  sinPalancas: "Within the limits, no single change solves it. Rafael can look at other options with you.",
  palanca: (p, idioma) => {
    switch (p.palanca) {
      case "plazo":
        return `Over ${p.cambio.plazoAnios} years:`;
      case "leasing":
        return `With a housing lease at ${porcentaje(p.cambio.pctFinanciado, idioma)}:`;
      case "financiacion-max":
        return `Financing ${porcentaje(p.cambio.pctFinanciado, idioma)}:`;
      case "codeudor":
        return `With a co-borrower earning ${pesos(p.cambio.ingresoCodeudor, idioma)} a month:`;
      case "ahorro-adicional":
        return `Saving ${pesos(p.cambio.ahorroMensualExtra, idioma)} more a month:`;
      case "unidad-menor":
        return `With a unit priced at ${pesos(p.cambio.precio, idioma)}:`;
    }
  },
  probarEsto: "Try this",

  caminoTitulo: "Your path to the deed",
  caminoLede: "Your whole purchase month by month, from today to the last payment.",
  caminoAria: (entrega, fin) => `Monthly payments: handover in ${entrega}, last payment in ${fin}. Use the arrow keys to move through it.`,
  marcaHoy: "Today",
  marcaEntrega: "Handover",
  marcaFin: "Last payment",
  caminoMes: (mes, fecha) => `Month ${mes} · ${fecha}`,
  caminoPagas: (x) => `you pay ${x}`,
  caminoIncluyeCierre: (x) => `includes ${x} in deed and registration costs`,
  caminoDebes: (x) => `you owe ${x}`,
  caminoTuyo: (pct) => `${pct} is already yours`,
  caminoAyuda: "Move the cursor or your finger over the chart, or use the arrow keys, to see each month.",
  leyendaObra: "Down payment during construction",
  leyendaFirma: "Payment at signing",
  leyendaCierre: "Deed and registration",
  leyendaCredito: "Payment and insurance",
  leyendaAbono: "Month with an extra payment",
  leyendaDeuda: "What you owe",
  colMes: "Month",
  colPago: "Payment",
  colDeuda: "Balance",
  composicionTitulo: "What you pay each year",
  composicionLede: (pct) => `In the first year, ${pct} of what you pay is interest. Over time, more of each payment goes to principal.`,
  composicionAnio: (anio, capital, interes, seguros) => `Year ${anio}: principal ${capital}, interest ${interes}, insurance ${seguros}`,
  anioN: (n) => `Year ${n}`,
  mesN: (n) => `Month ${n}`,
  leyendaCapital: "Principal",
  leyendaInteres: "Interest",
  leyendaSeguros: "Insurance",
  tablaTitulo: "Amortization table",
  colAnio: "Year",
  colCuotas: "Payments",
  colInteres: "Interest",
  colCapital: "Principal",
  colSeguros: "Insurance",
  colAbonos: "Extra payments",
  colSaldo: "Balance",
  colPagado: "Paid off",

  grupoInmueble: "The property",
  fuentePrecio: (nombre) => `Reference price for ${nombre} published on rhfliving.com, per the builder's document`,
  fuenteEntregaInmediata: (nombre) => `${nombre} is ready for handover, per its page on rhfliving.com`,
  precio: "Price",
  precioAyudaCartera: "Starting price, as of the cut-off date and subject to availability. Change it to the price of the unit you're interested in.",
  precioAyudaPropio: "Enter the price of the property you want to simulate.",
  separacion: "Reservation deposit (separación)",
  separacionAyuda: "What you pay to reserve the unit. It counts toward the down payment.",
  mesesEntrega: "Months until handover",
  sufijoMeses: "months",
  mesesAyuda: "The rest of the down payment is spread over these months.",
  mesesCeroAyuda: "Immediate handover: the rest of the down payment is paid at signing.",
  esVIS: "It's social-interest housing (VIS)",
  esVISAyuda: (smmlv, tope) => `In Cartagena, Clemencia and Turbaco, up to ${entero(smmlv, "en")} monthly minimum wages: ${tope}.`,
  grupoHogar: "Your household",
  otrasDeudas: "Other debt payments",
  otrasDeudasAyuda: "Per month. They don't change the legal payment limit, but the bank takes them into account.",
  comprometido: (pct) => `Including your other debts, ${pct} of your income goes to payments.`,
  ciTitulo: "Your down payment",
  ciContadoTitulo: "Your cash payment",
  ciTotal: (pct) => `Down payment (${pct})`,
  ciContado: "Full price",
  ciYaTienes: "You already have",
  ciYaTienesNota: "deposit, savings and cesantías",
  ciPendiente: "Still to pay",
  ciALaFirma: "At signing",
  ciPorMes: (m) => `Per month, for ${m}`,
  ciSobra: (ahorro, x) => `With your savings of ${ahorro} a month, you have ${x} to spare.`,
  ciFalta: (ahorro, x) => `With your savings of ${ahorro} a month, you're short ${x} each month.`,

  modalidad: "How you finance it",
  modalidadTitulo: {
    pesos: "Peso loan",
    uvr: "UVR loan",
    leasing: "Housing lease",
    contado: "Cash",
  },
  modalidadDetalle: {
    pesos: "Fixed payment in pesos",
    uvr: "The payment rises with inflation",
    leasing: "The bank buys; you pay a lease",
    contado: "No loan",
  },
  contadoNota:
    "Paying cash, you pay the full price without a loan: whatever you don't have today is spread over the construction months. You only pay the deed and registration of the sale.",
  grupoCredito: "The loan",
  pctFinanciado: "Share you finance",
  pctFinanciadoAyuda: (noVis, vis, leasing) =>
    `With a mortgage, up to ${noVis} (non-VIS) or ${vis} (VIS). With a housing lease, up to ${leasing} depending on the lender.`,
  sufijoAnios: "years",
  plazoAyuda: (min, max) => `By law, at least ${min} years. Lenders currently lend for up to ${max}.`,
  tasaRealUVR: "Real rate (on top of UVR)",
  sufijoUVR: "% + UVR",
  tasaUVRFalta: "Enter the rate the bank offers you (for example, UVR + 8%). We don't show an average because we haven't verified one.",
  tasaUVRAyuda: "A UVR payment rises every month with inflation; the real rate is what the bank charges on top.",
  inflacionSupuesta: "Assumed inflation",
  inflacionAyuda: (ipc) => `The latest annual inflation reported by DANE was ${ipc}.`,
  tasaLeasing: "Lease rate (effective annual)",
  tasa: "Interest rate (effective annual)",
  sufijoEA: "% EA",
  tasaAyuda: "It starts with an average of what banks disbursed. Change it to the rate you're offered.",
  tasaLeasingAyuda: "Each lender sets its own: it starts with the average for non-VIS peso loans. Change it to the rate you're offered.",
  opcionCompra: "Purchase option",
  opcionCompraAyuda: (x) => `What you pay at the end to keep the property: ${x}.`,
  entidadesTitulo: "Average rates by lender",
  entidadesLede: (mes) => `What each lender disbursed on average (${mes}). It's not the offer you'll get.`,
  colEntidad: "Lender",
  colTasa: "Rate (EA)",
  colCuota: "Your payment",
  usarTasa: "Use this rate",
  grupoSeguros: "Insurance",
  incluirSeguros: "Include loan insurance",
  segurosAyuda: (vida, incendio) =>
    `Borrower life insurance (${vida} a month on the balance) and fire and earthquake insurance (${incendio} a month on the property value).`,
  segurosResultado: (mes1, total) => `In the first month you pay ${mes1} in insurance; ${total} over the whole loan.`,
  grupoAbonos: "Extra payments",
  abonosLede: "With a home loan you can prepay without penalty and choose whether the payment or the term goes down (Law 546 of 1999, art. 17).",
  abonosLedeLeasing: "With a housing lease, each lender sets the terms for extra payments: check your contract.",
  abonoAnual: "Once-a-year extra payment",
  abonoAnualAyuda: "Your mid-year bonus (prima) or cesantías, for example.",
  abonoMensual: "Extra payment every month",
  abonoDesde: "Starting in month",
  sufijoMesCredito: "of the loan",
  abonoReduce: "What should go down?",
  reducePlazo: "The term",
  reduceCuota: "The payment",
  abonoResultadoPlazo: (tiempo, ahorro) => `You finish ${tiempo} earlier and save ${ahorro} in interest.`,
  abonoResultadoCuota: (cuota, ahorro) => `Your payment drops to ${cuota} and you save ${ahorro} in interest.`,
  estresTitulo: "What if conditions change?",
  estresTasa: "Rate + 2 points",
  estresInflacion: "Inflation + 2 points",
  estresResultado: (cuota, ingreso, intereses) =>
    `Your payment would change by ${cuota} a month, the income required by ${ingreso} and total interest by ${intereses}.`,

  gastosTitulo: "Deed and registration costs",
  gastosLede: "What you pay to sign and register the deed, on top of the price. 2026 rates from the Superintendence of Notaries and Registry.",
  gNotarialCompraventa: (pct) => `Notary fees for the sale (your share: ${pct})`,
  gRegistroCompraventa: "Registration of the sale",
  gImpuestoCompraventa: "Registration tax on the sale",
  gNotarialHipoteca: "Notary fees for the mortgage",
  gRegistroHipoteca: "Registration of the mortgage",
  gImpuestoHipoteca: "Registration tax on the mortgage",
  gEstudio: "Title study and appraisal",
  gEstudioAyuda: "The bank charges them and each sets its own: enter what you're quoted.",
  gTotal: "Total",
  gDelPrecio: (pct) => `${pct} of the price`,
  gNotaLeasing: "With a housing lease the bank buys the property: there's no mortgage, and each lender decides how these costs are split.",
  gNotaContado: "Paying cash there's no mortgage: only the sale.",
  gNotaVIS: "For VIS housing, notary and registration fees have special rates, already included.",
  gNotaReparto: "By custom, buyer and seller split the notary fees for the sale; the purchase agreement may say otherwise.",
  gNotaAvaluo: "If the cadastral value is higher than the price, registration is charged on the cadastral value.",

  rentaTitulo: "Mortgage interest deduction",
  rentaSinCredito: "Without a loan there's no interest to deduct.",
  tarifaMarginal: "Your marginal income tax rate",
  noSe: "Not sure",
  rentaIntereses: "First-year interest",
  rentaDeducible: "Deductible",
  rentaTope: (uvt, valor) => `cap: ${entero(uvt, "en")} UVT a year (${valor})`,
  rentaAhorro: "Estimated tax savings",
  rentaElige: "Choose your rate to estimate the savings.",
  rentaCondiciones: "Only if you live in the property and file income tax in Colombia.",
  rentaCondicionesLeasing:
    "With a housing lease, the financial component of the payment is deductible, only if you live in the property and file income tax in Colombia.",
  rentaTopeConjunto: (pct, uvt) =>
    `It counts toward the combined cap of ${pct} and ${entero(uvt, "en")} UVT together with your other deductions and exempt income.`,
  rentaEstimacion: "It's an estimate: check with your accountant.",
  subsidiosTitulo: "Government subsidies",
  miCasaYaNo: "Mi Casa Ya: not accepting new applications today.",
  miCasaYaSi: "Mi Casa Ya: accepting applications. Ask Rafael whether you qualify.",
  frechNo: "Interest-rate subsidy (FRECH): no slots open for 2026.",
  frechSi: "Interest-rate subsidy (FRECH): slots available. Ask Rafael whether you qualify.",
  exteriorTitulo: "If you live outside Colombia",
  vivoFuera: "I live outside Colombia",
  exteriorCondiciones: (noVis, vis, plazo, smmlv) =>
    `One lender's reference: it finances up to ${noVis} (non-VIS) or ${vis} (VIS), for up to ${plazo} years, with income from ${smmlv} Colombian monthly minimum wages.`,
  exteriorPaises: (lista) => `Countries where it's offered: ${lista}.`,
  moneda: "Currency of your income",
  ingresoExterior: (m) => `Monthly household income in ${m}`,
  tasaCambio: (m) => `Pesos per ${m}`,
  fuenteTRM: "Financial Superintendence: official exchange rate (TRM) of the day",
  tasaCambioEUR: "Enter how many pesos a euro is worth today.",
  usarComoIngreso: (x) => `Use ${x} as household income`,
  trmLede: "If the peso strengthens, your income in pesos falls and the payment weighs more:",
  colVariacion: "Exchange-rate change",
  colTasaCambio: "Exchange rate",
  colIngresoPesos: "Your income in pesos",
  colCuotaIngreso: "Payment / income",
  hoy: "Today",
  arrendarTitulo: "Rent or buy?",
  arrendarLede:
    "Compare what you pay each month and what each path really costs: interest, insurance and closing costs don't come back; the down payment and principal become equity.",
  arriendoActual: "Rent you pay today",
  administracion: "Monthly HOA fee (administración)",
  predialMensual: "Property tax, per month",
  incrementoArriendo: "Annual rent increase",
  valorizacion: "Annual appreciation",
  valorizacionAyuda: "Assumption: the property rises with inflation. Appreciation is not guaranteed.",
  comprarSupera: (n) => `With these assumptions, buying beats renting from year ${n}.`,
  arrendarSigue: (n) => `With these assumptions, renting is still cheaper after ${n} years.`,
  colSalidaComprar: "Buying, per month",
  colArriendo: "Renting, per month",
  colPatrimonio: "Your equity",
  arrendarNota: "It doesn't include what your down payment could earn if you don't buy, or rate changes. It's a comparison, not a recommendation.",

  rentaCortaSolo: (nombres) => `Short-term rental is only calculated for properties whose building rules allow it. In our portfolio: ${nombres}.`,
  rentaCortaTitulo: "Short-term rental",
  rentaCortaAviso: (fuente) =>
    `An estimate, not an income guarantee. Short-term rental depends on the building's rules (reglamento de propiedad horizontal) and the National Tourism Registry. That this property allows it: ${fuente}.`,
  tarifaNoche: "Nightly rate",
  tarifaNocheAyuda: (x) => `In pesos, at the TRM: ${x}.`,
  ocupacion: "Occupancy",
  comisionOperador: "Operator's fee",
  servicios: "Monthly utilities",
  dotacion: "Furnishing (one-time)",
  dotacionAyuda: "Furniture and equipment to rent it out. It adds to what you put in yourself.",
  nochesMes: "Nights booked per month",
  ingresoBruto: "Gross income per month",
  gastosOperacion: "Expenses per month",
  gastosOperacionNota: (pct) => `operator, tourism levy (${pct} of income), HOA fee, property tax, utilities and insurance`,
  flujoAntes: "Cash flow before the loan payment",
  flujoDespues: "Cash flow after the loan payment",
  ocupacionEquilibrio: "Break-even occupancy",
  ningunaOcupacion: "not even at 100%",
  rentabilidadBruta: "Gross annual yield",
  rentabilidadNeta: "Net annual yield",
  retornoCapital: "Return on your capital",
  retornoCapitalNota: "after the loan payment, on what you put in yourself",
  rentaTradicionalTitulo: "Long-term rental",
  rentaTradicionalAviso: "An estimate, not an income guarantee. The rent is your figure: ask Rafael about rents in the area.",
  canon: "Monthly rent",
  canonAyuda: "What a tenant would pay per month.",
  vacancia: (n) => `Assumption: ${n} ${n === 1 ? "month" : "months"} a year without a tenant.`,
  ingresoAnual: "Annual income",

  escenariosLede: "Save up to three scenarios and compare them side by side. We mark the best in each row.",
  maximoEscenarios: "You've saved three",
  guardarEscenario: "Save this scenario",
  concepto: "Item",
  quitarEscenario: (nombre) => `Remove ${nombre}`,
  filaComparada: {
    pagoObra: "Monthly payment during construction",
    cuota: "Loan payment",
    ingresoRequerido: "Income required",
    totalIntereses: "Total interest",
    gastosCierre: "Deed and registration",
    mesUltimoPago: "Last payment",
  },
  mejor: "best",

  accionesTitulo: "Take your simulation with you",
  accionesLede: "Save it, share it or ask Rafael to go over it with you. We only ask for your contact details to send you the plan or help with your loan.",
  enviarWhatsApp: "Send to Rafael on WhatsApp",
  copiarEnlace: "Copy link",
  enlaceCopiado: "Link copied",
  copiaManual: "Copy this link:",
  descargarPlan: "Download my plan as a PDF",
  quieroAyuda: "I want help with my loan",
  okPlan: "Done. The print window opened: choose “Save as PDF”. Rafael also received your simulation.",
  okAyuda: "Done. Rafael has your simulation and will contact you at the phone or email you gave us.",
  abrirOtraVez: "Open it again",
  formPlanTitulo: "Your plan as a PDF",
  formPlanLede:
    "Leave your name and contact details: we'll get your plan ready to save, and Rafael receives your simulation in case you want to go over it with him.",
  formAyudaTitulo: "Help with your loan",
  formAyudaLede: "Rafael reviews your simulation and tells you what you need to apply for the loan or lease.",
  cerrar: "Close",
  nombre: "Name",
  contacto: "Phone or email",
  contactoPlaceholder: "How should we contact you?",
  cuandoCompras: "When are you planning to buy?",
  cuando: {
    "0-3": "Within 3 months",
    "3-6": "In 3 to 6 months",
    "6-12": "In 6 to 12 months",
    "12+": "In more than a year",
  },
  tusIngresos: "Your income comes from",
  tipoIngreso: {
    empleado: "A job",
    independiente: "Self-employment",
    pensionado: "A pension",
    exterior: "Work outside Colombia",
  },
  // The same consent text as ContactForm (version 2026-09-18).
  autorizo: "I authorize ",
  tratar: " to process my personal data to contact me about this inquiry",
  conforme: ", in accordance with the",
  politica: "data processing policy",
  derechos: ". I can access, update, correct or delete my data by writing to ",
  faltaAutorizacion: "We need your consent to process your data before continuing.",
  enviando: "Sending…",
  prepararPlan: "Prepare my PDF",
  pedirAyuda: "Ask for help",
  falloTitulo: "Your message didn't go through.",
  falloTexto: "Send your simulation to Rafael on WhatsApp, or try again in a moment.",
  disclaimer:
    "We keep your inquiry so we can reply. We retain it for up to two years after our last contact, and delete it sooner if you ask us to.",
  waIntro: "Hi Rafael, I ran this simulation on rhfliving.com:",
  waCondiciones: (modalidad, pct, plazo) => `${modalidad} at ${pct} over ${plazo}`,
  waALaFirma: (x) => `At signing: ${x}`,
  waEnObra: (x, m) => `During construction: ${x} a month for ${m}`,
  waCuota: (x) => `Payment: ${x} a month`,
  waIngreso: (x) => `Income required: ${x}`,
  waCierre: "I'd like to go over it with you.",

  planTitulo: "Your purchase plan",
  planFecha: (fecha) => `Simulation of ${fecha} on rhfliving.com`,
  planInmueble: "The property",
  planComoPagas: "How you pay for it",
  planCredito: "The loan",
  montoFinanciado: "Amount financed",
  planTuIngreso: (ingreso, pct) => `with your income of ${ingreso}, the payment is ${pct}`,
  planFechas: "Key dates",
  planSupuestos: "What's assumed",
  planSupuestoTasa: (x) => `The rate (${x} EA) is a market average, not an offer.`,
  planSupuestoMeses: (m) => `Handover in ${m}: the project doesn't publish its date.`,
  planSupuestoImpuesto: (x) => `The registration tax (${x}): Bolívar's rate isn't verified.`,
  planSupuestoSeguros: "Insurance: one lender's rates; your bank's may differ.",
  planSupuestoInflacion: (x) => `Inflation for the UVR loan (${x} a year).`,
  planEnlace: "Reopen this simulation:",
  planContacto: (tel) => `Rafael Hernández Franco · RHF Living · WhatsApp ${tel} · rhfliving.com`,
};

export const TEXTOS = { es, en } satisfies Record<Idioma, Textos>;
