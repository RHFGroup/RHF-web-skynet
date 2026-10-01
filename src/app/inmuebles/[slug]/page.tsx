import PaginaInmueble, { metadataInmueble, slugsInmuebles } from "@/components/paginas/PaginaInmueble";

/**
 * /inmuebles/<slug> — la página vive en src/components/paginas/PaginaInmueble.tsx,
 * compartida con /en/properties/<slug>.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return slugsInmuebles();
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return metadataInmueble(slug, "es");
}

export default async function Pagina({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <PaginaInmueble slug={slug} idioma="es" />;
}
