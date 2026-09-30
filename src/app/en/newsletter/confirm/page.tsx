import type { Metadata } from "next";
import ConfirmarSuscripcion from "@/components/ConfirmarSuscripcion";
import "@/styles/noticias.css";

/**
 * The newsletter confirmation (30-sep-2026), in English: /boletin/confirmar.
 * Reached from the link in the email; not indexed and not in the sitemap.
 */
export const metadata: Metadata = {
  title: { absolute: "Confirm your subscription — RHF Living" },
  description: "Confirmation of your subscription to the Zona Norte newsletter.",
  robots: { index: false, follow: false },
};

export default function ConfirmNewsletter() {
  return <ConfirmarSuscripcion idioma="en" />;
}
