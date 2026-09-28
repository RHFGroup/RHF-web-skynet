/**
 * Los últimos reels, en fila, dentro de «Nuestras redes» (28-sep-2026).
 *
 * Cada tarjeta lleva la portada del reel y abre el reel en Instagram. El de
 * un proyecto trae al lado los datos de su ficha —precio con su corte, área y
 * zona—, leídos de proyectos.ts como en la cartera, nunca del video. Reglas y
 * lista: src/data/reels.ts.
 *
 * La fila se desliza con el dedo o el trackpad (scroll nativo con imán) y
 * con las flechas de FilaDeslizable; en escritorio caben cuatro. Las
 * portadas se turnan con y sin Rafael (src/data/reels.ts).
 */
import Link from "next/link";
import FilaDeslizable from "@/components/FilaDeslizable";
import { IconoFlecha, IconoInstagram } from "@/components/Iconos";
import { fechaNoticia } from "@/data/noticias";
import { getProyecto } from "@/data/proyectos";
import { REDES } from "@/data/redes";
import { REELS } from "@/data/reels";
import { fichaDe } from "@/lib/ficha";

export default function UltimosReels() {
  if (REELS.length === 0) return null;
  const instagram = REDES.find((r) => r.id === "instagram");
  return (
    <div className="reels" role="region" aria-labelledby="reels-titulo">
      <div className="reels-cabeza">
        <h3 id="reels-titulo">Últimos reels</h3>
        {instagram && (
          <a className="reels-todos" href={instagram.url} target="_blank" rel="noopener noreferrer">
            Ver todos en Instagram <IconoFlecha size={16} />
          </a>
        )}
      </div>
      <FilaDeslizable className="reels-fila" etiqueta="Mover los reels">
        {REELS.map((r) => {
          const p = r.proyecto ? getProyecto(r.proyecto) : undefined;
          const f = p ? fichaDe(p) : null;
          return (
            <li key={r.id} className="reel">
              <a
                className="reel-portada"
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Ver en Instagram el reel «${r.titulo}»`}
              >
                <img src={r.portada} alt="" width={540} height={675} loading="lazy" decoding="async" />
                <span className="reel-play" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5.5v13l11-6.5z" />
                  </svg>
                </span>
              </a>
              <div className="reel-cuerpo">
                <p className="reel-fecha">{fechaNoticia(r.fecha)}</p>
                <p className="reel-titulo">{r.titulo}</p>
                {f && (
                  <p className="reel-ficha">
                    <span>
                      {[
                        f.muestraPrecio && f.corte ? `${f.precio} · corte ${f.corte}` : f.precio,
                        f.area?.texto,
                        f.zona,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>{" "}
                    <Link href={f.href}>Ver la ficha</Link>
                  </p>
                )}
                <a className="reel-ig" href={r.url} target="_blank" rel="noopener noreferrer">
                  <IconoInstagram size={16} /> Ver en Instagram
                </a>
              </div>
            </li>
          );
        })}
      </FilaDeslizable>
    </div>
  );
}
