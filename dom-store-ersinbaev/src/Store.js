class Store {
  #items = [];

  static validate({ name, price, qty } = {}) {
    if (typeof name !== 'string' || !name.trim()) throw new TypeError('Name is required');
    if (!Number.isFinite(price) || price <= 0) throw new RangeError('Price must be positive');
    if (!Number.isSafeInteger(qty) || qty < 0) throw new RangeError('Quantity must be a non-negative integer');
    if (!Number.isSafeInteger(Math.round(price * 100)) || !Number.isSafeInteger(Math.round(price * 100) * qty)) {
      throw new RangeError('Amount is too large');
    }
  }

  get items() {
    // Copies prevent callers from changing the private state without validation.
    return this.#items.map(item => ({ ...item }));
  }

  add(item) {
    Store.validate(item);
    const { name, price, qty } = item;
    const cleanName = name.trim();
    if (this.find(cleanName)) throw new Error('A product with this name already exists');
    const normalized = { name: cleanName, price: Math.round(price * 100) / 100, qty };
    if (normalized.price <= 0) throw new RangeError('Minimum price is 0.01');
    const newTotal = this.total() * 100 + Math.round(normalized.price * 100) * qty;
    if (!Number.isSafeInteger(Math.round(newTotal))) throw new RangeError('Total is too large');
    this.#items.push(normalized);
    return { ...normalized };
  }

  find(name) {
    const item = this.#items.find(item => item.name === name);
    return item ? { ...item } : undefined;
  }

  remove(name) {
    const index = this.#items.findIndex(item => item.name === name);
    if (index === -1) return false;
    this.#items.splice(index, 1);
    return true;
  }

  updateQty(name, qty) {
    const item = this.#items.find(item => item.name === name);
    if (!item) throw new Error('Product not found');
    Store.validate({ ...item, qty });
    const totalCents = Math.round(this.total() * 100) + Math.round(item.price * 100) * (qty - item.qty);
    if (!Number.isSafeInteger(totalCents)) throw new RangeError('Total is too large');
    item.qty = qty;
    return { ...item };
  }

  total() {
    return this.#items.reduce((sum, { price, qty }) => sum + Math.round(price * 100) * qty, 0) / 100;
  }
}

class SortedStore extends Store {
  get items() {
    // super obtains the safe copy from Store, then sorts it by name.
    return super.items.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  }

  add(item) {
    // Override a method as well as the getter to demonstrate super explicitly.
    super.add(item);
    return this.items;
  }
}
