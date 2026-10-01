-- El CRM interno (1-oct-2026, Prompt 3 de Luciano, fase 2)
--
-- Tablas nuevas para el CRM de crm.rhfliving.com (carpeta crm/ del repo). Solo
-- agrega: no toca `consultas`, `suscriptores` ni ninguna otra tabla existente.
--
-- El CRM lee `consultas` (formularios, /vender, guía, simulador y las llamadas
-- que pide el agente de WhatsApp y del chat) y arma con eso una ficha por
-- persona. La consulta original no se copia ni se mueve: queda donde está, como
-- constancia de la autorización, y la ficha la enlaza (`crm_actividades.consulta_id`).
--
-- Una persona, una ficha: el CRM deduplica por teléfono en formato E.164
-- (+573001234567) y por correo en minúsculas.
--
-- OJO al aplicarla en producción: el registro remoto `d1_migrations` solo tiene
-- la 0001. `wrangler d1 migrations apply rhf-leads --remote` va a correr
-- también de la 0002 a la 0005; todas son `CREATE … IF NOT EXISTS`.

-- Las personas.
CREATE TABLE IF NOT EXISTS crm_contactos (
  id                     INTEGER PRIMARY KEY AUTOINCREMENT,
  creado_en              TEXT    NOT NULL,          -- ISO 8601 UTC: la primera vez que escribió
  actualizado_en         TEXT    NOT NULL,
  ultimo_contacto_en     TEXT,                      -- la última vez que Rafael le escribió o lo llamó
  nombre                 TEXT,
  telefono               TEXT,                      -- E.164, si se pudo normalizar
  telefono_crudo         TEXT,                      -- como lo escribió, si no se pudo
  correo                 TEXT,                      -- en minúsculas
  pais                   TEXT,
  ciudad                 TEXT,
  idioma                 TEXT,                      -- 'es' | 'en'

  -- De dónde llegó. Las columnas de campaña se llenan cuando el sitio las mande
  -- (Prompt 1: códigos de WhatsApp, UTM, gclid y fbclid).
  fuente                 TEXT    NOT NULL,          -- la primera: formulario, vender, guia, simulador, whatsapp, chat, manual…
  fuente_ultima          TEXT,
  pagina_entrada         TEXT,
  codigo_wa              TEXT,
  utm_primero            TEXT,
  utm_ultimo             TEXT,
  gclid                  TEXT,
  fbclid                 TEXT,

  -- La autorización de datos (Ley 1581). Las que llegan por el sitio tienen
  -- además su constancia completa en `consultas`.
  autorizacion_fecha     TEXT,
  autorizacion_version   TEXT,
  autorizacion_canal     TEXT,
  autorizacion_evidencia TEXT,
  estado_datos           TEXT    NOT NULL DEFAULT 'normal'
                         CHECK (estado_datos IN ('normal', 'reclamo', 'suprimido'))
);
CREATE INDEX IF NOT EXISTS idx_crm_contactos_telefono ON crm_contactos(telefono);
CREATE INDEX IF NOT EXISTS idx_crm_contactos_correo ON crm_contactos(correo);
CREATE INDEX IF NOT EXISTS idx_crm_contactos_actualizado ON crm_contactos(actualizado_en DESC);

-- Lo que cada persona quiere: comprar, o vender y consignar. Una persona puede
-- tener las dos.
CREATE TABLE IF NOT EXISTS crm_oportunidades (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  contacto_id       INTEGER NOT NULL,
  creado_en         TEXT    NOT NULL,
  actualizado_en    TEXT    NOT NULL,
  tipo              TEXT    NOT NULL CHECK (tipo IN ('compra', 'venta')),
  etapa             TEXT    NOT NULL,
  etapa_desde       TEXT    NOT NULL,              -- cuándo entró a la etapa actual
  motivo_perdida    TEXT,
  puntaje           TEXT    NOT NULL DEFAULT 'sin' CHECK (puntaje IN ('A', 'B', 'C', 'sin')),
  puntaje_motivo    TEXT,
  interes           TEXT,                          -- proyectos o inmuebles de interés
  proposito         TEXT,                          -- vivir, renta corta, renta tradicional, patrimonio, retiro
  presupuesto       TEXT,
  forma_pago        TEXT,
  plazo             TEXT,
  proxima_accion    TEXT,
  proxima_accion_en TEXT,                          -- fecha local de Colombia (AAAA-MM-DD)
  recorrido_en      TEXT,                          -- fecha y hora local de Colombia (AAAA-MM-DDTHH:MM)
  unidad            TEXT,
  separacion_en     TEXT,
  cerrada           INTEGER NOT NULL DEFAULT 0     -- 1 en Separó, Perdido, Vendido o Descartado
);
CREATE INDEX IF NOT EXISTS idx_crm_oportunidades_contacto ON crm_oportunidades(contacto_id);
CREATE INDEX IF NOT EXISTS idx_crm_oportunidades_etapa ON crm_oportunidades(tipo, etapa);

