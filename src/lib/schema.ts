// Schema.org structured data. Used by Google, Bing and AI assistants (ChatGPT, Claude, Perplexity, Gemini)
// to understand who the business is, what it does, where, and on what terms.
import config from '../data/config.json';
import services from '../data/services.json';

const SITE = config.site;
// Full address for an image: our own paths get the site in front, supplier photos are already full.
export const absUrl = (u: string) => (/^https?:\/\//.test(u) ? u : `${SITE}${u}`);
const BUSINESS_ID = `${SITE}/#business`;

export function business() {
  return {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'ProfessionalService'],
    '@id': BUSINESS_ID,
    name: config.name,
    alternateName: config.shortName,
    url: `${SITE}/`,
    logo: `${SITE}/assets/img/logo.png`,
    image: [`${SITE}/assets/img/glass-award.jpg`, `${SITE}/assets/img/bench-plaque.jpg`, `${SITE}/assets/img/grimes-original.jpg`],
    description: config.summary,
    email: config.email,
    foundingDate: config.founded,
    slogan: 'Professional engravers since 1947. Celebrating 80 years.',
    knowsLanguage: ['en-GB', 'cy'],
    address: { '@type': 'PostalAddress', addressLocality: config.locality, addressRegion: config.region, addressCountry: 'GB' },
    areaServed: [
      ...config.areas.map((name) => ({ '@type': 'Place', name })),
      { '@type': 'Country', name: 'United Kingdom' },
    ],
    contactPoint: {
      '@type': 'ContactPoint', email: config.email, contactType: 'sales',
      areaServed: 'GB', availableLanguage: ['English', 'Welsh'],
    },
    // No visits or collections: city only, no street address, and no opening hours on purpose.
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Engraving services',
      itemListElement: services.map((s) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: s.name, description: s.description, url: `${SITE}${s.url}` },
        ...(s.priceFrom ? { priceSpecification: { '@type': 'PriceSpecification', priceCurrency: 'GBP', minPrice: s.priceFrom } } : {}),
        ...(s.minimum ? { eligibleQuantity: { '@type': 'QuantitativeValue', minValue: s.minimum } } : {}),
      })),
    },
    knowsAbout: ['Glass and crystal awards', 'Memorial bench plaques', 'Engraving', 'Welsh language engraving'],
    sameAs: [config.trustpilot],
  };
}

export function website() {
  return { '@context': 'https://schema.org', '@type': 'WebSite', '@id': `${SITE}/#website`, url: `${SITE}/`, name: config.shortName, publisher: { '@id': BUSINESS_ID }, inLanguage: 'en-GB' };
}

export function webPage(path: string, title: string, description: string, image: string) {
  return {
    '@context': 'https://schema.org', '@type': 'WebPage', '@id': `${SITE}${path}#webpage`,
    url: `${SITE}${path}`, name: title, description, isPartOf: { '@id': `${SITE}/#website` },
    about: { '@id': BUSINESS_ID }, inLanguage: 'en-GB',
    primaryImageOfPage: { '@type': 'ImageObject', url: absUrl(image) },
  };
}

export function service(path: string) {
  const s = services.find((x) => x.url === path);
  if (!s) return null;
  return {
    '@context': 'https://schema.org', '@type': 'Service', '@id': `${SITE}${path}#service`,
    name: s.name, serviceType: s.name, description: s.description, url: `${SITE}${path}`,
    provider: { '@id': BUSINESS_ID },
    areaServed: [{ '@type': 'City', name: 'Cardiff' }, { '@type': 'Country', name: 'United Kingdom' }],
    ...(s.priceFrom ? { offers: { '@type': 'Offer', priceCurrency: 'GBP', price: s.priceFrom, priceSpecification: { '@type': 'PriceSpecification', priceCurrency: 'GBP', minPrice: s.priceFrom } } } : {}),
    ...(s.minimum ? { offers: { '@type': 'Offer', eligibleQuantity: { '@type': 'QuantitativeValue', minValue: s.minimum } } } : {}),
    ...(s.catalogue ? { hasOfferCatalog: { '@type': 'OfferCatalog', name: `${s.name} catalogue`, url: s.catalogue } } : {}),
    ...(s.audience ? { audience: { '@type': 'Audience', audienceType: s.audience } } : {}),
  };
}

export function faqPage(faqs: { q: string; a: string }[]) {
  if (!faqs || !faqs.length) return null;
  return {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
}

export function breadcrumb(path: string, title: string) {
  if (path === '/') return null;
  return {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: title.split('|')[0].trim(), item: `${SITE}${path}` },
    ],
  };
}

export function pageSchema(path: string, title: string, description: string, faqs: { q: string; a: string }[] = [], image = '/assets/img/glass-award.jpg') {
  return [business(), website(), webPage(path, title, description, image), service(path), faqPage(faqs), breadcrumb(path, title)].filter(Boolean);
}
