// After each build, write a markdown copy of every indexable page next to it (/star-awards/index.md),
// for AI assistants and agents that prefer plain text. Pages say so with <link rel="alternate" type="text/markdown">.
// Skipped: redirects, noindex pages, and award sizes whose canonical is another page.
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import TurndownService from 'turndown';

const walk = (dir) => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? walk(p) : p.endsWith('.html') ? [p] : [];
});
const SITE = 'https://grimesengravers.com';
const abs = (u) => (u && u.startsWith('/') ? SITE + u : u);
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&#39;|&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

export default function markdownCopies() {
  return {
    name: 'markdown-copies',
    hooks: {
      'astro:build:done': ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        const td = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-', codeBlockStyle: 'fenced' });
        td.remove(['script', 'style', 'noscript', 'svg', 'form', 'button', 'input', 'select', 'textarea', 'dialog', 'iframe']);
        td.addRule('ariaHidden', { filter: (n) => n.getAttribute && n.getAttribute('aria-hidden') === 'true', replacement: () => '' });
        td.addRule('images', { filter: 'img', replacement: (_, n) => (n.getAttribute('alt') ? `![${n.getAttribute('alt')}](${abs(n.getAttribute('src'))})` : '') });
        td.addRule('links', { filter: (n) => n.nodeName === 'A' && n.getAttribute('href'), replacement: (c, n) => { const h = n.getAttribute('href'); return h.startsWith('#') ? c : `[${c.trim()}](${abs(h)})`; } });
        let n = 0;
        for (const file of walk(root)) {
          if (!file.endsWith('index.html')) continue;
          const html = readFileSync(file, 'utf8');
          if (/name="robots" content="noindex/.test(html) || /<title>Redirecting/.test(html)) continue;
          const path = '/' + relative(root, file).replace(/index\.html$/, '');
          const canonical = (html.match(/rel="canonical" href="([^"]+)"/) || [])[1] || '';
          if (canonical && !canonical.endsWith(path)) continue;
          const main = (html.match(/<main[^>]*>([\s\S]*?)<\/main>/) || [])[1];
          if (!main) continue;
          const title = decode((html.match(/<title>([^<]*)<\/title>/) || [])[1] || '');
          const desc = decode((html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '');
          const body = td.turndown(main).replace(/\n{3,}/g, '\n\n').trim();
          writeFileSync(file.replace(/index\.html$/, 'index.md'), `# ${title}\n\n> ${desc}\n\nURL: ${canonical}\n\n${body}\n`);
          n++;
        }
        logger.info(`${n} markdown copies written`);
      },
    },
  };
}
