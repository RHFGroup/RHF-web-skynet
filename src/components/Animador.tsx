"use client";

/**
 * Las entradas de la página: lo que llega al hacer scroll entra animado.
 *
 * Por qué existe. Rafael revisó la vista previa el 25-sep-2026 y no vio
 * animaciones: las que había eran pocas y cortas (subir 28 px en 0,7 s) y la
 * mitad de los titulares no tenía ninguna. Este componente las pone de forma
 * pareja en toda la página sin tocar cada sección:
 *
 *  · Los titulares (h2) se descubren de abajo hacia arriba mientras suben.
 *  · Los eyebrows camel entran desde la izquierda.
 *  · Los párrafos de entrada y los botones suben.
 *  · Las imágenes grandes se abren desde el centro mientras se alejan.
 *
 * El contrato es el de `useReveal` (src/lib/motion.ts): **el HTML sale
 * visible**. Solo se arma —se oculta para animarlo— lo que todavía está fuera
 * de pantalla, y solo en el navegador. Sin JS, en un buscador o con menos
 * movimiento, se ve todo y nada se anima. Cuando la entrada termina, las
 * clases se quitan: el elemento vuelve a sus estilos, y sus transiciones de
 * `:hover` quedan como estaban.
 *
 * Lo que ya anima otra pieza queda afuera: la portada, lo que está dentro de
 * un `Reveal` o `RevealGrupo` (marcados con `data-revela`), las tarjetas de la
 * cartera y los mapas.
 */
import { useEffect } from "react";
import "@/styles/animaciones.css";

const VARIANTES: [selector: string, variante: string][] = [
  ["main h2", "titulo"],
  ["main .section-kicker", "kicker"],
  ["main .section-lede", "sube"],
  ["main .btn-primary, main .btn-whatsapp", "boton"],
  ["main figure img", "imagen"],
];

/** Piezas que tienen su propia animación o que no deben moverse. */
const FUERA = "#inicio, [data-revela], .tg, .zn-mapa-fijo, .leaflet-container, .tr-mapa, [data-sin-animar]";

/** Cuánto dura la entrada más larga, para quitar las clases después. */
const DURACION_MS = 1400;

export default function Animador() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Se revisa la posición en cada scroll en vez de usar IntersectionObserver:
    // el observador no ve un elemento recortado entero con `clip-path` (el de
    // los titulares), así que nunca lo revelaba.
    const armados = new Set<HTMLElement>();
    const relojes: number[] = [];

    const quitar = (el: HTMLElement) =>
      el.classList.remove("anim", ...[...el.classList].filter((c) => c.startsWith("anim-")));

    const revisar = () => {
      if (armados.size === 0) return;
      const limite = window.innerHeight * 0.92;
      armados.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top > limite || r.bottom < 0) return;
        armados.delete(el);
        el.classList.add("anim-visible");
        relojes.push(window.setTimeout(() => quitar(el), DURACION_MS + 200));
      });
    };

    let ultimo = 0;
    let pendiente = 0;
    const alMover = () => {
      window.clearTimeout(pendiente);
      pendiente = window.setTimeout(revisar, 80);
      const ahora = performance.now();
      if (ahora - ultimo < 50) return;
      ultimo = ahora;
      revisar();
    };

    // Dos cuadros de espera: así `Reveal` y `RevealGrupo` ya marcaron lo suyo.
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        const alto = window.innerHeight;
        for (const [selector, variante] of VARIANTES) {
          document.querySelectorAll<HTMLElement>(selector).forEach((el, i) => {
            if (el.closest(FUERA) || armados.has(el) || el.classList.contains("anim")) return;
            const r = el.getBoundingClientRect();
            if (r.top < alto && r.bottom > 0) return; // ya se ve: no se esconde
            el.classList.add("anim", `anim-${variante}`);
            el.style.setProperty("--anim-i", String(i % 3));
            armados.add(el);
          });
        }
        window.addEventListener("scroll", alMover, { passive: true });
        window.addEventListener("resize", alMover, { passive: true });
        revisar();
      });
    });

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      window.clearTimeout(pendiente);
      relojes.forEach((t) => window.clearTimeout(t));
      window.removeEventListener("scroll", alMover);
      window.removeEventListener("resize", alMover);
      armados.forEach(quitar);
    };
  }, []);

  return null;
}
