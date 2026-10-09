// Pruebas de lo que agregó el tablero (7-oct-2026): canales, horario hábil y
// SLA, calificación, conversaciones, montos, métricas y seguridad de las
// acciones de crm.js. Correr con tsx, porque algunas piezas importan los datos
// del sitio (@/data/…):
//   npx tsx --tsconfig crm/tsconfig.json --test crm/test/tablero.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { canalDe, limpiarAtribucion, grupoDe, nombreCanal } from "../src/canales.ts";
import { minutosHabiles, cuandoSeCumplen, estadoSla, enHorario, duracion } from "../src/horario.ts";
import {
  rangoDeTexto,
  presupuestoValido,
  formaPagoValida,
  objetivoValido,
  valorDeRango,
  respuestasDefinidas,
} from "../../src/data/calificacion.ts";
import { leerLote, referenciaDeMensaje } from "../src/conversaciones.ts";
import { montoPesos } from "../src/acciones.ts";
import { resumir, embudo, rangos, mediana, calificado, type Fila } from "../src/metricas.ts";
import { topeRedondo } from "../src/graficas.ts";
import { iniciales, pesosCortos } from "../src/paginas/comun.ts";
import { esAccionDeScript } from "../src/seguridad.ts";
import { columnasDeFase } from "../src/datos.ts";
import { nivelDe } from "../src/higiene.ts";
import { lunesDe, nombreSemana, horaCorta } from "../src/tiempo.ts";

test("el canal: anuncios de Meta, Google y YouTube, y lo orgánico", () => {
  const a = (x: Record<string, string>) => limpiarAtribucion(x);
  assert.equal(canalDe(a({ utm_source: "instagram", utm_medium: "paid" })), "meta_ads");
  assert.equal(canalDe(a({ utm_source: "facebook", utm_medium: "cpc", utm_campaign: "doral" })), "meta_ads");
  assert.equal(canalDe(a({ gclid: "abc123" })), "google_ads", "el clic de Google Ads basta");
  assert.equal(canalDe(a({ gclid: "abc123", utm_source: "youtube" })), "youtube_ads");
  assert.equal(canalDe(a({ utm_source: "youtube", utm_medium: "video" })), "youtube", "el enlace de la descripción del video es orgánico, como en GA4");
  assert.equal(canalDe(a({ utm_source: "youtube", utm_medium: "paid" })), "youtube_ads");
  assert.equal(canalDe(a({ utm_source: "youtube", utm_medium: "cpv" })), "youtube_ads");
  assert.equal(canalDe(a({ utm_source: "instagram", utm_medium: "bio" })), "redes", "Instagram sin pauta");
  assert.equal(canalDe(a({ fbclid: "IwAR0x" })), "redes", "fbclid sin UTM no prueba que sea anuncio");
  assert.equal(canalDe(a({ referente: "www.google.com" })), "buscadores");
  assert.equal(canalDe(a({ referente: "l.instagram.com" })), "redes");
  assert.equal(canalDe(a({ referente: "mail.google.com" })), "correo");
  assert.equal(canalDe(a({ utm_source: "gmb" })), "perfil_google");
  assert.equal(canalDe(a({ landing: "/proyectos/doral-west" })), "directo");
  assert.equal(canalDe(null), "sin_dato", "sin atribución no se adivina");
  assert.equal(canalDe(null, "agente:whatsapp_cloud"), "whatsapp_ia");
  assert.equal(canalDe(null, "agente:webchat"), "chat_ia");
  assert.equal(grupoDe("redes"), "organico");
  assert.equal(grupoDe("algo-raro"), "otros");
  assert.equal(nombreCanal(null), "Sin dato");
});

test("la atribución que llega del navegador se limpia", () => {
  const x = limpiarAtribucion({
    utm_source: "  instagram  ",
    utm_campaign: "x".repeat(500),
    gclid: "abc<script>",
    landing: "/proyectos/doral-west?utm_source=x#y",
    referente: "L.Instagram.com",
    t: "2026-10-07T10:00:00Z",
    otra: "no va",
  });
  assert.deepEqual(Object.keys(x ?? {}).sort(), ["landing", "referente", "t", "utm_campaign", "utm_source"]);
  assert.equal(x?.utm_source, "instagram");
  assert.equal(x?.utm_campaign?.length, 120);
  assert.equal(x?.landing, "/proyectos/doral-west");
  assert.equal(x?.referente, "l.instagram.com");
  assert.equal(limpiarAtribucion({ landing: "//otro.example/x" }), null, "una dirección de otro sitio no es una página de entrada");
  assert.equal(limpiarAtribucion("texto"), null);
  assert.equal(limpiarAtribucion([1, 2]), null);
});

