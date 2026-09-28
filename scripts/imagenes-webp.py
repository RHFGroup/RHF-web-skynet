#!/usr/bin/env python3
"""Versiones livianas de las fotos grandes de la home (portada y tarjetas).

Para las fotos que usa la home y que miden 900 px de ancho o más —las de las
tarjetas de la cartera y las de la portada, que el script saca de los datos
(src/data/proyectos.ts y Hero.tsx)—:

  - <nombre>-640.webp y <nombre>-1080.webp, para las tarjetas: una tarjeta
    mide unos 350 px en el teléfono y 380 en el escritorio, así que bajar la
    foto de 1.200–1.600 px entera era gastar el triple;
  - <nombre>.avif al mismo tamaño (calidad 60), solo para las fotos de la
    portada (el escaparate de cada proyecto y el corredor): la portada sí
    necesita la foto grande, porque en el teléfono vertical la agranda hasta
    cubrir el alto. AVIF pesa entre un 25 y un 50 % menos que el JPG; en WebP
    la foto grande casi no bajaba, y algunas hasta pesaban más.

  - <nombre>-movil.avif (28-sep-2026), para la portada de las páginas de
    proyecto y de apartamento (PortadaGaleria.tsx): el centro de la foto en
    vertical (4:5) y a su alto completo. En el teléfono vertical la portada
    agranda la foto hasta cubrir el alto y solo se ve esa franja del centro:
    con el recorte se ve igual de nítida y pesa un tercio del JPG. Solo en
    AVIF (Safari 16 o más, Chrome, Brave, Firefox); el navegador que no lo
    lea sigue con el JPG de siempre. Los planos no se recortan.

Escribe src/data/imagenes.json con el mapa «ruta del JPG → variantes», que
leen la portada (Hero.tsx), las tarjetas (TarjetaGiro.tsx) y la portada de
proyectos y apartamentos (PortadaGaleria.tsx). El JPG se queda
como respaldo para el navegador que no lea esos formatos. Las variantes salen
sin metadatos (ni EXIF ni GPS): Pillow no los copia si no se le piden.

Uso, desde la raíz del repo: python3 scripts/imagenes-webp.py
Se vuelve a correr cuando entra o cambia una foto; no rehace las que ya están
al día (compara fechas). Necesita Pillow con WebP y AVIF (Pillow 11.2 o más).
"""
import json
import os
import re

from PIL import Image

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLICO = os.path.join(RAIZ, "public")
SALIDA = os.path.join(RAIZ, "src", "data", "imagenes.json")
ANCHOS_TARJETA = (640, 1080)
CALIDAD_WEBP = 78
CALIDAD_AVIF = 60
ANCHO_MIN = 900
ANCHO_MIN_AVIF = 1100
# El recorte del teléfono: ancho / alto. La portada del teléfono mide entre
# 0,64 y 0,78 (390 × 608 px, 360 × 461 px); con 0,8 la cubre siempre.
PROPORCION_MOVIL = 0.8
CALIDAD_AVIF_MOVIL = 55


def al_dia(destino: str, origen: str) -> bool:
    return os.path.exists(destino) and os.path.getmtime(destino) >= os.path.getmtime(origen)


def web(ruta: str) -> str:
    return "/" + os.path.relpath(ruta, PUBLICO).replace(os.sep, "/")


def fotos_de_tarjeta() -> set[str]:
    """Las fotos que pasan por las tarjetas de la cartera, como las elige
    fotosDeTarjeta (src/lib/ficha.ts): la `tarjeta` de cada proyecto y después
    las horizontales de su galería, en su versión de 1.200 px si la tiene, sin
    repetir y hasta cuatro. Solo esas llevan WebP de 640 y 1080 px."""
    with open(os.path.join(RAIZ, "src/data/proyectos.ts"), encoding="utf-8") as t:
        texto = t.read()

    def slug(ruta: str) -> str:
        return ruta.split("/")[2]

    tarjeta: dict[str, str] = {}
    galeria: dict[str, list[str]] = {}
    for m in re.finditer(r"tarjeta:\s*\{(.*?)\}", texto, re.S):
        d = dict(re.findall(r'(src1200|src):\s*"([^"]+)"', m.group(1)))
        if "src" in d:
            ruta = d.get("src1200") or d["src"]
            tarjeta[slug(ruta)] = ruta
    for m in re.finditer(r"galeria:\s*\[(.*?)\]", texto, re.S):
        for item in re.finditer(r"\{(.*?)\}", m.group(1), re.S):
            t = item.group(1)
            d = dict(re.findall(r'(src1200|src):\s*"([^"]+)"', t))
            ancho = re.search(r"ancho:\s*(\d+)", t)
            alto = re.search(r"alto:\s*(\d+)", t)
            if "src" in d and ancho and alto and int(ancho.group(1)) >= int(alto.group(1)):
                ruta = d.get("src1200") or d["src"]
                galeria.setdefault(slug(ruta), []).append(ruta)
    rutas: set[str] = set()
    for s in set(tarjeta) | set(galeria):
        elegidas: list[str] = []
        for ruta in [tarjeta.get(s), *galeria.get(s, [])]:
            if ruta and ruta not in elegidas:
                elegidas.append(ruta)
            if len(elegidas) == 4:
                break
        rutas.update(elegidas)
    return rutas


