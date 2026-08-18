const STORAGE_KEY = 'controle_despesas';
const form = document.getElementById('expense-form');
const description = document.getElementById('description');
const amount = document.getElementById('amount');
const category = document.getElementById('category');
const date = document.getElementById('date');
const filterCategory = document.getElementById('filter-category');
const tbody = document.getElementById('expenses-body');
const empty = document.getElementById('empty');
const totalEl = document.getElementById('total');
const countEl = document.getElementById('count');

date.valueAsDate = new Date();

function load() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

function save(expenses) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}

function formatCurrency(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(value) {
  return new Date(value + 'T00:00:00').toLocaleDateString('pt-BR');
}

function updateSummary(expenses) {
  const total = expenses.reduce((acc, item) => acc + item.amount, 0);
  totalEl.textContent = formatCurrency(total);
  countEl.textContent = expenses.length;
}

function render() {
  const expenses = load().sort((a, b) => new Date(b.date) - new Date(a.date));
  const filter = filterCategory.value;
  const filtered = filter ? expenses.filter(e => e.category === filter) : expenses;

  tbody.innerHTML = '';

  if (filtered.length === 0) {
    empty.style.display = 'block';
    updateSummary(filtered);
    return;
  }

  empty.style.display = 'none';

  filtered.forEach(item => {
    const row = document.createElement('tr');

    const dateTd = document.createElement('td');
    dateTd.dataset.label = 'Data';
    dateTd.textContent = formatDate(item.date);

    const descTd = document.createElement('td');
    descTd.dataset.label = 'Descrição';
    descTd.textContent = item.description;

    const catTd = document.createElement('td');
    catTd.dataset.label = 'Categoria';
    const badge = document.createElement('span');
    badge.textContent = item.category;
    catTd.appendChild(badge);

    const amountTd = document.createElement('td');
    amountTd.dataset.label = 'Valor';
    amountTd.textContent = formatCurrency(item.amount);

    const actionTd = document.createElement('td');
    const btn = document.createElement('button');
    btn.textContent = 'Excluir';
    btn.className = 'delete-btn';
    btn.addEventListener('click', () => remove(item.id));
    actionTd.appendChild(btn);

    row.append(dateTd, descTd, catTd, amountTd, actionTd);
    tbody.appendChild(row);
  });

  updateSummary(filtered);
}

function remove(id) {
  if (!confirm('Deseja excluir esta despesa?')) return;
  const expenses = load().filter(e => e.id !== id);
  save(expenses);
  render();
}

form.addEventListener('submit', event => {
  event.preventDefault();

  const value = parseFloat(amount.value);
  if (isNaN(value) || value <= 0) return;

  const expense = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2),
    description: description.value.trim(),
    amount: value,
    category: category.value,
    date: date.value
  };

  const expenses = load();
  expenses.push(expense);
  save(expenses);

  form.reset();
  date.valueAsDate = new Date();
  render();
});

filterCategory.addEventListener('change', render);

render();
