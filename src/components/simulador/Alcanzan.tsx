"use client";

/**
 * «Proyectos que te alcanzan» (M8) y «¿Qué mover para que te alcance?» (M9).
 *
 * La cartera sale de src/data, con el precio publicable y su corte. Lo que no
 * tiene precio va aparte, como «Consultar»: no se evalúa con un precio
 * inventado. Cada tarjeta lleva «Simular este» y un WhatsApp con el código
 * WEB-SIM-{slug}, para saber de dónde viene la conversación.
 */
import { useState } from "react";
import { palancas, type Condiciones, type ItemCartera, type Palanca, type Perfil, type ResultadoItem } from "@/lib/simulador/cartera";
import { enlaceWhatsApp } from "@/data/contacto";
import { useSim } from "@/components/simulador/contexto";
import { anios, inicialMinuscula, meses, pesos, porcentaje } from "@/components/simulador/formato";
import { evento } from "@/components/simulador/analitica";
import type { EstadoSim, ItemSimulador } from "@/components/simulador/tipos";
import { LIMITES, PARAMETROS } from "@/components/simulador/parametros";

export default function Alcanzan({
  resultado,
  items,
  perfil,
  cond,
  alSimular,
  alAplicar,
  compacto = false,
}: {
  resultado: { evaluados: ResultadoItem[]; consultar: ItemCartera[] };
  items: ItemSimulador[];
  perfil: Perfil;
  cond: Condiciones;
  alSimular: (slug: string) => void;
  alAplicar?: (slug: string, cambios: Partial<EstadoSim>) => void;
  compacto?: boolean;
}) {
  const { t, idioma } = useSim();
  const [todos, setTodos] = useState(false);
  const de = (slug: string) => items.find((i) => i.slug === slug);
  const alcanzan = resultado.evaluados.filter((r) => r.estado === "alcanza").length;
  // En el inicio rápido, los cuatro primeros (primero los que alcanzan): el
  // resto se abre con un botón. En el detalle, todos.
  const VISIBLES = 4;
  const lista = compacto || todos ? resultado.evaluados : resultado.evaluados.slice(0, VISIBLES);

  return (
    <div className={compacto ? "sim-cartera sim-cartera-compacta" : "sim-cartera"}>
      <p className="sim-cartera-resumen">
        {alcanzan > 0 ? t.teAlcanzanN(alcanzan, resultado.evaluados.length) : t.ningunoAlcanza}
        {" · "}
        {t.condicionesLista(
          cond.modalidad === "leasing" ? t.modalidades.leasing : cond.modalidad === "uvr" ? t.modalidades.uvr : t.modalidades.pesos,
          porcentaje(cond.pctFinanciado, idioma),
          anios(cond.plazoAnios, idioma),
        )}
      </p>
      <ul className="sim-tarjetas">
        {lista.map((r) => {
          const it = de(r.item.slug);
          if (!it) return null;
          return (
            <Tarjeta
              key={r.item.slug}
              r={r}
              it={it}
              perfil={perfil}
              cond={cond}
              alSimular={alSimular}
              alAplicar={alAplicar}
            />
          );
        })}
      </ul>
      {!compacto && resultado.evaluados.length > VISIBLES && (
        <button type="button" className="sim-boton sim-boton-texto sim-ver-todos" aria-expanded={todos} onClick={() => setTodos(!todos)}>
          {todos ? t.verMenos : t.verTodos(resultado.evaluados.length)}
        </button>
      )}
      {resultado.consultar.length > 0 && (
        <p className="sim-consultar">
          {t.sinPrecioPublicado}{" "}
          {resultado.consultar.map((c, i) => {
            const it = de(c.slug);
            return (
              <span key={c.slug}>
                {i > 0 ? ", " : ""}
                {it ? <a href={it.href}>{it.nombre}</a> : c.nombre}
              </span>
            );
          })}
          . {t.consultaloConRafael}
        </p>
      )}
    </div>
  );
}

