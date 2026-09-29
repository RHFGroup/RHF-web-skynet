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
 *
 * En inglés (29-sep-2026) cambian los textos, no lo que se envía: los campos,
 * la versión del aviso y el origen (la ruta, que en inglés empieza por /en)
 * viajan igual. La palabra para darse de baja sigue siendo BAJA, la misma de
 * la política de datos.
 */
import { useId, useState } from "react";
import { CORREO, RESPONSABLE } from "@/data/contacto";
import { ruta, type Idioma } from "@/i18n/idioma";

/** Versión del texto de autorización de abajo. Cambiarla al cambiar el texto. */
export const AVISO_BOLETIN = "2026-09-28-boletin";

const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Los textos, en los dos idiomas (docs/i18n.md). Cada uno es un nodo de texto
 * tal como queda en el HTML, con sus espacios de borde: así el español sale
 * idéntico.
 */
const TEXTOS = {
  es: {
    correoInvalido: "Revisa tu correo: parece que le falta algo.",
    faltaAutorizacion: "Marca la autorización para poder enviarte el boletín.",
    listo: "Listo, ya estás en la lista.",
    teEscribimos: "Te escribimos a ",
    cuandoHaya: " cuando haya noticias nuevas de la zona.",
    titulo: "Recibe las noticias de la Zona Norte",
    bajada: "Obras, proyectos y lo nuevo de la zona, en tu correo.",
    tuCorreo: "Tu correo",
    enviando: "Enviando…",
    suscribirme: "Suscribirme",
    autorizo: "Autorizo a ",
    tratar:
      " a tratar mi correo para enviarme el boletín con noticias de la Zona Norte y novedades de su cartera, conforme a la",
    politica: "política de tratamiento de datos",
    baja: ". Puedo darme de baja cuando quiera respondiendo BAJA a cualquier boletín o escribiendo a ",
    falloGuardar: "No pudimos guardar tu correo. Intenta de nuevo en un momento o escríbenos por WhatsApp.",
  },
  en: {
    correoInvalido: "Check your email address: it looks like something is missing.",
    faltaAutorizacion: "Check the consent box so we can send you the newsletter.",
    listo: "Done, you're on the list.",
    teEscribimos: "We'll write to you at ",
    cuandoHaya: " whenever there's news from the area.",
    titulo: "Get the latest news from the Zona Norte",
    bajada: "Public works, projects and what's new in the area, in your inbox.",
    tuCorreo: "Your email",
    enviando: "Sending…",
    suscribirme: "Subscribe",
    autorizo: "I authorize ",
    tratar:
      " to process my email address to send me the newsletter with Zona Norte news and updates on his portfolio, in accordance with the",
    politica: "data processing policy",
    baja: ". I can unsubscribe at any time by replying BAJA to any newsletter or by writing to ",
    falloGuardar: "We couldn't save your email. Please try again in a moment or message us on WhatsApp.",
  },
} satisfies Record<Idioma, Record<string, string>>;

export default function Suscripcion({ idioma = "es" }: { idioma?: Idioma }) {
  const t = TEXTOS[idioma];
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
      setError(t.correoInvalido);
      return;
    }
    if (!autoriza) {
      setError(t.faltaAutorizacion);
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
        <p className="suscripcion-titulo">{t.listo}</p>
        <p className="suscripcion-bajada">
          {t.teEscribimos}<strong>{correo.trim()}</strong>{t.cuandoHaya}
        </p>
      </div>
    );
  }

  return (
    <form className="suscripcion" onSubmit={enviar} noValidate aria-labelledby={`${id}-titulo`}>
      <div className="suscripcion-texto">
        <p className="suscripcion-titulo" id={`${id}-titulo`}>
          {t.titulo}
        </p>
        <p className="suscripcion-bajada">{t.bajada}</p>
      </div>
      <div className="suscripcion-campos">
        <div className="suscripcion-fila">
          <label className="sr-only" htmlFor={`${id}-correo`}>
            {t.tuCorreo}
          </label>
          <input
            id={`${id}-correo`}
            type="email"
            name="correo"
            autoComplete="email"
            inputMode="email"
            placeholder={t.tuCorreo}
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            aria-invalid={error === t.correoInvalido || undefined}
            required
          />
          <button type="submit" className="suscripcion-boton" disabled={estado === "enviando"}>
            {estado === "enviando" ? t.enviando : t.suscribirme}
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
            {t.autorizo}
            {RESPONSABLE}
            {t.tratar}{" "}
            <a href={ruta(idioma, "/privacidad#boletin")} target="_blank" rel="noopener noreferrer">
              {t.politica}
            </a>
            {t.baja}
            {CORREO}.
          </span>
        </label>
        {error && (
          <p className="suscripcion-error" role="alert">
            {error}
          </p>
        )}
        {estado === "error" && (
          <p className="suscripcion-error" role="alert">
            {t.falloGuardar}
          </p>
        )}
      </div>
    </form>
  );
}
