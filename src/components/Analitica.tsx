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
 *  2. Si hay con qué medir (GTM o GA4) y la persona no ha decidido, muestra
 *     el aviso.
 *  3. Solo con «Aceptar» carga la medición, con el consentimiento de Google ya
 *     concedido: GTM si hay contenedor; si no, GA4 directo (gtag.js), al que se
 *     le pasan los eventos de la capa de datos. Con «Rechazar» no se carga
 *     nada: los eventos se quedan en la página y no salen a ningún lado.
 *
 * GA4 directo (1-oct-2026, pedido de Rafael). Probado en Chrome con gtag.js,
 * interceptando cada envío:
 *  · la dirección que manda (page_location) va sin el «#», y un cambio solo del
 *    «#» no cuenta como página vista: el escenario del simulador no sale;
 *  · los clics salientes y el destino de los formularios sí van con la
 *    dirección completa. Por eso el simulador fija el `action` de su formulario
 *    y detiene el clic de sus enlaces de WhatsApp antes de que GA4 lo escuche
 *    (src/components/simulador/analitica.ts).
 *
 * El idioma (29-sep-2026, sitio en inglés): el aviso vive en el layout raíz y
 * no recibe props. Lee `<html lang>` cada vez que se muestra, y en inglés
 * enlaza a /en/privacy. El consentimiento es el mismo en los dos idiomas.
 */
import { useEffect, useState } from "react";
import { CLAVE_CONSENTIMIENTO, GA4_ID, GTM_ID, HAY_ANALITICA, VERSION_AVISO_COOKIES } from "@/data/analitica";
import { ruta, type Idioma } from "@/i18n/idioma";
import "@/styles/cookies.css";

const TEXTOS = {
  es: {
    region: "Aviso de cookies",
    aviso:
      "Usamos cookies de Google y de Meta para medir las visitas y mostrar anuncios de nuestros proyectos. Sin tu autorización no se carga nada.",
    politica: "Política de datos",
    rechazar: "Rechazar",
    aceptar: "Aceptar",
  },
  en: {
    region: "Cookie notice",
    aviso:
      "We use Google and Meta cookies to measure visits and show ads for our projects. Nothing loads without your authorization.",
    politica: "Privacy policy",
    rechazar: "Reject",
    aceptar: "Accept",
  },
} satisfies Record<Idioma, Record<string, string>>;

/** El idioma de la página en la que se muestra el aviso. */
function idiomaDeLaPagina(): Idioma {
  return document.documentElement.lang === "en" ? "en" : "es";
}

type Decision = "aceptado" | "rechazado";
type Gtag = (...args: unknown[]) => void;
type W = Window & { dataLayer?: unknown[]; __rhfGtm?: boolean; __rhfGa4?: boolean; gtag?: Gtag };

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

/**
 * Un evento del sitio ({ event, ...datos }) como evento de GA4. Lo demás se
 * ignora: los comandos de gtag (llegan como `arguments`) y los internos de
 * Google («gtm.dom», «gtm.load»…), que no tienen nombre válido de GA4.
 */
function eventoParaGA4(gtag: Gtag, item: unknown) {
  if (!item || typeof item !== "object" || Array.isArray(item)) return;
  const { event, ...datos } = item as Record<string, unknown>;
  if (typeof event !== "string" || !/^[a-z][a-z0-9_]{0,39}$/i.test(event)) return;
  gtag("event", event, datos);
}

/**
 * Carga GA4 directo (gtag.js) una sola vez, con el consentimiento de Google
 * concedido, y le pasa los eventos de la capa de datos: los que ya estaban en
 * la página (como hace GTM al cargar) y los que vengan.
 */
function cargarGA4() {
  const w = window as W;
  if (!GA4_ID || w.__rhfGa4) return;
  w.__rhfGa4 = true;
  const capa = (w.dataLayer ||= []);
  // gtag.js solo lee los comandos que llegan como `arguments`.
  // eslint-disable-next-line prefer-rest-params
  const gtag: Gtag = function (..._args: unknown[]) {
    // eslint-disable-next-line prefer-rest-params
    (w.dataLayer as unknown[]).push(arguments);
  };
  w.gtag = gtag;
  gtag("consent", "default", {
    ad_storage: "granted",
    analytics_storage: "granted",
    ad_user_data: "granted",
    ad_personalization: "granted",
  });
  gtag("js", new Date());
  gtag("config", GA4_ID);
  const previos = capa.slice();
  const empujarEnLaCapa = capa.push.bind(capa);
  capa.push = (...items: unknown[]) => {
    const n = empujarEnLaCapa(...items);
    for (const item of items) eventoParaGA4(gtag, item);
    return n;
  };
  for (const item of previos) eventoParaGA4(gtag, item);
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA4_ID)}`;
  document.head.appendChild(s);
}

/** Lo que se carga con «Aceptar»: GTM si hay contenedor; si no, GA4 directo. */
function cargarMedicion() {
  if (GTM_ID) cargarGTM();
  else cargarGA4();
}

/** El nombre del proyecto a partir de la ruta: /proyectos/doral-west/brochure.pdf → doral-west. */
function proyectoDe(camino: string): string {
  const m = camino.match(/\/(?:en\/)?(?:proyectos|projects|inmuebles|properties)\/([^/]+)/);
  return m ? m[1] : camino;
}

export default function Analitica() {
  // El aviso abierto, en el idioma de la página; null mientras no se pregunta.
  const [aviso, setAviso] = useState<Idioma | null>(null);

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
    if (!HAY_ANALITICA) return;
    const d = leerDecision();
    if (d === "aceptado") cargarMedicion();
    // El idioma se lee al mostrar el aviso: en el cliente, nunca en el build.
    const preguntar = () => setAviso(idiomaDeLaPagina());
    if (d === null) preguntar();
    window.addEventListener("rhf-preferencias-cookies", preguntar);
    return () => window.removeEventListener("rhf-preferencias-cookies", preguntar);
  }, []);

  if (aviso === null) return null;

  const decidir = (estado: Decision) => {
    guardarDecision(estado);
    setAviso(null);
    if (estado === "aceptado") cargarMedicion();
  };

  const t = TEXTOS[aviso];
  return (
    <div className="aviso-cookies" role="region" aria-label={t.region}>
      <p>
        {t.aviso}{" "}
        <a href={ruta(aviso, "/privacidad")}>{t.politica}</a>
      </p>
      <div className="aviso-cookies-botones">
        <button type="button" onClick={() => decidir("rechazado")}>
          {t.rechazar}
        </button>
        <button type="button" className="aceptar" onClick={() => decidir("aceptado")}>
          {t.aceptar}
        </button>
      </div>
    </div>
  );
}
