-- El boletín con doble confirmación (30-sep-2026, Prompt 3, fase 1)
--
-- Dos tablas nuevas; `suscriptores` no cambia. Solo lo que se agrega: nada se
-- borra ni se reescribe.
--
-- `suscripcion_eventos`: cada autorización con su propia constancia (Ley
-- 1581): la solicitud, las repetidas, las reactivaciones, la confirmación y las
-- bajas. Una autorización nueva nunca reemplaza a la anterior. `idioma` y las
-- UTM de la página desde la que se suscribió van acá. `correo_enviado` marca
-- los eventos que mandaron un correo: sirve para el tope de tres por día.
--
-- `suscripcion_confirmaciones`: el enlace de confirmación que llega por
-- correo. Se guarda la huella SHA-256 del token, nunca el token. Vale siete
-- días; al confirmar queda `usado_en`.
--
-- `suscriptores` sigue siendo la lista: con la confirmación encendida, un
-- correo entra ahí recién cuando confirma, con la constancia de su solicitud.
--
-- El Worker (worker/boletin.ts, `prepararTablas`) crea estas tablas solo si no
-- existen, así que el orden entre esta migración y el deploy no importa. Está
-- acá para que el esquema quede escrito donde están los demás.
--
-- OJO al aplicarla en producción: el registro remoto `d1_migrations` solo
-- tiene la 0001. `wrangler d1 migrations apply rhf-leads --remote` va a correr
-- también la 0002, la 0003 y la 0004; son `CREATE … IF NOT EXISTS` y no
-- cambian nada, pero conviene saberlo antes.

CREATE TABLE IF NOT EXISTS suscripcion_eventos (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  creado_en      TEXT    NOT NULL,          -- ISO 8601 UTC
  correo         TEXT    NOT NULL,          -- en minúsculas
  tipo           TEXT    NOT NULL CHECK (tipo IN ('solicitud', 'repetida', 'reactivacion', 'confirmacion', 'baja')),

  -- La constancia de esa autorización
  autoriza       INTEGER CHECK (autoriza IN (0, 1)),
  version_aviso  TEXT,                      -- qué texto de autorización aceptó
  ip             TEXT,                      -- CF-Connecting-IP
  user_agent     TEXT,
  origen         TEXT,                      -- página desde la que se suscribió
  idioma         TEXT,                      -- 'es' | 'en'
  utm_source     TEXT,
  utm_medium     TEXT,
  utm_campaign   TEXT,
  utm_content    TEXT,
  utm_term       TEXT,

  correo_enviado INTEGER NOT NULL DEFAULT 0 -- 1 si este evento mandó un correo
);

CREATE INDEX IF NOT EXISTS idx_susc_eventos_correo ON suscripcion_eventos(correo, creado_en DESC);
-- Para el freno por IP: cuenta intentos recientes del mismo origen.
CREATE INDEX IF NOT EXISTS idx_susc_eventos_ip ON suscripcion_eventos(ip, creado_en DESC);

CREATE TABLE IF NOT EXISTS suscripcion_confirmaciones (
  token_hash TEXT    PRIMARY KEY,           -- SHA-256 del token, en hexadecimal
  correo     TEXT    NOT NULL,
  evento_id  INTEGER NOT NULL,              -- la solicitud que se confirma (suscripcion_eventos.id)
  creado_en  TEXT    NOT NULL,
  expira_en  TEXT    NOT NULL,
  usado_en   TEXT
);

CREATE INDEX IF NOT EXISTS idx_susc_conf_correo ON suscripcion_confirmaciones(correo, creado_en DESC);
