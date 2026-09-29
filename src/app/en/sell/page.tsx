import PaginaVender, { metadataVender } from "@/components/paginas/PaginaVender";

/** /en/sell — «Sell or list your property»: la misma página que /vender, en inglés. */
export const metadata = metadataVender("en");

export default function Pagina() {
  return <PaginaVender idioma="en" />;
}
