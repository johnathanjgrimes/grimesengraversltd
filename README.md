# grimesengravers.com

Astro 5 static site for Grimes Engravers Ltd, Cardiff, hosted on GitHub Pages. Same setup as bailey-electrical: everything is plain HTML at build time, with no server, database or admin panel.

| Layer | What | Where |
|---|---|---|
| Framework | Astro 5 (Node 22) | `astro.config.mjs` (also holds redirects from old Laravel URLs) |
| Layout and components | `.astro` | `src/layouts/Base.astro`, `src/components/Header.astro`, `Footer.astro` |
| Pages | One folder per URL | `src/pages/*/index.astro` |
| Styling | Tailwind CSS 3 via PostCSS (preflight off) plus custom classes | `tailwind.config.cjs`, `src/styles/global.css` |
| Data | Business details, services, FAQs, page titles, tool data | `src/data/*.json` |
| Interactive bits | Plain JavaScript | `public/js/` (site.js, checker.js, fonts.js) |
| SEO and AI | Schema.org JSON-LD, sitemap, llms.txt, llms-full.txt, robots.txt | `src/lib/schema.ts`, `src/pages/llms*.txt.ts`, `public/robots.txt` |
| Forms | Web3Forms (free), falling back to the visitor's email app | `public/js/site.js`, key in `src/data/config.json` |
| Hosting | GitHub Pages via GitHub Actions on push | `.github/workflows/deploy.yml` |

## Run locally

```
npm install
npm run dev      # http://localhost:4321
npm run build    # output in dist/
```

## Where to change things

- **Email, areas, minimum order, catalogue links**: `src/data/config.json`
- **Web3Forms and PostHog keys**: not in the repo. Copy `.env.example` to `.env` for local builds; for deploys they come from the GitHub Actions secrets `PUBLIC_WEB3FORMS_KEY` and `PUBLIC_POSTHOG_KEY`. Without them the form falls back to opening an email and analytics stays off.
- **Services, prices "from", minimums** (feeds schema and llms.txt): `src/data/services.json`
- **FAQs** (feeds FAQPage schema and llms-full.txt): `src/data/faqs.json`. Keep in step with the FAQ text on the page.
- **Page titles and descriptions**: `src/data/pages.json` (used by llms.txt) and the `meta` line at the top of each page

Most page markup still uses inline styles carried over from the design. New sections can use Tailwind classes (`src/pages/about/index.astro` is an example). The brand colours are in the Tailwind config as `navy`, `teal`, `brand`, `ink`, `muted` and `mist`.

## AI assistants and search

- Every page outputs JSON-LD: LocalBusiness (with an offer catalogue of services, minimum quantities and from-prices), WebSite, WebPage, Service on service pages, FAQPage and BreadcrumbList.
- `/llms.txt` is a short, factual summary for AI assistants, including what the business doesn't do, so chatbots don't send people for watch engraving. `/llms-full.txt` adds every page summary and FAQ.
- `/about/` is a plain key-facts page written to be quoted.
- `robots.txt` explicitly allows GPTBot, ClaudeBot, PerplexityBot, Google-Extended and others.

## Before going live

- [ ] Web3Forms access key in `src/data/config.json` (until then forms open the visitor's email app)
- [ ] Catalogue links in `src/data/config.json`
- [ ] Original photos from the old Laravel `public/` folder into `public/assets/img/` (same file names)
- [ ] Check redirects in `astro.config.mjs` against the old `routes/web.php`
- [ ] Confirm prices, turnaround, screws, minimums, style price bands and local referrals with Mum and Dad
- [ ] GitHub: Settings → Pages → Source: **GitHub Actions**. Custom domain `grimesengravers.com` (`public/CNAME`). Free accounts need the repo to be public.
- [ ] After launch: Google Search Console + submit `sitemap-index.xml`; update the Google Business Profile
