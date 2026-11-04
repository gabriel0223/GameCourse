"""Games Course Codex scenes: original 160 x 60 pixel art, one per guide.

Run from the project root. Set SPRITE_REVIEW to a folder to also export a
contact sheet.
"""
import importlib.util
import os
import random
import re
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "src", "assets", "codex")
REVIEW = os.environ.get("SPRITE_REVIEW")
os.makedirs(OUT, exist_ok=True)

spec = importlib.util.spec_from_file_location("sprites", os.path.join(HERE, "character_sprites.py"))
sp = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sp)

W, H = 160, 60
INK = "#14101f"


def rgb(c):
    c = c.lstrip("#")
    return tuple(int(c[i:i + 2], 16) for i in (0, 2, 4)) + (255,)


class Scene:
    def __init__(self, top, bottom, seed=1):
        self.im = Image.new("RGBA", (W, H), rgb(top))
        self.d = ImageDraw.Draw(self.im)
        self.rng = random.Random(seed)
        a, b = rgb(top), rgb(bottom)
        bands = 7
        for i in range(bands):
            t = i / (bands - 1)
            c = tuple(round(a[k] + (b[k] - a[k]) * t) for k in range(3)) + (255,)
            y0 = i * H // bands
            self.d.rectangle([0, y0, W, H], fill=c)
            if i:  # a dithered edge between bands reads as old-school shading
                prev = tuple(round(a[k] + (b[k] - a[k]) * (i - 1) / (bands - 1)) for k in range(3)) + (255,)
                for x in range(0, W, 2):
                    self.im.putpixel((x, y0), prev)

    def rect(self, x0, y0, x1, y1, c):
        self.d.rectangle([x0, y0, x1, y1], fill=rgb(c))

    def poly(self, pts, c):
        self.d.polygon(pts, fill=rgb(c))

    def oval(self, x0, y0, x1, y1, c):
        self.d.ellipse([x0, y0, x1, y1], fill=rgb(c))

    def line(self, pts, c, w=1):
        self.d.line(pts, fill=rgb(c), width=w)

    def px(self, x, y, c):
        if 0 <= x < W and 0 <= y < H:
            self.im.putpixel((x, y), rgb(c))

    def stars(self, n=30, y_max=30, c="#c9c3e8"):
        for _ in range(n):
            self.px(self.rng.randrange(W), self.rng.randrange(y_max), c)

    def hills(self, base, height, c, step=9):
        y = base
        pts = [(0, H)]
        for x in range(0, W + step, step):
            y = base - self.rng.randrange(height)
            pts.append((x, y))
        pts.append((W, H))
        self.poly(pts, c)

    def ground(self, y, c, edge):
        self.rect(0, y, W, H, c)
        self.rect(0, y, W, y, edge)
        for _ in range(40):
            self.px(self.rng.randrange(W), self.rng.randrange(y + 2, H), edge)

    def character(self, x, feet, outfit=None, hair=("ponytail", "plum"), frame=4, skin="fair", flip=False, lift=0):
        layers = [sp.base(skin)]
        if outfit:
            layers += [sp.BOTS[outfit], sp.TOPS[outfit]]
        layers.append(sp.hair(*hair))
        if outfit:
            layers.append(sp.ACCS[outfit])
        full = sp.stack(*layers).crop((frame * 16, 0, (frame + 1) * 16, 22))
        if flip:
            full = full.transpose(Image.FLIP_LEFT_RIGHT)
        self.im.alpha_composite(full, (x, feet - 21 - lift))
        self.d = ImageDraw.Draw(self.im)

    def shadow(self, x0, x1, y, c):
        self.rect(x0, y, x1, y, c)


SCENES = {}


def scene(name):
    def add(fn):
        SCENES[name] = fn
        return fn

    return add


@scene("genre-rpg")
def rpg():
    s = Scene("#141a44", "#3b3a7a", 3)
    s.stars(40, 34)
    s.oval(126, 6, 141, 21, "#f4e7b8")
    s.oval(121, 5, 136, 20, "#1b2150")
    s.hills(44, 8, "#242659")
    # castle
    s.rect(12, 22, 44, 46, "#191a42")
    for x in (12, 20, 28, 36):
        s.rect(x, 19, x + 4, 22, "#191a42")
    s.rect(8, 14, 16, 46, "#20204f")
    s.rect(40, 14, 48, 46, "#20204f")
    s.poly([(7, 14), (12, 5), (17, 14)], "#6f3fa3")
    s.poly([(39, 14), (44, 5), (49, 14)], "#6f3fa3")
    s.rect(25, 36, 31, 46, "#0d0d26")
    for x, y in ((11, 22), (43, 22), (22, 28), (34, 28)):
        s.rect(x, y, x + 1, y + 2, "#ffc857")
    s.ground(46, "#1e4a3f", "#2f6d57")
    s.character(84, 51, "rpg", flip=True)
    # slime
    s.oval(112, 41, 128, 52, "#3fd0a0")
    s.rect(114, 48, 126, 51, "#3fd0a0")
    s.rect(112, 51, 128, 52, "#23805f")
    s.rect(116, 44, 117, 46, INK)
    s.rect(121, 44, 122, 46, INK)
    s.rect(114, 43, 115, 43, "#b6f7dd")
    # magic spark
    for x, y in ((104, 34), (108, 30), (101, 28)):
        s.px(x, y, "#fff4b8")
        s.px(x + 1, y, "#ffc857")
        s.px(x - 1, y, "#ffc857")
        s.px(x, y + 1, "#ffc857")
        s.px(x, y - 1, "#ffc857")


@scene("genre-platformer")
def platformer():
    s = Scene("#2a6fd0", "#83d0f0", 5)
    for x, y in ((14, 8), (92, 12), (132, 5)):
        s.oval(x, y, x + 18, y + 7, "#e9f6ff")
        s.oval(x + 6, y - 3, x + 16, y + 5, "#ffffff")

    def platform(x0, x1, y):
        s.rect(x0, y, x1, y + 2, "#58c75a")
        s.rect(x0, y + 3, x1, y + 8, "#a9673a")
        for x in range(x0 + 2, x1, 6):
            s.rect(x, y + 5, x + 1, y + 6, "#7b4526")

    platform(0, 44, 46)
    platform(62, 96, 36)
    platform(116, 159, 26)
    s.rect(116, 35, 159, 59, "#a9673a")
    s.rect(0, 55, 44, 59, "#a9673a")
    for x in (70, 78, 86, 126, 134, 144):
        y = 28 if x < 100 else 18
        s.oval(x, y, x + 4, y + 5, "#ffd23f")
        s.rect(x + 2, y + 1, x + 2, y + 4, "#ffa51f")
    s.character(46, 34, "platform", frame=1, flip=True, lift=2)
    # dotted jump arc
    for x, y in ((22, 31), (29, 22), (37, 17)):
        s.px(x, y, "#ffffff")
    s.rect(52, 53, 58, 54, "#e8475f")
    s.poly([(50, 59), (55, 50), (60, 59)], "#e8475f")


@scene("genre-action")
def action():
    s = Scene("#2a0f24", "#7c1f3b", 7)
    s.oval(50, -22, 110, 38, "#d9483f")
    s.oval(58, -14, 102, 30, "#f07a3f")
    # temple gate
    s.rect(4, 12, 34, 15, "#1b0a18")
    s.rect(0, 9, 38, 11, "#1b0a18")
    s.rect(9, 12, 12, 46, "#1b0a18")
    s.rect(26, 12, 29, 46, "#1b0a18")
    s.ground(46, "#2b1420", "#553043")
    s.character(56, 51, "action", frame=0, flip=True)
    # rival in silhouette
    s.rect(106, 26, 116, 37, "#120710")
    s.oval(104, 16, 118, 28, "#120710")
    s.rect(102, 26, 105, 34, "#120710")
    s.rect(107, 37, 110, 50, "#120710")
    s.rect(113, 37, 116, 50, "#120710")
    s.rect(103, 18, 118, 19, "#e8475f")
    # impact burst
    cx, cy = 88, 32
    s.poly([(cx, cy - 12), (cx + 3, cy - 3), (cx + 12, cy - 5), (cx + 5, cy + 2), (cx + 9, cy + 11), (cx, cy + 5),
            (cx - 9, cy + 10), (cx - 5, cy + 1), (cx - 12, cy - 5), (cx - 3, cy - 3)], "#ffc857")
    s.poly([(cx, cy - 6), (cx + 2, cy - 1), (cx + 6, cy - 2), (cx + 3, cy + 2), (cx, cy + 3), (cx - 3, cy + 2),
            (cx - 6, cy - 2), (cx - 2, cy - 1)], "#fff4d8")
    for x, y, e in ((130, 12, 138), (124, 20, 140), (134, 28, 146)):
        s.rect(x, y, e, y, "#c93a5f")


