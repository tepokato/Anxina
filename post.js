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
