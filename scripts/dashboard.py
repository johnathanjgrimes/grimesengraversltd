#!/usr/bin/env python3
"""Grimes dashboard (runs only on this Mac).

  python3 scripts/dashboard.py        then open http://localhost:8765

One place for:
  Overview       headline numbers and anything due today
  Proofs         text proofs on supplier templates (glass awards) and true-size bench plaque proofs
  Options links  build a stock-checked "suggested options" link for a customer, and list existing ones
  Outreach       the outreach tracker (private/outreach-tracker.csv): add people, update status
  Website        PostHog numbers: visitors, sources, orders and the suggested-options funnel

Private data (outreach list, PostHog key, proofs, supplier templates) stays in git-ignored folders.
Website stats need a PostHog personal API key, saved once in private/posthog.key (see the Website tab).
"""
import csv, datetime, html, json, os, re, shutil, subprocess, sys, urllib.parse, urllib.request, webbrowser, base64, hmac, hashlib, getpass, argparse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
DATA = os.path.join(REPO, 'src', 'data')
PRIVATE = os.path.join(REPO, 'private')
sys.path.insert(0, HERE)
import proof  # noqa: E402
import plaque_proof  # noqa: E402

PORT = 8765
SITE = 'https://grimesengravers.com'
ENGRAVING, SETUP, BULK = 10.50, 40.00, 20  # keep in line with public/js/basket.js
PH_HOST, PH_PROJECT = 'https://eu.posthog.com', '294611'
OUTREACH = os.path.join(PRIVATE, 'outreach-tracker.csv')
OUT_COLS = ['Date sent', 'Name', 'Role', 'Organisation', 'Sector', 'Channel', 'Connection degree', 'Personal note', 'Status',
            'Accepted date', 'Follow-up sent date', 'Replied?', 'Visited website?', 'Outcome', 'Next action', 'Next action date']
STATUSES = ['Planned', 'Pending', 'Accepted', 'Followed up', 'Replied', 'Enquiry', 'Order', 'Not now', 'Ignored', 'Withdrawn']

def esc(s): return html.escape(str(s if s is not None else ''))
def gbp(n): return f'£{n:,.2f}'
def load(name): return json.load(open(os.path.join(DATA, name), encoding='utf-8'))

# ---------- shared bits ----------
CSS = """
:root{--ink:#1F2933;--muted:#6B7280;--line:#E5E7EB;--navy:#23263A;--bg:#F3F4F6;--card:#fff;--ok:#166534;--bad:#991B1B;--warn:#8A4B00;--pill:#EEF2FF}
@media (prefers-color-scheme: dark){:root{--ink:#E5E7EB;--muted:#9CA3AF;--line:#374151;--navy:#C7D2FE;--bg:#111827;--card:#1F2937;--ok:#86EFAC;--bad:#FCA5A5;--warn:#FCD34D;--pill:#312E81}}
*{box-sizing:border-box} body{margin:0;font:15px/1.5 system-ui,-apple-system,sans-serif;background:var(--bg);color:var(--ink)}
header{background:var(--card);border-bottom:1px solid var(--line);position:sticky;top:0;z-index:5}
header .in{max-width:1200px;margin:0 auto;padding:.75rem 1.5rem;display:flex;flex-wrap:wrap;gap:.5rem 1.5rem;align-items:center}
header strong{font-size:1.1rem} nav{display:flex;flex-wrap:wrap;gap:.25rem}
nav a{padding:.45rem .8rem;border-radius:8px;color:var(--ink);text-decoration:none;font-weight:600}
nav a.on{background:var(--navy);color:var(--card)}
main{max-width:1200px;margin:0 auto;padding:1.5rem}
h1{font-size:1.4rem;margin:0 0 1rem} h2{font-size:1.1rem;margin:0 0 .75rem}
.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:1.25rem;margin-bottom:1.25rem}
.stats{display:grid;gap:1rem;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));margin-bottom:1.25rem}
.stat{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:1rem}
.stat b{display:block;font-size:1.7rem;font-variant-numeric:tabular-nums} .stat span{color:var(--muted);font-size:.85rem}
label{display:block;font-weight:600;font-size:.85rem;margin:.5rem 0 .25rem}
input,textarea,select{width:100%;font:inherit;padding:.5rem .6rem;border:1px solid var(--line);border-radius:8px;background:var(--card);color:var(--ink)}
textarea{min-height:110px;resize:vertical}
.row{display:grid;gap:1rem;grid-template-columns:repeat(auto-fit,minmax(220px,1fr))}
button,.btn{display:inline-flex;align-items:center;min-height:40px;padding:0 1rem;border:0;border-radius:8px;background:var(--navy);color:var(--card);font:inherit;font-weight:700;cursor:pointer;text-decoration:none;margin-top:.75rem}
button.sec{background:transparent;color:var(--navy);border:2px solid var(--navy)}
.hint{color:var(--muted);font-size:.82rem;margin:.25rem 0 0} .muted{color:var(--muted)}
.msg{padding:.75rem 1rem;border-radius:8px;margin-bottom:1rem;background:var(--card);border:1px solid var(--line)} .ok{color:var(--ok)} .bad{color:var(--bad)} .warn{color:var(--warn)}
table{width:100%;border-collapse:collapse;font-size:.88rem} th,td{text-align:left;padding:.45rem .5rem;border-bottom:1px solid var(--line);vertical-align:top}
th{color:var(--muted);font-weight:600} .scroll{overflow-x:auto}
.grid{display:grid;gap:1rem;grid-template-columns:repeat(auto-fill,minmax(210px,1fr))}
.p{background:var(--card);border:1px solid var(--line);border-radius:10px;overflow:hidden}
.p img{width:100%;aspect-ratio:4/3;object-fit:contain;background:#fff;border-bottom:1px solid var(--line)}
.p div{padding:.6rem .75rem;font-size:.82rem} a{color:var(--navy)}
code,.code{font-family:ui-monospace,Menlo,monospace;font-size:.82rem;word-break:break-all;background:var(--pill);padding:.15rem .35rem;border-radius:6px}
.pill{display:inline-block;padding:.1rem .5rem;border-radius:999px;background:var(--pill);font-size:.78rem;font-weight:600}
td form{display:flex;gap:.35rem;align-items:center} td form select,td form input{min-width:110px;padding:.3rem} td form button{margin:0;min-height:32px;padding:0 .6rem}
"""
TABS = [('/', 'Overview'), ('/proofs', 'Proofs'), ('/options', 'Options links'), ('/outreach', 'Outreach'), ('/website', 'Website'), ('/processes', 'Processes')]
PROCESSES = os.path.join(REPO, 'internal', 'processes')

