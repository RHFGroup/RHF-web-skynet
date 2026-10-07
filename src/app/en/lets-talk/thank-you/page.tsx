import { PaginaAsesoriaGracias, metadataAsesoriaGracias } from "@/components/paginas/PaginaAsesoria";

/** /en/lets-talk/thank-you — la página de gracias en inglés: la misma que /asesoria/gracias. */
export const metadata = metadataAsesoriaGracias("en");

export default function Pagina() {
  return <PaginaAsesoriaGracias idioma="en" />;
}
