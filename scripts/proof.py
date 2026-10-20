#!/usr/bin/env python3
"""Text-only engraving proofs on Crystal Galleries templates.

Finds the red dashed engraving area on a supplier template (true-to-size A4 PDF),
fits the wording inside it (centred, largest size that fits, with a safety margin),
and saves a proof PDF plus a PNG preview.

  python3 scripts/proof.py SY5067 "Employee of the Year 2026" "Sarah Jones" "Medical Clinical Board"
  python3 scripts/proof.py DY16 "Long Service" "25 Years" --area 2      # use the 2nd-largest area
  python3 scripts/proof.py SY5067 --lines-file names.txt                  # one proof per block of lines

Templates live in the repo's supplier-templates/ folder (git-ignored, fetched by scripts/fetch-templates.sh)
so the supplier's artwork is never pushed or published. Proofs go to proofs/ (also git-ignored).
Needs: pip3 install pymupdf
"""
import argparse, os, sys, datetime
import pymupdf

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMPLATES = os.path.expanduser(os.environ.get('GRIMES_TEMPLATES', os.path.join(REPO, 'supplier-templates')))
OUT = os.path.expanduser(os.environ.get('GRIMES_PROOFS', os.path.join(REPO, 'proofs')))
MM = 72 / 25.4

def red_areas(page):
    """Red (dashed) outlines = engraving areas, largest first. Keeps each outline's edges so text can follow the shape."""
    areas = []
    for d in page.get_drawings():
        c = d.get('color')
        if c and c[0] > 0.6 and c[1] < 0.4 and c[2] < 0.4:
            r = d['rect']
            if r.width > 10 and r.height > 10:
                R = pymupdf.Rect(r)
                pts = []
                for it in d['items']:
                    if it[0] == 'l': pts += [it[1], it[2]]
                    elif it[0] == 're': q = it[1]; pts += [q.tl, q.tr, q.br, q.bl, q.tl]
                    elif it[0] == 'qu': q = it[1]; pts += [q.ul, q.ur, q.lr, q.ll, q.ul]
                    elif it[0] == 'c': pts += [it[1], it[4]]
                R.edges = [(pts[i], pts[i + 1]) for i in range(0, len(pts) - 1, 2)] if pts else []
                areas.append(R)
    # Drop duplicates (some templates draw the same box twice).
    uniq = []
    for r in areas:
        r.edges = getattr(r, 'edges', [])
        if not any(abs(r.x0 - u.x0) < 1 and abs(r.y0 - u.y0) < 1 and abs(r.x1 - u.x1) < 1 and abs(r.y1 - u.y1) < 1 for u in uniq):
            uniq.append(r)
    return sorted(uniq, key=lambda r: r.width * r.height, reverse=True)

def span_at(area, y, inset):
    """Left/right limits of the engraving shape at height y, moved in by the safety margin."""
    xs = []
    for a, b in getattr(area, 'edges', []):
        if (a.y - y) * (b.y - y) <= 0 and a.y != b.y:
            xs.append(a.x + (y - a.y) * (b.x - a.x) / (b.y - a.y))
    if len(xs) < 2:
        return area.x0 + inset, area.x1 - inset
    return min(xs) + inset, max(xs) - inset

def layout(lines, area, box, font, pt, leading, inset):
    """Baselines and x positions for each line, or None if any line breaks out of the shape."""
    block_h = pt * leading * len(lines)
    if block_h > box.height: return None
    top = box.y0 + (box.height - block_h) / 2
    placed = []
    for i, l in enumerate(lines):
        w = font.text_length(l, fontsize=pt)
        y_top, y_base = top + i * pt * leading, top + i * pt * leading + pt
        (l1, r1), (l2, r2) = span_at(area, y_top, inset), span_at(area, y_base, inset)
        left, right = max(l1, l2), min(r1, r2)  # the narrower of the line's top and bottom
        if w > right - left: return None
        placed.append((left + (right - left - w) / 2, y_base, l))
    return placed

