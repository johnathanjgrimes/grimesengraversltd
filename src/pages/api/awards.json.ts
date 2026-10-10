// /api/awards.json – the glass award catalogue for AI agents and other tools (read-only, rebuilt on every deploy).
// Supplier addresses and trade data are left out on purpose.
import type { APIRoute } from 'astro';
import config from '../../data/config.json';
import { products, awardUrl, mm, fit, MIN_QTY } from '../../lib/awards';
import { collections, productsIn } from '../../lib/collections';
import { absUrl } from '../../lib/schema';

export const GET: APIRoute = () => {
  const inColl = new Map<string, string[]>();
  for (const c of collections) for (const p of productsIn(c)) inColl.set(p.main.sku, [...(inColl.get(p.main.sku) ?? []), c.slug]);
  const body = {
    business: config.name, url: `${config.site}/`, updated: new Date().toISOString().slice(0, 10), currency: 'GBP',
    pricing: `Prices are "from" prices per award, before engraving. Engraving and delivery are confirmed in a quote by email within 24 hours. Minimum order ${MIN_QTY} awards in total, any mix of designs and sizes.`,
    how_to_order: { quote_form: `${config.site}/quote/`, quote_with_award: `${config.site}/quote/?award={sku}`, email: config.email, award_finder: `${config.site}/award-finder/` },
    stock_note: 'in_stock is as of the last site update; we confirm live stock in your quote.',
    count: products.length,
    awards: products.map(({ main, sizes }) => ({
      name: sizes.length > 1 ? main.product : main.name,
      range: main.range,
      url: `${config.site}${awardUrl(main)}`,
      image: absUrl(main.image),
      collections: (inColl.get(main.sku) ?? []).map((s) => `${config.site}/${s}/`),
      price_from: Math.min(...sizes.map((s) => s.price_from)),
      sizes: sizes.map((s) => {
        const f = fit(s.engraving_area_mm);
        return {
          sku: s.sku, name: s.name, size: s.size || null, dimensions: mm(s.dimensions_mm), engraving_area: mm(s.engraving_area_mm),
          fits: f ? `about ${f.perLine} characters a line, up to ${f.lines} lines` : null,
          weight_kg: s.weight_kg ?? null, price_from: s.price_from, in_stock: s.in_stock, url: `${config.site}${awardUrl(s)}`,
        };
      }),
    })),
  };
  return new Response(JSON.stringify(body, null, 1), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
