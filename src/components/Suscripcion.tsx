"use client";

/**
 * La suscripción al boletín de noticias de la Zona Norte (28-sep-2026,
 * pedido de Rafael: «noticias y suscripción»).
 *
 * Guarda el correo con la constancia de la autorización —fecha, versión del
 * texto aceptado, IP y navegador— en POST /api/suscripcion (worker/boletin.ts),
 * que es lo que la Ley 1581 de 2012 pide para poder demostrarla. Sin la
 * casilla no se envía.
 *
 * 30-sep-2026 (Prompt 3 de Luciano, fase 1). La suscripción de Luciano quedó
 * guardada, pero él vio que «no funciona»: no le llegó nada después. Desde
 * ahora:
 *  · con el correo de Cloudflare encendido, llega un correo para confirmar, y
 *    el mensaje de éxito lo dice; sin él, el mensaje dice que el boletín llega
 *    con la próxima edición;
 *  · la casilla va antes del botón: en el teléfono quedaba debajo, y el aviso
 *    de que faltaba salía al final del texto legal, lejos de la vista;
 *  · cada aviso de error va junto a su campo, y el foco va a lo que falta;
 *  · el botón se activa cuando la página terminó de cargar: antes, un envío
 *    temprano recargaba la página con el correo escrito en la dirección;
 *  · Turnstile propio (acción «boletin»), con un token nuevo en cada intento;
 *  · si el servidor falla, el aviso trae el enlace a WhatsApp;
 *  · `newsletter_signup` a la capa de datos (sale solo si la persona aceptó
 *    las cookies: GTM no carga sin eso).
 *
 * En inglés (29-sep-2026) cambian los textos, no lo que se envía. La palabra
 * para darse de baja sigue siendo BAJA, la misma de la política de datos.
 */
import Script from "next/script";
import { useEffect, useId, useRef, useState } from "react";
import { CORREO, RESPONSABLE, enlaceWhatsApp } from "@/data/contacto";
import { ruta, type Idioma } from "@/i18n/idioma";
import { TURNSTILE_SCRIPT, TURNSTILE_SITE_KEY } from "@/lib/turnstile";

/** Versión del texto de autorización de abajo. Cambiarla al cambiar el texto. */
export const AVISO_BOLETIN = "2026-09-28-boletin";

const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Los textos, en los dos idiomas (docs/i18n.md). Cada uno es un nodo de texto
 * tal como queda en el HTML, con sus espacios de borde.
 */
const TEXTOS = {
  es: {
    correoInvalido: "Revisa tu correo: parece que le falta algo.",
    faltaAutorizacion: "Marca la autorización para poder enviarte el boletín.",
    listo: "Listo, te llegará el próximo boletín.",
    teEscribimos: "Te escribimos a ",
    cuandoHaya: " cuando haya noticias nuevas de la zona.",
    listoConfirmar: "Listo. Revisa tu correo para confirmar.",
    teEnviamos: "Te enviamos un mensaje a ",
    abrelo: ". Ábrelo y toca «Confirmar»: desde ahí te llega el boletín. Si no lo ves en unos minutos, revisa el correo no deseado.",
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
    falloCorreo: "No pudimos enviarte el correo de confirmación. Intenta de nuevo en un momento o escríbenos por WhatsApp.",
    falloVerificacion: "No pudimos verificar el envío. Vuelve a tocar «Suscribirme».",
    demasiados: "Hubo varios intentos seguidos desde tu conexión. Espera unos minutos y vuelve a intentarlo.",
    escribirWhatsApp: "Escribir por WhatsApp",
    mensajeWhatsApp: "Hola Rafael, quiero recibir el boletín de noticias de la Zona Norte.",
  },
  en: {
    correoInvalido: "Check your email address: it looks like something is missing.",
    faltaAutorizacion: "Check the consent box so we can send you the newsletter.",
    listo: "Done, you'll get the next newsletter.",
    teEscribimos: "We'll write to you at ",
    cuandoHaya: " whenever there's news from the area.",
    listoConfirmar: "Done. Check your email to confirm.",
    teEnviamos: "We've sent a message to ",
    abrelo: ". Open it and tap “Confirm”: that's when the newsletter starts. If you don't see it in a few minutes, check your spam folder.",
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
    falloCorreo: "We couldn't send you the confirmation email. Please try again in a moment or message us on WhatsApp.",
    falloVerificacion: "We couldn't verify your request. Please tap “Subscribe” again.",
    demasiados: "There were several attempts in a row from your connection. Please wait a few minutes and try again.",
    escribirWhatsApp: "Message us on WhatsApp",
    mensajeWhatsApp: "Hi Rafael, I'd like to receive the Zona Norte newsletter.",
  },
} satisfies Record<Idioma, Record<string, string>>;

