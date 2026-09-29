"use client";

/**
 * Mantiene `<html lang>` al día cuando la navegación es del lado del cliente
 * (un `<Link>` de /en a otra página de /en no vuelve a correr el script de
 * <head>). El primer valor lo pone ese script, antes de pintar
 * (src/app/layout.tsx). No pinta nada.
 */
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { idiomaDeRuta } from "@/i18n/idioma";

export default function IdiomaDocumento() {
  const ruta = usePathname();
  useEffect(() => {
    const idioma = idiomaDeRuta(ruta || "/");
    if (document.documentElement.lang !== idioma) document.documentElement.lang = idioma;
  }, [ruta]);
  return null;
}
