#!/usr/bin/env python3
"""Bench plaque proofs, in the style Grimes sends customers.

Default ("grimes" style, matching our real proofs): the page is the plaque at true size,
white, with a thin black outline 1.5 mm in, 4 mm screw holes 10.5 mm in from each edge,
and the wording in Helvetica, black, centred, as large as fits.

  python3 scripts/plaque_proof.py 263x66 "Dedicated to The Force of Glyn." "Talented, unique, brave and…" "…forever FABULOUS 1973-2026"
  python3 scripts/plaque_proof.py 8x3 "In loving memory of" "Margaret Jones" "1938 – 2024"
  python3 scripts/plaque_proof.py 7x5 --style preview --metal steel --font script --emblem heart "Forever in our hearts" "Tom"

Size: a website size (8x3, 6x4, 7x5, 10x5, 8x6, a4, in inches) or any size in mm, e.g. 263x66.
Options: --fixing screws|adhesive  --border  --font helvetica|roman|italic|script|capitals|modern|gothic  --emblem none|cross|heart|star|paw|flower
         --style grimes|preview (preview = coloured brass/steel picture with notes, for showing customers the finish)
Saves a PDF (print at 100% for true size) and a PNG preview to proofs/ (git-ignored).
Needs: pip3 install pymupdf
"""
import argparse, json, os, re, sys, datetime, urllib.request
import pymupdf

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(REPO, 'src', 'data')
OUT = os.path.expanduser(os.environ.get('GRIMES_PROOFS', os.path.join(REPO, 'proofs')))
FONTS = os.path.join(REPO, 'fonts')
MM = 72 / 25.4
GF = 'https://raw.githubusercontent.com/google/fonts/main/ofl/'
FONT_FILES = {  # the website's plaque fonts (downloaded once); 'helvetica' is built in
    'roman': ('LibreBaskerville.ttf', 'librebaskerville/LibreBaskerville%5Bwght%5D.ttf'),
    'italic': ('CormorantGaramond-Italic.ttf', 'cormorantgaramond/CormorantGaramond-Italic%5Bwght%5D.ttf'),
    'script': ('PinyonScript-Regular.ttf', 'pinyonscript/PinyonScript-Regular.ttf'),
    'capitals': ('Cinzel.ttf', 'cinzel/Cinzel%5Bwght%5D.ttf'),
    'modern': ('Montserrat.ttf', 'montserrat/Montserrat%5Bwght%5D.ttf'),
    'gothic': ('UnifrakturMaguntia-Book.ttf', 'unifrakturmaguntia/UnifrakturMaguntia-Book.ttf'),
}
# Our standard proof layout, measured from a real Grimes proof (263 x 66 mm).
OUTLINE_IN, LINE_W = 1.5, 0.6          # mm in from the edge; line width in pt
HOLE_D, HOLE_IN = 4.0, 10.5            # hole diameter; centre distance from each edge (mm)
LEADING = 1.28

def hexrgb(h):
    h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))

def get_font(fid):
    if fid == 'helvetica': return pymupdf.Font('helv')
    if fid not in FONT_FILES: sys.exit(f"Unknown font {fid}. Choose from: helvetica, {', '.join(FONT_FILES)}")
    name, url = FONT_FILES[fid]; p = os.path.join(FONTS, name)
    if not os.path.exists(p):
        os.makedirs(FONTS, exist_ok=True); print(f'Downloading font {name}…'); urllib.request.urlretrieve(GF + url, p)
    return pymupdf.Font(fontfile=p)

