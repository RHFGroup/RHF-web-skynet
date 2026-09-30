import PaginaSimulador, { metadataSimulador } from "@/components/paginas/PaginaSimulador";

/** /en/mortgage-calculator — el simulador de compra: la misma página que /simulador, en inglés. */
export const metadata = metadataSimulador("en");

export default function Pagina() {
  return <PaginaSimulador idioma="en" />;
}
