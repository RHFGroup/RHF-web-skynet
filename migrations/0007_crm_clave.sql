-- El CRM entra con clave (6-oct-2026, pedido de Rafael)
--
-- El CRM pasó a vivir dentro del Worker del sitio, en una ruta secreta de
-- rhfliving.com, y se entra con una clave en vez del código por Telegram. La
-- clave no se guarda en la base: su huella vive en el secreto `CRM_CLAVE` de
-- Cloudflare (crm/src/clave.ts).
--
-- Esta tabla guarda cada intento de entrar, para los topes: 5 claves
-- equivocadas por conexión en 15 minutos, y 20 en una hora desde donde sea
-- (crm/src/acceso.ts). Solo agrega: no toca ninguna tabla que ya exista.
-- `crm_codigos` (0006) queda sin uso.

CREATE TABLE IF NOT EXISTS crm_ingresos (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  creado_en  TEXT NOT NULL,                       -- ISO 8601 UTC
  ip         TEXT NOT NULL,                       -- la de Cloudflare (CF-Connecting-IP), o 'sin-ip'
  resultado  TEXT NOT NULL CHECK (resultado IN ('ok', 'fallo', 'bloqueado'))
);
CREATE INDEX IF NOT EXISTS idx_crm_ingresos_fecha ON crm_ingresos(creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_crm_ingresos_ip ON crm_ingresos(ip, creado_en DESC);