def plaque_size(size):
    """(width_mm, height_mm, label) from a website size id, or 'WxH' in mm."""
    plaque = json.load(open(os.path.join(DATA, 'plaque.json'), encoding='utf-8'))
    s = next((s for s in plaque['sizes'] if s['id'] == size.lower()), None)
    if s: return s['w'] * 25.4, s['h'] * 25.4, f"{s['name']} ({s['mm']})"
    m = re.fullmatch(r'\s*(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*(mm)?\s*', size.lower())
    if m: return float(m.group(1)), float(m.group(2)), f'{m.group(1)} x {m.group(2)}mm'
    sys.exit(f"Unknown size {size}. Use a website size ({', '.join(s['id'] for s in plaque['sizes'])}) or mm, e.g. 263x66")

def make(size, lines, metal='brass', font_id='helvetica', emblem='none', corners='square', fixing='screws', border=False,
         style='grimes', max_pt=None, out_name=None, dry=False):
    wmm, hmm, label = plaque_size(size)
    W, H = wmm * MM, hmm * MM
    grimes = style != 'preview'
    if grimes:
        doc = pymupdf.open(); page = doc.new_page(width=W, height=H)  # the page IS the plaque
        plate = pymupdf.Rect(0, 0, W, H)
        ink, edge, fill = (0, 0, 0), (0, 0, 0), None
        page.draw_rect(pymupdf.Rect(OUTLINE_IN * MM, OUTLINE_IN * MM, W - OUTLINE_IN * MM, H - OUTLINE_IN * MM), color=edge, width=LINE_W)
    else:
        mats = json.load(open(os.path.join(DATA, 'font.json'), encoding='utf-8'))['mats']
        mat = next((m for m in mats if m['id'] == metal), None) or sys.exit(f"Unknown metal {metal}")
        pw, ph = (420 * MM, 297 * MM) if wmm > 250 else (297 * MM, 210 * MM)
        doc = pymupdf.open(); page = doc.new_page(width=pw, height=ph)
        plate = pymupdf.Rect((pw - W) / 2, (ph - H) / 2 - 8 * MM, (pw + W) / 2, (ph + H) / 2 - 8 * MM)
        ink, edge, fill = hexrgb(mat['ink']), hexrgb(mat['edge']), hexrgb(mat['bg'])
        r = 6 * MM if corners == 'rounded' else 0
        page.draw_rect(plate, color=edge, fill=fill, width=1.2, radius=(r / min(W, H)) if r else None)

    if border:
        b = pymupdf.Rect(plate.x0 + 4 * MM, plate.y0 + 4 * MM, plate.x1 - 4 * MM, plate.y1 - 4 * MM)
        page.draw_rect(b, color=ink, width=0.9)
    if fixing == 'screws':
        for x in (plate.x0 + HOLE_IN * MM, plate.x1 - HOLE_IN * MM):
            for y in (plate.y0 + HOLE_IN * MM, plate.y1 - HOLE_IN * MM):
                page.draw_circle((x, y), HOLE_D / 2 * MM, color=edge, width=LINE_W, fill=None if grimes else (1, 1, 1))

    # Safe area for the wording, matching our proofs: well clear of the holes at the sides
    # (about 20 mm from each side edge) and about 6.5 mm above and below.
    side = (HOLE_IN + HOLE_D / 2 + 8) * MM if fixing == 'screws' else 10 * MM
    vpad = (OUTLINE_IN + 5) * MM + (4 * MM if border else 0)
    safe = pymupdf.Rect(plate.x0 + side, plate.y0 + vpad, plate.x1 - side, plate.y1 - vpad)

    if emblem != 'none':
        plaque = json.load(open(os.path.join(DATA, 'plaque.json'), encoding='utf-8'))
        em = next((e for e in plaque['emblems'] if e['id'] == emblem and e.get('svg')), None) or sys.exit(f'Unknown emblem {emblem}')
        e = min(14 * MM, safe.height * 0.28)
        col = '#%02x%02x%02x' % tuple(int(c * 255) for c in ink)
        svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="240" height="240"><g fill="{col}">{em["svg"]}</g></svg>'
        pdf = pymupdf.open('pdf', pymupdf.open(stream=svg.encode(), filetype='svg').convert_to_pdf())
        er = pymupdf.Rect((plate.x0 + plate.x1 - e) / 2, safe.y0, (plate.x0 + plate.x1 + e) / 2, safe.y0 + e)
        page.show_pdf_page(er, pdf, 0); safe.y0 = er.y1 + 2 * MM

    font = get_font(font_id)
    page.insert_font(fontname='w', fontbuffer=font.buffer)
    asc, desc = font.ascender, -font.descender  # in em units
    pt = max_pt or 72
    def fits(p):
        block = p * LEADING * (len(lines) - 1) + p * (asc + desc)
        return max(font.text_length(l, fontsize=p) for l in lines) <= safe.width and block <= safe.height
    while pt >= 5 and not fits(pt): pt -= 0.25
    if dry: return pt
    if pt < 5: sys.exit(f'The wording is too long for a {label} plaque. Shorten it, or choose a bigger size.')
    block = pt * LEADING * (len(lines) - 1) + pt * (asc + desc)
    y = safe.y0 + (safe.height - block) / 2 + pt * asc  # first baseline, block centred vertically
    for l in lines:
        page.insert_text(((plate.x0 + plate.x1 - font.text_length(l, fontsize=pt)) / 2, y), l, fontname='w', fontsize=pt, color=ink)
        y += pt * LEADING

    if not grimes:
        cap = pt * 0.7 / MM
        notes = [f'PROOF  |  Grimes Engravers  |  {label}  |  {metal}  |  {corners} corners  |  {"border" if border else "no border"}  |  {"screw holes" if fixing == "screws" else "adhesive"}',
                 f'Font: {font_id}  |  {pt:.1f}pt (capitals about {cap:.1f} mm tall)  |  {datetime.date.today():%d %b %Y}  |  Print at 100% (actual size).']
        yy = plate.y1 + 12 * MM
        for n in notes: page.insert_text((24 * MM, yy), n, fontsize=8.5, color=(0.35, 0.35, 0.35)); yy += 5 * MM

    os.makedirs(OUT, exist_ok=True)
    name = out_name or f"Proof_{re.sub(r'[^A-Za-z0-9]+', '_', ' '.join(lines[0].split()[:4])).strip('_')}_plaque"
    path = os.path.join(OUT, name + '.pdf')
    doc.save(path)
    pad = 0 if grimes else 20
    page.get_pixmap(dpi=150, clip=pymupdf.Rect(plate.x0 - pad, plate.y0 - pad, plate.x1 + pad, plate.y1 + pad)).save(os.path.join(OUT, name + '.png'))
    return path, pt

