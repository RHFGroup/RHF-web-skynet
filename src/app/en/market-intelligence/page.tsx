import PaginaMercado, { metadataMercado } from "@/components/paginas/PaginaMercado";

/** /en/market-intelligence — la misma página que /inteligencia-de-mercado, en inglés. */
export const metadata = metadataMercado("en");

export default function Pagina() {
  return <PaginaMercado idioma="en" />;
}
