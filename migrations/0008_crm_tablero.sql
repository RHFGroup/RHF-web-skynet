-- El tablero del CRM (7-oct-2026, pedido de Rafael)
--
-- Lo que necesitan la auditoría y el control del embudo que pidió Rafael:
--  1. calificar desde el primer mensaje: presupuesto, forma de pago y
--     objetivo, en rangos (src/data/calificacion.ts);
--  2. saber de qué canal llega cada lead (crm/src/canales.ts), para auditar
--     cada lunes si los anuncios se convierten en oportunidades;
--  3. medir la primera respuesta (SLA de 15 minutos hábiles, aviso a los 10);
--  4. la higiene de 7, 15 y 30 días sin actividad;
--  5. las cinco fases del embudo y cuándo llegó cada oportunidad a cada una;
--  6. la inversión semanal en anuncios, que Rafael carga a mano;
--  7. las conversaciones del agente de atención (chat de la web y WhatsApp),
--     que Rafael pidió ver todas.
--
-- Solo agrega: columnas nuevas y tablas nuevas. No borra ni cambia ningún
-- dato que ya exista, salvo llenar por primera vez las columnas nuevas.
--
-- OJO: a diferencia de la 0002 a la 0007, esta usa ALTER TABLE, que no se
-- puede repetir. `wrangler d1 migrations apply` la corre una sola vez (queda
-- anotada en d1_migrations). Nunca correrla a mano con `d1 execute --file`
-- sobre una base que ya la tenga.

-- ── 1 y 2. Lo que manda el sitio con cada consulta ───────────────────────
ALTER TABLE consultas ADD COLUMN presupuesto TEXT;   -- código: hasta_250, 250_400, 400_600, 600_900, mas_900, no_se
ALTER TABLE consultas ADD COLUMN forma_pago TEXT;    -- código: propios, credito, mixto, venta_otro, no_se
ALTER TABLE consultas ADD COLUMN objetivo TEXT;      -- código: vivir, renta_corta, renta_tradicional, patrimonio, no_se
ALTER TABLE consultas ADD COLUMN atribucion TEXT;    -- JSON: UTM, identificador del clic, página de entrada, dominio que lo trajo
ALTER TABLE consultas ADD COLUMN canal TEXT;         -- deducido en el Worker (crm/src/canales.ts)

UPDATE consultas SET canal = 'whatsapp_ia' WHERE canal IS NULL AND origen LIKE 'agente:whatsapp%';
UPDATE consultas SET canal = 'chat_ia' WHERE canal IS NULL AND origen LIKE 'agente:%';

ALTER TABLE crm_contactos ADD COLUMN canal TEXT;         -- el de la primera vez que llegó
ALTER TABLE crm_contactos ADD COLUMN canal_ultimo TEXT;  -- el de la última

UPDATE crm_contactos SET canal = CASE
    WHEN fuente = 'whatsapp' THEN 'whatsapp_ia'
    WHEN fuente IN ('chat', 'agente') THEN 'chat_ia'
    WHEN fuente IN ('instagram', 'facebook', 'feria', 'referido', 'llamada', 'whatsapp_directo', 'otro') THEN fuente
    ELSE 'sin_dato' END
  WHERE canal IS NULL;
UPDATE crm_contactos SET canal_ultimo = canal WHERE canal_ultimo IS NULL;

-- ── Las oportunidades ─────────────────────────────────────────────────────
ALTER TABLE crm_oportunidades ADD COLUMN canal TEXT;               -- el de la consulta que la abrió
ALTER TABLE crm_oportunidades ADD COLUMN rango_presupuesto TEXT;   -- código (src/data/calificacion.ts)
ALTER TABLE crm_oportunidades ADD COLUMN pago TEXT;                -- código de la forma de pago
ALTER TABLE crm_oportunidades ADD COLUMN valor_estimado INTEGER;   -- pesos; si falta, el tablero usa el punto medio del rango