def fotos_de_portada() -> set[str]:
    """Las fotos que pasan por la portada: el `escaparate` de cada proyecto
    (src/data/proyectos.ts) y la foto del corredor (Hero.tsx), con su src y su
    src1200. Solo esas llevan AVIF."""
    rutas: set[str] = set()
    for archivo, bloque in (("src/data/proyectos.ts", "escaparate"), ("src/components/Hero.tsx", "imagen")):
        with open(os.path.join(RAIZ, archivo), encoding="utf-8") as t:
            texto = t.read()
        for m in re.finditer(bloque + r":\s*\{(.*?)\}", texto, re.S):
            rutas.update(re.findall(r'src(?:1200)?:\s*"([^"]+)"', m.group(1)))
    return rutas


def fotos_de_galeria() -> set[str]:
    """Las fotos de la portada de cada página de proyecto (la `galeria` de
    src/data/proyectos.ts, en su tamaño completo) y de cada apartamento
    (public/inmuebles/<slug>/NN.jpg; el plano no). Llevan el recorte del
    teléfono."""
    with open(os.path.join(RAIZ, "src/data/proyectos.ts"), encoding="utf-8") as t:
        texto = t.read()
    rutas: set[str] = set()
    for m in re.finditer(r"galeria:\s*\[(.*?)\]", texto, re.S):
        rutas.update(re.findall(r'\bsrc:\s*"([^"]+)"', m.group(1)))
    carpeta = os.path.join(PUBLICO, "inmuebles")
    for slug in sorted(os.listdir(carpeta)):
        dir_ = os.path.join(carpeta, slug)
        if not os.path.isdir(dir_):
            continue
        for nombre in sorted(os.listdir(dir_)):
            if re.fullmatch(r"\d{2}\.jpg", nombre):
                rutas.add(web(os.path.join(dir_, nombre)))
    return rutas


def recorte_movil(im: Image.Image) -> Image.Image:
    """El centro de la foto en 4:5, a su alto completo (sin achicar)."""
    ancho, alto = im.size
    w = round(alto * PROPORCION_MOVIL)
    x = (ancho - w) // 2
    return im.crop((x, 0, x + w, alto))


def main() -> None:
    portada = fotos_de_portada()
    tarjetas = fotos_de_tarjeta()
    galeria = fotos_de_galeria()
    fuentes = sorted(os.path.join(PUBLICO, r.lstrip("/")) for r in portada | tarjetas | galeria if r.endswith(".jpg"))
    mapa: dict[str, dict] = {}
    pesos = {"jpg": 0, "avif": 0, "galeria": 0, "movil": 0}
    for f in fuentes:
        if os.path.basename(f) == "og.jpg":
            continue
        with Image.open(f) as original:
            ancho, alto = original.size
            if ancho < ANCHO_MIN:
                continue
            im = original.convert("RGB")
        base = f[: -len(".jpg")]
        entrada: dict = {"ancho": ancho, "alto": alto}
        ruta = web(f)
        if ruta not in portada and ruta not in tarjetas and ruta not in galeria:
            continue
        for w in ANCHOS_TARJETA:
            if ruta not in tarjetas or ancho <= w:
                continue
            destino = f"{base}-{w}.webp"
            if not al_dia(destino, f):
                im.resize((w, round(alto * w / ancho)), Image.LANCZOS).save(
                    destino, "WEBP", quality=CALIDAD_WEBP, method=6
                )
            entrada[f"webp{w}"] = web(destino)
        if ruta in portada and ancho >= ANCHO_MIN_AVIF:
            destino = base + ".avif"
            if not al_dia(destino, f):
                im.save(destino, "AVIF", quality=CALIDAD_AVIF, speed=4)
            entrada["avif"] = web(destino)
            pesos["jpg"] += os.path.getsize(f)
            pesos["avif"] += os.path.getsize(destino)
        # Solo fotos apaisadas: una vertical ya es su propio recorte.
        if ruta in galeria and ancho > alto * PROPORCION_MOVIL * 1.15:
            destino = f"{base}-movil.avif"
            if not al_dia(destino, f):
                recorte_movil(im).save(destino, "AVIF", quality=CALIDAD_AVIF_MOVIL, speed=4)
            entrada["movilAvif"] = web(destino)
            pesos["galeria"] += os.path.getsize(f)
            pesos["movil"] += os.path.getsize(destino)
        mapa[ruta] = entrada
    with open(SALIDA, "w", encoding="utf-8") as s:
        json.dump(mapa, s, ensure_ascii=False, indent=2, sort_keys=True)
        s.write("\n")
    print(
        f"{len(mapa)} fotos · portada: JPG {pesos['jpg'] // 1024} KB → AVIF {pesos['avif'] // 1024} KB"
        f" · galerías: JPG {pesos['galeria'] // 1024} KB → recorte del teléfono en AVIF {pesos['movil'] // 1024} KB"
        " · mapa en src/data/imagenes.json"
    )


if __name__ == "__main__":
    main()
