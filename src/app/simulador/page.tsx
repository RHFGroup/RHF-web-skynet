import PaginaSimulador, { metadataSimulador } from "@/components/paginas/PaginaSimulador";

/** /simulador — la página vive en src/components/paginas/PaginaSimulador.tsx, compartida con /en/mortgage-calculator. */
export const metadata = metadataSimulador("es");

export default function Pagina() {
  return <PaginaSimulador idioma="es" />;
}
