-- Consultas del formulario de contacto de rhfliving.com
--
-- Hasta el 18-sep-2026 el formulario no guardaba nada: abría WhatsApp con el
-- mensaje escrito. Sigue haciéndolo — esta tabla es la red debajo, para que el
-- dato sobreviva cuando WhatsApp no abre (bloqueador de pop-ups, escritorio
-- sin WhatsApp, navegador restringido).
--
-- Las cuatro columnas del bloque de consentimiento no son decorativas: la Ley
-- 1581 de 2012 obliga al responsable a poder DEMOSTRAR que la autorización fue
-- previa, expresa e informada. Sin ellas, guardar el dato es peor que no
-- guardarlo.

CREATE TABLE IF NOT EXISTS consultas (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  creado_en     TEXT    NOT NULL,          -- ISO 8601 UTC

  -- Lo que escribe la persona
  nombre        TEXT    NOT NULL,
  contacto      TEXT    NOT NULL,          -- teléfono o correo, tal como lo escribió
  proyecto      TEXT,                      -- proyecto de la cartera, o NULL
  mensaje       TEXT,

  -- Prueba del consentimiento
  autoriza      INTEGER NOT NULL CHECK (autoriza = 1),  -- sin casilla no se inserta
  version_aviso TEXT    NOT NULL,          -- qué texto de autorización aceptó
  ip            TEXT,                      -- CF-Connecting-IP
  user_agent    TEXT,

  -- Operación
  origen        TEXT,                      -- página desde la que se envió
  estado        TEXT    NOT NULL DEFAULT 'nueva',
  notificado_en TEXT
);

CREATE INDEX IF NOT EXISTS idx_consultas_creado ON consultas(creado_en DESC);
-- Para el freno por IP: cuenta envíos recientes del mismo origen.
CREATE INDEX IF NOT EXISTS idx_consultas_ip_creado ON consultas(ip, creado_en DESC);
