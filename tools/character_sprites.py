"""Games Course character sprites: tiny side-view chibi.

The character is about 16 x 20 pixels, facing left, on a 16 x 22 canvas so hats
and the bob have headroom. Each layer is a five-frame strip:
  A contact (near leg forward), U lifted, B contact (near leg back), U lifted,
  S standing still. The walk loops the first four frames, and lifted frames sit
  1 pixel higher. The idle pose is frame S.
Layer order in the app: base, bottom, top, hair, accessory.
"""
import itertools, os
from PIL import Image

W, H, FULL_H = 16, 20, 22
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "src", "assets", "sprites")
REVIEW = os.environ.get("SPRITE_REVIEW")
os.makedirs(OUT, exist_ok=True)
FRAMES = ["A", "U", "B", "U", "S"]
LIFT = {"A": 0, "U": 1, "B": 0, "S": 0}
ARM_DX = {"A": 1, "U": 0, "B": -1, "S": 0}
INK = "#2B1B38"


def rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)) + (255,)


def paint(rows, pal):
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    full = {"o": INK, **pal}
    for r, s in rows.items():
        assert len(s) == W, (r, s, len(s))
        for x, ch in enumerate(s):
            if ch != ".":
                im.putpixel((x, r), rgb(full[ch]))
    return im


def strip(common, pal, per=None, arm=None):
    """per: {frame: rows}; arm: {row: char}, drawn at columns 8-9 plus swing."""
    out = Image.new("RGBA", (W * len(FRAMES), FULL_H), (0, 0, 0, 0))
    for i, f in enumerate(FRAMES):
        rows = {**common, **((per or {}).get("U" if f == "S" else f, {}))}
        for r, ch in (arm or {}).items():
            s = list(rows[r])
            for col in (8, 9):
                s[col + ARM_DX[f]] = ch
            rows[r] = "".join(s)
        out.alpha_composite(paint(rows, pal), (i * W, 2 - LIFT[f]))
    return out


# ---------- base ----------
SKINS = {
    "light": ("#F9DCC4", "#E8B598", "#F4A9A0"),
    "fair": ("#F7D0B5", "#E4A98B", "#F09C93"),
    "tan": ("#E3B084", "#C58C60", "#D9806B"),
    "brown": ("#B57B50", "#935E3A", "#B85F4C"),
    "deep": ("#7C4E33", "#5F3823", "#94483A"),
}
BASE_C = {
    4: ".....oooooo.....",
    5: "....ossssssoo...",
    6: "...ossssssssso..",
    7: "...ossssssssso..",
    8: "...osewsssssso..",
    9: "...osewsssssso..",
    10: "...osppsssssso..",
    11: "....ossssssSo...",
    12: ".....oooooo.....",
    13: ".....ouuuuuo....",
    14: ".....ouuuuuo....",
    15: ".....ouuuuuo....",
}
LEGS = {
    "A": {16: "....oUUUUUUo....",
          17: "...osso.oSSo....",
          18: "...obbo.oBBo....",
          19: "...oooo.oooo...."},
    "U": {16: ".....oUUUUo.....",
          17: ".....ossSSo.....",
          18: ".....obbBBo.....",
          19: ".....oooooo....."},
    "B": {16: "....oUUUUUUo....",
          17: "...oSSo.osso....",
          18: "...oBBo.obbo....",
          19: "...oooo.oooo...."},
}


def base(skin):
    s, d, p = SKINS[skin]
    pal = {"s": s, "S": d, "p": p, "e": "#2B1B38", "w": "#FFFFFF", "u": "#E2DDEE", "U": "#AFA6C4",
           "b": "#6B5A8A", "B": "#4F4068"}
    return strip(BASE_C, pal, LEGS, {13: "s", 14: "s", 15: "s"})


