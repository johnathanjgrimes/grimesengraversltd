#!/usr/bin/env python3
"""Collect extra details for each award in src/data/awards.json from its Logo Crystal page:
the weight (a plain fact we can show) and the supplier's own description (kept locally for
reference only; the site uses its own generated descriptions, see describe() in src/lib/awards.ts).

    python3 scripts/enrich-awards.py

Output: data/logocrystal/award-details.json (not committed). build-awards.py merges the weight in.
"""
import html, importlib.util, json, re, time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
AWARDS = ROOT / 'src' / 'data' / 'awards.json'
OUT = ROOT / 'data' / 'logocrystal' / 'award-details.json'

spec = importlib.util.spec_from_file_location('scraper', Path(__file__).with_name('scrape-logocrystal.py'))
scraper = importlib.util.module_from_spec(spec)
spec.loader.exec_module(scraper)


def main():
    awards = json.loads(AWARDS.read_text())
    details = json.loads(OUT.read_text()) if OUT.exists() else {}
    todo = [a for a in awards if a.get('source_url') and a['sku'] not in details]
    print(f'{len(todo)} awards to fetch ({len(details)} already done)')
    for i, a in enumerate(todo, 1):
        page = scraper.get(a['source_url'])
        time.sleep(scraper.DELAY)
        if not page:
            continue
        desc = re.search(r'<meta name="description" content="([^"]*)"', page)
        weight = re.search(r'Weight:\s*([\d.]+)\s*kg', page)
        details[a['sku']] = {
            'weight_kg': float(weight.group(1)) if weight else None,
            'supplier_description': html.unescape(desc.group(1)).strip() if desc else '',
        }
        if i % 50 == 0:
            OUT.write_text(json.dumps(details, indent=1, ensure_ascii=False) + '\n')
            print(f'  {i}/{len(todo)}')
    OUT.write_text(json.dumps(details, indent=1, ensure_ascii=False) + '\n')
    print(f'done: {len(details)} awards -> {OUT.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