test("minutos hábiles: lunes a sábado, de 8 a 18, hora de Colombia", () => {
  // Miércoles 7-oct-2026, 10:00 a. m. de Colombia = 15:00 UTC.
  const d = (iso: string) => new Date(iso);
  assert.equal(minutosHabiles(d("2026-10-07T15:00:00Z"), d("2026-10-07T15:12:00Z")), 12);
  // Llega a las 7:50 p. m.: el reloj arranca a las 8:00 a. m. del día siguiente.
  assert.equal(minutosHabiles(d("2026-10-08T00:50:00Z"), d("2026-10-08T13:10:00Z")), 10);
  // Sábado 5:55 p. m. → lunes 8:05 a. m.: 5 del sábado y 5 del lunes (el domingo no cuenta).
  assert.equal(minutosHabiles(d("2026-10-10T22:55:00Z"), d("2026-10-12T13:05:00Z")), 10);
  assert.equal(minutosHabiles(d("2026-10-07T15:00:00Z"), d("2026-10-07T14:00:00Z")), 0);
  assert.equal(cuandoSeCumplen(d("2026-10-10T22:55:00Z"), 15).toISOString(), "2026-10-12T13:10:00.000Z");
  assert.equal(cuandoSeCumplen(d("2026-10-07T15:00:00Z"), 15).toISOString(), "2026-10-07T15:15:00.000Z");
  assert.equal(enHorario(d("2026-10-11T15:00:00Z")), false, "domingo");
  assert.equal(enHorario(d("2026-10-07T12:59:00Z")), false, "7:59 a. m.");
  assert.equal(enHorario(d("2026-10-07T13:00:00Z")), true, "8:00 a. m.");
  assert.equal(estadoSla(9), "a_tiempo");
  assert.equal(estadoSla(10), "por_vencer");
  assert.equal(estadoSla(15), "vencido");
  assert.equal(duracion(75), "1 h 15 min");
});

test("las tres preguntas: solo códigos conocidos", () => {
  assert.equal(presupuestoValido("400_600"), "400_600");
  assert.equal(presupuestoValido("400 a 600"), null);
  assert.equal(formaPagoValida("credito"), "credito");
  assert.equal(formaPagoValida("<b>"), null);
  assert.equal(objetivoValido("renta_corta"), "renta_corta");
  assert.equal(objetivoValido(42), null);
  assert.equal(valorDeRango("400_600"), 500_000_000);
  assert.equal(valorDeRango("hasta_250"), 250_000_000);
  assert.equal(valorDeRango("mas_900"), 900_000_000);
  assert.equal(valorDeRango("no_se"), null);
  assert.equal(respuestasDefinidas({ presupuesto: "400_600", pago: "no_se", objetivo: "vivir" }), 2);
});

test("el rango que cuenta el agente se lleva al del formulario", () => {
  assert.equal(rangoDeTexto("400 a 500 millones"), "400_600");
  assert.equal(rangoDeTexto("Entre 200 y 300 millones"), "250_400");
  assert.equal(rangoDeTexto("1.200 millones"), "mas_900");
  assert.equal(rangoDeTexto("1,5 mil millones"), "mas_900");
  assert.equal(rangoDeTexto("USD 150k"), null, "en dólares no se adivina");
  assert.equal(rangoDeTexto("no sabe"), null);
  assert.equal(rangoDeTexto(null), null);
});

