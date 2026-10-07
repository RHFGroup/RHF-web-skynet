"""
Pruebas del sincronizador (7-oct-2026), con una state.db de mentira que imita
la de Hermes y un Worker de mentira en 127.0.0.1. No toca el servidor del
agente ni internet.

    python3 -m unittest agente/test_sincronizar_conversaciones.py -v
"""

import io
import json
import os
import sqlite3
import sys
import tempfile
import threading
import time
import unittest
from contextlib import redirect_stderr, redirect_stdout
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import sincronizar_conversaciones as s  # noqa: E402

TOKEN = "token-de-prueba-0123456789"


class Worker(BaseHTTPRequestHandler):
    """Guarda lo que recibe y responde como el Worker."""

    recibidos: list = []
    responder = 200

    def do_POST(self):  # noqa: N802
        largo = int(self.headers.get("Content-Length", "0"))
        cuerpo = json.loads(self.rfile.read(largo) or b"{}")
        if self.headers.get("Authorization") != f"Bearer {TOKEN}":
            self._json(401, {"ok": False, "error": "no_autorizado"})
            return
        if Worker.responder != 200:
            self._json(Worker.responder, {"ok": False, "error": "fallo_al_guardar"})
            return
        Worker.recibidos.append(cuerpo)
        n = sum(len(c["mensajes"]) for c in cuerpo["conversaciones"])
        self._json(200, {"ok": True, "conversaciones": len(cuerpo["conversaciones"]), "mensajes": n})

    def _json(self, codigo, datos):
        b = json.dumps(datos).encode()
        self.send_response(codigo)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(b)))
        self.end_headers()
        self.wfile.write(b)

    def log_message(self, *a):  # silencio
        pass


def crear_base(ruta: Path) -> sqlite3.Connection:
    con = sqlite3.connect(ruta)
    con.executescript(
        """
        PRAGMA journal_mode = WAL;
        CREATE TABLE sessions (id TEXT PRIMARY KEY, source TEXT NOT NULL, user_id TEXT, started_at REAL NOT NULL);
        CREATE TABLE messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT, session_id TEXT NOT NULL, role TEXT NOT NULL, content TEXT,
          tool_calls TEXT, timestamp REAL NOT NULL, display_kind TEXT, display_metadata TEXT,
          _compressed_summary INTEGER NOT NULL DEFAULT 0, active INTEGER NOT NULL DEFAULT 1);
        """
    )
    return con


def dia(texto: str) -> float:
    """Una hora de Colombia como segundos (UTC-5)."""
    return time.mktime(time.strptime(texto, "%Y-%m-%d %H:%M")) - time.timezone + 5 * 3600


class PruebasDelTexto(unittest.TestCase):
    def test_resumen_de_contexto_no_es_de_la_persona(self):
        self.assertEqual(s.limpiar_de_persona("[CONTEXT SUMMARY]: hablamos de Doral"), "")
        t = "[CONTEXT COMPACTION — REFERENCE ONLY] bla\n--- END OF CONTEXT SUMMARY — respond to the message below, not the summary above ---\n¿Y el precio?"
        self.assertEqual(s.limpiar_de_persona(t), "¿Y el precio?")

    def test_autocarga_de_skill_deja_solo_lo_que_escribio(self):
        t = '[IMPORTANT: The "atencion" skill is auto-loaded. Follow its instructions for this session.]\nCuerpo de la skill...\nthen run them with the terminal tool using the absolute path.\n\nHola, ¿tienen apartamentos?'
        self.assertEqual(s.limpiar_de_persona(t), "Hola, ¿tienen apartamentos?")

    def test_nota_de_ejecucion_se_quita(self):
        self.assertEqual(s.limpiar_de_persona("Quiero ver Doral West\n\n[Runtime note: algo interno]"), "Quiero ver Doral West")

    def test_contenido_multimedia(self):
        c = s.PREFIJO_JSON + json.dumps([{"type": "text", "text": "Mira esta foto"}, {"type": "image_url", "image_url": {"url": "x"}}])
        self.assertEqual(s.decodificar(c), "Mira esta foto\n[imagen]")

    def test_filas_que_no_se_ven(self):
        base = {"id": 1, "role": "assistant", "content": "hola", "timestamp": 1.0}
        self.assertIsNone(s.mensaje_de({**base, "display_kind": "hidden"}))
        self.assertIsNone(s.mensaje_de({**base, "display_metadata": '{"model_only": 1}'}))
        self.assertIsNone(s.mensaje_de({**base, "_compressed_summary": 1}))
        self.assertIsNone(s.mensaje_de({**base, "role": "tool"}))
        self.assertIsNone(s.mensaje_de({**base, "content": ""}))  # solo llamó herramientas
        self.assertEqual(s.mensaje_de(base)["rol"], "agente")


