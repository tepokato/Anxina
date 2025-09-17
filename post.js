import('./utils/theme.js').then(({ initThemeToggle }) => initThemeToggle());

const skip = document.querySelector('.skip-link');
if (skip) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 0) skip.classList.remove('show');
  }, { once: true });
  skip.addEventListener('click', () => skip.classList.remove('show'));
}

const params = new URLSearchParams(window.location.search);
const id = params.get('id');

const titleEl = document.getElementById('post-title');
const metaEl = document.getElementById('post-meta');
const contentEl = document.getElementById('post-content');
const fallbackImage = 'assets/ANXINA-LOGO-NO-BC.webp';
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

let articles = [];

function formatDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('es-419', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch (e) { return iso; }
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
  return Math.max(1, Math.ceil(words / 200)) + ' min de lectura';
}

function estimateReadingTimeShort(text) {
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
    lecturaCorta: estimateReadingTimeShort(readingSource),
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

async function loadPost() {
  if (!id) {
    titleEl.textContent = 'Artículo no encontrado';
    return;
  }
  try {
    const data = await fetchPosts();
    const posts = Array.isArray(data) ? data : Array.from(data.items || []);
    articles = posts
      .map(mapWordPressPost)
      .filter(Boolean);
    const post = articles.find(p => p.id === id);
    if (!post) {
      titleEl.textContent = 'Artículo no encontrado';
      return;
    }
    titleEl.textContent = post.titulo;
    document.title = post.titulo;
    const meta = [post.autor, formatDate(post.fecha), estimateReadingTime(stripHtml(post.contenido))].filter(Boolean).join(' • ');
    metaEl.textContent = meta;
    contentEl.innerHTML = post.contenido;
    contentEl.querySelectorAll('img').forEach(img => {
      if (!img.alt || img.alt.trim() === '') {
        img.alt = post.titulo;
      }
    });
  } catch (err) {
    titleEl.textContent = 'Error al cargar el artículo';
    console.error(err);
  }
}

loadPost();
setInterval(updateCache, CACHE_MS);

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
  const pool = filterArticlesByCategory(base);
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
