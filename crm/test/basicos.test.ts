// Pruebas de las funciones puras del CRM. Correr con:
//   node --test "crm/test/*.test.ts"                              (Node 23.6 o más nuevo)
//   node --experimental-strip-types --test "crm/test/*.test.ts"   (Node 22)
import { test } from "node:test";
import assert from "node:assert/strict";
import { telefonoE164, correoNormal, separarContacto, enlaceWhatsApp } from "../src/telefono.ts";
import { fuenteDeOrigen } from "../src/fuentes.ts";
import { html, crudo, esc } from "../src/html.ts";
import { hoy, sumarDias, fechaValida, fechaHoraValida, hace, fechaLocal } from "../src/tiempo.ts";
import { huellaDe, claveCorrecta, huellaValida } from "../src/clave.ts";
import { rutaCRM, esNavegacion, csrfDe } from "../src/seguridad.ts";

test("la clave se verifica contra su huella, y nada más", async () => {
  const huella = await huellaDe("Mi clave del CRM, con tilde", 10_000);
  assert.match(huella, /^pbkdf2-sha256\$10000\$[A-Za-z0-9_-]{22}\$[A-Za-z0-9_-]{43}$/);
  assert.equal(await claveCorrecta("Mi clave del CRM, con tilde", huella), true);
  // La misma tilde escrita como dos caracteres (NFD) también entra.
  assert.equal(await claveCorrecta("Mi clave del CRM, con tilde".normalize("NFD"), huella), true);
  assert.equal(await claveCorrecta("mi clave del crm, con tilde", huella), false);
  assert.equal(await claveCorrecta("", huella), false);
  assert.equal(await claveCorrecta("Mi clave del CRM, con tilde", undefined), false);
  assert.equal(huellaValida(huella), true);
  assert.equal(huellaValida("pbkdf2-sha256$500$abc$def"), false);
  assert.equal(huellaValida("sha1$10000$x$y"), false);
  assert.equal(huellaValida(undefined), false);
});

test("la ruta secreta: «/r/» y de 16 a 64 caracteres seguros", () => {
  assert.equal(rutaCRM({ CRM_RUTA: "/r/k3m9v2q8x7w4t6n5" }), "/r/k3m9v2q8x7w4t6n5");
  assert.equal(rutaCRM({ CRM_RUTA: " /r/k3m9v2q8x7w4t6n5 " }), "/r/k3m9v2q8x7w4t6n5");
  assert.equal(rutaCRM({ CRM_RUTA: "/k3m9v2q8x7w4t6n5" }), null, "sin /r/, el sitio no la deja llegar al Worker");
  assert.equal(rutaCRM({ CRM_RUTA: "/r/corta" }), null);
  assert.equal(rutaCRM({ CRM_RUTA: "/r/con/barra-1234567890" }), null);
  assert.equal(rutaCRM({ CRM_RUTA: "r/sin-barra-1234567890" }), null);
  assert.equal(rutaCRM({}), null);
});

test("solo las navegaciones reciben páginas (Fetch Metadata)", () => {
  const con = (h: Record<string, string>) => new Request("https://rhfliving.com/x", { headers: h });
  assert.equal(esNavegacion(con({ "Sec-Fetch-Mode": "navigate", "Sec-Fetch-Dest": "document" })), true);
  assert.equal(esNavegacion(con({})), true, "un navegador viejo, sin las cabeceras");
  assert.equal(esNavegacion(con({ "Sec-Fetch-Mode": "cors", "Sec-Fetch-Dest": "empty" })), false, "fetch()");
  assert.equal(esNavegacion(con({ "Sec-Fetch-Mode": "same-origin", "Sec-Fetch-Dest": "empty" })), false);
  assert.equal(esNavegacion(con({ "Sec-Fetch-Mode": "navigate", "Sec-Fetch-Dest": "iframe" })), false, "iframe");
});

test("el token anti-CSRF sale del token de la sesión", async () => {
  const a = await csrfDe("A".repeat(43));
  assert.match(a, /^[0-9a-f]{32}$/);
  assert.equal(a, await csrfDe("A".repeat(43)));
  assert.notEqual(a, await csrfDe("B".repeat(43)));
});

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
