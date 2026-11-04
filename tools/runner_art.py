"""Endless Runner world: a Japanese shopping street at dusk.

Run from the project root. Each layer tiles sideways, and the game scrolls them
at different speeds. The stage is 320 x 180, with the ground at y = 134.
Japanese text comes from runner_glyphs.json, taken from DotGothic16 (SIL Open
Font License), so the signs look the same on every computer. Set RUNNER_REVIEW
to a file path to also export a preview of the full scene.
"""
import json
import math
import os
import random
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "src", "assets", "runner")
os.makedirs(OUT, exist_ok=True)
GLYPHS = json.load(open(os.path.join(HERE, "runner_glyphs.json"), encoding="utf8"))
W, GROUND, STAGE_H = 640, 134, 180
INK = "#1A1226"


def rgb(c):
    c = c.lstrip("#")
    return tuple(int(c[i:i + 2], 16) for i in (0, 2, 4)) + (255,)


class Layer:
    def __init__(self, width=W, height=GROUND):
        self.im = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        self.d = ImageDraw.Draw(self.im)

    def rect(self, x, y, w, h, c):
        self.d.rectangle([x, y, x + w - 1, y + h - 1], fill=rgb(c))

    def poly(self, pts, c):
        self.d.polygon(pts, fill=rgb(c))

    def oval(self, x, y, w, h, c):
        self.d.ellipse([x, y, x + w - 1, y + h - 1], fill=rgb(c))

    def px(self, x, y, c):
        if 0 <= x < self.im.width and 0 <= y < self.im.height:
            self.im.putpixel((x, y), rgb(c))

    def glyph(self, ch, x, y, c):
        for j, row in enumerate(GLYPHS[ch]):
            for i, on in enumerate(row):
                if on == "#":
                    self.px(x + i, y + j, c)

    def text(self, label, x, y, c, gap=0):
        for ch in label:
            self.glyph(ch, x, y, c)
            x += 16 + gap

    def vtext(self, label, x, y, c, gap=0):
        for ch in label:
            self.glyph(ch, x, y, c)
            y += 16 + gap


def sign(s, label, x, y, bg, fg, edge=INK):
    w = len(label) * 16 + 6
    s.rect(x, y, w, 22, edge)
    s.rect(x + 1, y + 1, w - 2, 20, bg)
    s.text(label, x + 3, y + 3, fg)
    return w


def vsign(s, label, x, y, bg, fg, edge=INK):
    h = len(label) * 16 + 6
    s.rect(x, y, 22, h, edge)
    s.rect(x + 1, y + 1, 20, h - 2, bg)
    s.vtext(label, x + 3, y + 3, fg)
    return h


def lantern(s, x, y, c="#D9402F", glow="#F58A5A"):
    s.rect(x + 2, y, 6, 2, INK)
    s.rect(x, y + 2, 10, 12, c)
    s.rect(x + 2, y + 3, 6, 10, glow)
    for row in (y + 5, y + 8, y + 11):
        s.rect(x, row, 10, 1, c)
    s.rect(x + 2, y + 14, 6, 2, INK)