def main():
    ap = argparse.ArgumentParser(description='Bench plaque proof')
    ap.add_argument('size', help='Website size (8x3, 6x4, 7x5, 10x5, 8x6, a4) or mm, e.g. 263x66')
    ap.add_argument('lines', nargs='*', help='Wording, one argument per line')
    ap.add_argument('--lines-file'); ap.add_argument('--style', default='grimes', choices=['grimes', 'preview'])
    ap.add_argument('--font', default='helvetica'); ap.add_argument('--metal', default='brass'); ap.add_argument('--emblem', default='none')
    ap.add_argument('--corners', default='square', choices=['rounded', 'square']); ap.add_argument('--fixing', default='screws', choices=['screws', 'adhesive'])
    ap.add_argument('--border', action='store_true'); ap.add_argument('--max-pt', type=float)
    a = ap.parse_intermixed_args()
    lines = [l.strip() for l in open(a.lines_file, encoding='utf-8') if l.strip()] if a.lines_file else a.lines
    if not lines: ap.error('give the wording as arguments, or --lines-file')
    path, pt = make(a.size, lines, a.metal, a.font, a.emblem, a.corners, a.fixing, a.border, a.style, a.max_pt)
    print(f'{path}  ({pt:.1f}pt)')

if __name__ == '__main__':
    main()
