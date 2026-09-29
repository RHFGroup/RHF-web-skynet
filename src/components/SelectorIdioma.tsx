import { ruta, type Idioma } from "@/i18n/idioma";
import "@/styles/idioma.css";

/**
 * El selector de idioma del menú: ES | EN (29-sep-2026, informe de Luciano).
 *
 * Son enlaces a la misma página en el otro idioma, no botones: cambiar de
 * idioma es cambiar de página, y así el buscador ve las dos versiones. Van
 * con `<a>` y no con `<Link>`: la página nueva carga completa y el `<html>`
 * queda con su `lang` desde el primer pintado.
 *
 * `rutaEs`: la ruta en español de la página en la que se está.
 */
export default function SelectorIdioma({
  idioma = "es",
  rutaEs,
  className = "",
}: {
  idioma?: Idioma;
  rutaEs: string;
  className?: string;
}) {
  const opciones: { id: Idioma; texto: string; nombre: string }[] = [
    { id: "es", texto: "ES", nombre: "Español" },
    { id: "en", texto: "EN", nombre: "English" },
  ];
  return (
    <nav
      className={`selector-idioma ${className}`.trim()}
      aria-label={idioma === "en" ? "Language" : "Idioma"}
    >
      {opciones.map((o) =>
        o.id === idioma ? (
          <span key={o.id} aria-current="page" lang={o.id} title={o.nombre}>
            {o.texto}
          </span>
        ) : (
          <a key={o.id} href={ruta(o.id, rutaEs)} hrefLang={o.id} lang={o.id} title={o.nombre}>
            {o.texto}
          </a>
        ),
      )}
    </nav>
  );
}
