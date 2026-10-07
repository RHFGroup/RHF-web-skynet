"use client";

/**
 * EL FORMULARIO DE CAPTACIÓN EN TRES TOQUES (/asesoria y /en/lets-talk)
 *
 * Decisión de Rafael del 7-oct-2026: «3 toques y sus datos». Tres preguntas
 * con botones grandes (para qué, para cuándo, presupuesto) que avanzan solas,
 * y al final nombre, WhatsApp y la autorización. El lead le llega a Rafael
 * ya calificado.
 *
 * Usa el mismo buzón que el formulario de contacto: POST /api/consulta, con
 * la trampa para bots, Turnstile (invisible salvo que Cloudflare dude) y la
 * autorización de la Ley 1581 con su versión (AVISO_VERSION). No cambia el
 * Worker: las respuestas y el origen de la visita viajan en `mensaje` y en
 * `origen`, y Rafael los ve en el aviso de Telegram y en D1.
 *
 * Al guardar, pasa a la página de gracias. El teléfono nunca viaja en la
 * dirección: la página de gracias lee de sessionStorage solo el primer nombre
 * y las tres respuestas, y ahí se mide la conversión (generate_lead), una
 * sola vez.
 */
import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { CORREO, RESPONSABLE, enlaceWhatsApp } from "@/data/contacto";
import { ruta, type Idioma } from "@/i18n/idioma";
import {
  AVISO_VERSION,
  CLAVE_LEAD,
  TURNSTILE_SITE_KEY,
  ROTULOS_ES,
  TEXTOS,
  type Cuando,
  type LeadGuardado,
  type Para,
  type Presupuesto,
} from "@/components/asesoria/textos";

declare global {
  interface Window {
    turnstile?: { reset: (contenedor?: HTMLElement) => void };
  }
}

function evento(datos: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const w = window as unknown as { dataLayer?: unknown[] };
  (w.dataLayer ||= []).push(datos);
}

/**
 * De dónde llegó la visita, sin datos personales: las UTM del enlace del
 * video o, si no las trae, el sitio que la mandó. «youtube · campaña X».
 */
function leerFuente(): { fuente: string; consulta: string } {
  try {
    const q = new URLSearchParams(window.location.search);
    const utm = ["utm_source", "utm_medium", "utm_campaign", "utm_content"]
      .map((k) => [k, (q.get(k) ?? "").slice(0, 60)] as const)
      .filter(([, v]) => v);
    if (utm.length) {
      const m = Object.fromEntries(utm);
      const partes = [m.utm_source, m.utm_medium, m.utm_campaign && `campaña ${m.utm_campaign}`, m.utm_content && `contenido ${m.utm_content}`].filter(Boolean);
      return { fuente: partes.join(" · "), consulta: "?" + utm.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&") };
    }
    const ref = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, "") : "";
    if (ref && ref !== window.location.hostname) return { fuente: `${ref} (sin UTM)`, consulta: "" };
  } catch {
    // Una dirección rara no impide dejar los datos.
  }
  return { fuente: "directo", consulta: "" };
}

const TOTAL = 4;

