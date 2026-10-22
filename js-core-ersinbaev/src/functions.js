function requireArray(value) {
  if (!Array.isArray(value)) throw new TypeError('Expected an array');
}

export function unique(arr) {
  requireArray(arr);
  return [...new Set(arr)];
}

export function groupBy(arr, keyFn) {
  requireArray(arr);
  if (typeof keyFn !== 'function') throw new TypeError('Expected a key function');
  // A null prototype also makes keys such as "__proto__" safe.
  return arr.reduce((groups, item) => {
    const key = keyFn(item);
    (groups[key] ??= []).push(item);
    return groups;
  }, Object.create(null));
}

export function chunk(arr, size) {
  requireArray(arr);
  if (!Number.isInteger(size) || size <= 0) throw new RangeError('Size must be a positive integer');
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, index) =>
    arr.slice(index * size, (index + 1) * size));
}

export function deepClone(value) {
  if (value === null || typeof value !== 'object') return value;
  if (value instanceof Date) return new Date(value.getTime());
  if (Array.isArray(value)) return value.map(deepClone);
  const clone = Object.create(Object.getPrototypeOf(value));
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if ('value' in descriptor) descriptor.value = deepClone(descriptor.value);
    Object.defineProperty(clone, key, descriptor);
  }
  return clone;
}

export function memoize(fn) {
  if (typeof fn !== 'function') throw new TypeError('Expected a function');
  // A Map tree preserves argument identity; JSON strings would lose it.
  const cache = new Map();
  const resultKey = Symbol('result');
  return function (...args) {
    let branch = cache;
    for (const key of [this, ...args]) {
      if (!branch.has(key)) branch.set(key, new Map());
      branch = branch.get(key);
    }
    if (!branch.has(resultKey)) branch.set(resultKey, fn.apply(this, args));
    return branch.get(resultKey);
  };
}

export function counter(initial = 0) {
  if (!Number.isFinite(initial)) throw new TypeError('Initial value must be finite');
  let current = initial;
  return {
    inc: () => ++current,
    dec: () => --current,
    value: () => current,
  };
}

// Small composition example: selection, destructuring, spread and map.
export function inStockNames(items) {
  requireArray(items);
  return items.filter(({ qty }) => qty > 0).map(({ name }) => name);
}
