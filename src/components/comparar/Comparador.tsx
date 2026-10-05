"use client";

/**
 * EL COMPARADOR (/comparar y /en/compare)
 *
 * Dos opciones de la cartera, lado a lado, para un perfil. Corre entero en el
 * navegador sobre lo que el servidor armó desde la capa de datos
 * (opciones.ts): no pide datos personales y no manda nada a ningún lado. La
 * elección queda en el «#» de la dirección para poder compartirla.
 *
 * Orden de la página, el del prompt de Rafael del 5-oct-2026: el puntaje y el
 * factor decisivo, los dos escenarios y la matriz punto por punto.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { CRITERIOS, ESCENARIOS, PESOS, cuotaInicialMinima, curvaIngreso, evaluar, ingresoRequerido, type Criterio, type Perfil } from "@/lib/comparar/evaluar";
import type { Grupo, Opcion } from "@/components/comparar/opciones";
import { TEXTOS } from "@/components/comparar/textos";
import { AreaPlazo, BarrasDivergentes, Columnas, DonaDither } from "@/components/comparar/Graficas";
import { pesos, pesosCorto, porcentaje } from "@/components/simulador/formato";
import { evento } from "@/components/simulador/analitica";
import { useReferenciaUSD } from "@/components/simulador/Dolares";
import { formatoDolares } from "@/lib/moneda";
import { enlaceWhatsApp } from "@/data/contacto";
import type { Idioma } from "@/i18n/idioma";

export type Reglas = {
  /** Tope de financiación del crédito hipotecario No VIS (0.7). */
  financiado: number;
  /** Tasa promedio de lo desembolsado en No VIS en pesos. */
  tasa: number;
  /** Primera cuota máxima frente al ingreso (0.4). */
  limite: number;
  /** Plazo de referencia para la cifra del ingreso (20 años). */
  plazo: number;
};

const PERFILES: Perfil[] = ["inversionista", "vivir", "mixto"];
const GRUPOS: Grupo[] = ["planos", "inmediata"];
const POR_DEFECTO: Record<Grupo, [string, string]> = {
  planos: ["doral-country", "doral-west"],
  inmediata: ["doral-suite", "doral-suites-320"],
};

function decimal(n: number, idioma: Idioma): string {
  const t = n.toFixed(1);
  return idioma === "en" ? t : t.replace(".", ",");
}

