/**
 * Leaflet, cargado una sola vez y solo cuando un mapa entra en pantalla.
 *
 * Quien nunca baja hasta un mapa no paga sus 42 KB. Si la descarga falla, cada
 * mapa tiene su texto de respaldo: el mapa realza el contenido, no lo
 * reemplaza.
 *
 * Las teselas (el dibujo del mapa) y su atribución viven aquí para que todos
 * los mapas del sitio usen las mismas. Hoy son las de OpenStreetMap, las
 * mismas que ya usaba el mapa del territorio.
 */
export const LEAFLET_CSS = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css";
export const LEAFLET_JS = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js";

export const TESELAS = {
  url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  atribucion: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  maxZoom: 18,
};

export function cargarLeaflet(): Promise<unknown> {
  const w = window as unknown as { L?: unknown; __leafletPromesa?: Promise<unknown> };
  if (w.L) return Promise.resolve(w.L);
  if (w.__leafletPromesa) return w.__leafletPromesa;

  w.__leafletPromesa = new Promise((resolve, reject) => {
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = LEAFLET_CSS;
    document.head.appendChild(css);

    const js = document.createElement("script");
    js.src = LEAFLET_JS;
    js.async = true;
    js.onload = () => resolve(w.L);
    js.onerror = () => {
      // Se permite reintentar en la próxima visita a un mapa.
      w.__leafletPromesa = undefined;
      reject(new Error("Leaflet quedó fuera de alcance"));
    };
    document.body.appendChild(js);
  });

  return w.__leafletPromesa;
}
