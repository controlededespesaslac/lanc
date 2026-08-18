const SUPABASE_URL = 'https://hobqmcphwbebkyducfda.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvYnFtY3Bod2JlYmt5ZHVjZmRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcwNjc5ODYsImV4cCI6MjEwMjY0Mzk4Nn0.gpM-ra0fzEe2clJM8_dqB7ihaV_q3ICFtVRzVcar25Q';

const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const loginOverlay = document.getElementById('login-overlay');
const mainApp = document.getElementById('main-app');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout');
const nav = document.querySelector('.nav');
const tabContents = document.querySelectorAll('.tab-content');

const dForm = document.getElementById('despesa-form');
const dData = document.getElementById('d-data');
const dCidade = document.getElementById('d-cidade');
const dObra = document.getElementById('d-obra');
const dMaterial = document.getElementById('d-material');
const dQuantidade = document.getElementById('d-quantidade');
const dValor = document.getElementById('d-valor');
const dFornecedor = document.getElementById('d-fornecedor');
const dDescricao = document.getElementById('d-descricao');
const dObs = document.getElementById('d-obs');
const dSubmit = document.getElementById('d-submit');
const dCancelar = document.getElementById('d-cancelar');
const despesasBody = document.getElementById('despesas-body');
const despesasEmpty = document.getElementById('despesas-empty');

const cadastroForms = document.querySelectorAll('.cadastro-form');
const listaCidades = document.getElementById('lista-cidades');
const listaObras = document.getElementById('lista-obras');
const listaMateriais = document.getElementById('lista-materiais');

const dashObra = document.getElementById('dash-obra');
const dashMaterial = document.getElementById('dash-material');
const dashFornecedor = document.getElementById('dash-fornecedor');
const dashDe = document.getElementById('dash-de');
const dashAte = document.getElementById('dash-ate');
const dashAgrupar = document.getElementById('dash-agrupar');
const dashFiltrar = document.getElementById('dash-filtrar');
const dashImprimir = document.getElementById('dash-imprimir');
const dashBody = document.getElementById('dash-body');
const dashTotal = document.getElementById('dash-total');
const barCanvas = document.getElementById('bar-chart');
const pieCanvas = document.getElementById('pie-chart');

const printFiltros = document.getElementById('print-filtros');
const printBar = document.getElementById('print-bar');
const printPie = document.getElementById('print-pie');
const printTable = document.getElementById('print-table');

dData.valueAsDate = new Date();

let barChart = null;
let pieChart = null;
let editingId = null;

function formatCurrency(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatNumber(value) {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(value) {
  return new Date(value + 'T00:00:00').toLocaleDateString('pt-BR');
}

function checkLogin() {
  if (sessionStorage.getItem('logged') === '1') {
    loginOverlay.classList.add('hidden');
    mainApp.classList.remove('hidden');
  } else {
    loginOverlay.classList.remove('hidden');
    mainApp.classList.add('hidden');
  }
}

function init() {
  carregarCadastros();
  renderDespesas();
}

loginForm.addEventListener('submit', e => {
  e.preventDefault();
  const user = document.getElementById('login-user').value.trim();
  const pass = document.getElementById('login-pass').value;
  if (user === 'bruno' && pass === 'sertania88') {
    sessionStorage.setItem('logged', '1');
    loginError.textContent = '';
    checkLogin();
    init();
  } else {
    loginError.textContent = 'Usuário ou senha inválidos.';
  }
});

logoutBtn.addEventListener('click', () => {
  sessionStorage.removeItem('logged');
  checkLogin();
});

nav.addEventListener('click', e => {
  if (!e.target.matches('.nav-btn')) return;
  const tab = e.target.dataset.tab;
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  e.target.classList.add('active');
  tabContents.forEach(s => s.classList.remove('active'));
  document.getElementById(tab).classList.add('active');
  if (tab === 'dashboard') updateDashboard();
});

async function carregarCadastros() {
  const [cidades, obras, materiais] = await Promise.all([
    client.from('cidades').select('*').order('nome'),
    client.from('obras').select('*').order('nome'),
    client.from('materiais').select('*').order('nome')
  ]);

  renderLista('cidades', cidades.data || []);
  renderLista('obras', obras.data || []);
  renderLista('materiais', materiais.data || []);

  fillSelect(dCidade, cidades.data || []);
  fillSelect(dObra, obras.data || []);
  fillSelect(dMaterial, materiais.data || []);
  fillSelect(dashObra, obras.data || [], 'Todas');
  fillSelect(dashMaterial, materiais.data || [], 'Todos');
}

function renderLista(tipo, items) {
  const ul = document.getElementById('lista-' + tipo);
  ul.innerHTML = '';
  items.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item.nome;
    const btn = document.createElement('button');
    btn.textContent = 'x';
    btn.addEventListener('click', () => excluirCadastro(tipo, item.id));
    li.appendChild(btn);
    ul.appendChild(li);
  });
}

