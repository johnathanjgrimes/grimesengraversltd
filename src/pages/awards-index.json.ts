// /awards-index.json – compact award details by code, so the quote page can add an award from a
// ?award=CODE link (e.g. a shared or bookmarked link) without loading the whole catalogue page.
import type { APIRoute } from 'astro';
import { awards, awardUrl, fromPrice, mm, fit } from '../lib/awards';

export const GET: APIRoute = () => {
  const index = Object.fromEntries(awards.map((a) => {
    const f = fit(a.engraving_area_mm);
    return [a.sku, { sku: a.sku, name: a.name, image: a.image, price: fromPrice(a.price_from), unit: a.price_from, size: mm(a.dimensions_mm), area: mm(a.engraving_area_mm),
      fitChars: f?.perLine ?? null, fitLines: f?.lines ?? null, url: awardUrl(a), src: a.source_url, stock: a.in_stock }];
  }));
  return new Response(JSON.stringify(index), { headers: { 'Content-Type': 'application/json' } });
};
