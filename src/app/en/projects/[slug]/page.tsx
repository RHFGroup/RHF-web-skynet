import PaginaProyecto, { metadataProyecto, slugsProyectos } from "@/components/paginas/PaginaProyecto";

/** /en/projects/<slug> — la misma página que /proyectos/<slug>, en inglés. */
export const dynamicParams = false;

export function generateStaticParams() {
  return slugsProyectos();
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return metadataProyecto(slug, "en");
}

export default async function Pagina({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <PaginaProyecto slug={slug} idioma="en" />;
}
