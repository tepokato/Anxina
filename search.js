import('./utils/theme.js').then(({ initThemeToggle }) => initThemeToggle());

let navControls = null;
import('./utils/nav.js')
  .then(({ initNavDisclosure }) => {
    navControls = initNavDisclosure();
  })
  .catch(err => {
    console.error('Error al inicializar el menú de navegación', err);
  });

const skip = document.querySelector('.skip-link');
if (skip) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 0) skip.classList.remove('show');
  }, { once: true });
  skip.addEventListener('click', () => skip.classList.remove('show'));
}

let articles = [];
let searchResults = [];

const articlesEl = document.getElementById('articles');
const resultsMsg = document.getElementById('resultsMsg');
const fallbackImage = 'assets/ANXINA-LOGO-NO-BC.webp';
const params = new URLSearchParams(window.location.search);
const initialTerm = (params.get('q') || '').trim();
const q = document.getElementById('q');
if (q && initialTerm) q.value = initialTerm;
// Prefer the runtime configuration but fall back to a public WordPress REST endpoint
// so the static build keeps working without Netlify Functions.
const fallbackApiUrl = 'https://wordpress.org/news/wp-json/wp/v2/posts?_embed=1';
const runtimeConfig = window.WP_CONFIG || {};
const apiUrl = runtimeConfig.apiUrl || fallbackApiUrl;
const username = runtimeConfig.username || '';
const password = runtimeConfig.password || '';
if (!runtimeConfig.apiUrl) {
  console.warn('WP_CONFIG.apiUrl is not defined; using WordPress News API fallback.');
}
const authOptions = username ? {
  headers: { Authorization: `Basic ${btoa(`${username}:${password ?? ''}`)}` }
} : undefined;
const WP_CACHE_KEY = 'wordpressData';
const WP_CACHE_TIME_KEY = 'wordpressDataTime';
const CACHE_MS = 60000;