# ---------- hair ----------
HAIR_COLORS = {
    "plum": ("#5A3B78", "#3F2857", "#8560A8"),
    "black": ("#2F2C3A", "#1E1C27", "#55516A"),
    "dark-brown": ("#4B2D1C", "#331D11", "#6E4529"),
    "brown": ("#7A4A2B", "#5A331C", "#A8703F"),
    "blonde": ("#E8C15A", "#C49A3A", "#F7E08E"),
    "pink": ("#EE85A8", "#C95F85", "#FBB7CC"),
    "blue": ("#3E8FD8", "#2B69AB", "#7FBDF0"),
}
def rows(start, *lines):
    return dict(enumerate(lines, start))


# Every style covers the whole back of the head, so no skin shows behind the hair.
# h is the base color, H is shadow, and L is the highlight. Eyes sit on rows 8-9, cols 5-6.
SWEPT = rows(3,
    ".....oooooo.....",
    "....ohhLLLhhoo..",
    "...ohhLLhhhhhho.",
    "...ohhhhhhhhhho.",
    "...oHHhHHhhhhho.")
BLUNT = rows(3,
    ".....oooooo.....",
    "....ohhhhhhhoo..",
    "...oLLLLLLhhhho.",
    "...ohhhhhhhhhho.",
    "...oHHHHHHhhhho.")
HAIR_STYLES = {
    "bob": {**SWEPT, **rows(8,
        "....H...HhhhLho.",
        "........HhhhLho.",
        "........HhhhhHo.",
        ".........HHHHo..",
        "..........oooo..")},
    "long": {**SWEPT, **rows(8,
        "....H...Hhhhhho.",
        "........HhhLhho.",
        "........HhhLhho.",
        ".........hhhhHo.",
        ".........hhLhHo.",
        "..........hLhHo.",
        "..........hhHHo.",
        "..........hHHo..",
        "...........oo...")},
    "ponytail": {**SWEPT, **rows(5,
        "...ohhLLhhhhooo.",
        "...ohhhhhhhhhLho",
        "...oHHhHHhhhhLHo"), **rows(8,
        "....H...HhhhHhHo",
        "........HhhhHhHo",
        ".........hhhHhHo",
        "..........HHHhHo",
        "...........oHho.",
        "............oo..")},
    "bun": {**SWEPT, **rows(4,
        "....ohhLLLhhooo.",
        "...ohhLLhhhoLho.",
        "...ohhhhhhhoLhHo",
        "...oHHhHHhhohhHo",
        "....H...HhhoHHHo",
        "........Hhhhooo.",
        "........HhhhHo..",
        ".........HHHo...",
        "..........ooo...")},
    "short": {**SWEPT, **rows(8,
        "....H...Hhhhho..",
        "........HhhhHo..",
        ".........HHHo...",
        "..........oo....")},
    "pixie": {**rows(3,
        "......o.ooo.....",
        ".....ohohhhooo..",
        "...oohLLLhhhhho.",
        "...ohLLhhhhhhho.",
        "...ohhhhHhhhhho.",
        "....HHH.Hhhhho..",
        ".....H..HhhhHo..",
        ".........HHHo...",
        "..........oo....")},
    "hime": {**BLUNT, **rows(8,
        "........hhhhhho.",
        "........hLhhhho.",
        "........hLhhhho.",
        "........hLHhhho.",
        "........hhHhhho.",
        "........oo.hhho.",
        "...........hHHo.",
        "...........hHHo.",
        "...........ooo..")},
    "wavy": {**SWEPT, **rows(8,
        "....H...HhhhhhHo",
        "........HhLLhhho",
        "........HhhhLhHo",
        ".........hhhhLho",
        ".........hLLhhHo",
        ".........hhhLhHo",
        "..........hhhHo.",
        "...........HHHo.",
        "...........ooo..")},
    "curly": {**rows(3,
        ".....oo.oo.oo...",
        "....ohhohhohhoo.",
        "...ohLLhhLLhhhho",
        "...ohhhhhhhhLLho",
        "...oHhHhHhhhhhho",
        "....H.H.HhLLhhHo",
        "........HhhhhLho",
        "........HhLLhhHo",
        ".........HhhhHo.",
        ".........oHHHo..",
        "..........ooo...")},
    "pigtails": {**SWEPT, **rows(8,
        "....H...Hhhoooo.",
        "........HhoLhho.",
        "........HHohLhHo",
        ".........oohhHHo",
        "..........ohhHo.",
        "..........ohLHo.",
        "..........ohHo..",
        "..........oHo...",
        "...........o....")},
    "braid": {**SWEPT, **rows(8,
        "....H...Hhhhhho.",
        "........HhhhhHo.",
        ".........HhhHoo.",
        "..........ooLho.",
        "...........ohHo.",
        "...........oLho.",
        "...........ohHo.",
        "...........oLho.",
        "............oo..")},
}


