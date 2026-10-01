import PaginaDelAsesor, { metadataAsesor } from "@/components/paginas/PaginaDelAsesor";

/** /asesor — la página vive en src/components/paginas/PaginaDelAsesor.tsx, compartida con /en/advisor. */
export const metadata = metadataAsesor("es");

export default function Pagina() {
  return <PaginaDelAsesor idioma="es" />;
}