-- 3. La primera respuesta. `espera_desde` dice desde cuándo la persona espera
-- que Rafael le escriba (NULL: nadie espera). Se llena con cada consulta nueva
-- y se vacía con el primer intento de contacto.
ALTER TABLE crm_oportunidades ADD COLUMN espera_desde TEXT;
ALTER TABLE crm_oportunidades ADD COLUMN sla_aviso_en TEXT;        -- cuándo salió el aviso de los 10 minutos
ALTER TABLE crm_oportunidades ADD COLUMN sla_vencido_en TEXT;      -- cuándo salió el de los 15
ALTER TABLE crm_oportunidades ADD COLUMN primer_intento_en TEXT;   -- el primer WhatsApp, llamada o correo de Rafael
ALTER TABLE crm_oportunidades ADD COLUMN minutos_respuesta INTEGER; -- minutos hábiles hasta ese primer intento

-- 4. La higiene.
ALTER TABLE crm_oportunidades ADD COLUMN ultima_actividad_en TEXT;
ALTER TABLE crm_oportunidades ADD COLUMN higiene_nivel INTEGER NOT NULL DEFAULT 0;  -- 0, 7, 15 o 30 días
ALTER TABLE crm_oportunidades ADD COLUMN higiene_en TEXT;

-- 5. Cuándo llegó por primera vez a cada fase del embudo (crm/src/datos.ts).
ALTER TABLE crm_oportunidades ADD COLUMN fase_contactado_en TEXT;
ALTER TABLE crm_oportunidades ADD COLUMN fase_presentacion_en TEXT;
ALTER TABLE crm_oportunidades ADD COLUMN fase_cotizacion_en TEXT;
ALTER TABLE crm_oportunidades ADD COLUMN fase_cierre_en TEXT;

UPDATE crm_oportunidades SET canal = (SELECT canal FROM crm_contactos c WHERE c.id = crm_oportunidades.contacto_id)
  WHERE canal IS NULL;

UPDATE crm_oportunidades SET ultima_actividad_en = COALESCE(
    (SELECT MAX(a.creado_en) FROM crm_actividades a
      WHERE a.oportunidad_id = crm_oportunidades.id
        AND a.tipo IN ('nota', 'llamada', 'whatsapp', 'correo', 'visita', 'etapa', 'formulario', 'agente')),
    actualizado_en, creado_en)
  WHERE ultima_actividad_en IS NULL;

-- Los que siguen en «Nuevo» sin un primer contacto, esperan desde que llegaron.
-- El cron no avisa por esperas de más de dos horas hábiles (crm/src/sla.ts):
-- los leads viejos aparecen en «Hoy», sin una tanda de avisos.
UPDATE crm_oportunidades SET espera_desde = creado_en
  WHERE espera_desde IS NULL AND cerrada = 0 AND etapa = 'nuevo'
    AND (SELECT ultimo_contacto_en FROM crm_contactos c WHERE c.id = crm_oportunidades.contacto_id) IS NULL;

-- Las fases de lo que ya avanzó: la fecha de su etapa actual, la única que se
-- conoce. Es una aproximación solo para lo anterior al 7-oct-2026.
UPDATE crm_oportunidades SET fase_contactado_en = etapa_desde
  WHERE fase_contactado_en IS NULL AND (
    (tipo = 'compra' AND etapa IN ('contactado', 'calificado', 'recorrido_agendado', 'recorrido_hecho', 'propuesta', 'separo'))
    OR (tipo = 'venta' AND etapa IN ('contactado', 'visita', 'consignado', 'publicado', 'negociacion', 'vendido')));
UPDATE crm_oportunidades SET fase_presentacion_en = etapa_desde
  WHERE fase_presentacion_en IS NULL AND (
    (tipo = 'compra' AND etapa IN ('recorrido_agendado', 'recorrido_hecho', 'propuesta', 'separo'))
    OR (tipo = 'venta' AND etapa IN ('visita', 'consignado', 'publicado', 'negociacion', 'vendido')));
UPDATE crm_oportunidades SET fase_cotizacion_en = etapa_desde
  WHERE fase_cotizacion_en IS NULL AND (
    (tipo = 'compra' AND etapa IN ('propuesta', 'separo'))
    OR (tipo = 'venta' AND etapa IN ('consignado', 'publicado', 'negociacion', 'vendido')));
