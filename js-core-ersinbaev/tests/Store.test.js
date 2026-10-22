import { describe, it, expect } from 'vitest';
import { Store, SortedStore } from '../src/Store.js';
const product = { name: 'Milk', price: 550, qty: 2 };

describe('Store', () => {
  it('starts empty with a zero total', () => { const s = new Store(); expect(s.items).toEqual([]); expect(s.total()).toBe(0); });
  it('adds, trims and finds a product', () => { const s = new Store(); s.add({ ...product, name: ' Milk ' }); expect(s.find('Milk')).toEqual(product); });
  it('computes price times quantity', () => { const s = new Store(); s.add(product); expect(s.total()).toBe(1100); });
  it('calculates decimal money using cents', () => { const s = new Store(); s.add({ name: 'A', price: 0.1, qty: 3 }); expect(s.total()).toBe(0.3); });
  it('accepts zero quantity', () => { const s = new Store(); s.add({ ...product, qty: 0 }); expect(s.total()).toBe(0); });
  it('removes products and reports missing names', () => { const s = new Store(); s.add(product); expect(s.remove('Milk')).toBe(true); expect(s.remove('Milk')).toBe(false); expect(s.total()).toBe(0); });
  it('updates quantity and total', () => { const s = new Store(); s.add(product); s.updateQty('Milk', 3); expect(s.total()).toBe(1650); });
  it('rejects updating a missing product', () => expect(() => new Store().updateQty('X', 1)).toThrow('Product not found'));
  it('does not expose mutable private state', () => {
    const s = new Store(); const original = { ...product }; s.add(original); original.qty = 99;
    s.items[0].qty = 99; s.find('Milk').qty = 99; expect(s.total()).toBe(1100);
  });
  it('rejects duplicate names', () => { const s = new Store(); s.add(product); expect(() => s.add(product)).toThrow('already exists'); });
  it.each([{ name: '' }, { name: ' ' }, { name: 2 }, { price: 0 }, { price: -1 }, { price: '2' }, { price: Infinity }, { qty: NaN }, { qty: -1 }, { qty: 0.5 }, { qty: '2' }])('rejects invalid product %j', change => expect(() => new Store().add({ ...product, ...change })).toThrow());
  it('does not change quantity after invalid update', () => { const s = new Store(); s.add(product); expect(() => s.updateQty('Milk', -1)).toThrow(); expect(s.find('Milk').qty).toBe(2); });
  it('rejects unsafe monetary totals', () => expect(() => new Store().add({ name: 'X', price: Number.MAX_SAFE_INTEGER, qty: 2 })).toThrow());
  it('rejects prices rounding to zero', () => expect(() => new Store().add({ name: 'X', price: 0.001, qty: 1 })).toThrow());
  it('validates through a static method', () => expect(() => Store.validate(product)).not.toThrow());
});
describe('SortedStore', () => {
  it('inherits Store and sorts a safe copy by name', () => {
    const s = new SortedStore(); s.add({ name: 'Z', price: 1, qty: 1 }); const result = s.add({ name: 'A', price: 2, qty: 1 });
    expect(s).toBeInstanceOf(Store); expect(result.map(x => x.name)).toEqual(['A', 'Z']); expect(s.total()).toBe(3);
  });
  it('retains parent validation through super', () => expect(() => new SortedStore().add({ ...product, price: 0 })).toThrow());
});
