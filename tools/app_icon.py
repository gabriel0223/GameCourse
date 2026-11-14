"""Draws the home screen icons for the installed app into public/.

A smooth controller in the app's colors, with a heart where the touchpad sits.
The icon is built as SVG and turned into PNGs with rsvg-convert.
Run from the repo root: python3 tools/app_icon.py
"""

import subprocess
from pathlib import Path

CONTROLLER = """
  <!-- shoulder buttons -->
  <rect x="122" y="150" width="98" height="34" rx="14" fill="#b9b2cc"/>
  <rect x="292" y="150" width="98" height="34" rx="14" fill="#b9b2cc"/>
  <!-- body -->
  <path d="M150 168 C196 156 316 156 362 168 C406 180 430 214 442 260 L460 336
           C468 370 449 394 420 394 C398 394 385 382 373 362 L351 330
           C343 318 333 314 318 314 L194 314 C179 314 169 318 161 330 L139 362
           C127 382 114 394 92 394 C63 394 44 370 52 336 L70 260
           C82 214 106 180 150 168 Z" fill="url(#body)"/>
  <!-- d-pad -->
  <g fill="#1c1929">
    <rect x="131" y="202" width="26" height="78" rx="7"/>
    <rect x="105" y="228" width="78" height="26" rx="7"/>
  </g>
  <!-- face buttons -->
  <g fill="#ffc857">
    <circle cx="369" cy="209" r="14"/>
    <circle cx="369" cy="273" r="14"/>
    <circle cx="337" cy="241" r="14"/>
    <circle cx="401" cy="241" r="14"/>
  </g>
  <!-- sticks -->
  <g>
    <circle cx="208" cy="282" r="27" fill="#1c1929"/>
    <circle cx="208" cy="282" r="16" fill="#3a3450"/>
    <circle cx="304" cy="282" r="27" fill="#1c1929"/>
    <circle cx="304" cy="282" r="16" fill="#3a3450"/>
  </g>
  <!-- heart -->
  <path d="M256 250 C224 230 218 206 232 196 C243 188 253 194 256 203
           C259 194 269 188 280 196 C294 206 288 230 256 250 Z" fill="#ff7d96"/>
"""


def svg(scale: float, background: bool = True) -> str:
    back = ''
    if background:
        back = """
  <rect width="512" height="512" fill="url(#ground)"/>
  <rect width="512" height="512" fill="url(#glow)"/>"""
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1b1530"/>
      <stop offset="1" stop-color="#09080f"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#6a4bc4" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#6a4bc4" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="body" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="1" stop-color="#ddd6ec"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="160%">
      <feDropShadow dx="0" dy="14" stdDeviation="14" flood-color="#000" flood-opacity="0.45"/>
    </filter>
  </defs>{back}
  <g filter="url(#shadow)" transform="translate(256 262) scale({scale}) translate(-256 -272)">{CONTROLLER}
  </g>
</svg>
"""


def render(source: str, size: int, path: Path) -> None:
    subprocess.run(
        ['rsvg-convert', '-w', str(size), '-h', str(size), '-o', str(path)],
        input=source.encode(),
        check=True,
    )


def main() -> None:
    out = Path(__file__).resolve().parent.parent / 'public'
    out.mkdir(exist_ok=True)
    regular = svg(0.86)
    # Maskable icons get cropped to a circle or squircle, so the art stays smaller.
    maskable = svg(0.74)
    render(regular, 512, out / 'icon-512.png')
    render(regular, 192, out / 'icon-192.png')
    render(maskable, 512, out / 'icon-maskable-512.png')
    render(regular, 180, out / 'apple-touch-icon.png')
    # Tiny sizes read better with the controller filling the square.
    render(svg(1.0), 32, out / 'favicon-32.png')


if __name__ == '__main__':
    main()
