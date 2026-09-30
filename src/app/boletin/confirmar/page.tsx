import type { Metadata } from "next";
import ConfirmarSuscripcion from "@/components/ConfirmarSuscripcion";
import "@/styles/noticias.css";

/**
 * La confirmación del boletín (30-sep-2026). Llega desde el enlace del correo;
 * no se indexa ni va en el sitemap. Ver src/components/ConfirmarSuscripcion.tsx.
 */
export const metadata: Metadata = {
  title: "Confirma tu suscripción — RHF",
  description: "La confirmación de la suscripción al boletín de noticias de la Zona Norte.",
  robots: { index: false, follow: false },
};

export default function ConfirmarBoletin() {
  return <ConfirmarSuscripcion idioma="es" />;
}
