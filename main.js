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
    renderHero(mapped);
    articles = mapped.slice(4);
    renderArticles(articles);
  } catch (err) {
    console.error('Error al cargar artículos', err);
    articlesEl.innerHTML = '<p>No se pudieron cargar los artículos.</p>';
  }
}

function renderArticles(list) {
  articlesEl.innerHTML = '';
  list.forEach(a => {
    const link = document.createElement('a');
    link.href = `post.html?id=${a.id}`;
    link.setAttribute('role', 'listitem');

    const el = document.createElement('article');
    el.className = 'card';
    el.innerHTML = `
      <figure class="thumb" aria-hidden="true"></figure>
      <div class="pad">
        <span class="kicker">${a.categoria}</span>
        <h3>${a.titulo}</h3>
        <p>${a.resumen}</p>
        <div class="meta"><span>${formatDate(a.fecha)}</span><span>•</span><span>${a.lectura}</span></div>
      </div>
    `;
    link.appendChild(el);
    articlesEl.appendChild(link);
  });
}

function renderHero(list) {
  const heroEl = document.getElementById('hero');
  const miniListEl = document.getElementById('mini-list');
  if (!heroEl || !miniListEl || !list.length) return;

  const [first, ...rest] = list;
  heroEl.innerHTML = `
    <a href="post.html?id=${first.id}">
      <div class="thumb" aria-hidden="true"></div>
      <div class="pad">
        <span class="kicker">${first.categoria}</span>
        <h1 class="title-xl" id="destacados">${first.titulo}</h1>
        <p>${first.resumen}</p>
        <div class="meta"><span>${formatDate(first.fecha)}</span><span>•</span><span>${first.lectura}</span></div>
      </div>
    </a>
  `;

  miniListEl.innerHTML = '';
  rest.slice(0,3).forEach(a => {
    const link = document.createElement('a');
    link.href = `post.html?id=${a.id}`;
    link.className = 'mini';
    link.innerHTML = `
      <div class="thumb" aria-hidden="true"></div>
      <div class="pad">
        <span class="kicker">${a.categoria}</span>
        <h3>${a.titulo}</h3>
        <div class="meta"><span>${formatDate(a.fecha)}</span><span>•</span><span>${a.lectura}</span></div>
      </div>
    `;
    miniListEl.appendChild(link);
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
  const current = document.querySelector('.nav-links [aria-current="page"]');
  const base = current ? current.getAttribute('data-filter') : 'todas';
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