def md_inline(t):
    t = esc(t)
    t = re.sub(r'`([^`]+)`', r'<code>\1</code>', t)
    t = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', t)
    t = re.sub(r'(?<![\w*])\*([^*]+)\*(?!\w)', r'<em>\1</em>', t)
    t = re.sub(r'\[([^\]]+)\]\((https?://[^)\s]+)\)', r'<a href="\2" target="_blank">\1</a>', t)
    return t

def md(text):
    """Small Markdown renderer for the process guides: headings, paragraphs, lists, quotes, code blocks and tables."""
    out, lines, i = [], text.splitlines(), 0
    while i < len(lines):
        l = lines[i]
        if l.startswith('```'):
            j = i + 1; buf = []
            while j < len(lines) and not lines[j].startswith('```'): buf.append(lines[j]); j += 1
            out.append('<pre class="code" style="display:block;padding:.75rem;overflow-x:auto">' + esc('\n'.join(buf)) + '</pre>'); i = j + 1; continue
        m = re.match(r'(#{1,4})\s+(.*)', l)
        if m:
            n = min(len(m.group(1)) + 1, 4); out.append(f'<h{n}>{md_inline(m.group(2))}</h{n}>'); i += 1; continue
        if l.startswith('|'):
            rows = []
            while i < len(lines) and lines[i].startswith('|'):
                cells = [c.strip() for c in lines[i].strip().strip('|').split('|')]
                if not all(re.fullmatch(r':?-{2,}:?', c) for c in cells): rows.append(cells)
                i += 1
            if rows:
                out.append('<div class="scroll"><table><tr>' + ''.join(f'<th>{md_inline(c)}</th>' for c in rows[0]) + '</tr>' +
                           ''.join('<tr>' + ''.join(f'<td>{md_inline(c)}</td>' for c in r) + '</tr>' for r in rows[1:]) + '</table></div>')
            continue
        if re.match(r'\s*([-*]|\d+\.)\s+', l):
            ordered = bool(re.match(r'\s*\d+\.', l)); tag = 'ol' if ordered else 'ul'; items = []
            while i < len(lines) and re.match(r'\s*([-*]|\d+\.)\s+', lines[i]):
                items.append(re.sub(r'\s*([-*]|\d+\.)\s+', '', lines[i], count=1)); i += 1
            out.append(f'<{tag}>' + ''.join(f'<li>{md_inline(x)}</li>' for x in items) + f'</{tag}>'); continue
        if l.startswith('>'):
            buf = []
            while i < len(lines) and lines[i].startswith('>'): buf.append(lines[i].lstrip('> ')); i += 1
            out.append('<blockquote style="margin:.5rem 0;padding:.5rem 1rem;border-left:3px solid var(--navy);background:var(--pill)">' + '<br>'.join(md_inline(b) for b in buf) + '</blockquote>'); continue
        if l.strip():
            buf = []
            while i < len(lines) and lines[i].strip() and not re.match(r'(#|\||>|```|\s*([-*]|\d+\.)\s)', lines[i]): buf.append(lines[i]); i += 1
            out.append('<p>' + ' '.join(md_inline(b) for b in buf) + '</p>'); continue
        i += 1
    return '\n'.join(out)

def processes_page(name=''):
    os.makedirs(PROCESSES, exist_ok=True)
    files = sorted(f for f in os.listdir(PROCESSES) if f.endswith('.md'))
    if not files:
        return '<h1>Processes</h1><p class="muted">No guides yet. Add Markdown files to internal/processes/.</p>'
    name = name if name in files else files[0]
    title = lambda f: (re.search(r'^#\s+(.*)', open(os.path.join(PROCESSES, f), encoding='utf-8').read(), re.M) or [None, f])[1]
    nav = ''.join(f'<a href="/processes?f={urllib.parse.quote(f)}" class="{"on" if f == name else ""}" style="display:block;padding:.45rem .7rem;border-radius:8px;text-decoration:none;color:inherit;{"background:var(--pill);font-weight:700" if f == name else ""}">{esc(title(f))}</a>' for f in files)
    body = md(open(os.path.join(PROCESSES, name), encoding='utf-8').read())
    return (f'<div style="display:grid;gap:1.25rem;grid-template-columns:minmax(180px,240px) 1fr">'
            f'<aside class="card" style="align-self:start;padding:.75rem"><p class="muted" style="margin:.25rem .5rem .5rem;font-size:.8rem">PROCESSES</p>{nav}'
            f'<p class="hint" style="margin:.75rem .5rem 0">Edit or add guides in <code>internal/processes/</code>.</p></aside>'
            f'<article class="card">{body}<p class="hint">File: internal/processes/{esc(name)}</p></article></div>')

def shell(path, body, msg=''):
    nav = ''.join(f'<a href="{h}" class="{"on" if h == path else ""}">{t}</a>' for h, t in TABS)
    return (f'<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
            f'<meta name="robots" content="noindex, nofollow, noarchive, nosnippet"><meta name="referrer" content="no-referrer">'
            f'<title>Grimes internal hub</title><style>{CSS}</style></head><body><header><div class="in"><strong>Grimes internal hub</strong><nav>{nav}</nav>'
            f'<span class="muted" style="margin-left:auto;font-size:.8rem">Local to this Mac</span></div></header><main>{msg}{body}</main></body></html>')

def note(text, kind='ok'): return f'<p class="msg {kind}">{text}</p>'

# ---------- catalogue, stock and options links ----------
def awards():
    return {a['sku']: a for a in load('awards.json')}

def stock(src):
    """Live stock from the site's own stock checker (same one the website uses)."""
    url = load('config.json').get('stockCheck')
    if not url or not src: return None
    try:
        with urllib.request.urlopen(url + '?url=' + urllib.parse.quote(src, safe=''), timeout=15) as r:
            j = json.loads(r.read().decode())
            return j if isinstance(j.get('in_stock'), bool) else None
    except Exception:
        return None

def links_file(): return os.path.join(DATA, 'option-links.json')
def read_links():
    try: return json.load(open(links_file(), encoding='utf-8'))
    except Exception: return {}

def b64url(obj):
    return base64.urlsafe_b64encode(json.dumps(obj, ensure_ascii=False, separators=(',', ':')).encode()).decode().rstrip('=')

def option_total(opt, cat):
    n = sum(q for _, q in opt['l']); aw = sum(float(cat[s]['price_from'] or 0) * q for s, q in opt['l'] if s in cat)
    return n, aw + n * ENGRAVING + (SETUP if n else 0)

