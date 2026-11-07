"""Love Attack's white bear: an original polar bear cub in a red scarf.

Same format as character_sprites.py: a 16 x 22 side view facing left, as a
five-frame strip (A contact, U lifted, B contact, U lifted, S standing).
Run from the project root. Set SPRITE_REVIEW to a folder to also export a
large preview.
"""
import os
from PIL import Image

W, H, FULL_H = 16, 20, 22
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "src", "assets", "practice")
REVIEW = os.environ.get("SPRITE_REVIEW")
FRAMES = ["A", "U", "B", "U", "S"]
LIFT = {"A": 0, "U": 1, "B": 0, "S": 0}
PAW_DX = {"A": -1, "U": 0, "B": 1, "S": 0}

PALETTE = {
    "o": "#2B1B38",  # outline
    "w": "#FBF8FF",  # fur
    "g": "#DCD4EA",  # fur shade
    "G": "#B9AECE",  # deep shade
    "p": "#E9B9C9",  # inner ear
    "e": "#2B1B38",  # eye
    "s": "#FFFFFF",  # eye shine
    "n": "#3A2A48",  # nose
    "r": "#E8476F",  # scarf
    "R": "#B32F55",  # scarf shade
}

# The snout points left, and the scarf's tail trails out behind her.
BODY = {
    1: ".......oooo.....",
    2: "......owppwo....",
    3: ".....oowwwwooo..",
    4: "...oowwwwwwwwwo.",
    5: "..owwwwwwwwwwgo.",
    6: "..owweswwwwwwgo.",
    7: ".owwweewwwwwwgo.",
    8: "onnwwwwwwwwwggo.",
    9: ".oowwwwwwwwwggo.",
    10: "..oowwwwwwwggo..",
    11: "...orrrrrrrrRo..",
    12: "...oRrrrrrrrRrro",
    13: "...owwwwwwwwgoRo",
    14: "...owwwwwwwwggo.",
    15: "...owwwwwwwwggo.",
}
LEGS = {
    "A": {16: "...owwo..owgo...", 17: "...owgo..oGGo...", 18: "...oooo..oooo..."},
    "U": {16: ".....owwggo.....", 17: ".....owgGGo.....", 18: ".....oooooo....."},
    "B": {16: "...owgo..owwo...", 17: "...oGGo..owgo...", 18: "...oooo..oooo..."},
}
# The scarf's tail flutters on the lifted frames.
TAIL_UP = {12: "...oRrrrrrrrRrrr", 13: "...owwwwwwwwgooo"}


def rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)) + (255,)


def frame(name):
    rows = {**BODY, **LEGS["U" if name == "S" else name]}
    if name == "U":
        rows.update(TAIL_UP)
    # A front paw, swinging with each step.
    for r, ch in ((13, "w"), (14, "g")):
        s = list(rows[r])
        s[5 + PAW_DX[name]] = ch
        s[6 + PAW_DX[name]] = "o" if r == 14 else ch
        rows[r] = "".join(s)
    s = list(rows[15])
    s[5 + PAW_DX[name]] = "o"
    rows[15] = "".join(s)
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    for r, line in rows.items():
        assert len(line) == W, (name, r, line, len(line))
        for x, ch in enumerate(line):
            if ch != ".":
                im.putpixel((x, r), rgb(PALETTE[ch]))
    return im


def main():
    strip = Image.new("RGBA", (W * len(FRAMES), FULL_H), (0, 0, 0, 0))
    for i, name in enumerate(FRAMES):
        strip.alpha_composite(frame(name), (i * W, 2 - LIFT[name]))
    strip.save(os.path.join(OUT, "bear.png"))
    if REVIEW:
        os.makedirs(REVIEW, exist_ok=True)
        z = 12
        sheet = Image.new("RGBA", (strip.width * z, FULL_H * z), (240, 196, 214, 255))
        sheet.alpha_composite(strip.resize((strip.width * z, FULL_H * z), Image.NEAREST))
        sheet.save(os.path.join(REVIEW, "bear.png"))


if __name__ == "__main__":
    main()
