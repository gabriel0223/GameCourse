"""Draws the home screen icons for the installed app into public/.

A pixel-art controller in the app's colors, with a small heart where the
touchpad sits. Run from the repo root: python3 tools/app_icon.py
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

GROUND = (9, 8, 15)
GLOW = (74, 52, 140)
COLORS = {
    'W': (246, 243, 251),  # body
    'S': (201, 195, 216),  # shoulder buttons
    'D': (28, 25, 41),  # d-pad and sticks
    'G': (255, 200, 87),  # face buttons, the app's gold
    'P': (255, 125, 150),  # heart
}

PAD = [
    '....SSSSSS.....SSSSSS....',
    '..WWWWWWWWWWWWWWWWWWWWW..',
    '.WWWWWWWWWWWWWWWWWWWWWWW.',
    'WWWWDWWWWWPPWPPWWWWWGWWWW',
    'WWWDDDWWWWPPPPPWWWWGWGWWW',
    'WWWWDWWWWWWPPPWWWWWWGWWWW',
    'WWWWWWWWWWWWPWWWWWWWWWWWW',
    'WWWWWWWWWWWWWWWWWWWWWWWWW',
    'WWWWWWWDDWWWWWWWWDDWWWWWW',
    'WWWWWWWDDWW...WWWDDWWWWWW',
    'WWWWWWWWW.......WWWWWWWWW',
    'WWWWWWWW.........WWWWWWWW',
    '.WWWWWW...........WWWWWW.',
    '..WWWW.............WWWW..',
]


def controller(pixel: int) -> Image.Image:
    width, height = len(PAD[0]) * pixel, len(PAD) * pixel
    art = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(art)
    for y, row in enumerate(PAD):
        for x, cell in enumerate(row):
            if cell in COLORS:
                draw.rectangle(
                    [x * pixel, y * pixel, (x + 1) * pixel - 1, (y + 1) * pixel - 1],
                    fill=COLORS[cell],
                )
    return art


def icon(size: int, pixel: int, glow: bool = True) -> Image.Image:
    image = Image.new('RGB', (size, size), GROUND)
    if glow:
        halo = Image.new('L', (size, size), 0)
        ImageDraw.Draw(halo).ellipse([size * 0.12, size * 0.14, size * 0.88, size * 0.86], fill=255)
        halo = halo.filter(ImageFilter.GaussianBlur(size * 0.14))
        image = Image.composite(Image.new('RGB', (size, size), GLOW), image, halo.point(lambda v: v * 0.55))

    art = controller(pixel)
    left = (size - art.width) // 2
    top = (size - art.height) // 2 + pixel // 2

    if pixel >= 3:
        # A soft shadow under the controller so it sits on the glow.
        shadow = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        mask = art.split()[3].point(lambda v: 150 if v else 0)
        shadow.paste((0, 0, 0, 255), (left, top + pixel), mask)
        shadow = shadow.filter(ImageFilter.GaussianBlur(pixel * 0.9))
        image.paste(shadow, (0, 0), shadow)

    image.paste(art, (left, top), art)
    return image


def main() -> None:
    out = Path(__file__).resolve().parent.parent / 'public'
    out.mkdir(exist_ok=True)
    icon(512, 12).save(out / 'icon-512.png')
    icon(192, 5).save(out / 'icon-192.png')
    # Maskable icons get cropped to a circle or squircle, so the art stays small.
    icon(512, 10).save(out / 'icon-maskable-512.png')
    icon(180, 4).save(out / 'apple-touch-icon.png')
    icon(32, 1, glow=False).save(out / 'favicon-32.png')


if __name__ == '__main__':
    main()