class PruebasDeLaCorrida(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.servidor = HTTPServer(("127.0.0.1", 0), Worker)
        cls.url = f"http://127.0.0.1:{cls.servidor.server_port}/api/conversaciones-agente"
        threading.Thread(target=cls.servidor.serve_forever, daemon=True).start()

    @classmethod
    def tearDownClass(cls):
        cls.servidor.shutdown()

    def setUp(self):
        Worker.recibidos = []
        Worker.responder = 200
        self.dir = tempfile.TemporaryDirectory()
        d = Path(self.dir.name)
        self.base = d / "state.db"
        self.estado = d / "estado" / "estado.json"
        self.con = crear_base(self.base)
        self.con.executemany(
            "INSERT INTO sessions (id, source, user_id, started_at) VALUES (?, ?, ?, ?)",
            [
                ("20261006_120000_aaaa", "whatsapp_cloud", "573001234567", dia("2026-10-06 12:00")),
                ("20261008_090000_bbbb", "webchat", "visitante-7f3", dia("2026-10-08 09:00")),
                ("20261008_100000_cccc", "cli", "jota", dia("2026-10-08 10:00")),
            ],
        )
        filas = [
            ("20261006_120000_aaaa", "user", "Hola, info de Doral West", dia("2026-10-06 12:00")),
            ("20261006_120000_aaaa", "assistant", "", dia("2026-10-06 12:00")),  # solo herramientas
            ("20261006_120000_aaaa", "tool", '{"ok": true}', dia("2026-10-06 12:00")),
            ("20261006_120000_aaaa", "assistant", "¡Hola! Doral West está en construcción.", dia("2026-10-06 12:01")),
            ("20261008_090000_bbbb", "user", "¿Cuánto vale un apartamento?", dia("2026-10-08 09:00")),
            ("20261008_090000_bbbb", "assistant", "Te cuento los rangos de la cartera.", dia("2026-10-08 09:01")),
            ("20261008_100000_cccc", "user", "prueba interna desde la terminal", dia("2026-10-08 10:00")),
        ]
        self.con.executemany("INSERT INTO messages (session_id, role, content, timestamp) VALUES (?, ?, ?, ?)", filas)
        self.con.commit()

    def tearDown(self):
        self.con.close()
        self.dir.cleanup()

    def correr(self, *extra, entorno=None):
        os.environ.pop("RHF_SOLICITUDES_TOKEN", None)
        os.environ.update(entorno if entorno is not None else {"RHF_SOLICITUDES_TOKEN": TOKEN})
        salida, errores = io.StringIO(), io.StringIO()
        with redirect_stdout(salida), redirect_stderr(errores):
            codigo = s.principal(["--base", str(self.base), "--estado", str(self.estado), "--url", self.url, *extra])
        return codigo, salida.getvalue(), errores.getvalue()

    def todos_los_mensajes(self):
        return [m for lote in Worker.recibidos for c in lote["conversaciones"] for m in c["mensajes"]]

    def test_la_primera_vez_pide_elegir_desde_cuando(self):
        codigo, _, err = self.correr()
        self.assertEqual(codigo, 2)
        self.assertIn("--desde", err)
        self.assertEqual(Worker.recibidos, [])

    def test_todo_el_historial_sin_herramientas_ni_terminal(self):
        codigo, out, _ = self.correr("--desde", "todo")
        self.assertEqual(codigo, 0, out)
        ms = self.todos_los_mensajes()
        self.assertEqual([m["rol"] for m in ms], ["persona", "agente", "persona", "agente"])
        canales = {c["canal"] for lote in Worker.recibidos for c in lote["conversaciones"]}
        self.assertEqual(canales, {"whatsapp_cloud", "webchat"})
        wa = next(c for lote in Worker.recibidos for c in lote["conversaciones"] if c["canal"] == "whatsapp_cloud")
        self.assertEqual(wa["usuario"], "573001234567")
        self.assertEqual(json.loads(self.estado.read_text())["cursor"], 7)

    def test_desde_una_fecha_deja_afuera_lo_anterior(self):
        self.correr("--desde", "2026-10-07")
        textos = [m["texto"] for m in self.todos_los_mensajes()]
        self.assertEqual(textos, ["¿Cuánto vale un apartamento?", "Te cuento los rangos de la cartera."])

    def test_la_segunda_corrida_solo_manda_lo_nuevo(self):
        self.correr("--desde", "todo")
        Worker.recibidos = []
        self.con.execute(
            "INSERT INTO messages (session_id, role, content, timestamp) VALUES (?, ?, ?, ?)",
            ("20261008_090000_bbbb", "user", "Gracias", dia("2026-10-08 09:05")),
        )
        self.con.commit()
        codigo, _, _ = self.correr()
        self.assertEqual(codigo, 0)
        self.assertEqual([m["texto"] for m in self.todos_los_mensajes()], ["Gracias"])

    def test_si_el_worker_falla_el_cursor_no_avanza(self):
        Worker.responder = 500
        codigo, _, err = self.correr("--desde", "todo")
        self.assertEqual(codigo, 1)
        self.assertIn("HTTP 500", err)
        # No quedó estado: la próxima corrida empieza igual.
        self.assertFalse(self.estado.exists() and json.loads(self.estado.read_text()).get("cursor", 0) > 0)

    def test_token_equivocado(self):
        codigo, _, err = self.correr("--desde", "todo", entorno={"RHF_SOLICITUDES_TOKEN": "otro"})
        self.assertEqual(codigo, 1)
        self.assertIn("401", err)

    def test_sin_token_no_arranca(self):
        codigo, _, err = self.correr("--desde", "todo", entorno={})
        self.assertEqual(codigo, 2)
        self.assertIn("falta el token", err)

    def test_simular_no_manda_ni_guarda(self):
        codigo, out, _ = self.correr("--desde", "todo", "--simular", entorno={})
        self.assertEqual(codigo, 0)
        r = json.loads(out)
        self.assertEqual(r["mensajes"], 4)
        self.assertEqual(Worker.recibidos, [])
        self.assertFalse(self.estado.exists())

    def test_la_salida_no_trae_textos_ni_telefonos(self):
        codigo, out, err = self.correr("--desde", "todo")
        self.assertEqual(codigo, 0)
        for dato in ("573001234567", "Doral", "apartamento", TOKEN):
            self.assertNotIn(dato, out + err)

    def test_latido_sin_mensajes_nuevos(self):
        self.correr("--desde", "todo")
        Worker.recibidos = []
        # Hace más de 5 minutos del último envío.
        e = json.loads(self.estado.read_text())
        e["ultimo_envio"] = time.time() - 6 * 60
        self.estado.write_text(json.dumps(e))
        codigo, out, _ = self.correr()
        self.assertEqual(codigo, 0)
        self.assertTrue(json.loads(out)["latido"])
        self.assertEqual(Worker.recibidos, [{"conversaciones": []}])
        # Y al minuto siguiente no repite.
        Worker.recibidos = []
        self.correr()
        self.assertEqual(Worker.recibidos, [])

    def test_lotes_grandes_se_parten(self):
        self.con.executemany(
            "INSERT INTO sessions (id, source, user_id, started_at) VALUES (?, 'webchat', ?, ?)",
            [(f"sesion_{i:03d}", f"v{i}", dia("2026-10-08 11:00")) for i in range(120)],
        )
        self.con.executemany(
            "INSERT INTO messages (session_id, role, content, timestamp) VALUES (?, 'user', ?, ?)",
            [(f"sesion_{i:03d}", f"mensaje {i}", dia("2026-10-08 11:00")) for i in range(120)],
        )
        self.con.commit()
        codigo, _, _ = self.correr("--desde", "todo")
        self.assertEqual(codigo, 0)
        self.assertTrue(all(len(lote["conversaciones"]) <= s.MAX_CONVERSACIONES for lote in Worker.recibidos))
        self.assertEqual(len(self.todos_los_mensajes()), 124)

    def test_nunca_escribe_en_la_base_del_agente(self):
        antes = self.base.stat().st_mtime_ns, self.base.stat().st_size
        self.correr("--desde", "todo")
        self.assertEqual((self.base.stat().st_mtime_ns, self.base.stat().st_size), antes)
        con = s.abrir_base(str(self.base))
        with self.assertRaises(sqlite3.OperationalError):
            con.execute("DELETE FROM messages")
        con.close()


if __name__ == "__main__":
    unittest.main()
