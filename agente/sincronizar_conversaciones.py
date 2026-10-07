#!/usr/bin/env python3
"""
Sincroniza las conversaciones del agente de atención con el CRM de
rhfliving.com (7-oct-2026, pedido de Rafael: «que se pueda ver qué conversó la
IA con el chat», todas).

El agente corre en el servidor de Clouding (Hermes, perfil «atencion») y
guarda cada conversación en su base local (state.db, SQLite). Este programa
corre al lado, cada minuto (agente/rhf-sincronizar.timer):

  1. abre esa base en SOLO LECTURA (nunca escribe en ella ni toca al agente);
  2. lee los mensajes nuevos desde la última vez (un cursor en su propio
     archivo de estado);
  3. se queda con lo que una persona ve: lo que escribió la persona y lo que
     respondió el agente. Descarta las herramientas, los resúmenes de
     contexto y los andamiajes internos de Hermes;
  4. los manda en lotes a POST /api/conversaciones-agente, con el mismo token
     del agente. El Worker los guarda en D1 y el CRM los muestra.

Cada mensaje lleva su id de Hermes y el Worker lo guarda una sola vez: repetir
un lote no duplica nada. Si el envío falla, el cursor no avanza y el próximo
minuto se reintenta.

Privacidad: en la salida y en los registros solo hay conteos. Nunca imprime el
texto de un mensaje, un número de teléfono ni el token.

Uso:
  sincronizar_conversaciones.py --simular                 # cuenta, no manda nada
  sincronizar_conversaciones.py --desde 2026-10-08        # la primera vez: desde esa fecha
  sincronizar_conversaciones.py --desde todo              # la primera vez: todo el historial
  sincronizar_conversaciones.py                           # las siguientes (el timer)

Solo usa la biblioteca estándar de Python (3.8 o más nuevo).
"""

from __future__ import annotations

import argparse
import fcntl
import json
import os
import sqlite3
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple

VERSION = "1.0"
URL_POR_DEFECTO = "https://rhfliving.com/api/conversaciones-agente"
BASE_POR_DEFECTO = "~/.hermes/profiles/atencion/state.db"
ESTADO_POR_DEFECTO = "~/.local/state/rhf-sincronizar/estado.json"
# El token es el mismo con el que el agente avisa las llamadas pedidas
# (/api/solicitud-agente). Se busca en este orden; nunca se imprime.
VARIABLES_TOKEN = ("RHF_CONVERSACIONES_TOKEN", "RHF_SOLICITUDES_TOKEN", "RHF_AGENTE_TOKEN", "AGENTE_TOKEN")
# Solo los canales donde escriben personas de afuera: ni la terminal ni las
# tareas programadas del agente.
FUENTES_POR_DEFECTO = ("whatsapp_cloud", "whatsapp", "webchat", "api_server")

# Los topes del Worker (crm/src/conversaciones.ts, LIMITES_CONVERSACIONES),
# con margen: un lote nunca los pasa.
MAX_CONVERSACIONES = 50
MAX_MENSAJES = 400
MAX_TEXTO = 4000
MAX_CUERPO = 450 * 1024
FILAS_POR_LECTURA = 500
MAX_LOTES_POR_CORRIDA = 20
LATIDO_SEGUNDOS = 5 * 60

# Lo que Hermes agrega a los mensajes y que una persona nunca escribió
# (hermes-agent: agent/context_compressor.py y agent/skill_commands.py).
PREFIJO_JSON = "\x00json:"
PREFIJOS_RESUMEN = ("[CONTEXT COMPACTION", "[CONTEXT SUMMARY]:")
FIN_RESUMEN = "--- END OF CONTEXT SUMMARY"
PREFIJO_INVOCACION = "[IMPORTANT: The user has invoked the "
INSTRUCCION_INVOCACION = "The user has provided the following instruction alongside the skill invocation: "
PREFIJO_AUTOCARGA = '[IMPORTANT: The "'
FIN_AUTOCARGA = "then run them with the terminal tool using the absolute path."
NOTA_DE_EJECUCION = "\n\n[Runtime note:"