test("un lote de conversaciones: se normaliza y se filtra lo raro", () => {
  const r = leerLote({
    conversaciones: [
      {
        sesion: "20261007_101500_abcd1234",
        canal: "whatsapp",
        usuario: "573001234567@s.whatsapp.net",
        mensajes: [
          { id: 1, rol: "user", texto: "Hola", en: 1791374100 },
          { id: 2, rol: "assistant", texto: "¡Hola! ¿En qué te ayudo?", en: 1791374160.5 },
          { id: 3, rol: "tool", texto: "{}", en: 1791374161 },
          { id: 4, rol: "assistant", texto: "   ", en: 1791374162 },
        ],
      },
      { sesion: "con espacios no", canal: "webchat", mensajes: [] },
    ],
  });
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.conversaciones.length, 1);
  const k = r.conversaciones[0];
  assert.equal(k.telefono, "+573001234567");
  assert.equal(k.mensajes.length, 2, "sin la herramienta ni el mensaje vacío");
  assert.equal(k.mensajes[0].rol, "persona");
  assert.equal(k.mensajes[1].rol, "agente");
  assert.equal(k.mensajes[0].en, new Date(1791374100 * 1000).toISOString());
  assert.equal(k.primer, "Hola");
  assert.equal(leerLote({ conversaciones: "no" }).ok, false);
  assert.equal(leerLote({ conversaciones: Array.from({ length: 51 }, () => ({})) }).ok, false);
  assert.equal(referenciaDeMensaje("Quiere comprar.\nConversación: 20261007_101500_abcd1234\nIdioma: español"), "20261007_101500_abcd1234");
  assert.equal(referenciaDeMensaje("sin referencia"), null);
});

test("los montos en pesos escritos a mano", () => {
  assert.equal(montoPesos("450.000.000"), 450_000_000);
  assert.equal(montoPesos("$450.000.000"), 450_000_000);
  assert.equal(montoPesos("450 millones"), 450_000_000);
  assert.equal(montoPesos("1,2 mil millones"), 1_200_000_000);
  assert.equal(montoPesos("450M"), 450_000_000);
  assert.equal(montoPesos("cuatrocientos"), null);
  assert.equal(montoPesos("12"), null, "doce pesos no es un valor de un inmueble");
});

const fila = (x: Partial<Fila>): Fila => ({
  id: 1,
  tipo: "compra",
  creado_en: "2026-09-29T15:00:00.000Z",
  canal: "meta_ads",
  etapa: "nuevo",
  cerrada: 0,
  puntaje: "sin",
  rango_presupuesto: null,
  pago: null,
  proposito: null,
  valor_estimado: null,
  interes: null,
  primer_intento_en: null,
  minutos_respuesta: null,
  espera_desde: null,
  fase_contactado_en: null,
  fase_presentacion_en: null,
  fase_cotizacion_en: null,
  fase_cierre_en: null,
  ...x,
});

test("las 5 métricas del lunes, sobre datos conocidos", () => {
  // Miércoles 7-oct-2026: la semana pasada va del lunes 28-sep al domingo 4-oct.
  const { actual, anterior } = rangos("pasada", new Date("2026-10-07T15:00:00Z"));
  assert.equal(actual.desde, "2026-09-28");
  assert.equal(actual.hasta, "2026-10-05");
  assert.equal(anterior.desde, "2026-09-21");
  const filas = [
    fila({ id: 1, minutos_respuesta: 4, rango_presupuesto: "400_600", pago: "credito", fase_contactado_en: "2026-09-29T16:00:00.000Z", fase_presentacion_en: "2026-10-02T15:00:00.000Z", valor_estimado: 480_000_000 }),
    fila({ id: 2, minutos_respuesta: 30, rango_presupuesto: "no_se", pago: "credito" }),
    fila({ id: 3, canal: "redes", minutos_respuesta: 10 }),
    fila({ id: 4, canal: "google_ads", espera_desde: "2026-10-03T15:00:00.000Z", creado_en: "2026-10-03T15:00:00.000Z" }),
    fila({ id: 5, creado_en: "2026-09-22T15:00:00.000Z" }),
  ];
  const inversion = [
    { semana: "2026-09-28", canal: "meta_ads", monto: 1_000_000 },
    { semana: "2026-09-28", canal: "google_ads", monto: 500_000 },
    { semana: "2026-09-21", canal: "meta_ads", monto: 800_000 },
  ];
  const r = resumir(filas, inversion, actual);
  assert.equal(r.leads, 4);
  assert.equal(r.leadsAnuncios, 3);
  assert.equal(r.calificadosAnuncios, 1, "solo el que tiene presupuesto y forma de pago definidos");
  assert.equal(r.respuestaMediana, 10);
  assert.equal(r.dentroSla, 2);
  assert.equal(r.sinRespuesta, 1);
  assert.equal(r.presentaciones, 1);
  assert.equal(r.inversionAnuncios, 1_500_000);
  assert.equal(r.costoLeadCalificado, 1_500_000);
  assert.equal(r.pipeline, 480_000_000);
  assert.deepEqual(embudo(filas, actual), [4, 1, 1, 0, 0]);
  assert.equal(resumir(filas, inversion, anterior).leads, 1);
  assert.equal(mediana([5, 1, 3]), 3);
  assert.equal(mediana([]), null);
  assert.equal(calificado(fila({ puntaje: "B" })), true);
});

