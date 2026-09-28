#!/usr/bin/env python3
"""Hace que cada bloque de reduced-motion del CSS obedezca también la elección
del visitante (el control «Animaciones» del pie, src/lib/motion.ts).

Antes:
  @media (prefers-reduced-motion: reduce) { .x { ... } }
Después:
  @media (prefers-reduced-motion: reduce) { :root:not([data-mov="activo"]) .x { ... } }
  :root[data-mov="reducido"] .x { ... }

El bloque inverso (no-preference) sale con los papeles cambiados, y `html`
pasa a ser la raíz misma. Es idempotente: un bloque que ya nombra `data-mov`
no se toca. Sirve para bloques con reglas simples; si encuentra una regla
anidada (@keyframes, @media dentro del bloque) se detiene y avisa.

Uso, desde la raíz del repo, cada vez que se agregue un bloque de
reduced-motion:
  python3 scripts/movimiento-css.py $(grep -rl "prefers-reduced-motion" src --include=*.css)
"""
import re, sys

MARCA = "/* movimiento: sistema o preferencia (src/lib/motion.ts) */"

def cerrar(s, i):
    """Índice justo después de la llave que cierra la que abre en s[i-1]."""
    depth = 1
    while depth:
        c = s[i]
        if c == "{": depth += 1
        elif c == "}": depth -= 1
        elif c == "/" and s[i+1] == "*":
            i = s.index("*/", i) + 1
        i += 1
    return i

def partir_selectores(sel):
    out, depth, cur = [], 0, ""
    for c in sel:
        if c in "([": depth += 1
        elif c in ")]": depth -= 1
        if c == "," and depth == 0:
            out.append(cur); cur = ""
        else:
            cur += c
    out.append(cur)
    return [x.strip() for x in out if x.strip()]

def prefijar(sel, raiz):
    if re.match(r"html(?![\w-])", sel):
        return raiz + sel[4:]
    return f"{raiz} {sel}"

def reglas(cuerpo, raiz, sangria):
    """Reescribe cada regla `selectores { decl }` del cuerpo con la raíz delante."""
    out, i = [], 0
    while i < len(cuerpo):
        m = re.compile(r"\s*(/\*.*?\*/)?\s*", re.S).match(cuerpo, i)
        if m.group(1):
            out.append(sangria + m.group(1)); i = m.end(); continue
        i = m.end()
        if i >= len(cuerpo): break
        a = cuerpo.index("{", i)
        sel = cuerpo[i:a]
        if sel.strip().startswith("@"):
            raise SystemExit(f"regla anidada no prevista: {sel.strip()}")
        b = cerrar(cuerpo, a + 1)
        decl = cuerpo[a+1:b-1].strip()
        sels = partir_selectores(" ".join(sel.split()))
        partes = [prefijar(x, raiz) for x in sels]
        nuevo = ", ".join(partes)
        if len(nuevo) > 96:
            nuevo = (",\n" + sangria).join(partes)
        out.append(f"{sangria}{nuevo} {{ {decl} }}" if "\n" not in decl else f"{sangria}{nuevo} {{\n{sangria}  " + "\n".join(l.strip() for l in decl.splitlines()).replace("\n", f"\n{sangria}  ") + f"\n{sangria}}}")
        i = b
    return "\n".join(out)

def transformar(s):
    patron = re.compile(r"@media\s*\(prefers-reduced-motion:\s*(reduce|no-preference)\)\s*\{")
    pos, res, cambios = 0, [], 0
    while True:
        m = patron.search(s, pos)
        if not m:
            res.append(s[pos:]); break
        fin = cerrar(s, m.end())
        cuerpo = s[m.end():fin-1]
        if "data-mov" in cuerpo:  # ya transformado
            res.append(s[pos:fin]); pos = fin; continue
        # sangría de la línea del @media
        ini_linea = s.rfind("\n", 0, m.start()) + 1
        base = s[ini_linea:m.start()]
        tipo = m.group(1)
        if tipo == "reduce":
            auto, forzado = ':root:not([data-mov="activo"])', ':root[data-mov="reducido"]'
        else:
            auto, forzado = ':root:not([data-mov="reducido"])', ':root[data-mov="activo"]'
        bloque = (
            f"{MARCA}\n{base}@media (prefers-reduced-motion: {tipo}) {{\n"
            + reglas(cuerpo, auto, base + "  ")
            + f"\n{base}}}\n"
            + reglas(cuerpo, forzado, base)
        )
        res.append(s[pos:m.start()]); res.append(bloque)
        pos = fin; cambios += 1
    return "".join(res), cambios

if __name__ == "__main__":
    total = 0
    for f in sys.argv[1:]:
        s = open(f, encoding="utf-8").read()
        t, n = transformar(s)
        if n:
            open(f, "w", encoding="utf-8").write(t)
        print(f"{f}: {n} bloque(s)")
        total += n
    print("total", total)
