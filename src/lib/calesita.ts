"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { usePrefersReducedMotion } from "@/lib/motion";

/**
 * La calesita de la cartera: las tarjetas giran sin parar, de derecha a
 * izquierda, a velocidad constante, y la fila no se acaba nunca.
 *
 * 28-sep-2026, tarde (Rafael, con una captura del carrusel): «agiliza el
 * carrusel, más rápido, más fluido, como una calesita». Reemplaza al avance
 * por pasos de esa mañana (una tarjeta cada 4,5 s con un salto suave).
 *
 * Cómo gira sin cortes: nada se duplica ni se reordena en el HTML. Cada
 * tarjeta se corre con su propio `transform`, y la que sale entera por la
 * izquierda reaparece al final de la fila, fuera de la vista. Por eso la
 * foto que rota, el giro de la tarjeta y la flotación siguen intactos al dar
 * la vuelta. El movimiento va por requestAnimationFrame, en píxeles por
 * segundo, igual en pantallas de 60 y de 120 Hz.
 *
 * Cuándo se queda quieta (frena suave y arranca suave):
 *  · el mouse o el foco del teclado están sobre la cartera o sus flechas;
 *  · hay una tarjeta girada (mostrando su reverso);
 *  · la persona la arrastra con el dedo, y un rato después de soltarla;
 *  · el botón de pausa;
 *  · la cartera está fuera de la pantalla o la pestaña está oculta.
 *
 * Con «reducir movimiento», o si las tarjetas no alcanzan para dar la vuelta
 * sin que se note (pocas tarjetas después de filtrar), no hay calesita: la
 * fila se desliza a mano, como un carril, y las flechas corren una tarjeta.
 */

/** Cuánto tarda una tarjeta en correrse su propio ancho. */
export const SEGUNDOS_POR_TARJETA = 4;
/** Después de tocarla o arrastrarla con el dedo, cuánto espera para seguir. */
const ESPERA_TRAS_TOCAR_MS = 4000;
/** Después de usar las flechas, cuánto espera para seguir girando. */
const ESPERA_TRAS_FLECHA_MS = 2500;
/** Duración del corrimiento de una tarjeta con las flechas. */
const DURACION_FLECHA_MS = 520;

type Estado = {
  desp: number; // corrimiento de la fila, en px (≤ 0 hacia la izquierda)
  v: number; // velocidad actual, px/s
  paso: number; // ancho de una tarjeta + el espacio entre tarjetas
  vista: number; // ancho visible
  celdas: HTMLElement[];
  activa: boolean;
  pausada: boolean;
  encima: boolean;
  foco: boolean;
  enPantalla: boolean;
  quietoHasta: number;
  arrastre: null | { id: number; x: number; y0: number; x0: number; movio: boolean; vx: number; t: number };
  inercia: number; // px/ms, después de soltar
  tween: null | { t0: number; dur: number; delta: number; hecho: number };
  bloquearClic: boolean;
  prev: number;
  raf: number;
};

const mod = (a: number, n: number) => ((a % n) + n) % n;
const suave = (p: number) => 1 - Math.pow(1 - p, 3);

