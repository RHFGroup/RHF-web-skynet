"use client";

/**
 * Las gráficas del simulador, en SVG propio y sin librerías:
 *  · «Tu camino a la escritura» (M16): toda la compra mes a mes, de hoy al
 *    último pago. Al pasar el cursor o el dedo por un mes, lo que se paga ese
 *    mes, lo que se debe y cuánto del inmueble ya es de la persona.
 *  · La composición de la cuota por año: capital, intereses y seguros.
 *  · La tabla de amortización, agrupada por años y abierta por meses.
 *
 * Cada gráfica tiene su versión en texto para lectores de pantalla, y ninguna
 * se anima: respeta la preferencia de movimiento reducido del sitio.
 */
import { useMemo, useState } from "react";
import type { ResultadoSimulador } from "@/lib/simulador/simular";
import { useSim } from "@/components/simulador/contexto";
import { mesDesdeHoy, pesos, porcentaje } from "@/components/simulador/formato";

const ANCHO = 1000;
const ALTO = 160;

export function LineaTiempo({ r }: { r: ResultadoSimulador }) {
  const { t, idioma, hoy, estado } = useSim();
  const camino = r.camino;
  const total = Math.max(1, camino.length);
  const [cursor, setCursor] = useState<number | null>(null);
  const inicio = hoy ?? "2026-10-01";

  // La escala ignora los pagos grandes de un solo mes (la firma y la
  // entrega): si no, las cuotas se verían planas. Esos van hasta arriba, con
  // su cifra escrita.
  const { escala, picos } = useMemo(() => {
    const normales = camino.filter((m) => m.gastosCierre === 0 && !(m.mes === 0 && m.etapa !== "credito")).map((m) => m.pago);
    const max = Math.max(1, ...normales) * 1.15;
    return { escala: max, picos: camino.filter((m) => m.pago > max) };
  }, [camino]);

  const ancho = ANCHO / total;
  const deudaMax = Math.max(1, ...camino.map((m) => m.deuda));
  const linea = camino.map((m, i) => `${(i + 0.5) * ancho},${ALTO - (m.deuda / deudaMax) * (ALTO - 12) - 6}`).join(" ");
  const mesEntrega = camino.find((m) => m.etapa === "entrega")?.mes ?? 0;
  const pctEntrega = (mesEntrega / total) * 100;
  const ultimo = camino[camino.length - 1];
  const sel = cursor != null ? camino[Math.min(camino.length - 1, Math.max(0, cursor))] : null;

  const mover = (clientX: number, caja: DOMRect) => {
    const i = Math.floor(((clientX - caja.left) / caja.width) * total);
    setCursor(Math.min(total - 1, Math.max(0, i)));
  };

  return (
    <section className="sim-bloque sim-camino" aria-labelledby="sim-camino-titulo">
      <h3 id="sim-camino-titulo">{t.caminoTitulo}</h3>
      <p className="sim-bloque-lede">{t.caminoLede}</p>
      <div
        className="sim-camino-lienzo"
        tabIndex={0}
        role="img"
        aria-label={t.caminoAria(mesDesdeHoy(inicio, mesEntrega, idioma), mesDesdeHoy(inicio, ultimo?.mes ?? 0, idioma))}
        onPointerMove={(e) => mover(e.clientX, e.currentTarget.getBoundingClientRect())}
        onPointerDown={(e) => mover(e.clientX, e.currentTarget.getBoundingClientRect())}
        onPointerLeave={() => setCursor(null)}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") setCursor((c) => Math.min(total - 1, (c ?? -1) + (e.shiftKey ? 12 : 1)));
          if (e.key === "ArrowLeft") setCursor((c) => Math.max(0, (c ?? 1) - (e.shiftKey ? 12 : 1)));
        }}
      >
        <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} preserveAspectRatio="none" aria-hidden="true">
          {camino.map((m, i) => {
            const alto = Math.min(ALTO - 4, (m.pago / escala) * (ALTO - 12));
            const clase =
              m.gastosCierre > 0 ? "sim-b-cierre" : m.etapa === "credito" ? (m.abono > 0 ? "sim-b-abono" : "sim-b-credito") : m.mes === 0 ? "sim-b-firma" : "sim-b-obra";
            return <rect key={m.mes} className={clase} x={i * ancho} y={ALTO - alto} width={Math.max(ancho - (total > 120 ? 0 : 1), 0.6)} height={alto} />;
          })}
          <polyline className="sim-deuda" points={linea} fill="none" vectorEffect="non-scaling-stroke" />
          {cursor != null && <rect className="sim-cursor" x={cursor * ancho} y={0} width={Math.max(ancho, 2)} height={ALTO} />}
        </svg>
        {/* Las marcas, en HTML para que el texto no se estire con la gráfica. Si
            la entrega queda muy cerca de hoy (una obra corta en un crédito
            largo), su marca baja a una segunda línea; los picos seguidos se
            apilan. En el borde, el texto se alinea hacia adentro. */}
        <span className="sim-marca sim-marca-hoy" style={{ left: "0%" }}>
          {t.marcaHoy}
        </span>
        {mesEntrega > 0 && (
          <span
            className={[
              "sim-marca",
              pctEntrega < 16 ? "sim-marca-abajo" : "",
              pctEntrega < 8 ? "sim-marca-izq" : "",
            ].join(" ")}
            style={{ left: `${pctEntrega}%` }}
          >
            {t.marcaEntrega}
          </span>
        )}
        <span className="sim-marca sim-marca-fin" style={{ right: "0%" }}>
          {t.marcaFin}
        </span>
        {picos.map((m, k) => {
          const x = (camino.indexOf(m) / total) * 100;
          const previo = k > 0 ? (camino.indexOf(picos[k - 1]) / total) * 100 : -100;
          const clase = [
            "sim-pico",
            x < 8 ? "sim-pico-izq" : x > 92 ? "sim-pico-der" : "",
            k % 2 === 1 && x - previo < 24 ? "sim-pico-arriba" : "",
          ].join(" ");
          return (
            <span key={m.mes} className={clase} style={{ left: `${x}%` }}>
              {pesos(m.pago, idioma)}
            </span>
          );
        })}
      </div>
      <div className="sim-camino-panel" aria-live="polite">
        {sel ? (
          <p>
            <b>{t.caminoMes(sel.mes, mesDesdeHoy(inicio, sel.mes, idioma))}</b>
            {" · "}
            {t.caminoPagas(pesos(sel.pago, idioma))}
            {sel.gastosCierre > 0 ? ` (${t.caminoIncluyeCierre(pesos(sel.gastosCierre, idioma))})` : ""}
            {" · "}
            {t.caminoDebes(pesos(sel.deuda, idioma))}
            {" · "}
            {t.caminoTuyo(porcentaje(sel.propio, idioma))}
          </p>
        ) : (
          <p className="sim-camino-ayuda">{t.caminoAyuda}</p>
        )}
      </div>
      <ul className="sim-leyenda" aria-hidden="true">
        <li className="sim-l-obra">{estado.meses > 0 ? t.leyendaObra : t.leyendaFirma}</li>
        <li className="sim-l-cierre">{t.leyendaCierre}</li>
        <li className="sim-l-credito">{t.leyendaCredito}</li>
        {estado.abonoAnual > 0 || estado.abonoMensual > 0 ? <li className="sim-l-abono">{t.leyendaAbono}</li> : null}
        <li className="sim-l-deuda">{t.leyendaDeuda}</li>
      </ul>
      {/* La versión en texto: los hitos de la compra. Va dentro de un div: una
          tabla no se deja encoger a 1 px y ensanchaba la página. */}
      <div className="sr-only">
      <table>
        <caption>{t.caminoTitulo}</caption>
        <thead>
          <tr>
            <th scope="col">{t.colMes}</th>
            <th scope="col">{t.colPago}</th>
            <th scope="col">{t.colDeuda}</th>
          </tr>
        </thead>
        <tbody>
          {camino
            .filter((m) => m.mes === 0 || m.etapa === "entrega" || m.mes % 12 === 0 || m === ultimo)
            .map((m) => (
              <tr key={m.mes}>
                <td>{mesDesdeHoy(inicio, m.mes, idioma)}</td>
                <td>{pesos(m.pago, idioma)}</td>
                <td>{pesos(m.deuda, idioma)}</td>
              </tr>
            ))}
        </tbody>
      </table>
      </div>
    </section>
  );
}

