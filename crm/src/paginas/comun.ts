/**
 * El marco de todas las páginas del CRM y las piezas que comparten.
 */
import { html, crudo, type Html } from "../html";
import { etapaDe, PUNTAJES, FUENTES, type Tipo } from "../datos";

/** Sube cuando cambian crm.css o crm.js, para que el teléfono no use la copia vieja. */
export const VERSION_ESTATICOS = "2";

/** Los avisos que vienen en la dirección (`?ok=…`). Solo códigos: nunca texto libre. */
const AVISOS: Record<string, string> = {
  guardado: "Listo, quedó guardado.",
  nota: "Listo, quedó en la línea de tiempo.",
  tarea: "Listo, tarea creada.",
  hecha: "Tarea marcada como hecha.",
  etapa: "Etapa actualizada.",
  puntaje: "Puntaje actualizado.",
  creado: "Listo, ficha creada.",
  existia: "Esa persona ya tenía ficha: agregué lo nuevo a la suya.",
  reclamo: "Quedó marcado el reclamo en trámite.",
  normal: "El reclamo quedó cerrado.",
  suprimido: "Los datos de la persona quedaron suprimidos.",
  baja: "Quedó dado de baja del boletín.",
  oportunidad: "Listo, oportunidad creada.",
};

/** Los errores que vienen en la dirección (`?error=…`). También solo códigos. */
const ERRORES: Record<string, string> = {
  motivo: "Para pasar a Perdido o Descartado, elige el motivo.",
  puntaje_motivo: "Para cambiar el puntaje, escribe el motivo.",
  fecha: "Una de las fechas no es válida.",
  duplicado: "Ese teléfono o correo ya está en otra ficha.",
  confirmacion: "El nombre no coincide: no se suprimió nada.",
  datos: "Falta algún dato obligatorio.",
  texto: "Escribe el título de la tarea.",
  oportunidad: "Ya tiene una oportunidad abierta de ese tipo.",
};

const ICONOS: Record<string, string> = {
  hoy: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1z"/></svg>',
  compra: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5"/></svg>',
  venta: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12 12 4l9 8M6 10v10h12V10"/><path d="M10 20v-5h4v5"/></svg>',
  boletin: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="m4 7 8 6 8-6"/></svg>',
  mas: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5.5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="18.5" cy="12" r="1.6"/></svg>',
};

export type Seccion = "hoy" | "compra" | "venta" | "boletin" | "mas" | null;

export function pagina(opciones: {
  titulo: string;
  seccion: Seccion;
  cuerpo: Html;
  url?: URL;
  /** El botón principal de la barra de arriba, si la vista tiene uno. */
  accion?: Html;
  vistaPrevia?: boolean;
}): Html {
  const ok = opciones.url?.searchParams.get("ok");
  const error = opciones.url?.searchParams.get("error");
  const otra = Number.parseInt(opciones.url?.searchParams.get("otra") ?? "", 10);
  const aviso = error && ERRORES[error]
    ? html`<p class="error" role="alert">${ERRORES[error]}${
        error === "duplicado" && otra > 0 ? html` <a href="/contacto/${otra}">Ver esa ficha</a>` : ""
      }</p>`
    : ok && AVISOS[ok]
      ? html`<p class="aviso" role="status">${AVISOS[ok]}</p>`
      : "";
  const pestana = (id: Exclude<Seccion, null>, href: string, nombre: string) =>
    html`<a href="${href}" class="pestana${opciones.seccion === id ? " pestana--activa" : ""}"${
      opciones.seccion === id ? crudo(' aria-current="page"') : ""
    }>${crudo(ICONOS[id])}<span>${nombre}</span></a>`;
  return html`<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="referrer" content="strict-origin">
<meta name="theme-color" content="#1F2A3D">
<link rel="icon" href="data:,">
<title>${opciones.titulo} · CRM RHF</title>
<link rel="stylesheet" href="/crm.css?v=${VERSION_ESTATICOS}">
<script src="/crm.js?v=${VERSION_ESTATICOS}" defer></script>
</head>
<body>
${opciones.vistaPrevia ? html`<p class="banda-prueba">Vista previa: base de pruebas</p>` : ""}
<header class="barra">
  <a class="marca" href="/hoy">RHF <span>CRM</span></a>
  ${opciones.accion ?? ""}
</header>
<main class="contenido" id="contenido">
${aviso}
${opciones.cuerpo}
</main>
<nav class="pestanas" aria-label="Secciones">
  ${pestana("hoy", "/hoy", "Hoy")}
  ${pestana("compra", "/leads", "Compradores")}
  ${pestana("venta", "/propietarios", "Propietarios")}
  ${pestana("boletin", "/boletin", "Boletín")}
  ${pestana("mas", "/mas", "Más")}
</nav>
</body>
</html>`;
}

