"use client";

/**
 * Anota por dónde entró la persona la primera vez en esta pestaña
 * (src/lib/atribucion.ts). Vive en el layout raíz: corre una vez por carga
 * completa de la página, no en cada navegación interna. No pinta nada.
 */
import { useEffect } from "react";
import { capturarAtribucion } from "@/lib/atribucion";

export default function CapturaAtribucion() {
  useEffect(() => {
    capturarAtribucion();
  }, []);
  return null;
}
