import PaginaAsesoria, { metadataAsesoria } from "@/components/paginas/PaginaAsesoria";

/** /asesoria — la página de captación para quien llega de un video (src/components/paginas/PaginaAsesoria.tsx). */
export const metadata = metadataAsesoria("es");

export default function Pagina() {
  return <PaginaAsesoria idioma="es" />;
}
