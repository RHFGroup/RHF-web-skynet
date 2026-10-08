"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { enlaceWhatsApp, RESPONSABLE, CORREO } from "@/data/contacto";
import { PROYECTOS } from "@/data/proyectos";
import { INMUEBLES } from "@/data/inmuebles";
import { ruta, type Idioma } from "@/i18n/idioma";

/**
 * Formulario de contacto.
 *
 * Historia corta, porque explica el diseño:
 *
 *  1. Al principio `onSubmit` hacía `preventDefault()` y nada más. Quien
 *     llenaba el formulario perdía su dato sin que nadie se enterara.
 *  2. Después abrió WhatsApp con el mensaje escrito. El dato llegaba a donde
 *     Rafael atiende, sin servidor de por medio.
 *  3. Desde el 18-sep-2026 además lo guarda (POST /api/consulta → D1).
 *  4. **Desde el 19-sep-2026 ya NO abre WhatsApp: confirma en la página.**
 *
 * El paso 4 lo pidió Rafael, y tenía razón en el diagnóstico: mandar a
 * alguien a WhatsApp después de llenar un formulario es confuso — llena los
 * campos, y en vez de una confirmación le toca **volver a enviar el mismo
 * mensaje en otra app**. Quien no completa ese segundo envío se va creyendo
 * que escribió, y nadie recibe nada.
 *
 * **Lo que el cambio exige, y por lo que no se puede hacer solo.** Abrir
 * WhatsApp era, sin que se notara, el único aviso que existía: Rafael se
 * enteraba porque le llegaba el mensaje. Al quitarlo, la consulta queda en
 * una base que nadie consulta. Por eso este cambio viaja junto al aviso por
 * Telegram del Worker: **confirmar en la página sin avisar a alguien es
 * perder el lead con mejor experiencia de usuario.**
 *
 * De ahí el diseño de abajo, que invierte el del paso 3:
 *
 *  · El `fetch` ahora se **espera** (`await`), porque la confirmación tiene
 *    que ser verdad. Antes salía sin esperar para no perder el gesto del
 *    clic que abría el pop-up; sin pop-up, esa restricción desapareció.
 *  · Si el envío falla, se dice, y se ofrece WhatsApp como salida. Nunca se
 *    muestra «enviado» sobre algo que no se guardó.
 *  · WhatsApp sigue disponible en la confirmación, como opción de quien
 *    prefiere chatear — ya no como único camino.
 *
 * La casilla de autorización es obligatoria: sin ella no se envía ni se
 * guarda, que es lo que la Ley 1581 de 2012 exige (previa, expresa e
 * informada). `AVISO_VERSION` viaja con cada envío para poder demostrar
 * después CUÁL texto aceptó cada persona.
 *
 * En inglés (29-sep-2026) cambian los textos, no lo que se envía: los nombres
 * de los campos, las claves (`tipo`, el tipo de inmueble, el proyecto elegido)
 * y los rótulos que el formulario arma para Rafael («Ubicación del inmueble:»,
 * «Consignación ·») viajan en español desde cualquier idioma, y la analítica
 * recibe los mismos eventos. El `origen` es la ruta de la página: una consulta
 * hecha en /en llega con /en/…, y Rafael sabe en qué idioma responder.
 */

/** Versión del texto de autorización de abajo. Cambiarla al cambiar el texto. */
export const AVISO_VERSION = "2026-09-18";

/** La del formulario de /vender, cuyo texto de autorización nombra el inmueble. */
export const AVISO_VERSION_CONSIGNAR = "2026-09-29-consignar";

/**
 * Los tipos de inmueble que se pueden consignar, para el selector de /vender.
 * Son claves: viajan en español al Worker y a la analítica desde cualquier
 * idioma; la persona ve el nombre de `TEXTOS`.
 */
const TIPOS_INMUEBLE = ["Apartamento", "Casa", "Lote", "Local comercial", "Otro"];

/** El valor de «Otro» en el selector de proyecto: también es una clave. */
const OTRO_PROYECTO = "Otro / No estoy seguro";

/**
 * Los textos, en los dos idiomas (docs/i18n.md). Cada uno es un nodo de texto
 * tal como queda en el HTML, con sus espacios de borde: así el español sale
 * idéntico. Los `wa…` arman el mensaje de WhatsApp, que escribe la persona y
 * va en su idioma.
 */
