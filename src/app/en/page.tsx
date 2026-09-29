import PaginaInicio, { metadataInicio } from "@/components/paginas/PaginaInicio";

/** /en — la home en inglés, para quien llega desde fuera de Colombia (docs/i18n.md). */
export const metadata = metadataInicio("en");

export default function Home() {
  return <PaginaInicio idioma="en" />;
}
