// /api/business.json – key facts about Grimes Engravers for AI agents and other tools.
import type { APIRoute } from 'astro';
import config from '../../data/config.json';
import reviews from '../../data/reviews.json';
import services from '../../data/services.json';
import { collections } from '../../lib/collections';
import { MIN_QTY } from '../../lib/awards';

export const GET: APIRoute = () => {
  const body = {
    name: config.name, url: `${config.site}/`, summary: config.summary, founded: config.founded,
    location: `${config.locality}, ${config.region}, UK`, areas_served: [...config.areas, 'UK-wide delivery'],
    contact: { email: config.email, phone: null, note: 'Email only. No visits, appointments or collections; every order is delivered.' },
    working_days: config.workingDays, quote_time: config.quoteTime, lead_time: config.leadTime,
    minimum_order: config.minimumOrder, glass_award_minimum: MIN_QTY,
    languages: ['English', 'Welsh'],
    services: services.map((s) => ({ name: s.name, description: s.description, url: `${config.site}${s.url}` })),
    does_not_offer: ['Trophies or medals', 'Plaques other than memorial bench plaques', 'Nameplates, signs or labels', 'Engraving personal items', 'Visits or collections', 'Council or trade supply'],
    pages: {
      catalogue: `${config.site}/glass-awards/`, award_finder: `${config.site}/award-finder/`, quote: `${config.site}/quote/`,
      collections: collections.map((c) => ({ name: c.name, kind: c.kind, url: `${config.site}/${c.slug}/` })),
    },
    reviews: {
      trustpilot: { trustscore: reviews.trustpilot.rating, count: reviews.trustpilot.count, url: reviews.trustpilot.url },
      google: { rating: reviews.google.rating, count: reviews.google.count },
    },
    data: { awards: `${config.site}/api/awards.json`, openapi: `${config.site}/openapi.json`, llms: `${config.site}/llms.txt`, llms_full: `${config.site}/llms-full.txt` },
  };
  return new Response(JSON.stringify(body, null, 1), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
