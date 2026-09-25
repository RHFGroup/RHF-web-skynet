/**
 * Leaflet, cargado una sola vez y solo cuando un mapa entra en pantalla.
 *
 * Quien nunca baja hasta un mapa no paga sus 42 KB. Si la descarga falla, cada
 * mapa tiene su texto de respaldo: el mapa realza el contenido, no lo
 * reemplaza.
 *
 * Las teselas (el dibujo del mapa) y su atribución viven aquí para que todos
 * los mapas del sitio usen las mismas.
 *
 * PROVEEDOR (prompt 3, 24-sep-2026): CARTO Voyager, un estilo claro y cálido.
 * Sus condiciones permiten uso comercial gratis hasta 1 millón de teselas al
 * mes, con llave de API y con la atribución de CARTO y OpenStreetMap siempre
 * visible (docs.carto.com/faqs/carto-basemaps). La llave la pide Rafael (es
 * gratis y no pide cuenta) y se configura en Cloudflare Workers Builds como
 * variable de compilación `NEXT_PUBLIC_CARTO_KEY`: no vive en el repositorio.
 * Mientras no exista, los mapas siguen con las teselas de OpenStreetMap de
 * siempre, para no mostrar la marca de agua «API key required» de CARTO.
 *
 * Dominio nuevo para las cabeceras de seguridad (img-src):
 * https://*.basemaps.cartocdn.com
 */
export const LEAFLET_CSS = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css";
export const LEAFLET_JS = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js";

const CLAVE_CARTO = process.env.NEXT_PUBLIC_CARTO_KEY ?? "";

export const TESELAS: {
  proveedor: "carto" | "osm";
  url: string;
  subdominios: string;
  atribucion: string;
  maxZoom: number;
} = CLAVE_CARTO
  ? {
      proveedor: "carto",
      url: `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${encodeURIComponent(CLAVE_CARTO)}`,
      subdominios: "abcd",
      atribucion:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · © <a href="https://carto.com/attribution/">CARTO</a>',
      maxZoom: 19,
    }
  : {
      proveedor: "osm",
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      subdominios: "abc",
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
    js.onload = () => {
      sinCosturas(w.L);
      resolve(w.L);
    };
    js.onerror = () => {
      // Se permite reintentar en la próxima visita a un mapa.
      w.__leafletPromesa = undefined;
      reject(new Error("Leaflet quedó fuera de alcance"));
    };
    document.body.appendChild(js);
  });

  return w.__leafletPromesa;
}

/**
 * Con zoom fraccionario (los mapas encuadran con precisión de un cuarto de
 * zoom), Chrome deja líneas blancas de un píxel entre teselas. Cada tesela se
 * dibuja un píxel más grande y se solapa con la vecina: la costura desaparece.
 */
function sinCosturas(L: unknown) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leaflet = L as any;
  if (!leaflet?.GridLayer || leaflet.__sinCosturas) return;
  leaflet.__sinCosturas = true;
  const original = leaflet.GridLayer.prototype._initTile;
  leaflet.GridLayer.include({
    _initTile(this: { getTileSize: () => { x: number; y: number } }, tile: HTMLElement) {
      original.call(this, tile);
      const t = this.getTileSize();
      tile.style.width = `${t.x + 1}px`;
      tile.style.height = `${t.y + 1}px`;
    },
  });
}