-- La línea de tiempo de cada ficha.
CREATE TABLE IF NOT EXISTS crm_actividades (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  contacto_id    INTEGER NOT NULL,
  oportunidad_id INTEGER,
  creado_en      TEXT    NOT NULL,
  tipo           TEXT    NOT NULL,   -- nota, llamada, whatsapp, correo, visita, formulario, chat, etapa, puntaje, sistema
  texto          TEXT,
  autor          TEXT    NOT NULL,   -- 'rafael' o 'sitio'
  consulta_id    INTEGER             -- la consulta del sitio de la que viene, si viene de una
);
CREATE INDEX IF NOT EXISTS idx_crm_actividades_contacto ON crm_actividades(contacto_id, creado_en DESC);
-- Una consulta entra una sola vez, aunque la ingesta se repita.
CREATE UNIQUE INDEX IF NOT EXISTS idx_crm_actividades_consulta ON crm_actividades(consulta_id)
  WHERE consulta_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS crm_tareas (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  contacto_id    INTEGER NOT NULL,
  oportunidad_id INTEGER,
  creado_en      TEXT    NOT NULL,
  titulo         TEXT    NOT NULL,
  vence_en       TEXT    NOT NULL,   -- fecha local de Colombia (AAAA-MM-DD)
  hecha_en       TEXT,
  origen         TEXT    NOT NULL DEFAULT 'manual'
                 CHECK (origen IN ('manual', 'cadencia', 'asistente', 'sistema'))
);
CREATE INDEX IF NOT EXISTS idx_crm_tareas_pendientes ON crm_tareas(hecha_en, vence_en);
CREATE INDEX IF NOT EXISTS idx_crm_tareas_contacto ON crm_tareas(contacto_id);

-- Quién vio, exportó, editó o suprimió qué, y cuándo.
CREATE TABLE IF NOT EXISTS crm_auditoria (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  creado_en  TEXT    NOT NULL,
  usuario    TEXT    NOT NULL,
  accion     TEXT    NOT NULL,
  entidad    TEXT,
  entidad_id INTEGER,
  detalle    TEXT,
  ip         TEXT
);
CREATE INDEX IF NOT EXISTS idx_crm_auditoria_fecha ON crm_auditoria(creado_en DESC);

-- El acceso: el código que llega por Telegram y la sesión que abre. De los dos
-- se guarda solo la huella SHA-256, nunca el valor.
CREATE TABLE IF NOT EXISTS crm_codigos (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  creado_en   TEXT    NOT NULL,
  expira_en   TEXT    NOT NULL,
  codigo_hash TEXT    NOT NULL,
  intentos    INTEGER NOT NULL DEFAULT 0,
  usado_en    TEXT,
  anulado_en  TEXT,
  ip          TEXT
);
CREATE INDEX IF NOT EXISTS idx_crm_codigos_fecha ON crm_codigos(creado_en DESC);

CREATE TABLE IF NOT EXISTS crm_sesiones (
  token_hash    TEXT PRIMARY KEY,
  usuario       TEXT NOT NULL,
  creado_en     TEXT NOT NULL,
  expira_en     TEXT NOT NULL,
  ultimo_uso_en TEXT,
  revocada_en   TEXT,
  ip            TEXT,
  user_agent    TEXT
);

-- Hasta qué consulta llegó la ingesta.
CREATE TABLE IF NOT EXISTS crm_ingesta (
  fuente         TEXT    PRIMARY KEY,   -- 'consultas'
  ultimo_id      INTEGER NOT NULL DEFAULT 0,
  actualizado_en TEXT
);
