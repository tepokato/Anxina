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

let articles = [];

const articlesEl = document.getElementById('articles');
const fallbackImage = 'assets/ANXINA-LOGO-NO-BC.webp';
const RSS_FEED = 'https://www.blogger.com/feeds/4840049977445065362/posts/default?alt=rss';

async function loadArticles() {
  try {
    const res = await fetch(RSS_FEED);
    if (!res.ok) throw new Error(res.statusText);
    const text = await res.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'application/xml');
    const items = Array.from(xml.querySelectorAll('item'));
    const mapped = items.map(item => {
      const content = item.querySelector('content\\:encoded')?.textContent || '';
      const textContent = stripHtml(content);
      const div = document.createElement('div');
      div.innerHTML = content;
      const img = div.querySelector('img');
      const categories = Array.from(item.querySelectorAll('category')).map(c => c.textContent);
      return {
        id: item.querySelector('guid')?.textContent || '',
        titulo: item.querySelector('title')?.textContent || '',
        resumen: textContent.slice(0, 160) + (textContent.length > 160 ? '…' : ''),
        categoria: categories[0] || 'General',
        etiquetas: categories.slice(1),
        fecha: item.querySelector('pubDate') ? new Date(item.querySelector('pubDate').textContent).toISOString().split('T')[0] : '',
        lectura: estimateReadingTime(textContent),
        autor: item.querySelector('dc\\:creator')?.textContent || '',
        imagen: img ? img.src : fallbackImage
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

function renderHero(list) {
  const heroEl = document.getElementById('hero');
  const miniListEl = document.getElementById('mini-list');
  if (!heroEl || !miniListEl || !list.length) return;

  const [first, ...rest] = list;
  heroEl.innerHTML = `
    <a href="post.html?id=${first.id}">
      <figure class="thumb" aria-hidden="true"><img src="${first.imagen || fallbackImage}" alt="${first.titulo}"></figure>
      <div class="pad">
        <span class="kicker">${first.categoria}</span>
        <h1 class="title-xl" id="destacados">${first.titulo}</h1>
        <p>${first.resumen}</p>
        <div class="meta"><span>${formatDate(first.fecha)}</span><span>•</span><span>${first.lectura}</span>${first.autor ? `<span>•</span><span>${first.autor}</span>` : ''}</div>
      </div>
    </a>
  `;

  miniListEl.innerHTML = '';
  rest.slice(0,3).forEach(a => {
    const link = document.createElement('a');
    link.href = `post.html?id=${a.id}`;
    link.className = 'mini';
    link.innerHTML = `
      <figure class="thumb" aria-hidden="true"><img src="${a.imagen || fallbackImage}" alt="${a.titulo}" loading="lazy"></figure>
      <div class="pad">
        <span class="kicker">${a.categoria}</span>
        <h3>${a.titulo}</h3>
        <div class="meta"><span>${formatDate(a.fecha)}</span><span>•</span><span>${a.lectura}</span>${a.autor ? `<span>•</span><span>${a.autor}</span>` : ''}</div>
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

const links = document.querySelectorAll('.nav-links [data-filter]');
links.forEach(link => link.addEventListener('click', (e) => {
  e.preventDefault();
  const f = link.getAttribute('data-filter');
  links.forEach(l => l.removeAttribute('aria-current'));
  link.setAttribute('aria-current', 'page');
  if (f === 'todas') { renderArticles(articles); return; }
  renderArticles(articles.filter(a => a.categoria === f));
}));

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
