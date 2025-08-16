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

// ====== Datos de ejemplo (reemplaza con tu CMS/API)
const ARTICLES = [
  {
    id: 1,
    titulo: 'Argentina prueba identidad digital soberana con estándares abiertos',
    resumen: 'El piloto se enfoca en servicios públicos y evita el bloqueo por proveedor gracias a credenciales verificables.',
    categoria: 'Tecnología',
    etiquetas: ['identidad', 'gobierno digital'],
    fecha: '2025-08-10',
    lectura: '4 min'
  },
  {
    id: 2,
    titulo: 'Investigadoras peruanas logran bioplástico a partir de residuos de papa',
    resumen: 'Una alternativa compostable con propiedades similares al PE para empaques alimentarios.',
    categoria: 'Ciencia',
    etiquetas: ['materiales', 'sostenibilidad'],
    fecha: '2025-08-08',
    lectura: '5 min'
  },
  {
    id: 3,
    titulo: 'Brasil impulsa chips RISC-V en universidades públicas',
    resumen: 'Nuevos laboratorios de diseño y un fondo semilla para prototipos locales abren camino a la fabricación regional.',
    categoria: 'Tecnología',
    etiquetas: ['hardware', 'risc-v'],
    fecha: '2025-08-05',
    lectura: '6 min'
  },
  {
    id: 4,
    titulo: 'Vacuna termoestable contra dengue muestra eficacia en fase II',
    resumen: 'El candidato mantiene potencia a temperatura ambiente, clave para climas tropicales.',
    categoria: 'Ciencia',
    etiquetas: ['salud', 'vacunas'],
    fecha: '2025-08-01',
    lectura: '7 min'
  },
  {
    id: 5,
    titulo: 'Startups edtech latinoamericanas adoptan IA para tutorías personalizadas',
    resumen: 'Plataformas en español y portugués mejoran retención y acceso en zonas rurales.',
    categoria: 'Startups',
    etiquetas: ['educación', 'IA'],
    fecha: '2025-07-30',
    lectura: '3 min'
  },
  {
    id: 6,
    titulo: 'Opinión: regular la IA sin frenar la innovación en la región',
    resumen: 'Marcos de riesgo, sandboxes regulatorios y cooperación transfronteriza.',
    categoria: 'Opinión',
    etiquetas: ['política pública', 'IA'],
    fecha: '2025-07-28',
    lectura: '4 min'
  }
];

const articlesEl = document.getElementById('articles');

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

renderArticles(ARTICLES);

// ====== Filtro por categoría
const links = document.querySelectorAll('.nav-links [data-filter]');
links.forEach(link => link.addEventListener('click', (e) => {
  e.preventDefault();
  const f = link.getAttribute('data-filter');
  links.forEach(l => l.removeAttribute('aria-current'));
  link.setAttribute('aria-current', 'page');
  if (f === 'todas') { renderArticles(ARTICLES); return; }
  renderArticles(ARTICLES.filter(a => a.categoria === f));
}));

// ====== Búsqueda simple
const q = document.getElementById('q');
q.addEventListener('input', () => {
  const term = q.value.trim().toLowerCase();
  const base = document.querySelector('.nav-links [aria-current="page"]').getAttribute('data-filter');
  const pool = base === 'todas' ? ARTICLES : ARTICLES.filter(a => a.categoria === base);
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