# Tails swing out on the contact frames, so loose hair trails behind her steps.
SWING = {
    "ponytail": rows(12, "...........oohHo", ".............oo."),
    "pigtails": rows(14, "...........ohHo.", "...........oHHo.", "............oo.."),
    "braid": rows(14, "............ohHo", "............oLho", ".............oo."),
}


def hair(style, color):
    h, d, l = HAIR_COLORS[color]
    swing = SWING.get(style)
    per = {"A": swing, "B": swing} if swing else None
    return strip(HAIR_STYLES[style], {"h": h, "H": d, "L": l}, per)


# ---------- tops: the arm is drawn over the torso, '.' leaves the hand to the base ----------
LONG = {13: "d", 14: "d", 15: "."}
SHORT = {13: "d", 14: ".", 15: "."}
TOPS = {
    "rpg": strip({
        13: ".....oacccco....",
        14: ".....obbbbbo....",
        15: ".....oacccco....",
        16: "....oaaaaaao....",
    }, {"c": "#3F6FD8", "d": "#2D50A8", "a": "#FFC857", "b": "#7A4A2B"}, arm=LONG),
    "platform": strip({
        13: ".....occccco....",
        14: ".....oaaaaao....",
        15: ".....occccco....",
    }, {"c": "#FFF4E0", "a": "#FF7A45", "d": "#FF7A45"}, arm=SHORT),
    "shooter": strip({
        13: ".....occccco....",
        14: ".....oaaaaao....",
        15: ".....occccco....",
    }, {"c": "#6F7F4A", "d": "#39424E", "a": "#FF8A3D"}, arm=LONG),
    "horror": strip({
        13: ".....ownccco....",
        14: ".....ownccco....",
        15: ".....occgcco....",
    }, {"c": "#6E3B3B", "d": "#4F2929", "w": "#EDE6DA", "n": "#2B2A33", "g": "#D6B35B"}, arm=LONG),
    "cozy": strip({
        13: ".....opppppo....",
        14: ".....occccco....",
        15: ".....occccco....",
    }, {"c": "#FFF7EA", "d": "#E6D9C2", "p": "#F2A7B5"}, arm=LONG),
}

# ---------- bottoms ----------
BOTS = {
    "rpg": strip({
        16: "....occcccco....",
        17: "...oaaaaaaaao...",
    }, {"c": "#ECE7F7", "a": "#3F6FD8"}),
    "platform": strip({}, {"c": "#3D7BD1", "l": "#8FB8EC"}, {
        "A": {16: "....ollllllo...."},
        "U": {16: ".....ollllo....."},
        "B": {16: "....ollllllo...."},
    }),
    "shooter": strip({}, {"c": "#6F7F4A", "d": "#54623A"}, {
        "A": {16: "....occcccco....",
              17: "...occo.oddo...."},
        "U": {16: ".....occcco.....", 17: ".....occddo....."},
        "B": {16: "....occcccco....", 17: "...oddo.occo...."},
    }),
    "horror": strip({}, {"c": "#2F3A52", "p": "#8C3B4A", "w": "#EDE6DA", "W": "#C9C1B2"}, {
        "A": {16: "....ocpcpcco....", 17: "...owwo.oWWo...."},
        "U": {16: "....ocpcpcco....", 17: ".....owwWWo....."},
        "B": {16: "....ocpcpcco....", 17: "...oWWo.owwo...."},
    }),
    "cozy": strip({
        16: "....occdcdco....",
        17: "....owwwwwwo....",
    }, {"c": "#6FAE75", "d": "#578F5D", "w": "#FFF7EA"}),
}