type Fallo = "servidor" | "correo" | "verificacion" | "tope";

/** Empuja un evento a la capa de datos de la analítica (src/components/Analitica.tsx). */
function registrarEvento(datos: Record<string, unknown>) {
  const w = window as unknown as { dataLayer?: unknown[] };
  (w.dataLayer ||= []).push(datos);
}

/** Las UTM de la página actual, si las trae. No son datos personales. */
function utmDeLaPagina(): Record<string, string> {
  const utm: Record<string, string> = {};
  try {
    const q = new URLSearchParams(window.location.search);
    for (const k of ["source", "medium", "campaign", "content", "term"]) {
      const v = q.get(`utm_${k}`);
      if (v) utm[k] = v.slice(0, 100);
    }
  } catch {
    /* sin UTM */
  }
  return utm;
}

export default function Suscripcion({ idioma = "es" }: { idioma?: Idioma }) {
  const t = TEXTOS[idioma];
  const id = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const correoRef = useRef<HTMLInputElement>(null);
  const casillaRef = useRef<HTMLInputElement>(null);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const [correo, setCorreo] = useState("");
  const [autoriza, setAutoriza] = useState(false);
  /** Trampa para bots: una persona nunca la ve, así que nunca la llena. */
  const [sitio, setSitio] = useState("");
  const [estado, setEstado] = useState<"idle" | "enviando" | "ok" | "error">("idle");
  const [errorCampo, setErrorCampo] = useState<"correo" | "autoriza" | null>(null);
  const [fallo, setFallo] = useState<Fallo>("servidor");
  const [conConfirmacion, setConConfirmacion] = useState(false);
  /** El botón se activa cuando React ya maneja el formulario. */
  const [hidratado, setHidratado] = useState(false);
  useEffect(() => setHidratado(true), []);

  /**
   * Turnstile se carga cuando el formulario se acerca a la pantalla o cuando
   * alguien toca uno de sus campos, como en el formulario de contacto
   * (auditoría del 25-sep-2026, W-1).
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

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (estado === "enviando") return;
    const c = correo.trim();
    if (!CORREO_VALIDO.test(c)) {
      setErrorCampo("correo");
      correoRef.current?.focus();
      return;
    }
    if (!autoriza) {
      setErrorCampo("autoriza");
      casillaRef.current?.focus();
      return;
    }
    setErrorCampo(null);
    setEstado("enviando");
    const token =
      formRef.current?.querySelector<HTMLInputElement>('input[name="cf-turnstile-response"]')?.value ?? "";
    try {
      const r = await fetch("/api/suscripcion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          correo: c,
          autoriza: true,
          version_aviso: AVISO_BOLETIN,
          origen: window.location.pathname,
          idioma,
          sitio,
          turnstile: token,
          utm: utmDeLaPagina(),
        }),
      });
      const j = (await r.json().catch(() => ({}))) as { confirmacion?: boolean; error?: string };
      if (r.ok) {
        setConConfirmacion(j.confirmacion === true);
        setEstado("ok");
        registrarEvento({ event: "newsletter_signup", formulario: "boletin", idioma, page_path: window.location.pathname });
        return;
      }
      if (j.error === "correo_invalido") {
        setErrorCampo("correo");
        setEstado("idle");
        correoRef.current?.focus();
        return;
      }
      if (j.error === "falta_autorizacion") {
        setErrorCampo("autoriza");
        setEstado("idle");
        casillaRef.current?.focus();
        return;
      }
      setFallo(r.status === 403 ? "verificacion" : r.status === 429 ? "tope" : r.status === 502 ? "correo" : "servidor");
      setEstado("error");
    } catch {
      setFallo("servidor");
      setEstado("error");
    } finally {
      // Cada token sirve una sola vez: el siguiente intento lleva uno nuevo.
      if (turnstileRef.current) window.turnstile?.reset(turnstileRef.current);
    }
  }

  if (estado === "ok") {
    return (
      <div className="suscripcion suscripcion-lista" role="status">
        <p className="suscripcion-titulo">{conConfirmacion ? t.listoConfirmar : t.listo}</p>
        <p className="suscripcion-bajada">
          {conConfirmacion ? (
            <>
              {t.teEnviamos}
              <strong>{correo.trim()}</strong>
              {t.abrelo}
            </>
          ) : (
            <>
              {t.teEscribimos}
              <strong>{correo.trim()}</strong>
              {t.cuandoHaya}
            </>
          )}
        </p>
      </div>
    );
  }

  const mensajeFallo =
    fallo === "verificacion"
      ? t.falloVerificacion
      : fallo === "tope"
        ? t.demasiados
        : fallo === "correo"
          ? t.falloCorreo
          : t.falloGuardar;

  return (
    <form ref={formRef} className="suscripcion" onSubmit={enviar} noValidate aria-labelledby={`${id}-titulo`}>
      <div className="suscripcion-texto">
        <p className="suscripcion-titulo" id={`${id}-titulo`}>
          {t.titulo}
        </p>
        <p className="suscripcion-bajada">{t.bajada}</p>
      </div>
      <div className="suscripcion-campos">
        <div className="suscripcion-campo">
          <label className="sr-only" htmlFor={`${id}-correo`}>
            {t.tuCorreo}
          </label>
          <input
            ref={correoRef}
            id={`${id}-correo`}
            type="email"
            name="correo"
            autoComplete="email"
            inputMode="email"
            placeholder={t.tuCorreo}
            value={correo}
            onChange={(e) => {
              setCorreo(e.target.value);
              if (errorCampo === "correo") setErrorCampo(null);
            }}
            aria-invalid={errorCampo === "correo" || undefined}
            aria-describedby={errorCampo === "correo" ? `${id}-error-correo` : undefined}
            required
          />
          {errorCampo === "correo" && (
            <p className="suscripcion-error" id={`${id}-error-correo`} role="alert">
              {t.correoInvalido}
            </p>
          )}
        </div>
        <input
          className="suscripcion-trampa"
          type="text"
          name="hp_boletin"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          value={sitio}
          onChange={(e) => setSitio(e.target.value)}
        />
        <label className="suscripcion-consentimiento">
          <input
            ref={casillaRef}
            type="checkbox"
            name="autoriza"
            checked={autoriza}
            onChange={(e) => {
              setAutoriza(e.target.checked);
              if (e.target.checked && errorCampo === "autoriza") setErrorCampo(null);
            }}
            aria-invalid={errorCampo === "autoriza" || undefined}
            aria-describedby={errorCampo === "autoriza" ? `${id}-error-autoriza` : undefined}
          />
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
        {errorCampo === "autoriza" && (
          <p className="suscripcion-error" id={`${id}-error-autoriza`} role="alert">
            {t.faltaAutorizacion}
          </p>
        )}
        {cargarTurnstile && <Script src={TURNSTILE_SCRIPT} strategy="afterInteractive" />}
        <div
          ref={turnstileRef}
          className="cf-turnstile"
          data-sitekey={TURNSTILE_SITE_KEY}
          data-appearance="interaction-only"
          data-language={idioma}
          data-action="boletin"
        />
        <button type="submit" className="suscripcion-boton" disabled={!hidratado || estado === "enviando"}>
          {estado === "enviando" ? t.enviando : t.suscribirme}
        </button>
        {estado === "error" && (
          <p className="suscripcion-error" role="alert">
            {mensajeFallo}{" "}
            {fallo !== "verificacion" && fallo !== "tope" && (
              <a href={enlaceWhatsApp(t.mensajeWhatsApp)} target="_blank" rel="noopener noreferrer">
                {t.escribirWhatsApp}
              </a>
            )}
          </p>
        )}
      </div>
    </form>
  );
}
