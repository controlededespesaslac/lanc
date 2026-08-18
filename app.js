const SUPABASE_URL = 'https://hobqmcphwbebkyducfda.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvYnFtY3Bod2JlYmt5ZHVjZmRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcwNjc5ODYsImV4cCI6MjEwMjY0Mzk4Nn0.gpM-ra0fzEe2clJM8_dqB7ihaV_q3ICFtVRzVcar25Q';
const FALLBACK_KEY = 'controle_despesas';

const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
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

function loadLocal() {
  const data = localStorage.getItem(FALLBACK_KEY);
  return data ? JSON.parse(data) : [];
}

function saveLocal(expenses) {
  localStorage.setItem(FALLBACK_KEY, JSON.stringify(expenses));
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

async function load() {
  try {
    const { data, error } = await client.from('despesas').select('*').order('date', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (err) {
    return loadLocal();
  }
}

async function render() {
  const expenses = await load();
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

async function remove(id) {
  if (!confirm('Deseja excluir esta despesa?')) return;

  try {
    const { error } = await client.from('despesas').delete().eq('id', id);
    if (error) throw error;
  } catch (err) {
    const expenses = loadLocal().filter(e => e.id !== id);
    saveLocal(expenses);
  }

  render();
}

form.addEventListener('submit', async event => {
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

  try {
    const { error } = await client.from('despesas').insert([expense]);
    if (error) throw error;
  } catch (err) {
    const expenses = loadLocal();
    expenses.push(expense);
    saveLocal(expenses);
  }

  form.reset();
  date.valueAsDate = new Date();
  render();
});

filterCategory.addEventListener('change', render);

render();
