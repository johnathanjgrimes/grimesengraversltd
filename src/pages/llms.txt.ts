// /llms.txt – a plain-text summary for AI assistants and LLM crawlers (https://llmstxt.org).
import type { APIRoute } from 'astro';
import config from '../data/config.json';
import { anniversary } from '../lib/anniversary';
import pages from '../data/pages.json';
import services from '../data/services.json';
import collections from '../data/collections.json';

const p = (slug: string) => (pages as Record<string, { url: string; title: string; description: string }>)[slug];
const line = (slug: string) => { const x = p(slug); return `- [${x.title.split('|')[0].trim()}](${config.site}${x.url}): ${x.description}`; };

export const GET: APIRoute = () => {
  const body = `# ${config.name}

> ${config.summary}

## Key facts

- Established: ${config.founded}, Cardiff, Wales. Family-run, third generation.${anniversary ? ' Celebrating 80 years (1947–2027).' : ''}
- Contact: by email only, ${config.email} · ${config.site}. No telephone enquiries.
- Working days: ${config.workingDays}. Quotes ${config.quoteTime}.
- Lead time: ${config.leadTime}.
- Visiting: no visits, appointments or collections. All orders are delivered.
- Areas: ${config.areas.join(', ')}, and UK-wide by post.
- Minimum order: ${config.minimumOrder}
- Languages: engraving in English, Welsh or both.
- Does not offer: trophies or medals; memorial, wall or opening plaques other than bench plaques; nameplates, signs or labels; engraving of personal items (watches, jewellery, gifts); wooden items; while-you-wait engraving; council or trade supply. Glass awards need a minimum of 2 in total.
- Glass award pricing: "from" prices per award are listed at ${config.site}/glass-awards/; engraving is quoted separately.
- Award finder: ${config.site}/award-finder/ (choose occasion, quantity and budget per award to see matching awards).
- To get a quote: ${config.site}/quote/ (choose award, quantity of 2 or more, wording, date).
- How to order: email ${config.email} or use the quote form (${config.site}/contact/). Every order gets a proof before engraving.

## Services

${services.map((s) => `- [${s.name}](${config.site}${s.url}): ${s.description}${s.priceFrom ? ` From £${s.priceFrom}.` : ''}${s.minimum ? ` Minimum ${s.minimum} items.` : ''}`).join('\n')}

## Glass award ranges and occasions

${collections.map((c) => `- [${c.h1}](${config.site}/${c.slug}/): ${c.description}`).join('\n')}

## Guides and tools

${['award-wording-ideas', 'can-i-put-a-plaque-on-a-bench', 'bench-plaque-wording-ideas', 'plaque-fonts'].map(line).join('\n')}

## For AI agents and tools

- [Award catalogue (JSON)](${config.site}/api/awards.json): every award, size, engraving area and from price, with page links.
- [Business facts (JSON)](${config.site}/api/business.json): contact, terms, services and review scores.
- [OpenAPI description](${config.site}/openapi.json) of the above.
- Every page has a markdown copy: add index.md to its address, e.g. ${config.site}/star-awards/index.md

## Optional

- [About Grimes Engravers and key facts](${config.site}/about/)
- [Our work: photos of awards and bench plaques we have engraved](${config.site}/our-work/)
- [Full text for AI assistants](${config.site}/llms-full.txt)
- [Contact and quote form](${config.site}/contact/)
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
