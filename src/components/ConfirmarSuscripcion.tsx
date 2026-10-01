"use client";

/**
 * La confirmación del boletín (30-sep-2026, Prompt 3 de Luciano, fase 1).
 *
 * El correo de confirmación trae un enlace a esta página con el token en el
 * fragmento (`#t=…`), que no llega a ningún servidor. La página no confirma
 * sola: muestra un botón, y solo al tocarlo manda el token al Worker (POST
 * /api/suscripcion/confirmar). Los programas que revisan los enlaces de los
 * correos abren la página, pero no tocan botones: así nadie queda suscrito sin
 * pedirlo.
 */
import Link from "next/link";
import { useEffect, useState } from "react";
import { ruta, type Idioma } from "@/i18n/idioma";

const TEXTOS = {
  es: {
    leyendo: "Un momento…",
    titulo: "Confirma tu suscripción",
    bajada: "Un paso más para recibir el boletín de noticias de la Zona Norte.",
    confirmar: "Confirmar mi suscripción",
    confirmando: "Confirmando…",
    listoTitulo: "Listo, ya estás en la lista.",
    listoBajada:
      "Te llegará el próximo boletín con las noticias de la Zona Norte. Cuando quieras darte de baja, responde BAJA a cualquier boletín.",
    verMercado: "Ver la inteligencia de mercado",
    vencidoTitulo: "Este enlace venció.",
    vencidoBajada: "Los enlaces de confirmación valen siete días. Suscríbete otra vez y te mandamos uno nuevo.",
    invalidoTitulo: "Este enlace no sirve.",
    invalidoBajada: "Puede que esté incompleto. Abre otra vez el enlace del correo, o suscríbete de nuevo.",
    suscribirme: "Suscribirme otra vez",
    errorTitulo: "No pudimos confirmar tu suscripción.",
    errorBajada: "Intenta de nuevo en un momento.",
    reintentar: "Intentar de nuevo",
    volver: "← Volver a rhfliving.com",
  },
  en: {
    leyendo: "One moment…",
    titulo: "Confirm your subscription",
    bajada: "One more step to receive the newsletter with news from the Zona Norte.",
    confirmar: "Confirm my subscription",
    confirmando: "Confirming…",
    listoTitulo: "Done, you're on the list.",
    listoBajada:
      "You'll get the next newsletter with news from the Zona Norte. Whenever you want to unsubscribe, reply BAJA to any newsletter.",
    verMercado: "See the market intelligence",
    vencidoTitulo: "This link has expired.",
    vencidoBajada: "Confirmation links are valid for seven days. Subscribe again and we'll send you a new one.",
    invalidoTitulo: "This link doesn't work.",
    invalidoBajada: "It may be incomplete. Open the link in the email again, or subscribe again.",
    suscribirme: "Subscribe again",
    errorTitulo: "We couldn't confirm your subscription.",
    errorBajada: "Please try again in a moment.",
    reintentar: "Try again",
    volver: "← Back to rhfliving.com",
  },
} satisfies Record<Idioma, Record<string, string>>;

type Estado = "leyendo" | "listo" | "enviando" | "confirmada" | "vencido" | "invalido" | "error";

/** Empuja un evento a la capa de datos de la analítica (src/components/Analitica.tsx). */
function registrarEvento(datos: Record<string, unknown>) {
  const w = window as unknown as { dataLayer?: unknown[] };
  (w.dataLayer ||= []).push(datos);
}

export default function ConfirmarSuscripcion({ idioma = "es" }: { idioma?: Idioma }) {
  const t = TEXTOS[idioma];
  const [estado, setEstado] = useState<Estado>("leyendo");
  const [token, setToken] = useState("");

  useEffect(() => {
    const m = window.location.hash.match(/(?:^#|&)t=([A-Za-z0-9_-]{43})(?:&|$)/);
    if (m) {
      setToken(m[1]);
      setEstado("listo");
    } else {
      setEstado("invalido");
    }
  }, []);

  async function confirmar() {
    if (!token || estado === "enviando") return;
    setEstado("enviando");
    try {
      const r = await fetch("/api/suscripcion/confirmar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ t: token, idioma }),
      });
      if (r.ok) {
        setEstado("confirmada");
        registrarEvento({ event: "newsletter_confirm", formulario: "boletin", idioma });
        // El token ya se usó: sale de la barra de direcciones y del historial.
        window.history.replaceState(null, "", window.location.pathname);
        return;
      }
      setEstado(r.status === 410 ? "vencido" : r.status === 404 || r.status === 400 ? "invalido" : "error");
    } catch {
      setEstado("error");
    }
  }

  const suscribirse = ruta(idioma, "/#noticias");
  let titulo: string = t.titulo;
  let bajada: string = t.bajada;
  let acciones: React.ReactNode = null;

  if (estado === "leyendo") {
    titulo = t.titulo;
    bajada = t.leyendo;
  } else if (estado === "listo" || estado === "enviando") {
    acciones = (
      <button type="button" className="suscripcion-boton" onClick={confirmar} disabled={estado === "enviando"}>
        {estado === "enviando" ? t.confirmando : t.confirmar}
      </button>
    );
  } else if (estado === "confirmada") {
    titulo = t.listoTitulo;
    bajada = t.listoBajada;
    acciones = <Link href={ruta(idioma, "/inteligencia-de-mercado")}>{t.verMercado}</Link>;
  } else if (estado === "vencido") {
    titulo = t.vencidoTitulo;
    bajada = t.vencidoBajada;
    acciones = <Link href={suscribirse}>{t.suscribirme}</Link>;
  } else if (estado === "invalido") {
    titulo = t.invalidoTitulo;
    bajada = t.invalidoBajada;
    acciones = <Link href={suscribirse}>{t.suscribirme}</Link>;
  } else {
    titulo = t.errorTitulo;
    bajada = t.errorBajada;
    acciones = (
      <button type="button" className="suscripcion-boton" onClick={confirmar}>
        {t.reintentar}
      </button>
    );
  }

  return (
    <main className="boletin-confirmar">
      <div className="suscripcion" role={estado === "listo" || estado === "leyendo" ? undefined : "status"}>
        <div>
          <h1 className="suscripcion-titulo">{titulo}</h1>
          <p className="suscripcion-bajada">{bajada}</p>
          {acciones && <div className="boletin-confirmar-acciones">{acciones}</div>}
          <Link className="boletin-confirmar-volver" href={ruta(idioma, "/")}>
            {t.volver}
          </Link>
        </div>
      </div>
    </main>
  );
}