function getCachedData() {
  try {
    const raw = localStorage.getItem(WP_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

async function updateCache() {
  const res = await fetch(apiUrl, authOptions);
  if (!res.ok) throw new Error(res.statusText);
  const data = await res.json();
  try {
    localStorage.setItem(WP_CACHE_KEY, JSON.stringify(data));
    localStorage.setItem(WP_CACHE_TIME_KEY, String(Date.now()));
  } catch (e) {}
  return data;
}

async function fetchPosts() {
  const storedTime = parseInt(localStorage.getItem(WP_CACHE_TIME_KEY), 10);
  if (storedTime && Date.now() - storedTime < CACHE_MS) {
    const cached = getCachedData();
    if (cached) return cached;
  }
  return updateCache();
}

async function loadArticles() {
  try {
    const data = await fetchPosts();
    const posts = Array.isArray(data) ? data : Array.from(data.items || []);
    articles = posts
      .map(mapWordPressPost)
      .filter(Boolean);
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
  searchResults = results;
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

function formatDate(value) {
  if (!value) return '';
  try {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('es-419', { year: 'numeric', month: 'short', day: 'numeric' });
    }
    const fallback = new Date(`${value}T12:00:00`);
    if (!Number.isNaN(fallback.getTime())) {
      return fallback.toLocaleDateString('es-419', { year: 'numeric', month: 'short', day: 'numeric' });
    }
  } catch (e) {}
  return value;
}

function stripHtml(html) {
  const div = document.createElement('div');
  div.innerHTML = html || '';
  return div.textContent || div.innerText || '';
}

function createSummary(text, limit = 160) {
  const cleaned = (text || '').trim();
  if (!cleaned) return '';
  return cleaned.length > limit ? cleaned.slice(0, limit).trimEnd() + '…' : cleaned;
}

function slugifyTerm(value) {
  return (value || '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function extractTerms(termGroups, taxonomy) {
  if (!Array.isArray(termGroups)) return [];
  const terms = [];
  termGroups.forEach(group => {
    if (Array.isArray(group)) {
      group.forEach(term => {
        if (term && term.taxonomy === taxonomy) {
          const name = stripHtml(term.name || '').trim();
          const rawSlug = typeof term.slug === 'string' ? term.slug.trim() : '';
          const slug = rawSlug ? slugifyTerm(rawSlug) : slugifyTerm(name);
          if (name || slug) {
            terms.push({ name, slug });
          }
        }
      });
    }
  });
  return terms;
}

function collectTermStrings(...lists) {
  const set = new Set();
  lists.forEach(list => {
    list.forEach(({ name, slug }) => {
      if (name) set.add(name);
      if (slug) set.add(slug);
    });
  });
  return Array.from(set);
}

function estimateReadingTime(text) {
  const words = (text || '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200)) + ' min';
}

function mapWordPressPost(post) {
  if (!post || typeof post !== 'object' || !post.id) return null;

  const contentHtml = post?.content?.rendered || '';
  const excerptHtml = post?.excerpt?.rendered || '';
  const titleHtml = post?.title?.rendered || '';

  const contentText = stripHtml(contentHtml).trim();
  const excerptText = stripHtml(excerptHtml).trim();
  const title = stripHtml(titleHtml).trim() || 'Sin título';
  const summarySource = excerptText || contentText || title;
  const resumen = createSummary(summarySource);

  const termGroups = post?._embedded?.['wp:term'] || [];
  const categories = extractTerms(termGroups, 'category');
  const tags = extractTerms(termGroups, 'post_tag');
  const primaryCategory = categories[0] || null;
  const categoria = primaryCategory?.name || 'General';
  const categoriaSlug = primaryCategory?.slug || slugifyTerm(categoria) || 'general';
  const termStrings = new Set(collectTermStrings(categories, tags));
  if (categoria) termStrings.add(categoria);
  if (categoriaSlug) termStrings.add(categoriaSlug);

  const featured = post?._embedded?.['wp:featuredmedia']?.[0];
  const image = featured?.source_url || featured?.media_details?.sizes?.medium?.source_url || '';
  const autor = stripHtml(post?._embedded?.author?.[0]?.name || '').trim();
  const fecha = post?.date || '';
  const readingSource = contentText || excerptText || title;

  return {
    id: String(post.id),
    titulo: title,
    resumen,
    categoria,
    categoriaSlug,
    etiquetas: Array.from(termStrings),
    fecha,
    lectura: estimateReadingTime(readingSource),
    autor,
    imagen: image,
    contenido: contentHtml
  };
}

function matchesCategory(article, filter) {
  if (!article || !filter) return false;
  const normalized = filter.toLowerCase();
  const slugFilter = slugifyTerm(filter);
  const slug = (article.categoriaSlug || '').toLowerCase();
  const name = (article.categoria || '').toLowerCase();
  const nameSlug = slugifyTerm(article.categoria || '');
  return (
    (slug && (slug === normalized || slug === slugFilter)) ||
    (name && (name === normalized || name === slugFilter)) ||
    (nameSlug && (nameSlug === normalized || nameSlug === slugFilter))
  );
}

function filterArticlesByCategory(filterValue, list = articles) {
  if (!Array.isArray(list)) return [];
  if (!filterValue || filterValue === 'todas') return list.slice();
  return list.filter(article => matchesCategory(article, filterValue));
}

loadArticles();
setInterval(updateCache, CACHE_MS);

const links = document.querySelectorAll('.nav-links [data-filter]');

function setActiveFilter(activeLink) {
  links.forEach(link => {
    if (link === activeLink) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

const defaultLink = document.querySelector('.nav-links [data-filter="todas"]');
if (defaultLink) setActiveFilter(defaultLink);

links.forEach(link => link.addEventListener('click', (e) => {
  e.preventDefault();
  const f = link.getAttribute('data-filter') || 'todas';
  setActiveFilter(link);
  if (f === 'todas') {
    performSearch();
  } else {
    const baseList = searchResults.length ? searchResults : articles;
    const results = filterArticlesByCategory(f, baseList);
    if (!results.length) {
      resultsMsg.hidden = false;
      articlesEl.innerHTML = '';
    } else {
      resultsMsg.hidden = true;
      renderArticles(results);
    }
  }
  if (navControls) navControls.close();
}));

const searchWrap = document.querySelector('.search');
const searchBtn = document.getElementById('searchBtn');
const suggestionsEl = document.getElementById('searchSuggestions');
const searchForm = document.getElementById('searchForm');

if (q && searchWrap && searchBtn && suggestionsEl) {
  let suggestionIdCounter = 0;
  const suggestionState = {
    items: [],
    activeIndex: -1
  };

  const clearSuggestions = () => {
    suggestionState.items.forEach(item => {
      item.classList.remove('is-active');
      item.setAttribute('aria-selected', 'false');
    });
    suggestionState.items = [];
    suggestionState.activeIndex = -1;
    suggestionsEl.innerHTML = '';
    suggestionsEl.scrollTop = 0;
    q.setAttribute('aria-expanded', 'false');
    q.removeAttribute('aria-activedescendant');
  };

  const setActiveSuggestion = (index, { scroll = true } = {}) => {
    suggestionState.activeIndex = index;
    suggestionState.items.forEach((item, i) => {
      const active = i === index && index >= 0;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-selected', active ? 'true' : 'false');
      if (active) {
        q.setAttribute('aria-activedescendant', item.id);
        if (scroll) {
          item.scrollIntoView({ block: 'nearest' });
        }
      }
    });
    if (index < 0) {
      q.removeAttribute('aria-activedescendant');
    }
  };

  const renderSuggestions = results => {
    suggestionsEl.innerHTML = '';
    suggestionState.items = [];
    suggestionState.activeIndex = -1;
    q.removeAttribute('aria-activedescendant');

    const entries = Array.isArray(results) ? results.slice(0, 5) : [];
    entries.forEach(result => {
      const li = document.createElement('li');
      li.id = `search-suggestion-${++suggestionIdCounter}`;
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', 'false');
      li.textContent = result.titulo;
      li.dataset.id = result.id;
      suggestionState.items.push(li);
      suggestionsEl.appendChild(li);
    });

    if (suggestionState.items.length) {
      q.setAttribute('aria-expanded', 'true');
    } else {
      q.setAttribute('aria-expanded', 'false');
    }
  };

  const moveActiveSuggestion = delta => {
    if (!suggestionState.items.length) return;
    const nextIndex = (suggestionState.activeIndex + delta + suggestionState.items.length) % suggestionState.items.length;
    setActiveSuggestion(nextIndex);
  };

  const navigateToSuggestion = li => {
    if (li && li.dataset.id) {
      window.location.href = `post.html?id=${li.dataset.id}`;
    }
  };

  const openSearch = () => {
    searchWrap.classList.add('active');
    q.hidden = false;
    searchBtn.setAttribute('aria-expanded', 'true');
    q.focus();
  };

  const closeSearch = () => {
    searchWrap.classList.remove('active');
    q.hidden = true;
    searchBtn.setAttribute('aria-expanded', 'false');
    clearSuggestions();
  };

  suggestionsEl.addEventListener('click', e => {
    const li = e.target.closest('li');
    if (li) {
      navigateToSuggestion(li);
    }
  });

  suggestionsEl.addEventListener('mouseover', e => {
    const li = e.target.closest('li');
    if (!li) return;
    const index = suggestionState.items.indexOf(li);
    if (index >= 0) {
      setActiveSuggestion(index, { scroll: false });
    }
  });

  suggestionsEl.addEventListener('mouseleave', () => {
    setActiveSuggestion(-1, { scroll: false });
  });

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
    if (searchWrap.classList.contains('active')) {
      closeSearch();
    } else {
      openSearch();
    }
  });

  document.addEventListener('click', e => {
    if (!searchWrap.contains(e.target)) {
      closeSearch();
    }
  });

  q.addEventListener('search', () => {
    const term = q.value.trim();
    if (term) {
      window.location.href = `search.html?q=${encodeURIComponent(term)}`;
    }
    closeSearch();
  });

  q.addEventListener('input', () => {
    const term = q.value.trim().toLowerCase();
    if (!term) {
      clearSuggestions();
      return;
    }
    const current = document.querySelector('.nav-links [aria-current="page"]');
    const base = current ? current.getAttribute('data-filter') : 'todas';
    const pool = filterArticlesByCategory(base);
    const results = pool.filter(a =>
      (a.titulo + ' ' + a.resumen + ' ' + a.etiquetas.join(' ')).toLowerCase().includes(term)
    );
    renderSuggestions(results);
  });

  q.addEventListener('keydown', e => {
    switch (e.key) {
      case 'ArrowDown':
        if (!suggestionState.items.length) return;
        e.preventDefault();
        moveActiveSuggestion(1);
        break;
      case 'ArrowUp':
        if (!suggestionState.items.length) return;
        e.preventDefault();
        moveActiveSuggestion(-1);
        break;
      case 'Enter':
        if (suggestionState.activeIndex >= 0) {
          e.preventDefault();
          const activeItem = suggestionState.items[suggestionState.activeIndex];
          navigateToSuggestion(activeItem);
        }
        break;
      case 'Escape':
        if (searchWrap.classList.contains('active')) {
          e.preventDefault();
          closeSearch();
          searchBtn.focus();
        }
        break;
      default:
        break;
    }
  });
}

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

