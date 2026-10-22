import { describe, it, expect, vi } from 'vitest';
import { unique, groupBy, chunk, deepClone, memoize, counter, inStockNames } from '../src/functions.js';

describe('unique', () => {
  it('removes duplicates and preserves order', () => expect(unique([3, 1, 3, 2])).toEqual([3, 1, 2]));
  it('handles an empty array', () => expect(unique([])).toEqual([]));
  it('rejects wrong types', () => expect(() => unique('abc')).toThrow(TypeError));
  it('treats repeated NaN as one value', () => expect(unique([NaN, NaN, 0, 0])).toEqual([NaN, 0]));
});
describe('groupBy', () => {
  it('groups objects by a computed key', () => {
    const items = [{ name: 'A', qty: 1 }, { name: 'B', qty: 0 }, { name: 'C', qty: 1 }];
    expect(groupBy(items, ({ qty }) => qty > 0 ? 'stock' : 'empty').stock).toEqual([items[0], items[2]]);
  });
  it('handles an empty array', () => expect(Object.keys(groupBy([], x => x))).toEqual([]));
  it('handles prototype-like keys safely', () => expect(groupBy(['x'], () => '__proto__').__proto__).toEqual(['x']));
  it('rejects a non-function', () => expect(() => groupBy([], null)).toThrow(TypeError));
  it('rejects a non-array', () => expect(() => groupBy(null, x => x)).toThrow(TypeError));
});
describe('chunk', () => {
  it('keeps the final incomplete part', () => expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]));
  it('handles an empty array', () => expect(chunk([], 2)).toEqual([]));
  it.each([0, -1, 1.5, NaN, '2'])('rejects invalid size %s', size => expect(() => chunk([1], size)).toThrow(RangeError));
  it('rejects a non-array', () => expect(() => chunk(null, 2)).toThrow(TypeError));
  it('does not mutate the input', () => {
    const arr = [1, 2]; const parts = chunk(arr, 1); parts[0][0] = 9; expect(arr).toEqual([1, 2]);
  });
});
describe('deepClone', () => {
  it('copies nested arrays, objects and Date independently', () => {
    const source = { entries: [{ qty: 2 }], date: new Date('2026-01-01') };
    const copy = deepClone(source);
    copy.entries[0].qty = 9; copy.date.setFullYear(2027);
    expect(source.entries[0].qty).toBe(2); expect(source.date.getFullYear()).toBe(2026);
    expect(copy.date).toBeInstanceOf(Date);
  });
  it.each([null, undefined, 0, false, 'text'])('preserves primitive %s', value => expect(deepClone(value)).toBe(value));
  it('copies an empty array', () => expect(deepClone([])).toEqual([]));
  it('preserves own __proto__ properties without prototype pollution', () => {
    const source = JSON.parse('{"__proto__":{"x":1}}');
    const copy = deepClone(source);
    expect(Object.hasOwn(copy, '__proto__')).toBe(true);
    expect(Object.getPrototypeOf(copy)).toBe(Object.prototype);
  });
});
describe('memoize', () => {
  it('caches multi-argument results', () => {
    const fn = vi.fn((a, b) => a + b); const cached = memoize(fn);
    expect(cached(2, 3)).toBe(5); expect(cached(2, 3)).toBe(5);
    expect(cached(3, 2)).toBe(5); expect(fn).toHaveBeenCalledTimes(2);
  });
  it('caches zero and undefined results', () => {
    const fn = vi.fn(x => x); const cached = memoize(fn);
    cached(0); cached(0); cached(undefined); cached(undefined);
    expect(fn).toHaveBeenCalledTimes(2);
  });
  it('keeps object identity and primitive types distinct', () => {
    const fn = vi.fn(x => x); const cached = memoize(fn); const a = {}; const b = {};
    cached(a); cached(a); cached(b); cached(1); cached('1'); expect(fn).toHaveBeenCalledTimes(4);
  });
  it('preserves this and caches each receiver separately', () => {
    const cached = memoize(function (n) { return this.rate * n; });
    expect(cached.call({ rate: 2 }, 3)).toBe(6); expect(cached.call({ rate: 4 }, 3)).toBe(12);
  });
  it('rejects a non-function', () => expect(() => memoize(1)).toThrow(TypeError));
});
describe('counter', () => {
  it('increments and decrements private state', () => {
    const c = counter(); expect(c.value()).toBe(0); expect(c.inc()).toBe(1); expect(c.dec()).toBe(0);
  });
  it('keeps instances independent', () => {
    const a = counter(3); const b = counter(); a.inc(); expect(a.value()).toBe(4); expect(b.value()).toBe(0);
  });
  it('rejects invalid initial values', () => expect(() => counter('0')).toThrow(TypeError));
});
it('selects names of available products', () => expect(inStockNames([{ name: 'A', qty: 0 }, { name: 'B', qty: 2 }])).toEqual(['B']));
