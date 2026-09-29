"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { PROYECTOS } from "@/data/proyectos";
import { INMUEBLES } from "@/data/inmuebles";
import { enlaceWhatsApp, RESPONSABLE, CORREO } from "@/data/contacto";

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
 */

/** Versión del texto de autorización de abajo. Cambiarla al cambiar el texto. */
export const AVISO_VERSION = "2026-09-18";

/** La del formulario de /vender, cuyo texto de autorización nombra el inmueble. */
export const AVISO_VERSION_CONSIGNAR = "2026-09-29-consignar";

/** Los tipos de inmueble que se pueden consignar, para el selector de /vender. */
const TIPOS_INMUEBLE = ["Apartamento", "Casa", "Lote", "Local comercial", "Otro"];
const CON_ARTICULO: Record<string, string> = {
  Apartamento: "un apartamento",
  Casa: "una casa",
  Lote: "un lote",
  "Local comercial": "un local comercial",
  Otro: "un inmueble",
};

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
 * ⚠️ Al 2026-09-19 el Worker **no tiene** `TURNSTILE_SECRET`, así que esta
 * verificación está apagada y solo operan la trampa para bots, el tope por
 * IP y la validación de origen. Se activa con `wrangler secret put`.
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
}: {
  /** En la página de un proyecto, el formulario llega con ese proyecto elegido. */
  proyectoInicial?: string;
  /**
   * «consignar» (29-sep-2026, /vender): en vez del proyecto de interés pide la
   * ubicación y el tipo del inmueble, y el Worker avisa con otro título.
   */
  variante?: "contacto" | "consignar";
} = {}) {
  const consignar = variante === "consignar";
  const [ubicacion, setUbicacion] = useState("");
  const [tipoInmueble, setTipoInmueble] = useState("");
  const [nombre, setNombre] = useState("");
  const [contacto, setContacto] = useState("");
  const [proyecto, setProyecto] = useState(proyectoInicial);
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
        "Hola, quiero consignar mi propiedad...",
        nombre.trim() ? `Soy ${nombre.trim()}.` : null,
        tipoInmueble || ubicacion.trim()
          ? `Es ${CON_ARTICULO[tipoInmueble] ?? "un inmueble"}${ubicacion.trim() ? ` en ${ubicacion.trim()}` : ""}.`
          : null,
        mensaje.trim() ? mensaje.trim() : null,
        contacto.trim() ? `Me contactas en: ${contacto.trim()}` : null,
        "",
        "Autorizo el tratamiento de mis datos según la política publicada en rhfliving.com/privacidad.",
      ]
        .filter((l) => l !== null)
        .join("\n");
    }
    return [
      `Hola Rafael, soy ${nombre.trim()}.`,
      proyecto ? `Me interesa ${proyecto}.` : "Me interesa tu asesoría inmobiliaria.",
      mensaje.trim() ? mensaje.trim() : null,
      `Me contactas en: ${contacto.trim()}`,
      "",
      "Autorizo el tratamiento de mis datos según la política publicada en rhfliving.com/privacidad.",
    ]
      .filter(Boolean)
      .join("\n");
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!autoriza) {
      setError("Necesitamos tu autorización para tratar tus datos antes de continuar.");
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
        <h3>Mensaje enviado</h3>
        <p>
          Gracias{nombre.trim() ? `, ${nombre.trim().split(" ")[0]}` : ""}.{" "}
          {consignar
            ? "Los datos de tu inmueble ya nos llegaron. Rafael te escribe al contacto que nos dejaste para agendar la llamada."
            : "Tu consulta ya nos llegó y te escribimos al contacto que nos dejaste."}
        </p>
        <a
          className="btn-whatsapp"
          href={enlaceWhatsApp(textoWhatsApp())}
          target="_blank"
          rel="noopener noreferrer"
        >
          Prefiero escribir por WhatsApp
        </a>
      </div>
    );
  }

  return (
    <form className="contacto-form" onSubmit={enviar} ref={formRef}>
      {cargarTurnstile && (
        <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />
      )}
      <h3>{consignar ? "Cuéntanos de tu inmueble" : "Déjanos tus datos"}</h3>

      <label>
        Nombre
        <input
          type="text"
          name="nombre"
          autoComplete="name"
          placeholder="Tu nombre completo"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
      </label>

      <label>
        Teléfono o email
        <input
          type="text"
          name="contacto"
          autoComplete="tel"
          placeholder="¿Cómo te contactamos?"
          value={contacto}
          onChange={(e) => setContacto(e.target.value)}
          required
        />
      </label>

      {consignar ? (
        <>
          <label>
            Ubicación del inmueble
            <input
              type="text"
              name="ubicacion"
              autoComplete="off"
              placeholder="Barrio o conjunto, y ciudad"
              value={ubicacion}
              onChange={(e) => setUbicacion(e.target.value)}
              required
            />
          </label>
          <label>
            Tipo de inmueble
            <select name="tipo_inmueble" value={tipoInmueble} onChange={(e) => setTipoInmueble(e.target.value)} required>
              <option value="">Selecciona el tipo</option>
              {TIPOS_INMUEBLE.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
        </>
      ) : (
      <label>
        Proyecto de interés
        <select
          name="proyecto"
          value={proyecto}
          onChange={(e) => setProyecto(e.target.value)}
        >
          <option value="">Selecciona un proyecto</option>
          <optgroup label="Proyectos de la cartera">
            {PROYECTOS.map((p) => (
              <option key={p.slug} value={p.nombre}>
                {p.nombre}
              </option>
            ))}
          </optgroup>
          <optgroup label="Inmuebles disponibles">
            {INMUEBLES.map((i) => (
              <option key={i.slug} value={i.nombre}>
                {i.nombre}
              </option>
            ))}
          </optgroup>
          <option value="Otro / No estoy seguro">Otro / No estoy seguro</option>
        </select>
      </label>
      )}

      <label>
        Mensaje
        <textarea
          name="mensaje"
          rows={3}
          placeholder={consignar ? "Área aproximada, estado, lo que quieras contarnos (opcional)" : "Cuéntanos qué buscas..."}
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
          Autorizo a {RESPONSABLE} a tratar mis datos personales para contactarme
          sobre {consignar ? "la venta o consignación de mi inmueble" : "esta consulta"}, conforme a la{" "}
          <a href="/privacidad" target="_blank" rel="noopener noreferrer">
            política de tratamiento de datos
          </a>
          . Puedo conocer, actualizar, rectificar o suprimir mis datos escribiendo
          a {CORREO}.
        </span>
      </label>

      <div
        ref={turnstileRef}
        className="cf-turnstile"
        data-sitekey={TURNSTILE_SITE_KEY}
        data-appearance="interaction-only"
        data-language="es"
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
        {estado === "enviando" ? "Enviando…" : consignar ? "Quiero que Rafael me llame" : "Enviar mensaje"}
      </button>

      {/* El fallo se dice, y con salida. Quien llenó el formulario tiene el
          mensaje ya escrito a un clic: nadie se queda sin poder escribir
          porque a nosotros se nos cayó algo. */}
      {estado === "error" && (
        <div className="form-fallo" role="alert">
          <p>
            <strong>El envío falló.</strong> Tu mensaje ya está escrito y listo
            para mandarlo por WhatsApp, o vuelve a intentarlo en un momento.
          </p>
          <a
            className="btn-whatsapp"
            href={enlaceWhatsApp(textoWhatsApp())}
            target="_blank"
            rel="noopener noreferrer"
          >
            Escribir por WhatsApp
          </a>
        </div>
      )}

      <p className="form-disclaimer">
        Guardamos tu consulta para responderte. La conservamos hasta dos años
        desde nuestro último contacto, y la borramos antes si nos lo pides.
      </p>
    </form>
  );
}
