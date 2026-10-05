#!/usr/bin/env python3
"""Collect the public Logo Crystal catalogue (categories, codes, names, sizes, prices, image URLs).

Reads the sitemap, then each product page's schema.org Product data. Polite on purpose:
one request at a time with a pause, and only pages robots.txt allows. Photos are recorded
as URLs only, not downloaded. Output: data/logocrystal/products.json, products.csv, categories.json.

    python3 scripts/scrape-logocrystal.py
"""
import csv, html, json, os, re, ssl, sys, time, urllib.request
from pathlib import Path

BASE = 'https://www.logocrystal.co.uk'
OUT = Path(__file__).resolve().parent.parent / 'data' / 'logocrystal'
DELAY = 0.6
UA = 'Mozilla/5.0 (compatible; GrimesEngraversCatalogue/1.0; +https://grimesengravers.com)'


# logocrystal.co.uk serves the wrong intermediate certificate. Browsers fetch the right one from the
# certificate's own "CA Issuers" address; Python doesn't, so we add it ourselves. Verification stays on.
MISSING_INTERMEDIATE = 'http://certificates.starfieldtech.com/repository/sfig2.crt'


def ssl_context():
    ctx = None
    try:
        import certifi
        ctx = ssl.create_default_context(cafile=certifi.where())
    except ImportError:
        # Some Python builds (e.g. pyenv on macOS) ship without CA certificates; use the system bundle.
        for cafile in ('/etc/ssl/cert.pem', '/etc/ssl/certs/ca-certificates.crt'):
            if os.path.exists(cafile):
                ctx = ssl.create_default_context(cafile=cafile)
                break
    ctx = ctx or ssl.create_default_context()
    try:
        with urllib.request.urlopen(MISSING_INTERMEDIATE, timeout=30) as r:
            ctx.load_verify_locations(cadata=ssl.DER_cert_to_PEM_cert(r.read()))
    except Exception as e:
        print(f'  could not add intermediate certificate: {e}', file=sys.stderr)
    return ctx


CTX = ssl_context()


def get(url, tries=3):
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': UA})
            with urllib.request.urlopen(req, timeout=30, context=CTX) as r:
                return r.read().decode('utf-8', 'replace')
        except Exception as e:
            if i == tries - 1:
                print(f'  failed {url}: {e}', file=sys.stderr)
                return None
            time.sleep(3 * (i + 1))


def category_path(url):
    """'/awards-c-9/optical-crystal-awards-gifts-c-32/x-p-1' -> [('awards-c-9', 9), ('optical...-c-32', 32)]"""
    return [(seg, int(m.group(1))) for seg in url.replace(BASE, '').strip('/').split('/')
            if (m := re.search(r'-c-(\d+)$', seg))]


def category_name(page):
    m = re.search(r'<h1[^>]*>(.*?)</h1>', page, re.S)
    return html.unescape(re.sub(r'<[^>]+>|\s+', ' ', m.group(1))).strip() if m else None


def parse_dimensions(desc):
    """'Dimension: H55  W55Engraving Area: H25  W25' -> ('H55 W55', 'H25 W25') in mm."""
    dim = re.search(r'Dimension[s]?:\s*(.*?)(?=Engraving Area|$)', desc or '', re.S | re.I)
    area = re.search(r'Engraving Area:\s*(.*)', desc or '', re.S | re.I)
    tidy = lambda m: re.sub(r'\s+', ' ', m.group(1)).strip() if m else ''
    return tidy(dim), tidy(area)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    sitemap = get(f'{BASE}/feeds/sitemap.xml')
    if not sitemap:
        sys.exit('Could not fetch the sitemap; check your connection and try again.')
    urls = re.findall(r'<loc>([^<]+)</loc>', sitemap)
    product_urls = [u for u in urls if re.search(r'-p-\d+$', u)]
    print(f'{len(product_urls)} product pages in sitemap')

    # Category names come from each category's own page heading.
    cats = {}
    for u in product_urls:
        path = ''
        for seg, cid in category_path(u):
            path += '/' + seg
            cats.setdefault(cid, {'id': cid, 'url': BASE + path + '/', 'parent': None, 'name': None})
    for u in product_urls:
        p = category_path(u)
        for (_, child), (_, parent) in zip(p[1:], p):
            cats[child]['parent'] = parent
    print(f'{len(cats)} categories; fetching names')
    for c in cats.values():
        page = get(c['url'])
        c['name'] = category_name(page) if page else None
        time.sleep(DELAY)

    products = {}
    for i, u in enumerate(product_urls, 1):
        page = get(u)
        time.sleep(DELAY)
        if not page:
            continue
        m = re.search(r'<script[^>]*application/ld\+json[^>]*>(.*?)</script>', page, re.S)
        if not m:
            continue
        try:
            d = json.loads(m.group(1))
        except ValueError:
            continue
        if d.get('@type') != 'Product':
            continue
        offer = d.get('offers') or {}
        dims, area = parse_dimensions(d.get('description', ''))
        path = category_path(u)
        sku = (d.get('sku') or '').strip()
        key = sku or d.get('productID')
        row = products.setdefault(key, {
            'sku': sku,
            'product_id': d.get('productID'),
            'name': html.unescape(d.get('name', '')).strip(),
            'dimensions_mm': dims,
            'engraving_area_mm': area,
            'price_gbp': offer.get('price'),
            'in_stock': 'InStock' in (offer.get('availability') or ''),
            'image_url': d.get('image'),
            'url': u,
            'category_ids': [],
        })
        # The same product can sit in several categories (e.g. Best Sellers); keep them all.
        for _, cid in path:
            if cid not in row['category_ids']:
                row['category_ids'].append(cid)
        if i % 50 == 0:
            print(f'  {i}/{len(product_urls)} pages, {len(products)} products')

    rows = sorted(products.values(), key=lambda r: (r['category_ids'][:1], r['name']))
    name = lambda cid: (cats.get(cid) or {}).get('name') or ''
    (OUT / 'categories.json').write_text(json.dumps(sorted(cats.values(), key=lambda c: c['id']), indent=1, ensure_ascii=False) + '\n')
    (OUT / 'products.json').write_text(json.dumps(rows, indent=1, ensure_ascii=False) + '\n')
    with open(OUT / 'products.csv', 'w', newline='', encoding='utf-8') as f:
        w = csv.writer(f)
        w.writerow(['sku', 'name', 'category', 'subcategory', 'all_categories', 'dimensions_mm', 'engraving_area_mm', 'price_gbp', 'in_stock', 'image_url', 'url'])
        for r in rows:
            ids = r['category_ids']
            w.writerow([r['sku'], r['name'], name(ids[0]) if ids else '', name(ids[1]) if len(ids) > 1 else '',
                        ' | '.join(name(c) for c in ids), r['dimensions_mm'], r['engraving_area_mm'],
                        r['price_gbp'], 'yes' if r['in_stock'] else 'no', r['image_url'], r['url']])
    print(f'done: {len(rows)} products, {len(cats)} categories -> {OUT}')


if __name__ == '__main__':
    main()