export function useCalesita({
  carril,
  vista,
  clave,
  pausada,
}: {
  /** La zona completa (fila + flechas): el mouse o el foco encima la frenan. */
  carril: RefObject<HTMLDivElement | null>;
  /** El recorte visible, que contiene a `.cartera-grilla`. */
  vista: RefObject<HTMLDivElement | null>;
  /** Cambia cuando cambian las tarjetas (un filtro): se vuelve a medir. */
  clave: unknown;
  pausada: boolean;
}) {
  const reducido = usePrefersReducedMotion();
  const [modo, setModo] = useState({ activa: false, desborda: false });
  const st = useRef<Estado>({
    desp: 0,
    v: 0,
    paso: 0,
    vista: 0,
    celdas: [],
    activa: false,
    pausada,
    encima: false,
    foco: false,
    enPantalla: true,
    quietoHasta: 0,
    arrastre: null,
    inercia: 0,
    tween: null,
    bloquearClic: false,
    prev: 0,
    raf: 0,
  });

  const grilla = () => vista.current?.querySelector<HTMLElement>(".cartera-grilla") ?? null;

  /** Pone cada tarjeta en su lugar de la vuelta. */
  const aplicar = useCallback(() => {
    const s = st.current;
    const n = s.celdas.length;
    if (!s.activa || n === 0 || s.paso <= 0) return;
    const largo = n * s.paso;
    for (let i = 0; i < n; i++) {
      const x = mod(i * s.paso + s.desp + s.paso, largo) - s.paso;
      s.celdas[i].style.transform = `translate3d(${(x - i * s.paso).toFixed(2)}px,0,0)`;
    }
  }, []);

  const tick = useCallback(
    (t: number) => {
      const s = st.current;
      s.raf = 0;
      if (!s.activa || !s.enPantalla || document.hidden) {
        s.v = 0;
        s.prev = 0;
        return;
      }
      const dt = s.prev ? Math.min(50, t - s.prev) : 16.7;
      s.prev = t;
      const girada = !!vista.current?.querySelector(".tg-girada");
      const quieta =
        s.pausada || s.encima || s.foco || girada || s.arrastre !== null || t < s.quietoHasta;
      const objetivo = quieta ? 0 : s.paso / SEGUNDOS_POR_TARJETA;
      // Frena en ~0,25 s y arranca en ~0,7 s: sin tirones.
      const k = objetivo > s.v ? dt / 700 : dt / 250;
      s.v += (objetivo - s.v) * Math.min(1, k);
      if (objetivo === 0 && s.v < 1) s.v = 0;

      let d = s.arrastre ? 0 : (-s.v * dt) / 1000;
      if (s.inercia) {
        d += s.inercia * dt;
        s.inercia *= Math.pow(0.93, dt / 16.7);
        if (Math.abs(s.inercia) < 0.02) {
          s.inercia = 0;
          s.quietoHasta = Math.max(s.quietoHasta, t + ESPERA_TRAS_TOCAR_MS);
        }
      }
      if (s.tween) {
        const p = Math.min(1, (t - s.tween.t0) / s.tween.dur);
        const e = s.tween.dur > 0 ? suave(p) : 1;
        d += (e - s.tween.hecho) * s.tween.delta;
        s.tween.hecho = e;
        if (p >= 1) s.tween = null;
      }
      if (d !== 0) {
        const largo = s.celdas.length * s.paso;
        s.desp = largo > 0 ? -mod(-(s.desp + d), largo) : 0;
        aplicar();
      }
      // Con una tarjeta girada se sigue mirando cada cuadro: el giro de vuelta
      // no avisa, y la calesita tiene que arrancar apenas la tarjeta vuelve.
      const sigue =
        s.v !== 0 || objetivo !== 0 || s.tween !== null || s.inercia !== 0 || t < s.quietoHasta || girada;
      if (sigue) s.raf = requestAnimationFrame(tick);
      else s.prev = 0;
    },
    [aplicar, vista],
  );

  /** Vuelve a mirar si hay que moverse (después de cualquier cambio). */
  const despertar = useCallback(() => {
    const s = st.current;
    if (!s.activa || s.raf || !s.enPantalla || document.hidden) return;
    s.raf = requestAnimationFrame(tick);
  }, [tick]);

  // La pausa del botón.
  useEffect(() => {
    st.current.pausada = pausada;
    despertar();
  }, [pausada, despertar]);

  // Medir: cuánto mide una tarjeta, cuánto se ve y si alcanza para girar.
  useEffect(() => {
    const v = vista.current;
    const g = grilla();
    const s = st.current;
    if (!v || !g) {
      setModo({ activa: false, desborda: false });
      return;
    }
    s.desp = 0;
    s.tween = null;
    s.inercia = 0;

    const medir = () => {
      const celdas = Array.from(g.children).filter((c): c is HTMLElement => c.classList.contains("cartera-celda"));
      const n = celdas.length;
      const paso = n > 1 ? celdas[1].offsetLeft - celdas[0].offsetLeft : 0;
      const ancho = v.clientWidth;
      const contenido = n > 0 ? celdas[n - 1].offsetLeft + celdas[n - 1].offsetWidth - celdas[0].offsetLeft : 0;
      const desborda = contenido > ancho + 2;
      // Para dar la vuelta sin que se vea el salto, la fila tiene que cubrir
      // la vista más una tarjeta.
      const alcanza = n >= 2 && paso > 0 && n * paso >= ancho + paso - 1;
      const activa = !reducido && desborda && alcanza;
      if (s.paso > 0 && paso > 0 && paso !== s.paso) s.desp *= paso / s.paso;
      const antes = s.activa;
      s.celdas = celdas;
      s.paso = paso;
      s.vista = ancho;
      s.activa = activa;
      if (activa && !antes) g.scrollLeft = 0;
      if (!activa) for (const c of celdas) c.style.transform = "";
      aplicar();
      setModo((m) => (m.activa === activa && m.desborda === desborda ? m : { activa, desborda }));
      despertar();
    };
    medir();
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(medir);
    ro?.observe(v);
    return () => {
      ro?.disconnect();
      if (s.raf) cancelAnimationFrame(s.raf);
      s.raf = 0;
      s.prev = 0;
    };
    // `grilla` lee el DOM del momento; `clave` avisa que cambió.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave, reducido, aplicar, despertar, vista]);

  // Mouse, foco, dedo, rueda, pantalla y pestaña.
  useEffect(() => {
    const zona = carril.current;
    const v = vista.current;
    if (!zona || !v) return;
    const s = st.current;

    const entrar = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      s.encima = true;
      despertar();
    };
    const salir = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      s.encima = false;
      despertar();
    };
    const conFoco = (e: FocusEvent) => {
      s.foco = true;
      despertar();
      // Si el tabulador llega a una tarjeta que no se ve entera, se trae.
      if (!s.activa) return;
      const celda = (e.target as HTMLElement).closest<HTMLElement>(".cartera-celda");
      if (!celda) return;
      const r = celda.getBoundingClientRect();
      const rv = v.getBoundingClientRect();
      let delta = 0;
      if (r.left < rv.left) delta = rv.left - r.left;
      else if (r.right > rv.right) delta = rv.right - r.right;
      if (Math.abs(delta) > 1) {
        s.tween = { t0: performance.now(), dur: reducido ? 0 : 420, delta, hecho: 0 };
        despertar();
      }
    };
    const sinFoco = (e: FocusEvent) => {
      if (e.relatedTarget instanceof Node && zona.contains(e.relatedTarget)) return;
      s.foco = false;
      despertar();
    };

    // El dedo (y el lápiz): arrastrar la fila, con un poco de inercia.
    const bajar = (e: PointerEvent) => {
      if (e.pointerType === "mouse" || !s.activa) return;
      s.arrastre = { id: e.pointerId, x: e.clientX, x0: e.clientX, y0: e.clientY, movio: false, vx: 0, t: e.timeStamp };
      s.inercia = 0;
      s.tween = null;
      despertar();
    };
    const mover = (e: PointerEvent) => {
      const a = s.arrastre;
      if (!a || e.pointerId !== a.id) return;
      if (!a.movio) {
        const dx0 = e.clientX - a.x0;
        if (Math.abs(dx0) < 8) return;
        // Si el gesto es vertical, es para bajar la página: se suelta.
        if (Math.abs(e.clientY - a.y0) > Math.abs(dx0)) {
          s.arrastre = null;
          despertar();
          return;
        }
        a.movio = true;
        try {
          v.setPointerCapture(e.pointerId);
        } catch {}
      }
      const dx = e.clientX - a.x;
      const dt = Math.max(1, e.timeStamp - a.t);
      a.vx = 0.7 * (dx / dt) + 0.3 * a.vx;
      a.x = e.clientX;
      a.t = e.timeStamp;
      const largo = s.celdas.length * s.paso;
      if (largo > 0) s.desp = -mod(-(s.desp + dx), largo);
      aplicar();
    };
    const soltar = (e: PointerEvent) => {
      const a = s.arrastre;
      if (!a || e.pointerId !== a.id) return;
      s.arrastre = null;
      if (a.movio) {
        s.inercia = Math.max(-2.5, Math.min(2.5, a.vx));
        s.bloquearClic = true;
        window.setTimeout(() => (s.bloquearClic = false), 400);
      }
      s.quietoHasta = performance.now() + ESPERA_TRAS_TOCAR_MS;
      despertar();
    };
    // Un arrastre no es un clic: no abre la tarjeta ni la gira.
    const clic = (e: MouseEvent) => {
      if (!s.bloquearClic) return;
      s.bloquearClic = false;
      e.preventDefault();
      e.stopPropagation();
    };
    // El trackpad: deslizar de lado corre la fila.
    const rueda = (e: WheelEvent) => {
      if (!s.activa || Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      const largo = s.celdas.length * s.paso;
      if (largo > 0) s.desp = -mod(-(s.desp - e.deltaX), largo);
      s.quietoHasta = performance.now() + ESPERA_TRAS_TOCAR_MS;
      aplicar();
      despertar();
    };

    const io =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(([en]) => {
            s.enPantalla = en.isIntersecting;
            despertar();
          });
    io?.observe(v);
    const pestaña = () => despertar();

    zona.addEventListener("pointerenter", entrar);
    zona.addEventListener("pointerleave", salir);
    zona.addEventListener("focusin", conFoco);
    zona.addEventListener("focusout", sinFoco);
    v.addEventListener("pointerdown", bajar);
    v.addEventListener("pointermove", mover);
    v.addEventListener("pointerup", soltar);
    v.addEventListener("pointercancel", soltar);
    v.addEventListener("click", clic, true);
    v.addEventListener("wheel", rueda, { passive: false });
    document.addEventListener("visibilitychange", pestaña);
    return () => {
      io?.disconnect();
      zona.removeEventListener("pointerenter", entrar);
      zona.removeEventListener("pointerleave", salir);
      zona.removeEventListener("focusin", conFoco);
      zona.removeEventListener("focusout", sinFoco);
      v.removeEventListener("pointerdown", bajar);
      v.removeEventListener("pointermove", mover);
      v.removeEventListener("pointerup", soltar);
      v.removeEventListener("pointercancel", soltar);
      v.removeEventListener("click", clic, true);
      v.removeEventListener("wheel", rueda);
      document.removeEventListener("visibilitychange", pestaña);
    };
  }, [carril, vista, aplicar, despertar, reducido]);

  /** Las flechas: una tarjeta hacia un lado. */
  const mover = useCallback(
    (sentido: 1 | -1) => {
      const s = st.current;
      if (s.activa) {
        s.tween = { t0: performance.now(), dur: reducido ? 0 : DURACION_FLECHA_MS, delta: -sentido * s.paso, hecho: 0 };
        s.quietoHasta = performance.now() + ESPERA_TRAS_FLECHA_MS;
        despertar();
        return;
      }
      // Sin calesita, la fila es un carril que se desliza: se corre una tarjeta
      // y, al llegar a un extremo, salta al otro.
      const g = grilla();
      if (!g) return;
      const paso = s.paso || g.clientWidth;
      const alFinal = g.scrollLeft + g.clientWidth >= g.scrollWidth - 8;
      const alInicio = g.scrollLeft <= 8;
      let destino = g.scrollLeft + sentido * paso;
      if (sentido === 1 && alFinal) destino = 0;
      if (sentido === -1 && alInicio) destino = g.scrollWidth;
      g.scrollTo({ left: destino, behavior: reducido ? "auto" : "smooth" });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [despertar, reducido],
  );

  return { activa: modo.activa, desborda: modo.desborda, reducido, mover };
}
