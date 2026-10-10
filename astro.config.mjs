import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import markdownCopies from './integrations/markdown-copies.mjs';
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { awards, sizesOf, awardUrl } from './src/lib/awards.ts';

// Other sizes of an award point Google at the main (smallest) size, so they stay out of the sitemap.
const SITE = 'https://grimesengravers.com';
const otherSizes = new Set(awards.filter((a) => sizesOf(a)[0] !== a).map((a) => `${SITE}${awardUrl(a)}`));
// "Last updated" for each page: when its source file last changed in git.
const lastChanged = (file) => {
  try { return execSync(`git log -1 --format=%cI -- "${file}"`, { encoding: 'utf8' }).trim() || undefined; } catch { return undefined; }
};
const DATA = { awards: lastChanged('src/data/awards.json'), collections: lastChanged('src/data/collections.json') };
const sourceOf = (path) => {
  if (path.startsWith('/glass-awards/') && path !== '/glass-awards/') return null;
  const base = path === '/' ? 'src/pages/index' : `src/pages${path.replace(/\/$/, '')}`;
  return [`${base}/index.astro`, `${base}.astro`].find((f) => existsSync(f)) ?? null;
};
const collectionSlugs = new Set((await import('./src/data/collections.json', { with: { type: 'json' } })).default.map((c) => `/${c.slug}/`));
function lastmod(url) {
  const path = url.replace(SITE, '');
  if (path.startsWith('/glass-awards/') && path !== '/glass-awards/') return DATA.awards;
  if (collectionSlugs.has(path)) return DATA.collections;
  const src = sourceOf(path);
  return src ? lastChanged(src) : undefined;
}

export default defineConfig({
  site: SITE,
  trailingSlash: 'always',
  integrations: [markdownCopies(), sitemap({
    filter: (url) => !otherSizes.has(url),
    serialize: (item) => { const d = lastmod(item.url); return d ? { ...item, lastmod: d } : item; },
  })],
  // The stylesheet is small, so put it in each page rather than making the browser wait for a separate file.
  build: { inlineStylesheets: 'always' },
  // Old Laravel URLs -> new pages. Check against the old routes/web.php before going live.
  redirects: {
    '/contact-us': '/contact/',
    '/industrial-engraving': '/',
    '/commercial-engraving': '/',
    '/trophies-awards': '/corporate-glass-awards/',
    '/trophies-and-awards': '/corporate-glass-awards/',
    // We no longer supply trophies or medals.
    '/trophies-cardiff': '/corporate-glass-awards/',
    '/club-medals-trophies-cost': '/corporate-glass-awards/',
    // No council or trade supply any more.
    '/bench-plaque-supplier': '/memorial-bench-plaques/',
    // Bench plaques are the only plaques we still make.
    '/memorial-plaques': '/memorial-bench-plaques/',
    '/commemorative-opening-plaques': '/memorial-bench-plaques/',
    '/engraved-nameplates-signs-labels': '/',
    '/can-we-engrave-it': '/contact/',
    '/bench-plaque-cost': '/memorial-bench-plaques/',
    '/glass-and-crystal-trophies': '/corporate-glass-awards/',
  },
});