def parse_options(text, cat):
    """Each line:  Option name | SKU x qty, SKU x qty | optional description"""
    opts, errs = [], []
    for raw in text.splitlines():
        if not raw.strip(): continue
        parts = [p.strip() for p in raw.split('|')]
        if len(parts) < 2: errs.append(f'Line needs "name | SKU x qty": {raw}'); continue
        items = []
        for it in parts[1].split(','):
            m = re.match(r'\s*([A-Za-z0-9-]+)\s*[x×*]\s*(\d+)\s*$', it)
            if not m: errs.append(f'Can\'t read "{it.strip()}" (use e.g. SY5067 x 14)'); continue
            sku, q = m.group(1).upper(), int(m.group(2))
            if sku not in cat: errs.append(f'{sku} isn\'t in the website catalogue'); continue
            items.append([sku, q])
        if items: opts.append({'n': parts[0], **({'d': parts[2]} if len(parts) > 2 and parts[2] else {}), 'l': items})
    return opts, errs

# ---------- outreach ----------
def read_outreach():
    if not os.path.exists(OUTREACH):
        dl = os.path.expanduser('~/Downloads/grimes-outreach-tracker.csv')
        if os.path.exists(dl):
            os.makedirs(PRIVATE, exist_ok=True); shutil.copy(dl, OUTREACH)
    if not os.path.exists(OUTREACH): return []
    with open(OUTREACH, encoding='utf-8-sig', newline='') as f:
        return list(csv.DictReader(f))

def write_outreach(rows):
    os.makedirs(PRIVATE, exist_ok=True)
    with open(OUTREACH, 'w', encoding='utf-8-sig', newline='') as f:
        w = csv.DictWriter(f, fieldnames=OUT_COLS, extrasaction='ignore'); w.writeheader(); w.writerows(rows)

# ---------- PostHog ----------
def ph_key():
    k = os.environ.get('POSTHOG_KEY')
    p = os.path.join(PRIVATE, 'posthog.key')
    if not k and os.path.exists(p): k = open(p).read().strip()
    return k

