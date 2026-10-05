// /llms-full.txt – every page's summary and FAQs in one plain-text file for AI assistants.
import type { APIRoute } from 'astro';
import config from '../data/config.json';
import pages from '../data/pages.json';
import faqs from '../data/faqs.json';
import services from '../data/services.json';

export const GET: APIRoute = () => {
  const P = pages as Record<string, { url: string; title: string; description: string }>;
  const F = faqs as Record<string, { q: string; a: string }[]>;
  const sections = Object.entries(P).map(([slug, pg]) => {
    const svc = services.find((s) => s.url === pg.url);
    const qa = (F[slug] || []).map((f) => `Q: ${f.q}\nA: ${f.a}`).join('\n\n');
    return `## ${pg.title.split('|')[0].trim()}\nURL: ${config.site}${pg.url}\n\n${pg.description}${svc ? `\n\n${svc.description}` : ''}${qa ? `\n\n${qa}` : ''}`;
  });
  const body = `# ${config.name} – full reference\n\n${config.summary}\n\nEmail ${config.email} (email only, no phone) · ${config.workingDays} · Quotes ${config.quoteTime} · Lead time ${config.leadTime} · No visits or collections, all orders delivered.\nMinimum order: ${config.minimumOrder}\n\n${sections.join('\n\n---\n\n')}\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
