import PaginaComparar, { metadataComparar } from "@/components/paginas/PaginaComparar";

/** /comparar — la página vive en src/components/paginas/PaginaComparar.tsx, compartida con /en/compare. */
export const metadata = metadataComparar("es");

export default function Pagina() {
  return <PaginaComparar idioma="es" />;
}
