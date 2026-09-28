-- El boletín de noticias de la Zona Norte (28-sep-2026)
--
-- Una fila por correo suscrito, con la prueba de la autorización que exige la
-- Ley 1581 de 2012: fecha, versión del texto aceptado, IP y navegador. Si la
-- persona se vuelve a suscribir, se actualiza la constancia; si se da de baja,
-- se marca `estado = 'baja'` y `baja_en`, sin borrar la constancia.
--
-- El Worker (worker/index.ts, `guardarSuscripcion`) crea esta tabla solo en
-- la primera suscripción, así que no hace falta correr esta migración para
-- que funcione. Está acá para que el esquema quede escrito donde están los
-- demás. Para leer la lista:
--
--   wrangler d1 execute rhf-leads --remote --command "SELECT correo, creado_en, estado FROM suscriptores"

CREATE TABLE IF NOT EXISTS suscriptores (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  creado_en      TEXT    NOT NULL,          -- ISO 8601 UTC, primera suscripción
  correo         TEXT    NOT NULL UNIQUE,   -- en minúsculas

  -- Prueba del consentimiento
  autoriza       INTEGER NOT NULL CHECK (autoriza = 1),
  version_aviso  TEXT    NOT NULL,          -- qué texto de autorización aceptó
  ip             TEXT,                      -- CF-Connecting-IP
  user_agent     TEXT,

  -- Operación
  origen         TEXT,                      -- página desde la que se suscribió
  estado         TEXT    NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'baja')),
  actualizado_en TEXT,                      -- última suscripción o cambio
  baja_en        TEXT
);

-- Para el freno por IP: cuenta suscripciones recientes del mismo origen.
CREATE INDEX IF NOT EXISTS idx_suscriptores_ip_creado ON suscriptores(ip, actualizado_en DESC);
