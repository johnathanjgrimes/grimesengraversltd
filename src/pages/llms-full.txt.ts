// /llms-full.txt – every page's summary and FAQs in one plain-text file for AI assistants.
import type { APIRoute } from 'astro';
import config from '../data/config.json';
import pages from '../data/pages.json';
import faqs from '../data/faqs.json';
import services from '../data/services.json';
import reviews from '../data/reviews.json';
import { collections, productsIn } from '../lib/collections';
import { products, awardUrl, MIN_QTY } from '../lib/awards';

export const GET: APIRoute = () => {
  const P = pages as Record<string, { url: string; title: string; description: string }>;
  const F = faqs as Record<string, { q: string; a: string }[]>;
  const sections = Object.entries(P).map(([slug, pg]) => {
    const svc = services.find((s) => s.url === pg.url);
    const qa = (F[slug] || []).map((f) => `Q: ${f.q}\nA: ${f.a}`).join('\n\n');
    return `## ${pg.title.split('|')[0].trim()}\nURL: ${config.site}${pg.url}\n\n${pg.description}${svc ? `\n\n${svc.description}` : ''}${qa ? `\n\n${qa}` : ''}`;
  });
  // Range and occasion pages, with their FAQs.
  const colls = collections.map((c) => `## ${c.h1}\nURL: ${config.site}/${c.slug}/\n\n${c.intro}\n\n${c.faqs.map((f) => `Q: ${f.q}\nA: ${f.a}`).join('\n\n')}`);
  // Every award with its sizes and "from" prices (per award, engraving quoted on top).
  const gbp = (n: number) => `£${n.toFixed(2)}`;
  const catalogue = products.map(({ main, sizes }) => {
    const name = sizes.length > 1 ? main.product : main.name;
    const sz = sizes.map((x) => `${x.size || x.dimensions_mm} ${gbp(x.price_from)}`).join(', ');
    return `- ${name} (${main.range}): ${sz}. ${config.site}${awardUrl(main)}`;
  });
  const rv = [reviews.trustpilot.count ? `Trustpilot: TrustScore ${reviews.trustpilot.rating ?? ''} from ${reviews.trustpilot.count} reviews (${reviews.trustpilot.url})` : '',
    reviews.google.count ? `Google: ${reviews.google.rating?.toFixed(1)} from ${reviews.google.count} reviews` : ''].filter(Boolean).join('\n');
  const body = `# ${config.name} – full reference\n\n${config.summary}\n\nEmail ${config.email} (email only, no phone) · ${config.workingDays} · Quotes ${config.quoteTime} · Lead time ${config.leadTime} · No visits or collections, all orders delivered.\nMinimum order: ${config.minimumOrder}\n\n## Reviews\n\n${rv}\n\n${sections.join('\n\n---\n\n')}\n\n---\n\n${colls.join('\n\n---\n\n')}\n\n---\n\n## Glass and crystal award catalogue\n\n${products.length} awards. Prices are "from" prices per award by size; engraving is quoted on top. Minimum order ${MIN_QTY} awards in total, any mix. Award finder: ${config.site}/award-finder/\n\n${catalogue.join('\n')}\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