export default function Comparador({ idioma, opciones, reglas }: { idioma: Idioma; opciones: Opcion[]; reglas: Reglas }) {
  const t = TEXTOS[idioma];
  const deGrupo = (g: Grupo) => opciones.filter((o) => o.grupo === g);
  const inicial = (g: Grupo): [string, string] => {
    const lista = deGrupo(g);
    const [a, b] = POR_DEFECTO[g];
    const ok = (s: string) => lista.some((o) => o.slug === s);
    return [ok(a) ? a : lista[0]?.slug ?? "", ok(b) ? b : lista[1]?.slug ?? ""];
  };

  const [grupo, setGrupo] = useState<Grupo>("planos");
  const [a, setA] = useState(() => inicial("planos")[0]);
  const [b, setB] = useState(() => inicial("planos")[1]);
  const [perfil, setPerfil] = useState<Perfil>("mixto");
  const leido = useRef(false);
  const trm = useReferenciaUSD();

  // La elección viene en el «#»: #g=inmediata&a=doral-suite&b=…&perfil=vivir.
  useEffect(() => {
    const h = new URLSearchParams(window.location.hash.slice(1));
    const g = h.get("g") === "inmediata" ? "inmediata" : h.get("g") === "planos" ? "planos" : null;
    const q = new URLSearchParams(window.location.search).get("p");
    const lista = (gg: Grupo) => opciones.filter((o) => o.grupo === gg);
    let gg: Grupo = g ?? "planos";
    // ?p=slug (desde la ficha de un proyecto): esa opción entra como A, en su grupo.
    const desdeFicha = q ? opciones.find((o) => o.slug === q) : undefined;
    if (desdeFicha && !g) gg = desdeFicha.grupo;
    const [da, db] = inicial(gg);
    const va = h.get("a") ?? desdeFicha?.slug ?? da;
    const okA = lista(gg).some((o) => o.slug === va) ? va : da;
    const vb = h.get("b") ?? (okA === db ? da : db);
    const okB = lista(gg).some((o) => o.slug === vb) ? vb : db;
    const p = h.get("perfil");
    setGrupo(gg);
    setA(okA);
    setB(okB);
    if (p === "inversionista" || p === "vivir" || p === "mixto") setPerfil(p);
    leido.current = true;
    evento("comparator_view", { entrada: h.has("a") ? "enlace" : desdeFicha ? "proyecto" : "directa" });
    // Solo al cargar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!leido.current) return;
    const hash = `g=${grupo}&a=${a}&b=${b}&perfil=${perfil}`;
    history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${hash}`);
  }, [grupo, a, b, perfil]);

  const cambiar = (g: Grupo, na: string, nb: string, np: Perfil) => {
    evento("comparator_change", { grupo: g, opcion_a: na, opcion_b: nb, perfil: np });
  };

  const elegirGrupo = (g: Grupo) => {
    if (g === grupo) return;
    const [da, db] = inicial(g);
    setGrupo(g);
    setA(da);
    setB(db);
    cambiar(g, da, db, perfil);
  };

  const oa = opciones.find((o) => o.slug === a && o.grupo === grupo);
  const ob = opciones.find((o) => o.slug === b && o.grupo === grupo);
  const distintas = !!oa && !!ob && oa.slug !== ob.slug;

  const r = useMemo(() => (oa && ob ? evaluar(oa.datos, ob.datos, perfil) : null), [oa, ob, perfil]);
  const inv = useMemo(() => (oa && ob ? evaluar(oa.datos, ob.datos, "mixto", ESCENARIOS.inversion) : null), [oa, ob]);
  const hab = useMemo(() => (oa && ob ? evaluar(oa.datos, ob.datos, "mixto", ESCENARIOS.habitabilidad) : null), [oa, ob]);

  const ingreso = (o: Opcion | undefined) =>
    o?.precio ? ingresoRequerido(o.precio.desde, { financiado: reglas.financiado, tasaEA: reglas.tasa, plazoAnios: reglas.plazo, limite: reglas.limite }) : null;
  const cuota = (o: Opcion | undefined) => (o?.precio ? cuotaInicialMinima(o.precio.desde, reglas.financiado) : null);
  const curva = (o: Opcion | undefined) =>
    o?.precio ? curvaIngreso(o.precio.desde, { financiado: reglas.financiado, tasaEA: reglas.tasa, limite: reglas.limite }) : null;

  const valor = (o: Opcion, c: Criterio): string => {
    switch (c) {
      case "precio":
        return o.precio ? pesos(o.precio.desde, idioma) : t.consultar;
      case "entrega":
        return o.entregaTexto;
      case "rentaCorta":
        return o.rentaCorta ? t.rentaSi(o.rentaCorta) : t.rentaNo;
      case "espacio":
        return o.alcobas ?? t.sinDato;
      case "exterior":
        return o.exterior.length ? o.exterior.join(" · ") : t.sinDato;
      case "parqueadero":
        return o.parqueadero ?? t.sinDato;
      case "zonasComunes":
        return o.datos.zonasComunes == null ? t.sinDato : t.zonasCuenta(o.datos.zonasComunes);
      case "informacion": {
        const n = Object.values(o.datos.documentado).filter(Boolean).length;
        return idioma === "en" ? `${n} of 5 documented` : `${n} de 5 documentados`;
      }
    }
  };

  const usd = (cop: number) =>
    trm ? (
      <small className="cmp-usd">
        ≈ {formatoDolares(cop / trm.valor, idioma)}
        {idioma === "en" ? " reference" : ""}
      </small>
    ) : null;

  const nombrePerfil = t.perfiles[perfil].titulo;

  return (
    <div className="cmp">
      {/* ── Los controles ─────────────────────────── */}
      <div className="cmp-controles">
        <div className="cmp-grupos" role="group" aria-label={t.grupoAria}>
          {GRUPOS.map((g) => (
            <button key={g} type="button" aria-pressed={g === grupo} className="cmp-grupo" onClick={() => elegirGrupo(g)}>
              <strong>{t.grupos[g].titulo}</strong>
              <span>{t.grupos[g].nota}</span>
            </button>
          ))}
        </div>

        <div className="cmp-selectores">
          {(["a", "b"] as const).map((lado) => {
            const actual = lado === "a" ? a : b;
            const otro = lado === "a" ? b : a;
            return (
              <label key={lado} className={`cmp-selector cmp-selector-${lado}`}>
                <span>{lado === "a" ? t.opcionA : t.opcionB}</span>
                <select
                  value={actual}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (lado === "a") setA(v);
                    else setB(v);
                    cambiar(grupo, lado === "a" ? v : a, lado === "b" ? v : b, perfil);
                  }}
                >
                  {deGrupo(grupo).map((o) => (
                    <option key={o.slug} value={o.slug} disabled={o.slug === otro}>
                      {o.nombre}
                    </option>
                  ))}
                </select>
              </label>
            );
          })}
        </div>

        <fieldset className="cmp-perfiles">
          <legend>{t.perfilTitulo}</legend>
          <div className="cmp-perfiles-botones">
            {PERFILES.map((p) => (
              <button
                key={p}
                type="button"
                aria-pressed={p === perfil}
                className="cmp-perfil"
                onClick={() => {
                  setPerfil(p);
                  cambiar(grupo, a, b, p);
                }}
              >
                {t.perfiles[p].titulo}
              </button>
            ))}
          </div>
          <p className="cmp-perfil-nota">{t.perfiles[perfil].nota}</p>
        </fieldset>
      </div>

      {!distintas || !oa || !ob || !r || !inv || !hab ? (
        <p className="cmp-aviso">{t.mismaOpcion}</p>
      ) : (
        <>
          {/* ── Las dos opciones ─────────────────────── */}
          <div className="cmp-cabezas">
            {[oa, ob].map((o, i) => (
              <article key={o.slug} className={`cmp-cabeza cmp-cabeza-${i ? "b" : "a"}`}>
                <p className="cmp-cabeza-letra">{i ? t.opcionB : t.opcionA}</p>
                <h3>{o.nombre}</h3>
                <p className="cmp-cabeza-zona">
                  {o.zona} · {o.estado}
                </p>
                <p className="cmp-cabeza-precio">
                  {o.precio ? (
                    <>
                      <strong>{pesos(o.precio.desde, idioma)}</strong>
                      {usd(o.precio.desde)}
                      <small>{t.corte(o.precio.corte)}</small>
                    </>
                  ) : (
                    <strong>{t.consultar}</strong>
                  )}
                </p>
                <a className="cmp-enlace" href={o.href}>
                  {t.verFicha} →
                </a>
              </article>
            ))}
          </div>

          {/* ── El puntaje ──────────────────────────── */}
          <section className="cmp-bloque cmp-puntaje" aria-labelledby="cmp-puntaje-titulo">
            <p className="section-kicker">{t.puntajeKicker}</p>
            <h2 id="cmp-puntaje-titulo">{t.puntajeTitulo}</h2>
            <p className="cmp-lede">{t.puntajeLede(nombrePerfil)}</p>
            <div className="cmp-donas">
              <div className={`cmp-dona-caja cmp-a${r.ganador === "a" ? " cmp-gana" : ""}`}>
                <DonaDither valor={r.puntajeA} color="#1f2a3d" etiqueta={oa.nombre} sobre={t.sobre100} />
                <p>{oa.nombre}</p>
              </div>
              <div className={`cmp-dona-caja cmp-b${r.ganador === "b" ? " cmp-gana" : ""}`}>
                <DonaDither valor={r.puntajeB} color="#a8875a" etiqueta={ob.nombre} sobre={t.sobre100} />
                <p>{ob.nombre}</p>
              </div>
            </div>

            <div className="cmp-decisivo">
              <p className="cmp-decisivo-kicker">{t.decisivoTitulo}</p>
              {r.decisivo && r.ganador !== "empate" ? (
                <>
                  <p className="cmp-decisivo-frase">
                    {(r.ganador === "a" ? r.decisivo.notaB : r.decisivo.notaA) == null
                      ? t.decisivoSinDato(
                          r.ganador === "a" ? oa.nombre : ob.nombre,
                          r.ganador === "a" ? ob.nombre : oa.nombre,
                          t.criterios[r.decisivo.criterio].titulo,
                        )
                      : t.decisivo(r.ganador === "a" ? oa.nombre : ob.nombre, t.criterios[r.decisivo.criterio].titulo)}
                  </p>
                  <dl className="cmp-decisivo-datos">
                    <div className="cmp-a">
                      <dt>{oa.nombre}</dt>
                      <dd>{valor(oa, r.decisivo.criterio)}</dd>
                    </div>
                    <div className="cmp-b">
                      <dt>{ob.nombre}</dt>
                      <dd>{valor(ob, r.decisivo.criterio)}</dd>
                    </div>
                  </dl>
                  {r.contrapeso && (
                    <p className="cmp-contrapeso">
                      {t.contrapeso(r.ganador === "a" ? ob.nombre : oa.nombre, t.criterios[r.contrapeso.criterio].titulo)}{" "}
                      <span>
                        ({oa.nombre}: {valor(oa, r.contrapeso.criterio)} · {ob.nombre}: {valor(ob, r.contrapeso.criterio)})
                      </span>
                    </p>
                  )}
                </>
              ) : (
                <p className="cmp-decisivo-frase">{t.empate}</p>
              )}
            </div>

            <h3 className="cmp-subtitulo">{t.aportesTitulo}</h3>
            <p className="cmp-lede">{t.aportesLede}</p>
            <BarrasDivergentes
              nombreA={oa.nombre}
              nombreB={ob.nombre}
              totalA={r.puntajeA}
              totalB={r.puntajeB}
              posibles={t.posibles}
              aria={t.totalAria(oa.nombre, String(Math.round(r.puntajeA)), ob.nombre, String(Math.round(r.puntajeB)))}
              filas={r.aportes.map((x) => ({
                clave: x.criterio,
                titulo: t.criterios[x.criterio].titulo,
                peso: x.peso,
                puntosA: x.puntosA,
                puntosB: x.puntosB,
                textoA: x.notaA == null ? t.sinDato : decimal(x.puntosA, idioma),
                textoB: x.notaB == null ? t.sinDato : decimal(x.puntosB, idioma),
              }))}
            />
          </section>

          {/* ── Los escenarios ───────────────────────── */}
          <section className="cmp-bloque" aria-labelledby="cmp-esc-titulo">
            <p className="section-kicker">{t.escenariosKicker}</p>
            <h2 id="cmp-esc-titulo">{t.escenariosTitulo}</h2>
            <div className="cmp-escenarios">
              <article className="cmp-escenario">
                <h3>{t.inversionTitulo}</h3>
                <p className="cmp-lede">{t.inversionLede}</p>
                <p className="cmp-veredicto">{inv.ganador === "empate" ? t.quedaEmpate : t.queda(inv.ganador === "a" ? oa.nombre : ob.nombre)}</p>
                <table className="cmp-tabla cmp-tabla-corta">
                  <thead>
                    <tr>
                      <th scope="col"><span className="sr-only">—</span></th>
                      <th scope="col" className="cmp-a">{oa.nombre}</th>
                      <th scope="col" className="cmp-b">{ob.nombre}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(["entrega", "rentaCorta"] as Criterio[]).map((c) => (
                      <tr key={c}>
                        <th scope="row">{t.criterios[c].titulo}</th>
                        <td>{valor(oa, c)}</td>
                        <td>{valor(ob, c)}</td>
                      </tr>
                    ))}
                    <tr>
                      <th scope="row">{t.cuotaInicial}</th>
                      <td>{cuota(oa) != null ? pesos(cuota(oa)!, idioma) : t.consultar}</td>
                      <td>{cuota(ob) != null ? pesos(cuota(ob)!, idioma) : t.consultar}</td>
                    </tr>
                    <tr>
                      <th scope="row">{t.ingreso20}</th>
                      <td>{ingreso(oa) != null ? pesos(ingreso(oa)!, idioma) : t.consultar}</td>
                      <td>{ingreso(ob) != null ? pesos(ingreso(ob)!, idioma) : t.consultar}</td>
                    </tr>
                  </tbody>
                </table>
                <p className="cmp-nota">{t.noProyectamos}</p>
                <p className="cmp-acciones">
                  {[oa, ob].map((o) => (
                    <a key={o.slug} className="cmp-enlace" href={o.simular}>
                      {o.rentaCorta ? t.simularRenta(o.nombre) : t.simular(o.nombre)} →
                    </a>
                  ))}
                </p>
              </article>

              <article className="cmp-escenario">
                <h3>{t.habitabilidadTitulo}</h3>
                <p className="cmp-lede">{t.habitabilidadLede}</p>
                <p className="cmp-veredicto">{hab.ganador === "empate" ? t.quedaEmpate : t.queda(hab.ganador === "a" ? oa.nombre : ob.nombre)}</p>
                <table className="cmp-tabla cmp-tabla-corta">
                  <thead>
                    <tr>
                      <th scope="col"><span className="sr-only">—</span></th>
                      <th scope="col" className="cmp-a">{oa.nombre}</th>
                      <th scope="col" className="cmp-b">{ob.nombre}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ESCENARIOS.habitabilidad.map((c) => (
                      <tr key={c}>
                        <th scope="row">{t.criterios[c].titulo}</th>
                        <td>{valor(oa, c)}</td>
                        <td>{valor(ob, c)}</td>
                      </tr>
                    ))}
                    <tr>
                      <th scope="row">{t.filas.banos}</th>
                      <td>{oa.banos ?? t.sinDato}</td>
                      <td>{ob.banos ?? t.sinDato}</td>
                    </tr>
                  </tbody>
                </table>
              </article>
            </div>
          </section>

          {/* ── La matriz ────────────────────────────── */}
          <section className="cmp-bloque" aria-labelledby="cmp-matriz-titulo">
            <p className="section-kicker">{t.matrizKicker}</p>
            <h2 id="cmp-matriz-titulo">{t.matrizTitulo}</h2>

            <h3 className="cmp-subtitulo">{t.columnasTitulo}</h3>
            <Columnas
              nombreA={oa.nombre}
              nombreB={ob.nombre}
              menor={t.menor}
              grupos={[
                { clave: "precio", titulo: t.columnas.precio, a: { valor: oa.precio?.desde ?? null, texto: oa.precio ? pesosCorto(oa.precio.desde, idioma) : t.consultar }, b: { valor: ob.precio?.desde ?? null, texto: ob.precio ? pesosCorto(ob.precio.desde, idioma) : t.consultar } },
                { clave: "cuota", titulo: t.columnas.cuota, a: { valor: cuota(oa), texto: cuota(oa) != null ? pesosCorto(cuota(oa)!, idioma) : t.consultar }, b: { valor: cuota(ob), texto: cuota(ob) != null ? pesosCorto(cuota(ob)!, idioma) : t.consultar } },
                { clave: "ingreso", titulo: `${t.columnas.ingreso} (${t.anios(reglas.plazo)})`, a: { valor: ingreso(oa), texto: ingreso(oa) != null ? pesosCorto(ingreso(oa)!, idioma) : t.consultar }, b: { valor: ingreso(ob), texto: ingreso(ob) != null ? pesosCorto(ingreso(ob)!, idioma) : t.consultar } },
                { clave: "m2", titulo: t.columnas.m2, a: { valor: oa.precioM2?.valor ?? null, texto: oa.precioM2 ? pesosCorto(oa.precioM2.valor, idioma) : t.sinDato }, b: { valor: ob.precioM2?.valor ?? null, texto: ob.precioM2 ? pesosCorto(ob.precioM2.valor, idioma) : t.sinDato } },
              ]}
            />
            <p className="cmp-nota">
              {t.columnasNota(porcentaje(reglas.tasa, idioma, 2), t.anios(reglas.plazo), porcentaje(reglas.limite, idioma), porcentaje(reglas.financiado, idioma))}
            </p>

            <div className="cmp-tabla-marco">
              <table className="cmp-tabla cmp-matriz">
                <thead>
                  <tr>
                    <th scope="col"><span className="sr-only">—</span></th>
                    <th scope="col" className="cmp-a">{oa.nombre}</th>
                    <th scope="col" className="cmp-b">{ob.nombre}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">{t.filas.precio}</th>
                    {[oa, ob].map((o) => (
                      <td key={o.slug}>
                        {o.precio ? (
                          <>
                            {o.precio.desde === o.precio.hasta ? pesos(o.precio.desde, idioma) : `${pesos(o.precio.desde, idioma)} – ${pesos(o.precio.hasta, idioma)}`}
                            <small>{t.corte(o.precio.corte)}</small>
                          </>
                        ) : (
                          t.consultar
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row">{t.filas.precioM2}</th>
                    {[oa, ob].map((o) => (
                      <td key={o.slug}>
                        {o.precioM2 ? (
                          <>
                            {pesos(o.precioM2.valor, idioma)}
                            <small>{t.m2Nota(o.precioM2.area, o.precioM2.etiqueta)}</small>
                          </>
                        ) : (
                          <small>{t.m2SinDato}</small>
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row">{t.filas.unidades}</th>
                    {[oa, ob].map((o) => (
                      <td key={o.slug}>{o.unidades != null && o.precio ? `${o.unidades} ${t.alCorte(o.precio.corte)}` : "—"}</td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row">{t.filas.area}</th>
                    {[oa, ob].map((o) => (
                      <td key={o.slug}>
                        {o.area ? (
                          <>
                            {o.area.texto}
                            {o.area.etiquetas.length > 0 && <small>«{o.area.etiquetas.join("» · «")}»</small>}
                            {o.area.conflicto && <small className="cmp-alerta">{t.areaConflicto}</small>}
                          </>
                        ) : (
                          t.sinDato
                        )}
                      </td>
                    ))}
                  </tr>
                  {(["espacio", "exterior", "parqueadero"] as Criterio[]).map((c) => (
                    <tr key={c}>
                      <th scope="row">{c === "espacio" ? t.filas.alcobas : c === "exterior" ? t.filas.exterior : t.filas.parqueadero}</th>
                      <td>{valor(oa, c)}</td>
                      <td>{valor(ob, c)}</td>
                    </tr>
                  ))}
                  <tr>
                    <th scope="row">{t.filas.banos}</th>
                    <td>{oa.banos ?? t.sinDato}</td>
                    <td>{ob.banos ?? t.sinDato}</td>
                  </tr>
                  <tr>
                    <th scope="row">{t.filas.entrega}</th>
                    <td>{oa.entregaTexto}</td>
                    <td>{ob.entregaTexto}</td>
                  </tr>
                  <tr>
                    <th scope="row">{t.filas.rentaCorta}</th>
                    <td>{valor(oa, "rentaCorta")}</td>
                    <td>{valor(ob, "rentaCorta")}</td>
                  </tr>
                  <tr>
                    <th scope="row">{t.filas.zonas}</th>
                    {[oa, ob].map((o) => (
                      <td key={o.slug}>
                        {o.amenidades.length ? (
                          <>
                            <ul className="cmp-lista">
                              {o.amenidades.map((x) => (
                                <li key={x}>{x}</li>
                              ))}
                            </ul>
                            <small>{t.cuentan(o.datos.zonasComunes ?? 0)}</small>
                            <small>
                              {t.fuente}: {o.amenidadesFuente}
                            </small>
                          </>
                        ) : (
                          t.sinDato
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row">{t.filas.ubicacion}</th>
                    {[oa, ob].map((o) => (
                      <td key={o.slug}>
                        {o.ubicacion ?? <span className="cmp-alerta">{t.ubicacionSinDato}</span>}
                        <small>
                          {t.fuente}: {o.ubicacionFuente}
                        </small>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="cmp-nota">{t.areaPendiente}</p>

            <h3 className="cmp-subtitulo">{t.areaTitulo}</h3>
            <p className="cmp-lede">{t.areaLede}</p>
            <AreaPlazo
              serieA={curva(oa)}
              serieB={curva(ob)}
              nombreA={oa.nombre}
              nombreB={ob.nombre}
              formato={(n) => pesos(n, idioma)}
              anios={t.anios}
              eje={t.areaEje}
              aria={t.areaAria(oa.nombre, ob.nombre)}
            />
            {(!oa.precio || !ob.precio) && <p className="cmp-nota">{t.consultar}: {[oa, ob].filter((o) => !o.precio).map((o) => o.nombre).join(", ")}</p>}
          </section>

          {/* ── Cómo se calcula ──────────────────────── */}
          <section className="cmp-bloque cmp-reglas" aria-labelledby="cmp-reglas-titulo">
            <p className="section-kicker">{t.reglaKicker}</p>
            <div className="cmp-tabla-marco">
              <table className="cmp-tabla cmp-pesos" id="cmp-reglas-titulo">
                <thead>
                  <tr>
                    <th scope="col"><span className="sr-only">—</span></th>
                    {PERFILES.map((p) => (
                      <th key={p} scope="col" className={p === perfil ? "cmp-activo" : undefined}>
                        {t.perfiles[p].titulo}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CRITERIOS.map((c) => (
                    <tr key={c}>
                      <th scope="row">
                        {t.criterios[c].titulo}
                        <small>{t.criterios[c].regla}</small>
                      </th>
                      {PERFILES.map((p) => (
                        <td key={p} className={p === perfil ? "cmp-activo" : undefined}>
                          {PESOS[p][c] || "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <p className="cmp-cierre">
            <a
              className="btn-primary cmp-wa"
              href={enlaceWhatsApp(t.mensajeWhatsapp(oa.nombre, ob.nombre, nombrePerfil))}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t.whatsapp}
            </a>
          </p>
        </>
      )}
    </div>
  );
}
