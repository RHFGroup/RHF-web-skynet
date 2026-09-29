import Link from "next/link";
import "@/styles/legal.css";
import type { ReactNode } from "react";
import { fechaLarga, ruta, type Idioma } from "@/i18n/idioma";

export const RESPONSABLE = {
  nombreLegal: "Medardo Rafael Hernández Franco",
  nombreComercial: "Rafael Hernández Franco · Asesor Inmobiliario",
  direccion:
    "Carrera 14 # 45-27, Km 4, La Boquilla, Cartagena de Indias, Bolívar, Colombia",
  correo: "rafaelhf.realestate@gmail.com",
  telefono: "+57 300 841 2677",
  sitio: "rhfliving.com",
};

/** Desde cuándo rigen las páginas legales que no traen su propia fecha (AAAA-MM-DD). */
const VIGENCIA_ISO = "2026-09-18";

/** «18 de septiembre de 2026». */
export const VIGENCIA = fechaLarga(VIGENCIA_ISO, "es");

/**
 * Los textos fijos de la página, en los dos idiomas (docs/i18n.md). El español
 * es el de siempre, sin cambiar una coma: su HTML sale idéntico.
 */
type Textos = {
  volver: string;
  /** «Vigente desde el …»: la fecha va en medio, como un nodo aparte. */
  vigenteAntes: string;
  vigenteDespues: string;
  politica: string;
  terminos: string;
  /**
   * La nota de arriba en las traducciones: son de cortesía y la que obliga es
   * la versión en español. El original no la lleva.
   */
  traduccion: { antes: string; enlace: string; despues: string } | null;
};

const TEXTOS: Record<Idioma, Textos> = {
  es: {
    volver: "← Volver a rhfliving.com",
    vigenteAntes: "Vigente desde el ",
    vigenteDespues: ". Esta versión reemplaza cualquier publicación anterior.",
    politica: "Política de tratamiento de datos",
    terminos: "Términos de uso",
    traduccion: null,
  },
  en: {
    volver: "← Back to rhfliving.com",
    vigenteAntes: "Effective as of ",
    vigenteDespues: ". This version replaces any previous publication.",
    politica: "Personal data processing policy",
    terminos: "Terms of use",
    traduccion: {
      antes: "This is a courtesy translation. The ",
      enlace: "Spanish version",
      despues: " is the legally binding one.",
    },
  },
};

export default function LegalPage({
  titulo,
  bajada,
  idioma = "es",
  vigencia = fechaLarga(VIGENCIA_ISO, idioma),
  rutaEs,
  children,
}: {
  titulo: string;
  bajada: string;
  /**
   * Desde cuándo rige esta versión, si cambió después de la fecha común. En
   * una traducción, la fecha de la versión en español que traduce.
   */
  vigencia?: string;
  children: ReactNode;
} & (
  | { idioma?: "es"; rutaEs?: string }
  | {
      /** Una traducción de cortesía de la página en español. */
      idioma: Exclude<Idioma, "es">;
      /**
       * La ruta de la versión en español, la que obliga («/privacidad»): la
       * nota de arriba enlaza a ella. En una traducción es obligatoria.
       */
      rutaEs: string;
    }
)) {
  const t = TEXTOS[idioma];
  const volver = (
    <Link
      href={ruta(idioma, "/")}
      className="legal-volver text-sm font-medium tracking-wide text-cuero hover:underline"
    >
      {t.volver}
    </Link>
  );
  return (
    <main className="min-h-screen bg-marfil text-marino">
      <div className="mx-auto w-full max-w-3xl px-5 py-16 sm:px-8 sm:py-24">
        {/* La nota de las traducciones va debajo de «volver», en el mismo
            lugar del árbol: así el español no gana ni un hueco (`null`) y su
            HTML, con el payload de React, sale idéntico. El enlace va con <a>
            y no con <Link>: cambiar de idioma es cargar la página completa,
            para que <html lang> quede bien desde el primer pintado (ver
            SelectorIdioma.tsx). */}
        {t.traduccion && rutaEs ? (
          <>
            {volver}
            <p
              role="note"
              className="mt-8 rounded-xl border border-camel/60 bg-blanco/60 px-4 py-3 text-sm leading-relaxed text-marino/85"
            >
              {t.traduccion.antes}
              <a href={rutaEs} hrefLang="es" className="font-medium text-cuero underline">
                {t.traduccion.enlace}
              </a>
              {t.traduccion.despues}
            </p>
          </>
        ) : (
          volver
        )}

        <h1 className="mt-8 font-serif text-4xl leading-tight sm:text-5xl">
          {titulo}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-marino/80">{bajada}</p>
        <p className="mt-6 border-t border-marino/15 pt-6 text-sm text-marino/60">
          {t.vigenteAntes}
          {vigencia}
          {t.vigenteDespues}
        </p>

        <article className="legal-body mt-10 space-y-8">{children}</article>

        <footer className="mt-16 border-t border-marino/15 pt-8 text-sm text-marino/60">
          <p>
            {RESPONSABLE.nombreLegal} — {RESPONSABLE.nombreComercial}.{" "}
            {RESPONSABLE.direccion}. {RESPONSABLE.correo} ·{" "}
            {RESPONSABLE.telefono}.
          </p>
          <p className="mt-3">
            <Link href={ruta(idioma, "/privacidad")} className="hover:underline">
              {t.politica}
            </Link>{" "}
            ·{" "}
            <Link href={ruta(idioma, "/terminos")} className="hover:underline">
              {t.terminos}
            </Link>
          </p>
        </footer>
      </div>
    </main>
  );
}

export function Seccion({
  id,
  titulo,
  children,
}: {
  id?: string;
  titulo: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="font-serif text-2xl leading-snug sm:text-3xl">{titulo}</h2>
      <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-marino/85">
        {children}
      </div>
    </section>
  );
}
