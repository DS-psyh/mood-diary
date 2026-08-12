"""Генерация иконок приложения: скруглённый квадрат + боб с листиком."""
from PIL import Image, ImageDraw
import os

OUT = os.path.join(os.path.dirname(__file__), "..", "icons")
os.makedirs(OUT, exist_ok=True)

BG = (233, 240, 226)      # мягкий зелёный фон плитки
BEAN = (97, 174, 114)     # тело боба
LEAF = (63, 140, 85)      # листик
FACE = (38, 48, 42)       # глаза и рот


def draw_bean(d, cx, cy, r, scale):
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=BEAN)

    # листик
    lr = r * 0.42
    d.ellipse([cx + r * 0.05, cy - r * 1.18, cx + r * 0.05 + lr * 1.7, cy - r * 1.18 + lr * 1.15], fill=LEAF)

    # глаза
    ex, ey = r * 0.30, r * 0.12
    er_x, er_y = r * 0.095, r * 0.13
    for sx in (-1, 1):
        px = cx + sx * ex
        d.ellipse([px - er_x, cy - ey - er_y, px + er_x, cy - ey + er_y], fill=FACE)

    # улыбка
    w = r * 0.30
    box = [cx - w, cy + r * 0.02, cx + w, cy + r * 0.46]
    d.arc(box, start=15, end=165, fill=FACE, width=max(2, int(r * 0.10)))


def make(size, maskable=False, path=None):
    ss = 4  # сглаживание через даунсэмплинг
    S = size * ss
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    if maskable:
        d.rectangle([0, 0, S, S], fill=BG)
        r = S * 0.24          # безопасная зона для маски
    else:
        radius = int(S * 0.22)
        d.rounded_rectangle([0, 0, S - 1, S - 1], radius=radius, fill=BG)
        r = S * 0.30

    draw_bean(d, S / 2, S / 2 + S * 0.03, r, ss)

    img = img.resize((size, size), Image.LANCZOS)
    img.save(path, "PNG")
    print("готово:", path)


make(180, False, os.path.join(OUT, "icon-180.png"))
make(192, False, os.path.join(OUT, "icon-192.png"))
make(512, False, os.path.join(OUT, "icon-512.png"))
make(512, True, os.path.join(OUT, "icon-maskable-512.png"))
