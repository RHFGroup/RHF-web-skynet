import PaginaVender, { metadataVender } from "@/components/paginas/PaginaVender";

/** /vender — la página vive en src/components/paginas/PaginaVender.tsx, compartida con /en/sell. */
export const metadata = metadataVender("es");

export default function Pagina() {
  return <PaginaVender idioma="es" />;
}
