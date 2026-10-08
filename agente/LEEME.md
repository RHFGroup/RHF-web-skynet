# El sincronizador de conversaciones del agente

**Qué es.** Un programa chico que corre en el servidor del agente de atención
(Clouding, Hermes, perfil `atencion`) y manda al CRM, cada minuto, lo que la IA
conversó por WhatsApp y por el chat de la web. Así el CRM muestra los chats en
«Chats» y en la ficha de cada persona (pedido de Rafael, 7-oct-2026: «que se
pueda ver qué conversó la IA con el chat», todas).

**Estado: preparado, sin instalar.** El servidor del agente no se toca sin el
OK explícito de Rafael, y el acceso lo da él.

## Cómo funciona

1. Abre la base del agente (`~/.hermes/profiles/atencion/state.db`) en **solo
   lectura**: no escribe en ella, no reinicia nada y no cambia la configuración
   del agente.
2. Lee los mensajes nuevos desde la última corrida. Guarda por dónde va (el
   «cursor») en su propio archivo, `~/.local/state/rhf-sincronizar/estado.json`.
3. Se queda con lo que una persona ve: lo que escribió quien consulta y lo que
   respondió la IA. Descarta las herramientas, los resúmenes de contexto y los
   textos internos de Hermes. Solo toma los canales `whatsapp_cloud`,
   `whatsapp`, `webchat` y `api_server`, ni la terminal ni las tareas
   programadas.
4. Los manda a `POST /api/conversaciones-agente` con el mismo token con el que
   el agente avisa las llamadas pedidas. Cada mensaje lleva su id de Hermes y
   el Worker lo guarda una sola vez: repetir un envío no duplica nada.
5. Si el envío falla, el cursor no avanza y se reintenta al minuto siguiente.
6. Sin mensajes nuevos, cada 5 minutos manda un «latido» vacío. Si pasan 30
   minutos sin nada, la página «Chats» del CRM lo avisa en rojo.

**Privacidad.** En la salida y en el registro de systemd solo hay conteos.
Nunca imprime el texto de un mensaje, un teléfono ni el token.

## Archivos

| Archivo | Qué es |
|---|---|
| `sincronizar_conversaciones.py` | el programa (solo biblioteca estándar de Python 3.8+) |
| `test_sincronizar_conversaciones.py` | 17 pruebas con una base de Hermes y un Worker de mentira |
| `rhf-sincronizar.service` | la unidad de systemd que lo corre |
| `rhf-sincronizar.timer` | la que lo dispara cada minuto |

Pruebas: `python3 -m unittest agente/test_sincronizar_conversaciones.py -v`.

## Antes de instalar

- **El PR publicado.** El endpoint y las tablas (migración 0008) tienen que
  estar en producción. Antes de eso se puede probar contra la vista previa:
  ahí escribe en `rhf-leads-preview`, nunca en producción.
- **Una decisión de Rafael: desde cuándo.** La primera corrida exige elegir:
  - `--desde AAAA-MM-DD`: solo lo conversado desde ese día (recomendado: el día
    en que se publique la política que lo informa);
  - `--desde todo`: todo el historial que tenga el agente.
- **Las copias de la supresión.** Cuando alguien pide que borremos sus datos,
  «Suprimir» en el CRM borra la copia del CRM. La conversación original sigue
  en el servidor del agente y se borra allá aparte (en las versiones nuevas de
  Hermes, `hermes -p atencion sessions delete <id>`; confirmarlo con
  `hermes sessions --help` en la versión del servidor).

## Instalación (con el OK de Rafael)

Todo como el usuario dueño de `~/.hermes`, sin `sudo` salvo el paso 7.

**1. Revisar, solo lectura.**

```bash
ls -l ~/.hermes/profiles/atencion/state.db*
python3 --version                                   # 3.8 o más
python3 -c 'import sqlite3; print(sqlite3.sqlite_version)'   # 3.22 o más
# Solo los NOMBRES de las variables con token, nunca los valores:
grep -o '^[A-Z0-9_]*TOKEN[A-Z0-9_]*=' ~/.hermes/profiles/atencion/.env
# Cuál usa el aviso de llamadas (para elegir la misma):
grep -rhoE "(getenv|environ(\.get)?)[(\[]\s*['\"][A-Z0-9_]*TOKEN[A-Z0-9_]*" ~/.hermes/profiles/atencion/plugins/ 2>/dev/null | sort -u
```

**2. Copiar el programa.**

```bash
mkdir -p ~/.local/share/rhf-sincronizar
cp sincronizar_conversaciones.py ~/.local/share/rhf-sincronizar/
```

**3. El token, sin mostrarlo.** Cambiar `NOMBRE` por la variable del paso 1:

```bash
mkdir -p ~/.config/rhf-sincronizar && ( umask 077 && \
  sed -n 's/^NOMBRE=/RHF_CONVERSACIONES_TOKEN=/p' ~/.hermes/profiles/atencion/.env \
  > ~/.config/rhf-sincronizar/token.env ) && \
  test -s ~/.config/rhf-sincronizar/token.env && echo "token listo (no se muestra)"
```

**4. Simular.** Lee y cuenta, no manda nada ni guarda el cursor:

```bash
python3 ~/.local/share/rhf-sincronizar/sincronizar_conversaciones.py \
  --base ~/.hermes/profiles/atencion/state.db --simular --desde 2026-10-08
```

**5. La primera corrida, de verdad.** Con la fecha que elija Rafael:

```bash
set -a; . ~/.config/rhf-sincronizar/token.env; set +a
python3 ~/.local/share/rhf-sincronizar/sincronizar_conversaciones.py \
  --base ~/.hermes/profiles/atencion/state.db --desde 2026-10-08
```

Responde algo como `{"ok": true, "mensajes": 120, "conversaciones": 14, …}`.
En el CRM, «Chats» muestra las conversaciones y «Sincronizado con el servidor
del agente hace un momento».

**6. Dejarlo corriendo cada minuto.**

```bash
mkdir -p ~/.config/systemd/user
cp rhf-sincronizar.service rhf-sincronizar.timer ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user enable --now rhf-sincronizar.timer
systemctl --user list-timers rhf-sincronizar.timer
```

**7. Que siga corriendo sin una sesión abierta.**

```bash
loginctl show-user "$USER" -p Linger      # si dice Linger=no:
sudo loginctl enable-linger "$USER"       # cambio del sistema: con el OK de Rafael
```

**8. Verificar.**

```bash
journalctl --user -u rhf-sincronizar -n 20 --no-pager   # solo conteos
```

## Vuelta atrás

```bash
systemctl --user disable --now rhf-sincronizar.timer
```

Con eso se detiene. El agente nunca se tocó, así que no hay nada que
restaurar del lado de Hermes. Los archivos del sincronizador
(`~/.local/share/rhf-sincronizar/`, `~/.config/rhf-sincronizar/`,
`~/.local/state/rhf-sincronizar/` y las dos unidades) se mueven a una carpeta
de respaldo; se borran solo si Rafael lo pide. Lo que ya llegó al CRM queda
ahí: borrarlo también es una decisión suya.