def hogql(q):
    k = ph_key()
    if not k: return None
    req = urllib.request.Request(f'{PH_HOST}/api/projects/{PH_PROJECT}/query/', data=json.dumps({'query': {'kind': 'HogQLQuery', 'query': q}}).encode(),
                                 headers={'Authorization': f'Bearer {k}', 'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return json.loads(r.read().decode()).get('results')
    except Exception as e:
        return {'error': str(e)}

LIVE = "properties.$host = 'grimesengravers.com'"
def stats():
    if not ph_key(): return None
    q = lambda s: hogql(s)
    out = {}
    out['visitors7'] = q(f"select count(distinct person_id) from events where event = '$pageview' and {LIVE} and timestamp > now() - interval 7 day")
    out['visitors30'] = q(f"select count(distinct person_id) from events where event = '$pageview' and {LIVE} and timestamp > now() - interval 30 day")
    out['orders30'] = q(f"select count() from events where event = 'quote_form_submitted' and {LIVE} and timestamp > now() - interval 30 day")
    out['sources'] = q(f"select properties.$referring_domain as d, count(distinct person_id) as v from events where event = '$pageview' and {LIVE} and timestamp > now() - interval 30 day group by d order by v desc limit 8")
    out['pages'] = q(f"select properties.$pathname as p, count() as v from events where event = '$pageview' and {LIVE} and timestamp > now() - interval 30 day group by p order by v desc limit 8")
    out['funnel'] = q(f"""select properties.options_ref as ref,
        countIf(event = 'suggested_options_viewed') as viewed,
        countIf(event in ('suggested_option_chosen', 'suggested_options_all')) as chose,
        countIf(event = 'order_shared') as shared,
        countIf(event = 'quote_form_submitted') as sent
        from events where {LIVE} and properties.options_ref is not null and timestamp > now() - interval 90 day group by ref order by viewed desc limit 20""")
    return out

def one(v):
    try: return v[0][0]
    except Exception: return '–'

# ---------- pages ----------
def overview():
    rows = read_outreach(); today = datetime.date.today().isoformat()
    due = [r for r in rows if r.get('Next action date') and r['Next action date'] <= today and r.get('Status') not in ('Order', 'Not now', 'Ignored', 'Withdrawn')]
    pend = sum(1 for r in rows if r.get('Status') == 'Pending')
    s = stats() or {}
    proofs_n = len([f for f in os.listdir(proof.OUT) if f.endswith('.pdf')]) if os.path.isdir(proof.OUT) else 0
    cards = [('Orders sent (30 days)', one(s.get('orders30')) if s else 'Set up', '/website'),
             ('Visitors (7 days)', one(s.get('visitors7')) if s else 'Set up', '/website'),
             ('Options links', len(read_links()), '/options'),
             ('Outreach: due today', len(due), '/outreach'),
             ('Outreach: pending', pend, '/outreach'),
             ('Proofs made', proofs_n, '/proofs')]
    html_cards = ''.join(f'<a class="stat" href="{h}" style="text-decoration:none;color:inherit"><b>{esc(v)}</b><span>{esc(t)}</span></a>' for t, v, h in cards)
    due_rows = ''.join(f'<tr><td>{esc(r.get("Name"))}</td><td>{esc(r.get("Organisation"))}</td><td>{esc(r.get("Status"))}</td><td>{esc(r.get("Next action"))}</td><td>{esc(r.get("Next action date"))}</td></tr>' for r in due)
    f = (s or {}).get('funnel')
    funnel = ''
    if isinstance(f, list) and f:
        funnel = '<div class="card"><h2>Suggested options links</h2><div class="scroll"><table><tr><th>Link</th><th>Opened</th><th>Chose</th><th>Shared</th><th>Order sent</th></tr>' + ''.join(
            f'<tr><td><span class="pill">{esc(r[0])}</span></td><td>{r[1]}</td><td>{r[2]}</td><td>{r[3]}</td><td><strong>{r[4]}</strong></td></tr>' for r in f) + '</table></div></div>'
    return (f'<h1>Overview</h1><div class="stats">{html_cards}</div>{funnel}'
            f'<div class="card"><h2>Outreach due today or overdue ({len(due)})</h2>'
            + (f'<div class="scroll"><table><tr><th>Name</th><th>Organisation</th><th>Status</th><th>Next action</th><th>Due</th></tr>{due_rows}</table></div>' if due else '<p class="muted">Nothing due. Nice.</p>') + '</div>')

def proofs_page(pre=None):
    pre = pre or {}
    OUT, T = proof.OUT, proof.TEMPLATES
    pdfs = sorted([f for f in os.listdir(OUT) if f.endswith('.pdf')], key=lambda f: os.path.getmtime(os.path.join(OUT, f)), reverse=True) if os.path.isdir(OUT) else []
    codes = sorted(f[:-4] for f in os.listdir(T) if f.endswith('.pdf')) if os.path.isdir(T) else []
    pq, fj = load('plaque.json'), load('font.json')
    items = ''.join(
        f'<div class="p"><img src="/file/{urllib.parse.quote(f[:-4])}.png" alt="" loading="lazy"><div><strong>{esc(f[:-4])}</strong><br>'
        f'<span class="muted">{datetime.datetime.fromtimestamp(os.path.getmtime(os.path.join(OUT, f))):%d %b %Y, %H:%M}</span><br>'
        f'<a href="/file/{urllib.parse.quote(f)}" target="_blank">Open true-size PDF</a>'
        f'<form method="post" action="/proof/delete" onsubmit="return confirm(\'Delete this proof?\')" style="margin:0"><input type="hidden" name="name" value="{esc(f)}">'
        f'<button class="sec" style="min-height:32px;padding:0 .7rem;margin-top:.5rem">Delete</button></form></div></div>' for f in pdfs)
    opt = lambda xs: ''.join(f'<option value="{esc(v)}">{esc(t)}</option>' for v, t in xs)
    return f"""<h1>Proofs</h1>
<div class="row">
<form class="card" method="post" action="/proof"><h2>Glass award (text)</h2>
  <label for="code">Product code</label><input id="code" name="code" list="codes" placeholder="SY5067" required value="{esc(pre.get('code', ''))}">
  <datalist id="codes">{''.join(f'<option value="{c}">' for c in codes)}</datalist><p class="hint">{len(codes)} supplier templates available.</p>
  <label for="lines">Wording (one line per row; blank line between awards for a set)</label>
  <textarea id="lines" name="lines" placeholder="Employee of the Year 2026&#10;Sarah Jones" required>{esc(pre.get('lines', '') if pre.get('code') else '')}</textarea>
  <label for="area">Engraving area</label><select id="area" name="area">{opt([('1', 'Main (largest)'), ('2', '2nd area'), ('3', '3rd area')])}</select>
  <button>Create award proof</button></form>
<form class="card" method="post" action="/plaque"><h2>Bench plaque</h2>
  <div class="row"><div><label for="psize">Size</label><input id="psize" name="size" list="psizes" value="{esc(pre.get('plaque', '8x3'))}" required>
    <datalist id="psizes">{''.join(f'<option value="{s["id"]}">{esc(s["name"])} ({esc(s["mm"])})</option>' for s in pq['sizes'])}<option value="263x66">Made to measure, in mm</option></datalist>
    <p class="hint">A website size, or any size in mm, e.g. 263x66</p></div>
  <div><label for="pstyle">Style</label><select id="pstyle" name="style">{opt([('grimes', 'Our proof (white, true size)'), ('preview', 'Colour preview (brass or steel)')])}</select></div>
  <div><label for="metal">Metal (colour preview)</label><select id="metal" name="metal">{opt([(m['id'], m['name']) for m in fj['mats']])}</select></div>
  <div><label for="pfont">Font</label><select id="pfont" name="font">{opt([('helvetica', 'Helvetica (our standard)')] + [(f['id'], f['name']) for f in fj['fonts']])}</select></div>
  <div><label for="emblem">Emblem</label><select id="emblem" name="emblem">{opt([(e['id'], e['name']) for e in pq['emblems'] if e['id'] == 'none' or e.get('svg')])}</select></div>
  <div><label for="fixing">Fixing</label><select id="fixing" name="fixing">{opt([('screws', 'Screw holes'), ('adhesive', 'Adhesive')])}</select></div>
  <div><label for="corners">Corners (colour preview)</label><select id="corners" name="corners">{opt([('square', 'Square'), ('rounded', 'Rounded')])}</select></div></div>
  <label style="font-weight:400"><input type="checkbox" name="border" value="1" style="width:auto"> Border</label>
  <label for="plines">Wording (one line per row)</label><textarea id="plines" name="lines" placeholder="In loving memory of&#10;Margaret Jones&#10;1938 – 2024" required>{esc(pre.get('lines', '') if pre.get('plaque') else '')}</textarea>
  <button>Create plaque proof</button></form>
</div>
<h2>Proofs ({len(pdfs)})</h2>
{'<form method="post" action="/proof/delete-all" onsubmit="return confirm(&#39;Delete all ' + str(len(pdfs)) + ' proofs?&#39;)" style="margin:0 0 1rem"><button class="sec" style="margin:0">Delete all proofs</button></form>' if pdfs else ''}
<div class="grid">{items or '<p class="muted">No proofs yet.</p>'}</div>"""

def options_page(result=''):
    cat = awards(); links = read_links()
    rows = ''
    for slug, p in links.items():
        tots = ' · '.join(f"Option {i + 1}: {gbp(option_total(o, cat)[1])}" for i, o in enumerate(p.get('o', [])))
        rows += (f'<tr><td><span class="pill">{esc(slug)}</span><br><span class="muted">{esc(p.get("for", ""))}</span></td><td>{esc(tots)}</td>'
                 f'<td><a href="{SITE}/o/{esc(slug)}/" target="_blank">{SITE}/o/{esc(slug)}/</a></td>'
                 f'<td><form method="post" action="/options/personal"><input type="hidden" name="slug" value="{esc(slug)}">'
                 f'<input name="name" placeholder="Name"><input name="email" placeholder="Email"><button class="sec">Personal link</button></form></td></tr>')
    return f"""<h1>Options links</h1>{result}
<form class="card" method="post" action="/options/new"><h2>Build a new suggested-options link</h2>
<p class="hint">Every award is stock-checked before the link is saved. The customer's name and email go only in their personal link (after the #), never in the repo.</p>
<div class="row"><div><label for="slug">Short name (the link)</label><input id="slug" name="slug" placeholder="wwh-staff-awards" pattern="[a-z0-9-]+" required>
<p class="hint">Lower case, numbers and dashes: grimesengravers.com/o/<b>short-name</b>/</p></div>
<div><label for="for">Organisation</label><input id="for" name="for" placeholder="Wales &amp; West Housing"></div>
<div><label for="needed">Needed by</label><input id="needed" type="date" name="needed_by"></div></div>
<div class="row"><div><label for="cname">Customer name (personal link only)</label><input id="cname" name="name"></div>
<div><label for="cemail">Customer email (personal link only)</label><input id="cemail" name="email" type="email"></div></div>
<label for="opts">Options, one per line: <code>Name | SKU x qty, SKU x qty | description</code></label>
<textarea id="opts" name="options" required placeholder="Optical Crystal Vertical Wedge | SY5067 x 14, SY5066 x 14 | Our best value option&#10;Optical Crystal Hexagon | DY16 x 14, DY15 x 14 | A classic shape"></textarea>
<label for="note">Message on the page (optional)</label><textarea id="note" name="note" style="min-height:70px" placeholder="Based on what you told us, we've hand-picked these options…"></textarea>
<button>Check stock and save link</button></form>
<div class="card"><h2>Links ({len(links)})</h2><div class="scroll"><table><tr><th>Link</th><th>Estimated totals</th><th>Short link</th><th>Make a personal link (fills in their details)</th></tr>{rows or '<tr><td colspan="4" class="muted">None yet.</td></tr>'}</table></div>
<p class="hint">New or changed links go live after a push (the button appears after saving).</p></div>"""

def outreach_page(msg=''):
    rows = read_outreach()
    body = ''
    for i, r in enumerate(rows):
        sel = ''.join(f'<option{" selected" if r.get("Status") == s else ""}>{s}</option>' for s in STATUSES + ([r.get('Status')] if r.get('Status') and r.get('Status') not in STATUSES else []))
        body += (f'<tr><td>{esc(r.get("Date sent"))}</td><td><strong>{esc(r.get("Name"))}</strong><br><span class="muted">{esc(r.get("Role"))}</span></td>'
                 f'<td>{esc(r.get("Organisation"))}<br><span class="muted">{esc(r.get("Sector"))}</span></td><td>{esc(r.get("Channel"))}</td>'
                 f'<td><form method="post" action="/outreach/update"><input type="hidden" name="i" value="{i}"><select name="status">{sel}</select>'
                 f'<input name="next" value="{esc(r.get("Next action"))}" placeholder="Next action"><input type="date" name="next_date" value="{esc(r.get("Next action date"))}"><button>Save</button></form></td>'
                 f'<td>{esc(r.get("Outcome"))}</td></tr>')
    counts = {}
    for r in rows: counts[r.get('Status') or '–'] = counts.get(r.get('Status') or '–', 0) + 1
    summary = ' · '.join(f'{esc(k)}: <strong>{v}</strong>' for k, v in counts.items())
    return f"""<h1>Outreach</h1>{msg}<p class="muted">{summary or 'No contacts yet.'} &nbsp;|&nbsp; Saved in <code>private/outreach-tracker.csv</code> (git-ignored).</p>
<div class="card scroll"><table><tr><th>Sent</th><th>Name</th><th>Organisation</th><th>Channel</th><th>Status · next action · due</th><th>Outcome</th></tr>{body}</table></div>
<form class="card" method="post" action="/outreach/add"><h2>Add a contact</h2><div class="row">
<div><label>Name</label><input name="Name" required></div><div><label>Role</label><input name="Role"></div>
<div><label>Organisation</label><input name="Organisation" required></div><div><label>Sector</label><input name="Sector"></div>
<div><label>Channel</label><select name="Channel"><option>LinkedIn (Mark)</option><option>Email</option><option>Facebook</option><option>Phone</option><option>In person</option></select></div>
<div><label>Status</label><select name="Status">{''.join(f'<option{" selected" if s == "Pending" else ""}>{s}</option>' for s in STATUSES)}</select></div>
<div><label>Next action</label><input name="Next action" placeholder="Send follow-up message"></div><div><label>Next action date</label><input type="date" name="Next action date"></div>
</div><button>Add contact</button></form>"""

def website_page():
    if not ph_key():
        return """<h1>Website</h1><div class="card"><h2>Connect PostHog (one-off)</h2><ol>
<li>In PostHog (Grimes project), click your avatar → <strong>Settings → Personal API keys → Create personal API key</strong>.</li>
<li>Give it read access to <strong>Query</strong> only, for the Grimes project.</li>
<li>Paste it below. It's saved in <code>private/posthog.key</code> on this Mac only (git-ignored).</li></ol>
<form method="post" action="/website/key"><input name="key" placeholder="phx_…" required><button>Save key</button></form></div>"""
    s = stats()
    err = next((v['error'] for v in s.values() if isinstance(v, dict) and 'error' in v), None)
    if err:
        hint = ('PostHog refused the key (403). It needs to be a <strong>personal API key</strong> (starts with <code>phx_</code>) with '
                '<strong>Query: Read</strong> access to the <strong>Grimes project (294611)</strong>. Keys made while in another organisation (e.g. Fintegrate) won’t work.'
                if '403' in err else ('PostHog didn’t accept the key (401): it may be mistyped or deleted.' if '401' in err else esc(err)))
        return ('<h1>Website</h1>' + note(f'PostHog error: {hint}', 'bad') +
                '<form class="card" method="post" action="/website/key"><h2>Replace the PostHog key</h2>'
                '<input name="key" placeholder="phx_…" required><button>Save new key</button></form>')
    table = lambda rows, a, b: '<table><tr><th>' + a + '</th><th>' + b + '</th></tr>' + ''.join(f'<tr><td>{esc(r[0] or "(direct)")}</td><td>{esc(r[1])}</td></tr>' for r in (rows or [])) + '</table>'
    f = s.get('funnel') or []
    fun = '<table><tr><th>Link</th><th>Opened</th><th>Chose</th><th>Shared</th><th>Order sent</th></tr>' + ''.join(f'<tr><td>{esc(r[0])}</td><td>{r[1]}</td><td>{r[2]}</td><td>{r[3]}</td><td><strong>{r[4]}</strong></td></tr>' for r in f) + '</table>' if f else '<p class="muted">No suggested-options activity yet.</p>'
    return (f'<h1>Website</h1><p class="muted">Live site only (grimesengravers.com), from PostHog.</p><div class="stats">'
            f'<div class="stat"><b>{one(s["visitors7"])}</b><span>Visitors, 7 days</span></div><div class="stat"><b>{one(s["visitors30"])}</b><span>Visitors, 30 days</span></div>'
            f'<div class="stat"><b>{one(s["orders30"])}</b><span>Orders sent, 30 days</span></div></div>'
            f'<div class="row"><div class="card"><h2>Where visitors came from (30 days)</h2>{table(s["sources"], "Source", "Visitors")}</div>'
            f'<div class="card"><h2>Top pages (30 days)</h2>{table(s["pages"], "Page", "Views")}</div></div>'
            f'<div class="card"><h2>Suggested options funnel (90 days)</h2>{fun}</div>')

# ---------- orders from the website (the "open_in_hub" link in each order email) ----------
SIZE_RE = re.compile(r'^\s*((?:\d+(?:[./]\d+)?\s*(?:cm|mm|oz|pt|")?(?:\s*dia)?\s*(?:x\s*)?)+)\s*', re.I)

def family_alternatives(sku, cat, bigger_only=False):
    """Other in-stock sizes of the same award (same range and product name), smallest first."""
    a = cat.get(sku)
    if not a: return []
    prod = lambda x: SIZE_RE.sub('', x['name']).strip().lower()
    sib = [x for x in cat.values() if x['range'] == a['range'] and prod(x) == prod(a) and x['sku'] != sku and x.get('in_stock')]
    sib.sort(key=lambda x: float(x.get('price_from') or 0))
    return [x for x in sib if float(x.get('price_from') or 0) > float(a.get('price_from') or 0)] if bigger_only else sib

def order_page(code):
    try:
        b = code + '=' * (-len(code) % 4)
        o = json.loads(base64.urlsafe_b64decode(b.encode()).decode('utf-8'))
    except Exception:
        return '<h1>Order</h1>' + note('That order link couldn’t be read. Copy the whole link from the email and try again.', 'bad')
    cat = awards(); oid = hashlib.sha1(code.encode()).hexdigest()[:8]
    c = o.get('c', {}); shared = [l.strip() for l in (o.get('w') or '').splitlines() if l.strip()]
    different = 'different' in (o.get('wt') or '').lower()
    cards = []
    for li, l in enumerate(o.get('lines', []), 1):
        sku, qty, name = l.get('s', ''), int(l.get('q') or 0), l.get('n', '')
        made, notes = [], []
        if l.get('k') == 'plaque':
            p = l.get('p') or {}
            words = [x.strip() for x in (p.get('w') or '').splitlines() if x.strip()]
            size = f"{round(float(p.get('wi') or 6) * 25.4)}x{round(float(p.get('hi') or 4) * 25.4)}"
            if words:
                out = f'order-{oid}-{li:02d}-plaque'
                try:
                    if not os.path.exists(os.path.join(proof.OUT, out + '.pdf')):
                        plaque_proof.make(size, words, p.get('mat') or 'brass', 'helvetica', 'none', 'square', 'screws' if p.get('holes', True) else 'adhesive', bool(p.get('border')), 'grimes', out_name=out)
                    made.append(out)
                except SystemExit as e: notes.append(('bad', str(e)))
            else: notes.append(('warn', 'No wording yet.'))
            tpl = ''
            edit = f"/proofs?plaque={urllib.parse.quote(size)}&lines={urllib.parse.quote(chr(10).join(words))}"
            meta = f'{esc(size)} mm · {esc(p.get("mat") or "")} · {"screw holes" if p.get("holes", True) else "adhesive"}{" · border" if p.get("border") else ""}'
        else:
            names = l.get('names') or []
            blocks = []
            if different and names:
                missing = 0
                for n in names[:qty]:
                    own = [x.strip() for x in re.split(r'\n| / ', n or '') if x.strip()]
                    if not own: missing += 1; continue
                    blocks.append(shared + own)
                if missing: notes.append(('warn', f'{missing} name{"s" if missing > 1 else ""} to follow.'))
            elif shared:
                blocks = [shared]
            has_tpl = os.path.exists(os.path.join(proof.TEMPLATES, sku + '.pdf'))
            tpl = f'<a href="/template/{urllib.parse.quote(sku)}.pdf" target="_blank">Blank template</a>' if has_tpl else '<span class="warn">No template saved (run ./scripts/fetch-templates.sh)</span>'
            if has_tpl and blocks:
                try:
                    max_pt = min(proof.make_proof(sku, bl, 1, dry=True)[1] for bl in blocks[:40]) if len(blocks) > 1 else 36
                    if max_pt < 5: raise SystemExit('too long')
                    for i, bl in enumerate(blocks[:40], 1):
                        out = f'order-{oid}-{li:02d}-{sku}-{i:02d}'
                        if not os.path.exists(os.path.join(proof.OUT, out + '.pdf')):
                            proof.make_proof(sku, bl, 1, max_pt=max_pt, out_name=out)
                        made.append(out)
                    if len(blocks) > 40: notes.append(('warn', f'Showing the first 40 of {len(blocks)} proofs.'))
                except SystemExit:
                    bigger = family_alternatives(sku, cat, bigger_only=True)[:3]
                    notes.append(('bad', 'The wording is too long for this award’s engraving area.' + (' Bigger sizes in stock: ' + ', '.join(f'{esc(x["name"])} ({x["sku"]}, £{float(x["price_from"]):.2f})' for x in bigger) if bigger else ' Suggest shorter wording.')))
            elif not blocks:
                notes.append(('warn', 'No wording yet (names to follow).'))
            a = cat.get(sku)
            if a and not a.get('in_stock'):
                alts = family_alternatives(sku, cat)[:3]
                notes.append(('bad', 'Marked out of stock in our catalogue.' + (' In-stock sizes: ' + ', '.join(f'{esc(x["name"])} ({x["sku"]})' for x in alts) if alts else '')))
            first = blocks[0] if blocks else []
            edit = f"/proofs?code={urllib.parse.quote(sku)}&lines={urllib.parse.quote(chr(10).join(first))}"
            meta = f'{esc(sku)} · {qty} award{"s" if qty != 1 else ""}{" · different wording on each" if different and names else ""}'
        thumbs = ''.join(f'<div class="p"><img src="/file/{urllib.parse.quote(m)}.png" alt="" loading="lazy"><div><a href="/file/{urllib.parse.quote(m)}.pdf" target="_blank">Open PDF</a></div></div>' for m in made)
        msgs = ''.join(f'<p class="{k}" style="margin:.25rem 0">{t}</p>' for k, t in notes)
        cards.append(f'<div class="card"><h2 style="margin-bottom:.25rem">{esc(name)}</h2><p class="muted" style="margin:0 0 .5rem">{meta}</p>{msgs}'
                     f'<p style="margin:.25rem 0 .75rem">{tpl}{" · " if tpl else ""}<a href="{edit}">Edit in Proofs</a></p><div class="grid">{thumbs}</div></div>')
    who = ' · '.join(esc(v) for v in (c.get('name'), c.get('company'), c.get('email'), ('needed by ' + c['needed_by']) if c.get('needed_by') else '') if v)
    return (f'<h1>Order from the website</h1><p class="muted">{who or "Customer details in the email"}{" · engraving: " + esc(o.get("eng")) if o.get("eng") else ""}</p>'
            f'<p class="hint">Proofs are made automatically with our standard layout (no AI). Check each one, then use <strong>Edit in Proofs</strong> to change wording or layout before sending.</p>' + ''.join(cards))

# ---------- password ----------
AUTH_FILE = os.path.join(PRIVATE, 'dashboard.auth')  # "username:salt:pbkdf2-hash" (git-ignored)

def pw_hash(pw, salt):
    return hashlib.pbkdf2_hmac('sha256', pw.encode(), bytes.fromhex(salt), 200_000).hex()

def auth_creds():
    """(username, salt, hash) or (None, None, None) when no password is set."""
    if os.environ.get('DASHBOARD_PASSWORD'):
        salt = '00' * 16
        return os.environ.get('DASHBOARD_USER', 'grimes'), salt, pw_hash(os.environ['DASHBOARD_PASSWORD'], salt)
    if os.path.exists(AUTH_FILE):
        parts = open(AUTH_FILE).read().strip().split(':')
        if len(parts) == 3: return tuple(parts)
    return None, None, None

def set_password():
    user = input('Username [grimes]: ').strip() or 'grimes'
    pw = getpass.getpass('New password (12+ characters): ')
    if len(pw) < 12: sys.exit('Please use at least 12 characters.')
    if getpass.getpass('Again: ') != pw: sys.exit('The passwords didn\'t match.')
    os.makedirs(PRIVATE, exist_ok=True)
    salt = os.urandom(16).hex()
    with open(AUTH_FILE, 'w') as f: f.write(f'{user}:{salt}:{pw_hash(pw, salt)}')
    os.chmod(AUTH_FILE, 0o600)
    print(f'Saved. The dashboard will ask for "{user}" and that password.')

# ---------- server ----------
class H(BaseHTTPRequestHandler):
    def send(self, body, ctype='text/html; charset=utf-8', code=200, headers=None):
        b = body if isinstance(body, bytes) else body.encode('utf-8')
        self.send_response(code); self.send_header('Content-Type', ctype); self.send_header('Content-Length', str(len(b)))
        # Never index or follow anything here (pages, proof PDFs, images), even if it's ever reachable online.
        self.send_header('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet')
        self.send_header('Referrer-Policy', 'no-referrer')
        self.send_header('Cache-Control', 'no-store')
        for k, v in (headers or {}).items(): self.send_header(k, v)
        self.end_headers(); self.wfile.write(b)

    def go(self, path, msg=''):
        pages = {'/': overview, '/proofs': proofs_page, '/options': options_page, '/outreach': outreach_page, '/website': website_page}
        if path == '/processes':
            f = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query).get('f', [''])[0]
            return self.send(shell(path, processes_page(os.path.basename(f)), msg))
        body = pages[path]() if path in pages else '<p>Not found</p>'
        return self.send(shell(path, body, msg))

    def do_GET(self):
        if urllib.parse.urlparse(self.path).path == '/robots.txt':
            return self.send('User-agent: *\nDisallow: /\n', 'text/plain; charset=utf-8')
        if not self.authorised(): return
        path = urllib.parse.unquote(urllib.parse.urlparse(self.path).path)
        if path.startswith('/file/'):
            name = os.path.basename(path[6:]); fp = os.path.join(proof.OUT, name)
            if os.path.isfile(fp): return self.send(open(fp, 'rb').read(), 'application/pdf' if name.endswith('.pdf') else 'image/png')
            return self.send('Not found', 'text/plain', 404)
        if path.startswith('/template/'):
            name = os.path.basename(path[10:]); fp = os.path.join(proof.TEMPLATES, name)
            if name.endswith('.pdf') and os.path.isfile(fp): return self.send(open(fp, 'rb').read(), 'application/pdf')
            return self.send('Not found', 'text/plain', 404)
        q = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        if path == '/order':
            return self.send(shell('/order', order_page((q.get('d') or [''])[0])))
        if path == '/proofs' and q:
            return self.send(shell('/proofs', proofs_page({k: v[0] for k, v in q.items()})))
        return self.go(path)

    def do_POST(self):
        if not self.authorised(): return
        n = int(self.headers.get('Content-Length', 0))
        form = urllib.parse.parse_qs(self.rfile.read(n).decode('utf-8'), keep_blank_values=True)
        g = lambda k, d='': (form.get(k, [d])[0] if form.get(k) else d)
        path = urllib.parse.urlparse(self.path).path
        try:
            if path == '/proof/delete':
                name = os.path.basename(g('name'))  # only files directly in the proofs folder
                if not name.endswith('.pdf'): raise SystemExit('Nothing to delete.')
                for ext in ('.pdf', '.png'):
                    fp = os.path.join(proof.OUT, name[:-4] + ext)
                    if os.path.isfile(fp): os.remove(fp)
                return self.go('/proofs', note(f'Deleted {esc(name[:-4])}.'))
            if path == '/proof/delete-all':
                n = 0
                for f in os.listdir(proof.OUT) if os.path.isdir(proof.OUT) else []:
                    if f.endswith(('.pdf', '.png')): os.remove(os.path.join(proof.OUT, f)); n += f.endswith('.pdf')
                return self.go('/proofs', note(f'Deleted {n} proof(s).'))
            if path == '/proof':
                code, area = g('code').strip().upper(), int(g('area', '1') or 1)
                blocks, cur = [], []
                for t in g('lines').splitlines():
                    if t.strip(): cur.append(t.strip())
                    elif cur: blocks.append(cur); cur = []
                if cur: blocks.append(cur)
                if not code or not blocks: raise SystemExit('Enter a product code and some wording.')
                max_pt = min(proof.make_proof(code, b, area, dry=True)[1] for b in blocks) if len(blocks) > 1 else 36
                stamp = datetime.datetime.now().strftime('%Y%m%d-%H%M%S')
                made = [os.path.basename(proof.make_proof(code, b, area, max_pt=max_pt, out_name=f'{code}-{stamp}-{i:02d}')[0]) for i, b in enumerate(blocks, 1)]
                return self.go('/proofs', note(f'Created {len(made)} proof(s): {esc(", ".join(made))}'))
            if path == '/plaque':
                lines = [t.strip() for t in g('lines').splitlines() if t.strip()]
                if not lines: raise SystemExit('Enter the plaque wording.')
                stamp = datetime.datetime.now().strftime('%Y%m%d-%H%M%S')
                size = re.sub(r'[^0-9a-zA-Z.x×]', '', g('size', '8x3')) or '8x3'
                first = re.sub(r'[^A-Za-z0-9]+', '_', ' '.join(lines[0].split()[:4])).strip('_')
                p, pt = plaque_proof.make(size, lines, g('metal', 'brass'), g('font', 'helvetica'), g('emblem', 'none'), g('corners', 'square'),
                                          g('fixing', 'screws'), bool(g('border')), g('style', 'grimes'), out_name=f'Proof_{first}_plaque_{stamp}')
                return self.go('/proofs', note(f'Created {esc(os.path.basename(p))} ({pt:.1f}pt)'))
            if path == '/options/new':
                cat = awards(); slug = g('slug').strip().lower()
                if not re.fullmatch(r'[a-z0-9-]{3,60}', slug): raise SystemExit('Short name: 3–60 lower-case letters, numbers or dashes.')
                opts, errs = parse_options(g('options'), cat)
                if errs or not opts: raise SystemExit('<br>'.join(esc(e) for e in errs) or 'Add at least one option.')
                # Live stock for every award at the quantity needed.
                need = {}
                for o in opts:
                    for sku, q in o['l']: need[sku] = max(need.get(sku, 0), q)
                rows, short = '', []
                for sku, q in need.items():
                    j = stock(cat[sku].get('source_url'))
                    ok = j is not None and j['in_stock'] and (j.get('qty') is None or j['qty'] >= q)
                    if j is not None and not ok: short.append(sku)
                    state = ('✓ ' + str(j.get('qty', 'in stock'))) if ok else (('✗ ' + str(j.get('qty', 0))) if j else 'could not check')
                    rows += f'<tr><td>{esc(sku)}</td><td>{esc(cat[sku]["name"])}</td><td>{q}</td><td class="{"ok" if ok else ("bad" if j else "warn")}">{state}</td></tr>'
                table = f'<div class="card scroll"><h2>Stock check</h2><table><tr><th>Code</th><th>Award</th><th>Needed</th><th>Stock now</th></tr>{rows}</table></div>'
                if short:
                    return self.go('/options', note(f'Not saved: not enough stock for {esc(", ".join(short))}. Swap those awards and try again.', 'bad') + table)
                links = read_links()
                c = {k: v for k, v in (('company', g('for').strip()), ('needed_by', g('needed_by').strip())) if v}
                links[slug] = {'r': f'{slug}-{datetime.date.today():%b%y}'.lower(), 'for': g('for').strip(),
                               'note': g('note').strip() or f'Based on what you told us, we’ve hand-picked {len(opts)} option{"s" if len(opts) > 1 else ""}, all checked in stock on {datetime.date.today():%-d %B}. Choose one to load it into your order and change anything you like, or ask us to quote them all so your team can compare.',
                               **({'c': c} if c else {}), 'o': opts}
                json.dump(links, open(links_file(), 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
                who = {k: v for k, v in (('n', g('name').strip()), ('e', g('email').strip())) if v}
                personal = f'{SITE}/o/{slug}/' + (f'#{b64url(who)}' if who else '')
                tots = '<br>'.join(f"Option {i + 1}: {esc(o['n'])}: <strong>{gbp(option_total(o, cat)[1])}</strong>" + (' (bulk discount)' if option_total(o, cat)[0] >= BULK else '') for i, o in enumerate(opts))
                return self.go('/options', note(f'Saved <span class="pill">{esc(slug)}</span>. All in stock.<br>{tots}<br><br>Link to send (after publishing): <span class="code">{esc(personal)}</span>'
                                                f'<form method="post" action="/publish"><button>Publish now (git push)</button></form>') + table)
            if path == '/options/personal':
                slug = g('slug'); who = {k: v for k, v in (('n', g('name').strip()), ('e', g('email').strip())) if v}
                link = f'{SITE}/o/{slug}/' + (f'#{b64url(who)}' if who else '')
                return self.go('/options', note(f'Personal link for <span class="pill">{esc(slug)}</span>: <span class="code">{esc(link)}</span>'))
            if path == '/publish':
                cmds = [['git', 'add', 'src/data/option-links.json'], ['git', 'commit', '-m', 'Suggested options links'], ['git', 'push']]
                out = []
                for c in cmds:
                    r = subprocess.run(c, cwd=REPO, capture_output=True, text=True); out.append((r.stdout + r.stderr).strip())
                return self.go('/options', note('Published. The site updates in a few minutes.<br><span class="code">' + esc(' | '.join(o for o in out if o)[:600]) + '</span>'))
            if path == '/outreach/add':
                rows = read_outreach()
                rows.append({c: g(c) for c in OUT_COLS} | {'Date sent': g('Date sent') or datetime.date.today().isoformat()})
                write_outreach(rows); return self.go('/outreach', note(f'Added {esc(g("Name"))}.'))
            if path == '/outreach/update':
                rows = read_outreach(); i = int(g('i', '-1'))
                if 0 <= i < len(rows):
                    rows[i]['Status'] = g('status'); rows[i]['Next action'] = g('next'); rows[i]['Next action date'] = g('next_date')
                    if g('status') == 'Accepted' and not rows[i].get('Accepted date'): rows[i]['Accepted date'] = datetime.date.today().isoformat()
                    write_outreach(rows)
                return self.go('/outreach', note(f'Updated {esc(rows[i]["Name"]) if 0 <= i < len(rows) else ""}.'))
            if path == '/website/key':
                key = g('key').strip()
                if not key.startswith('phx_'):
                    raise SystemExit('That doesn’t look like a personal API key: they start with phx_ (the website’s phc_ key won’t work here).')
                os.makedirs(PRIVATE, exist_ok=True)
                open(os.path.join(PRIVATE, 'posthog.key'), 'w').write(key); os.chmod(os.path.join(PRIVATE, 'posthog.key'), 0o600)
                return self.go('/website', note('Key saved on this Mac.'))
        except SystemExit as e:
            back = {'/proof': '/proofs', '/plaque': '/proofs', '/proof/delete': '/proofs', '/options/new': '/options', '/website/key': '/website'}.get(path, '/')
            return self.go(back, note(str(e), 'bad'))
        return self.send('Not found', 'text/plain', 404)

    def authorised(self):
        """Password check (HTTP Basic auth), on whenever private/dashboard.auth exists or DASHBOARD_PASSWORD is set.
        Use it together with HTTPS (e.g. Cloudflare Tunnel + Access) whenever the dashboard is reachable beyond this Mac."""
        user, salt, pw = auth_creds()
        if not pw: return True
        h = self.headers.get('Authorization', '')
        if h.startswith('Basic '):
            try:
                u, _, p = base64.b64decode(h[6:]).decode('utf-8').partition(':')
                if hmac.compare_digest(u, user) and hmac.compare_digest(pw_hash(p, salt), pw):
                    return True
            except Exception:
                pass
        self.send('Login required', 'text/plain; charset=utf-8', 401, {'WWW-Authenticate': 'Basic realm="Grimes dashboard", charset="UTF-8"'})
        return False

    def log_message(self, *a): pass

if __name__ == '__main__':
    ap = argparse.ArgumentParser(description='Grimes dashboard')
    ap.add_argument('--set-password', action='store_true', help='Set the dashboard username and password, then exit')
    ap.add_argument('--host', default='127.0.0.1', help='Address to listen on (default: this Mac only). Only change it behind HTTPS, e.g. a Cloudflare Tunnel.')
    ap.add_argument('--port', type=int, default=PORT)
    a = ap.parse_args()
    if a.set_password: set_password(); sys.exit()
    if a.host != '127.0.0.1' and not auth_creds()[2]:
        sys.exit('Set a password first (python3 scripts/dashboard.py --set-password) before opening the dashboard beyond this Mac.')
    srv = ThreadingHTTPServer((a.host, a.port), H)
    url = f'http://localhost:{a.port}'
    print(f'Grimes dashboard: {url}  ({"password on" if auth_creds()[2] else "no password: this Mac only"})  Ctrl+C to stop')
    try: webbrowser.open(url)
    except Exception: pass
    srv.serve_forever()