@scene("genre-adventure")
def adventure():
    s = Scene("#17354f", "#e08a5a", 4)
    s.oval(102, 26, 124, 48, "#ffd98a")
    s.poly([(0, 44), (28, 14), (50, 34), (70, 18), (102, 46), (0, 46)], "#25405a")
    s.poly([(28, 14), (22, 21), (28, 19), (34, 21)], "#d8e6f0")
    s.poly([(70, 18), (64, 24), (70, 22), (76, 24)], "#d8e6f0")
    s.hills(44, 7, "#2d4a4a", 11)
    s.ground(47, "#3a6a4a", "#5a9a62")
    s.poly([(60, 59), (74, 47), (86, 47), (100, 59)], "#c9a36b")
    # signpost
    s.rect(32, 32, 34, 49, "#6b4526")
    s.rect(24, 32, 44, 37, "#a8703f")
    s.poly([(44, 32), (48, 34), (44, 37)], "#a8703f")
    s.rect(28, 34, 39, 34, "#6b4526")
    s.character(72, 51, "adventure", frame=0)
    # chest
    s.rect(122, 45, 138, 53, "#8a5a32")
    s.rect(122, 41, 138, 45, "#a8703f")
    s.rect(122, 45, 138, 45, INK)
    s.rect(128, 44, 131, 47, "#ffc857")
    for x, y in ((118, 39), (142, 40), (130, 36)):
        s.px(x, y, "#fff4b8")


@scene("genre-shooter")
def shooter():
    s = Scene("#0a1422", "#14283c", 6)
    # corridor with perspective
    s.poly([(0, 0), (60, 18), (60, 42), (0, 60)], "#172a3d")
    s.poly([(160, 0), (100, 18), (100, 42), (160, 60)], "#172a3d")
    s.poly([(0, 60), (60, 42), (100, 42), (160, 60)], "#20384a")
    s.poly([(0, 0), (60, 18), (100, 18), (160, 0)], "#0f1f2e")
    s.rect(60, 18, 100, 42, "#0a1a2a")
    s.rect(70, 24, 90, 42, "#123a4f")
    s.rect(79, 24, 80, 42, "#22d3ee")
    for x0, y0, x1, y1 in ((0, 18, 60, 26), (160, 18, 100, 26)):
        s.line([(x0, y0), (x1, y1)], "#22d3ee")
    for x0, y0, x1, y1 in ((0, 42, 60, 36), (160, 42, 100, 36)):
        s.line([(x0, y0), (x1, y1)], "#ff8a3d")
    # enemy drone
    s.oval(114, 18, 132, 30, "#39424e")
    s.rect(120, 22, 126, 25, "#e8475f")
    s.rect(110, 16, 136, 17, "#54606e")
    # reticle
    cx, cy = 123, 23
    s.d.ellipse([cx - 13, cy - 13, cx + 13, cy + 13], outline=rgb("#8fe3ff"))
    for a, b, c, e in ((cx - 18, cy, cx - 10, cy), (cx + 10, cy, cx + 18, cy), (cx, cy - 18, cx, cy - 10), (cx, cy + 10, cx, cy + 18)):
        s.line([(a, b), (c, e)], "#8fe3ff")
    s.character(32, 53, "shooter", frame=4, flip=True)
    s.rect(50, 39, 80, 39, "#ff8a3d")
    s.rect(82, 37, 108, 37, "#ffe0a0")


@scene("genre-strategy")
def strategy():
    s = Scene("#1b1438", "#3a2b6a", 8)
    # an isometric-feeling board
    colors = ("#4b3f86", "#5f51a3")
    top, left = 18, 44
    for row in range(5):
        for col in range(9):
            x = left + col * 12 - row * 5
            y = top + row * 7
            c = colors[(row + col) % 2]
            s.poly([(x, y), (x + 12, y), (x + 7, y + 7), (x - 5, y + 7)], c)
    s.poly([(19, 53), (117, 53), (117, 55), (19, 55)], "#231a48")

    def piece(x, y, c, light):
        s.rect(x - 3, y, x + 3, y + 1, c)
        s.rect(x - 2, y - 5, x + 2, y - 1, c)
        s.oval(x - 3, y - 11, x + 3, y - 5, c)
        s.px(x - 1, y - 9, light)

    piece(74, 29, "#e8475f", "#ffb3bf")
    piece(100, 29, "#e8475f", "#ffb3bf")
    piece(112, 43, "#e8475f", "#ffb3bf")
    piece(58, 43, "#7c9bff", "#dbe4ff")
    piece(82, 50, "#7c9bff", "#dbe4ff")
    piece(40, 50, "#7c9bff", "#dbe4ff")
    s.line([(60, 36), (69, 30)], "#ffc857")
    s.poly([(69, 28), (71, 32), (66, 31)], "#ffc857")
    s.character(128, 53, "strategy", frame=4)
    # banner
    s.rect(16, 6, 17, 34, "#a8884a")
    s.poly([(18, 7), (32, 12), (18, 18)], "#ffc857")


@scene("genre-horror")
def horror():
    s = Scene("#07070f", "#1a1426", 9)
    s.stars(18, 26, "#6f6a86")
    s.oval(126, 6, 142, 22, "#c9c3a8")
    s.oval(133, 9, 137, 12, "#a8a288")
    # dead tree
    s.line([(148, 46), (146, 30), (140, 22)], "#07060d", 2)
    s.line([(146, 32), (154, 22)], "#07060d", 2)
    # house
    s.poly([(36, 46), (36, 20), (66, 8), (98, 20), (98, 46)], "#14111f")
    s.poly([(30, 21), (66, 5), (104, 21), (100, 23), (66, 9), (34, 23)], "#0b0913")
    s.rect(58, 32, 74, 46, "#07060d")
    s.rect(44, 26, 52, 34, "#7a6a2a")
    s.rect(47, 26, 48, 34, "#14111f")
    s.rect(44, 30, 52, 30, "#14111f")
    s.rect(82, 26, 90, 34, "#0b0913")
    s.rect(84, 29, 84, 30, "#e8475f")
    s.rect(88, 29, 88, 30, "#e8475f")
    s.ground(46, "#100e18", "#2a2436")
    # flashlight cone
    s.poly([(130, 37), (98, 28), (98, 50)], "#3a3626")
    s.poly([(130, 37), (106, 31), (106, 45)], "#55503a")
    s.character(126, 51, "horror", frame=4)
    # ghost
    s.oval(14, 24, 26, 36, "#d8d4e8")
    s.rect(14, 30, 26, 41, "#d8d4e8")
    for x in (14, 19, 24):
        s.rect(x, 41, x + 2, 43, "#d8d4e8")
    s.rect(17, 29, 18, 31, INK)
    s.rect(22, 29, 23, 31, INK)


@scene("genre-cozy")
def cozy():
    s = Scene("#f08a6a", "#ffd9a0", 2)
    s.oval(118, 22, 140, 44, "#ffe9a8")
    s.hills(44, 6, "#c98a5a", 13)
    s.ground(46, "#6fae75", "#8fce8a")
    # farmhouse
    s.rect(14, 28, 46, 48, "#f4e2c4")
    s.poly([(8, 29), (30, 12), (52, 29)], "#b8405a")
    s.rect(26, 38, 33, 48, "#7a4a2b")
    s.rect(17, 33, 23, 39, "#7cc0e8")
    s.rect(37, 33, 43, 39, "#7cc0e8")
    s.rect(38, 15, 42, 24, "#8a5a4a")
    for x, y in ((40, 12), (43, 8), (41, 4)):
        s.oval(x, y, x + 3, y + 2, "#fff4e8")
    # crops
    for row, y in enumerate((50, 55)):
        for x in range(64, 110, 7):
            s.rect(x, y, x + 4, y + 1, "#7a5a3a")
            s.rect(x + 1, y - 3, x + 1, y - 1, "#3f8a4a")
            s.rect(x + 3, y - 4, x + 3, y - 1, "#3f8a4a")
            if (x + row) % 2:
                s.px(x + 2, y - 4, "#e8475f")
    s.character(120, 51, "cozy", frame=4)
    # chicken
    s.rect(146, 46, 152, 50, "#fff7ea")
    s.rect(144, 44, 147, 47, "#fff7ea")
    s.px(143, 45, "#ffa51f")
    s.px(145, 43, "#e8475f")
    s.rect(148, 51, 148, 52, "#ffa51f")
    s.rect(150, 51, 150, 52, "#ffa51f")


