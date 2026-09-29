"use client";

/**
 * El punto del proyecto en un mapa pequeño.
 *
 * Solo existe si `proyectos.ts` tiene la coordenada VERIFICADA del proyecto:
 * sin coordenada, la página muestra la dirección y este componente no se
 * monta. Leaflet se descarga cuando el mapa está por entrar en pantalla.
 */
import { useEffect, useRef, useState } from "react";
import type { Idioma } from "@/i18n/idioma";
import { cargarLeaflet, TESELAS } from "@/lib/leaflet";
import { movimientoReducido } from "@/lib/motion";

/** Los espacios al borde son parte del texto: lo separan de la fuente. */
const TEXTOS = {
  es: {
    falla: "El mapa quedó fuera de alcance.",
    verificada: "Coordenada verificada · ",
  },
  en: {
    falla: "The map could not be loaded.",
    verificada: "Verified coordinates · ",
  },
} satisfies Record<Idioma, Record<string, string>>;

export default function MiniMapa({
  lat,
  lon,
  nombre,
  fuente,
  idioma = "es",
}: {
  lat: number;
  lon: number;
  nombre: string;
  fuente: string;
  idioma?: Idioma;
}) {
  const t = TEXTOS[idioma];
  const caja = useRef<HTMLDivElement>(null);
  const [cerca, setCerca] = useState(false);
  const [falló, setFalló] = useState(false);

  // Medición en el scroll, sin IntersectionObserver: sus avisos se congelan en
  // pestañas de fondo (ver MapaZona.tsx, donde se aprendió).
  useEffect(() => {
    const el = caja.current;
    if (!el) return;
    const revisar = () => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight + 300 && r.bottom > -300) {
        setCerca(true);
        window.removeEventListener("scroll", revisar);
      }
    };
    revisar();
    window.addEventListener("scroll", revisar, { passive: true });
    return () => window.removeEventListener("scroll", revisar);
  }, []);

  useEffect(() => {
    if (!cerca || !caja.current) return;
    let cancelado = false;
    cargarLeaflet()
      .then((L) => {
        if (cancelado || !caja.current) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const leaflet = L as any;
        const reduced = movimientoReducido();
        const mapa = leaflet.map(caja.current, {
          center: [lat, lon],
          zoom: 14,
          scrollWheelZoom: false,
          zoomAnimation: !reduced,
          fadeAnimation: !reduced,
        });
        leaflet
          .tileLayer(TESELAS.url, {
            subdomains: TESELAS.subdominios,
            maxZoom: TESELAS.maxZoom,
            attribution: TESELAS.atribucion,
          })
          .addTo(mapa);
        const icono = leaflet.divIcon({
          className: "pp-mapa-pin",
          html: "<span></span>",
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        });
        leaflet.marker([lat, lon], { icon: icono, title: nombre }).addTo(mapa);
      })
      .catch(() => {
        if (!cancelado) setFalló(true);
      });
    return () => {
      cancelado = true;
    };
  }, [cerca, lat, lon, nombre]);

  return (
    <figure className="pp-mapa">
      <div ref={caja} className="pp-mapa-lienzo" aria-hidden="true">
        {falló && <p className="pp-mapa-falla">{t.falla}</p>}
      </div>
      <figcaption>
        {t.verificada}
        {fuente}
      </figcaption>
    </figure>
  );
}
