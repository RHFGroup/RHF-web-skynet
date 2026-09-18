"use client";

import { useRef, useState } from "react";
import Script from "next/script";
import { PROYECTOS } from "@/data/proyectos";
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
 *
 * REGLA DE ORO DEL PASO 3: **guardar es la red debajo de WhatsApp, nunca su
 * reemplazo.** El `fetch` sale sin `await` y con `keepalive`, y WhatsApp se
 * abre en el mismo gesto del clic. Dos razones, las dos importan:
 *
 *  · Si el endpoint falla, WhatsApp abre igual y el lead no se pierde.
 *  · Si se esperara la respuesta antes de `window.open`, el navegador ya no
 *    estaría en el gesto del usuario y el bloqueador de pop-ups mataría la
 *    ventana. Ese es el bug clásico de este patrón.
 *
 * La casilla de autorización es obligatoria: sin ella no se envía ni se
 * guarda, que es lo que la Ley 1581 de 2012 exige (previa, expresa e
 * informada). `AVISO_VERSION` viaja con cada envío para poder demostrar
 * después CUÁL texto aceptó cada persona.
 */

/** Versión del texto de autorización de abajo. Cambiarla al cambiar el texto. */
const AVISO_VERSION = "2026-09-18";

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
 * rechaza el guardado. WhatsApp abre igual: la regla de oro no cambia.
 */
const TURNSTILE_SITE_KEY = "0x4AAAAAAE8W_1D4uDCgIB5S";

declare global {
  interface Window {
    turnstile?: { reset: (contenedor?: HTMLElement) => void };
  }
}
export default function ContactForm() {
  const [nombre, setNombre] = useState("");
  const [contacto, setContacto] = useState("");
  const [proyecto, setProyecto] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [autoriza, setAutoriza] = useState(false);
  const [error, setError] = useState("");
  const [guardado, setGuardado] = useState(false);
  /** Trampa para bots. Una persona nunca la ve, así que nunca la llena. */
  const [sitio, setSitio] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const turnstileRef = useRef<HTMLDivElement>(null);

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!autoriza) {
      setError("Necesitamos tu autorización para tratar tus datos antes de continuar.");
      return;
    }
    setError("");

    // El widget deja su token en un input oculto dentro del formulario.
    const campoToken = formRef.current?.querySelector<HTMLInputElement>(
      'input[name="cf-turnstile-response"]',
    );
    const turnstileToken = campoToken?.value ?? "";

    // Sale sin await: WhatsApp tiene que abrirse dentro del gesto del clic.
    fetch("/api/consulta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        nombre: nombre.trim(),
        contacto: contacto.trim(),
        proyecto,
        mensaje: mensaje.trim(),
        autoriza: true,
        version_aviso: AVISO_VERSION,
        origen: typeof window !== "undefined" ? window.location.pathname : "",
        sitio,
        turnstile: turnstileToken,
      }),
    })
      .then((r) => setGuardado(r.ok))
      .catch(() => {
        /* La red se cayó; WhatsApp ya abrió. No hay nada que decirle a nadie. */
      });

    // Cada token sirve una sola vez: sin este reset, un segundo envío sin
    // recargar la página llegaría con un token ya gastado.
    if (turnstileRef.current) window.turnstile?.reset(turnstileRef.current);

    const texto = [
      `Hola Rafael, soy ${nombre.trim()}.`,
      proyecto ? `Me interesa ${proyecto}.` : "Me interesa tu asesoría inmobiliaria.",
      mensaje.trim() ? mensaje.trim() : null,
      `Me contactas en: ${contacto.trim()}`,
      "",
      "Autorizo el tratamiento de mis datos según la política publicada en rhfliving.com/privacidad.",
    ]
      .filter(Boolean)
      .join("\n");
    window.open(enlaceWhatsApp(texto), "_blank", "noopener,noreferrer");
  }

  return (
    <form className="contacto-form" onSubmit={enviar} ref={formRef}>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="lazyOnload"
      />
      <h3>Déjanos tus datos</h3>

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

      <label>
        Proyecto de interés
        <select
          name="proyecto"
          value={proyecto}
          onChange={(e) => setProyecto(e.target.value)}
        >
          <option value="">Selecciona un proyecto</option>
          {PROYECTOS.map((p) => (
            <option key={p.slug} value={p.nombre}>
              {p.nombre}
            </option>
          ))}
          <option value="Otro / No estoy seguro">Otro / No estoy seguro</option>
        </select>
      </label>

      <label>
        Mensaje
        <textarea
          name="mensaje"
          rows={3}
          placeholder="Cuéntanos qué buscas..."
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
          sobre esta consulta, conforme a la{" "}
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

      <button className="btn-primary" type="submit">
        Enviar por WhatsApp
      </button>

      {guardado && (
        <p className="form-ok" role="status">
          Tu consulta quedó registrada. Te respondemos por WhatsApp.
        </p>
      )}

      <p className="form-disclaimer">
        Al enviar se abre WhatsApp con tu mensaje ya escrito y guardamos tu
        consulta para responderte. La conservamos hasta dos años desde nuestro
        último contacto, y la borramos antes si nos lo pides.
      </p>
    </form>
  );
}
