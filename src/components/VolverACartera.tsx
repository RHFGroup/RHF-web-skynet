"use client";

import Link from "next/link";
import { IconoFlechaIzq } from "@/components/Iconos";
import { ruta, type Idioma } from "@/i18n/idioma";
import { olvidarSalida, vieneDeLaCartera } from "@/lib/volver";

/**
 * «Volver a la cartera». Si la persona vino desde la cartera en esta misma
 * pestaña, vuelve con el historial: la home reaparece donde la dejó. Si llegó
 * por un enlace compartido, la lleva a la cartera.
 *
 * 29-sep-2026 (sitio en inglés): `href` se escribe en español y pasa por
 * `ruta()`, así que en /en lleva a la cartera en inglés; el texto va en el
 * idioma de la página.
 */
const TEXTOS = {
  es: { texto: "Volver a la cartera" },
  en: { texto: "Back to portfolio" },
} satisfies Record<Idioma, Record<string, string>>;

export default function VolverACartera({
  className = "pp-volver",
  href = "/#cartera",
  texto,
  idioma = "es",
}: {
  className?: string;
  /** A dónde lleva cuando no hay historial, en español: la cartera o los inmuebles. */
  href?: string;
  texto?: string;
  idioma?: Idioma;
}) {
  return (
    <Link
      href={ruta(idioma, href)}
      className={className}
      onClick={(e) => {
        if (vieneDeLaCartera() && window.history.length > 1) {
          e.preventDefault();
          olvidarSalida();
          window.history.back();
        }
      }}
    >
      <IconoFlechaIzq size={16} /> {texto ?? TEXTOS[idioma].texto}
    </Link>
  );
}