function fillSelect(select, items, defaultLabel) {
  const val = select.value;
  select.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  if (defaultLabel) {
    placeholder.textContent = defaultLabel;
  } else {
    placeholder.textContent = 'Selecione...';
    placeholder.disabled = true;
    placeholder.selected = true;
  }
  select.appendChild(placeholder);
  items.forEach(item => {
    const opt = document.createElement('option');
    opt.value = item.nome;
    opt.textContent = item.nome;
    select.appendChild(opt);
  });
  select.value = val || '';
}

async function excluirCadastro(tipo, id) {
  if (!confirm('Excluir?')) return;
  await client.from(tipo).delete().eq('id', id);
  await carregarCadastros();
}

cadastroForms.forEach(form => {
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const tipo = form.dataset.tipo;
    const nome = form.querySelector('input').value.trim();
    if (!nome) return;
    await client.from(tipo).insert([{ nome }]);
    form.reset();
    await carregarCadastros();
  });
});

async function loadDespesas() {
  const { data, error } = await client.from('despesas').select('*').order('data', { ascending: false });
  if (error) return [];
  return data || [];
}

async function renderDespesas() {
  const items = await loadDespesas();
  despesasBody.innerHTML = '';
  if (items.length === 0) {
    despesasEmpty.style.display = 'block';
    return;
  }
  despesasEmpty.style.display = 'none';
  items.forEach(item => {
    const tr = document.createElement('tr');
    appendTd(tr, formatDate(item.data));
    appendTd(tr, item.cidade);
    appendTd(tr, item.obra);
    appendTd(tr, item.material);
    appendTd(tr, item.descricao);
    appendTd(tr, formatNumber(item.quantidade));
    appendTd(tr, formatCurrency(item.valor_total));
    appendTd(tr, item.fornecedor);
    const acao = document.createElement('td');
    const edit = document.createElement('button');
    edit.textContent = 'Editar';
    edit.className = 'edit-btn';
    edit.addEventListener('click', () => editarDespesa(item));
    acao.appendChild(edit);
    const btn = document.createElement('button');
    btn.textContent = 'Excluir';
    btn.className = 'delete-btn';
    btn.addEventListener('click', () => excluirDespesa(item.id));
    acao.appendChild(btn);
    tr.appendChild(acao);
    despesasBody.appendChild(tr);
  });
}

function appendTd(tr, text) {
  const td = document.createElement('td');
  td.textContent = text;
  tr.appendChild(td);
}

async function excluirDespesa(id) {
  if (!confirm('Excluir este lançamento?')) return;
  await client.from('despesas').delete().eq('id', id);
  await renderDespesas();
}

function editarDespesa(item) {
  editingId = item.id;
  dData.value = item.data;
  dCidade.value = item.cidade;
  dObra.value = item.obra;
  dMaterial.value = item.material;
  dQuantidade.value = item.quantidade;
  dValor.value = item.valor_total;
  dFornecedor.value = item.fornecedor;
  dDescricao.value = item.descricao || '';
  dObs.value = item.observacoes || '';
  dSubmit.textContent = 'Salvar Alterações';
  dCancelar.classList.remove('hidden');
  dForm.scrollIntoView({ behavior: 'smooth' });
}

dCancelar.addEventListener('click', () => {
  editingId = null;
  dForm.reset();
  dData.valueAsDate = new Date();
  dSubmit.textContent = 'Salvar Lançamento';
  dCancelar.classList.add('hidden');
});

dForm.addEventListener('submit', async e => {
  e.preventDefault();

  let q = parseFloat(dQuantidade.value);
  if (isNaN(q) || q < 0) q = 0;
  const v = parseFloat(dValor.value);
  if (isNaN(v) || v <= 0) return;

  const despesa = {
    data: dData.value,
    cidade: dCidade.value,
    obra: dObra.value,
    material: dMaterial.value,
    quantidade: q,
    valor_total: v,
    fornecedor: dFornecedor.value.trim(),
    descricao: dDescricao.value.trim(),
    observacoes: dObs.value.trim()
  };

  let error;
  if (editingId) {
    const result = await client.from('despesas').update(despesa).eq('id', editingId);
    error = result.error;
  } else {
    despesa.id = Date.now().toString(36) + Math.random().toString(36).slice(2);
    const result = await client.from('despesas').insert([despesa]);
    error = result.error;
  }

  if (error) {
    alert('Erro ao salvar no banco.');
    return;
  }

  editingId = null;
  dSubmit.textContent = 'Salvar Lançamento';
  dCancelar.classList.add('hidden');
  dForm.reset();
  dData.valueAsDate = new Date();
  await renderDespesas();
});

