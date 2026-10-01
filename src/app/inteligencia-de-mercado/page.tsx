import PaginaMercado, { metadataMercado } from "@/components/paginas/PaginaMercado";

/**
 * /inteligencia-de-mercado — la página vive en src/components/paginas/PaginaMercado.tsx,
 * compartida con /en/market-intelligence.
 */
export const metadata = metadataMercado("es");

export default function Pagina() {
  return <PaginaMercado idioma="es" />;
}