/** La ficha de color de una etapa. */
export function chipEtapa(tipo: Tipo, etapa: string): Html {
  const e = etapaDe(tipo, etapa);
  return html`<span class="chip etapa--${e?.tono ?? "nuevo"}">${e?.nombre ?? etapa}</span>`;
}

export function chipPuntaje(p: string): Html {
  const x = PUNTAJES.find((y) => y.id === p);
  return html`<span class="chip puntaje puntaje--${p}" title="${x?.ayuda ?? ""}">${p === "sin" ? "Sin calificar" : `Puntaje ${p}`}</span>`;
}

export function nombreFuente(f: string | null | undefined): string {
  return f ? FUENTES[f] ?? f : "";
}

/** Un `<select>` con su etiqueta. */
export function selector(
  nombre: string,
  etiqueta: string,
  opciones: { valor: string; texto: string }[],
  actual?: string | null,
  extra?: { requerido?: boolean; vacio?: string; id?: string },
): Html {
  const id = extra?.id ?? `campo-${nombre}`;
  return html`<label class="campo" for="${id}"><span>${etiqueta}</span>
<select id="${id}" name="${nombre}"${extra?.requerido ? crudo(" required") : ""}>
${extra?.vacio !== undefined ? html`<option value="">${extra.vacio}</option>` : ""}
${opciones.map(
  (o) => html`<option value="${o.valor}"${o.valor === (actual ?? "") ? crudo(" selected") : ""}>${o.texto}</option>`,
)}
</select></label>`;
}

/** Un campo de texto con su etiqueta. */
export function campo(
  nombre: string,
  etiqueta: string,
  valor?: string | null,
  extra?: {
    tipo?: string;
    requerido?: boolean;
    ayuda?: string;
    max?: number;
    id?: string;
    autocomplete?: string;
    inputmode?: string;
  },
): Html {
  const id = extra?.id ?? `campo-${nombre}`;
  const ayudaId = extra?.ayuda ? `${id}-ayuda` : null;
  return html`<label class="campo" for="${id}"><span>${etiqueta}</span>
<input id="${id}" name="${nombre}" type="${extra?.tipo ?? "text"}" value="${valor ?? ""}"${
    extra?.requerido ? crudo(" required") : ""
  }${extra?.max ? crudo(` maxlength="${extra.max}"`) : ""}${ayudaId ? crudo(` aria-describedby="${ayudaId}"`) : ""}${
    extra?.autocomplete ? crudo(` autocomplete="${extra.autocomplete}"`) : ""
  }${extra?.inputmode ? crudo(` inputmode="${extra.inputmode}"`) : ""}>
${ayudaId ? html`<small id="${ayudaId}">${extra?.ayuda}</small>` : ""}</label>`;
}

export function areaTexto(nombre: string, etiqueta: string, valor?: string | null, extra?: { requerido?: boolean; max?: number; id?: string; filas?: number }): Html {
  const id = extra?.id ?? `campo-${nombre}`;
  return html`<label class="campo" for="${id}"><span>${etiqueta}</span>
<textarea id="${id}" name="${nombre}" rows="${extra?.filas ?? 3}"${extra?.requerido ? crudo(" required") : ""}${
    extra?.max ? crudo(` maxlength="${extra.max}"`) : ""
  }>${valor ?? ""}</textarea></label>`;
}

/** Una tarjeta vacía con un texto en afirmativo. */
export function vacio(texto: string): Html {
  return html`<p class="vacio">${texto}</p>`;
}
