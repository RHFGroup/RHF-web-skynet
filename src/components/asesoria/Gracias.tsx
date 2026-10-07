"use client";

/**
 * LA PÁGINA DE GRACIAS DE LA CAPTACIÓN (/asesoria/gracias y /en/lets-talk/thank-you)
 *
 * Decisión de Rafael del 7-oct-2026: sin plazo de respuesta y con un botón
 * para escribirle ya por WhatsApp, con lo que la persona contestó.
 *
 * La conversión (`generate_lead`) se mide AQUÍ y no en el formulario: la
 * navegación corta los envíos a GA4 que salen justo antes de irse. Se mide
 * una sola vez por lead (la marca `medido` en sessionStorage), así que
 * recargar la página no la duplica, y quien llega sin haber dejado datos no
 * la dispara. Nunca viajan el nombre ni el teléfono: solo el formulario y la
 * fuente (utm_source).
 */
import { useEffect, useState } from "react";
import { enlaceWhatsApp } from "@/data/contacto";
import { REDES } from "@/data/redes";
import { ruta, type Idioma } from "@/i18n/idioma";
import { CLAVE_LEAD, TEXTOS, type LeadGuardado } from "@/components/asesoria/textos";

export default function Gracias({ idioma = "es" }: { idioma?: Idioma }) {
  const t = TEXTOS[idioma];
  const [lead, setLead] = useState<LeadGuardado | null>(null);

  useEffect(() => {
    try {
      const crudo = sessionStorage.getItem(CLAVE_LEAD);
      if (!crudo) return;
      const l = JSON.parse(crudo) as LeadGuardado;
      setLead(l);
      if (!l.medido) {
        const w = window as unknown as { dataLayer?: unknown[] };
        (w.dataLayer ||= []).push({ event: "generate_lead", formulario: "asesoria", fuente: l.fuente || "directo" });
        sessionStorage.setItem(CLAVE_LEAD, JSON.stringify({ ...l, medido: true }));
      }
    } catch {
      // Sin sessionStorage, la página sale igual, sin el nombre.
    }
  }, []);

  const texto = (lista: { valor: string; texto: string }[], v?: string) => lista.find((o) => o.valor === v)?.texto;
  const respuestas = lead
    ? [
        texto(t.preguntas.para.opciones, lead.para),
        texto(t.preguntas.cuando.opciones, lead.cuando),
        texto(t.preguntas.presupuesto.opciones, lead.presupuesto),
      ].filter((x): x is string => !!x)
    : [];
  const wa = respuestas.length ? t.waGracias(respuestas.join(" · ") + ".") : t.waSinResumen;

  return (
    <div className="ase-gracias">
      <svg className="ase-check" viewBox="0 0 52 52" aria-hidden="true">
        <circle cx="26" cy="26" r="24" />
        <path d="M15 27l7 7 15-15" />
      </svg>
      <h1>{lead?.nombre ? t.listo(lead.nombre) : t.listoSinNombre}</h1>
      <p className="ase-gracias-lede">{t.recibido}</p>

      {respuestas.length > 0 && (
        <div className="ase-gracias-resumen">
          <p>{t.tuResumen}</p>
          <ul>
            {respuestas.map((r, i) => (
              <li key={r} style={{ ["--i" as string]: i }}>
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      <a className="ase-wa" href={enlaceWhatsApp(wa)} target="_blank" rel="noopener noreferrer" data-ubicacion="asesoria-gracias">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.46-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.27.49 1.7.63.72.23 1.37.2 1.88.12.58-.09 1.76-.72 2.01-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35M12.04 21.25a9.68 9.68 0 0 1-4.93-1.35l-.35-.21-3.67.96.98-3.57-.23-.37a9.68 9.68 0 1 1 8.2 4.54" />
        </svg>
        {t.escribirYa}
      </a>

      <div className="ase-mientras">
        <p className="ase-mientras-titulo">{t.mientras}</p>
        <a className="ase-mientras-tarjeta" href={ruta(idioma, "/simulador")}>
          <strong>{t.simulador} →</strong>
          <span>{t.simuladorTexto}</span>
        </a>
        {REDES.map((r) => (
          <a key={r.id} className="ase-mientras-tarjeta" href={r.url} target="_blank" rel="noopener noreferrer">
            <strong>
              {t.redes} · {r.nombre} →
            </strong>
            <span>{r.usuario}</span>
          </a>
        ))}
      </div>

      <a className="ase-volver" href={ruta(idioma, "/")}>
        {t.volver}
      </a>
    </div>
  );
}
