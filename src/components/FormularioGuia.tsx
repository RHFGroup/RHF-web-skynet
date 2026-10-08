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
 *
 * En inglés (29-sep-2026) cambian los textos, no lo que se envía: el mensaje
 * que Rafael lee en Telegram sigue en español, con el título de la guía en
 * español (se busca por su `origen`).
 */
import { useRef, useState } from "react";
import Script from "next/script";
import { TURNSTILE_SITE_KEY } from "@/components/ContactForm";
import { atribucionParaEnviar } from "@/lib/atribucion";

/**
 * La versión de SU texto de autorización («enviarme esta guía…»). Hasta el
 * 7-oct-2026 mandaba la de ContactForm («2026-09-18»), aunque el texto es
 * otro; desde entonces tiene la suya, que suma «y para saber por qué medio
 * llegué a esta página». Aprobado por Rafael el 8-oct-2026.
 */
const AVISO_VERSION_GUIA = "2026-10-07-guia";
import { CORREO, RESPONSABLE, enlaceWhatsApp } from "@/data/contacto";
import { ruta, type Idioma } from "@/i18n/idioma";
import { proceso } from "@/i18n/modulos/proceso";

/**
 * Los textos, en los dos idiomas (docs/i18n.md). Cada uno es un nodo de texto
 * tal como queda en el HTML, con sus espacios de borde: así el español sale
 * idéntico.
 */
const TEXTOS = {
  es: {
    faltaAutorizacion: "Necesitamos tu autorización para tratar tus datos antes de enviarte la guía.",
    listaAntes: "Tu ",
    listaDespues: " está lista",
    descargar: "Descargar la guía (PDF)",
    cerrar: "Cerrar",
    recibe: "Recibe la ",
    nombre: "Nombre",
    correo: "Correo",
    telefono: "Teléfono",
    autorizo: "Autorizo a ",
    tratar:
      " a tratar mis datos personales para enviarme esta guía y contactarme sobre ella, y para saber por qué medio llegué a esta página, conforme a la",
    politica: "política de tratamiento de datos",
    derechos: ". Puedo conocer, actualizar, rectificar o suprimir mis datos escribiendo a ",
    enviando: "Enviando…",
    enviar: "Enviarme la guía",
    falloTitulo: "El envío falló.",
    falloTexto: " Pídenos la guía por WhatsApp y te la mandamos por ahí.",
    whatsapp: (titulo: string) => `Hola Rafael, quiero recibir la ${titulo}.`,
    pedirla: "Pedirla por WhatsApp",
  },
  en: {
    faltaAutorizacion: "We need your consent to process your data before we send you the guide.",
    listaAntes: "Your ",
    listaDespues: " is ready",
    descargar: "Download the guide (PDF)",
    cerrar: "Close",
    recibe: "Get the ",
    nombre: "Name",
    correo: "Email",
    telefono: "Phone",
    autorizo: "I authorize ",
    tratar:
      " to process my personal data to send me this guide and contact me about it, and to know how I found this page, in accordance with the",
    politica: "data processing policy",
    derechos: ". I can access, update, correct or delete my data by writing to ",
    enviando: "Sending…",
    enviar: "Send me the guide",
    falloTitulo: "Your request didn't go through.",
    falloTexto: " Ask us for the guide on WhatsApp and we'll send it to you there.",
    whatsapp: (titulo: string) => `Hi Rafael, I'd like to get the ${titulo}.`,
    pedirla: "Request it on WhatsApp",
  },
} satisfies Record<Idioma, Record<string, string | ((titulo: string) => string)>>;

export default function FormularioGuia({
  titulo,
  pdf,
  origen,
  alCerrar,
  idioma = "es",
}: {
  titulo: string;
  pdf: string;
  origen: string;
  alCerrar?: () => void;
  idioma?: Idioma;
}) {
  const t = TEXTOS[idioma];
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
      setAviso(t.faltaAutorizacion);
      return;
    }
    setAviso("");
    setEstado("enviando");
    const token =
      form.current?.querySelector<HTMLInputElement>('input[name="cf-turnstile-response"]')?.value ?? "";
    // El título en español para el mensaje que lee Rafael: lo que va al
    // Worker no cambia con el idioma de la página.
    const tituloAviso = Object.values(proceso("es").GUIAS).find((g) => g.origen === origen)?.titulo ?? titulo;
    try {
      const r = await fetch("/api/consulta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          contacto: [correo.trim(), telefono.trim()].filter(Boolean).join(" · "),
          proyecto: "",
          mensaje: `Pidió la ${tituloAviso.toLowerCase()} en PDF.`,
          autoriza: true,
          version_aviso: AVISO_VERSION_GUIA,
          // Por dónde llegó, si el navegador lo anotó (src/lib/atribucion.ts).
          atribucion: atribucionParaEnviar(),
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
        <h3>
          {t.listaAntes}
          {titulo.toLowerCase()}
          {t.listaDespues}
        </h3>
        <a className="btn-primary" href={pdf} target="_blank" rel="noopener noreferrer" download>
          {t.descargar}
        </a>
        {alCerrar && (
          <button type="button" className="guia-cerrar" onClick={alCerrar}>
            {t.cerrar}
          </button>
        )}
      </div>
    );
  }

  return (
    <form className="guia-form" onSubmit={enviar} ref={form}>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="lazyOnload" />
      <h3>
        {t.recibe}
        {titulo.toLowerCase()}
      </h3>
      <label>
        {t.nombre}
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="name" required />
      </label>
      <label>
        {t.correo}
        <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} autoComplete="email" required />
      </label>
      <label>
        {t.telefono}
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
          {t.autorizo}
          {RESPONSABLE}
          {t.tratar}{" "}
          <a href={ruta(idioma, "/privacidad")} target="_blank" rel="noopener noreferrer">
            {t.politica}
          </a>
          {t.derechos}
          {CORREO}.
        </span>
      </label>
      <div className="cf-turnstile" data-sitekey={TURNSTILE_SITE_KEY} data-appearance="interaction-only" data-language={idioma} />
      {aviso && (
        <p className="form-error" role="alert">
          {aviso}
        </p>
      )}
      <button className="btn-primary" type="submit" disabled={estado === "enviando"}>
        {estado === "enviando" ? t.enviando : t.enviar}
      </button>
      {estado === "error" && (
        <div className="form-fallo" role="alert">
          <p>
            <strong>{t.falloTitulo}</strong>
            {t.falloTexto}
          </p>
          <a
            className="btn-whatsapp"
            href={enlaceWhatsApp(t.whatsapp(titulo.toLowerCase()))}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t.pedirla}
          </a>
        </div>
      )}
    </form>
  );
}
