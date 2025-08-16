const themeToggle = document.getElementById('themeToggle');

// ====== Preferencias de tema (claro/oscuro)
(function initTheme() {
  try {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeToggle(theme);
  } catch(e) {}
})();
themeToggle.addEventListener('change', () => {
  const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  updateThemeToggle(next);
});

function updateThemeToggle(theme) {
  const isDark = theme === 'dark';
  themeToggle.checked = isDark;
  themeToggle.setAttribute('aria-label', isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
}

// ====== Datos de artículos (se cargan dinámicamente)
let articles = [];

const articlesEl = document.getElementById('articles');

async function loadArticles() {
  const url = 'https://www.googleapis.com/blogger/v3/blogs/4840049977445065362/posts?key=AIzaSyCD9Zu57Qrr7ExMkxXYl0KAbqVTS8ox-PA';
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(res.statusText);
    const data = await res.json();
    const mapped = (data.items || []).map(item => {
      const text = stripHtml(item.content || '');
      return {
        id: item.id,
        titulo: item.title || '',
        resumen: text.slice(0, 160) + (text.length > 160 ? '…' : ''),
        categoria: (item.labels && item.labels[0]) || 'General',
        etiquetas: item.labels ? item.labels.slice(1) : [],
        fecha: item.published ? item.published.split('T')[0] : '',
        lectura: estimateReadingTime(text)
      };
    });
    articles = mapped;
    renderArticles(articles);
  } catch (err) {
    console.error('Error al cargar artículos', err);
    articlesEl.innerHTML = '<p>No se pudieron cargar los artículos.</p>';
  }
}

function renderArticles(list) {
  articlesEl.innerHTML = '';
  list.forEach(a => {
    const el = document.createElement('article');
    el.className = 'card';
    el.setAttribute('role', 'listitem');
    el.innerHTML = `
      <div class="thumb" aria-hidden="true"></div>
      <div class="pad">
        <span class="kicker">${a.categoria}</span>
        <h3>${a.titulo}</h3>
        <p>${a.resumen}</p>
        <div class="tags">${a.etiquetas.map(t => `<span class='tag'>#${t}</span>`).join('')}</div>
      </div>
      <div class="pad meta"><span>${formatDate(a.fecha)}</span><span>•</span><span>${a.lectura}</span></div>
    `;
    articlesEl.appendChild(el);
  });
}

function formatDate(iso) {
  try {
    const d = new Date(iso + 'T12:00:00');
    return d.toLocaleDateString('es-419', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch(e) { return iso; }
}

function stripHtml(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

function estimateReadingTime(text) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200)) + ' min';
}

loadArticles();

// ====== Filtro por categoría
const links = document.querySelectorAll('.nav-links [data-filter]');
links.forEach(link => link.addEventListener('click', (e) => {
  e.preventDefault();
  const f = link.getAttribute('data-filter');
  links.forEach(l => l.removeAttribute('aria-current'));
  link.setAttribute('aria-current', 'page');
  if (f === 'todas') { renderArticles(articles); return; }
  renderArticles(articles.filter(a => a.categoria === f));
}));

// ====== Búsqueda simple
const q = document.getElementById('q');
q.addEventListener('input', () => {
  const term = q.value.trim().toLowerCase();
  const base = document.querySelector('.nav-links [aria-current="page"]').getAttribute('data-filter');
  const pool = base === 'todas' ? articles : articles.filter(a => a.categoria === base);
  const results = !term ? pool : pool.filter(a => (a.titulo + ' ' + a.resumen + ' ' + a.etiquetas.join(' ')).toLowerCase().includes(term));
  renderArticles(results);
});

// ====== Newsletter (demo)
document.getElementById('newsletterForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const msg = document.getElementById('newsletterMsg');
  msg.textContent = '¡Gracias! Revisa tu correo para confirmar la suscripción.';
  setTimeout(() => { msg.textContent = ''; }, 6000);
});

// Año en footer
document.getElementById('y').textContent = new Date().getFullYear();
