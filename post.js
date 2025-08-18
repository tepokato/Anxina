const themeToggle = document.getElementById('themeToggle');

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

const skip = document.querySelector('.skip-link');
if (skip) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 0) skip.classList.remove('show');
  }, { once: true });
  skip.addEventListener('click', () => skip.classList.remove('show'));
}

const params = new URLSearchParams(window.location.search);
const id = params.get('id');
const blogId = '4840049977445065362';
const apiKey = 'AIzaSyCD9Zu57Qrr7ExMkxXYl0KAbqVTS8ox-PA';

const titleEl = document.getElementById('post-title');
const metaEl = document.getElementById('post-meta');
const contentEl = document.getElementById('post-content');
const fallbackImage = 'assets/ANXINA-LOGO-NO-BC.webp';

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
    document.title = data.title || '';
    const text = stripHtml(data.content || '');
    const meta = [data.author && data.author.displayName, formatDate(data.published), estimateReadingTime(text)].filter(Boolean).join(' • ');
    metaEl.textContent = meta;
    contentEl.innerHTML = data.content || '';
    contentEl.querySelectorAll('img').forEach(img => {
      if (!img.alt || img.alt.trim() === '') {
        img.alt = data.title || '';
      }
    });
  } catch (err) {
    titleEl.textContent = 'Error al cargar el artículo';
    console.error(err);
  }
}

loadPost();

let articles = [];

const q = document.getElementById('q');
const searchWrap = document.querySelector('.search');
const searchBtn = document.getElementById('searchBtn');
const suggestionsEl = document.getElementById('searchSuggestions');
const searchForm = document.getElementById('searchForm');

if (suggestionsEl) {
  suggestionsEl.addEventListener('click', e => {
    const li = e.target.closest('li');
    if (li && li.dataset.id) {
      window.location.href = `post.html?id=${li.dataset.id}`;
    }
  });
}

if (searchForm) {
  searchForm.addEventListener('submit', e => {
    e.preventDefault();
    const term = q.value.trim();
    if (term) {
      window.location.href = `search.html?q=${encodeURIComponent(term)}`;
    }
  });
}

searchBtn.addEventListener('click', e => {
  e.preventDefault();
  searchWrap.classList.toggle('active');
  const active = searchWrap.classList.contains('active');
  q.hidden = !active;
  searchBtn.setAttribute('aria-expanded', active);
  if (!active && suggestionsEl) suggestionsEl.innerHTML = '';
  if (!q.hidden) q.focus();
});

document.addEventListener('click', e => {
  if (!searchWrap.contains(e.target)) {
    searchWrap.classList.remove('active');
    q.hidden = true;
    searchBtn.setAttribute('aria-expanded', 'false');
    if (suggestionsEl) suggestionsEl.innerHTML = '';
  }
});

q.addEventListener('search', () => {
  const term = q.value.trim();
  if (term) window.location.href = `search.html?q=${encodeURIComponent(term)}`;
  searchWrap.classList.remove('active');
  q.hidden = true;
  searchBtn.setAttribute('aria-expanded', 'false');
  if (suggestionsEl) suggestionsEl.innerHTML = '';
});

q.addEventListener('input', () => {
  const term = q.value.trim().toLowerCase();
  const current = document.querySelector('.nav-links [aria-current="page"]');
  const base = current ? current.getAttribute('data-filter') : 'todas';
  const pool = base === 'todas' ? articles : articles.filter(a => a.categoria === base);
  const results = term
    ? pool.filter(a =>
        (a.titulo + ' ' + a.resumen + ' ' + a.etiquetas.join(' ')).toLowerCase().includes(term)
      )
    : [];
  if (suggestionsEl) {
    suggestionsEl.innerHTML = '';
    if (term) {
      results.slice(0,5).forEach(a => {
        const li = document.createElement('li');
        li.textContent = a.titulo;
        li.dataset.id = a.id;
        suggestionsEl.appendChild(li);
      });
    }
  }
});

document.getElementById('newsletterForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const msg = document.getElementById('newsletterMsg');
  msg.textContent = '¡Gracias! Revisa tu correo para confirmar la suscripción.';
  setTimeout(() => { msg.textContent = ''; }, 6000);
});

document.getElementById('y').textContent = new Date().getFullYear();

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