/** Capital, intereses y seguros de cada año del crédito, apilados. */
export function Composicion({ r }: { r: ResultadoSimulador }) {
  const { t, idioma } = useSim();
  const anios = useMemo(() => {
    const a: { anio: number; capital: number; interes: number; seguros: number }[] = [];
    for (const m of r.credito?.meses ?? []) {
      const k = Math.floor((m.mes - 1) / 12);
      a[k] ??= { anio: k + 1, capital: 0, interes: 0, seguros: 0 };
      a[k].capital += m.capital + m.abono;
      a[k].interes += m.interes;
      a[k].seguros += m.seguros;
    }
    return a;
  }, [r.credito]);
  if (!anios.length) return null;
  const max = Math.max(...anios.map((a) => a.capital + a.interes + a.seguros));
  const ancho = ANCHO / anios.length;
  const alto = (v: number) => (v / max) * (ALTO - 8);
  const primero = anios[0];
  return (
    <section className="sim-bloque" aria-labelledby="sim-comp-titulo">
      <h3 id="sim-comp-titulo">{t.composicionTitulo}</h3>
      <p className="sim-bloque-lede">
        {t.composicionLede(porcentaje(primero.interes / Math.max(1, primero.capital + primero.interes + primero.seguros), idioma))}
      </p>
      <div className="sim-comp-lienzo">
        <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} preserveAspectRatio="none" role="img" aria-label={t.composicionTitulo}>
          {anios.map((a, i) => {
            const hC = alto(a.capital);
            const hI = alto(a.interes);
            const hS = alto(a.seguros);
            const x = i * ancho + ancho * 0.12;
            const w = ancho * 0.76;
            return (
              <g key={a.anio}>
                <title>{t.composicionAnio(a.anio, pesos(a.capital, idioma), pesos(a.interes, idioma), pesos(a.seguros, idioma))}</title>
                <rect className="sim-b-capital" x={x} y={ALTO - hC} width={w} height={hC} />
                <rect className="sim-b-interes" x={x} y={ALTO - hC - hI} width={w} height={hI} />
                <rect className="sim-b-seguros" x={x} y={ALTO - hC - hI - hS} width={w} height={hS} />
              </g>
            );
          })}
        </svg>
        <div className="sim-comp-ejes" aria-hidden="true">
          <span>{t.anioN(1)}</span>
          <span>{t.anioN(anios.length)}</span>
        </div>
      </div>
      <ul className="sim-leyenda" aria-hidden="true">
        <li className="sim-l-capital">{t.leyendaCapital}</li>
        <li className="sim-l-interes">{t.leyendaInteres}</li>
        <li className="sim-l-seguros">{t.leyendaSeguros}</li>
      </ul>
    </section>
  );
}

