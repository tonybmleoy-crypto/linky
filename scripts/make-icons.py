"""Generates app and tray icons: the round ink mark with a chain link (see Logo in Figma).

Run with `npm run icons`. Requires Pillow.
"""
from pathlib import Path
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent.parent / "resources"
INK = (24, 24, 27, 255)
WHITE = (255, 255, 255, 255)


def link_glyph(size: int, color, stroke_ratio: float) -> Image.Image:
    """Two interlocking stadium shapes rotated 45° — a chain link."""
    s = size * 8  # supersample for smooth edges
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    w = max(2, int(s * stroke_ratio))
    link_len, link_h = int(s * 0.44), int(s * 0.24)
    cx, cy = s // 2, s // 2
    offset = int(s * 0.19)
    for dx in (-offset, offset):
        box = [cx + dx - link_len // 2, cy - link_h // 2, cx + dx + link_len // 2, cy + link_h // 2]
        d.rounded_rectangle(box, radius=link_h // 2, outline=color, width=w)
    img = img.rotate(45, resample=Image.BICUBIC)
    return img.resize((size, size), Image.LANCZOS)


def app_icon(size: int) -> Image.Image:
    s = size * 8
    base = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    ImageDraw.Draw(base).ellipse([0, 0, s - 1, s - 1], fill=INK)
    base = base.resize((size, size), Image.LANCZOS)
    glyph = link_glyph(int(size * 0.62), WHITE, 0.075)
    off = (size - glyph.width) // 2
    base.alpha_composite(glyph, (off, off))
    return base


def main() -> None:
    OUT.mkdir(exist_ok=True)
    app_icon(512).save(OUT / "icon.png")
    app_icon(256).save(OUT / "icon.ico", sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
    # Tray: the same mark, small. Windows picks tray@2x.png on high-DPI screens.
    app_icon(16).save(OUT / "tray.png")
    app_icon(32).save(OUT / "tray@2x.png")
    print("icons written to", OUT)


if __name__ == "__main__":
    main()
