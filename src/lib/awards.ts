// Glass and crystal awards catalogue. Data lives in src/data/awards.json (generated from the
// supplier catalogue); this file gives every page the same slugs, labels and price formatting.
import raw from '../data/awards.json';

export interface Award {
  sku: string;
  name: string;
  range: string;
  dimensions_mm: string;
  engraving_area_mm: string;
  price_from: number;
  image: string;
  in_stock: boolean;
  source_url?: string;
  weight_kg?: number;
  sample?: boolean;
}

export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// "15cm Optical Crystal Star Column Award" -> size "15cm", product "Optical Crystal Star Column Award".
// Also handles "5cm x 5cm x 5cm …", "18cm Dia x 12mm …", "10oz …" and "1/2pt …".
const SIZE = /^\s*((?:\d+(?:[./]\d+)?\s*(?:cm|mm|oz|pt|")?(?:\s*dia)?\s*(?:x\s*)?)+)\s*/i;
export function splitSize(name: string): { size: string; product: string } {
  const m = name.match(SIZE);
  return m ? { size: m[1].trim().replace(/\s*x$/i, ''), product: name.slice(m[0].length).trim() } : { size: '', product: name };
}

// Sizes of the same product share a family. The supplier sometimes uses one name for two designs
// (e.g. two different "20cm Arch Award"s); when a size repeats, the code series (FC2…, SY2…) splits them.
const base = (raw as Award[]).map((a) => ({ ...a, slug: slugify(`${a.name}-${a.sku}`), ...splitSize(a.name) }));
const byName = new Map<string, typeof base>();
for (const a of base) {
  const k = `${a.range}|${a.product.toLowerCase()}`;
  byName.set(k, [...(byName.get(k) ?? []), a]);
}
const familyOf = new Map<string, string>();
for (const [k, list] of byName) {
  const clash = new Set(list.map((a) => a.size)).size !== list.length;
  for (const a of list) familyOf.set(a.sku, clash ? `${k}|${a.sku.match(/^[A-Z]+\d/)?.[0] ?? a.sku}` : k);
}
export const awards = base.map((a) => ({ ...a, family: slugify(familyOf.get(a.sku)!) }));
export type AwardWithSlug = (typeof awards)[number];

// Every size of an award (itself included), smallest first.
const families = new Map<string, AwardWithSlug[]>();
for (const a of awards) families.set(a.family, [...(families.get(a.family) ?? []), a]);
for (const list of families.values()) list.sort((x, y) => x.price_from - y.price_from);
export const sizesOf = (a: { family: string }) => families.get(a.family)!;
// One entry per product for the catalogue grid, in data order.
export const products = [...families.values()].sort((x, y) => awards.indexOf(x[0]) - awards.indexOf(y[0]))
  .map((sizes) => ({ main: sizes[0], sizes }));

// Ranges in the order the data lists them (set in scripts/build-awards.py).
export const ranges = [...new Set(awards.map((a) => a.range))];

export const awardUrl = (a: { slug: string }) => `/glass-awards/${a.slug}/`;
export const quoteUrl = (a?: { sku: string }) => (a ? `/quote/?award=${encodeURIComponent(a.sku)}` : '/quote/');

export const fromPrice = (n: number) => `from £${n.toFixed(2)}`;

// "H230 W150 D43" -> "H 230 × W 150 × D 43 mm"; anything else (e.g. "85mm Dia") is shown as given.
export const mm = (s: string) => {
  const t = (s || '').trim();
  if (!t) return '';
  const parts = t.split(/\s+/);
  return parts.every((p) => /^[A-Z]\d+(\.\d+)?$/.test(p)) ? parts.map((p) => p.replace(/^([A-Z])/, '$1 ')).join(' × ') + ' mm' : t;
};

export const MIN_QTY = 2;

// Rough guide to how much wording fits, assuming clear 5mm lettering (about 3.2mm per character,
// 8mm per line). Shown as a suggestion only; the proof decides. "85mm Dia" uses the square inside the circle.
export function fit(area: string): { perLine: number; lines: number } | null {
  const t = (area || '').toUpperCase();
  let h = Number(t.match(/H\s*(\d+(?:\.\d+)?)/)?.[1]);
  let w = Number(t.match(/W\s*(\d+(?:\.\d+)?)/)?.[1]);
  const dia = Number(t.match(/(\d+(?:\.\d+)?)\s*MM\s*DIA/)?.[1]);
  if (!(h && w) && dia) h = w = dia * 0.7;
  if (!(h && w)) return null;
  return { perLine: Math.max(4, Math.floor(w / 3.2)), lines: Math.max(1, Math.floor(h / 8)) };
}

// A short, original description built from the award's facts (material, shape, colour, range, size,
// engraving area). Written for our customers rather than copied from the supplier.
const RANGE_LINE: Record<string, string> = {
  'Optical crystal awards': 'Optical crystal gives exceptional clarity and a reassuring weight, so engraving stands out crisply.',
  'Star awards': 'The star detail makes it a natural fit for star performer, team of the year and recognition awards.',
  'Globe awards': 'The globe makes it a strong choice for international teams, export achievements and global milestones.',
  'Sports awards': 'A good fit for golf days, club competitions and sporting presentations.',
  '3D laser crystal awards': 'This style is made for 3D laser engraving inside the crystal, so your logo or design appears to float within it.',
  'Crystal awards on bases': 'Mounted on its own base, it stands proudly on a desk, shelf or presentation table.',
  'Jade & clear glass awards': 'Thick glass with a polished edge gives a classic look at a sensible price, ideal when you need several awards that match.',
};
const SHAPES = ['cube', 'hexagon', 'octagon', 'pentagon', 'star', 'globe', 'pyramid', 'diamond', 'heart', 'iceberg', 'flame', 'arch', 'circle', 'oval', 'obelisk', 'column', 'tower', 'wave', 'sail', 'peak', 'block', 'rectangle', 'square', 'plaque', 'tumbler', 'tankard', 'decanter', 'bowl', 'vase', 'clock', 'paperweight', 'keyring'];
const COLOURS = ['sapphire blue', 'blue', 'red', 'gold', 'silver', 'black', 'green', 'purple', 'amber', 'rose'];

export function describe(a: Award): string {
  const n = a.name.toLowerCase();
  const material = /jade/.test(n) ? 'jade glass' : /clear glass|glass\b/.test(n) && !/crystal/.test(n) ? 'glass' : /crystal/.test(n) ? 'optical crystal' : 'glass';
  const shape = SHAPES.find((s) => new RegExp(`\\b${s}`).test(n));
  const colour = COLOURS.find((c) => new RegExp(`\\b${c}\\b`).test(n));
  const h = Number(a.dimensions_mm.match(/H\s*(\d+)/i)?.[1]);
  const w = Number(a.dimensions_mm.match(/W\s*(\d+)/i)?.[1]);
  const f = fit(a.engraving_area_mm);
  const what = shape && !['tumbler', 'tankard', 'decanter', 'bowl', 'vase', 'clock', 'paperweight', 'keyring'].includes(shape) ? `${shape} award` : shape || 'award';
  const s: string[] = [];
  const opening = `${material} ${what}${colour ? ` with ${colour} detail` : ''}`;
  s.push(`${/^[aeiou]/.test(opening) ? 'An' : 'A'} ${opening}${h ? `, standing about ${Math.round(h / 10)}cm tall${w ? ` and ${Math.round(w / 10)}cm wide` : ''}` : ''}.`);
  if (RANGE_LINE[a.range]) s.push(RANGE_LINE[a.range]);
  if (f) s.push(`The engraving area is ${mm(a.engraving_area_mm)}, room for roughly ${f.lines === 1 ? 'one line' : `${f.lines} lines`} of wording, or a logo with a name and date.`);
  s.push('We engrave it with your logo and wording, and send a proof for you to approve before we start.');
  return s.join(' ');
}

// Extra words people search for that often aren't in the product name.
export function searchTags(name: string): string {
  const n = name.toLowerCase();
  const tags: string[] = [];
  if (/jade|clear glass/.test(n)) tags.push('glass');
  if (/crystal/.test(n)) tags.push('crystal');
  if (/golf/.test(n)) tags.push('golf sport sports');
  if (/football/.test(n)) tags.push('football soccer sport sports');
  if (/star/.test(n)) tags.push('star stars');
  if (/globe/.test(n)) tags.push('globe world earth');
  if (/blue|sapphire/.test(n)) tags.push('blue colour colored coloured');
  if (/tumbler|whisky|tankard|glass\b/.test(n)) tags.push('glassware drink');
  if (/heart/.test(n)) tags.push('heart love');
  return tags.join(' ');
}