function Tarjeta({
  r,
  it,
  perfil,
  cond,
  alSimular,
  alAplicar,
}: {
  r: ResultadoItem;
  it: ItemSimulador;
  perfil: Perfil;
  cond: Condiciones;
  alSimular: (slug: string) => void;
  alAplicar?: (slug: string, cambios: Partial<EstadoSim>) => void;
}) {
  const { t, idioma } = useSim();
  const [abierta, setAbierta] = useState(false);
  const [ps, setPs] = useState<Palanca[] | null>(null);
  const codigo = `WEB-SIM-${it.slug}`;
  const wa = enlaceWhatsApp(`${t.waPreguntarPor(it.nombre)} (${codigo})`);

  const verPalancas = () => {
    const nueva = !abierta;
    setAbierta(nueva);
    if (nueva && !ps && r.item.precio != null) {
      setPs(
        palancas({ ...r.item, precio: r.item.precio }, perfil, cond, {
          mesesPorDefecto: PARAMETROS.mesesEntregaSupuesto.valor,
          plazoMaxAnios: LIMITES.plazoMaxAnios,
          financiacionMaxCredito: LIMITES.financiacionMaxNoVIS,
          financiacionMaxLeasing: LIMITES.financiacionMaxLeasing,
          tasaLeasingEA: cond.tasaEA,
          opcionCompraLeasing: PARAMETROS.opcionCompraLeasing.valor,
        }),
      );
    }
  };

  const aplicar = (p: Palanca) => {
    evento("simulator_lever_click", { palanca: p.palanca });
    const cambios: Partial<EstadoSim> = {};
    if (p.palanca === "plazo") cambios.plazoAnios = p.cambio.plazoAnios;
    if (p.palanca === "leasing") {
      cambios.modalidad = "leasing";
      cambios.pctFinanciado = p.cambio.pctFinanciado;
    }
    if (p.palanca === "financiacion-max") cambios.pctFinanciado = p.cambio.pctFinanciado;
    if (p.palanca === "codeudor") {
      cambios.conCodeudor = true;
      cambios.ingresoCodeudor = p.cambio.ingresoCodeudor;
    }
    if (p.palanca === "ahorro-adicional") cambios.ahorroMensual = perfil.ahorroMensual + p.cambio.ahorroMensualExtra;
    if (alAplicar) alAplicar(it.slug, cambios);
    else alSimular(it.slug);
  };

  return (
    <li className={`sim-tarjeta sim-tarjeta-${r.estado}`}>
      <div className="sim-tarjeta-cabeza">
        <a href={it.href} className="sim-tarjeta-nombre">
          {it.nombre}
        </a>
        <span className="sim-tarjeta-estado">{it.estado}</span>
      </div>
      <p className="sim-tarjeta-precio">
        <span data-cop={r.precio} data-desde="">
          {t.desde} {pesos(r.precio, idioma)}
        </span>
        {it.corte && <small>{t.corte(it.corte)}</small>}
      </p>
      <p className={`sim-tarjeta-veredicto sim-veredicto-${r.estado}`}>
        <span aria-hidden="true">{r.estado === "alcanza" ? "✓" : "·"}</span>
        {r.estado === "alcanza"
          ? t.teAlcanza
          : [
              r.faltaIngreso > 0 ? t.faltaIngreso(pesos(r.faltaIngreso, idioma)) : null,
              r.faltaCuotaInicial > 0 ? t.faltaCuotaInicial(pesos(r.faltaCuotaInicial, idioma)) : null,
            ]
              .filter(Boolean)
              .join(" · ")}
      </p>
      <p className="sim-tarjeta-cuota">
        {t.cuotaEstimada(pesos(r.cuota, idioma))}
        {r.pagoMensualObra != null &&
          (r.pagoMensualObra > 0.5 ? ` · ${t.enObra(pesos(r.pagoMensualObra, idioma), meses(r.meses, idioma))}` : ` · ${t.ciCubiertaCorta}`)}
        {r.mesesSupuestos && <small className="sim-tarjeta-supuesto">{t.mesesSupuestos(meses(r.meses, idioma))}</small>}
      </p>
      <div className="sim-tarjeta-acciones">
        <button type="button" className="sim-boton" onClick={() => alSimular(it.slug)}>
          {t.simularEste}
        </button>
        <a
          className="sim-boton sim-boton-wa"
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          data-ubicacion="simulador-cartera"
          onClick={() => evento("simulator_whatsapp", { proyecto: it.slug })}
        >
          {t.preguntarWA}
        </a>
        {r.estado !== "alcanza" && (
          <button type="button" className="sim-boton sim-boton-texto" aria-expanded={abierta} onClick={verPalancas}>
            {t.queMover}
          </button>
        )}
      </div>
      {abierta && ps && (
        <div className="sim-palancas">
          {ps.length === 0 ? (
            <p>{t.sinPalancas}</p>
          ) : (
            <ul>
              {ps.map((p) => (
                <li key={p.palanca}>
                  <span>
                    {t.palanca(p, idioma)}{" "}
                    {p.resuelve
                      ? inicialMinuscula(t.teAlcanza)
                      : [
                          p.resultado.faltaIngreso > 0 ? inicialMinuscula(t.faltaIngreso(pesos(p.resultado.faltaIngreso, idioma))) : null,
                          p.resultado.faltaCuotaInicial > 0 ? inicialMinuscula(t.faltaCuotaInicial(pesos(p.resultado.faltaCuotaInicial, idioma))) : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                  </span>
                  {p.palanca !== "unidad-menor" && (
                    <button type="button" className="sim-boton sim-boton-texto" onClick={() => aplicar(p)}>
                      {t.probarEsto}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  );
}
