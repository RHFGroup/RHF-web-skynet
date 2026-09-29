import PaginaInmueble, { metadataInmueble, slugsInmuebles } from "@/components/paginas/PaginaInmueble";

/** /en/properties/<slug> — la misma página que /inmuebles/<slug>, en inglés. */
export const dynamicParams = false;

export function generateStaticParams() {
  return slugsInmuebles();
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return metadataInmueble(slug, "en");
}

export default async function Pagina({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <PaginaInmueble slug={slug} idioma="en" />;
}
