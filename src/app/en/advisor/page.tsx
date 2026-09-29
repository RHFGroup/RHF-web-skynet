import PaginaDelAsesor, { metadataAsesor } from "@/components/paginas/PaginaDelAsesor";

/** /en/advisor — la misma página que /asesor, en inglés. */
export const metadata = metadataAsesor("en");

export default function Pagina() {
  return <PaginaDelAsesor idioma="en" />;
}
