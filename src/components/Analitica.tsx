"use client";

/**
 * La capa de datos, el aviso de cookies y Google Tag Manager (29-sep-2026,
 * informe de Luciano). La configuración y los nombres de los eventos están en
 * src/data/analitica.ts.
 *
 *  1. Escucha los clics de toda la página (una sola escucha, en captura) y
 *     empuja a `dataLayer`: WhatsApp (cualquier enlace a wa.me), brochures
 *     (cualquier enlace a un .pdf) y «Quiero vender / consignar» (los enlaces
 *     con data-evento). Los formularios empujan su propio evento al enviarse.
 *  2. Si hay contenedor de GTM y la persona no ha decidido, muestra el aviso.
 *  3. Solo con «Aceptar» carga GTM, con el consentimiento de Google ya
 *     concedido. Con «Rechazar» no se carga nada: los eventos se quedan en la
 *     página y no salen a ningún lado.
 */
import { useEffect, useState } from "react";
import { CLAVE_CONSENTIMIENTO, GTM_ID, VERSION_AVISO_COOKIES } from "@/data/analitica";
import "@/styles/cookies.css";

type Decision = "aceptado" | "rechazado";
type W = Window & { dataLayer?: unknown[]; __rhfGtm?: boolean };

function empujar(datos: Record<string, unknown>) {
  const w = window as W;
  (w.dataLayer ||= []).push(datos);
}

function leerDecision(): Decision | null {
  try {
    const d = JSON.parse(localStorage.getItem(CLAVE_CONSENTIMIENTO) ?? "null") as
      | { estado?: string; version?: string }
      | null;
    if (d?.version === VERSION_AVISO_COOKIES && (d.estado === "aceptado" || d.estado === "rechazado")) {
      return d.estado;
    }
  } catch {
    /* sin almacenamiento: se pregunta */
  }
  return null;
}

function guardarDecision(estado: Decision) {
  try {
    localStorage.setItem(
      CLAVE_CONSENTIMIENTO,
      JSON.stringify({ estado, version: VERSION_AVISO_COOKIES, fecha: new Date().toISOString() }),
    );
  } catch {
    /* vale para esta visita */
  }
}

/** Carga GTM una sola vez, con el consentimiento de Google concedido. */
function cargarGTM() {
  const w = window as W;
  if (!GTM_ID || w.__rhfGtm) return;
  w.__rhfGtm = true;
  w.dataLayer ||= [];
  // gtag('consent', ...) con la firma que espera Google.
  // eslint-disable-next-line prefer-rest-params
  const gtag = function (..._args: unknown[]) {
    // eslint-disable-next-line prefer-rest-params
    (w.dataLayer as unknown[]).push(arguments);
  };
  gtag("consent", "default", {
    ad_storage: "granted",
    analytics_storage: "granted",
    ad_user_data: "granted",
    ad_personalization: "granted",
  });
  w.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(GTM_ID)}`;
  document.head.appendChild(s);
}

/** El nombre del proyecto a partir de la ruta: /proyectos/doral-west/brochure.pdf → doral-west. */
function proyectoDe(ruta: string): string {
  const m = ruta.match(/\/(?:en\/)?(?:proyectos|projects|inmuebles|properties)\/([^/]+)/);
  return m ? m[1] : ruta;
}

export default function Analitica() {
  const [preguntar, setPreguntar] = useState(false);

  // Los clics: WhatsApp, brochures y «Quiero vender».
  useEffect(() => {
    const alClic = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a") as HTMLAnchorElement | null;
      if (!a) return;
      const href = a.getAttribute("href") ?? "";
      const ubicacion = a.dataset.ubicacion ?? "";
      const pagina = location.pathname;
      if (/wa\.me\//.test(href)) {
        empujar({
          event: "click_whatsapp",
          method: "whatsapp",
          type: "lead_inmobiliario",
          link_url: href.split("?")[0],
          page_path: pagina,
          ubicacion,
        });
        if (a.dataset.lead === "consignar") empujar({ event: "lead_consignar", metodo: "whatsapp" });
      } else if (/\.pdf(?:$|[?#])/i.test(href)) {
        const url = new URL(href, location.href);
        empujar({
          event: "descarga_brochure",
          file_name: url.pathname.split("/").pop() ?? "",
          project_name: proyectoDe(url.pathname),
          link_url: url.pathname,
          page_path: pagina,
        });
      }
      if (a.dataset.evento === "click_quiero_vender") {
        empujar({ event: "click_quiero_vender", ubicacion });
      }
    };
    document.addEventListener("click", alClic, { capture: true });
    return () => document.removeEventListener("click", alClic, { capture: true });
  }, []);

  // El consentimiento.
  useEffect(() => {
    if (!GTM_ID) return;
    const d = leerDecision();
    if (d === "aceptado") cargarGTM();
    if (d === null) setPreguntar(true);
    const reabrir = () => setPreguntar(true);
    window.addEventListener("rhf-preferencias-cookies", reabrir);
    return () => window.removeEventListener("rhf-preferencias-cookies", reabrir);
  }, []);

  if (!preguntar) return null;

  const decidir = (estado: Decision) => {
    guardarDecision(estado);
    setPreguntar(false);
    if (estado === "aceptado") cargarGTM();
  };

  const en = typeof document !== "undefined" && document.documentElement.lang === "en";
  return (
    <div className="aviso-cookies" role="region" aria-label={en ? "Cookies" : "Aviso de cookies"}>
      <p>
        {en
          ? "We use Google and Meta cookies to measure visits and show ads for our projects. Nothing loads without your permission."
          : "Usamos cookies de Google y de Meta para medir las visitas y mostrar anuncios de nuestros proyectos. Sin tu autorización no se carga nada."}{" "}
        <a href={en ? "/en/privacy" : "/privacidad"}>{en ? "Privacy policy" : "Política de datos"}</a>
      </p>
      <div className="aviso-cookies-botones">
        <button type="button" onClick={() => decidir("rechazado")}>
          {en ? "Reject" : "Rechazar"}
        </button>
        <button type="button" className="aceptar" onClick={() => decidir("aceptado")}>
          {en ? "Accept" : "Aceptar"}
        </button>
      </div>
    </div>
  );
}