# ---------- accessories ----------
ACCS = {
    "rpg": strip({
        0: "...........oo...",
        1: ".......ooooco...",
        2: "......occcco....",
        3: ".....occccco....",
        4: "....oaaaaaao....",
        5: "..oocccccccccoo.",
        6: "...ooooooooooo..",
    }, {"c": "#3F6FD8", "a": "#FFC857"}),
    "platform": strip({
        3: ".....oooooo.....",
        4: "....occcccco....",
        5: "...ocaacccccco..",
        6: ".oyyyyocccccco..",
        7: "..oooo.oooooo...",
    }, {"c": "#21B8A6", "a": "#FFF4E0", "y": "#FFC857"}),
    "shooter": strip({
        7: "...ooooooooooo..",
        8: "...oggggddaddo..",
        9: "...ooooooooooo..",
    }, {"g": "#22D3EE", "d": "#39424E", "a": "#FF8A3D"}),
    "horror": strip({
        7: "....aaa.........",
        8: "....a.aaaaaaa...",
        9: "....a.a.........",
        10: "....aaa.........",
    }, {"a": "#8C2F45"}),
    "cozy": strip({
        2: ".....oooooo.....",
        3: "....occcccco....",
        4: "....ocdcdcdo....",
        5: "....oaaaaaao....",
        6: "..oocccccccccoo.",
        7: "...ooooooooooo..",
    }, {"c": "#EFD08A", "d": "#D9B566", "a": "#E8667F"}),
}


# ---------- more genres ----------
PANTS = {
    "A": {16: "....occcccco....", 17: "...occo.oddo...."},
    "U": {16: ".....occcco.....", 17: ".....occddo....."},
    "B": {16: "....occcccco....", 17: "...oddo.occo...."},
}
TOPS.update({
    "action": strip({
        13: ".....owcwwwo....",
        14: ".....owwwwwo....",
        15: ".....obbbbbo....",
    }, {"w": "#F4F1FA", "c": "#CFC8E0", "d": "#DCD6EA", "b": "#2B2A33"}, arm=SHORT),
    "adventure": strip({
        13: ".....ocsccco....",
        14: ".....occscco....",
        15: ".....occcsco....",
    }, {"c": "#C9A36B", "d": "#A8834E", "s": "#6B4526"}, arm=LONG),
    "strategy": strip({
        13: ".....ocgccco....",
        14: ".....occccco....",
        15: ".....ocgccco....",
    }, {"c": "#2C3E73", "d": "#1F2C55", "g": "#FFC857"}, arm=LONG),
    "racing": strip({
        13: ".....occccco....",
        14: ".....owwwwwo....",
        15: ".....occccco....",
    }, {"c": "#D93A3A", "d": "#A82828", "w": "#F4F1FA"}, arm=LONG),
    "puzzle": strip({
        13: ".....occdcco....",
        14: ".....ocdcdco....",
        15: ".....occdcco....",
    }, {"c": "#E5B23D", "d": "#B8862A"}, arm=LONG),
})
BOTS.update({
    "action": strip({}, {"c": "#2F2C3A", "d": "#1E1C27"}, PANTS),
    "adventure": strip({}, {"l": "#A68A5B"}, {
        "A": {16: "....ollllllo...."},
        "U": {16: ".....ollllo....."},
        "B": {16: "....ollllllo...."},
    }),
    "strategy": strip({
        16: "....occcccco....",
        17: "....oddddddo....",
    }, {"c": "#59627F", "d": "#434B66"}),
    "racing": strip({}, {"c": "#F4F1FA", "d": "#CFC8E0", "r": "#D93A3A"}, {
        "A": {16: "....ocrcccco....", 17: "...orco.oddo...."},
        "U": {16: ".....ocrcco.....", 17: ".....orcddo....."},
        "B": {16: "....ocrcccco....", 17: "...oddo.orco...."},
    }),
    "puzzle": strip({
        16: "....ocdcdcco....",
        17: "....odddddd o...".replace("d o...", "do...."),
    }, {"c": "#A9633A", "d": "#84492A"}),
})
ACCS.update({
    "action": strip({
        6: "...ooooooooooo..",
        7: "...orrrrrrrrro..",
        8: "...ooooooooorro.",
    }, {"r": "#E8475F"}),
    "adventure": strip({
        2: ".....oooooo.....",
        3: "....occcccco....",
        4: "....oaaaaaao....",
        5: "..oocccccccoo...",
        6: "...oooooooooo...",
    }, {"c": "#8A5A32", "a": "#3F2A1A"}),
    "strategy": strip({
        1: "....o..oo..o....",
        2: "....oyoyyoyo....",
        3: "....oyyyyyyo....",
        4: "....oyryyryo....",
        5: "....oooooooo....",
    }, {"y": "#FFC857", "r": "#E8475F"}),
    "racing": strip({
        5: "...ooooooooooo..",
        6: "...oggoddddddo..",
        7: "...ooooooooooo..",
    }, {"g": "#8FE3FF", "d": "#39424E"}),
    "puzzle": strip({
        3: ".......oo..oo...",
        4: ".......oppoppo..",
        5: ".......opPPpo...",
        6: ".......oppoppo..",
        7: ".......oo..oo...",
    }, {"p": "#E8667F", "P": "#B8405A"}),
})