class ErrorDeConfiguracion(Exception):
    """Falta algo para arrancar: se corrige a mano, no se reintenta."""


class ErrorDeEnvio(Exception):
    """El Worker no recibió el lote: se reintenta el próximo minuto."""


# ── El texto de cada mensaje ────────────────────────────────────────────────


def texto_de_partes(partes: Any) -> str:
    """El texto de un contenido multimedia (lista de partes al estilo OpenAI)."""
    if isinstance(partes, str):
        return partes
    if isinstance(partes, dict):
        partes = [partes]
    if not isinstance(partes, list):
        return ""
    salida: List[str] = []
    for p in partes:
        if isinstance(p, str):
            salida.append(p)
        elif isinstance(p, dict):
            tipo = str(p.get("type", ""))
            if tipo in ("text", "input_text", "output_text") and isinstance(p.get("text"), str):
                salida.append(p["text"])
            elif "image" in tipo:
                salida.append("[imagen]")
            elif "audio" in tipo:
                salida.append("[audio]")
            elif tipo in ("file", "input_file", "document"):
                salida.append("[archivo]")
    return "\n".join(s for s in salida if s)


def decodificar(contenido: Any) -> str:
    """El contenido de la columna `content`, como texto."""
    if contenido is None:
        return ""
    if isinstance(contenido, bytes):
        contenido = contenido.decode("utf-8", "replace")
    if not isinstance(contenido, str):
        return str(contenido)
    if contenido.startswith(PREFIJO_JSON):
        try:
            return texto_de_partes(json.loads(contenido[len(PREFIJO_JSON):]))
        except ValueError:
            return ""
    s = contenido.lstrip()
    if s.startswith('[{"') or s.startswith('{"type"'):
        try:
            return texto_de_partes(json.loads(s))
        except ValueError:
            pass
    return contenido


def limpiar_de_persona(texto: str) -> str:
    """Lo que escribió la persona, sin lo que Hermes le agrega antes o después."""
    t = texto
    if t.lstrip().startswith(PREFIJOS_RESUMEN):
        # Un resumen de contexto. A veces trae al final el mensaje real.
        i = t.find(FIN_RESUMEN)
        if i < 0:
            return ""
        j = t.find("\n", i)
        t = t[j + 1:] if j >= 0 else ""
    if t.startswith(PREFIJO_INVOCACION):
        i = t.find(INSTRUCCION_INVOCACION)
        t = t[i + len(INSTRUCCION_INVOCACION):] if i >= 0 else ""
    elif t.startswith(PREFIJO_AUTOCARGA) and "skill is auto-loaded" in t[:300]:
        i = t.rfind(FIN_AUTOCARGA)
        if i >= 0:
            t = t[i + len(FIN_AUTOCARGA):]
        else:
            # Sin la nota final, el texto de la persona es el último párrafo.
            t = t.rsplit("\n\n", 1)[-1] if "\n\n" in t else ""
    k = t.find(NOTA_DE_EJECUCION)
    if k >= 0:
        t = t[:k]
    return t.strip()


def es_solo_para_el_modelo(fila: Dict[str, Any]) -> bool:
    """Filas que Hermes nunca muestra: andamiaje oculto, resúmenes, solo para el modelo."""
    if (fila.get("display_kind") or "") == "hidden":
        return True
    if fila.get("_compressed_summary") in (1, "1", True):
        return True
    meta = fila.get("display_metadata")
    if isinstance(meta, str) and meta.startswith("{"):
        try:
            m = json.loads(meta)
            if isinstance(m, dict) and m.get("model_only"):
                return True
        except ValueError:
            pass
    return False


