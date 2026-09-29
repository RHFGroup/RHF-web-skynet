-- La TRM del día (29-sep-2026), para la referencia en dólares de la web.
--
-- Una sola fila (id = 1). La mantiene el cron del Worker (worker/index.ts,
-- `refrescarTRMSiHaceFalta`): la refresca desde datos.gov.co cuando tiene más
-- de 6 horas. El Worker crea la tabla solo; esta migración está acá para que
-- el esquema quede escrito donde están los demás.
CREATE TABLE IF NOT EXISTS trm (
  id             INTEGER PRIMARY KEY CHECK (id = 1),
  valor          REAL    NOT NULL,
  vigente_desde  TEXT    NOT NULL,
  vigente_hasta  TEXT,
  actualizado_en TEXT    NOT NULL
);
