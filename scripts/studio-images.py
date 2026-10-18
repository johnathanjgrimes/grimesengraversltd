#!/usr/bin/env python3
"""Make "studio" versions of every award photo on Grimes navy.

Reads our WebP copies of the supplier photos (public/assets/awards/SKU-1000.webp and SKU-480.webp,
made by scripts/fetch-award-images.py) and writes navy-background versions to
public/assets/awards/studio/. The site uses them as the main image when they exist and keeps the
supplier photo as the second image on each award page (src/lib/awards.ts).

Only the supplier's blue backdrop is changed (blue, fairly saturated pixels). The award itself,
its engraving and any wood, jade or coloured crystal keep their real colours. No AI: the result
is the real product photo, relit.

Run:  pip3 install pillow numpy   then   python3 scripts/studio-images.py
Re-running only makes images that are missing; add --force to redo them all.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "public" / "assets" / "awards"
OUT = SRC / "studio"
NAVY = np.array([35, 38, 58], float) / 255


def studio(img: Image.Image) -> Image.Image:
    a = np.asarray(img.convert("RGB")).astype(float) / 255
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mx, mn = a.max(-1), a.min(-1)
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    d = np.maximum(mx - mn, 1e-6)
    hue = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    # How much a pixel looks like the supplier's blue backdrop: blue hue and some saturation.
    weight = np.clip(1 - np.abs(hue - 210) / 35, 0, 1) * np.clip((sat - 0.08) / 0.17, 0, 1)
    # Backdrop tones become deep navy; bright highlights and engraving stay bright.
    tone = np.interp(lum, [0, 0.35, 0.55, 0.72, 0.8, 0.88, 1], [0.0, 0.05, 0.08, 0.13, 0.33, 0.75, 1])
    target = np.clip(tone[..., None] * np.array([0.80, 0.86, 1.12]) + NAVY * (1 - np.clip(tone, 0, 1))[..., None] * 0.9, 0, 1)
    out = a * (1 - weight[..., None]) + target * weight[..., None]
    # Soft spotlight so the award stands out.
    h, w = lum.shape
    yy, xx = np.mgrid[0:h, 0:w] / max(h, w)
    spot = np.exp(-(((xx - 0.5) / 0.55) ** 2 + ((yy - 0.42) / 0.55) ** 2))
    out = out * (0.8 + 0.28 * spot[..., None])
    im = Image.fromarray((np.clip(out, 0, 1) * 255).astype("uint8"))
    return im.filter(ImageFilter.UnsharpMask(radius=1.3, percent=60, threshold=2))


def main() -> None:
    force = "--force" in sys.argv
    OUT.mkdir(exist_ok=True)
    done = skipped = 0
    for src in sorted(SRC.glob("*-*.webp")):
        dest = OUT / src.name
        if dest.exists() and not force:
            skipped += 1
            continue
        studio(Image.open(src)).save(dest, "WEBP", quality=82, method=6)
        done += 1
    print(f"Made {done} studio images in {OUT.relative_to(ROOT)} ({skipped} already there).")


if __name__ == "__main__":
    main()
