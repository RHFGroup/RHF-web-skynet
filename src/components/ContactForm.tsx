"use client";

import { useState } from "react";
import { PROYECTOS } from "@/data/proyectos";
import { enlaceWhatsApp, RESPONSABLE, CORREO } from "@/data/contacto";

/**
 * Formulario de contacto.
 *
 * ANTES: `onSubmit` hacía `preventDefault()` y nada más — había un
 * `/* TODO: endpoint de contacto *​/` donde debía ir el envío. Quien llenaba el
 * formulario y le daba a «Enviar consulta» perdía su dato sin que ni él ni
 * Rafael se enteraran. Tampoco pedía autorización de tratamiento de datos,
 * que la Ley 1581 de 2012 exige previa, expresa e informada.
 *
 * AHORA: arma el mensaje y abre WhatsApp con él escrito. No hay servidor, no
 * se almacena nada acá, y el dato llega a donde Rafael atiende. La casilla de
 * autorización es obligatoria y enlaza a la política publicada.
 */
export default function ContactForm() {
  const [nombre, setNombre] = useState("");
  const [contacto, setContacto] = useState("");
  const [proyecto, setProyecto] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [autoriza, setAutoriza] = useState(false);
  const [error, setError] = useState("");

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!autoriza) {
      setError("Necesitamos tu autorización para tratar tus datos antes de continuar.");
      return;
    }
    setError("");
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
    <form className="contacto-form" onSubmit={enviar}>
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

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <button className="btn-primary" type="submit">
        Enviar por WhatsApp
      </button>

      <p className="form-disclaimer">
        Al enviar se abre WhatsApp con tu mensaje ya escrito. Esta página no
        guarda tus datos: viajan directo a la conversación.
      </p>
    </form>
  );
}
