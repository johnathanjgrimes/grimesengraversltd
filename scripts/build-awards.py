#!/usr/bin/env python3
"""Build src/data/awards.json (the site's glass awards catalogue) from the Logo Crystal data.

    python3 scripts/build-awards.py              # from data/logocrystal/products.json (run the scraper first)
    python3 scripts/build-awards.py --sample 3   # quick test: fetch 3 awards per range straight from the site

Only the glass and crystal award ranges in RANGES are included. Prices are the public "from" prices.
"""
import argparse, importlib.util, json, re, sys, time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'src' / 'data' / 'awards.json'
SOURCE = ROOT / 'data' / 'logocrystal' / 'products.json'
DETAILS = ROOT / 'data' / 'logocrystal' / 'award-details.json'

# Logo Crystal award subcategory id -> range name shown on our site. Order = order on the catalogue.
RANGES = {
    32: 'Optical crystal awards',
    35: 'Star awards',
    36: 'Globe awards',
    37: 'Sports awards',
    38: '3D laser crystal awards',
    39: 'Crystal awards on bases',
    40: 'Jade & clear glass awards',
}

spec = importlib.util.spec_from_file_location('scraper', Path(__file__).with_name('scrape-logocrystal.py'))
scraper = importlib.util.module_from_spec(spec)
spec.loader.exec_module(scraper)


def to_award(p, range_id):
    return {
        'sku': p['sku'],
        'name': p['name'],
        'range': RANGES[range_id],
        'dimensions_mm': p.get('dimensions_mm', ''),
        'engraving_area_mm': p.get('engraving_area_mm', ''),
        'price_from': float(p['price_gbp']) if p.get('price_gbp') not in (None, '') else None,
        'image': p.get('image_url') or '',
        'in_stock': bool(p.get('in_stock')),
        'source_url': p['url'],
    }


def from_scrape():
    if not SOURCE.exists():
        sys.exit(f'{SOURCE} not found: run python3 scripts/scrape-logocrystal.py first, or use --sample.')
    out = []
    for p in json.loads(SOURCE.read_text()):
        rid = next((c for c in p.get('category_ids', []) if c in RANGES), None)
        if rid and p.get('sku'):
            out.append(to_award(p, rid))
    return out


def sample(per_range):
    sitemap = scraper.get(f'{scraper.BASE}/feeds/sitemap.xml')
    urls = re.findall(r'<loc>([^<]+-p-\d+)</loc>', sitemap or '')
    out = []
    for rid in RANGES:
        picks = [u for u in urls if re.search(rf'/awards-c-9/[^/]+-c-{rid}/', u)][:per_range]
        for u in picks:
            page = scraper.get(u)
            time.sleep(scraper.DELAY)
            m = page and re.search(r'<script[^>]*application/ld\+json[^>]*>(.*?)</script>', page, re.S)
            if not m:
                continue
            d = json.loads(m.group(1))
            dims, area = scraper.parse_dimensions(d.get('description', ''))
            offer = d.get('offers') or {}
            out.append(to_award({'sku': (d.get('sku') or '').strip(), 'name': d.get('name', '').strip(), 'dimensions_mm': dims,
                                 'engraving_area_mm': area, 'price_gbp': offer.get('price'), 'image_url': d.get('image'),
                                 'in_stock': 'InStock' in (offer.get('availability') or ''), 'url': u}, rid))
        print(f'  {RANGES[rid]}: {len(picks)}')
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--sample', type=int, metavar='N', help='fetch N awards per range directly instead of using the scrape')
    args = ap.parse_args()
    awards = sample(args.sample) if args.sample else from_scrape()
    # Skip anything we can't show properly; one entry per product code.
    seen, clean = set(), []
    for a in awards:
        if a['sku'] and a['price_from'] and a['sku'] not in seen:
            seen.add(a['sku'])
            clean.append(a)
    # Weights from scripts/enrich-awards.py, when it has been run.
    details = json.loads(DETAILS.read_text()) if DETAILS.exists() else {}
    for a in clean:
        w = details.get(a['sku'], {}).get('weight_kg')
        if w:
            a['weight_kg'] = w
    order = {name: i for i, name in enumerate(RANGES.values())}
    clean.sort(key=lambda a: (order[a['range']], a['price_from']))
    OUT.write_text('[\n' + ',\n'.join(' ' + json.dumps(a, ensure_ascii=False) for a in clean) + '\n]\n')
    print(f'{len(clean)} awards -> {OUT.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