def mensaje_de(fila: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """El mensaje para el CRM, o None si no es algo que una persona ve."""
    rol = fila.get("role")
    if rol not in ("user", "assistant"):
        return None
    if es_solo_para_el_modelo(fila):
        return None
    texto = decodificar(fila.get("content"))
    texto = limpiar_de_persona(texto) if rol == "user" else texto.strip()
    if not texto:
        # Un turno del agente que solo llamó herramientas no tiene texto.
        return None
    try:
        en = float(fila["timestamp"])
    except (TypeError, ValueError, KeyError):
        return None
    return {
        "id": str(fila["id"]),
        "rol": "persona" if rol == "user" else "agente",
        "texto": texto[:MAX_TEXTO],
        "en": en,
    }


# ── La base del agente (solo lectura) ───────────────────────────────────────


def abrir_base(ruta: str) -> sqlite3.Connection:
    p = Path(ruta).expanduser()
    if not p.is_file():
        raise ErrorDeConfiguracion(f"no existe la base del agente: {p}")
    con = sqlite3.connect(f"file:{p}?mode=ro", uri=True, timeout=10)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA query_only = ON")
    return con


def columnas(con: sqlite3.Connection, tabla: str) -> set:
    return {r["name"] for r in con.execute(f"PRAGMA table_info({tabla})")}


def consulta_de_mensajes(con: sqlite3.Connection) -> str:
    """El SELECT, con las columnas opcionales que tenga esta versión de Hermes."""
    cm = columnas(con, "messages")
    cs = columnas(con, "sessions")
    faltan = {"id", "session_id", "role", "content", "timestamp"} - cm
    if faltan or not {"id", "source"} <= cs:
        raise ErrorDeConfiguracion("la base no tiene el formato de Hermes (faltan columnas en messages o sessions)")
    extra_m = [c for c in ("display_kind", "display_metadata", "_compressed_summary") if c in cm]
    extra_s = [c for c in ("user_id", "started_at") if c in cs]
    campos = ["m.id", "m.session_id", "m.role", "m.content", "m.timestamp"]
    campos += [f"m.{c}" for c in extra_m]
    campos += ["s.source"] + [f"s.{c}" for c in extra_s]
    return (
        f"SELECT {', '.join(campos)} FROM messages m JOIN sessions s ON s.id = m.session_id "
        "WHERE m.id > ? ORDER BY m.id LIMIT ?"
    )


def cursor_desde(con: sqlite3.Connection, desde: str) -> int:
    """El cursor inicial: 0 para todo el historial, o el último mensaje antes de la fecha."""
    if desde == "todo":
        return 0
    try:
        dia = datetime.strptime(desde, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    except ValueError:
        raise ErrorDeConfiguracion("--desde va como AAAA-MM-DD o «todo»")
    # Medianoche en Colombia (UTC-5): un día del calendario de Rafael.
    corte = dia.timestamp() + 5 * 3600
    fila = con.execute("SELECT COALESCE(MAX(id), 0) AS n FROM messages WHERE timestamp < ?", (corte,)).fetchone()
    return int(fila["n"])


# ── El estado del sincronizador ─────────────────────────────────────────────


def leer_estado(ruta: Path) -> Optional[Dict[str, Any]]:
    try:
        return json.loads(ruta.read_text(encoding="utf-8"))
    except FileNotFoundError:
        return None
    except ValueError:
        raise ErrorDeConfiguracion(f"el archivo de estado no se entiende: {ruta} (no se toca; revísalo a mano)")


def guardar_estado(ruta: Path, estado: Dict[str, Any]) -> None:
    ruta.parent.mkdir(parents=True, exist_ok=True)
    tmp = ruta.with_suffix(".tmp")
    tmp.write_text(json.dumps(estado, indent=1), encoding="utf-8")
    os.chmod(tmp, 0o600)
    tmp.replace(ruta)


# ── Los lotes ───────────────────────────────────────────────────────────────


class Lote:
    def __init__(self) -> None:
        self.conversaciones: Dict[str, Dict[str, Any]] = {}
        self.mensajes = 0
        self.bytes = 40

    def vacio(self) -> bool:
        return self.mensajes == 0

    def cabe(self, sesion: str, m: Dict[str, Any]) -> bool:
        nueva = sesion not in self.conversaciones
        if nueva and len(self.conversaciones) >= MAX_CONVERSACIONES:
            return False
        if self.mensajes + 1 > MAX_MENSAJES:
            return False
        return self.bytes + len(json.dumps(m, ensure_ascii=False).encode("utf-8")) + (400 if nueva else 0) <= MAX_CUERPO

    def agregar(self, fila: Dict[str, Any], m: Dict[str, Any]) -> None:
        sesion = str(fila["session_id"])
        c = self.conversaciones.get(sesion)
        if c is None:
            c = {
                "sesion": sesion,
                "canal": fila.get("source") or "desconocido",
                "usuario": fila.get("user_id"),
                "iniciada": fila.get("started_at"),
                "mensajes": [],
            }
            self.conversaciones[sesion] = c
            self.bytes += 400
        c["mensajes"].append(m)
        self.mensajes += 1
        self.bytes += len(json.dumps(m, ensure_ascii=False).encode("utf-8"))

    def cuerpo(self) -> bytes:
        return json.dumps({"conversaciones": list(self.conversaciones.values())}, ensure_ascii=False).encode("utf-8")


def enviar(url: str, token: str, cuerpo: bytes, intentos: int = 3) -> Dict[str, Any]:
    ultimo = ""
    for n in range(intentos):
        req = urllib.request.Request(
            url,
            data=cuerpo,
            method="POST",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
                "User-Agent": f"rhf-sincronizar/{VERSION}",
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=25) as r:
                return json.loads(r.read().decode("utf-8") or "{}")
        except urllib.error.HTTPError as e:
            # El Worker responde solo un código de error, sin datos.
            try:
                codigo = json.loads(e.read().decode("utf-8") or "{}").get("error", "")
            except ValueError:
                codigo = ""
            ultimo = f"HTTP {e.code} {codigo}".strip()
            if e.code in (400, 401, 403, 413, 422):
                break  # no se arregla reintentando
        except (urllib.error.URLError, TimeoutError, OSError) as e:
            ultimo = f"red: {type(e).__name__}"
        time.sleep(2 * (n + 1))
    raise ErrorDeEnvio(ultimo or "sin respuesta")


# ── La corrida ──────────────────────────────────────────────────────────────


def filas_nuevas(con: sqlite3.Connection, sql: str, cursor: int) -> List[Dict[str, Any]]:
    return [dict(r) for r in con.execute(sql, (cursor, FILAS_POR_LECTURA))]


def corrida(args: argparse.Namespace, token: Optional[str]) -> Dict[str, Any]:
    ruta_estado = Path(args.estado).expanduser()
    con = abrir_base(args.base)
    try:
        sql = consulta_de_mensajes(con)
        estado = leer_estado(ruta_estado)
        if estado is None:
            if not args.desde:
                raise ErrorDeConfiguracion(
                    "primera corrida: hay que elegir desde cuándo sincronizar con --desde AAAA-MM-DD o --desde todo"
                )
            estado = {"cursor": cursor_desde(con, args.desde), "desde": args.desde, "ultimo_envio": 0}
        cursor = int(estado.get("cursor", 0))
        fuentes = set(args.fuentes.split(",")) if args.fuentes else set(FUENTES_POR_DEFECTO)
        resumen = {"leidas": 0, "mensajes": 0, "conversaciones": 0, "lotes": 0, "latido": False, "cursor": cursor}

        lotes = 0
        vueltas = 0
        while lotes < MAX_LOTES_POR_CORRIDA and vueltas < 200:
            vueltas += 1
            filas = filas_nuevas(con, sql, cursor)
            if not filas:
                break
            lote = Lote()
            hasta = cursor
            for fila in filas:
                m = mensaje_de(fila) if fila.get("source") in fuentes else None
                if m is not None:
                    if not lote.cabe(str(fila["session_id"]), m):
                        break
                    lote.agregar(fila, m)
                hasta = int(fila["id"])
                resumen["leidas"] += 1
            if not lote.vacio():
                if args.simular:
                    pass
                else:
                    enviar(args.url, token or "", lote.cuerpo())
                    estado["ultimo_envio"] = time.time()
                lotes += 1
                resumen["lotes"] += 1
                resumen["mensajes"] += lote.mensajes
                resumen["conversaciones"] += len(lote.conversaciones)
            cursor = hasta
            estado["cursor"] = cursor
            if not args.simular:
                guardar_estado(ruta_estado, estado)
            if len(filas) < FILAS_POR_LECTURA and lote.vacio():
                break

        # El latido: sin mensajes nuevos, igual se avisa cada 5 minutos que
        # el sincronizador está vivo (el CRM lo muestra en «Chats»).
        if not args.simular and resumen["lotes"] == 0 and time.time() - float(estado.get("ultimo_envio", 0)) >= LATIDO_SEGUNDOS:
            enviar(args.url, token or "", b'{"conversaciones":[]}')
            estado["ultimo_envio"] = time.time()
            guardar_estado(ruta_estado, estado)
            resumen["latido"] = True
        resumen["cursor"] = cursor
        return resumen
    finally:
        con.close()


def token_del_entorno() -> Optional[str]:
    for v in VARIABLES_TOKEN:
        t = (os.environ.get(v) or "").strip()
        if t:
            return t
    return None


def principal(argv: Optional[Iterable[str]] = None) -> int:
    p = argparse.ArgumentParser(description="Sincroniza las conversaciones del agente con el CRM.")
    p.add_argument("--base", default=os.environ.get("RHF_HERMES_DB", BASE_POR_DEFECTO), help="la state.db del perfil atencion")
    p.add_argument("--estado", default=os.environ.get("RHF_SINCRONIZAR_ESTADO", ESTADO_POR_DEFECTO))
    p.add_argument("--url", default=os.environ.get("RHF_CONVERSACIONES_URL", URL_POR_DEFECTO))
    p.add_argument("--fuentes", default=os.environ.get("RHF_FUENTES", ""), help="canales separados por comas")
    p.add_argument("--desde", help="solo la primera vez: AAAA-MM-DD o «todo»")
    p.add_argument("--simular", action="store_true", help="lee y cuenta, sin mandar ni mover el cursor")
    args = p.parse_args(list(argv) if argv is not None else None)

    token = token_del_entorno()
    if not args.simular and not token:
        print(f"falta el token: ninguna de {', '.join(VARIABLES_TOKEN)} está definida", file=sys.stderr)
        return 2
    if not args.url.startswith("https://") and not args.url.startswith("http://127.0.0.1"):
        print("la URL tiene que ser https", file=sys.stderr)
        return 2

    ruta_estado = Path(args.estado).expanduser()
    ruta_estado.parent.mkdir(parents=True, exist_ok=True)
    with open(ruta_estado.with_suffix(".lock"), "w") as candado:
        try:
            fcntl.flock(candado, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            return 0  # ya hay otra corrida en marcha
        try:
            r = corrida(args, token)
        except ErrorDeConfiguracion as e:
            print(f"configuración: {e}", file=sys.stderr)
            return 2
        except ErrorDeEnvio as e:
            print(f"no se pudo enviar: {e}; se reintenta en la próxima corrida", file=sys.stderr)
            return 1
        except sqlite3.Error as e:
            print(f"base del agente: {type(e).__name__}", file=sys.stderr)
            return 1
    # Solo conteos: nunca texto, teléfonos ni el token.
    print(json.dumps({"ok": True, "simulacion": bool(args.simular), **r}))
    return 0


if __name__ == "__main__":
    sys.exit(principal())