const TEXTOS = {
  es: {
    tipos: {
      Apartamento: "Apartamento",
      Casa: "Casa",
      Lote: "Lote",
      "Local comercial": "Local comercial",
      Otro: "Otro",
    } as Record<string, string>,
    conArticulo: {
      Apartamento: "un apartamento",
      Casa: "una casa",
      Lote: "un lote",
      "Local comercial": "un local comercial",
      Otro: "un inmueble",
    } as Record<string, string>,
    unInmueble: "un inmueble",
    waConsignar: "Hola, quiero consignar mi propiedad...",
    waSoy: (nombre: string) => `Soy ${nombre}.`,
    waEs: (inmueble: string, ubicacion: string) => `Es ${inmueble}${ubicacion ? ` en ${ubicacion}` : ""}.`,
    waHola: (nombre: string) => `Hola Rafael, soy ${nombre}.`,
    waMeInteresa: (proyecto: string) => `Me interesa ${proyecto}.`,
    waAsesoria: "Me interesa tu asesoría inmobiliaria.",
    waContacto: (contacto: string) => `Me contactas en: ${contacto}`,
    waAutorizo: "Autorizo el tratamiento de mis datos según la política publicada en rhfliving.com/privacidad.",
    faltaAutorizacion: "Necesitamos tu autorización para tratar tus datos antes de continuar.",
    enviado: "Mensaje enviado",
    gracias: "Gracias",
    okConsignar:
      "Los datos de tu inmueble ya nos llegaron. Rafael te escribe al contacto que nos dejaste para agendar la llamada.",
    okConsulta: "Tu consulta ya nos llegó y te escribimos al contacto que nos dejaste.",
    prefieroWhatsApp: "Prefiero escribir por WhatsApp",
    tituloConsignar: "Cuéntanos de tu inmueble",
    tituloContacto: "Déjanos tus datos",
    nombre: "Nombre",
    nombrePlaceholder: "Tu nombre completo",
    contacto: "Teléfono o email",
    contactoPlaceholder: "¿Cómo te contactamos?",
    ubicacion: "Ubicación del inmueble",
    ubicacionPlaceholder: "Barrio o conjunto, y ciudad",
    tipoInmueble: "Tipo de inmueble",
    tipoPlaceholder: "Selecciona el tipo",
    proyecto: "Proyecto de interés",
    proyectoPlaceholder: "Selecciona un proyecto",
    grupoProyectos: "Proyectos de la cartera",
    grupoInmuebles: "Inmuebles disponibles",
    otro: "Otro / No estoy seguro",
    mensaje: "Mensaje",
    mensajePlaceholderConsignar: "Área aproximada, estado, lo que quieras contarnos (opcional)",
    mensajePlaceholder: "Cuéntanos qué buscas...",
    autorizo: "Autorizo a ",
    tratar: " a tratar mis datos personales para contactarme sobre ",
    sobreConsignar: "la venta o consignación de mi inmueble",
    sobreConsulta: "esta consulta",
    conforme: ", conforme a la",
    politica: "política de tratamiento de datos",
    derechos: ". Puedo conocer, actualizar, rectificar o suprimir mis datos escribiendo a ",
    enviando: "Enviando…",
    llamame: "Quiero que Rafael me llame",
    enviar: "Enviar mensaje",
    falloTitulo: "El envío falló.",
    falloTexto:
      " Tu mensaje ya está escrito y listo para mandarlo por WhatsApp, o vuelve a intentarlo en un momento.",
    escribirWhatsApp: "Escribir por WhatsApp",
    disclaimer:
      "Guardamos tu consulta para responderte. La conservamos hasta dos años desde nuestro último contacto, y la borramos antes si nos lo pides.",
  },
  en: {
    tipos: {
      Apartamento: "Apartment",
      Casa: "House",
      Lote: "Lot",
      "Local comercial": "Commercial space",
      Otro: "Other",
    } as Record<string, string>,
    conArticulo: {
      Apartamento: "an apartment",
      Casa: "a house",
      Lote: "a lot",
      "Local comercial": "a commercial space",
      Otro: "a property",
    } as Record<string, string>,
    unInmueble: "a property",
    waConsignar: "Hi, I'd like to list my property...",
    waSoy: (nombre: string) => `I'm ${nombre}.`,
    waEs: (inmueble: string, ubicacion: string) => `It's ${inmueble}${ubicacion ? ` in ${ubicacion}` : ""}.`,
    waHola: (nombre: string) => `Hi Rafael, I'm ${nombre}.`,
    waMeInteresa: (proyecto: string) => `I'm interested in ${proyecto}.`,
    waAsesoria: "I'm interested in your real estate advisory services.",
    waContacto: (contacto: string) => `You can reach me at: ${contacto}`,
    waAutorizo: "I authorize the processing of my data under the policy published at rhfliving.com/en/privacy.",
    faltaAutorizacion: "We need your consent to process your data before continuing.",
    enviado: "Message sent",
    gracias: "Thank you",
    okConsignar:
      "We've received your property details. Rafael will contact you at the phone or email you gave us to schedule the call.",
    okConsulta: "We've received your inquiry and we'll get back to you at the phone or email you gave us.",
    prefieroWhatsApp: "I'd rather message on WhatsApp",
    tituloConsignar: "Tell us about your property",
    tituloContacto: "Leave us your details",
    nombre: "Name",
    nombrePlaceholder: "Your full name",
    contacto: "Phone or email",
    contactoPlaceholder: "How should we contact you?",
    ubicacion: "Property location",
    ubicacionPlaceholder: "Neighborhood or complex, and city",
    tipoInmueble: "Property type",
    tipoPlaceholder: "Select the type",
    proyecto: "Project of interest",
    proyectoPlaceholder: "Select a project",
    grupoProyectos: "Portfolio projects",
    grupoInmuebles: "Available properties",
    otro: "Other / Not sure",
    mensaje: "Message",
    mensajePlaceholderConsignar: "Approximate area, condition, anything you'd like to tell us (optional)",
    mensajePlaceholder: "Tell us what you're looking for...",
    autorizo: "I authorize ",
    tratar: " to process my personal data to contact me about ",
    sobreConsignar: "the sale or listing of my property",
    sobreConsulta: "this inquiry",
    conforme: ", in accordance with the",
    politica: "data processing policy",
    derechos: ". I can access, update, correct or delete my data by writing to ",
    enviando: "Sending…",
    llamame: "I'd like Rafael to call me",
    enviar: "Send message",
    falloTitulo: "Your message didn't go through.",
    falloTexto: " It's already written and ready to send on WhatsApp, or you can try again in a moment.",
    escribirWhatsApp: "Message on WhatsApp",
    disclaimer:
      "We keep your inquiry so we can reply. We retain it for up to two years after our last contact, and delete it sooner if you ask us to.",
  },
} satisfies Record<Idioma, Record<string, unknown>>;

