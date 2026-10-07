import PaginaAsesoria, { metadataAsesoria } from "@/components/paginas/PaginaAsesoria";

/** /en/lets-talk — la página de captación en inglés: la misma que /asesoria. */
export const metadata = metadataAsesoria("en");

export default function Pagina() {
  return <PaginaAsesoria idioma="en" />;
}
