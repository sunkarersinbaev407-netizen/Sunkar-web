// Store is loaded first by a classic script so index.html also works via file://.
const store = new Store();
const form = document.querySelector('#product-form');
const list = document.querySelector('#product-list');
const total = document.querySelector('#total');
const status = document.querySelector('#status');
const fields = { name: form.elements.name, price: form.elements.price, qty: form.elements.qty };
const money = new Intl.NumberFormat('ru-KZ', { style: 'currency', currency: 'KZT', maximumFractionDigits: 2 });

function showError(key, message) {
  document.querySelector(`#${key}-error`).textContent = message;
  fields[key].setAttribute('aria-invalid', String(Boolean(message)));
}

function createButton(text, action, name, label) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = action === 'remove' ? 'remove' : 'qty-button';
  button.textContent = text;
  button.dataset.action = action;
  button.dataset.name = name;
  button.setAttribute('aria-label', label);
  return button;
}

function render() {
  list.replaceChildren();
  const items = store.items;
  if (!items.length) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    // Static markup only; user-entered content below always uses textContent.
    empty.innerHTML = '<span aria-hidden="true">▧</span><h3>Здесь начинается твой план</h3><p>Добавь товары через форму. Сумма появится автоматически.</p>';
    list.append(empty);
  }
  for (const { name, price, qty } of items) {
    const row = document.createElement('article');
    row.className = 'product';
    const heading = document.createElement('div');
    heading.className = 'product-title';
    const icon = document.createElement('span'); icon.className = 'product-icon'; icon.textContent = '▧'; icon.setAttribute('aria-hidden', 'true');
    const info = document.createElement('div');
    const title = document.createElement('h3'); title.textContent = name;
    const detail = document.createElement('p'); detail.textContent = `${money.format(price)} / шт.`;
    info.append(title, detail); heading.append(icon, info);
    const controls = document.createElement('div'); controls.className = 'product-controls';
    const minus = createButton('−', 'decrease', name, `Уменьшить количество: ${name}`); minus.disabled = qty === 0;
    const quantity = document.createElement('span'); quantity.className = 'qty-value'; quantity.textContent = qty; quantity.setAttribute('aria-label', `Количество: ${qty}`);
    const plus = createButton('+', 'increase', name, `Увеличить количество: ${name}`); plus.disabled = qty >= 1000000;
    const remove = createButton('×', 'remove', name, `Удалить: ${name}`);
    controls.append(minus, quantity, plus, remove);
    const subtotal = document.createElement('strong'); subtotal.className = 'line-total'; subtotal.textContent = money.format(Math.round(price * 100) * qty / 100);
    row.append(heading, controls, subtotal); list.append(row);
  }
  total.textContent = money.format(store.total());
  document.querySelector('#item-count').textContent = `${items.length} поз. / ${items.reduce((sum, { qty }) => sum + qty, 0)} шт.`;
}

form.addEventListener('submit', event => {
  event.preventDefault();
  for (const key of Object.keys(fields)) showError(key, '');
  const name = fields.name.value.trim();
  const price = fields.price.valueAsNumber;
  const qty = fields.qty.valueAsNumber;
  const errors = {};
  if (!name) errors.name = 'Введи название товара.';
  else if (name.length > 100) errors.name = 'Не более 100 символов.';
  else if (store.find(name)) errors.name = 'Этот товар уже есть. Измени его количество в списке.';
  if (!Number.isFinite(price) || price < 0.01 || price > 1000000000) errors.price = 'Укажи цену от 0,01 до 1 000 000 000 ₸.';
  else if (Math.abs(price * 100 - Math.round(price * 100)) > 0.00001) errors.price = 'Не больше двух знаков после запятой.';
  if (!Number.isSafeInteger(qty) || qty < 0 || qty > 1000000) errors.qty = 'Укажи целое количество от 0 до 1 000 000.';
  for (const [key, message] of Object.entries(errors)) showError(key, message);
  if (Object.keys(errors).length) { fields[Object.keys(errors)[0]].focus(); return; }
  try {
    store.add({ name, price, qty });
    render(); form.reset(); fields.name.focus(); status.textContent = `Добавлено: ${name}. Сумма пересчитана.`;
  } catch (error) {
    showError('price', error.message === 'Total is too large' ? 'Общая сумма слишком велика.' : 'Проверь цену и количество.');
  }
});

// A single delegated listener handles controls of existing and future rows.
list.addEventListener('click', event => {
  const button = event.target.closest('button[data-action]');
  if (!button || !list.contains(button)) return;
  const { name, action } = button.dataset;
  const item = store.find(name);
  if (!item) return;
  const nextRow = button.closest('.product').nextElementSibling;
  const previousRow = button.closest('.product').previousElementSibling;
  const fallbackName = nextRow?.querySelector('button')?.dataset.name ?? previousRow?.querySelector('button')?.dataset.name;
  try {
    if (action === 'remove') store.remove(name);
    else store.updateQty(name, item.qty + (action === 'increase' ? 1 : -1));
    render();
    status.textContent = action === 'remove' ? `Удалено: ${name}.` : `Количество «${name}»: ${store.find(name).qty}. Сумма пересчитана.`;
    const targetName = action === 'remove' ? fallbackName : name;
    const buttons = [...list.querySelectorAll('button')];
    const focusTarget = buttons.find(b => b.dataset.name === targetName && b.dataset.action === action && !b.disabled)
      ?? buttons.find(b => b.dataset.name === targetName && !b.disabled) ?? fields.name;
    focusTarget.focus();
  } catch {
    status.textContent = 'Нельзя изменить количество: достигнут предел допустимой суммы.';
  }
});

render();
