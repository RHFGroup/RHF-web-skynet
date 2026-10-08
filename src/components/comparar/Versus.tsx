"use client";

/**
 * EL TABLERO «VERSUS» DEL COMPARADOR (5-oct-2026)
 *
 * Pedido de Rafael: «un cuadro más simplificado, corto y preciso», dinámico
 * y con mejores animaciones, con la arquitectura de un dashboard «Versus»:
 * radar de 8 ejes, «Mayores diferencias» con badges y dos conclusiones.
 *
 * Sus decisiones del mismo día:
 *  · los 8 ejes son los que tienen dato con fuente (los criterios de
 *    src/lib/comparar/evaluar.ts), con sus nombres donde aplican. ROI,
 *    ubicación, diseño, sustentabilidad y esquema de pagos no tienen fuente
 *    por proyecto y no entran;
 *  · tema oscuro con la marca: A en azul neón, B en camel brillante;
 *  · el resto del comparador queda plegado debajo.
 *
 * Animación: el radar crece desde el centro al aparecer y se transforma con
 * resorte al cambiar de opción o de perfil; los puntajes cuentan; las filas
 * entran escalonadas. Con movimiento reducido, todo aparece quieto.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { CRITERIOS, notas, type Criterio, type Resultado } from "@/lib/comparar/evaluar";
import type { Opcion } from "@/components/comparar/opciones";
import { TEXTOS_VS } from "@/components/comparar/textos";
import { pesos, pesosCorto } from "@/components/simulador/formato";
import { movimientoReducido } from "@/lib/motion";
import type { Idioma } from "@/i18n/idioma";

// ── Un número que cuenta ────────────────────────────────────────────────

function Contador({ valor }: { valor: number }) {
  const [mostrado, setMostrado] = useState(valor);
  const desde = useRef(0);
  useEffect(() => {
    if (movimientoReducido()) {
      setMostrado(valor);
      desde.current = valor;
      return;
    }
    const inicio = performance.now();
    const origen = desde.current;
    let cuadro = 0;
    const paso = (ahora: number) => {
      const p = Math.min(1, (ahora - inicio) / 900);
      const e = 1 - Math.pow(1 - p, 3);
      const v = origen + (valor - origen) * e;
      setMostrado(v);
      desde.current = v;
      if (p < 1) cuadro = requestAnimationFrame(paso);
    };
    cuadro = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(cuadro);
  }, [valor]);
  return <>{Math.round(mostrado)}</>;
}

// ── El radar ────────────────────────────────────────────────────────────

const LADO = 420;
const C = LADO / 2;
const R = 138;

function punto(i: number, total: number, v: number): [number, number] {
  const ang = -Math.PI / 2 + (i * 2 * Math.PI) / total;
  const r = (R * Math.max(0, Math.min(100, v))) / 100;
  return [C + r * Math.cos(ang), C + r * Math.sin(ang)];
}

function Radar({
  ejes,
  a,
  b,
  nombreA,
  nombreB,
  sinDato,
  aria,
  ayuda,
}: {
  ejes: string[];
  a: (number | null)[];
  b: (number | null)[];
  nombreA: string;
  nombreB: string;
  sinDato: string;
  aria: string;
  ayuda: string;
}) {
  const n = ejes.length;
  const destino = useMemo(() => [...a, ...b].map((v) => v ?? 0), [a, b]);
  // Arranca en el centro (también en el HTML del build): el radar crece al aparecer.
  const [valores, setValores] = useState<number[]>(() => destino.map(() => 0));
  const actual = useRef<number[]>(destino.map(() => 0));
  const velocidad = useRef<number[]>(destino.map(() => 0));
  const caja = useRef<HTMLDivElement>(null);
  const [visto, setVisto] = useState(false);
  const [activo, setActivo] = useState<number | null>(null);

  // Crece desde el centro la primera vez que entra en pantalla.
  useEffect(() => {
    const el = caja.current;
    if (!el || movimientoReducido()) {
      setVisto(true);
      return;
    }
    const io = new IntersectionObserver(
      (e) => {
        if (e.some((x) => x.isIntersecting)) {
          setVisto(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
    // Solo al montar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resorte hacia los valores nuevos.
  useEffect(() => {
    if (!visto) return;
    if (movimientoReducido()) {
      actual.current = [...destino];
      setValores([...destino]);
      return;
    }
    let cuadro = 0;
    const paso = () => {
      const dt = 1 / 60;
      let quieto = true;
      const sig = actual.current.map((x, i) => {
        const f = 170 * (destino[i] - x) - 18 * velocidad.current[i];
        velocidad.current[i] += f * dt;
        const v = x + velocidad.current[i] * dt;
        if (Math.abs(destino[i] - v) > 0.05 || Math.abs(velocidad.current[i]) > 0.05) quieto = false;
        return v;
      });
      actual.current = quieto ? [...destino] : sig;
      setValores(actual.current);
      if (!quieto) cuadro = requestAnimationFrame(paso);
    };
    cuadro = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(cuadro);
  }, [destino, visto]);

  const va = valores.slice(0, n);
  const vb = valores.slice(n);
  const poli = (vs: number[]) => vs.map((v, i) => punto(i, n, v).map((c) => c.toFixed(1)).join(",")).join(" ");
  const anillos = [25, 50, 75, 100];
  const sel = activo;

  return (
    <div className="vs-radar" ref={caja}>
      {/* Margen a los lados para que las etiquetas largas no se corten en el teléfono. */}
      <svg viewBox={`-72 -6 ${LADO + 144} ${LADO + 12}`} role="img" aria-label={aria}>
        <defs>
          <filter id="vs-brillo" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="vs-fondo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1b2740" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#0c121c" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx={C} cy={C} r={R + 10} fill="url(#vs-fondo)" />
        {anillos.map((p) => (
          <polygon key={p} className="vs-anillo" points={poli(ejes.map(() => p))} />
        ))}
        {ejes.map((_, i) => {
          const [x, y] = punto(i, n, 100);
          return <line key={i} className={`vs-eje${sel === i ? " vs-eje-activo" : ""}`} x1={C} y1={C} x2={x} y2={y} />;
        })}
        <polygon className="vs-area vs-area-b" points={poli(vb)} filter="url(#vs-brillo)" />
        <polygon className="vs-area vs-area-a" points={poli(va)} filter="url(#vs-brillo)" />
        {va.map((v, i) => {
          const [x, y] = punto(i, n, v);
          return <circle key={`a${i}`} className={`vs-punto vs-punto-a${a[i] == null ? " vs-punto-vacio" : ""}`} cx={x} cy={y} r={sel === i ? 6 : 4} />;
        })}
        {vb.map((v, i) => {
          const [x, y] = punto(i, n, v);
          return <circle key={`b${i}`} className={`vs-punto vs-punto-b${b[i] == null ? " vs-punto-vacio" : ""}`} cx={x} cy={y} r={sel === i ? 6 : 4} />;
        })}
        {ejes.map((e, i) => {
          const ang = -Math.PI / 2 + (i * 2 * Math.PI) / n;
          const x = C + (R + 26) * Math.cos(ang);
          const y = C + (R + 26) * Math.sin(ang);
          const ancla = Math.abs(Math.cos(ang)) < 0.2 ? "middle" : Math.cos(ang) > 0 ? "start" : "end";
          return (
            <text
              key={e}
              x={x}
              y={y + 4}
              textAnchor={ancla}
              className={`vs-etiqueta${sel === i ? " vs-etiqueta-activa" : ""}`}
              tabIndex={0}
              onMouseEnter={() => setActivo(i)}
              onMouseLeave={() => setActivo(null)}
              onFocus={() => setActivo(i)}
              onBlur={() => setActivo(null)}
              onClick={() => setActivo(sel === i ? null : i)}
            >
              {e}
            </text>
          );
        })}
      </svg>
      <div className="vs-radar-lectura" aria-live="polite">
        {sel != null ? (
          <>
            <strong>{ejes[sel]}</strong>
            <span className="vs-a">
              {nombreA}: {a[sel] == null ? sinDato : Math.round(a[sel]!)}
            </span>
            <span className="vs-b">
              {nombreB}: {b[sel] == null ? sinDato : Math.round(b[sel]!)}
            </span>
          </>
        ) : (
          <span className="vs-radar-ayuda">{ayuda}</span>
        )}
      </div>
      <table className="sr-only">
        <tbody>
          {ejes.map((e, i) => (
            <tr key={e}>
              <th scope="row">{e}</th>
              <td>{a[i] == null ? sinDato : Math.round(a[i]!)}</td>
              <td>{b[i] == null ? sinDato : Math.round(b[i]!)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Mayores diferencias ─────────────────────────────────────────────────

type Fila = { clave: string; metrica: string; a: string; b: string; gana: "a" | "b" | null; insignia: string; peso: number };

function diferencias(oa: Opcion, ob: Opcion, idioma: Idioma, ingreso: (o: Opcion) => number | null): Fila[] {
  const t = TEXTOS_VS[idioma];
  const filas: Fila[] = [];
  const corto = (x: number) => pesosCorto(x, idioma);
  const rel = (x: number, y: number) => Math.abs(x - y) / Math.max(x, y);

  // Una cifra donde menos es mejor.
  const numero = (clave: string, metrica: string, x: number | null, y: number | null, sufijo: string, base: number) => {
    const fa = x != null ? corto(x) + sufijo : t.sinDato;
    const fb = y != null ? corto(y) + sufijo : t.sinDato;
    if (x != null && y != null) {
      const d = rel(x, y);
      if (d < 0.01) return filas.push({ clave, metrica, a: fa, b: fb, gana: null, insignia: t.empate, peso: 0 });
      return filas.push({ clave, metrica, a: fa, b: fb, gana: x < y ? "a" : "b", insignia: t.menos(corto(Math.abs(x - y)) + sufijo), peso: base * d });
    }
    if (x != null || y != null) filas.push({ clave, metrica, a: fa, b: fb, gana: x != null ? "a" : "b", insignia: t.soloPublica, peso: base * 0.5 });
  };
  numero("precio", t.filas.precio, oa.precio?.desde ?? null, ob.precio?.desde ?? null, "", 1.2);
  numero("m2", t.filas.precioM2, oa.precioM2?.valor ?? null, ob.precioM2?.valor ?? null, t.porM2, 1);
  numero("ingreso", t.filas.ingreso, ingreso(oa), ingreso(ob), t.porMes, 0.6);

  // La entrega.
  const ent = (o: Opcion) => o.datos.entrega;
  if (ent(oa) !== ent(ob)) {
    const orden = { inmediata: 2, "con-fecha": 1, "sin-fecha": 0 } as const;
    const gana = orden[ent(oa)] > orden[ent(ob)] ? "a" : "b";
    const g = gana === "a" ? oa : ob;
    filas.push({ clave: "entrega", metrica: t.filas.entrega, a: oa.entregaTexto, b: ob.entregaTexto, gana, insignia: g.datos.entrega === "inmediata" ? t.inmediata : t.conFecha, peso: g.datos.entrega === "inmediata" ? 0.95 : 0.45 });
  }

  // La renta corta.
  if (oa.datos.rentaCorta !== ob.datos.rentaCorta) {
    const gana = oa.datos.rentaCorta ? "a" : "b";
    filas.push({ clave: "renta", metrica: t.filas.rentaCorta, a: oa.datos.rentaCorta ? t.aprobada : "—", b: ob.datos.rentaCorta ? t.aprobada : "—", gana, insignia: t.aprobada, peso: 0.85 });
  }

  // Lo que se cuenta: más es mejor.
  const cuenta = (clave: string, metrica: string, x: number | null, y: number | null, unidad: (n: number) => string, base: number) => {
    if (x == null || y == null || x === y) return;
    const d = Math.abs(x - y);
    filas.push({ clave, metrica, a: String(x), b: String(y), gana: x > y ? "a" : "b", insignia: t.mas(d, unidad(d)), peso: (base * d) / Math.max(x, y) });
  };
  cuenta("alcobas", t.filas.alcobas, oa.datos.alcobasMax, ob.datos.alcobasMax, t.alcoba, 0.8);
  cuenta("zonas", t.filas.zonas, oa.datos.zonasComunes, ob.datos.zonasComunes, t.amenidad, 0.7);

  // El parqueadero y el exterior.
  const PQ = { privado: 3, "sin-precisar": 2, comunal: 1 } as const;
  const pa = oa.datos.parqueadero;
  const pb = ob.datos.parqueadero;
  if (pa !== pb && (pa || pb)) {
    const gana = (pa ? PQ[pa] : 0) > (pb ? PQ[pb] : 0) ? "a" : "b";
    const g = gana === "a" ? pa : pb;
    filas.push({ clave: "parqueadero", metrica: t.filas.parqueadero, a: oa.parqueadero ?? t.sinDato, b: ob.parqueadero ?? t.sinDato, gana, insignia: g === "privado" ? t.privado : t.soloPublica, peso: 0.55 });
  }
  const EX = { lote: 3, terraza: 2, balcon: 1, ninguno: 0 } as const;
  const ea = oa.datos.exterior;
  const eb = ob.datos.exterior;
  if (ea !== eb && (ea || eb)) {
    const gana = (ea ? EX[ea] : -1) > (eb ? EX[eb] : -1) ? "a" : "b";
    const g = gana === "a" ? ea : eb;
    if (g && g !== "ninguno") {
      filas.push({ clave: "exterior", metrica: t.filas.exterior, a: ea && ea !== "ninguno" ? t.exterior[ea] : t.sinDato, b: eb && eb !== "ninguno" ? t.exterior[eb] : t.sinDato, gana, insignia: t.exterior[g], peso: 0.5 });
    }
  }

  const fuertes = filas.filter((f) => f.gana).sort((x, y) => y.peso - x.peso);
  const parejas = filas.filter((f) => !f.gana);
  return [...fuertes, ...parejas].slice(0, 6);
}

// ── El tablero ──────────────────────────────────────────────────────────

export default function Versus({
  idioma,
  oa,
  ob,
  r,
  inversion,
  vivir,
  nombrePerfil,
  valor,
  titulos,
  ingreso,
}: {
  idioma: Idioma;
  oa: Opcion;
  ob: Opcion;
  r: Resultado;
  inversion: Resultado;
  vivir: Resultado;
  nombrePerfil: string;
  valor: (o: Opcion, c: Criterio) => string;
  titulos: Record<Criterio, string>;
  ingreso: (o: Opcion) => number | null;
}) {
  const t = TEXTOS_VS[idioma];
  const n = notas(oa.datos, ob.datos);
  const filas = diferencias(oa, ob, idioma, ingreso);
  const clave = `${oa.slug}|${ob.slug}`;

  const conclusion = (res: Resultado) => {
    if (res.ganador === "empate") return [t.parejas, ""];
    const g = res.ganador === "a" ? oa : ob;
    const pa = Math.round(res.ganador === "a" ? res.puntajeA : res.puntajeB);
    const pb = Math.round(res.ganador === "a" ? res.puntajeB : res.puntajeA);
    const linea1 = t.gana(g.nombre, String(pa), String(pb));
    const d = res.decisivo;
    const linea2 = d ? t.porque(titulos[d.criterio], valor(g, d.criterio), valor(g === oa ? ob : oa, d.criterio)) : "";
    return [linea1, linea2];
  };

  return (
    <section className="vs-tablero" aria-labelledby="vs-titulo">
      <p className="vs-kicker">{t.kicker}</p>
      <h2 id="vs-titulo" className="sr-only">
        {t.titulo}
      </h2>
      <div className="vs-marcador">
        <div className={`vs-lado vs-lado-a${r.ganador === "a" ? " vs-lado-gana" : ""}`}>
          <span className="vs-nombre">{oa.nombre}</span>
          <span className="vs-cifra">
            <Contador valor={r.puntajeA} />
            <small>/100</small>
          </span>
        </div>
        <span className="vs-insignia" aria-hidden="true">
          VS
        </span>
        <div className={`vs-lado vs-lado-b${r.ganador === "b" ? " vs-lado-gana" : ""}`}>
          <span className="vs-nombre">{ob.nombre}</span>
          <span className="vs-cifra">
            <Contador valor={r.puntajeB} />
            <small>/100</small>
          </span>
        </div>
      </div>
      <p className="vs-perfil">{t.puntajePara(nombrePerfil)}</p>

      <div className="vs-cuerpo">
        <Radar
          ejes={CRITERIOS.map((c) => t.ejes[c])}
          a={CRITERIOS.map((c) => n.a[c])}
          b={CRITERIOS.map((c) => n.b[c])}
          nombreA={oa.nombre}
          nombreB={ob.nombre}
          sinDato={t.sinDato}
          aria={t.radarAria(oa.nombre, ob.nombre)}
          ayuda={t.radarAyuda}
        />

        <div className="vs-diferencias">
          <h3>{t.diferencias}</h3>
          <table className="vs-tabla" key={clave}>
            <thead>
              <tr>
                <th scope="col">{t.metrica}</th>
                <th scope="col" className="vs-a">{oa.nombre}</th>
                <th scope="col" className="vs-b">{ob.nombre}</th>
                <th scope="col">{t.ventaja}</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f, i) => (
                <tr key={f.clave} style={{ ["--i" as string]: i }}>
                  <th scope="row">{f.metrica}</th>
                  <td className={f.gana === "a" ? "vs-celda-gana" : undefined}>{f.a}</td>
                  <td className={f.gana === "b" ? "vs-celda-gana" : undefined}>{f.b}</td>
                  <td>
                    <span className={`vs-badge${f.gana ? ` vs-badge-${f.gana}` : " vs-badge-par"}`}>{f.insignia}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Circular 004, numeral 2.16.1: con el precio van su corte, el área y la ubicación. */}
          <ul className="vs-legal">
            {[oa, ob].map((o, i) => (
              <li key={o.slug} className={i ? "vs-b" : "vs-a"}>
                <strong>{o.nombre}</strong>
                <span>
                  {o.precio ? t.legal(pesos(o.precio.desde, idioma), o.precio.corte) : t.consultar}
                  {o.area ? ` · ${o.area.texto}${o.area.etiquetas.length ? ` («${o.area.etiquetas.join("» · «")}»)` : ""}` : ""}
                  {` · ${o.ubicacion ?? t.sinUbicacion}`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="vs-cierre">
        {[
          { titulo: t.cierreInvertir, res: inversion },
          { titulo: t.cierreVivir, res: vivir },
        ].map(({ titulo, res }) => {
          const [l1, l2] = conclusion(res);
          return (
            <article key={titulo} className={`vs-conclusion${res.ganador !== "empate" ? ` vs-conclusion-${res.ganador}` : ""}`}>
              <p className="vs-conclusion-titulo">{titulo}</p>
              <p>{l1}</p>
              {l2 && <p className="vs-conclusion-porque">{l2}</p>}
            </article>
          );
        })}
      </div>
      <p className="vs-nota">{t.nota}</p>
    </section>
  );
}
