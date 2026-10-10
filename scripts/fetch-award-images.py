#!/usr/bin/env python3
"""Download each award photo from the supplier once and save small WebP copies on our site:

    public/assets/awards/<SKU>-480.webp    catalogue cards, basket and similar awards
    public/assets/awards/<SKU>-1000.webp   the award page

    python3 scripts/fetch-award-images.py          # only awards without a local copy yet
    python3 scripts/fetch-award-images.py --force  # download them all again

Awards whose photo can't be downloaded keep using the supplier's photo (src/lib/awards.ts checks
which local copies exist), and pages fall back to the supplier's photo if a local one fails to load.
"""
import argparse, io, json, time, urllib.request, importlib.util
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
AWARDS = ROOT / 'src' / 'data' / 'awards.json'
OUT = ROOT / 'public' / 'assets' / 'awards'
SIZES = (480, 1000)

spec = importlib.util.spec_from_file_location('scraper', Path(__file__).with_name('scrape-logocrystal.py'))
scraper = importlib.util.module_from_spec(spec)
spec.loader.exec_module(scraper)


def download(url, tries=3):
    for n in range(tries):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': scraper.UA})
            with urllib.request.urlopen(req, timeout=30, context=scraper.CTX) as r:
                return r.read()
        except Exception as e:
            if n == tries - 1:
                print(f'  failed {url}: {e}')
            time.sleep(1 + n)
    return None


def save(sku, data):
    img = Image.open(io.BytesIO(data)).convert('RGB')
    for size in SIZES:
        copy = img.copy()
        copy.thumbnail((size, size), Image.LANCZOS)  # never enlarges
        copy.save(OUT / f'{sku}-{size}.webp', 'WEBP', quality=80, method=6)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--force', action='store_true')
    args = ap.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    awards = json.loads(AWARDS.read_text())
    todo = [a for a in awards if a.get('image', '').startswith('http') and (args.force or not all((OUT / f"{a['sku']}-{s}.webp").exists() for s in SIZES))]
    print(f'{len(todo)} photos to fetch ({len(awards) - len(todo)} already local)')
    failed = []
    for i, a in enumerate(todo, 1):
        data = download(a['image'])
        time.sleep(scraper.DELAY)
        try:
            if not data:
                raise ValueError('no data')
            save(a['sku'], data)
        except Exception as e:
            failed.append(a['sku'])
            print(f"  {a['sku']}: {e}")
        if i % 50 == 0:
            print(f'  {i}/{len(todo)}')
    print(f'done: {len(todo) - len(failed)} saved, {len(failed)} left on the supplier photo {failed if failed else ""}')


if __name__ == '__main__':
    main()