def stack(*layers):
    c = Image.new("RGBA", layers[0].size, (0, 0, 0, 0))
    for l in layers:
        c.alpha_composite(l)
    return c


def up(im, s):
    return im.resize((im.width * s, im.height * s), Image.NEAREST)


def main():
    for sk in SKINS:
        base(sk).save(f"{OUT}/base-{sk}.png")
    for g in TOPS:
        TOPS[g].save(f"{OUT}/top-{g}.png")
        BOTS[g].save(f"{OUT}/bottom-{g}.png")
        ACCS[g].save(f"{OUT}/acc-{g}.png")
    for st, col in itertools.product(HAIR_STYLES, HAIR_COLORS):
        hair(st, col).save(f"{OUT}/hair-{st}-{col}.png")

    if not REVIEW:
        return
    os.makedirs(REVIEW, exist_ok=True)
    bg = (31, 42, 92, 255)
    genres = list(TOPS)
    # the five new sets in all frames, then every top and bottom in idle and stride
    z = 6
    sh = Image.new("RGBA", (80 * z, FULL_H * z * 5), bg)
    for i, g in enumerate(genres[5:]):
        im = stack(base("fair"), BOTS[g], TOPS[g], hair("bob", "brown"), ACCS[g])
        sh.alpha_composite(up(im, z), (0, i * FULL_H * z))
    sh.save(f"{REVIEW}/new-sets.png")

    z = 3
    sh = Image.new("RGBA", (W * z * 10, FULL_H * z * 10), bg)
    for (i, t), (j, b) in itertools.product(enumerate(genres), enumerate(genres)):
        im = stack(base("tan"), BOTS[b], TOPS[t], hair("long", "plum"))
        cell = im.crop((0, 0, W, FULL_H)) if (i + j) % 2 else im.crop((4 * W, 0, 5 * W, FULL_H))
        sh.alpha_composite(up(cell, z), (i * W * z, j * FULL_H * z))
    sh.save(f"{REVIEW}/pairs.png")

    sh = Image.new("RGBA", (W * z * 10, FULL_H * z * 5), bg)
    for (i, a), (j, st) in itertools.product(enumerate(genres), enumerate(HAIR_STYLES)):
        im = stack(base("brown"), hair(st, "pink"), ACCS[a]).crop((4 * W, 0, 5 * W, FULL_H))
        sh.alpha_composite(up(im, z), (i * W * z, j * FULL_H * z))
    sh.save(f"{REVIEW}/heads.png")


if __name__ == "__main__":
    main()
