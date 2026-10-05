import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://grimesengravers.com',
  trailingSlash: 'always',
  integrations: [sitemap()],
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
