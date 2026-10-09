/**
 * El marco de todas las páginas del CRM y las piezas que comparten.
 *
 * Desde el 7-oct-2026 el CRM es oscuro siempre (decisión de Rafael: «Oscuro
 * siempre»), con barra lateral en pantallas anchas y pestañas abajo en el
 * teléfono: Hoy, Embudo, Chats, Tablero y Más.
 */
import { html, crudo, type Html } from "../html";
import { etapaDe, PUNTAJES, FUENTES, type Tipo } from "../datos";
import { nombreCanal, grupoDe } from "../canales";
import { estadoSla, duracion } from "../horario";
import { enlaceWhatsApp } from "../telefono";
import { hace } from "../tiempo";

/** Sube cuando cambian crm.css o crm.js, para que el teléfono no use la copia vieja. */
export const VERSION_ESTATICOS = "4";

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
  intento: "Quedó anotado el intento de contacto.",
  inversion: "Listo, la inversión de la semana quedó guardada.",
  enlazada: "La conversación quedó en la ficha.",
  eliminado: "Listo, el lead quedó eliminado.",
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
  monto: "Uno de los montos no se entiende. Escríbelo en pesos, por ejemplo 1.500.000.",
  eliminar: "Para eliminar el lead, marca que entiendes que no se puede deshacer.",
};

const trazo = (d: string) =>
  `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${d}</svg>`;

/** Íconos de trazo, del mismo grosor, sin colores propios: toman el del texto. */
export const ICONOS: Record<string, string> = {
  hoy: trazo('<path d="M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-4.5v-5.5h-5V21H5a1 1 0 0 1-1-1z"/>'),
  embudo: trazo('<rect x="3.5" y="4" width="4.5" height="16" rx="1.5"/><rect x="9.75" y="4" width="4.5" height="11" rx="1.5"/><rect x="16" y="4" width="4.5" height="7" rx="1.5"/>'),
  chats: trazo('<path d="M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v8.5A1.5 1.5 0 0 1 19 17h-8l-4.5 3.5V17H5a1.5 1.5 0 0 1-1.5-1.5V7A1.5 1.5 0 0 1 5 5.5z"/><path d="M8 10h8M8 13h5"/>'),
  tablero: trazo('<path d="M4 20h16"/><path d="M6.5 16.5v-5M11 16.5V7M15.5 16.5v-7M20 16.5V5"/>'),
  mas: trazo('<circle cx="5.5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="18.5" cy="12" r="1.4"/>'),
  whatsapp: trazo('<path d="M4.5 19.5l1.2-3.6A7.5 7.5 0 1 1 8.4 18.6z"/><path d="M9.3 8.6c.3 2.6 2.4 4.8 5 5.2l1-1.2 1.8.9-.4 1.5c-3.6.3-7.6-3.6-7.4-7.3l1.5-.5.9 1.8z"/>'),
  llamar: trazo('<path d="M6.6 3.8 9 4.4l1.1 4-1.9 1.4a12 12 0 0 0 6 6l1.4-1.9 4 1.1.6 2.4c.2.8-.4 1.6-1.2 1.6C10.8 19 5 13.2 5 5c0-.8.8-1.4 1.6-1.2z"/>'),
  correo: trazo('<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="m4.5 7 7.5 6 7.5-6"/>'),
  mas_uno: trazo('<path d="M12 5v14M5 12h14"/>'),
  reloj: trazo('<circle cx="12" cy="12" r="8"/><path d="M12 7.5V12l3 2"/>'),
  alerta: trazo('<path d="M12 4 3 19.5h18z"/><path d="M12 10v4.5M12 17.2v.3"/>'),
  ok: trazo('<circle cx="12" cy="12" r="8"/><path d="m8.5 12.2 2.4 2.3 4.6-4.8"/>'),
  flecha: trazo('<path d="m9 6 6 6-6 6"/>'),
  lista: trazo('<path d="M9 6.5h11M9 12h11M9 17.5h11"/><circle cx="4.8" cy="6.5" r="1"/><circle cx="4.8" cy="12" r="1"/><circle cx="4.8" cy="17.5" r="1"/>'),
  buscar: trazo('<circle cx="11" cy="11" r="6"/><path d="m15.5 15.5 4 4"/>'),
  ia: trazo('<rect x="5" y="7" width="14" height="11" rx="3"/><path d="M12 4v3M9 12h.01M15 12h.01M9.5 15h5"/>'),
  persona: trazo('<circle cx="12" cy="8" r="3.5"/><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5"/>'),
  info: trazo('<circle cx="12" cy="12" r="8"/><path d="M12 11v5.5"/><path d="M12 7.6v.2"/>'),
  basura: trazo('<path d="M4.5 7h15"/><path d="M9.5 7V5.2h5V7"/><path d="m6.5 7 .8 11.6a1.5 1.5 0 0 0 1.5 1.4h6.4a1.5 1.5 0 0 0 1.5-1.4L17.5 7"/><path d="M10 11v5M14 11v5"/>'),
  cerrar: trazo('<path d="m6.5 6.5 11 11M17.5 6.5l-11 11"/>'),
};

