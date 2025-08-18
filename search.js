import('./utils/theme.js').then(({ initThemeToggle }) => initThemeToggle());

const skip = document.querySelector('.skip-link');
if (skip) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 0) skip.classList.remove('show');
  }, { once: true });
  skip.addEventListener('click', () => skip.classList.remove('show'));
}

let articles = [];

const articlesEl = document.getElementById('articles');
const resultsMsg = document.getElementById('resultsMsg');
const fallbackImage = 'assets/ANXINA-LOGO-NO-BC.webp';
const params = new URLSearchParams(window.location.search);
const initialTerm = (params.get('q') || '').trim();
const q = document.getElementById('q');
if (q && initialTerm) q.value = initialTerm;
const BLOGGER_API = '/.netlify/functions/blogger';
const CACHE_KEY = 'bloggerData';
const CACHE_TIME_KEY = 'bloggerDataTime';
const CACHE_MS = 60000;

function getCachedData() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

async function updateCache() {
  const res = await fetch(BLOGGER_API);
  if (!res.ok) throw new Error(res.statusText);
  const data = await res.json();
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    localStorage.setItem(CACHE_TIME_KEY, String(Date.now()));
  } catch (e) {}
  return data;
}

async function fetchPosts() {
  const storedTime = parseInt(localStorage.getItem(CACHE_TIME_KEY), 10);
  if (storedTime && Date.now() - storedTime < CACHE_MS) {
    const cached = getCachedData();
    if (cached) return cached;
  }
  return updateCache();
}

async function loadArticles() {
  try {
    const data = await fetchPosts();
    const items = Array.from(data.items || []);
    articles = items.map(item => {
      const content = item.content || '';
      const textContent = stripHtml(content);
      const div = document.createElement('div');
      div.innerHTML = content;
      const img = div.querySelector('img');
      const labels = item.labels || [];
      return {
        id: item.id || '',
        titulo: item.title || '',
        resumen: textContent.slice(0, 160) + (textContent.length > 160 ? '…' : ''),
        categoria: labels[0] || 'General',
        etiquetas: labels.slice(1),
        fecha: item.published ? new Date(item.published).toISOString().split('T')[0] : '',
        lectura: estimateReadingTime(textContent),
        autor: item.author?.displayName || '',
        imagen: img ? img.src : fallbackImage
      };
    });
    performSearch();
  } catch (err) {
    console.error('Error al cargar artículos', err);
    articlesEl.innerHTML = '<p>No se pudieron cargar los artículos.</p>';
  }
}

function performSearch() {
  const term = initialTerm.toLowerCase();
  const results = term
    ? articles.filter(a =>
        (a.titulo + ' ' + a.resumen + ' ' + a.etiquetas.join(' ')).toLowerCase().includes(term)
      )
    : [];
  if (!results.length) {
    resultsMsg.hidden = false;
    articlesEl.innerHTML = '';
  } else {
    resultsMsg.hidden = true;
    renderArticles(results);
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
      <figure class="thumb" aria-hidden="true"><img src="${a.imagen || fallbackImage}" alt="${a.titulo}" loading="lazy"></figure>
      <div class="pad">
        <span class="kicker">${a.categoria}</span>
        <h3>${a.titulo}</h3>
        <p>${a.resumen}</p>
        <div class="meta"><span>${formatDate(a.fecha)}</span><span>•</span><span>${a.lectura}</span>${a.autor ? `<span>•</span><span>${a.autor}</span>` : ''}</div>
      </div>
    `;
    link.appendChild(el);
    articlesEl.appendChild(link);
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
setInterval(updateCache, CACHE_MS);

const links = document.querySelectorAll('.nav-links [data-filter]');
links.forEach(link => link.addEventListener('click', (e) => {
  e.preventDefault();
  const f = link.getAttribute('data-filter');
  links.forEach(l => l.removeAttribute('aria-current'));
  link.setAttribute('aria-current', 'page');
  const results = f === 'todas' ? articles : articles.filter(a => a.categoria === f);
  if (!results.length) {
    resultsMsg.hidden = false;
    articlesEl.innerHTML = '';
  } else {
    resultsMsg.hidden = true;
    renderArticles(results);
  }
}));

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

