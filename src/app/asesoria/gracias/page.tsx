import { PaginaAsesoriaGracias, metadataAsesoriaGracias } from "@/components/paginas/PaginaAsesoria";

/** /asesoria/gracias — la página de gracias de la captación. */
export const metadata = metadataAsesoriaGracias("es");

export default function Pagina() {
  return <PaginaAsesoriaGracias idioma="es" />;
}