UPDATE crm_oportunidades SET fase_cierre_en = etapa_desde
  WHERE fase_cierre_en IS NULL AND ((tipo = 'compra' AND etapa = 'separo') OR (tipo = 'venta' AND etapa = 'vendido'));

CREATE INDEX IF NOT EXISTS idx_crm_oportunidades_espera ON crm_oportunidades(espera_desde) WHERE espera_desde IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_crm_oportunidades_creado ON crm_oportunidades(creado_en);
CREATE INDEX IF NOT EXISTS idx_crm_oportunidades_abiertas ON crm_oportunidades(cerrada, ultima_actividad_en);

-- Las tareas que pone el sistema (la higiene) llevan su regla, para no
-- repetirlas.
ALTER TABLE crm_tareas ADD COLUMN regla TEXT;
CREATE INDEX IF NOT EXISTS idx_crm_tareas_regla ON crm_tareas(oportunidad_id, regla) WHERE regla IS NOT NULL;

-- ── 6. La inversión semanal en anuncios ─────────────────────────────────
CREATE TABLE IF NOT EXISTS crm_inversion (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  semana         TEXT    NOT NULL,                  -- el lunes de la semana, AAAA-MM-DD (hora de Colombia)
  canal          TEXT    NOT NULL,                  -- meta_ads, google_ads, youtube_ads, otros_ads
  monto          INTEGER NOT NULL CHECK (monto >= 0), -- pesos colombianos
  nota           TEXT,
  creado_en      TEXT    NOT NULL,
  actualizado_en TEXT    NOT NULL,
  autor          TEXT    NOT NULL,
  UNIQUE (semana, canal)
);

-- ── 7. Las conversaciones del agente de atención ────────────────────────
-- Las manda el servidor del agente (Hermes, perfil «atencion»), con su token,
-- a POST /api/conversaciones-agente. Una fila por sesión de Hermes.
CREATE TABLE IF NOT EXISTS agente_conversaciones (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  sesion         TEXT    NOT NULL UNIQUE,           -- el id de la sesión en Hermes
  canal          TEXT    NOT NULL,                  -- whatsapp, webchat, api_server…
  usuario        TEXT,                              -- el id de quien escribe en esa plataforma
  telefono       TEXT,                              -- E.164, cuando se conoce (WhatsApp)
  contacto_id    INTEGER,                           -- la ficha del CRM, si se pudo enlazar
  iniciada_en    TEXT    NOT NULL,
  ultimo_en      TEXT    NOT NULL,
  mensajes       INTEGER NOT NULL DEFAULT 0,
  primer_mensaje TEXT,                              -- lo primero que escribió la persona, recortado
  leida_en       TEXT,                              -- la última vez que Rafael la abrió
  creado_en      TEXT    NOT NULL,
  actualizado_en TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_agente_conversaciones_ultimo ON agente_conversaciones(ultimo_en DESC);
CREATE INDEX IF NOT EXISTS idx_agente_conversaciones_telefono ON agente_conversaciones(telefono);
CREATE INDEX IF NOT EXISTS idx_agente_conversaciones_contacto ON agente_conversaciones(contacto_id);

CREATE TABLE IF NOT EXISTS agente_mensajes (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  conversacion_id INTEGER NOT NULL,
  origen_id       TEXT    NOT NULL,                 -- el id del mensaje en Hermes: lo que hace idempotente el envío
  rol             TEXT    NOT NULL CHECK (rol IN ('persona', 'agente')),
  texto           TEXT    NOT NULL,
  en              TEXT    NOT NULL,                 -- ISO 8601 UTC
  UNIQUE (conversacion_id, origen_id)
);
CREATE INDEX IF NOT EXISTS idx_agente_mensajes_conversacion ON agente_mensajes(conversacion_id, en);

-- Cuándo llegó el último envío del servidor del agente: si deja de mandar,
-- el CRM lo dice.
CREATE TABLE IF NOT EXISTS agente_sincronizacion (
  fuente         TEXT    PRIMARY KEY,               -- 'atencion'
  ultimo_en      TEXT    NOT NULL,
  lotes          INTEGER NOT NULL DEFAULT 0,
  mensajes       INTEGER NOT NULL DEFAULT 0
);
