-- El vigía de los agentes (worker/vigia.ts)
--
-- Una fila por dirección vigilada (el chat de la web y el webhook de
-- WhatsApp), actualizada cada 5 minutos por el cron del Worker. Sirve para dos
-- cosas: que el vigía no repita el mismo aviso en cada chequeo, y dejar a la
-- vista qué respondió el agente la última vez:
--
--   wrangler d1 execute rhf-leads --remote --command "SELECT * FROM vigia"
--
-- El Worker crea esta tabla solo en su primer chequeo, así que no hace falta
-- correr esta migración para que funcione. Está acá para que el esquema quede
-- escrito donde están los demás.

CREATE TABLE IF NOT EXISTS vigia (
  clave          TEXT    PRIMARY KEY,                -- 'chat-web' | 'whatsapp'
  estado         TEXT    NOT NULL CHECK (estado IN ('arriba', 'abajo')),
  fallos         INTEGER NOT NULL DEFAULT 0,         -- chequeos fallidos seguidos
  desde          TEXT    NOT NULL,                   -- ISO 8601 UTC: desde cuándo está así
  primer_fallo   TEXT,                               -- primer fallo de la racha actual
  ultimo_aviso   TEXT,                               -- último aviso que salió por Telegram
  ultimo_chequeo TEXT    NOT NULL,
  detalle        TEXT    NOT NULL                    -- qué respondió, en castellano
);
