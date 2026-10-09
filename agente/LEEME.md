# El sincronizador de conversaciones del agente

**Qué es.** Un programa chico que corre en el servidor del agente de atención
(Clouding, Hermes, perfil `atencion`) y manda al CRM, cada minuto, lo que la IA
conversó por WhatsApp y por el chat de la web. Así el CRM muestra los chats en
«Chats» y en la ficha de cada persona (pedido de Rafael, 7-oct-2026: «que se
pueda ver qué conversó la IA con el chat», todas).

**Estado: instalado el 9-oct-2026**, con el OK de Rafael, trayendo lo
conversado desde el 8-oct-2026 (hora de Colombia), el día de la política que
lo informa. La primera corrida mandó 4 conversaciones y 44 mensajes; una
quedó enlazada a su ficha por el teléfono.

## Dónde está, en el servidor de hoy

Hermes corre en Docker (contenedor `hermes-skynet`). Su carpeta de datos es
`/home/jota/hermes-containers/skynet`, que el contenedor ve como `/opt/data`.
**No hay `~/.hermes`.**

| Qué | Dónde |
|---|---|
| La base del perfil `atencion` (solo se lee) | `/home/jota/hermes-containers/skynet/profiles/atencion/state.db` |
| El programa | `/home/jota/.local/share/rhf-sincronizar/sincronizar_conversaciones.py` |
| El token (una línea, permisos 600) | `/home/jota/.config/rhf-sincronizar/token.env` |
| El cursor | `/home/jota/.local/state/rhf-sincronizar/estado.json` |
| Las unidades de systemd | `/etc/systemd/system/rhf-sincronizar.service` y `.timer` |

Las unidades son del sistema, con `User=jota`, el dueño de la carpeta de
Hermes. `jota` no tiene linger, así que una unidad de usuario no correría sin
una sesión abierta.

## Cómo funciona

1. Abre la base del agente en **solo lectura**: no escribe en ella, no
   reinicia nada y no cambia la configuración del agente.
2. Lee los mensajes nuevos desde la última corrida y guarda por dónde va (el
   «cursor») en su propio archivo.
3. Se queda con lo que una persona ve: lo que escribió quien consulta y lo que
   respondió la IA. Descarta las herramientas, los resúmenes de contexto y los
   textos internos de Hermes. Solo toma los canales `whatsapp_cloud`,
   `whatsapp`, `webchat` y `api_server`, ni la terminal ni las tareas
   programadas.
4. Los manda a `POST /api/conversaciones-agente` con el mismo token con el que
   el agente avisa las llamadas pedidas (`RHF_SOLICITUDES_TOKEN` en el `.env`
   del perfil; en el Worker, el secreto `AGENTE_TOKEN`). Cada mensaje lleva su
   id de Hermes y el Worker lo guarda una sola vez: repetir un envío no
   duplica nada.
5. Si el envío falla, el cursor no avanza y se reintenta al minuto siguiente.
6. Sin mensajes nuevos, cada 5 minutos manda un «latido» vacío. Si pasan 30
   minutos sin nada, la página «Chats» del CRM lo avisa en rojo.

**Privacidad.** En la salida y en el registro de systemd solo hay conteos.
Nunca imprime el texto de un mensaje, un teléfono ni el token.

**Las copias.** «Suprimir» y «Eliminar» en el CRM borran la copia del CRM. La
conversación original sigue en el servidor del agente y se borra allá aparte
(en las versiones nuevas de Hermes, `hermes -p atencion sessions delete <id>`;
confirmarlo con `hermes sessions --help` en la versión del servidor).

## Archivos

| Archivo | Qué es |
|---|---|
| `sincronizar_conversaciones.py` | el programa (solo biblioteca estándar de Python 3.8+; el servidor tiene 3.14) |
| `test_sincronizar_conversaciones.py` | 17 pruebas con una base de Hermes y un Worker de mentira |
| `rhf-sincronizar.service` | la unidad de systemd que lo corre, igual a la instalada |
| `rhf-sincronizar.timer` | la que lo dispara cada minuto |

