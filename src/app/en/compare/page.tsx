import PaginaComparar, { metadataComparar } from "@/components/paginas/PaginaComparar";

/** /en/compare — el comparador: la misma página que /comparar, en inglés. */
export const metadata = metadataComparar("en");

export default function Pagina() {
  return <PaginaComparar idioma="en" />;
}
