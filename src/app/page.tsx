import PaginaInicio, { metadataInicio } from "@/components/paginas/PaginaInicio";

/** La home (/): la página vive en src/components/paginas/PaginaInicio.tsx, compartida con /en. */
export const metadata = metadataInicio("es");

export default function Home() {
  return <PaginaInicio idioma="es" />;
}