/** La tabla de amortización por años; cada año se abre por meses. */
export function TablaAnual({ r }: { r: ResultadoSimulador }) {
  const { t, idioma } = useSim();
  const [abiertos, setAbiertos] = useState<number[]>([]);
  const anios = useMemo(() => {
    const a: { anio: number; cuotas: number; interes: number; capital: number; seguros: number; abonos: number; saldo: number; meses: NonNullable<ResultadoSimulador["credito"]>["meses"] }[] = [];
    for (const m of r.credito?.meses ?? []) {
      const k = Math.floor((m.mes - 1) / 12);
      a[k] ??= { anio: k + 1, cuotas: 0, interes: 0, capital: 0, seguros: 0, abonos: 0, saldo: 0, meses: [] };
      a[k].cuotas += m.cuota;
      a[k].interes += m.interes;
      a[k].capital += m.capital;
      a[k].seguros += m.seguros;
      a[k].abonos += m.abono;
      a[k].saldo = m.saldo;
      a[k].meses.push(m);
    }
    return a;
  }, [r.credito]);
  if (!r.credito) return null;
  const monto = r.credito.montoFinanciado;
  const pagado = (saldo: number) => porcentaje(monto > 0 ? (monto - saldo) / monto : 1, idioma);
  return (
    <details className="sim-bloque sim-tabla">
      <summary>
        <h3>{t.tablaTitulo}</h3>
      </summary>
      <div className="sim-tabla-scroll">
        <table>
          <thead>
            <tr>
              <th scope="col">{t.colAnio}</th>
              <th scope="col">{t.colCuotas}</th>
              <th scope="col">{t.colInteres}</th>
              <th scope="col">{t.colCapital}</th>
              <th scope="col">{t.colSeguros}</th>
              <th scope="col">{t.colAbonos}</th>
              <th scope="col">{t.colSaldo}</th>
              <th scope="col">{t.colPagado}</th>
            </tr>
          </thead>
          <tbody>
            {anios.map((a) => {
              const abierto = abiertos.includes(a.anio);
              return [
                <tr key={`a${a.anio}`} className="sim-fila-anio">
                  <th scope="row">
                    <button
                      type="button"
                      aria-expanded={abierto}
                      onClick={() => setAbiertos(abierto ? abiertos.filter((x) => x !== a.anio) : [...abiertos, a.anio])}
                    >
                      {t.anioN(a.anio)}
                    </button>
                  </th>
                  <td>{pesos(a.cuotas, idioma)}</td>
                  <td>{pesos(a.interes, idioma)}</td>
                  <td>{pesos(a.capital, idioma)}</td>
                  <td>{pesos(a.seguros, idioma)}</td>
                  <td>{a.abonos > 0 ? pesos(a.abonos, idioma) : "—"}</td>
                  <td>{pesos(a.saldo, idioma)}</td>
                  <td>{pagado(a.saldo)}</td>
                </tr>,
                ...(abierto
                  ? a.meses.map((m) => (
                      <tr key={`m${m.mes}`} className="sim-fila-mes">
                        <th scope="row">{t.mesN(m.mes)}</th>
                        <td>{pesos(m.cuota, idioma)}</td>
                        <td>{pesos(m.interes, idioma)}</td>
                        <td>{pesos(m.capital, idioma)}</td>
                        <td>{pesos(m.seguros, idioma)}</td>
                        <td>{m.abono > 0 ? pesos(m.abono, idioma) : "—"}</td>
                        <td>{pesos(m.saldo, idioma)}</td>
                        <td>{pagado(m.saldo)}</td>
                      </tr>
                    ))
                  : []),
              ];
            })}
          </tbody>
        </table>
      </div>
    </details>
  );
}