test("las fases del embudo y la higiene", () => {
  assert.deepEqual(columnasDeFase("compra", "recorrido_hecho"), ["fase_contactado_en", "fase_presentacion_en"]);
  assert.deepEqual(columnasDeFase("compra", "separo"), ["fase_contactado_en", "fase_presentacion_en", "fase_cotizacion_en", "fase_cierre_en"]);
  assert.deepEqual(columnasDeFase("compra", "nutrir"), [], "Nutrir no avanza ni retrocede fases");
  assert.deepEqual(columnasDeFase("venta", "consignado"), ["fase_contactado_en", "fase_presentacion_en", "fase_cotizacion_en"]);
  const ahora = new Date("2026-10-31T15:00:00Z");
  assert.equal(nivelDe("2026-10-28T15:00:00Z", ahora), 0);
  assert.equal(nivelDe("2026-10-24T15:00:00Z", ahora), 7);
  assert.equal(nivelDe("2026-10-16T15:00:00Z", ahora), 15);
  assert.equal(nivelDe("2026-09-30T15:00:00Z", ahora), 30);
});

test("las acciones de crm.js: fetch del mismo origen con X-CRM, nada más", () => {
  const con = (h: Record<string, string>, metodo = "POST") => new Request("https://rhfliving.com/x", { method: metodo, headers: h });
  const bien = { "X-CRM": "1", "Sec-Fetch-Site": "same-origin", "Sec-Fetch-Mode": "cors", "Sec-Fetch-Dest": "empty" };
  assert.equal(esAccionDeScript(con(bien)), true);
  assert.equal(esAccionDeScript(con({ ...bien, "X-CRM": "0" })), false);
  assert.equal(esAccionDeScript(con({ "Sec-Fetch-Site": "same-origin", "Sec-Fetch-Mode": "cors" })), false, "sin la cabecera");
  assert.equal(esAccionDeScript(con({ ...bien, "Sec-Fetch-Site": "cross-site" })), false);
  assert.equal(esAccionDeScript(con({ ...bien, "Sec-Fetch-Mode": "navigate", "Sec-Fetch-Dest": "document" })), false);
  assert.equal(esAccionDeScript(con(bien, "GET")), false, "las lecturas siguen cerradas");
  assert.equal(esAccionDeScript(con({ "X-CRM": "1" })), true, "un navegador viejo sin Fetch Metadata");
});

test("piezas de la vista", () => {
  assert.equal(iniciales("Laura Pineda (demo)"), "LP");
  assert.equal(iniciales("<script>alert(1)</script>"), "SS");
  assert.equal(iniciales(""), "?");
  assert.equal(topeRedondo(7), 8);
  assert.equal(topeRedondo(12), 12);
  assert.equal(topeRedondo(13), 16);
  assert.equal(topeRedondo(140) % 2, 0);
  assert.equal(pesosCortos(2_460_000), "$2,5 M");
  assert.equal(pesosCortos(680_000_000), "$680 M");
  assert.equal(lunesDe("2026-10-07"), "2026-10-05");
  assert.equal(lunesDe("2026-10-05"), "2026-10-05");
  assert.equal(lunesDe("2026-10-04"), "2026-09-28");
  assert.equal(nombreSemana("2026-09-28"), "28 sep al 4 oct");
  assert.equal(horaCorta("2026-10-07T17:05:00Z"), "12:05 p. m.");
});
