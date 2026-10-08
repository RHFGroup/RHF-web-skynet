/**
 * Lo que cambia algo en el CRM: cada formulario termina acá. Todo exige sesión
 * y mismo origen (lo revisa src/index.ts antes de llegar), y todo deja su
 * línea en la auditoría.
 */
import { ahoraIso, sentenciaAuditoria, type Ctx } from "./base";
import {
  etapaDe,
  columnasDeFase,
  MOTIVOS_PERDIDA,
  PUNTAJES,
  PROPOSITOS,
  CATALOGO,
  FUENTES,
  FUENTES_MANUALES,
  CANALES_AUTORIZACION,
  type Tipo,
} from "./datos";
import { telefonoE164, correoNormal } from "./telefono";
import { fechaValida, fechaHoraValida, fechaLocal, hoy, lunesDe } from "./tiempo";
import { sentenciasDeActividad } from "./sla";
import { CANALES_INVERSION } from "./canales";
import { formaPagoValida, presupuestoValido, objetivoValido, NO_SE } from "@/data/calificacion";
import type { Oportunidad, Contacto } from "./paginas/ficha";
import type { DatosAlta } from "./paginas/alta";

/** 303: después de un POST el navegador vuelve con GET (sin reenvíos al recargar). */
export function volverA(ruta: string, extra?: Record<string, string>): Response {
  const q = extra ? `${ruta.includes("?") ? "&" : "?"}${new URLSearchParams(extra)}` : "";
  return new Response(null, { status: 303, headers: { Location: `${ruta}${q}`, "Cache-Control": "no-store" } });
}

