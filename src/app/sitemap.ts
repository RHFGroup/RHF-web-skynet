import type { MetadataRoute } from "next";
import { fechaISO, PROYECTOS } from "@/data/proyectos";
import { INMUEBLES } from "@/data/inmuebles";
import { ruta, SITIO } from "@/i18n/idioma";

/**
 * /sitemap.xml, armado en el build desde la capa de datos.
 *
 * Reemplaza al `public/sitemap.xml` escrito a mano, que solo tenía tres de los
 * cinco proyectos. Ahora cada proyecto de `src/data/proyectos.ts` entra solo,
 * con la fecha de corte de su hoja de precios como última modificación.
 *
 * 29-sep-2026 (sitio en inglés): cada página entra dos veces, en español y en
 * inglés, y las dos llevan sus alternos `hreflang` (docs/i18n.md).
 */
export const dynamic = "force-static";

type Entrada = Omit<MetadataRoute.Sitemap[number], "url"> & { rutaEs: string };

function url(rutaEs: string, idioma: "es" | "en"): string {
  const r = ruta(idioma, rutaEs);
  return `${SITIO}${r === "/" ? "/" : r}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const paginas: Entrada[] = [
    { rutaEs: "/", lastModified: "2026-09-24", changeFrequency: "weekly", priority: 1 },
    ...PROYECTOS.map((p) => ({
      rutaEs: `/proyectos/${p.slug}`,
      lastModified: (p.precio && fechaISO(p.precio.corte)) || "2026-09-24",
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    { rutaEs: "/asesor", lastModified: "2026-09-25", changeFrequency: "monthly", priority: 0.7 },
    { rutaEs: "/inteligencia-de-mercado", lastModified: "2026-09-29", changeFrequency: "weekly", priority: 0.6 },
    { rutaEs: "/vender", lastModified: "2026-09-29", changeFrequency: "monthly", priority: 0.7 },
    ...INMUEBLES.map((i) => ({
      rutaEs: `/inmuebles/${i.slug}`,
      lastModified: (i.precio && fechaISO(i.precio.corte)) || "2026-09-25",
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    { rutaEs: "/privacidad", lastModified: "2026-09-28", changeFrequency: "yearly", priority: 0.3 },
    { rutaEs: "/terminos", lastModified: "2026-09-14", changeFrequency: "yearly", priority: 0.3 },
  ];

  return paginas.flatMap(({ rutaEs, ...resto }) => {
    const alternates = { languages: { es: url(rutaEs, "es"), en: url(rutaEs, "en") } };
    return [
      { url: url(rutaEs, "es"), ...resto, alternates },
      { url: url(rutaEs, "en"), ...resto, alternates },
    ];
  });
}