def noren(s, x, y, w, c, trim="#F4EFE6"):
    s.rect(x, y, w, 2, INK)
    panels = max(2, w // 10)
    size = w // panels
    for i in range(panels):
        s.rect(x + i * size + 1, y + 2, size - 2, 14, c)
        s.rect(x + i * size + 1, y + 13, size - 2, 1, trim)


def shop(s, x, w, h, wall, roof):
    top = GROUND - h
    s.rect(x, top, w, h, INK)
    s.rect(x + 1, top + 1, w - 2, h - 1, wall)
    s.rect(x - 4, top - 3, w + 8, 4, INK)
    s.rect(x - 3, top - 2, w + 6, 2, roof)
    for i in range(x - 3, x + w + 3, 4):
        s.px(i, top - 1, INK)


def window(s, x, y, w, h, c="#F7C873", bars=True):
    s.rect(x - 1, y - 1, w + 2, h + 2, INK)
    s.rect(x, y, w, h, c)
    if bars:
        s.rect(x + w // 2, y, 1, h, INK)
        s.rect(x, y + h // 2, w, 1, INK)


def door(s, x, w, h, c="#F7C873"):
    s.rect(x - 1, GROUND - h - 1, w + 2, h + 1, INK)
    s.rect(x, GROUND - h, w, h, c)
    s.rect(x + w // 2, GROUND - h, 1, h, INK)


def vending(s, x, body, panel):
    s.rect(x, GROUND - 40, 24, 40, INK)
    s.rect(x + 1, GROUND - 39, 22, 39, body)
    s.rect(x + 3, GROUND - 37, 18, 20, "#FFF3C4")
    colors = ["#E0533D", "#3E8FD8", "#5FB86C", "#F2C14E", "#D66BA0", "#F4EFE6"]
    rng = random.Random(x)
    for row in range(3):
        for col in range(5):
            s.rect(x + 4 + col * 3, GROUND - 36 + row * 6, 2, 4, rng.choice(colors))
    s.rect(x + 3, GROUND - 15, 12, 3, panel)
    s.rect(x + 3, GROUND - 9, 14, 5, INK)
    s.rect(x + 18, GROUND - 14, 3, 6, "#C7C5D6")


def torii(s, x, top):
    red, dark = "#D23B2E", "#A02822"
    s.rect(x + 7, top + 10, 7, GROUND - top - 10, dark)
    s.rect(x + 8, top + 10, 5, GROUND - top - 10, red)
    s.rect(x + 45, top + 10, 7, GROUND - top - 10, dark)
    s.rect(x + 46, top + 10, 5, GROUND - top - 10, red)
    s.rect(x - 2, top + 2, 63, 6, INK)
    s.rect(x - 4, top, 67, 4, INK)
    s.rect(x - 3, top + 1, 65, 2, "#2B2030")
    s.rect(x, top + 4, 59, 4, red)
    s.rect(x + 3, top + 14, 53, 4, dark)
    s.rect(x + 25, top + 8, 9, 6, dark)


def stone_lantern(s, x):
    grey, light = "#8D8A9E", "#ACA9BC"
    s.rect(x + 2, GROUND - 3, 10, 3, grey)
    s.rect(x + 5, GROUND - 13, 4, 10, grey)
    s.rect(x + 3, GROUND - 19, 8, 6, "#FFCF7A")
    s.rect(x + 1, GROUND - 22, 12, 3, light)
    s.rect(x + 5, GROUND - 24, 4, 2, light)


def sakura(s, x, seed):
    rng = random.Random(seed)
    s.rect(x + 16, GROUND - 40, 6, 40, "#4A2C33")
    s.rect(x + 12, GROUND - 46, 5, 12, "#4A2C33")
    s.rect(x + 22, GROUND - 50, 4, 16, "#4A2C33")
    for _ in range(170):
        a = rng.random() * math.tau
        r = rng.random() ** 0.6
        px = x + 19 + int(math.cos(a) * r * 28)
        py = GROUND - 62 + int(math.sin(a) * r * 22)
        c = rng.choice(["#F3A6C0", "#F7BFD2", "#E98BAE", "#FBD5E2"])
        s.rect(px - 2, py - 1, 4, 3, c)


def pole(s, x):
    s.rect(x, 30, 4, GROUND - 30, "#3A3145")
    s.rect(x - 8, 36, 20, 2, "#3A3145")
    s.rect(x - 5, 44, 14, 2, "#3A3145")
    s.rect(x + 5, 52, 7, 10, "#5A5068")


def wires(s, poles):
    for i, x0 in enumerate(poles):
        x1 = poles[(i + 1) % len(poles)]
        span = (x1 - x0) % W
        for offset, base in ((-7, 36), (10, 36), (-4, 44)):
            for t in range(span):
                sag = 4 * math.sin(math.pi * t / span) * 2
                s.px((x0 + offset + t) % W, base + int(sag), "#2A2238")


def sky():
    s = Layer(320, GROUND)
    bands = ["#1B1440", "#2A1A52", "#3D1F63", "#5A2670", "#7C2E76", "#A23A76", "#C94D72", "#E56E68", "#F39362", "#F9B66E"]
    for i, c in enumerate(bands):
        y0 = i * GROUND // len(bands)
        s.rect(0, y0, 320, GROUND - y0, c)
        if i:
            for x in range(0, 320, 2):
                s.px(x + (i % 2), y0, bands[i - 1])
                s.px(x + ((i + 1) % 2), y0 + 2, bands[i - 1])
    rng = random.Random(4)
    for _ in range(46):
        s.px(rng.randrange(320), rng.randrange(40), rng.choice(["#D8D0F0", "#FFFFFF", "#A99FD8"]))
    s.oval(216, 42, 42, 42, "#FBE3A9")
    s.oval(219, 45, 36, 36, "#FFF1C9")
    return s


def fuji():
    s = Layer()
    peak, base, top = 300, 118, 22
    s.poly([(peak - 210, base + 8), (peak - 24, top), (peak + 24, top), (peak + 210, base + 8)], "#4C3A7E")
    s.poly([(peak, top), (peak + 24, top), (peak + 210, base + 8), (peak + 30, base + 8)], "#3C2E6C")
    s.poly([(peak - 24, top), (peak + 24, top), (peak + 44, top + 19), (peak + 28, top + 15), (peak + 14, top + 28), (peak, top + 17), (peak - 16, top + 30), (peak - 28, top + 17), (peak - 44, top + 21)], "#F5EEF6")
    s.poly([(peak + 2, top), (peak + 24, top), (peak + 44, top + 19), (peak + 28, top + 15), (peak + 14, top + 28), (peak + 2, top + 19)], "#CFC6E6")
    rng = random.Random(9)
    for _ in range(9):
        x, y, w = rng.randrange(W), rng.randrange(62, 104), rng.randrange(50, 130)
        for i in range(w):
            s.px((x + i) % W, y, "#F4B9A0")
            if i % 3:
                s.px((x + i + 6) % W, y + 1, "#E78F8F")
    return s


def town():
    s = Layer()
    base, dark = "#5B2C6E", "#47245E"
    rng = random.Random(21)
    x = 0
    while x < W:
        w, h = rng.randrange(26, 48), rng.randrange(14, 34)
        s.rect(x, GROUND - h, w, h, base)
        s.poly([(x - 4, GROUND - h), (x + w // 2, GROUND - h - 7), (x + w + 4, GROUND - h)], dark)
        for _ in range(3):
            s.rect(x + rng.randrange(3, max(4, w - 4)), GROUND - rng.randrange(5, h), 2, 2, "#F6B86B")
        x += w + rng.randrange(2, 14)
    # A five-story pagoda on the skyline
    px = 150
    s.rect(px - 1, 38, 3, 12, dark)
    for i in range(5):
        y = 50 + i * 15
        half = 12 + i * 3
        s.rect(px - half + 6, y, (half - 6) * 2, 15, base)
        s.poly([(px - half - 8, y + 5), (px - half + 4, y - 3), (px + half - 4, y - 3), (px + half + 8, y + 5)], dark)
        s.rect(px - 2, y + 7, 4, 4, "#F6B86B")
    s.rect(px - 20, 124, 40, 10, base)
    return s


def street():
    s = Layer()
    wires(s, [2, 132, 412])
    # Ramen shop
    shop(s, 6, 92, 70, "#6B4A44", "#2F3350")
    sign(s, "ラーメン", 14, 70, "#C8352B", "#FFF3D6")
    window(s, 12, 98, 22, 12)
    door(s, 56, 26, 28)
    noren(s, 54, 106, 30, "#27305C")
    lantern(s, 42, 100)
    lantern(s, 86, 100)
    # Vending machine and the first cherry tree
    vending(s, 104, "#E9EDF4", "#3E8FD8")
    pole(s, 132)
    sakura(s, 138, 1)
    # Izakaya
    shop(s, 170, 70, 78, "#3E2A2E", "#2B2E44")
    vsign(s, "居酒屋", 176, 60, "#F0E3C8", "#9A2A22")
    window(s, 204, 62, 26, 14)
    door(s, 202, 30, 28)
    noren(s, 200, 106, 34, "#8A2A2A")
    lantern(s, 178, 112)
    lantern(s, 188, 112)
    # Shrine entrance
    for offset in (0, 16, 34):
        s.oval(248 + offset, 52, 34, 46, "#23473F")
    s.rect(248, 76, 66, 58, "#23473F")
    torii(s, 251, 66)
    vsign(s, "神社", 270, 84, "#2B2030", "#F5D98A", "#A02822")
    stone_lantern(s, 238)
    stone_lantern(s, 312)
    # Game center
    shop(s, 332, 72, 88, "#2A2348", "#1F1A38")
    sign(s, "ゲーム", 342, 50, "#16103A", "#5EE6F0", "#E25EC6")
    window(s, 340, 78, 56, 18, "#7C6BF0", False)
    for i in range(4):
        s.rect(344 + i * 13, 82, 8, 10, ["#F06AB8", "#FFD45E", "#5EE6F0", "#8DF07C"][i])
    door(s, 352, 32, 30, "#BDE8F7")
    # Second vending machine, then another cherry tree
    pole(s, 412)
    vending(s, 420, "#D9453A", "#F2C14E")
    sakura(s, 442, 2)
    # Tea house, with a cheer on its roof
    shop(s, 482, 66, 62, "#A08B74", "#2F3B3A")
    vsign(s, "団子", 488, 80, "#F4EFE6", "#2F5E46")
    window(s, 516, 82, 24, 14)
    door(s, 516, 24, 26)
    noren(s, 512, 108, 32, "#2F5E46")
    s.rect(492, 48, 3, 22, INK)
    s.rect(536, 48, 3, 22, INK)
    sign(s, "がんばれ!", 470, 30, "#F06A9B", "#FFFFFF", "#FBD5E2")
    # Karaoke
    shop(s, 556, 80, 74, "#4C3A5C", "#2A2448")
    sign(s, "カラオケ", 564, 66, "#F2C14E", "#2A2448")
    window(s, 562, 94, 20, 12, "#F7A0C8")
    door(s, 594, 30, 28)
    pole(s, 2)
    return s


def road():
    s = Layer(W, STAGE_H - GROUND)
    s.rect(0, 0, W, 46, "#2B2535")
    s.rect(0, 0, W, 7, "#6C5F78")
    s.rect(0, 7, W, 1, INK)
    for x in range(0, W, 12):
        s.rect(x, 0, 1, 7, "#584C64")
    s.rect(0, 8, W, 1, "#463D52")
    for x in range(0, W, 40):
        s.rect(x, 12, 22, 1, "#E8E2D6")
    # Road paint reads 止まれ, "stop", like real Japanese streets
    for x in (48, 368):
        s.text("止まれ", x, 20, "#E8E2D6", 4)
    rng = random.Random(5)
    for _ in range(160):
        s.px(rng.randrange(W), rng.randrange(14, 46), "#352E40")
    return s


def grade(layer, saturation, brightness, tint="#241A3E", amount=0.0):
    """Pushes scenery back, so buttons and obstacles are what the eye lands on."""
    tr, tg, tb, _ = rgb(tint)
    im = layer.im
    pixels = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = pixels[x, y]
            if not a:
                continue
            grey = 0.3 * r + 0.59 * g + 0.11 * b
            out = []
            for value, target in ((r, tr), (g, tg), (b, tb)):
                value = (grey + (value - grey) * saturation) * brightness
                out.append(round(value + (target - value) * amount))
            pixels[x, y] = (*out, a)
    return layer


def obstacles():
    s = Layer(112, 32)
    def base(i):
        return i * 28
    # Daruma
    x = base(0)
    s.oval(x + 2, 6, 24, 26, INK)
    s.oval(x + 3, 7, 22, 25, "#D5302A")
    s.oval(x + 7, 10, 14, 13, "#F6E7D2")
    s.rect(x + 9, 14, 3, 3, INK)
    s.rect(x + 16, 13, 4, 1, INK)
    s.rect(x + 16, 16, 4, 1, INK)
    s.rect(x + 10, 20, 8, 1, INK)
    s.rect(x + 8, 26, 12, 2, "#F2C14E")
    s.rect(x + 6, 9, 3, 1, "#F58A7A")
    # Lucky cat
    x = base(1)
    s.oval(x + 4, 13, 20, 19, INK)
    s.oval(x + 5, 14, 18, 18, "#F7F2E8")
    s.oval(x + 6, 3, 16, 14, INK)
    s.oval(x + 7, 4, 14, 12, "#F7F2E8")
    s.poly([(x + 7, 6), (x + 7, 1), (x + 12, 4)], INK)
    s.poly([(x + 21, 6), (x + 21, 1), (x + 16, 4)], INK)
    s.px(x + 8, 4, "#F3A6C0")
    s.px(x + 20, 4, "#F3A6C0")
    s.rect(x + 10, 9, 2, 2, INK)
    s.rect(x + 16, 9, 2, 2, INK)
    s.rect(x + 13, 12, 2, 1, "#E98BAE")
    s.rect(x + 6, 17, 16, 2, "#D5302A")
    s.rect(x + 13, 19, 3, 3, "#F2C14E")
    s.rect(x + 22, 8, 5, 12, INK)
    s.rect(x + 23, 9, 3, 10, "#F7F2E8")
    s.rect(x + 9, 26, 10, 4, "#F2C14E")
    # Taiko drum
    x = base(2)
    s.rect(x + 2, 8, 24, 2, INK)
    s.rect(x + 1, 10, 26, 16, INK)
    s.rect(x + 2, 11, 24, 14, "#8A4B2C")
    s.rect(x + 2, 13, 24, 2, "#C8352B")
    s.rect(x + 2, 21, 24, 2, "#C8352B")
    s.rect(x + 3, 6, 22, 3, "#F4EFE6")
    s.rect(x + 3, 5, 22, 1, INK)
    for i in range(x + 4, x + 25, 4):
        s.px(i, 17, "#F2C14E")
    s.rect(x + 4, 26, 3, 6, INK)
    s.rect(x + 21, 26, 3, 6, INK)
    # Stone lantern
    x = base(3)
    s.rect(x + 12, 2, 4, 3, "#ACA9BC")
    s.rect(x + 4, 5, 20, 4, INK)
    s.rect(x + 5, 6, 18, 2, "#ACA9BC")
    s.rect(x + 8, 9, 12, 8, INK)
    s.rect(x + 9, 10, 10, 6, "#FFCF7A")
    s.rect(x + 13, 10, 2, 6, INK)
    s.rect(x + 6, 17, 16, 2, "#8D8A9E")
    s.rect(x + 11, 19, 6, 9, "#8D8A9E")
    s.rect(x + 12, 19, 2, 9, "#ACA9BC")
    s.rect(x + 6, 28, 16, 4, "#8D8A9E")
    s.rect(x + 6, 27, 16, 1, INK)
    return s


if __name__ == "__main__":
    # Further layers sit closer to the sky color, and only the obstacles keep full color.
    layers = {
        "sky": grade(sky(), 0.82, 0.68, amount=0.1),
        "fuji": grade(fuji(), 0.72, 0.74, amount=0.2),
        "town": grade(town(), 0.7, 0.68, amount=0.28),
        "street": grade(street(), 0.74, 0.68, amount=0.2),
        "road": grade(road(), 0.6, 0.66, amount=0.1),
        "obstacles": obstacles(),
    }
    for name, layer in layers.items():
        layer.im.save(os.path.join(OUT, f"{name}.png"), optimize=True)
    review = os.environ.get("RUNNER_REVIEW")
    if review:
        sheet = Image.new("RGBA", (W, STAGE_H), (0, 0, 0, 255))
        sheet.alpha_composite(Image.composite(layers["sky"].im.resize((W, GROUND)), Image.new("RGBA", (W, GROUND)), layers["sky"].im.resize((W, GROUND))), (0, 0))
        for name in ("fuji", "town", "street"):
            sheet.alpha_composite(layers[name].im, (0, 0))
        sheet.alpha_composite(layers["road"].im, (0, GROUND))
        sheet.alpha_composite(layers["obstacles"].im, (10, GROUND - 32))
        sheet.resize((W * 2, STAGE_H * 2), Image.NEAREST).save(review)
    print("runner art done")