/** Empuja un evento a la capa de datos de la analítica (src/components/Analitica.tsx). */
function registrarEvento(datos: Record<string, unknown>) {
  const w = window as unknown as { dataLayer?: unknown[] };
  (w.dataLayer ||= []).push(datos);
}

/**
 * Turnstile — la verificación antibot de Cloudflare.
 *
 * La site key es pública a propósito: viaja en el HTML de la página. La que
 * no puede salir del servidor es la secreta, que vive como secret del Worker
 * (`TURNSTILE_SECRET`) y valida el token contra `siteverify`.
 *
 * `appearance="interaction-only"`: el widget aparece SOLO si Cloudflare
 * necesita que la persona haga algo. Para la gran mayoría es invisible, que
 * es lo que corresponde a una página que se ve así.
 *
 * Si el script no carga —bloqueador, red mala— no hay token y el Worker
 * rechaza el guardado. El formulario lo dice y ofrece WhatsApp, que es la
 * salida para todos los fallos: nadie se queda sin poder escribir.
 *
 * Desde el 29-sep-2026 la verificación es obligatoria: si al Worker le falta
 * `TURNSTILE_SECRET`, responde 503 y no guarda nada. El secreto se carga en
 * Cloudflare → Workers & Pages → rhf-web-skynet → Variables and Secrets.
 */