async function updateDashboard() {
  let items = await loadDespesas();
  const obra = dashObra.value;
  const material = dashMaterial.value;
  const fornecedor = dashFornecedor.value.trim().toLowerCase();
  const de = dashDe.value;
  const ate = dashAte.value;
  const agrupar = dashAgrupar.value;

  if (obra) items = items.filter(i => i.obra === obra);
  if (material) items = items.filter(i => i.material === material);
  if (fornecedor) items = items.filter(i => i.fornecedor.toLowerCase().includes(fornecedor));
  if (de) items = items.filter(i => i.data >= de);
  if (ate) items = items.filter(i => i.data <= ate);

  dashBody.innerHTML = '';
  let total = 0;
  items.forEach(item => {
    total += parseFloat(item.valor_total);
    const tr = document.createElement('tr');
    appendTd(tr, formatDate(item.data));
    appendTd(tr, item.cidade);
    appendTd(tr, item.obra);
    appendTd(tr, item.material);
    appendTd(tr, formatNumber(item.quantidade));
    appendTd(tr, formatCurrency(item.valor_total));
    appendTd(tr, item.fornecedor);
    dashBody.appendChild(tr);
  });

  dashTotal.textContent = 'Total: ' + formatCurrency(total);

  const groups = {};
  items.forEach(item => {
    const key = item[agrupar];
    groups[key] = (groups[key] || 0) + parseFloat(item.valor_total);
  });

  let labels = Object.keys(groups);
  let values = Object.values(groups);

  if (labels.length === 0) {
    labels = ['Sem dados'];
    values = [0];
  }

  renderCharts(labels, values);
  updatePrintArea(items, labels, values, { obra, material, fornecedor, de, ate, agrupar }, total);
}

function renderCharts(labels, values) {
  if (barChart) barChart.destroy();
  if (pieChart) pieChart.destroy();

  const colors = ['#1a73e8', '#34a853', '#fbbc05', '#ea4335', '#9aa0a6', '#673ab7', '#00bcd4', '#ff9800', '#795548', '#607d8b'];

  const barColors = labels.map((_, i) => colors[i % colors.length]);

  barChart = new Chart(barCanvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Valor Total',
        data: values,
        backgroundColor: barColors
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } }
    }
  });

  pieChart = new Chart(pieCanvas, {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: barColors
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

function updatePrintArea(items, labels, values, filters, total) {
  const partes = [];
  if (filters.obra) partes.push('Obra: ' + filters.obra);
  if (filters.material) partes.push('Material: ' + filters.material);
  if (filters.fornecedor) partes.push('Fornecedor: ' + filters.fornecedor);
  if (filters.de) partes.push('De: ' + formatDate(filters.de));
  if (filters.ate) partes.push('Até: ' + formatDate(filters.ate));
  partes.push('Agrupado por: ' + filters.agrupar);
  partes.push('Total: ' + formatCurrency(total));

  printFiltros.textContent = partes.join(' | ');

  printTable.innerHTML = '<thead><tr><th>Data</th><th>Cidade</th><th>Obra</th><th>Material</th><th>Qtd</th><th>Valor</th><th>Fornecedor</th></tr></thead><tbody></tbody>';
  const tbody = printTable.querySelector('tbody');
  items.forEach(item => {
    const tr = document.createElement('tr');
    appendTd(tr, formatDate(item.data));
    appendTd(tr, item.cidade);
    appendTd(tr, item.obra);
    appendTd(tr, item.material);
    appendTd(tr, formatNumber(item.quantidade));
    appendTd(tr, formatCurrency(item.valor_total));
    appendTd(tr, item.fornecedor);
    tbody.appendChild(tr);
  });

  if (barChart) printBar.src = barChart.toBase64Image();
  if (pieChart) printPie.src = pieChart.toBase64Image();
}

[dashObra, dashMaterial, dashFornecedor, dashDe, dashAte, dashAgrupar].forEach(el =>
  el.addEventListener('change', updateDashboard)
);

dashFiltrar.addEventListener('click', updateDashboard);
dashImprimir.addEventListener('click', () => window.print());

checkLogin();
if (sessionStorage.getItem('logged') === '1') init();