export function icono(nombre: string): Html {
  return crudo(ICONOS[nombre] ?? "");
}

export type Seccion = "hoy" | "embudo" | "chats" | "tablero" | "mas" | "compra" | "venta" | "boletin" | null;

const SECCIONES: { id: "hoy" | "embudo" | "chats" | "tablero" | "mas"; href: string; nombre: string }[] = [
  { id: "hoy", href: "/hoy", nombre: "Hoy" },
  { id: "embudo", href: "/embudo", nombre: "Embudo" },
  { id: "chats", href: "/conversaciones", nombre: "Chats" },
  { id: "tablero", href: "/tablero", nombre: "Tablero" },
  { id: "mas", href: "/mas", nombre: "Más" },
];

function seccionActiva(s: Seccion): string | null {
  if (s === "compra" || s === "venta") return "embudo";
  if (s === "boletin") return "mas";
  return s;
}

export function pagina(opciones: {
  titulo: string;
  seccion: Seccion;
  cuerpo: Html;
  url?: URL;
  /** El botón principal de la barra de arriba, si la vista tiene uno. */
  accion?: Html;
  vistaPrevia?: boolean;
  /** Para el embudo y el tablero, todo el ancho de la pantalla; para la ficha, «medio». */
  ancho?: boolean | "medio";
}): Html {
  const ok = opciones.url?.searchParams.get("ok");
  const error = opciones.url?.searchParams.get("error");
  const otra = Number.parseInt(opciones.url?.searchParams.get("otra") ?? "", 10);
  const aviso = error && ERRORES[error]
    ? html`<p class="error" role="alert">${icono("alerta")}<span>${ERRORES[error]}${
        error === "duplicado" && otra > 0 ? html` <a href="/contacto/${otra}">Ver esa ficha</a>` : ""
      }</span></p>`
    : ok && AVISOS[ok]
      ? html`<p class="aviso" role="status">${icono("ok")}<span>${AVISOS[ok]}</span></p>`
      : "";
  const activa = seccionActiva(opciones.seccion);
  const enlace = (s: (typeof SECCIONES)[number], clase: string) =>
    html`<a href="${s.href}" class="${clase}${activa === s.id ? ` ${clase}--activa` : ""}"${
      activa === s.id ? crudo(' aria-current="page"') : ""
    }>${icono(s.id)}<span>${s.nombre}</span></a>`;
  return html`<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="referrer" content="strict-origin">
<meta name="color-scheme" content="dark">
<meta name="theme-color" content="#0a0f1a">
<link rel="icon" href="data:,">
<title>${opciones.titulo} · CRM RHF</title>
<link rel="stylesheet" href="/crm.css?v=${VERSION_ESTATICOS}">
<script src="/crm.js?v=${VERSION_ESTATICOS}" defer></script>
</head>
<body>
${opciones.vistaPrevia ? html`<p class="banda-prueba">Vista previa · base de pruebas</p>` : ""}
<div class="marco">
<aside class="lateral">
  <a class="marca" href="/hoy"><span class="marca-rhf">RHF</span><span class="marca-crm">CRM</span></a>
  <a class="boton boton--bloque" href="/nuevo">${icono("mas_uno")}<span>Nuevo lead</span></a>
  <nav class="lateral-nav" aria-label="Secciones">${SECCIONES.map((s) => enlace(s, "lateral-enlace"))}</nav>
</aside>
<div class="principal">
<header class="barra">
  <a class="marca marca--barra" href="/hoy"><span class="marca-rhf">RHF</span><span class="marca-crm">CRM</span></a>
  <span class="barra-titulo">${opciones.titulo}</span>
  ${opciones.accion ?? ""}
</header>
<main class="contenido${opciones.ancho === "medio" ? " contenido--medio" : opciones.ancho ? " contenido--ancho" : ""}" id="contenido">
${aviso}
${opciones.cuerpo}
</main>
</div>
</div>
<nav class="pestanas" aria-label="Secciones">${SECCIONES.map((s) => enlace(s, "pestana"))}</nav>
<div class="toast" role="status" aria-live="polite" hidden></div>
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

/** El canal, con el punto del color de su grupo (el mismo de las gráficas). Sin dato, nada. */
export function chipCanal(canal: string | null | undefined, siempre = false): Html | "" {
  if (!siempre && (!canal || canal === "sin_dato")) return "";
  return html`<span class="chip chip--canal"><i class="punto serie--${grupoDe(canal)}" aria-hidden="true"></i>${nombreCanal(canal)}</span>`;
}

/**
 * La espera de la primera respuesta, en minutos hábiles: verde a tiempo,
 * amarillo desde los 10 y rojo desde los 15. Siempre con ícono y texto: el
 * color nunca va solo.
 */
export function chipSla(minutos: number, desde?: string | null): Html {
  const e = estadoSla(minutos);
  // Pasado un día hábil, la espera se dice en días de calendario: «hace 7 días».
  const cuanto = minutos >= 600 && desde ? hace(desde) : duracion(minutos);
  const texto = e === "vencido" ? `Vencido · ${cuanto}` : e === "por_vencer" ? `Por vencer · ${cuanto}` : `A tiempo · ${cuanto}`;
  return html`<span class="chip estado estado--${e}">${icono(e === "a_tiempo" ? "reloj" : "alerta")}${texto}</span>`;
}

export function nombreFuente(f: string | null | undefined): string {
  return f ? FUENTES[f] ?? f : "";
}

/** Las iniciales para el círculo de la persona: «Ana Prueba» → «AP». */
export function iniciales(nombre: string | null | undefined): string {
  // Lo que va entre paréntesis («(demo)», «(hija)») no cuenta.
  const limpio = (nombre ?? "").replace(/\([^)]*\)/g, " ");
  const letras = limpio
    .trim()
    .split(/\s+/)
    .map((p) => p.match(/\p{L}/u)?.[0])
    .filter((x): x is string => !!x);
  if (!letras.length) return "?";
  return (letras[0] + (letras.length > 1 ? letras[letras.length - 1] : "")).toUpperCase();
}

/**
 * Los botones para escribirle o llamarlo. Al tocarlos, crm.js anota el
 * intento de contacto (`data-intento`) para el SLA, sin que Rafael registre
 * nada.
 */
export function botonesContacto(
  contacto: { id: number; telefono: string | null; telefono_crudo?: string | null; correo: string | null },
  opciones?: { compacto?: boolean },
): Html {
  const wa = enlaceWhatsApp(contacto.telefono);
  const tel = contacto.telefono ?? (contacto.telefono_crudo ? contacto.telefono_crudo.replace(/[^\d+]/g, "") : null);
  const clase = opciones?.compacto ? "boton-icono" : "boton-contacto";
  const etiqueta = (t: string) => (opciones?.compacto ? html`<span class="solo-lector">${t}</span>` : html`<span>${t}</span>`);
  return html`${wa
    ? html`<a class="${clase} ${clase}--whatsapp" href="${wa}" target="_blank" rel="noopener noreferrer" data-intento="whatsapp" data-contacto="${contacto.id}">${icono("whatsapp")}${etiqueta("WhatsApp")}</a>`
    : ""}${tel
    ? html`<a class="${clase}" href="tel:${tel}" data-intento="llamada" data-contacto="${contacto.id}">${icono("llamar")}${etiqueta("Llamar")}</a>`
    : ""}${contacto.correo
    ? html`<a class="${clase}" href="mailto:${contacto.correo}" data-intento="correo" data-contacto="${contacto.id}">${icono("correo")}${etiqueta("Correo")}</a>`
    : ""}`;
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
    placeholder?: string;
  },
): Html {
  const id = extra?.id ?? `campo-${nombre}`;
  const ayudaId = extra?.ayuda ? `${id}-ayuda` : null;
  return html`<label class="campo" for="${id}"><span>${etiqueta}</span>
<input id="${id}" name="${nombre}" type="${extra?.tipo ?? "text"}" value="${valor ?? ""}"${
    extra?.requerido ? crudo(" required") : ""
  }${extra?.max ? crudo(` maxlength="${extra.max}"`) : ""}${ayudaId ? crudo(` aria-describedby="${ayudaId}"`) : ""}${
    extra?.autocomplete ? crudo(` autocomplete="${extra.autocomplete}"`) : ""
  }${extra?.inputmode ? crudo(` inputmode="${extra.inputmode}"`) : ""}${extra?.placeholder ? html` placeholder="${extra.placeholder}"` : ""}>
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

/** Pesos colombianos abreviados: «$450 M», «$1.250 M», «$85 mil». */
export function pesosCortos(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  if (Math.abs(n) >= 1_000_000) {
    const m = n / 1_000_000;
    return `$${m.toLocaleString("es-CO", { maximumFractionDigits: Math.abs(m) < 10 ? 1 : 0 })} M`;
  }
  if (Math.abs(n) >= 1_000) return `$${Math.round(n / 1_000).toLocaleString("es-CO")} mil`;
  return `$${Math.round(n).toLocaleString("es-CO")}`;
}

/** Pesos colombianos completos: «$1.500.000». */
export function pesos(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  return `$${Math.round(n).toLocaleString("es-CO")}`;
}