def make_proof(code, lines, area_no=1, font_file=None, margin_mm=3.0, max_pt=36, colour=(0.15, 0.15, 0.2), out_name=None, dry=False):
    src = os.path.join(TEMPLATES, code + '.pdf')
    if not os.path.exists(src):
        sys.exit(f'No template for {code}: expected {src}')
    doc = pymupdf.open(src)
    page = doc[0]
    areas = red_areas(page)
    if not areas:
        sys.exit(f'{code}: no red engraving area found in the template')
    if area_no > len(areas):
        sys.exit(f'{code}: only {len(areas)} engraving area(s) found')
    area = areas[area_no - 1]
    # Remove the supplier's red instruction text inside the engraving areas (e.g. "Engraving Area: 125mm x 80mm"),
    # keeping the outlines and everything else exactly as drawn.
    for blk in page.get_text('dict')['blocks']:
        for ln in blk.get('lines', []):
            for sp in ln['spans']:
                c = sp['color']; r, g, b = (c >> 16) & 255, (c >> 8) & 255, c & 255
                rect = pymupdf.Rect(sp['bbox'])
                if r > 150 and g < 110 and b < 110 and any(a.intersects(rect) for a in areas):
                    page.add_redact_annot(rect)
    page.apply_redactions(images=pymupdf.PDF_REDACT_IMAGE_NONE, graphics=pymupdf.PDF_REDACT_LINE_ART_NONE)
    box = pymupdf.Rect(area.x0 + margin_mm * MM, area.y0 + margin_mm * MM, area.x1 - margin_mm * MM, area.y1 - margin_mm * MM)

    fontname = 'proof'
    font = pymupdf.Font(fontfile=font_file) if font_file else pymupdf.Font('tiro')  # Times-style serif ("Classic Roman")
    page.insert_font(fontname=fontname, fontbuffer=font.buffer)
    leading = 1.25
    inset = margin_mm * MM
    pt, placed = max_pt, None
    while pt >= 4:
        placed = layout(lines, area, box, font, pt, leading, inset)
        if placed: break
        pt -= 0.25
    if dry:
        return None, pt, area
    if not placed:
        sys.exit(f'{code}: the wording is too long to fit the engraving area ({area.width/MM:.0f} x {area.height/MM:.0f} mm). Shorten it or use fewer words per line.')

    # Block centred vertically; each line centred within the shape at its own height.
    for x, y, l in placed:
        page.insert_text((x, y), l, fontname=fontname, fontsize=pt, color=colour)

    # Proof stamp at the foot of the page.
    stamp = f'PROOF  |  Grimes Engravers  |  {code}  |  engraving area {area.width/MM:.0f} x {area.height/MM:.0f} mm  |  text {pt:.1f}pt (cap height approx {pt*0.66/MM:.1f} mm)  |  {datetime.date.today():%d %b %Y}  |  print at 100% for true size'
    page.insert_text((28, page.rect.height - 24), stamp, fontsize=7, color=(0.4, 0.4, 0.4))

    os.makedirs(OUT, exist_ok=True)
    name = out_name or f"{code}-{'-'.join(lines[0].split())[:40]}"
    pdf_path = os.path.join(OUT, name + '.pdf')
    doc.save(pdf_path)
    # Preview: just the engraving area and a little around it, at a readable size.
    clip = pymupdf.Rect(area.x0 - 40, area.y0 - 40, area.x1 + 40, area.y1 + 40) & page.rect
    page.get_pixmap(dpi=200, clip=clip).save(os.path.join(OUT, name + '.png'))
    return pdf_path, pt, area

def main():
    ap = argparse.ArgumentParser(description='Text-only engraving proof on a supplier template')
    ap.add_argument('code', help='Product code, e.g. SY5067')
    ap.add_argument('lines', nargs='*', help='Wording, one argument per line')
    ap.add_argument('--lines-file', help='Text file: blocks of lines separated by a blank line, one proof per block (e.g. one per winner)')
    ap.add_argument('--area', type=int, default=1, help='Which engraving area (1 = largest)')
    ap.add_argument('--font', help='Path to a .ttf/.otf font (default: Times-style serif)')
    ap.add_argument('--margin', type=float, default=3.0, help='Safety margin inside the area, in mm (default 3)')
    ap.add_argument('--max-pt', type=float, default=36, help='Largest text size in points (default 36)')
    a = ap.parse_args()
    blocks = []
    if a.lines_file:
        cur = []
        for raw in open(a.lines_file, encoding='utf-8'):
            t = raw.rstrip('\n')
            if t.strip(): cur.append(t.strip())
            elif cur: blocks.append(cur); cur = []
        if cur: blocks.append(cur)
    elif a.lines:
        blocks = [a.lines]
    else:
        ap.error('give the wording as arguments, or --lines-file')
    max_pt = a.max_pt
    if len(blocks) > 1:
        # A matching set: every award uses the size that fits the longest wording.
        max_pt = min(make_proof(a.code.upper(), b, a.area, a.font, a.margin, a.max_pt, dry=True)[1] for b in blocks)
    for i, b in enumerate(blocks, 1):
        path, pt, area = make_proof(a.code.upper(), b, a.area, a.font, a.margin, max_pt, out_name=f'{a.code.upper()}-{i:02d}' if len(blocks) > 1 else None)
        print(f'{path}  ({pt:.1f}pt in {area.width/MM:.0f} x {area.height/MM:.0f} mm)')

if __name__ == '__main__':
    main()
