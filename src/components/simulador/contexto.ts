"use client";

import { createContext, useContext } from "react";
import type { Idioma } from "@/i18n/idioma";
import type { EstadoSim } from "@/components/simulador/tipos";
import type { Textos } from "@/components/simulador/textos";
import type { TRM } from "@/lib/moneda";

export type ContextoSim = {
  idioma: Idioma;
  t: Textos;
  estado: EstadoSim;
  /**
   * Cambia el estado. Por defecto marca las claves como «Tu dato»: es lo que
   * pasa cuando la persona mueve algo. Los cambios que hace la página (elegir
   * un inmueble y cargar su precio) van con `marcar: false`.
   */
  set: (cambios: Partial<EstadoSim>, opciones?: { marcar?: boolean }) => void;
  editado: (clave: keyof EstadoSim) => boolean;
  /** La fecha de hoy (AAAA-MM-DD), solo después de montar: el HTML del build no depende de ella. */
  hoy: string | null;
  /** La TRM del día si la persona eligió ver dólares (Dolares.tsx); null si no. */
  trmUSD: TRM | null;
};

export const Contexto = createContext<ContextoSim | null>(null);

export function useSim(): ContextoSim {
  const c = useContext(Contexto);
  if (!c) throw new Error("useSim fuera del simulador");
  return c;
}
