import PaginaProyecto, { metadataProyecto, slugsProyectos } from "@/components/paginas/PaginaProyecto";

/**
 * /proyectos/<slug> — la página vive en src/components/paginas/PaginaProyecto.tsx,
 * compartida con /en/projects/<slug>.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return slugsProyectos();
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return metadataProyecto(slug, "es");
}

export default async function Pagina({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <PaginaProyecto slug={slug} idioma="es" />;
}
