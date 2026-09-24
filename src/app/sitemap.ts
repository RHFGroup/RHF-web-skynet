import type { MetadataRoute } from "next";
import { fechaISO, PROYECTOS } from "@/data/proyectos";

/**
 * /sitemap.xml, armado en el build desde la capa de datos.
 *
 * Reemplaza al `public/sitemap.xml` escrito a mano, que solo tenía tres de los
 * cinco proyectos. Ahora cada proyecto de `src/data/proyectos.ts` entra solo,
 * con la fecha de corte de su hoja de precios como última modificación.
 */
export const dynamic = "force-static";

const SITIO = "https://rhfliving.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITIO}/`, lastModified: "2026-09-24", changeFrequency: "weekly", priority: 1 },
    ...PROYECTOS.map((p) => ({
      url: `${SITIO}/proyectos/${p.slug}`,
      lastModified: (p.precio && fechaISO(p.precio.corte)) || "2026-09-24",
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    { url: `${SITIO}/privacidad`, lastModified: "2026-09-14", changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITIO}/terminos`, lastModified: "2026-09-14", changeFrequency: "yearly", priority: 0.3 },
  ];
}
