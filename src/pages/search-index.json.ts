// /search-index.json – everything the header search looks through: pages, common questions and awards.
// Loaded the first time someone opens search, so it costs nothing on pages where nobody searches.
import type { APIRoute } from 'astro';
import pages from '../data/pages.json';
import faqs from '../data/faqs.json';
import { collections } from '../lib/collections';
import { products, awardUrl, fromPrice, searchTags } from '../lib/awards';

const short = (t: string) => t.split('|')[0].trim();
// Words people type that aren't in a page's title.
const extra: Record<string, string> = {
  '/': 'home glass crystal awards cardiff engravers',
  '/memorial-bench-plaques/': 'bench plaque plaques memorial brass stainless steel park garden in memory remembrance',
  '/can-i-put-a-plaque-on-a-bench/': 'council permission park cemetery dedicate bench rules',
  '/bench-plaque-wording-ideas/': 'wording words verse poem phrases welsh cymraeg inscription what to write',
  '/plaque-fonts/': 'font fonts lettering preview style typeface script',
  '/corporate-glass-awards/': 'company corporate business staff awards night logo',
  '/contact/': 'contact email quote enquiry get in touch help',
  '/about/': 'about history family 1947 80 years anniversary who we are terms delivery lead time',
  '/glass-awards/': 'catalogue all awards shop browse trophy trophies',
  '/quote/': 'quote basket order price request',
  '/our-work/': 'our work photos gallery examples portfolio previous jobs',
  '/award-finder/': 'finder help choose recommend which award suggest ideas budget',
};

export const GET: APIRoute = () => {
  const items: any[] = [];
  // Shorter names where a page's search title would look like another page's.
  const names: Record<string, string> = { '/': 'Home', '/corporate-glass-awards/': 'Glass awards for companies', '/glass-awards/': 'All glass awards (catalogue)', '/quote/': 'Your quote', '/contact/': 'Contact us' };
  for (const p of Object.values(pages)) items.push({ t: 'page', name: names[p.url] ?? short(p.title), url: p.url, desc: p.description, k: extra[p.url] ?? '' });
  items.push({ t: 'page', name: 'Our work', url: '/our-work/', desc: 'Photos of crystal awards and memorial bench plaques we have engraved.', k: extra['/our-work/'] });
  items.push({ t: 'page', name: 'Award finder', url: '/award-finder/', desc: 'Answer three quick questions and see awards that suit your occasion and budget.', k: extra['/award-finder/'] });
  for (const c of collections) items.push({ t: 'page', name: c.name, url: `/${c.slug}/`, desc: c.description, k: `${c.slug.replace(/-/g, ' ')} ${c.kind === 'occasion' ? 'occasion' : 'range'}` });
  // Common questions, each linking to the page that answers it.
  const pageUrl = (key: string) => (pages as any)[key]?.url ?? '/';
  for (const [key, list] of Object.entries(faqs)) for (const f of list as { q: string; a: string }[]) items.push({ t: 'faq', name: f.q, url: pageUrl(key), desc: f.a, k: '' });
  for (const c of collections) for (const f of c.faqs ?? []) items.push({ t: 'faq', name: f.q, url: `/${c.slug}/`, desc: f.a, k: '' });
  // One entry per award, covering all its sizes and codes.
  for (const { main: a, sizes } of products) {
    const multi = sizes.length > 1;
    items.push({
      t: 'award', name: multi ? a.product.charAt(0).toUpperCase() + a.product.slice(1) : a.name, url: awardUrl(a), img: a.thumb,
      desc: `${a.range} · ${multi ? `${sizes.length} sizes` : a.dimensions_mm} · ${fromPrice(a.price_from)}`,
      k: `${sizes.map((s) => `${s.name} ${s.sku} ${s.dimensions_mm}`).join(' ')} ${a.range} ${searchTags(a.name)} award awards trophy`.toLowerCase(),
    });
  }
  return new Response(JSON.stringify(items), { headers: { 'Content-Type': 'application/json' } });
};