export const TURNSTILE_SITE_KEY = "0x4AAAAAAE8W_1D4uDCgIB5S";

declare global {
  interface Window {
    turnstile?: { reset: (contenedor?: HTMLElement) => void };
  }
}
export default function ContactForm({
  proyectoInicial = "",
  variante = "contacto",
  idioma = "es",
  nombres,
}: {
  /**
   * En la página de un proyecto, el formulario llega con ese proyecto elegido.
   * Puede llegar con el nombre en cualquiera de los dos idiomas: se guarda el
   * valor en español.
   */
  proyectoInicial?: string;
  /**
   * «consignar» (29-sep-2026, /vender): en vez del proyecto de interés pide la
   * ubicación y el tipo del inmueble, y el Worker avisa con otro título.
   */
  variante?: "contacto" | "consignar";
  idioma?: Idioma;
  /** Los nombres de la cartera en el idioma de la página, por slug (solo en inglés). */
  nombres?: Record<string, string>;
} = {}) {
  const t = TEXTOS[idioma];
  const consignar = variante === "consignar";

  // El selector de proyecto muestra los nombres en el idioma de la página,
  // pero su valor —lo que se guarda y lo que Rafael lee en Telegram— es el
  // nombre en español, como siempre. Los nombres en inglés llegan por props
  // (`nombres`, de nombresDeCartera en src/i18n/datos.ts): así este componente
  // de cliente no carga en el navegador los datos en inglés de toda la cartera.
  const opcionesProyectos = PROYECTOS.map((p) => ({
    slug: p.slug,
    valor: p.nombre,
    texto: nombres?.[p.slug] ?? p.nombre,
  }));
  const opcionesInmuebles = INMUEBLES.map((i) => ({
    slug: i.slug,
    valor: i.nombre,
    texto: nombres?.[i.slug] ?? i.nombre,
  }));
  const opciones = [...opcionesProyectos, ...opcionesInmuebles];
  /** El valor en español de un nombre que llega en cualquiera de los dos idiomas. */
  const valorDe = (nombre: string) =>
    opciones.find((o) => o.valor === nombre || o.texto === nombre)?.valor ?? nombre;
  /** El nombre que ve la persona para un valor del selector. */
  const textoDe = (valor: string) =>
    valor === OTRO_PROYECTO ? t.otro : opciones.find((o) => o.valor === valor)?.texto ?? valor;

  const [ubicacion, setUbicacion] = useState("");
  const [tipoInmueble, setTipoInmueble] = useState("");
  const [nombre, setNombre] = useState("");
  const [contacto, setContacto] = useState("");
  const [proyecto, setProyecto] = useState(() => valorDe(proyectoInicial));
  const [mensaje, setMensaje] = useState("");
  const [autoriza, setAutoriza] = useState(false);
  const [error, setError] = useState("");
  /** idle → enviando → ok | error. Manda toda la cara del formulario. */
  const [estado, setEstado] = useState<"idle" | "enviando" | "ok" | "error">("idle");
  /** Trampa para bots. Una persona nunca la ve, así que nunca la llena. */
  const [sitio, setSitio] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const turnstileRef = useRef<HTMLDivElement>(null);

  /**
   * Turnstile se carga cuando el formulario se acerca a la pantalla o cuando
   * alguien toca uno de sus campos, no junto con la página. Auditoría del
   * 25-sep-2026 (W-1): su verificación pesaba entre 350 y 700 KB, y el
   * teléfono la bajaba aunque nadie llegara al formulario.
   */
  const [cargarTurnstile, setCargarTurnstile] = useState(false);
  useEffect(() => {
    const el = formRef.current;
    if (!el || cargarTurnstile) return;
    if (typeof IntersectionObserver === "undefined") {
      setCargarTurnstile(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setCargarTurnstile(true);
      },
      { rootMargin: "1200px 0px" },
    );
    io.observe(el);
    const alEnfocar = () => setCargarTurnstile(true);
    el.addEventListener("focusin", alEnfocar);
    return () => {
      io.disconnect();
      el.removeEventListener("focusin", alEnfocar);
    };
  }, [cargarTurnstile]);

  /** El mensaje que se le manda a WhatsApp si la persona elige ese camino. */
  function textoWhatsApp(): string {
    if (consignar) {
      return [
        t.waConsignar,
        nombre.trim() ? t.waSoy(nombre.trim()) : null,
        tipoInmueble || ubicacion.trim() ? t.waEs(t.conArticulo[tipoInmueble] ?? t.unInmueble, ubicacion.trim()) : null,
        mensaje.trim() ? mensaje.trim() : null,
        contacto.trim() ? t.waContacto(contacto.trim()) : null,
        "",
        t.waAutorizo,
      ]
        .filter((l) => l !== null)
        .join("\n");
    }
    return [
      t.waHola(nombre.trim()),
      proyecto ? t.waMeInteresa(textoDe(proyecto)) : t.waAsesoria,
      mensaje.trim() ? mensaje.trim() : null,
      t.waContacto(contacto.trim()),
      "",
      t.waAutorizo,
    ]
      .filter(Boolean)
      .join("\n");
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!autoriza) {
      setError(t.faltaAutorizacion);
      return;
    }
    setError("");
    setEstado("enviando");

    // El widget deja su token en un input oculto dentro del formulario.
    const campoToken = formRef.current?.querySelector<HTMLInputElement>(
      'input[name="cf-turnstile-response"]',
    );
    const turnstileToken = campoToken?.value ?? "";

    try {
      // Lo que va al Worker no cambia con el idioma: claves y rótulos en
      // español; lo que escribió la persona, tal cual.
      const r = await fetch("/api/consulta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          contacto: contacto.trim(),
          proyecto: consignar ? `Consignación · ${tipoInmueble || "inmueble"}` : proyecto,
          mensaje: consignar
            ? [`Ubicación del inmueble: ${ubicacion.trim()}`, `Tipo: ${tipoInmueble || "sin indicar"}`, mensaje.trim()]
                .filter(Boolean)
                .join("\n")
            : mensaje.trim(),
          tipo: consignar ? "consignar" : "consulta",
          autoriza: true,
          version_aviso: consignar ? AVISO_VERSION_CONSIGNAR : AVISO_VERSION,
          origen: typeof window !== "undefined" ? window.location.pathname : "",
          sitio,
          turnstile: turnstileToken,
        }),
      });
      setEstado(r.ok ? "ok" : "error");
      if (r.ok) {
        // La conversión, para GA4 y Meta (src/components/Analitica.tsx). En
        // /vender es el «Lead» de captación de propietarios.
        registrarEvento(
          consignar
            ? { event: "lead_consignar", metodo: "formulario", tipo_inmueble: tipoInmueble || "sin indicar" }
            : { event: "generate_lead", formulario: "contacto", proyecto: proyecto || "sin indicar" },
        );
      }
    } catch {
      // Red caída, endpoint fuera, bloqueador: todo cae acá y todo se trata
      // igual, porque para quien escribió el desenlace es el mismo.
      setEstado("error");
    } finally {
      // Cada token sirve una sola vez: sin este reset, un segundo intento sin
      // recargar la página llegaría con un token ya gastado.
      if (turnstileRef.current) window.turnstile?.reset(turnstileRef.current);
    }
  }

  // ── La confirmación ────────────────────────────────────────────────
  // Reemplaza al formulario, no se le agrega debajo: quien acaba de enviar
  // necesita saber que terminó, no volver a ver los campos que llenó.
  //
  // ⛔ Sin promesa de tiempo de respuesta. Publicar «te respondemos en X»
  // nos obliga por el art. 26 de la Ley 1480, y esa decisión sigue abierta:
  // solo se publica el plazo que Rafael pueda sostener todos los días.
  if (estado === "ok") {
    return (
      <div className="contacto-form form-enviado" role="status">
        <span className="form-enviado-marca" aria-hidden="true">✓</span>
        <h3>{t.enviado}</h3>
        <p>
          {t.gracias}
          {nombre.trim() ? `, ${nombre.trim().split(" ")[0]}` : ""}.{" "}
          {consignar ? t.okConsignar : t.okConsulta}
        </p>
        <a
          className="btn-whatsapp"
          href={enlaceWhatsApp(textoWhatsApp())}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t.prefieroWhatsApp}
        </a>
      </div>
    );
  }

  return (
    <form className="contacto-form" onSubmit={enviar} ref={formRef}>
      {cargarTurnstile && (
        <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />
      )}
      <h3>{consignar ? t.tituloConsignar : t.tituloContacto}</h3>

      <label>
        {t.nombre}
        <input
          type="text"
          name="nombre"
          autoComplete="name"
          placeholder={t.nombrePlaceholder}
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
      </label>

      <label>
        {t.contacto}
        <input
          type="text"
          name="contacto"
          autoComplete="tel"
          placeholder={t.contactoPlaceholder}
          value={contacto}
          onChange={(e) => setContacto(e.target.value)}
          required
        />
      </label>

      {consignar ? (
        <>
          <label>
            {t.ubicacion}
            <input
              type="text"
              name="ubicacion"
              autoComplete="off"
              placeholder={t.ubicacionPlaceholder}
              value={ubicacion}
              onChange={(e) => setUbicacion(e.target.value)}
              required
            />
          </label>
          <label>
            {t.tipoInmueble}
            <select name="tipo_inmueble" value={tipoInmueble} onChange={(e) => setTipoInmueble(e.target.value)} required>
              <option value="">{t.tipoPlaceholder}</option>
              {TIPOS_INMUEBLE.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {t.tipos[tipo]}
                </option>
              ))}
            </select>
          </label>
        </>
      ) : (
        <label>
          {t.proyecto}
          <select name="proyecto" value={proyecto} onChange={(e) => setProyecto(e.target.value)}>
            <option value="">{t.proyectoPlaceholder}</option>
            <optgroup label={t.grupoProyectos}>
              {opcionesProyectos.map((o) => (
                <option key={o.slug} value={o.valor}>
                  {o.texto}
                </option>
              ))}
            </optgroup>
            <optgroup label={t.grupoInmuebles}>
              {opcionesInmuebles.map((o) => (
                <option key={o.slug} value={o.valor}>
                  {o.texto}
                </option>
              ))}
            </optgroup>
            <option value={OTRO_PROYECTO}>{t.otro}</option>
          </select>
        </label>
      )}

      <label>
        {t.mensaje}
        <textarea
          name="mensaje"
          rows={3}
          placeholder={consignar ? t.mensajePlaceholderConsignar : t.mensajePlaceholder}
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
        />
      </label>

      {/* Trampa para bots: fuera de la vista y fuera del tabulador. */}
      <input
        type="text"
        name="sitio"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={sitio}
        onChange={(e) => setSitio(e.target.value)}
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clip: "rect(0 0 0 0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      />

      <label className="form-consentimiento">
        <input
          type="checkbox"
          name="autoriza"
          checked={autoriza}
          onChange={(e) => setAutoriza(e.target.checked)}
        />
        <span>
          {t.autorizo}
          {RESPONSABLE}
          {t.tratar}
          {consignar ? t.sobreConsignar : t.sobreConsulta}
          {t.conforme}{" "}
          <a href={ruta(idioma, "/privacidad")} target="_blank" rel="noopener noreferrer">
            {t.politica}
          </a>
          {t.derechos}
          {CORREO}.
        </span>
      </label>

      <div
        ref={turnstileRef}
        className="cf-turnstile"
        data-sitekey={TURNSTILE_SITE_KEY}
        data-appearance="interaction-only"
        data-language={idioma}
        data-theme="light"
      />

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <button
        className="btn-primary"
        type="submit"
        disabled={estado === "enviando"}
      >
        {estado === "enviando" ? t.enviando : consignar ? t.llamame : t.enviar}
      </button>

      {/* El fallo se dice, y con salida. Quien llenó el formulario tiene el
          mensaje ya escrito a un clic: nadie se queda sin poder escribir
          porque a nosotros se nos cayó algo. */}
      {estado === "error" && (
        <div className="form-fallo" role="alert">
          <p>
            <strong>{t.falloTitulo}</strong>
            {t.falloTexto}
          </p>
          <a
            className="btn-whatsapp"
            href={enlaceWhatsApp(textoWhatsApp())}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t.escribirWhatsApp}
          </a>
        </div>
      )}

      <p className="form-disclaimer">{t.disclaimer}</p>
    </form>
  );
}
