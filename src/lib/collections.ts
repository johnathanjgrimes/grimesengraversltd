// Range and occasion collections (src/data/collections.json): which award products belong to each.
import collections from '../data/collections.json';
import { products } from './awards';

export type Collection = (typeof collections)[number];
type Match = { ranges?: string[]; include?: string; exclude?: string };

// A product belongs when any of its sizes is in one of the ranges and its name passes include/exclude.
export function productsIn(c: Collection) {
  const m = c.match as Match;
  const inc = m.include ? new RegExp(m.include, 'i') : null, exc = m.exclude ? new RegExp(m.exclude, 'i') : null;
  return products.filter(({ sizes }) => sizes.some((a) =>
    (!m.ranges || m.ranges.includes(a.range)) && (!inc || inc.test(a.name)) && !(exc && exc.test(a.name))));
}

export { collections };
