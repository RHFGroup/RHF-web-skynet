/**
 * Alta manual: Instagram, Facebook, ferias, referidos y llamadas (Prompt 3,
 * §2.2 y §2.7). Sin autorización no se guarda.
 */
import { html, type Html } from "../html";
import type { Ctx } from "../base";
import { CANALES_AUTORIZACION, CATALOGO, FUENTES, FUENTES_MANUALES, type Tipo } from "../datos";
import { hoy } from "../tiempo";
import { RANGOS_PRESUPUESTO, FORMAS_PAGO, OBJETIVOS } from "@/data/calificacion";
import { pagina, selector, campo, areaTexto } from "./comun";

export type DatosAlta = Partial<Record<string, string>>;

export function paginaAlta(c: Ctx, vistaPrevia: boolean, opciones?: { error?: string; datos?: DatosAlta }): Html {
  // Desde «Chats», «Crear ficha» llega con el teléfono y la fuente.
  const q = c.url.searchParams;
  const d: DatosAlta = opciones?.datos ?? {
    telefono: (q.get("telefono") ?? "").slice(0, 30),
    fuente: FUENTES_MANUALES.includes(q.get("fuente") ?? "") ? (q.get("fuente") as string) : "",
  };
  const tipo = (d.tipo ?? q.get("tipo")) === "venta" ? "venta" : "compra";
  const cuerpo = html`<h1 class="titulo">Nuevo lead</h1>
<p class="bajada">Para quien llegó por fuera del sitio: Instagram, Facebook, una feria, un referido o una llamada.</p>
${opciones?.error ? html`<p class="error" role="alert">${opciones.error}</p>` : ""}
<form method="post" action="/nuevo" class="tarjeta rejilla">
  <h2><span class="paso">1</span> Quién es</h2>
  ${selector("tipo", "Qué quiere", [
    { valor: "compra", texto: "Comprar o invertir" },
    { valor: "venta", texto: "Vender o consignar su inmueble" },
  ], tipo)}
  ${campo("nombre", "Nombre", d.nombre, { requerido: true, max: 120, autocomplete: "off" })}
  ${campo("telefono", "Teléfono (con indicativo si no es de Colombia)", d.telefono, { tipo: "tel", max: 30, autocomplete: "off", ayuda: "Hace falta el teléfono o el correo." })}
  ${campo("correo", "Correo", d.correo, { tipo: "email", max: 160, autocomplete: "off" })}
  ${campo("ciudad", "Ciudad", d.ciudad, { max: 80 })}
  ${campo("pais", "País", d.pais, { max: 80 })}
  ${selector("idioma", "Idioma", [{ valor: "es", texto: "Español" }, { valor: "en", texto: "Inglés" }], d.idioma ?? "es")}
  ${selector("fuente", "De dónde llegó", FUENTES_MANUALES.map((f) => ({ valor: f, texto: FUENTES[f] })), d.fuente, { requerido: true, vacio: "Elige una" })}
  ${selector("interes", "Proyecto o inmueble", CATALOGO.map((x) => ({ valor: x.slug, texto: x.nombre })), d.interes, { vacio: "—" })}
  ${areaTexto("texto", "Qué busca o qué conversaron (opcional)", d.texto, { max: 2000 })}

  <h2><span class="paso">2</span> Si compra: las tres preguntas</h2>
  <p class="nota">Si ya las sabes. Si no, déjalas en blanco y pregúntalas en la primera llamada.</p>
  ${selector("rango_presupuesto", "Presupuesto", RANGOS_PRESUPUESTO.map((x) => ({ valor: x.codigo, texto: x.es })), d.rango_presupuesto, { vacio: "—" })}
  ${selector("pago", "Forma de pago", FORMAS_PAGO.map((x) => ({ valor: x.codigo, texto: x.es })), d.pago, { vacio: "—" })}
  ${selector("objetivo", "Para qué compra", OBJETIVOS.map((x) => ({ valor: x.codigo, texto: x.es })), d.objetivo, { vacio: "—" })}

  <h2><span class="paso">3</span> Su autorización de datos</h2>
  <p class="nota">Ley 1581: sin autorización no se guarda. Anota cómo la dio y dónde quedó la prueba.</p>
  ${selector("autorizacion_canal", "Cómo la dio", Object.entries(CANALES_AUTORIZACION).map(([valor, texto]) => ({ valor, texto })), d.autorizacion_canal, { requerido: true, vacio: "Elige una" })}
  ${campo("autorizacion_fecha", "Cuándo", d.autorizacion_fecha ?? hoy(), { tipo: "date", requerido: true })}
  ${areaTexto("autorizacion_evidencia", "Dónde quedó la prueba", d.autorizacion_evidencia, { requerido: true, max: 500 })}
  <label class="casilla" for="autoriza"><input id="autoriza" name="autoriza" type="checkbox" value="si" required>
  <span>Confirmo que esta persona autorizó el tratamiento de sus datos para que la contacte.</span></label>

  <div class="acciones"><button class="boton" type="submit">Guardar lead</button></div>
</form>`;
  return pagina({ titulo: "Nuevo lead", seccion: tipo as Tipo, cuerpo, url: c.url, vistaPrevia });
}
