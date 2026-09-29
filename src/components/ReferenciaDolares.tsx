"use client";

/**
 * La referencia en dólares junto a cada precio en pesos (29-sep-2026).
 *
 * Cada precio publicable lleva en su elemento `data-cop` (y `data-cop-hasta`
 * si es un rango, `data-desde` si dice «desde»). Cuando la persona elige USD
 * en el selector, este componente trae la TRM del día (/api/trm), calcula la
 * referencia y la deja en `data-usd`; el CSS la muestra debajo del precio en
 * pesos (src/styles/moneda.css). Con COP no pide nada: la mayoría de las
 * visitas nunca descarga la TRM.
 *
 * Por qué atributos y no un componente dentro de cada tarjeta: el precio en
 * pesos sale del build y no debe cambiar al hidratar (error #418 de React).
 * La referencia se agrega después, fuera del árbol de React, y un
 * MutationObserver la repone cuando la cartera se filtra o cambia de tarjeta.
 *
 * La nota con la TRM y su fecha va en el pie (#nota-trm): la referencia no se
 * muestra sin decir de dónde sale.
 *
 * El idioma sale de `<html lang>` cada vez que pinta: el componente vive en el
 * layout raíz y no recibe props. En inglés la cifra dice siempre «reference»
 * («≈ US$83,000 reference», docs/i18n.md).
 */
import { useEffect } from "react";
import { fechaLarga, type Idioma } from "@/i18n/idioma";
import { EVENTO_MONEDA, formatoDolares, formatoTRM, monedaActual, obtenerTRM, type TRM } from "@/lib/moneda";

export default function ReferenciaDolares() {
  useEffect(() => {
    let trm: TRM | null = null;
    let observador: MutationObserver | null = null;
    const idioma = (): Idioma => (document.documentElement.lang === "en" ? "en" : "es");

    const pintar = () => {
      if (!trm) return;
      const len = idioma();
      document.querySelectorAll<HTMLElement>("[data-cop]").forEach((el) => {
        const desde = Number(el.dataset.cop);
        const hasta = Number(el.dataset.copHasta ?? 0);
        if (!Number.isFinite(desde) || desde <= 0) return;
        const a = formatoDolares(desde / trm!.valor, len);
        const rango = hasta > desde ? ` ${len === "en" ? "to" : "a"} ${formatoDolares(hasta / trm!.valor, len)}` : "";
        const prefijo = "desde" in el.dataset ? (len === "en" ? "from " : "desde ") : "";
        const texto = `≈ ${prefijo}${a}${rango}${len === "en" ? " reference" : ""}`;
        if (el.dataset.usd !== texto) el.dataset.usd = texto;
      });
      const nota = document.getElementById("nota-trm");
      if (nota) {
        const f = fechaLarga(trm.vigente, len);
        const t =
          len === "en"
            ? `Dollar amounts are an approximate reference at the official exchange rate (TRM) of ${formatoTRM(trm.valor, "en")} for ${f}, certified by the Financial Superintendence of Colombia. The official price is in Colombian pesos.`
            : `Los valores en dólares son una referencia aproximada con la TRM de ${formatoTRM(trm.valor, "es")} vigente el ${f}, certificada por la Superintendencia Financiera de Colombia. El precio oficial es en pesos colombianos.`;
        if (nota.textContent !== t) nota.textContent = t;
        nota.hidden = false;
      }
    };

    const activar = async () => {
      if (monedaActual() !== "USD") return;
      trm ||= await obtenerTRM();
      if (!trm) return;
      pintar();
      if (!observador) {
        observador = new MutationObserver(() => pintar());
        observador.observe(document.body, { childList: true, subtree: true });
      }
    };

    activar();
    window.addEventListener(EVENTO_MONEDA, activar);
    return () => {
      window.removeEventListener(EVENTO_MONEDA, activar);
      observador?.disconnect();
    };
  }, []);

  return null;
}