export default function Captacion({ idioma = "es" }: { idioma?: Idioma }) {
  const t = TEXTOS[idioma];
  const [paso, setPaso] = useState(0);
  const [sentido, setSentido] = useState<"adelante" | "atras">("adelante");
  const [para, setPara] = useState<Para | null>(null);
  const [cuando, setCuando] = useState<Cuando | null>(null);
  const [presupuesto, setPresupuesto] = useState<Presupuesto | null>(null);
  const [nombre, setNombre] = useState("");
  const [contacto, setContacto] = useState("");
  const [autoriza, setAutoriza] = useState(false);
  const [sitio, setSitio] = useState("");
  const [error, setError] = useState("");
  const [estado, setEstado] = useState<"idle" | "enviando" | "error">("idle");
  const [cargarTurnstile, setCargarTurnstile] = useState(false);
  const empezo = useRef(false);
  const titulo = useRef<HTMLHeadingElement>(null);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const fuente = useRef({ fuente: "directo", consulta: "" });

  useEffect(() => {
    fuente.current = leerFuente();
  }, []);

  // Al cambiar de paso, el foco va al título del paso nuevo (lectores de pantalla y teclado).
  useEffect(() => {
    if (empezo.current) titulo.current?.focus({ preventScroll: true });
  }, [paso]);

  const marcarInicio = () => {
    if (empezo.current) return;
    empezo.current = true;
    setCargarTurnstile(true);
    evento({ event: "form_start", formulario: "asesoria" });
  };

  const ir = (n: number) => {
    setSentido(n > paso ? "adelante" : "atras");
    setPaso(n);
    setError("");
  };

  /** Un toque en una opción: se marca, se ve el gesto y pasa solo al siguiente paso. */
  function elegir<K extends string>(valor: K, fijar: (v: K) => void, nombrePaso: string) {
    marcarInicio();
    fijar(valor);
    evento({ event: "asesoria_paso", paso: nombrePaso, respuesta: valor });
    window.setTimeout(() => ir(paso + 1), 220);
  }

  /** Las respuestas en el idioma de la página, para WhatsApp. */
  const resumenVisible = () => {
    const b = (lista: { valor: string; texto: string }[], v: string | null) => lista.find((o) => o.valor === v)?.texto;
    return [b(t.preguntas.para.opciones, para), b(t.preguntas.cuando.opciones, cuando), b(t.preguntas.presupuesto.opciones, presupuesto)]
      .filter(Boolean)
      .join(" · ");
  };

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (nombre.trim().length < 2) return setError(t.faltaNombre);
    if (contacto.replace(/\D/g, "").length < 7) return setError(t.faltaWhatsapp);
    if (!autoriza) return setError(t.faltaAutorizacion);
    setError("");
    setEstado("enviando");

    const token = turnstileRef.current?.querySelector<HTMLInputElement>('input[name="cf-turnstile-response"]')?.value ?? "";
    const f = fuente.current;
    try {
      const r = await fetch("/api/consulta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          contacto: contacto.trim(),
          proyecto: "Asesoría · página de captación",
          mensaje: [
            `Llegó por: ${f.fuente}`,
            para ? ROTULOS_ES.para[para] : null,
            cuando ? `Cuándo: ${ROTULOS_ES.cuando[cuando]}` : null,
            presupuesto ? `Presupuesto: ${ROTULOS_ES.presupuesto[presupuesto]}` : null,
            idioma === "en" ? "Escribió desde la página en inglés" : null,
          ]
            .filter(Boolean)
            .join("\n"),
          tipo: "consulta",
          autoriza: true,
          version_aviso: AVISO_VERSION,
          origen: `${window.location.pathname}${f.consulta}`.slice(0, 200),
          sitio,
          turnstile: token,
        }),
      });
      if (!r.ok) throw new Error(String(r.status));
      const guardado: LeadGuardado = {
        nombre: nombre.trim().split(/\s+/)[0].slice(0, 40),
        para: para ?? "ambas",
        cuando: cuando ?? "explorando",
        presupuesto: presupuesto ?? "no-se",
        fuente: f.fuente.split(" · ")[0].slice(0, 40),
      };
      try {
        sessionStorage.setItem(CLAVE_LEAD, JSON.stringify(guardado));
      } catch {
        // Sin sessionStorage la página de gracias sale sin el nombre: no pasa nada.
      }
      window.location.assign(ruta(idioma, "/asesoria/gracias"));
    } catch {
      setEstado("error");
      setError(t.fallo);
      if (turnstileRef.current) window.turnstile?.reset(turnstileRef.current);
    }
  }

  const progreso = ((paso + (paso === 3 ? 0.5 : 0)) / (TOTAL - 0.5)) * 100;

  const opciones = <K extends string>(
    lista: { valor: K; texto: string; nota?: string }[],
    actual: K | null,
    fijar: (v: K) => void,
    nombrePaso: string,
    columnas = false,
  ) => (
    <div className={`ase-opciones${columnas ? " ase-opciones-col" : ""}`}>
      {lista.map((o, i) => (
        <button
          key={o.valor}
          type="button"
          className="ase-opcion"
          aria-pressed={actual === o.valor}
          style={{ ["--i" as string]: i }}
          onClick={() => elegir(o.valor, fijar, nombrePaso)}
        >
          <span className="ase-opcion-texto">{o.texto}</span>
          {o.nota && <span className="ase-opcion-nota">{o.nota}</span>}
          <span className="ase-opcion-flecha" aria-hidden="true">
            →
          </span>
        </button>
      ))}
    </div>
  );

  const pasos = [
    { titulo: t.preguntas.para.titulo, cuerpo: opciones(t.preguntas.para.opciones, para, setPara, "para") },
    { titulo: t.preguntas.cuando.titulo, cuerpo: opciones(t.preguntas.cuando.opciones, cuando, setCuando, "cuando", true) },
    {
      titulo: t.preguntas.presupuesto.titulo,
      nota: t.preguntas.presupuesto.nota,
      cuerpo: opciones(t.preguntas.presupuesto.opciones, presupuesto, setPresupuesto, "presupuesto", true),
    },
  ];

  return (
    <div className="ase-tarjeta" onFocusCapture={() => setCargarTurnstile(true)}>
      {cargarTurnstile && <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />}

      <div className="ase-cabeza">
        <span className="ase-contador">{t.paso(paso + 1, TOTAL)}</span>
        {paso > 0 && (
          <button type="button" className="ase-atras" onClick={() => ir(paso - 1)}>
            ← {t.atras}
          </button>
        )}
      </div>
      <div className="ase-barra" aria-hidden="true">
        <span style={{ width: `${Math.max(6, progreso)}%` }} />
      </div>

      <div className={`ase-paso ase-paso-${sentido}`} key={paso}>
        {paso < 3 ? (
          <>
            <h2 ref={titulo} tabIndex={-1}>
              {pasos[paso].titulo}
            </h2>
            {"nota" in pasos[paso] && pasos[paso].nota && <p className="ase-nota">{pasos[paso].nota}</p>}
            {pasos[paso].cuerpo}
          </>
        ) : (
          <form className="ase-form" onSubmit={enviar} noValidate>
            <h2 ref={titulo} tabIndex={-1}>
              {t.datosTitulo}
            </h2>
            <p className="ase-nota">{t.datosLede}</p>
            <p className="ase-elegido">{resumenVisible()}</p>

            <label className="ase-campo">
              <span>{t.nombre}</span>
              <input type="text" name="nombre" autoComplete="name" placeholder={t.nombrePlaceholder} value={nombre} onChange={(e) => setNombre(e.target.value)} required />
            </label>
            <label className="ase-campo">
              <span>{t.whatsapp}</span>
              <input
                type="tel"
                name="contacto"
                inputMode="tel"
                autoComplete="tel"
                placeholder={t.whatsappPlaceholder}
                value={contacto}
                onChange={(e) => setContacto(e.target.value)}
                required
              />
              <small>{t.whatsappAyuda}</small>
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
              className="ase-trampa"
            />

            <label className="ase-autoriza">
              <input type="checkbox" name="autoriza" checked={autoriza} onChange={(e) => setAutoriza(e.target.checked)} />
              <span>
                {t.autorizo}
                {RESPONSABLE}
                {t.tratar}
                {t.conforme}{" "}
                <a href={ruta(idioma, "/privacidad")} target="_blank" rel="noopener noreferrer">
                  {t.politica}
                </a>
                {t.derechos}
                {CORREO}.
              </span>
            </label>

            {error && (
              <p className="ase-error" role="alert">
                {error}
                {estado === "error" && (
                  <>
                    {" "}
                    <a href={enlaceWhatsApp(t.waFallo(nombre.trim(), resumenVisible()))} target="_blank" rel="noopener noreferrer">
                      {t.falloWhatsapp}
                    </a>
                  </>
                )}
              </p>
            )}

            <button type="submit" className="ase-enviar" disabled={estado === "enviando"}>
              {estado === "enviando" ? t.enviando : t.enviar}
              <span aria-hidden="true">→</span>
            </button>
          </form>
        )}
      </div>

      <div ref={turnstileRef} className="cf-turnstile ase-turnstile" data-sitekey={TURNSTILE_SITE_KEY} data-appearance="interaction-only" data-language={idioma} data-theme="light" />
    </div>
  );
}
