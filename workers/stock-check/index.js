// Stock checker for the glass awards catalogue. The site can't read the supplier's pages from the
// visitor's browser (the browser blocks reading another site), so it asks this worker instead:
//   GET /?url=<supplier product page>[&fresh=1 | &page=1]  ->  { "in_stock": true, "qty": 25, "checked": "2026-10-05T…" }
// Only supplier product pages are fetched. Results are shared with every visitor through KV (the STOCK
// binding in wrangler.toml), so the supplier sees at most one request per award per hour however many
// people look. If the supplier can't be reached, the last known result is returned with "stale": true.
//
// It also takes logo uploads from the quote form (Web3Forms' free plan has no file uploads):
//   POST /upload (form field "file")  ->  { "url": "https://…/file/<id>/<name>" }
//   GET  /file/<id>/<name>            ->  the file, as a download
// Files go in the FILES KV store with an unguessable id and delete themselves after 90 days.
const SUPPLIER = 'www.logocrystal.co.uk';
const ALLOWED_ORIGINS = ['https://grimesengravers.com', 'https://www.grimesengravers.com'];
const FRESH_SECONDS = 3600;
const MAX_UPLOAD = 10 * 1024 * 1024;
const UPLOAD_TYPES = /\.(pdf|ai|eps|svg|png|jpe?g)$/i;
const FILE_DAYS = 90;

const allowed = (origin) => ALLOWED_ORIGINS.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin || '');

function cors(origin) {
  return allowed(origin) ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : {};
}

function reply(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...cors(origin) },
  });
}

// "Stock Status: <span class="value">25 pcs</span>" on the page; the schema.org availability as a fallback.
function readStock(page) {
  const qty = page.match(/Stock Status:\s*<span class="value">\s*(\d+)\s*pcs/i)?.[1];
  const availability = page.match(/"availability"\s*:\s*"([^"]+)"/)?.[1];
  if (qty == null && !availability) return null;
  const n = qty == null ? null : Number(qty);
  return { in_stock: n == null ? /InStock|LimitedAvailability/.test(availability) : n > 0, qty: n };
}

async function upload(request, env, origin) {
  if (!allowed(origin)) return reply({ error: 'not allowed' }, 403, origin);
  if (!env.FILES) return reply({ error: 'uploads not set up' }, 503, origin);
  if (Number(request.headers.get('Content-Length') || 0) > MAX_UPLOAD + 64 * 1024) return reply({ error: 'too big' }, 413, origin);
  let file;
  try { file = (await request.formData()).get('file'); } catch { return reply({ error: 'bad upload' }, 400, origin); }
  if (!file || typeof file === 'string') return reply({ error: 'no file' }, 400, origin);
  if (!UPLOAD_TYPES.test(file.name)) return reply({ error: 'file type' }, 415, origin);
  if (file.size > MAX_UPLOAD) return reply({ error: 'too big' }, 413, origin);
  const id = crypto.randomUUID().replace(/-/g, '');
  const name = file.name.replace(/[^\w.\- ]+/g, '').replace(/\s+/g, '-').slice(-80) || 'logo';
  await env.FILES.put(id, await file.arrayBuffer(), { expirationTtl: FILE_DAYS * 24 * 3600, metadata: { name, type: file.type, size: file.size } });
  return reply({ url: `${new URL(request.url).origin}/file/${id}/${encodeURIComponent(name)}`, name, size: file.size }, 200, origin);
}

// Always sent as a download (never shown in the browser), so an uploaded SVG or PDF can't run anything.
async function download(id, env) {
  const f = env.FILES && /^[0-9a-f]{32}$/.test(id) ? await env.FILES.getWithMetadata(id, 'arrayBuffer') : null;
  if (!f || !f.value) return new Response('This file has expired or was not found.', { status: 404 });
  const name = (f.metadata && f.metadata.name) || 'logo';
  return new Response(f.value, { headers: {
    'Content-Type': 'application/octet-stream', 'Content-Disposition': `attachment; filename="${name}"`,
    'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'private, no-store',
  } });
}

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get('Origin');
    const path = new URL(request.url).pathname;
    if (request.method === 'OPTIONS') return new Response(null, { headers: { ...cors(origin), 'Access-Control-Allow-Methods': 'GET, POST' } });
    if (path === '/upload' && request.method === 'POST') return upload(request, env, origin);
    if (path.startsWith('/file/')) return download(path.split('/')[2], env);

    let target;
    try { target = new URL(new URL(request.url).searchParams.get('url') || ''); } catch { return reply({ error: 'bad url' }, 400, origin); }
    if (target.protocol !== 'https:' || target.hostname !== SUPPLIER || !/-p-\d+$/.test(target.pathname)) return reply({ error: 'not a product page' }, 400, origin);

    const key = target.pathname.match(/-p-(\d+)$/)[1];
    // Without the KV store (not set up yet), fall back to this data centre's cache so the supplier
    // still sees at most one request per award per hour from each data centre.
    const store = env.STOCK || {
      get: async (k) => { const r = await caches.default.match(`https://stock-check.cache/${k}`); return r ? r.json() : null; },
      put: (k, v) => caches.default.put(`https://stock-check.cache/${k}`, new Response(v, { headers: { 'Cache-Control': `max-age=${6 * 3600}` } })),
    };
    const known = await store.get(key, 'json');
    // How old a shared answer may be: award pages (?page=1) 6 hours, the quote page 1 hour, and the
    // final check before a quote is sent (?fresh=1) 5 minutes.
    const params = new URL(request.url).searchParams;
    const maxAge = params.get('fresh') ? 300 : params.get('page') ? 6 * 3600 : FRESH_SECONDS;
    if (known && Date.now() - Date.parse(known.checked) < maxAge * 1000) return reply(known, 200, origin);

    let result = null;
    try {
      const res = await fetch(target.href, { headers: { 'User-Agent': 'GrimesEngravers-StockCheck/1.0 (info@grimesengravers.com)' } });
      if (res.ok) result = readStock(await res.text());
    } catch {}
    if (!result) return known ? reply({ ...known, stale: true }, 200, origin) : reply({ error: 'stock not available' }, 502, origin);

    result.checked = new Date().toISOString();
    // Kept for a week so there's always a last known answer; a failed write (e.g. the free daily limit) is ignored.
    ctx.waitUntil(Promise.resolve(store.put(key, JSON.stringify(result), { expirationTtl: 7 * 24 * 3600 })).catch(() => {}));
    return reply(result, 200, origin);
  },
};