function valor(f: FormData, nombre: string, max = 200): string {
  const v = f.get(nombre);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

const TIPOS_REGISTRO = new Set(["nota", "llamada", "whatsapp", "correo", "visita"]);

async function oportunidadDe(c: Ctx, id: number): Promise<Oportunidad | null> {
  return c.db.prepare(`SELECT * FROM crm_oportunidades WHERE id = ?`).bind(id).first<Oportunidad>();
}

async function contactoVivo(c: Ctx, id: number): Promise<Contacto | null> {
  return c.db
    .prepare(`SELECT * FROM crm_contactos WHERE id = ? AND estado_datos != 'suprimido'`)
    .bind(id)
    .first<Contacto>();
}

/** Las oportunidades abiertas de una persona (para anotarles la actividad). */
async function abiertasDe(c: Ctx, contactoId: number): Promise<Oportunidad[]> {
  const r = await c.db
    .prepare(`SELECT * FROM crm_oportunidades WHERE contacto_id = ? AND cerrada = 0 ORDER BY id DESC LIMIT 4`)
    .bind(contactoId)
    .all<Oportunidad>();
  return r.results;
}

/**
 * «Le escribí por WhatsApp», «Lo llamé», una nota… Todo menos la nota cuenta
 * como intento de contacto: cierra la espera de la primera respuesta
 * (crm/src/sla.ts). Todo reinicia la higiene.
 */
export async function registrarActividad(c: Ctx, contactoId: number, f: FormData): Promise<Response> {
  const contacto = await contactoVivo(c, contactoId);
  if (!contacto) return volverA("/hoy");
  const tipo = valor(f, "tipo", 20);
  if (!TIPOS_REGISTRO.has(tipo)) return volverA(`/contacto/${contactoId}`, { error: "datos" });
  const texto = valor(f, "texto", 2000) || null;
  const opId = Number.parseInt(valor(f, "oportunidad", 12), 10);
  const op = opId > 0 ? await oportunidadDe(c, opId) : null;
  const opValida = op && op.contacto_id === contactoId ? op : null;
  const ahora = new Date();
  const iso = ahora.toISOString();
  const intento = tipo !== "nota";

  const sentencias: D1PreparedStatement[] = [
    c.db
      .prepare(
        `INSERT INTO crm_actividades (contacto_id, oportunidad_id, creado_en, tipo, texto, autor) VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .bind(contactoId, opValida?.id ?? null, iso, tipo, texto, c.usuario),
  ];
  // La actividad cuenta para la oportunidad elegida o, si no se eligió, para
  // todas las abiertas de la persona.
  const tocadas = opValida ? (opValida.cerrada ? [] : [opValida]) : await abiertasDe(c, contactoId);
  for (const o of tocadas) sentencias.push(...sentenciasDeActividad(c.db, o, ahora, intento));
  if (intento) {
    sentencias.push(
      c.db.prepare(`UPDATE crm_contactos SET ultimo_contacto_en = ?, actualizado_en = ? WHERE id = ?`).bind(iso, iso, contactoId),
    );
    // El primer contacto mueve a «Contactado» la oportunidad que seguía en «Nuevo».
    if (opValida && opValida.etapa === "nuevo") {
      sentencias.push(
        c.db
          .prepare(
            `UPDATE crm_oportunidades SET etapa = 'contactado', etapa_desde = ?, actualizado_en = ?,
                    fase_contactado_en = COALESCE(fase_contactado_en, ?)
              WHERE id = ?`,
          )
          .bind(iso, iso, iso, opValida.id),
        c.db
          .prepare(
            `INSERT INTO crm_actividades (contacto_id, oportunidad_id, creado_en, tipo, texto, autor) VALUES (?, ?, ?, 'etapa', ?, ?)`,
          )
          .bind(contactoId, opValida.id, iso, "Nuevo → Contactado (al registrar el primer contacto)", c.usuario),
      );
    }
  }
  sentencias.push(sentenciaAuditoria(c, "nota", "contacto", contactoId, tipo));
  await c.db.batch(sentencias);
  return volverA(`/contacto/${contactoId}`, { ok: "nota" });
}

const VIAS_INTENTO: Record<string, string> = {
  whatsapp: "Abrió WhatsApp desde el CRM",
  llamada: "Tocó Llamar desde el CRM",
  correo: "Abrió el correo desde el CRM",
};

/**
 * El intento de contacto que anota crm.js en el momento en que Rafael toca
 * WhatsApp, Llamar o Correo en una ficha, en «Hoy» o en el embudo: así el
 * SLA se mide sin que tenga que registrar nada. Responde a fetch(), no a
 * una navegación (ver `esAccionDeScript` en crm/src/seguridad.ts).
 */
export async function registrarIntento(c: Ctx, contactoId: number, f: FormData): Promise<Response> {
  const contacto = await contactoVivo(c, contactoId);
  const via = valor(f, "via", 20);
  if (!contacto || !VIAS_INTENTO[via]) return volverA(`/contacto/${contactoId}`, { error: "datos" });
  const ahora = new Date();
  const iso = ahora.toISOString();
  const abiertas = await abiertasDe(c, contactoId);
  // Si ya hubo un intento en los últimos 2 minutos, no se repite la línea.
  const reciente = await c.db
    .prepare(`SELECT id FROM crm_actividades WHERE contacto_id = ? AND tipo = 'intento' AND creado_en > ? LIMIT 1`)
    .bind(contactoId, new Date(ahora.getTime() - 120_000).toISOString())
    .first();
  const sentencias: D1PreparedStatement[] = [];
  if (!reciente) {
    sentencias.push(
      c.db
        .prepare(
          `INSERT INTO crm_actividades (contacto_id, oportunidad_id, creado_en, tipo, texto, autor) VALUES (?, ?, ?, 'intento', ?, ?)`,
        )
        .bind(contactoId, abiertas[0]?.id ?? null, iso, VIAS_INTENTO[via], c.usuario),
    );
  }
  for (const o of abiertas) sentencias.push(...sentenciasDeActividad(c.db, o, ahora, true));
  sentencias.push(sentenciaAuditoria(c, "intento", "contacto", contactoId, via));
  await c.db.batch(sentencias);
  return volverA(`/contacto/${contactoId}`, { ok: "intento" });
}

export async function crearTarea(c: Ctx, contactoId: number, f: FormData): Promise<Response> {
  const contacto = await contactoVivo(c, contactoId);
  if (!contacto) return volverA("/hoy");
  const titulo = valor(f, "titulo", 200);
  if (!titulo) return volverA(`/contacto/${contactoId}`, { error: "texto" });
  const vence = fechaValida(valor(f, "vence_en", 10)) ?? null;
  if (!vence) return volverA(`/contacto/${contactoId}`, { error: "fecha" });
  const opId = Number.parseInt(valor(f, "oportunidad", 12), 10) || null;
  await c.db.batch([
    c.db
      .prepare(
        `INSERT INTO crm_tareas (contacto_id, oportunidad_id, creado_en, titulo, vence_en, origen) VALUES (?, ?, ?, ?, ?, 'manual')`,
      )
      .bind(contactoId, opId, ahoraIso(), titulo, vence),
    sentenciaAuditoria(c, "tarea", "contacto", contactoId),
  ]);
  return volverA(`/contacto/${contactoId}`, { ok: "tarea" });
}

/**
 * Solo se vuelve a «Hoy», al embudo o a una ficha: nunca a una dirección
 * cualquiera que llegue en el formulario.
 */
export function rutaSegura(ruta: string, porDefecto = "/hoy"): string {
  return /^\/(hoy|embudo(\?tipo=(compra|venta))?|contacto\/\d{1,9})$/.test(ruta) ? ruta : porDefecto;
}

export async function cerrarTarea(c: Ctx, tareaId: number, f: FormData): Promise<Response> {
  const t = await c.db
    .prepare(`SELECT contacto_id, titulo FROM crm_tareas WHERE id = ? AND hecha_en IS NULL`)
    .bind(tareaId)
    .first<{ contacto_id: number; titulo: string }>();
  const volver = rutaSegura(valor(f, "volver", 40));
  if (!t) return volverA(volver);
  const ahora = ahoraIso();
  await c.db.batch([
    c.db.prepare(`UPDATE crm_tareas SET hecha_en = ? WHERE id = ?`).bind(ahora, tareaId),
    c.db
      .prepare(`INSERT INTO crm_actividades (contacto_id, creado_en, tipo, texto, autor) VALUES (?, ?, 'sistema', ?, ?)`)
      .bind(t.contacto_id, ahora, `Tarea hecha: ${t.titulo}`, c.usuario),
    sentenciaAuditoria(c, "tarea_hecha", "contacto", t.contacto_id),
  ]);
  return volverA(volver, { ok: "hecha" });
}

export async function cambiarEtapa(c: Ctx, opId: number, f: FormData): Promise<Response> {
  const op = await oportunidadDe(c, opId);
  if (!op) return volverA("/hoy");
  const destino = etapaDe(op.tipo, valor(f, "etapa", 40));
  if (!destino) return volverA(`/contacto/${op.contacto_id}`, { error: "datos" });
  const motivo = valor(f, "motivo", 60);
  if (destino.pideMotivo && !MOTIVOS_PERDIDA.includes(motivo)) {
    return volverA(rutaSegura(valor(f, "volver", 40), `/contacto/${op.contacto_id}`), { error: "motivo" });
  }
  const volver = rutaSegura(valor(f, "volver", 40), `/contacto/${op.contacto_id}`);
  if (destino.id === op.etapa) return volverA(volver, { ok: "etapa" });
  const origen = etapaDe(op.tipo, op.etapa)?.nombre ?? op.etapa;
  const ahora = new Date();
  const iso = ahora.toISOString();
  // Las fases del embudo a las que llega por primera vez (crm/src/datos.ts).
  const fases = columnasDeFase(op.tipo, destino.id);
  const marcarFases = fases.map((col) => `${col} = COALESCE(${col}, ?)`).join(", ");
  // Mover la etapa cuenta como intento de contacto, salvo descartar sin
  // haberle escrito nunca (spam o un dato equivocado): eso no mide el SLA.
  const intento = !(destino.pideMotivo && !op.primer_intento_en);
  await c.db.batch([
    c.db
      .prepare(
        `UPDATE crm_oportunidades
            SET etapa = ?, etapa_desde = ?, motivo_perdida = ?, cerrada = ?, actualizado_en = ?${marcarFases ? `, ${marcarFases}` : ""}
                ${destino.cierra ? ", espera_desde = NULL" : ""}
          WHERE id = ?`,
      )
      .bind(destino.id, iso, destino.pideMotivo ? motivo : null, destino.cierra ? 1 : 0, iso, ...fases.map(() => iso), opId),
    ...sentenciasDeActividad(c.db, op, ahora, intento),
    c.db.prepare(`UPDATE crm_contactos SET actualizado_en = ? WHERE id = ?`).bind(iso, op.contacto_id),
    c.db
      .prepare(
        `INSERT INTO crm_actividades (contacto_id, oportunidad_id, creado_en, tipo, texto, autor) VALUES (?, ?, ?, 'etapa', ?, ?)`,
      )
      .bind(op.contacto_id, opId, iso, `${origen} → ${destino.nombre}${destino.pideMotivo ? ` (motivo: ${motivo})` : ""}`, c.usuario),
    sentenciaAuditoria(c, "etapa", "contacto", op.contacto_id, `${op.etapa} → ${destino.id}`),
  ]);
  return volverA(volver, { ok: "etapa" });
}

export async function cambiarPuntaje(c: Ctx, opId: number, f: FormData): Promise<Response> {
  const op = await oportunidadDe(c, opId);
  if (!op || op.tipo !== "compra") return volverA("/hoy");
  const puntaje = valor(f, "puntaje", 4);
  if (!PUNTAJES.some((p) => p.id === puntaje)) return volverA(`/contacto/${op.contacto_id}`, { error: "datos" });
  const motivo = valor(f, "motivo", 300);
  if (!motivo) return volverA(`/contacto/${op.contacto_id}`, { error: "puntaje_motivo" });
  const nombre = (p: string) => (p === "sin" ? "Sin calificar" : p);
  const ahora = ahoraIso();
  await c.db.batch([
    c.db
      .prepare(`UPDATE crm_oportunidades SET puntaje = ?, puntaje_motivo = ?, actualizado_en = ? WHERE id = ?`)
      .bind(puntaje, motivo, ahora, opId),
    ...sentenciasDeActividad(c.db, op, new Date(ahora), false),
    c.db
      .prepare(
        `INSERT INTO crm_actividades (contacto_id, oportunidad_id, creado_en, tipo, texto, autor) VALUES (?, ?, ?, 'puntaje', ?, ?)`,
      )
      .bind(op.contacto_id, opId, ahora, `${nombre(op.puntaje)} → ${nombre(puntaje)}: ${motivo}`, c.usuario),
    sentenciaAuditoria(c, "puntaje", "contacto", op.contacto_id, `${op.puntaje} → ${puntaje}`),
  ]);
  return volverA(`/contacto/${op.contacto_id}`, { ok: "puntaje" });
}

/** Un monto en pesos escrito a mano («450.000.000», «450 millones», «450M»), o null. */
export function montoPesos(texto: string): number | null {
  const t = texto.toLowerCase().replace(/\s+/g, " ").trim();
  if (!t) return null;
  const m = t.match(/^\$?\s*([\d.,]+)\s*(mil millones|millones|millón|mm|m)?$/);
  if (!m) return null;
  const crudo = m[1];
  // «1.250.000.000» o «1,250,000,000»: separadores de miles. «1,5» o «1.5»
  // con unidad: decimales.
  const conUnidad = Boolean(m[2]);
  const n = conUnidad ? Number(crudo.replace(/\./g, "").replace(",", ".")) : Number(crudo.replace(/[.,]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return null;
  const valorPesos = m[2] === "mil millones" ? n * 1e9 : conUnidad ? n * 1e6 : n;
  return valorPesos >= 1_000_000 && valorPesos < 1e12 ? Math.round(valorPesos) : null;
}

export async function guardarDetalle(c: Ctx, opId: number, f: FormData): Promise<Response> {
  const op = await oportunidadDe(c, opId);
  if (!op) return volverA("/hoy");
  const fecha = (nombre: string) => {
    const v = valor(f, nombre, 10);
    return v ? fechaValida(v) : null;
  };
  const crudoFecha = (nombre: string) => valor(f, nombre, 16);
  const proximaEn = fecha("proxima_accion_en");
  const separacionEn = fecha("separacion_en");
  const recorridoTexto = crudoFecha("recorrido_en");
  const recorrido = recorridoTexto ? fechaHoraValida(recorridoTexto) : null;
  if ((crudoFecha("proxima_accion_en") && !proximaEn) || (crudoFecha("separacion_en") && !separacionEn) || (recorridoTexto && !recorrido)) {
    return volverA(`/contacto/${op.contacto_id}`, { error: "fecha" });
  }
  const valorTexto = valor(f, "valor_estimado", 40);
  const valorEstimado = valorTexto ? montoPesos(valorTexto) : null;
  if (valorTexto && valorEstimado === null) return volverA(`/contacto/${op.contacto_id}`, { error: "monto" });
  const interesElegido = valor(f, "interes", 80);
  const interes = valor(f, "interes_otro", 160) || (CATALOGO.some((x) => x.slug === interesElegido) ? interesElegido : "") || null;
  const proposito = valor(f, "proposito", 30);
  const ahora = new Date();
  const iso = ahora.toISOString();
  const sentencias: D1PreparedStatement[] = [
    c.db
      .prepare(
        `UPDATE crm_oportunidades
            SET interes = ?, proposito = ?, presupuesto = ?, forma_pago = ?, plazo = ?,
                rango_presupuesto = ?, pago = ?, valor_estimado = ?,
                proxima_accion = ?, proxima_accion_en = ?, recorrido_en = ?, unidad = ?, separacion_en = ?,
                actualizado_en = ?
          WHERE id = ?`,
      )
      .bind(
        interes,
        PROPOSITOS[proposito] ? proposito : null,
        valor(f, "presupuesto", 80) || null,
        valor(f, "forma_pago", 120) || null,
        valor(f, "plazo", 80) || null,
        presupuestoValido(valor(f, "rango_presupuesto", 20)),
        formaPagoValida(valor(f, "pago", 20)),
        valorEstimado,
        valor(f, "proxima_accion", 200) || null,
        proximaEn,
        recorrido,
        valor(f, "unidad", 80) || null,
        separacionEn,
        iso,
        opId,
      ),
    ...sentenciasDeActividad(c.db, op, ahora, false),
  ];
  if (recorrido && recorrido !== op.recorrido_en) {
    sentencias.push(
      c.db
        .prepare(
          `INSERT INTO crm_actividades (contacto_id, oportunidad_id, creado_en, tipo, texto, autor) VALUES (?, ?, ?, 'sistema', ?, ?)`,
        )
        .bind(op.contacto_id, opId, iso, `${op.tipo === "compra" ? "Recorrido" : "Visita"} agendado para ${fechaLocal(recorrido)}`, c.usuario),
    );
  }
  sentencias.push(sentenciaAuditoria(c, "detalle", "contacto", op.contacto_id));
  await c.db.batch(sentencias);
  return volverA(`/contacto/${op.contacto_id}`, { ok: "guardado" });
}

/** ¿Hay otra ficha (viva) con este teléfono o correo? */
async function otraFicha(c: Ctx, telefono: string | null, correo: string | null, excepto: number): Promise<number | null> {
  if (!telefono && !correo) return null;
  const f = await c.db
    .prepare(
      `SELECT id FROM crm_contactos
        WHERE id != ?3 AND estado_datos != 'suprimido'
          AND ((?1 IS NOT NULL AND telefono = ?1) OR (?2 IS NOT NULL AND correo = ?2))
        LIMIT 1`,
    )
    .bind(telefono, correo, excepto)
    .first<{ id: number }>();
  return f?.id ?? null;
}

export async function editarDatos(c: Ctx, contactoId: number, f: FormData): Promise<Response> {
  const actual = await contactoVivo(c, contactoId);
  if (!actual) return volverA("/hoy");
  const telTexto = valor(f, "telefono", 30);
  const telefono = telefonoE164(telTexto);
  const correoTexto = valor(f, "correo", 160);
  const correo = correoTexto ? correoNormal(correoTexto) : null;
  if (correoTexto && !correo) return volverA(`/contacto/${contactoId}`, { error: "datos" });
  const otra = await otraFicha(c, telefono, correo, contactoId);
  if (otra) return volverA(`/contacto/${contactoId}`, { error: "duplicado", otra: String(otra) });
  const nuevos = {
    nombre: valor(f, "nombre", 120) || null,
    telefono,
    telefono_crudo: telTexto && !telefono ? telTexto : null,
    correo,
    ciudad: valor(f, "ciudad", 80) || null,
    pais: valor(f, "pais", 80) || null,
    idioma: valor(f, "idioma", 2) === "en" ? "en" : "es",
  };
  const cambiados = (Object.keys(nuevos) as (keyof typeof nuevos)[]).filter((k) => (actual[k] ?? null) !== nuevos[k]);
  if (!cambiados.length) return volverA(`/contacto/${contactoId}`);
  const ahora = ahoraIso();
  await c.db.batch([
    c.db
      .prepare(
        `UPDATE crm_contactos
            SET nombre = ?, telefono = ?, telefono_crudo = ?, correo = ?, ciudad = ?, pais = ?, idioma = ?, actualizado_en = ?
          WHERE id = ?`,
      )
      .bind(nuevos.nombre, nuevos.telefono, nuevos.telefono_crudo, nuevos.correo, nuevos.ciudad, nuevos.pais, nuevos.idioma, ahora, contactoId),
    c.db
      .prepare(`INSERT INTO crm_actividades (contacto_id, creado_en, tipo, texto, autor) VALUES (?, ?, 'datos', ?, ?)`)
      .bind(contactoId, ahora, `Datos editados: ${cambiados.join(", ")}`, c.usuario),
    // En la auditoría van los campos que cambiaron, nunca los valores.
    sentenciaAuditoria(c, "editar", "contacto", contactoId, cambiados.join(", ")),
  ]);
  return volverA(`/contacto/${contactoId}`, { ok: "guardado" });
}

export async function nuevaOportunidad(c: Ctx, contactoId: number, f: FormData): Promise<Response> {
  const contacto = await contactoVivo(c, contactoId);
  if (!contacto) return volverA("/hoy");
  const tipo: Tipo = valor(f, "tipo", 10) === "venta" ? "venta" : "compra";
  const abierta = await c.db
    .prepare(`SELECT id FROM crm_oportunidades WHERE contacto_id = ? AND tipo = ? AND cerrada = 0`)
    .bind(contactoId, tipo)
    .first();
  if (abierta) return volverA(`/contacto/${contactoId}`, { error: "oportunidad" });
  const ahora = ahoraIso();
  const canal = (contacto as Contacto & { canal_ultimo?: string | null }).canal_ultimo ?? null;
  await c.db.batch([
    c.db
      .prepare(
        `INSERT INTO crm_oportunidades (contacto_id, creado_en, actualizado_en, tipo, etapa, etapa_desde, canal, ultima_actividad_en)
         VALUES (?, ?, ?, ?, 'nuevo', ?, ?, ?)`,
      )
      .bind(contactoId, ahora, ahora, tipo, ahora, canal, ahora),
    c.db
      .prepare(`INSERT INTO crm_actividades (contacto_id, creado_en, tipo, texto, autor) VALUES (?, ?, 'sistema', ?, ?)`)
      .bind(contactoId, ahora, `Oportunidad nueva: ${tipo === "compra" ? "compra" : "venta o consignación"}`, c.usuario),
    sentenciaAuditoria(c, "oportunidad", "contacto", contactoId, tipo),
  ]);
  return volverA(`/contacto/${contactoId}`, { ok: "oportunidad" });
}

/**
 * Alta manual (Prompt 3, §2.7): sin autorización no se guarda. Si la persona
 * ya tenía ficha (mismo teléfono o correo), lo nuevo va a la suya.
 */
export async function altaManual(
  c: Ctx,
  f: FormData,
): Promise<Response | { error: string; datos: DatosAlta }> {
  const datos: DatosAlta = {};
  for (const k of ["tipo", "nombre", "telefono", "correo", "ciudad", "pais", "idioma", "fuente", "interes", "texto", "autorizacion_canal", "autorizacion_fecha", "autorizacion_evidencia", "rango_presupuesto", "pago", "objetivo"]) {
    datos[k] = valor(f, k, k === "texto" ? 2000 : k === "autorizacion_evidencia" ? 500 : 160);
  }
  const tipo: Tipo = datos.tipo === "venta" ? "venta" : "compra";
  const nombre = datos.nombre ?? "";
  const telefono = telefonoE164(datos.telefono);
  const correo = datos.correo ? correoNormal(datos.correo) : null;
  if (!nombre) return { error: "Falta el nombre.", datos };
  if (datos.correo && !correo) return { error: "El correo no parece válido.", datos };
  if (!telefono && !correo && !datos.telefono) return { error: "Hace falta el teléfono o el correo.", datos };
  if (!FUENTES_MANUALES.includes(datos.fuente ?? "")) return { error: "Elige de dónde llegó.", datos };
  if (valor(f, "autoriza", 4) !== "si") return { error: "Sin autorización de datos no se guarda: marca la casilla.", datos };
  if (!CANALES_AUTORIZACION[datos.autorizacion_canal ?? ""]) return { error: "Elige cómo dio la autorización.", datos };
  const fechaAut = fechaValida(datos.autorizacion_fecha ?? "");
  if (!fechaAut || fechaAut > hoy()) return { error: "La fecha de la autorización no es válida.", datos };
  if (!datos.autorizacion_evidencia) return { error: "Anota dónde quedó la prueba de la autorización.", datos };
  const interes = CATALOGO.some((x) => x.slug === datos.interes) ? datos.interes! : null;
  // Las tres preguntas, si Rafael ya las sabe (7-oct-2026).
  const rango = tipo === "compra" ? presupuestoValido(datos.rango_presupuesto) : null;
  const pago = tipo === "compra" ? formaPagoValida(datos.pago) : null;
  const objetivo = tipo === "compra" ? objetivoValido(datos.objetivo) : null;
  const proposito = objetivo && objetivo !== NO_SE ? objetivo : null;
  const canal = datos.fuente ?? "otro";
  const ahora = ahoraIso();
  const resumen = [
    `Alta manual · ${FUENTES[datos.fuente ?? ""] ?? datos.fuente}`,
    interes ? `Interés: ${CATALOGO.find((x) => x.slug === interes)?.nombre}` : null,
    datos.texto || null,
  ]
    .filter(Boolean)
    .join("\n");

  const existente = await otraFicha(c, telefono, correo, 0);
  if (existente) {
    const abierta = await c.db
      .prepare(`SELECT id FROM crm_oportunidades WHERE contacto_id = ? AND tipo = ? AND cerrada = 0`)
      .bind(existente, tipo)
      .first<{ id: number }>();
    const sentencias: D1PreparedStatement[] = [];
    if (!abierta) {
      sentencias.push(
        c.db
          .prepare(
            `INSERT INTO crm_oportunidades
               (contacto_id, creado_en, actualizado_en, tipo, etapa, etapa_desde, interes, canal,
                rango_presupuesto, pago, proposito, ultima_actividad_en)
             VALUES (?1, ?2, ?2, ?3, 'nuevo', ?2, ?4, ?5, ?6, ?7, ?8, ?2)`,
          )
          .bind(existente, ahora, tipo, interes, canal, rango, pago, proposito),
      );
    }
    sentencias.push(
      c.db
        .prepare(`INSERT INTO crm_actividades (contacto_id, creado_en, tipo, texto, autor) VALUES (?, ?, 'sistema', ?, ?)`)
        .bind(existente, ahora, resumen, c.usuario),
      c.db.prepare(`UPDATE crm_contactos SET actualizado_en = ?, fuente_ultima = ? WHERE id = ?`).bind(ahora, datos.fuente, existente),
      sentenciaAuditoria(c, "crear", "contacto", existente, "alta manual sobre ficha existente"),
    );
    await c.db.batch(sentencias);
    return volverA(`/contacto/${existente}`, { ok: "existia" });
  }

  const r = await c.db
    .prepare(
      `INSERT INTO crm_contactos
         (creado_en, actualizado_en, nombre, telefono, telefono_crudo, correo, ciudad, pais, idioma,
          fuente, fuente_ultima, autorizacion_fecha, autorizacion_canal, autorizacion_evidencia, autorizacion_version,
          canal, canal_ultimo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'manual', ?, ?)`,
    )
    .bind(
      ahora,
      ahora,
      nombre,
      telefono,
      telefono ? null : datos.telefono || null,
      correo,
      datos.ciudad || null,
      datos.pais || null,
      datos.idioma === "en" ? "en" : "es",
      datos.fuente,
      datos.fuente,
      fechaAut,
      datos.autorizacion_canal,
      datos.autorizacion_evidencia,
      canal,
      canal,
    )
    .run();
  const id = Number(r.meta.last_row_id);
  await c.db.batch([
    c.db
      .prepare(
        `INSERT INTO crm_oportunidades
           (contacto_id, creado_en, actualizado_en, tipo, etapa, etapa_desde, interes, canal,
            rango_presupuesto, pago, proposito, ultima_actividad_en)
         VALUES (?1, ?2, ?2, ?3, 'nuevo', ?2, ?4, ?5, ?6, ?7, ?8, ?2)`,
      )
      .bind(id, ahora, tipo, interes, canal, rango, pago, proposito),
    c.db
      .prepare(`INSERT INTO crm_actividades (contacto_id, creado_en, tipo, texto, autor) VALUES (?, ?, 'sistema', ?, ?)`)
      .bind(id, ahora, resumen, c.usuario),
    sentenciaAuditoria(c, "crear", "contacto", id, "alta manual"),
  ]);
  return volverA(`/contacto/${id}`, { ok: "creado" });
}

/**
 * La inversión de la semana en anuncios (7-oct-2026): Rafael la copia cada
 * lunes de los administradores de anuncios. Un monto vacío no cambia nada;
 * un 0 dice «esa semana no hubo pauta».
 */
export async function guardarInversion(c: Ctx, f: FormData): Promise<Response> {
  const semana = fechaValida(valor(f, "semana", 10));
  if (!semana) return volverA("/tablero", { error: "fecha" });
  const lunes = lunesDe(semana);
  if (lunes > lunesDe(hoy())) return volverA("/tablero", { error: "fecha" });
  const iso = ahoraIso();
  const sentencias: D1PreparedStatement[] = [];
  for (const canal of CANALES_INVERSION) {
    const crudo = valor(f, `monto_${canal.id}`, 40);
    if (!crudo) continue;
    const limpio = crudo.replace(/[$.,\s]/g, "");
    const monto = limpio === "0" ? 0 : montoPesos(crudo) ?? (/^\d{1,10}$/.test(limpio) ? Number(limpio) : null);
    if (monto === null || monto < 0) return volverA("/tablero", { error: "monto", semana: lunes });
    sentencias.push(
      c.db
        .prepare(
          `INSERT INTO crm_inversion (semana, canal, monto, creado_en, actualizado_en, autor) VALUES (?1, ?2, ?3, ?4, ?4, ?5)
           ON CONFLICT(semana, canal) DO UPDATE SET monto = excluded.monto, actualizado_en = excluded.actualizado_en, autor = excluded.autor`,
        )
        .bind(lunes, canal.id, monto, iso, c.usuario),
    );
  }
  if (!sentencias.length) return volverA("/tablero", { semana: lunes });
  sentencias.push(sentenciaAuditoria(c, "inversion", null, null, lunes));
  await c.db.batch(sentencias);
  return volverA("/tablero", { ok: "inversion", semana: lunes });
}