@scene("genre-racing-and-sports")
def racing():
    s = Scene("#1c3f7a", "#6fb8e8", 12)
    s.hills(30, 6, "#2f6a6a", 12)
    s.rect(0, 30, W, H, "#3a8a5a")
    # stands
    s.rect(0, 16, 58, 30, "#26305a")
    for y in (19, 23, 27):
        for x in range(2, 56, 3):
            s.px(x, y, ("#ffc857", "#e8475f", "#f4f1fa", "#62c7f2")[(x + y) % 4])
    # track
    s.rect(0, 36, W, 56, "#3a3a46")
    for x in range(0, W, 10):
        s.rect(x, 36, x + 4, 37, "#e8475f")
        s.rect(x + 5, 36, x + 9, 37, "#f4f1fa")
    for x in range(4, W, 22):
        s.rect(x, 46, x + 10, 46, "#d8d8e0")
    # finish line
    for y in range(38, 56, 3):
        for i, x in enumerate((126, 129, 132)):
            s.rect(x, y, x + 2, y + 2, "#f4f1fa" if (i + y // 3) % 2 else "#14101f")
    # car
    s.rect(62, 44, 104, 52, "#d93a3a")
    s.poly([(74, 44), (80, 36), (94, 36), (100, 44)], "#a82828")
    s.poly([(78, 44), (82, 38), (88, 38), (88, 44)], "#8fe3ff")
    s.poly([(90, 44), (90, 38), (93, 38), (97, 44)], "#8fe3ff")
    s.rect(62, 47, 104, 48, "#f4f1fa")
    s.oval(68, 48, 78, 57, INK)
    s.oval(71, 51, 75, 54, "#c9c3d8")
    s.oval(90, 48, 100, 57, INK)
    s.oval(93, 51, 97, 54, "#c9c3d8")
    for y in (44, 48, 52):
        s.rect(40, y, 56, y, "#a8b0c0")
    s.rect(96, 8, 98, 30, "#c9c3d8")
    for y in (8, 12, 16):
        for x in range(99, 115, 4):
            s.rect(x, y, x + 3, y + 3, "#f4f1fa" if (x // 4 + y // 4) % 2 else "#14101f")
    s.character(140, 34, "racing", frame=4)


@scene("genre-puzzle")
def puzzle():
    s = Scene("#1a1633", "#2f2a5c", 11)

    def block(x, y, c, light, dark):
        s.rect(x, y, x + 9, y + 9, c)
        s.rect(x, y, x + 9, y, light)
        s.rect(x, y, x, y + 9, light)
        s.rect(x + 9, y + 1, x + 9, y + 9, dark)
        s.rect(x + 1, y + 9, x + 9, y + 9, dark)

    Y = ("#f2e27d", "#fff7c2", "#b8a040")
    P = ("#c9a6ff", "#eadcff", "#8a6ac8")
    B = ("#62c7f2", "#c8efff", "#3a8ab8")
    R = ("#f0708a", "#ffc0cc", "#b84560")
    G = ("#5fd0b6", "#c0f5e8", "#35907c")
    for x in range(40, 121, 10):
        s.rect(x, 50, x, 59, "#3a3470")
    for i in range(0, 9):
        if i != 5:
            block(30 + i * 10, 50, *(Y, P, B, R, G)[i % 5])
    for i in (0, 1, 2, 7, 8):
        block(30 + i * 10, 40, *(B, R, G, Y, P)[i % 5])
    block(30, 30, *P)
    block(110, 30, *R)
    # falling T piece, heading for the gap
    block(70, 8, *G)
    block(80, 8, *G)
    block(90, 8, *G)
    block(80, 18, *G)
    for y in (31, 35, 39, 43):
        s.px(85, y, "#c0f5e8")
    s.character(6, 59, "puzzle", frame=4, flip=True)
    s.oval(132, 6, 142, 12, "#d5d0ea")
    s.oval(128, 15, 133, 18, "#d5d0ea")
    s.rect(135, 7, 136, 7, "#2f2a5c")
    s.rect(135, 8, 136, 8, "#2f2a5c")


def desk(s, y=44):
    s.rect(0, y, W, y + 2, "#6b4526")
    s.rect(0, y + 3, W, H, "#3f2a1a")


def monitor(s, x, y, w, h, screen="#101a2e"):
    s.rect(x, y, x + w, y + h, "#2b2a33")
    s.rect(x + 2, y + 2, x + w - 2, y + h - 2, screen)
    s.rect(x + w // 2 - 3, y + h, x + w // 2 + 3, y + h + 4, "#2b2a33")
    s.rect(x + w // 2 - 8, y + h + 4, x + w // 2 + 8, y + h + 5, "#3a3944")


@scene("industry-developer")
def developer():
    s = Scene("#16132b", "#2c2650", 13)
    s.rect(110, 6, 150, 28, "#221d40")
    s.rect(112, 8, 148, 26, "#3a7a9a")
    s.rect(129, 8, 130, 26, "#221d40")
    s.rect(112, 16, 148, 17, "#221d40")
    desk(s)
    monitor(s, 40, 14, 44, 25)
    for i, (x, w, c) in enumerate(((46, 16, "#7c9bff"), (50, 22, "#5fd0b6"), (50, 12, "#ffc857"), (46, 20, "#f0708a"), (50, 16, "#7c9bff"))):
        s.rect(x, 19 + i * 3, x + w, 19 + i * 3, c)
    monitor(s, 88, 18, 28, 21, "#1f2a5c")
    s.rect(95, 28, 99, 34, "#ffc857")
    s.rect(100, 31, 106, 34, "#5fd0b6")
    s.rect(92, 34, 112, 35, "#58c75a")
    s.rect(58, 39, 72, 39, "#c9c3d8")
    s.character(10, 44, None, frame=4, flip=True)
    s.rect(122, 36, 128, 43, "#f4f1fa")
    s.rect(129, 38, 130, 41, "#f4f1fa")
    s.oval(121, 29, 128, 34, "#c9c3d8")


@scene("industry-publisher")
def publisher():
    s = Scene("#112a3a", "#1f5560", 14)
    s.ground(47, "#1a3a44", "#2f6070")
    # stacked game boxes
    colors = ("#e8475f", "#7c9bff", "#ffc857", "#5fd0b6", "#c9a6ff", "#ff9463")
    n = 0
    for row, (x0, count) in enumerate(((10, 5), (18, 4), (26, 3))):
        for i in range(count):
            x = x0 + i * 16
            y = 37 - row * 14
            s.rect(x, y, x + 13, y + 11, colors[n % 6])
            s.rect(x, y, x + 2, y + 11, "#14101f")
            s.rect(x + 5, y + 3, x + 11, y + 4, "#f4f1fa")
            n += 1
    # delivery truck
    s.rect(92, 20, 134, 46, "#f4f1fa")
    s.rect(92, 41, 134, 46, "#d5d0ea")
    s.rect(100, 26, 124, 36, "#7c9bff")
    s.poly([(106, 36), (112, 28), (118, 36)], "#f4f1fa")
    s.rect(134, 30, 152, 46, "#e8475f")
    s.rect(140, 33, 150, 39, "#8fe3ff")
    s.oval(100, 42, 112, 54, INK)
    s.oval(103, 45, 108, 50, "#c9c3d8")
    s.oval(136, 42, 148, 54, INK)
    s.oval(139, 45, 144, 50, "#c9c3d8")


@scene("industry-platform")
def platform_scene():
    s = Scene("#1d1838", "#3c2f60", 15)
    desk(s, 47)
    # PC tower
    s.rect(10, 16, 28, 47, "#1a1a24")
    s.rect(14, 20, 24, 21, "#5fd0b6")
    s.oval(15, 28, 23, 36, "#2c2c3a")
    s.oval(17, 30, 21, 34, "#c9a6ff")
    # TV
    s.rect(46, 10, 112, 40, "#14121c")
    s.rect(49, 13, 109, 37, "#2a6fd0")
    s.rect(49, 31, 109, 37, "#58c75a")
    s.oval(92, 16, 100, 24, "#ffd23f")
    s.character(68, 38, "platform", frame=4)
    s.rect(74, 40, 84, 47, "#14121c")
    # console
    s.rect(58, 44, 100, 47, "#f4f1fa")
    s.rect(62, 45, 74, 45, "#2b2a33")
    # handheld
    s.rect(122, 26, 152, 44, "#e8475f")
    s.rect(127, 29, 147, 41, "#101a2e")
    s.rect(129, 37, 145, 41, "#58c75a")
    s.rect(124, 33, 125, 37, "#f4f1fa")
    s.rect(149, 32, 150, 33, "#f4f1fa")
    s.rect(149, 37, 150, 38, "#f4f1fa")


@scene("industry-indie")
def indie():
    s = Scene("#101a3a", "#40407c", 16)
    s.stars(30, 30)
    # the large studio
    s.rect(84, 4, 134, 49, "#1f2650")
    s.rect(138, 18, 158, 49, "#293064")
    for y in range(9, 46, 7):
        for x in range(90, 130, 8):
            s.rect(x, y, x + 3, y + 3, "#ffc857" if (x * y) % 5 else "#3a4378")
    for y in range(23, 46, 7):
        for x in range(142, 156, 7):
            s.rect(x, y, x + 3, y + 3, "#7c9bff")
    s.rect(106, 0, 110, 4, "#293064")
    s.ground(49, "#1c2438", "#39456a")
    # the tiny studio
    s.rect(18, 36, 40, 50, "#a8703f")
    s.poly([(13, 37), (29, 24), (45, 37)], "#b8405a")
    s.rect(26, 42, 31, 50, "#3f2a1a")
    s.rect(20, 40, 24, 44, "#ffe9a8")
    s.rect(34, 40, 38, 44, "#ffe9a8")
    s.character(56, 55, None, frame=4, flip=True)
    s.oval(62, 18, 72, 26, "#fff4e8")


@scene("industry-releases")
def releases():
    s = Scene("#16162e", "#30305c", 17)
    desk(s, 48)
    # old CRT
    s.rect(10, 12, 62, 46, "#6a6470")
    s.rect(14, 16, 54, 42, "#1a2a20")
    for y in range(17, 42, 2):
        s.rect(15, y, 53, y, "#223a2c")
    s.rect(30, 26, 37, 33, "#6fd08a")
    s.rect(28, 34, 39, 35, "#6fd08a")
    s.rect(24, 22, 26, 24, "#e8475f")
    s.rect(56, 18, 59, 21, "#3a3640")
    s.rect(56, 26, 59, 29, "#3a3640")
    # arrow
    s.rect(70, 27, 84, 31, "#ffc857")
    s.poly([(84, 21), (93, 29), (84, 37)], "#ffc857")
    # modern screen with the same scene, redrawn
    s.rect(100, 8, 154, 42, "#14121c")
    s.rect(102, 10, 152, 40, "#2c3f80")
    s.rect(102, 30, 152, 40, "#2e8a5a")
    s.oval(134, 13, 146, 25, "#ffe9a8")
    s.character(116, 39, "rpg", frame=4)
    s.rect(122, 42, 132, 45, "#14121c")
    s.rect(114, 46, 140, 47, "#2b2a33")


@scene("industry-dlc")
def dlc():
    s = Scene("#20123c", "#4a2a70", 18)
    s.stars(26, 40)
    # game box
    s.rect(28, 10, 66, 52, "#7c9bff")
    s.rect(28, 10, 33, 52, "#3a55c0")
    s.rect(38, 16, 60, 34, "#14101f")
    s.oval(44, 20, 54, 30, "#ffc857")
    s.rect(38, 40, 60, 42, "#f4f1fa")
    s.rect(38, 45, 52, 46, "#dbe4ff")
    # plus
    s.rect(79, 24, 95, 30, "#f4f1fa")
    s.rect(84, 19, 90, 35, "#f4f1fa")
    # gift
    s.rect(108, 26, 142, 52, "#e8475f")
    s.rect(104, 20, 146, 28, "#f0708a")
    s.rect(122, 20, 128, 52, "#ffc857")
    s.poly([(125, 20), (112, 10), (112, 19)], "#ffc857")
    s.poly([(125, 20), (138, 10), (138, 19)], "#ffc857")


def controller(s, x, y, body="#ecebf4", shade="#c7c5d6", dark="#23222e"):
    """A generic twin-stick controller about 74 wide and 38 tall."""
    s.oval(x, y + 8, x + 26, y + 36, body)
    s.oval(x + 48, y + 8, x + 74, y + 36, body)
    s.rect(x + 10, y + 4, x + 64, y + 22, body)
    s.rect(x + 24, y + 4, x + 50, y + 20, dark)
    s.rect(x + 27, y + 7, x + 47, y + 15, "#373648")
    s.rect(x + 28, y + 22, x + 46, y + 23, shade)
    # d-pad
    s.rect(x + 9, y + 13, x + 11, y + 21, dark)
    s.rect(x + 6, y + 16, x + 14, y + 18, dark)
    # sticks
    s.oval(x + 19, y + 22, x + 28, y + 31, dark)
    s.oval(x + 46, y + 22, x + 55, y + 31, dark)
    s.oval(x + 21, y + 24, x + 26, y + 29, "#4a4960")
    s.oval(x + 48, y + 24, x + 53, y + 29, "#4a4960")
    # face buttons
    for bx, by, c in ((62, 10, "#5fd0b6"), (67, 15, "#f0708a"), (62, 20, "#7c9bff"), (57, 15, "#c9a6ff")):
        s.oval(x + bx, y + by, x + bx + 3, y + by + 3, c)


@scene("playing-dualsense")
def dualsense():
    s = Scene("#121a38", "#26305e", 19)
    desk(s, 50)
    monitor(s, 104, 8, 48, 34)
    s.rect(108, 12, 148, 26, "#3a6ac0")
    s.rect(108, 26, 148, 38, "#2e8a5a")
    s.character(120, 37, None, frame=4)
    controller(s, 12, 10)
    # USB cable
    s.line([(49, 11), (49, 4), (92, 4), (92, 46), (100, 46)], "#c7c5d6")
    s.rect(100, 45, 104, 47, "#8a8898")
    # Bluetooth-style waves
    for r in (6, 10, 14):
        s.d.arc([72 - r, 22 - r, 72 + r, 22 + r], -40, 40, fill=rgb("#7c9bff"))


@scene("playing-buttons")
def buttons():
    s = Scene("#1b1438", "#3a2b6a", 20)

    def button(cx, cy, c):
        s.oval(cx - 12, cy - 12, cx + 12, cy + 12, "#14101f")
        s.oval(cx - 11, cy - 11, cx + 11, cy + 11, "#2c2840")

    button(38, 15, "")
    button(60, 30, "")
    button(38, 45, "")
    button(16, 30, "")
    s.poly([(38, 8), (45, 20), (31, 20)], "#5fd0b6")
    s.poly([(38, 12), (42, 18), (34, 18)], "#2c2840")
    s.d.ellipse([53, 23, 67, 37], outline=rgb("#f0708a"), width=2)
    s.line([(32, 39), (44, 51)], "#7c9bff", 2)
    s.line([(44, 39), (32, 51)], "#7c9bff", 2)
    s.d.rectangle([10, 24, 22, 36], outline=rgb("#c9a6ff"), width=2)
    # the same layout in letters
    s.rect(74, 28, 81, 32, "#ffc857")
    s.poly([(81, 24), (87, 30), (81, 36)], "#ffc857")
    letters = {"Y": (122, 15, ["1.1", "1.1", ".1.", ".1.", ".1."]),
               "B": (144, 30, ["11.", "1.1", "11.", "1.1", "11."]),
               "A": (122, 45, [".1.", "1.1", "111", "1.1", "1.1"]),
               "X": (100, 30, ["1.1", "1.1", ".1.", "1.1", "1.1"])}
    for cx, cy, _ in letters.values():
        button(cx, cy, "")
    for cx, cy, rows in letters.values():
        for j, row in enumerate(rows):
            for i, ch in enumerate(row):
                if ch == "1":
                    s.rect(cx - 4 + i * 3, cy - 7 + j * 3, cx - 2 + i * 3, cy - 5 + j * 3, "#f6f3fb")


@scene("playing-sticks")
def sticks():
    s = Scene("#10223a", "#23506a", 21)
    s.ground(46, "#2a5a50", "#3f8a6a")
    # move stick
    s.oval(8, 14, 38, 44, "#14101f")
    s.oval(13, 19, 33, 39, "#2c2840")
    s.line([(23, 29), (23, 8)], "#ffc857", 2)
    s.poly([(18, 10), (23, 3), (28, 10)], "#ffc857")
    s.poly([(4, 24), (4, 34), (0, 29)], "#ffc857")
    s.poly([(42, 24), (42, 34), (46, 29)], "#ffc857")
    # look stick
    s.oval(122, 14, 152, 44, "#14101f")
    s.oval(127, 19, 147, 39, "#2c2840")
    s.d.arc([120, 12, 154, 46], 200, 340, fill=rgb("#8fe3ff"), width=2)
    s.poly([(150, 20), (156, 24), (150, 27)], "#8fe3ff")
    s.character(62, 51, None, frame=0, flip=True)
    # camera frame around her
    for x, y, dx, dy in ((58, 26, 1, 1), (100, 26, -1, 1), (58, 56, 1, -1), (100, 56, -1, -1)):
        s.rect(min(x, x + dx * 6), y, max(x, x + dx * 6), y, "#8fe3ff")
        s.rect(x, min(y, y + dy * 6), x, max(y, y + dy * 6), "#8fe3ff")


@scene("playing-triggers")
def triggers():
    s = Scene("#1e1030", "#4a2352", 22)
    # top-down view of the shoulders
    s.oval(26, 26, 134, 74, "#ecebf4")
    s.rect(50, 20, 110, 46, "#ecebf4")
    s.rect(70, 30, 90, 36, "#23222e")
    for x0, x1 in ((22, 60), (100, 138)):
        s.rect(x0, 13, x1, 21, "#23222e")
        s.rect(x0 + 2, 15, x1 - 2, 19, "#ffc857")
        s.rect(x0 + 2, 25, x1 - 2, 30, "#4a4960")
    s.rect(24, 22, 58, 23, "#2c2840")
    s.rect(102, 22, 136, 23, "#2c2840")
    # press arrows
    for x in (41, 119):
        s.rect(x - 1, 0, x + 1, 5, "#f0708a")
        s.poly([(x - 5, 5), (x, 11), (x + 5, 5)], "#f0708a")


@scene("playing-world")
def world():
    s = Scene("#1c2c4a", "#46628a", 23)
    s.rect(92, 2, 159, 60, "#39435a")
    for y in range(8, 58, 8):
        off = 8 if (y // 8) % 2 else 0
        for x in range(92 - off, 160, 16):
            s.rect(x, y, x + 15, y, "#2b3346")
            s.rect(x, y - 7, x, y, "#2b3346")
    # ledge with bright paint
    s.rect(84, 26, 100, 27, "#ffc857")
    s.rect(100, 10, 101, 26, "#ffc857")
    s.rect(84, 28, 92, 60, "#2b3346")
    s.rect(84, 26, 92, 29, "#ffc857")
    s.ground(50, "#2e3a44", "#55677a")
    # red barrel
    s.rect(62, 37, 76, 50, "#d93a3a")
    s.rect(62, 41, 76, 42, "#8a2020")
    s.rect(62, 46, 76, 47, "#8a2020")
    s.rect(65, 38, 66, 49, "#f0708a")
    s.poly([(69, 40), (73, 46), (66, 46)], "#ffc857")
    s.character(22, 55, "adventure", frame=4, flip=True)
    # glowing item
    s.oval(44, 40, 56, 52, "#3e5a70")
    s.rect(48, 44, 52, 48, "#8fe3ff")
    s.px(50, 38, "#d8f6ff")
    s.px(42, 46, "#d8f6ff")
    s.px(58, 46, "#d8f6ff")
    # cracked wall
    s.line([(128, 18), (124, 26), (132, 32), (126, 42)], "#14101f")
    s.line([(124, 26), (116, 28)], "#14101f")
    s.line([(132, 32), (140, 30)], "#14101f")


@scene("playing-saving")
def saving():
    s = Scene("#0e1630", "#242c56", 24)
    s.stars(40, 36)
    s.hills(44, 6, "#141c3a", 13)
    s.ground(47, "#1c3a34", "#2f5f50")
    # campfire
    s.oval(50, 40, 90, 58, "#2e4a3a")
    s.line([(60, 50), (80, 46)], "#6b4526", 2)
    s.line([(60, 46), (80, 50)], "#6b4526", 2)
    s.poly([(62, 47), (70, 26), (78, 47)], "#ff8a3d")
    s.poly([(65, 47), (70, 33), (75, 47)], "#ffc857")
    s.poly([(68, 47), (70, 40), (72, 47)], "#fff4b8")
    s.character(24, 53, None, frame=4, flip=True)
    # checkpoint flag
    s.rect(112, 18, 113, 49, "#c9c3d8")
    s.poly([(114, 18), (134, 24), (114, 30)], "#5fd0b6")
    # save progress dots
    for i, x in enumerate((128, 136, 144)):
        s.oval(x, 40, x + 5, 45, "#ffc857" if i < 2 else "#3a4262")


@scene("path-crash-and-comeback")
def crash_and_comeback():
    s = Scene("#1c1030", "#e0704a", 31)
    s.oval(104, 30, 134, 60, "#ffd98a")
    s.hills(44, 5, "#6a3a4a", 14)
    s.ground(47, "#8a5a3f", "#b07a50")
    # a pile of unsold cartridges
    colors = ("#7c9bff", "#f0708a", "#5fd0b6", "#ffc857", "#c9a6ff")
    for row, (x0, count) in enumerate(((10, 7), (17, 6), (24, 5), (31, 3))):
        for i in range(count):
            x = x0 + i * 12
            y = 44 - row * 8
            s.rect(x, y, x + 10, y + 7, "#3a3f55")
            s.rect(x + 2, y + 1, x + 8, y + 4, colors[(i + row * 2) % 5])
    # a new console in the sunrise
    s.rect(106, 42, 134, 53, "#d8d4e8")
    s.rect(106, 47, 134, 48, "#8a8898")
    s.rect(110, 44, 124, 45, "#3a3f55")
    s.rect(128, 50, 131, 51, "#c9503c")
    s.character(92, 53, None, frame=4)
    for x, y in ((142, 20), (150, 28), (136, 12)):
        s.px(x, y, "#fff4b8")


@scene("path-rise-and-fall-of-sega")
def rise_and_fall():
    s = Scene("#101a4a", "#2f62c0", 32)
    s.stars(26, 28)
    s.ground(50, "#16204a", "#3a4f90")
    # three machines climbing, then a fall
    steps = ((12, 40), (44, 30), (76, 20))
    for x, y in steps:
        s.rect(x, y + 8, x + 28, 50, "#223070")
        s.rect(x, y + 8, x + 28, y + 9, "#62c7f2")
        s.rect(x + 3, y, x + 25, y + 7, "#1d1c26")
        s.rect(x + 3, y + 3, x + 25, y + 3, "#55536a")
        s.rect(x + 18, y + 5, x + 21, y + 6, "#e8503c")
    for i, (x, y) in enumerate(((110, 19), (117, 23), (122, 29), (126, 36), (129, 42))):
        s.px(x, y, "#f4f1fa")
    s.rect(120, 44, 142, 50, "#ecebf4")
    s.rect(120, 47, 142, 47, "#c7c5d6")
    s.line([(126, 44), (130, 50)], "#14101f")
    s.oval(127, 45, 132, 48, "#e8833a")
    s.character(84, 20, None, frame=4)


@scene("path-games-in-your-pocket")
def pocket():
    s = Scene("#5a8ad0", "#ffd9a0", 33)
    # a train window
    s.rect(0, 0, W, 8, "#2b2a36")
    s.rect(0, 44, W, H, "#2b2a36")
    s.hills(42, 8, "#3f7a62", 12)
    s.rect(0, 42, W, 44, "#3f7a62")
    for x in (0, 52, 104, 156):
        s.rect(x, 0, x + 3, 44, "#2b2a36")
    # seat and rider
    s.rect(8, 28, 44, 52, "#a02a4a")
    s.rect(8, 28, 44, 29, "#c9506a")
    s.character(20, 53, None, frame=4, flip=True)
    # handheld, large in the foreground
    s.rect(62, 12, 142, 57, "#26252f")
    s.rect(74, 16, 130, 50, "#14101f")
    s.rect(77, 19, 127, 47, "#2a6fd0")
    s.rect(77, 39, 127, 47, "#58c75a")
    s.oval(112, 22, 120, 30, "#ffd23f")
    s.rect(66, 30, 70, 32, "#c7c5d6")
    s.rect(67, 28, 69, 34, "#c7c5d6")
    s.oval(134, 27, 138, 31, "#f0708a")
    s.oval(134, 34, 138, 38, "#5fd0b6")


def code_screen(s, x, y, w, h, rows=5):
    monitor(s, x, y, w, h)
    colors = ("#7c9bff", "#5fd0b6", "#ffc857", "#f0708a", "#c9a6ff")
    for i in range(rows):
        s.rect(x + 5 + (i % 2) * 4, y + 5 + i * 3, x + 5 + (i % 2) * 4 + 8 + (i * 7) % (w - 16), y + 5 + i * 3, colors[i % 5])


@scene("role-programmer")
def role_programmer():
    s = Scene("#101a2e", "#23305c", 41)
    desk(s, 46)
    code_screen(s, 44, 8, 72, 32, 8)
    s.character(16, 46, None, frame=4, flip=True)
    s.rect(60, 44, 100, 45, "#c9c3d8")
    s.rect(126, 34, 133, 45, "#f4f1fa")
    s.rect(134, 37, 135, 41, "#f4f1fa")


@scene("role-designer")
def role_designer():
    s = Scene("#24173f", "#4a2f70", 42)
    s.rect(30, 8, 120, 44, "#ecebf4")
    s.rect(30, 44, 120, 45, "#8a8898")
    for x, y, c in ((40, 14, "#ffc857"), (66, 14, "#5fd0b6"), (92, 14, "#f0708a"), (52, 30, "#7c9bff"), (80, 30, "#c9a6ff")):
        s.rect(x, y, x + 16, y + 9, c)
    s.line([(56, 18), (66, 18)], "#14101f")
    s.line([(82, 18), (92, 18)], "#14101f")
    s.line([(60, 23), (60, 30)], "#14101f")
    s.line([(88, 23), (88, 30)], "#14101f")
    s.ground(50, "#2a1c48", "#4a3a70")
    s.character(128, 55, None, frame=4)


@scene("role-level-designer")
def role_level_designer():
    s = Scene("#14222e", "#2a4a5c", 43)
    for x in range(0, W, 16):
        s.rect(x, 0, x, H, "#203444")
    for y in range(0, H, 16):
        s.rect(0, y, W, y, "#203444")
    for x0, y0, x1, y1 in ((10, 38, 50, 50), (58, 26, 96, 50), (104, 14, 150, 50)):
        s.rect(x0, y0, x1, y1, "#c7c5d6")
        s.rect(x0, y0, x1, y0 + 1, "#f4f1fa")
    for x, y in ((30, 32), (40, 28), (52, 22), (66, 20), (80, 14), (96, 10)):
        s.px(x, y, "#ffc857")
    s.character(20, 38, None, frame=4, flip=True)
    s.poly([(126, 14), (126, 4), (136, 8)], "#5fd0b6")


@scene("role-narrative")
def role_narrative():
    s = Scene("#1b1630", "#3a2f55", 44)
    desk(s, 48)
    s.rect(30, 22, 74, 48, "#f4efe0")
    s.rect(52, 22, 53, 48, "#c9c0a8")
    for y in range(27, 45, 4):
        s.rect(35, y, 48, y, "#8a8070")
        s.rect(57, y, 70, y, "#8a8070")
    s.rect(94, 6, 150, 26, "#ecebf4")
    s.poly([(104, 26), (100, 34), (114, 26)], "#ecebf4")
    for x, c in ((102, "#7c9bff"), (118, "#f0708a"), (134, "#5fd0b6")):
        s.rect(x, 12, x + 11, 13, c)
        s.rect(x, 17, x + 8, 18, c)
    s.character(112, 48, None, frame=4)


@scene("role-artist")
def role_artist():
    s = Scene("#20283f", "#46506a", 45)
    s.ground(50, "#2e3650", "#4a5470")
    s.line([(54, 50), (62, 8)], "#8a5a36", 2)
    s.line([(106, 50), (98, 8)], "#8a5a36", 2)
    s.rect(46, 10, 114, 40, "#f4efe0")
    s.oval(84, 13, 96, 25, "#ffc857")
    s.rect(50, 28, 110, 36, "#5fd0b6")
    s.poly([(52, 28), (66, 16), (82, 28)], "#7c9bff")
    s.character(124, 55, None, frame=4)
    for i, c in enumerate(("#f0708a", "#ffc857", "#5fd0b6", "#7c9bff")):
        s.oval(14 + i * 6, 44, 18 + i * 6, 48, c)


@scene("role-animator")
def role_animator():
    s = Scene("#26122e", "#57264a", 46)
    for i, frame in enumerate((0, 1, 2, 3)):
        x = 8 + i * 37
        s.rect(x, 12, x + 32, 46, "#f4efe0")
        s.rect(x + 2, 14, x + 30, 44, "#1c1830")
        s.character(x + 9, 42, None, frame=frame)
    s.rect(0, 50, W, 53, "#14101f")
    for x in range(4, W, 8):
        s.rect(x, 51, x + 3, 52, "#c9a6ff")


@scene("role-audio")
def role_audio():
    s = Scene("#0e1a30", "#23405c", 47)
    desk(s, 48)
    for x in range(14, 96, 6):
        h = 6 + (x * 7) % 22
        s.rect(x, 34 - h // 2, x + 3, 34 + h // 2, "#5fd0b6")
    s.rect(104, 16, 150, 48, "#14101f")
    s.oval(114, 19, 128, 33, "#2c2840")
    s.oval(118, 23, 124, 29, "#62c7f2")
    s.oval(134, 34, 146, 46, "#2c2840")
    s.oval(138, 38, 142, 42, "#f0708a")
    for x, y in ((30, 8), (52, 12), (74, 6)):
        s.rect(x, y, x + 1, y + 6, "#ffc857")
        s.oval(x - 3, y + 5, x + 1, y + 8, "#ffc857")


@scene("role-producer")
def role_producer():
    s = Scene("#16243a", "#2f4a62", 48)
    s.rect(24, 6, 120, 44, "#ecebf4")
    s.rect(24, 44, 120, 45, "#8a8898")
    for i, (x, w, c) in enumerate(((30, 30, "#7c9bff"), (44, 34, "#5fd0b6"), (62, 28, "#ffc857"), (80, 34, "#f0708a"))):
        s.rect(x, 12 + i * 7, x + w, 15 + i * 7, c)
    s.rect(92, 8, 93, 42, "#e8475f")
    s.ground(50, "#20344a", "#3f5a78")
    s.character(130, 55, None, frame=4)


@scene("role-qa")
def role_qa():
    s = Scene("#1a2410", "#3a4f20", 49)
    desk(s, 48)
    monitor(s, 18, 8, 66, 34, "#2a3a60")
    s.rect(30, 26, 60, 30, "#58c75a")
    s.rect(38, 16, 44, 22, "#f0708a")
    s.rect(50, 14, 52, 24, "#ffc857")
    s.rect(58, 18, 72, 20, "#c9a6ff")
    # a magnifying glass over a bug
    s.d.ellipse([92, 10, 124, 42], outline=rgb("#ecebf4"), width=3)
    s.line([(120, 38), (136, 46)], "#c7c5d6", 3)
    s.oval(102, 22, 114, 32, "#e8475f")
    s.rect(107, 18, 108, 22, "#14101f")
    for y in (24, 28):
        s.line([(99, y), (102, y)], "#14101f")
        s.line([(114, y), (117, y)], "#14101f")


@scene("path-roles")
def path_roles():
    s = Scene("#1a1a3a", "#3f3f7c", 50)
    desk(s, 46)
    code_screen(s, 8, 12, 40, 26)
    code_screen(s, 112, 12, 40, 26)
    s.rect(58, 6, 102, 34, "#ecebf4")
    for x, c in ((62, "#7c9bff"), (76, "#5fd0b6"), (90, "#ffc857")):
        s.rect(x, 12, x + 9, 19, c)
    s.character(30, 46, None, frame=4)
    s.character(72, 46, None, frame=4, hair=("ponytail", "blonde"))
    s.character(124, 46, None, frame=4, flip=True, skin="tan", hair=("ponytail", "black"))


@scene("path-people")
def path_people():
    s = Scene("#2a160c", "#5c2d18", 51)
    s.ground(50, "#3a2014", "#6a3f24")
    for x, c in ((8, "#ffc857"), (46, "#7c9bff"), (84, "#5fd0b6"), (122, "#f0708a")):
        s.rect(x, 8, x + 30, 40, "#a8703f")
        s.rect(x + 2, 10, x + 28, 38, "#1c1420")
        s.oval(x + 9, 14, x + 21, 26, c)
        s.poly([(x + 5, 38), (x + 8, 28), (x + 22, 28), (x + 25, 38)], c)
        s.rect(x + 12, 42, x + 18, 44, "#ffc857")


GLYPHS = {
    "0": ["111", "101", "101", "101", "111"],
    "1": ["010", "110", "010", "010", "111"],
    "2": ["111", "001", "111", "100", "111"],
    "3": ["111", "001", "111", "001", "111"],
    "4": ["101", "101", "111", "001", "001"],
    "5": ["111", "100", "111", "001", "111"],
    "6": ["111", "100", "111", "101", "111"],
    "7": ["111", "001", "010", "010", "010"],
    "8": ["111", "101", "111", "101", "111"],
    "9": ["111", "101", "111", "001", "111"],
    "G": ["111", "100", "101", "101", "111"],
    "E": ["111", "100", "111", "100", "111"],
    "N": ["1001", "1101", "1011", "1001", "1001"],
    " ": ["0", "0", "0", "0", "0"],
}

ERAS = [
    ("#141827", "#2a3048", "#a9afcc"),
    ("#121a3c", "#28366e", "#7c9bff"),
    ("#0e2238", "#1c4560", "#62c7f2"),
    ("#0e2826", "#1b4f48", "#5fd0b6"),
    ("#1a2710", "#3a4f20", "#afc968"),
    ("#2a2710", "#55501f", "#f2e27d"),
    ("#2a1f0a", "#5a4416", "#ffc857"),
    ("#2a160c", "#5c2d18", "#ff9463"),
    ("#2a0f1c", "#5c2038", "#f0708a"),
    ("#1e1436", "#422a70", "#c9a6ff"),
]


def text(s, label, x, y, scale, color):
    for ch in label:
        rows = GLYPHS[ch]
        for j, row in enumerate(rows):
            for i, on in enumerate(row):
                if on == "1":
                    s.rect(x + i * scale, y + j * scale, x + (i + 1) * scale - 1, y + (j + 1) * scale - 1, color)
        x += (len(rows[0]) + 1) * scale


def motif(s, era, x, y, c):
    """A small generic object for each era, with no real product designs."""
    dark = "#14101f"
    if era == 0:  # oscilloscope
        s.rect(x, y, x + 34, y + 30, "#3a3f55")
        s.oval(x + 4, y + 3, x + 28, y + 27, dark)
        s.line([(x + 7, y + 20), (x + 14, y + 8), (x + 20, y + 18), (x + 25, y + 12)], c)
    elif era == 1:  # paddles and a ball
        s.rect(x, y + 4, x + 3, y + 18, c)
        s.rect(x + 32, y + 12, x + 35, y + 26, c)
        s.rect(x + 18, y + 13, x + 21, y + 16, "#f4f1fa")
    elif era == 2:  # cartridge
        s.rect(x + 4, y, x + 30, y + 28, "#3a3f55")
        s.rect(x + 8, y + 4, x + 26, y + 16, c)
        s.rect(x + 8, y + 22, x + 26, y + 28, dark)
    elif era in (3, 4):  # flat gamepad
        s.rect(x, y + 6, x + 36, y + 24, "#d8d4e8")
        s.rect(x + 6, y + 13, x + 14, y + 15, dark)
        s.rect(x + 9, y + 10, x + 11, y + 18, dark)
        s.oval(x + 23, y + 14, x + 26, y + 17, c)
        s.oval(x + 28, y + 11, x + 31, y + 14, c)
        if era == 4:
            s.rect(x + 16, y + 9, x + 21, y + 10, "#8a8898")
    elif era == 5:  # disc
        s.oval(x + 3, y, x + 33, y + 30, "#d8d4e8")
        s.oval(x + 8, y + 5, x + 28, y + 25, c)
        s.oval(x + 14, y + 11, x + 22, y + 19, dark)
    elif era == 6:  # disc with online signal
        s.oval(x, y + 6, x + 24, y + 30, "#d8d4e8")
        s.oval(x + 9, y + 15, x + 15, y + 21, dark)
        for r in (6, 10, 14):
            s.d.arc([x + 26 - r, y + 8 - r, x + 26 + r, y + 8 + r], -50, 50, fill=rgb(c))
    elif era == 7:  # motion wand
        s.rect(x + 8, y + 10, x + 16, y + 30, "#ecebf4")
        s.d.arc([x + 2, y - 4, x + 32, y + 26], -80, 10, fill=rgb(c), width=2)
        s.poly([(x + 28, y + 12), (x + 35, y + 8), (x + 33, y + 16)], c)
    elif era == 8:  # headset
        s.rect(x, y + 8, x + 36, y + 24, "#ecebf4")
        s.rect(x + 4, y + 11, x + 32, y + 21, dark)
        s.rect(x + 8, y + 14, x + 15, y + 18, c)
        s.rect(x + 21, y + 14, x + 28, y + 18, c)
    else:  # fast storage chip
        s.rect(x + 2, y + 6, x + 34, y + 24, "#39424e")
        s.rect(x + 6, y + 10, x + 16, y + 20, dark)
        s.poly([(x + 25, y + 7), (x + 19, y + 16), (x + 24, y + 16), (x + 22, y + 23), (x + 30, y + 13), (x + 25, y + 13)], c)


CONSOLES = {
    "odyssey": ("dial", "#ecebf4", "#23222e", "#c9503c"),
    "home-pong": ("dial", "#8a5a36", "#d8d4e8", "#ffc857"),
    "telstar": ("dial", "#2b2a36", "#d8d4e8", "#f0708a"),
    "color-tv-game": ("dial", "#e8833a", "#f4f1fa", "#3a3f55"),
    "channel-f": ("wedge", "#8a5a36", "#23222e", "#ffc857"),
    "atari-2600": ("wedge", "#23222e", "#8a5a36", "#e8833a"),
    "odyssey-2": ("wedge", "#2b2a36", "#d8d4e8", "#c9503c"),
    "intellivision": ("wedge", "#8a6a3e", "#d9c28a", "#23222e"),
    "game-and-watch": ("clam", "#c7a24a", "#f0e8cc", "#c9503c"),
    "colecovision": ("wedge", "#2b2a36", "#6a6878", "#62c7f2"),
    "nes": ("vcr", "#c9c7d2", "#4a4956", "#c9503c"),
    "sg-1000": ("wedge", "#e9e7ee", "#3a3f55", "#c9503c"),
    "master-system": ("vcr", "#23222e", "#c9503c", "#e9e7ee"),
    "atari-7800": ("wedge", "#2b2a36", "#c9c7d2", "#e8833a"),
    "pc-engine": ("small", "#ecebf4", "#3a3f55", "#c9503c"),
    "genesis": ("round", "#1d1c26", "#55536a", "#c9503c"),
    "game-boy": ("handv", "#c9c7d2", "#8fa33a", "#8a2f55"),
    "snes": ("round", "#c9c7d2", "#7a6fb0", "#a9a6b6"),
    "neo-geo": ("vcr", "#1d1c26", "#55536a", "#c9503c"),
    "game-gear": ("handh", "#26252f", "#3f7fbf", "#c9503c"),
    "3do": ("disc", "#23222e", "#55536a", "#ffc857"),
    "jaguar": ("round", "#1d1c26", "#3a3946", "#c9503c"),
    "playstation": ("disc", "#c9c7d2", "#8a8898", "#62c7f2"),
    "saturn": ("disc", "#2b2a36", "#55536a", "#7c9bff"),
    "virtual-boy": ("visor", "#a02a2a", "#23222e", "#f0505a"),
    "n64": ("round", "#2b2a36", "#55536a", "#5fd0b6"),
    "dreamcast": ("disc", "#ecebf4", "#c7c5d6", "#e8833a"),
    "ps2": ("tower", "#1d1c26", "#3f5fbf", "#7c9bff"),
    "gamecube": ("cube", "#4a3f9a", "#2f2870", "#c9c3e8"),
    "xbox": ("slim", "#1d1c26", "#5fbf3f", "#3a3946"),
    "gba": ("handh", "#6a55c8", "#3f7fbf", "#c9c3e8"),
    "ds": ("clam", "#c9c7d2", "#3f7fbf", "#c9503c"),
    "psp": ("handh", "#1d1c26", "#3f7fbf", "#8a8898"),
    "xbox-360": ("tower", "#ecebf4", "#c7c5d6", "#5fbf3f"),
    "ps3": ("slim", "#1d1c26", "#55536a", "#c7c5d6"),
    "wii": ("wii", "#ecebf4", "#c7c5d6", "#62c7f2"),
    "3ds": ("clam", "#3f6fb0", "#3f7fbf", "#ffc857"),
    "vita": ("handh", "#1d1c26", "#3a5fa8", "#8a8898"),
    "wii-u": ("tablet", "#1d1c26", "#3f7fbf", "#1d1c26"),
    "ps4": ("slim", "#1d1c26", "#3f5fbf", "#7c9bff"),
    "xbox-one": ("slim", "#23222e", "#6a6878", "#ecebf4"),
    "switch": ("tablet", "#26252f", "#3f7fbf", "#e8503c"),
    "series-x": ("tower", "#1d1c26", "#3a3946", "#5fbf3f"),
    "ps5": ("tower", "#ecebf4", "#1d1c26", "#7c9bff"),
    "steam-deck": ("handh", "#26252f", "#3f7fbf", "#8a8898"),
    "switch-2": ("tablet", "#1d1c26", "#3f7fbf", "#2b2a36"),
}


def draw_console(s, form, body, trim, accent):
    """A simple stand-in until real photos are added in the editor."""
    x, floor = 88, 50
    dark = "#14101f"
    s.rect(x - 4, floor, x + 62, floor + 1, dark)
    if form == "dial":
        s.rect(x, floor - 16, x + 58, floor - 1, body)
        s.rect(x, floor - 16, x + 58, floor - 14, trim)
        for dx in (10, 42):
            s.oval(x + dx, floor - 11, x + dx + 7, floor - 4, accent)
            s.rect(x + dx + 3, floor - 10, x + dx + 4, floor - 7, dark)
    elif form == "wedge":
        s.poly([(x, floor - 1), (x + 8, floor - 22), (x + 50, floor - 22), (x + 58, floor - 1)], body)
        s.rect(x + 3, floor - 9, x + 55, floor - 5, trim)
        s.rect(x + 18, floor - 22, x + 40, floor - 18, dark)
        s.rect(x + 7, floor - 8, x + 10, floor - 6, accent)
        s.rect(x + 13, floor - 8, x + 16, floor - 6, accent)
    elif form == "vcr":
        s.rect(x + 2, floor - 20, x + 56, floor - 1, body)
        s.rect(x + 2, floor - 9, x + 56, floor - 8, trim)
        s.rect(x + 8, floor - 17, x + 34, floor - 12, dark)
        s.rect(x + 40, floor - 6, x + 44, floor - 4, accent)
        s.rect(x + 47, floor - 6, x + 51, floor - 4, accent)
    elif form == "small":
        s.rect(x + 12, floor - 12, x + 46, floor - 1, body)
        s.rect(x + 12, floor - 12, x + 46, floor - 10, trim)
        s.rect(x + 18, floor - 7, x + 34, floor - 5, dark)
        s.rect(x + 38, floor - 7, x + 42, floor - 5, accent)
    elif form == "round":
        s.oval(x, floor - 16, x + 58, floor + 2, body)
        s.rect(x + 12, floor - 13, x + 46, floor - 1, body)
        s.rect(x + 19, floor - 18, x + 39, floor - 11, trim)
        s.rect(x + 22, floor - 17, x + 36, floor - 15, dark)
        s.rect(x + 8, floor - 7, x + 12, floor - 5, accent)
    elif form == "disc":
        s.rect(x + 2, floor - 16, x + 56, floor - 1, body)
        s.rect(x + 2, floor - 5, x + 56, floor - 4, trim)
        s.oval(x + 16, floor - 19, x + 42, floor - 8, trim)
        s.oval(x + 20, floor - 17, x + 38, floor - 10, body)
        s.oval(x + 27, floor - 15, x + 31, floor - 12, accent)
        s.rect(x + 7, floor - 11, x + 11, floor - 9, accent)
    elif form == "cube":
        s.rect(x + 13, floor - 26, x + 45, floor - 1, body)
        s.rect(x + 13, floor - 26, x + 45, floor - 22, trim)
        s.oval(x + 23, floor - 18, x + 35, floor - 6, trim)
        s.oval(x + 26, floor - 15, x + 32, floor - 9, accent)
        s.line([(x + 20, floor - 30), (x + 38, floor - 30)], accent, 2)
        s.rect(x + 20, floor - 30, x + 21, floor - 26, accent)
        s.rect(x + 37, floor - 30, x + 38, floor - 26, accent)
    elif form == "tower":
        s.rect(x + 18, floor - 36, x + 40, floor - 1, body)
        s.rect(x + 28, floor - 36, x + 30, floor - 1, trim)
        s.rect(x + 21, floor - 33, x + 25, floor - 31, accent)
        s.rect(x + 15, floor - 2, x + 43, floor - 1, trim)
    elif form == "slim":
        s.poly([(x, floor - 1), (x + 4, floor - 13), (x + 54, floor - 13), (x + 58, floor - 1)], body)
        s.rect(x + 3, floor - 7, x + 55, floor - 6, trim)
        s.rect(x + 10, floor - 11, x + 28, floor - 10, accent)
    elif form == "wii":
        s.rect(x + 12, floor - 30, x + 22, floor - 1, body)
        s.rect(x + 14, floor - 26, x + 15, floor - 6, trim)
        s.rect(x + 18, floor - 27, x + 19, floor - 25, accent)
        s.rect(x + 34, floor - 24, x + 40, floor - 1, body)
        s.rect(x + 36, floor - 21, x + 38, floor - 19, trim)
        s.rect(x + 36, floor - 15, x + 38, floor - 13, accent)
    elif form == "handv":
        s.rect(x + 14, floor - 40, x + 44, floor - 1, body)
        s.rect(x + 18, floor - 36, x + 40, floor - 20, dark)
        s.rect(x + 21, floor - 33, x + 37, floor - 22, trim)
        s.rect(x + 19, floor - 13, x + 27, floor - 11, dark)
        s.rect(x + 22, floor - 16, x + 24, floor - 8, dark)
        s.oval(x + 32, floor - 12, x + 35, floor - 9, accent)
        s.oval(x + 37, floor - 15, x + 40, floor - 12, accent)
    elif form == "handh":
        s.rect(x + 2, floor - 24, x + 56, floor - 1, body)
        s.rect(x + 15, floor - 21, x + 43, floor - 4, dark)
        s.rect(x + 17, floor - 19, x + 41, floor - 6, trim)
        s.rect(x + 5, floor - 14, x + 11, floor - 12, accent)
        s.rect(x + 7, floor - 16, x + 9, floor - 10, accent)
        s.oval(x + 47, floor - 16, x + 50, floor - 13, accent)
        s.oval(x + 50, floor - 12, x + 53, floor - 9, accent)
    elif form == "clam":
        s.rect(x + 11, floor - 38, x + 47, floor - 21, body)
        s.rect(x + 18, floor - 35, x + 40, floor - 24, trim)
        s.rect(x + 11, floor - 19, x + 47, floor - 1, body)
        s.rect(x + 18, floor - 16, x + 40, floor - 5, trim)
        s.rect(x + 13, floor - 21, x + 45, floor - 20, dark)
        s.rect(x + 13, floor - 12, x + 16, floor - 9, accent)
        s.rect(x + 42, floor - 12, x + 45, floor - 9, accent)
    elif form == "visor":
        s.rect(x + 8, floor - 34, x + 50, floor - 16, body)
        s.rect(x + 14, floor - 30, x + 44, floor - 21, dark)
        s.rect(x + 17, floor - 28, x + 26, floor - 23, accent)
        s.rect(x + 32, floor - 28, x + 41, floor - 23, accent)
        s.rect(x + 26, floor - 16, x + 32, floor - 3, trim)
        s.rect(x + 16, floor - 3, x + 42, floor - 1, trim)
    elif form == "tablet":
        s.rect(x + 12, floor - 22, x + 46, floor - 1, body)
        s.rect(x + 15, floor - 19, x + 43, floor - 4, trim)
        # Original Switch has two colored sides, and the others match.
        s.rect(x + 5, floor - 22, x + 12, floor - 1, "#3f9fd8" if accent == "#e8503c" else accent)
        s.rect(x + 46, floor - 22, x + 53, floor - 1, accent)
        s.oval(x + 7, floor - 16, x + 10, floor - 13, dark)
        s.oval(x + 48, floor - 10, x + 51, floor - 7, dark)


def console_scene(slug, era, year):
    top, bottom, accent = ERAS[era]
    s = Scene(top, bottom, 200 + era)
    for i, y in enumerate((40, 45, 51, 58)):
        s.rect(0, y, W, y, bottom if i % 2 else top)
    text(s, year, 10, 20, 4, accent)
    draw_console(s, *CONSOLES[slug])
    return s


def history_scene(label, era):
    top, bottom, accent = ERAS[era]
    s = Scene(top, bottom, 100 + era)
    # distant horizon lines, closer together toward the top
    for i, y in enumerate((40, 45, 51, 58)):
        s.rect(0, y, W, y, bottom if i % 2 else top)
    text(s, label, 10, 18, 5, accent)
    motif(s, era, 114, 15, accent)
    return s


def render(fn):
    captured = {}
    original = Scene.__init__

    def wrapped(self, *args, **kwargs):
        original(self, *args, **kwargs)
        captured["scene"] = self

    Scene.__init__ = wrapped
    try:
        fn()
    finally:
        Scene.__init__ = original
    return captured["scene"].im


if __name__ == "__main__":
    images = {name: render(fn) for name, fn in SCENES.items()}
    for n in range(1, 10):
        images[f"gen-{n}"] = history_scene(f"GEN {n}", n).im
    with open(os.path.join(HERE, "..", "src", "content", "timeline.ts"), encoding="utf8") as source:
        timeline = source.read()
    events = re.findall(r"event\(\n\s+'([\w-]+)',\n\s+(\d+),\n\s+(\d+),", timeline)
    for slug, era, year in events:
        images[f"event-{slug}"] = history_scene(year, int(era)).im
    with open(os.path.join(HERE, "..", "src", "content", "consoles.ts"), encoding="utf8") as source:
        consoles = source.read()
    for slug, era, year in re.findall(r"machine\(\n\s+'([\w-]+)',\n\s+(\d+),\n\s+(\d+),", consoles):
        images[f"console-{slug}"] = console_scene(slug, int(era), year).im
    for slug, year, era in (
        ("baer", "1972", 1), ("bushnell", "1972", 1), ("yokoi", "1980", 2), ("miyamoto", "1981", 2),
        ("williams", "1980", 2), ("meier", "1991", 4), ("sakaguchi", "1987", 3), ("wright", "1989", 3),
        ("kojima", "1987", 3), ("carmack", "1993", 5), ("iwata", "2006", 7), ("miyazaki", "2009", 7),
    ):
        images[f"person-{slug}"] = history_scene(year, era).im
    for name, im in images.items():
        im.convert("RGB").save(os.path.join(OUT, f"{name}.png"), optimize=True)
    if REVIEW:
        os.makedirs(REVIEW, exist_ok=True)
        cols = 4
        rows = (len(images) + cols - 1) // cols
        z = 2
        sheet = Image.new("RGB", (cols * (W * z + 8), rows * (H * z + 8)), (9, 8, 15))
        for i, im in enumerate(images.values()):
            sheet.paste(im.convert("RGB").resize((W * z, H * z), Image.NEAREST), ((i % cols) * (W * z + 8), (i // cols) * (H * z + 8)))
        sheet.save(os.path.join(REVIEW, "codex-art.png"))
    print(len(images), "scenes")
