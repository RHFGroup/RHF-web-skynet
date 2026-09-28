"use client";

/**
 * La suscripción al boletín de noticias de la Zona Norte (28-sep-2026,
 * pedido de Rafael: «noticias y suscripción»).
 *
 * Guarda el correo con la constancia de la autorización —fecha, versión del
 * texto aceptado, IP y navegador— en POST /api/suscripcion (worker/index.ts),
 * que es lo que la Ley 1581 de 2012 pide para poder demostrarla. Sin la
 * casilla no se envía. El envío del boletín se organiza después: por ahora la
 * lista queda guardada en la base del Worker.
 */
import { useId, useState } from "react";
import { CORREO, RESPONSABLE } from "@/data/contacto";

/** Versión del texto de autorización de abajo. Cambiarla al cambiar el texto. */
export const AVISO_BOLETIN = "2026-09-28-boletin";

const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function Suscripcion() {
  const id = useId();
  const [correo, setCorreo] = useState("");
  const [autoriza, setAutoriza] = useState(false);
  /** Trampa para bots: una persona nunca la ve, así que nunca la llena. */
  const [sitio, setSitio] = useState("");
  const [estado, setEstado] = useState<"idle" | "enviando" | "ok" | "error">("idle");
  const [error, setError] = useState("");

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const c = correo.trim();
    if (!CORREO_VALIDO.test(c)) {
      setError("Revisa tu correo: parece que le falta algo.");
      return;
    }
    if (!autoriza) {
      setError("Marca la autorización para poder enviarte el boletín.");
      return;
    }
    setError("");
    setEstado("enviando");
    try {
      const r = await fetch("/api/suscripcion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          correo: c,
          autoriza: true,
          version_aviso: AVISO_BOLETIN,
          origen: window.location.pathname,
          sitio,
        }),
      });
      setEstado(r.ok ? "ok" : "error");
    } catch {
      setEstado("error");
    }
  }

  if (estado === "ok") {
    return (
      <div className="suscripcion suscripcion-lista" role="status">
        <p className="suscripcion-titulo">Listo, ya estás en la lista.</p>
        <p className="suscripcion-bajada">
          Te escribimos a <strong>{correo.trim()}</strong> cuando haya noticias nuevas de la zona.
        </p>
      </div>
    );
  }

  return (
    <form className="suscripcion" onSubmit={enviar} noValidate aria-labelledby={`${id}-titulo`}>
      <div className="suscripcion-texto">
        <p className="suscripcion-titulo" id={`${id}-titulo`}>
          Recibe las noticias de la Zona Norte
        </p>
        <p className="suscripcion-bajada">Obras, proyectos y lo nuevo de la zona, en tu correo.</p>
      </div>
      <div className="suscripcion-campos">
        <div className="suscripcion-fila">
          <label className="sr-only" htmlFor={`${id}-correo`}>
            Tu correo
          </label>
          <input
            id={`${id}-correo`}
            type="email"
            name="correo"
            autoComplete="email"
            inputMode="email"
            placeholder="Tu correo"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            aria-invalid={error.startsWith("Revisa") || undefined}
            required
          />
          <button type="submit" className="suscripcion-boton" disabled={estado === "enviando"}>
            {estado === "enviando" ? "Enviando…" : "Suscribirme"}
          </button>
        </div>
        <input
          className="suscripcion-trampa"
          type="text"
          name="sitio"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          value={sitio}
          onChange={(e) => setSitio(e.target.value)}
        />
        <label className="suscripcion-consentimiento">
          <input type="checkbox" name="autoriza" checked={autoriza} onChange={(e) => setAutoriza(e.target.checked)} />
          <span>
            Autorizo a {RESPONSABLE} a tratar mi correo para enviarme el boletín con noticias de la Zona Norte y
            novedades de su cartera, conforme a la{" "}
            <a href="/privacidad#boletin" target="_blank" rel="noopener noreferrer">
              política de tratamiento de datos
            </a>
            . Puedo darme de baja cuando quiera respondiendo BAJA a cualquier boletín o escribiendo a {CORREO}.
          </span>
        </label>
        {error && (
          <p className="suscripcion-error" role="alert">
            {error}
          </p>
        )}
        {estado === "error" && (
          <p className="suscripcion-error" role="alert">
            No pudimos guardar tu correo. Intenta de nuevo en un momento o escríbenos por WhatsApp.
          </p>
        )}
      </div>
    </form>
  );
}