Pruebas: `python3 -m unittest agente/test_sincronizar_conversaciones.py -v`.

## Revisar que está andando

Como root en el servidor (solo estados y conteos):

```bash
systemctl list-timers rhf-sincronizar.timer --no-pager
journalctl -u rhf-sincronizar.service -n 20 --no-pager -o cat
```

Cada corrida deja una línea como
`{"ok": true, "mensajes": 3, "conversaciones": 1, "lotes": 1, …}`. En el CRM,
«Chats» dice «Sincronizado con el servidor del agente hace …».

## Actualizar el programa

Con el OK de Rafael, como root:

```bash
install -o jota -g jota -m 644 sincronizar_conversaciones.py \
  /home/jota/.local/share/rhf-sincronizar/sincronizar_conversaciones.py
systemctl start rhf-sincronizar.service      # una corrida ya, para ver que anda
journalctl -u rhf-sincronizar.service -n 4 --no-pager -o cat
```

El cursor queda donde estaba: no se reenvía nada.

## Instalación desde cero (lo que se hizo el 9-oct-2026)

Como root, con el OK de Rafael. `P` es la carpeta del perfil y `J`, la casa
de `jota`:

```bash
P=/home/jota/hermes-containers/skynet/profiles/atencion
J=/home/jota

# 1. Revisar, solo lectura: la base, Python, y los NOMBRES de las variables
#    con token (nunca los valores).
ls -l $P/state.db*
python3 --version && python3 -c 'import sqlite3; print(sqlite3.sqlite_version)'
grep -o '^[A-Z0-9_]*TOKEN[A-Z0-9_]*=' $P/.env

# 2. El programa y sus carpetas.
install -d -o jota -g jota -m 700 $J/.local/share/rhf-sincronizar $J/.config/rhf-sincronizar $J/.local/state/rhf-sincronizar
install -o jota -g jota -m 644 sincronizar_conversaciones.py $J/.local/share/rhf-sincronizar/

# 3. El token, sin mostrarlo: solo esa línea, con otro nombre, permisos 600.
( umask 077 && sed -n 's/^RHF_SOLICITUDES_TOKEN=/RHF_CONVERSACIONES_TOKEN=/p' $P/.env > $J/.config/rhf-sincronizar/token.env )
chown jota:jota $J/.config/rhf-sincronizar/token.env && chmod 600 $J/.config/rhf-sincronizar/token.env

# 4. Simular (no manda nada ni guarda el cursor) y 5. la primera corrida.
CORRER="set -a; . $J/.config/rhf-sincronizar/token.env; set +a; python3 $J/.local/share/rhf-sincronizar/sincronizar_conversaciones.py --base $P/state.db --estado $J/.local/state/rhf-sincronizar/estado.json"
runuser -u jota -- bash -c "$CORRER --simular --desde 2026-10-08"
runuser -u jota -- bash -c "$CORRER --desde 2026-10-08"

# 6. Cada minuto, con las unidades de esta carpeta.
install -m 644 rhf-sincronizar.service rhf-sincronizar.timer /etc/systemd/system/
systemctl daemon-reload && systemctl enable --now rhf-sincronizar.timer
```

`--desde` es solo para la primera vez: `AAAA-MM-DD` (desde la medianoche de
Colombia de ese día) o `todo`, todo el historial que tenga el agente.

## Vuelta atrás

```bash
systemctl disable --now rhf-sincronizar.timer
```

Con eso se detiene. El agente nunca se tocó, así que no hay nada que
restaurar del lado de Hermes. Los archivos del sincronizador (las tres
carpetas de `jota` y las dos unidades) se mueven a una carpeta de respaldo; se
borran solo si Rafael lo pide. Lo que ya llegó al CRM queda ahí: borrarlo
también es una decisión suya.
