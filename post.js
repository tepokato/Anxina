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

// ====== Skip link
const skip = document.querySelector('.skip-link');
if (skip) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 0) skip.classList.add('hidden');
  }, { once: true });
  skip.addEventListener('click', () => skip.classList.add('hidden'));
}

const params = new URLSearchParams(window.location.search);
const id = params.get('id');
const blogId = '4840049977445065362';
const apiKey = 'AIzaSyCD9Zu57Qrr7ExMkxXYl0KAbqVTS8ox-PA';

const titleEl = document.getElementById('post-title');
const metaEl = document.getElementById('post-meta');
const contentEl = document.getElementById('post-content');

function formatDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('es-419', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch (e) { return iso; }
}

function stripHtml(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

function estimateReadingTime(text) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200)) + ' min de lectura';
}

function estimateReadingTimeShort(text) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200)) + ' min';
}

async function loadPost() {
  if (!id) {
    titleEl.textContent = 'Artículo no encontrado';
    return;
  }
  const url = `https://www.googleapis.com/blogger/v3/blogs/${blogId}/posts/${id}?key=${apiKey}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(res.statusText);
    const data = await res.json();
    titleEl.textContent = data.title || '';
    const text = stripHtml(data.content || '');
    const meta = [data.author && data.author.displayName, formatDate(data.published), estimateReadingTime(text)].filter(Boolean).join(' • ');
    metaEl.textContent = meta;
    contentEl.innerHTML = data.content || '';
  } catch (err) {
    titleEl.textContent = 'Error al cargar el artículo';
    console.error(err);
  }
}

loadPost();

// ====== Búsqueda y filtrado de artículos
let articles = [];
const searchSection = document.getElementById('searchSection');
const articlesEl = document.getElementById('articles');

async function loadArticles() {
  const url = 'https://www.googleapis.com/blogger/v3/blogs/4840049977445065362/posts?key=AIzaSyCD9Zu57Qrr7ExMkxXYl0KAbqVTS8ox-PA';
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(res.statusText);
    const data = await res.json();
    articles = (data.items || []).map(item => {
      const text = stripHtml(item.content || '');
      return {
        id: item.id,
        titulo: item.title || '',
        resumen: text.slice(0, 160) + (text.length > 160 ? '…' : ''),
        categoria: (item.labels && item.labels[0]) || 'General',
        etiquetas: item.labels ? item.labels.slice(1) : [],
        fecha: item.published ? item.published.split('T')[0] : '',
        lectura: estimateReadingTimeShort(text)
      };
    });
  } catch (err) {
    console.error('Error al cargar artículos', err);
  }
}

function renderArticles(list) {
  if (!searchSection || !articlesEl) return;
  searchSection.hidden = false;
  articlesEl.innerHTML = '';
  list.forEach(a => {
    const link = document.createElement('a');
    link.href = `post.html?id=${a.id}`;
    link.setAttribute('role', 'listitem');

    const el = document.createElement('article');
    el.className = 'card';
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
    link.appendChild(el);
    articlesEl.appendChild(link);
  });
}

loadArticles();

// ====== Filtro por categoría
const links = document.querySelectorAll('.nav-links [data-filter]');
links.forEach(link => link.addEventListener('click', (e) => {
  e.preventDefault();
  const f = link.getAttribute('data-filter');
  links.forEach(l => l.removeAttribute('aria-current'));
  link.setAttribute('aria-current', 'page');
  const results = f === 'todas' ? articles : articles.filter(a => a.categoria === f);
  if (!results.length) {
    searchSection.hidden = false;
    articlesEl.innerHTML = '<p>No se encontraron coincidencias.</p>';
  } else {
    renderArticles(results);
  }
}));

// ====== Búsqueda simple
const q = document.getElementById('q');
q.addEventListener('input', () => {
  const term = q.value.trim().toLowerCase();
  const base = document.querySelector('.nav-links [aria-current="page"]').getAttribute('data-filter');
  const pool = base === 'todas' ? articles : articles.filter(a => a.categoria === base);
  const results = !term ? pool : pool.filter(a => (a.titulo + ' ' + a.resumen + ' ' + a.etiquetas.join(' ')).toLowerCase().includes(term));
  if (!results.length) {
    searchSection.hidden = false;
    articlesEl.innerHTML = '<p>No se encontraron coincidencias.</p>';
  } else {
    renderArticles(results);
  }
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

// ====== Cookie consent
(function () {
  const banner = document.getElementById('cookie-banner');
  const btn = document.getElementById('cookie-accept');
  if (!banner || !btn) return;
  let previous = null;
  if (!localStorage.getItem('cookieConsent')) {
    banner.classList.add('show');
    previous = document.activeElement;
    btn.focus();
  }
  btn.addEventListener('click', () => {
    banner.classList.remove('show');
    localStorage.setItem('cookieConsent', 'true');
    if (previous && typeof previous.focus === 'function') {
      previous.focus();
    }
  });
})();

const backToTop = document.getElementById('backToTop');
if (backToTop) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      backToTop.classList.add('show');
    } else {
      backToTop.classList.remove('show');
    }
  });
  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}
