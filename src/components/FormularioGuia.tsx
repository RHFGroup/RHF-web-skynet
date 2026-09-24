"use client";

/**
 * Pedir una guía en PDF: nombre, correo, teléfono y la autorización de datos.
 *
 * Solo se monta cuando la guía existe (su PDF está en src/data/proceso.ts).
 * Envía a /api/consulta, el mismo endpoint del formulario de contacto, con su
 * `origen` («guia-compra» o «guia-zona») para saber de dónde llegó. Sin la
 * casilla de autorización no se envía nada (Ley 1581 de 2012). Si el envío
 * falla se dice, y queda WhatsApp como salida; la descarga se entrega solo
 * cuando la consulta quedó guardada.
 */
import { useRef, useState } from "react";
import Script from "next/script";
import { AVISO_VERSION, TURNSTILE_SITE_KEY } from "@/components/ContactForm";
import { CORREO, RESPONSABLE, enlaceWhatsApp } from "@/data/contacto";

export default function FormularioGuia({
  titulo,
  pdf,
  origen,
  alCerrar,
}: {
  titulo: string;
  pdf: string;
  origen: string;
  alCerrar?: () => void;
}) {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [autoriza, setAutoriza] = useState(false);
  const [sitio, setSitio] = useState("");
  const [estado, setEstado] = useState<"idle" | "enviando" | "ok" | "error">("idle");
  const [aviso, setAviso] = useState("");
  const form = useRef<HTMLFormElement>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!autoriza) {
      setAviso("Necesitamos tu autorización para tratar tus datos antes de enviarte la guía.");
      return;
    }
    setAviso("");
    setEstado("enviando");
    const token =
      form.current?.querySelector<HTMLInputElement>('input[name="cf-turnstile-response"]')?.value ?? "";
    try {
      const r = await fetch("/api/consulta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          contacto: [correo.trim(), telefono.trim()].filter(Boolean).join(" · "),
          proyecto: "",
          mensaje: `Pidió la ${titulo.toLowerCase()} en PDF.`,
          autoriza: true,
          version_aviso: AVISO_VERSION,
          origen,
          sitio,
          turnstile: token,
        }),
      });
      setEstado(r.ok ? "ok" : "error");
    } catch {
      setEstado("error");
    }
  }

  if (estado === "ok") {
    return (
      <div className="guia-form guia-lista" role="status">
        <h3>Tu {titulo.toLowerCase()} está lista</h3>
        <a className="btn-primary" href={pdf} target="_blank" rel="noopener noreferrer" download>
          Descargar la guía (PDF)
        </a>
        {alCerrar && (
          <button type="button" className="guia-cerrar" onClick={alCerrar}>
            Cerrar
          </button>
        )}
      </div>
    );
  }

  return (
    <form className="guia-form" onSubmit={enviar} ref={form}>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="lazyOnload" />
      <h3>Recibe la {titulo.toLowerCase()}</h3>
      <label>
        Nombre
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="name" required />
      </label>
      <label>
        Correo
        <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} autoComplete="email" required />
      </label>
      <label>
        Teléfono
        <input type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} autoComplete="tel" />
      </label>
      <input
        type="text"
        name="sitio"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={sitio}
        onChange={(e) => setSitio(e.target.value)}
        className="sr-only"
      />
      <label className="form-consentimiento">
        <input type="checkbox" checked={autoriza} onChange={(e) => setAutoriza(e.target.checked)} />
        <span>
          Autorizo a {RESPONSABLE} a tratar mis datos personales para enviarme esta guía y
          contactarme sobre ella, conforme a la{" "}
          <a href="/privacidad" target="_blank" rel="noopener noreferrer">
            política de tratamiento de datos
          </a>
          . Puedo conocer, actualizar, rectificar o suprimir mis datos escribiendo a {CORREO}.
        </span>
      </label>
      <div className="cf-turnstile" data-sitekey={TURNSTILE_SITE_KEY} data-appearance="interaction-only" data-language="es" />
      {aviso && (
        <p className="form-error" role="alert">
          {aviso}
        </p>
      )}
      <button className="btn-primary" type="submit" disabled={estado === "enviando"}>
        {estado === "enviando" ? "Enviando…" : "Enviarme la guía"}
      </button>
      {estado === "error" && (
        <div className="form-fallo" role="alert">
          <p>
            <strong>El envío falló.</strong> Pídenos la guía por WhatsApp y te la mandamos por ahí.
          </p>
          <a
            className="btn-whatsapp"
            href={enlaceWhatsApp(`Hola Rafael, quiero recibir la ${titulo.toLowerCase()}.`)}
            target="_blank"
            rel="noopener noreferrer"
          >
            Pedirla por WhatsApp
          </a>
        </div>
      )}
    </form>
  );
}
