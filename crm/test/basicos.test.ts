// Pruebas de las funciones puras del CRM. Correr con:
//   node --test "crm/test/*.test.ts"                              (Node 23.6 o más nuevo)
//   node --experimental-strip-types --test "crm/test/*.test.ts"   (Node 22)
import { test } from "node:test";
import assert from "node:assert/strict";
import { telefonoE164, correoNormal, separarContacto, enlaceWhatsApp } from "../src/telefono.ts";
import { fuenteDeOrigen } from "../src/fuentes.ts";
import { html, crudo, esc } from "../src/html.ts";
import { hoy, sumarDias, fechaValida, fechaHoraValida, hace, fechaLocal } from "../src/tiempo.ts";

test("el mismo celular colombiano escrito de cuatro formas da el mismo E.164", () => {
  for (const t of ["300 123 4567", "3001234567", "+57 300 1234567", "573001234567", "(300) 123-4567"]) {
    assert.equal(telefonoE164(t), "+573001234567", t);
  }
});

test("fijos nuevos de Colombia y números de otros países", () => {
  assert.equal(telefonoE164("605 693 0000"), "+576056930000");
  assert.equal(telefonoE164("+1 (305) 555-0004"), "+13055550004");
  assert.equal(telefonoE164("0034 612 345 678"), "+34612345678");
  assert.equal(telefonoE164("13055550004"), "+13055550004");
});

test("lo que no se puede ubicar queda sin E.164", () => {
  assert.equal(telefonoE164("123"), null);
  assert.equal(telefonoE164("6930000"), null);
  assert.equal(telefonoE164("ana@example.com"), null);
  assert.equal(telefonoE164(""), null);
});

test("el correo va en minúsculas y sin espacios", () => {
  assert.equal(correoNormal("  Ana@Example.COM "), "ana@example.com");
  assert.equal(correoNormal("no es un correo"), null);
});

test("el campo «contacto» de una consulta se separa en teléfono o correo", () => {
  assert.deepEqual(separarContacto("Ana@Example.com"), { telefono: null, correo: "ana@example.com", crudo: null });
  assert.deepEqual(separarContacto("300 123 4567"), { telefono: "+573001234567", correo: null, crudo: null });
  assert.deepEqual(separarContacto("Llamar en la tarde"), { telefono: null, correo: null, crudo: "Llamar en la tarde" });
});

test("el enlace de WhatsApp", () => {
  assert.equal(enlaceWhatsApp("+573001234567"), "https://wa.me/573001234567");
  assert.equal(enlaceWhatsApp("+573001234567", "Hola Ana"), "https://wa.me/573001234567?text=Hola%20Ana");
  assert.equal(enlaceWhatsApp(null), null);
});

test("la fuente sale del origen de la consulta", () => {
  assert.equal(fuenteDeOrigen("/"), "formulario");
  assert.equal(fuenteDeOrigen("/proyectos/doral-west"), "formulario");
  assert.equal(fuenteDeOrigen("/vender"), "vender");
  assert.equal(fuenteDeOrigen("/en/sell"), "vender");
  assert.equal(fuenteDeOrigen("guia-compra"), "guia");
  assert.equal(fuenteDeOrigen("/simulador"), "simulador");
  assert.equal(fuenteDeOrigen("/en/mortgage-calculator"), "simulador");
  assert.equal(fuenteDeOrigen("agente:whatsapp_cloud"), "whatsapp");
  assert.equal(fuenteDeOrigen("agente:webchat"), "chat");
  assert.equal(fuenteDeOrigen("agente:api_server"), "agente");
  assert.equal(fuenteDeOrigen(null), "formulario");
});

test("lo que escribe un lead se escapa siempre", () => {
  const nombre = `<script>alert("x")</script> & 'yo'`;
  assert.equal(html`<b>${nombre}</b>`.valor, "<b>&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#39;yo&#39;</b>");
  assert.equal(html`<i>${html`<b>${"<x>"}</b>`}</i>`.valor, "<i><b>&lt;x&gt;</b></i>");
  assert.equal(html`${crudo("<br>")}`.valor, "<br>");
  assert.equal(html`${[1, "<2>"]}`.valor, "1&lt;2&gt;");
  assert.equal(html`${null}${undefined}${false}`.valor, "");
  assert.equal(esc(`"'<>&`), "&quot;&#39;&lt;&gt;&amp;");
});

test("las fechas en hora de Colombia", () => {
  // 1-oct-2026 a las 03:00 UTC todavía es 30-sep en Colombia (UTC−5).
  assert.equal(hoy(new Date("2026-10-01T03:00:00Z")), "2026-09-30");
  assert.equal(hoy(new Date("2026-10-01T05:00:00Z")), "2026-10-01");
  assert.equal(sumarDias("2026-09-30", 1), "2026-10-01");
  assert.equal(sumarDias("2026-12-31", 1), "2027-01-01");
  assert.equal(fechaValida("2026-02-30"), null);
  assert.equal(fechaValida("2026-10-01"), "2026-10-01");
  assert.equal(fechaHoraValida("2026-10-03T10:00"), "2026-10-03T10:00");
  assert.equal(fechaHoraValida("2026-10-03T25:00"), null);
  assert.equal(fechaLocal("2026-10-03T10:00"), "sáb 3 oct, 10:00");
  assert.equal(hace("2026-10-01T10:00:00Z", new Date("2026-10-01T10:30:00Z")), "hace 30 min");
  assert.equal(hace("2026-09-29T10:00:00Z", new Date("2026-10-01T10:30:00Z")), "hace 2 días");
});
