// ── API CONFIG ──
const API = 'https://ayllon-tributaria.onrender.com';
const ADMIN_KEY = 'ayllon-admin-2026';

async function api(method, endpoint, data = null, admin = false) {
  const headers = { 'Content-Type': 'application/json' };
  if (admin) headers['X-Admin-Key'] = ADMIN_KEY;
  const res = await fetch(`${API}${endpoint}`, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined
  });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return await res.json();
}

export const db = {
  // BLOGS
  async getBlogs()        { return await api('GET', '/api/blogs'); },
  async getBlog(id)       { return await api('GET', `/api/blogs/${id}`); },
  async addBlog(d)        { return await api('POST', '/api/blogs', d, true); },
  async updateBlog(id, d) { return await api('PUT', `/api/blogs/${id}`, d, true); },
  async deleteBlog(id)    { return await api('DELETE', `/api/blogs/${id}`, null, true); },

  // CURSOS
  async getCursos()        { return await api('GET', '/api/cursos'); },
  async addCurso(d)        { return await api('POST', '/api/cursos', d, true); },
  async updateCurso(id, d) { return await api('PUT', `/api/cursos/${id}`, d, true); },
  async deleteCurso(id)    { return await api('DELETE', `/api/cursos/${id}`, null, true); },

  // MENSAJES
  async getMensajes()        { return await api('GET', '/api/mensajes', null, true); },
  async addMensaje(d)        { return await api('POST', '/api/mensajes', d); },
  async updateMensaje(id, d) { return await api('PUT', `/api/mensajes/${id}`, d, true); },
  async deleteMensaje(id)    { return await api('DELETE', `/api/mensajes/${id}`, null, true); },

  // REDES
  async getRedes()    { return await api('GET', '/api/redes'); },
  async saveRedes(d)  { return await api('POST', '/api/redes', d, true); },

  // PERFIL
  async getPerfil()    { return await api('GET', '/api/perfil'); },
  async savePerfil(f)  { return await api('POST', '/api/perfil', { foto: f }, true); }
};

// ── AUTH SIMPLE ──
const ADMIN_EMAIL = 'ayllon.consulting@gmail.com';
const ADMIN_PASS  = 'ayllon2026';

export const auth = {
  login(email, pass) {
    if (email === ADMIN_EMAIL && pass === ADMIN_PASS) {
      sessionStorage.setItem('admin_ok', '1');
      return true;
    }
    return false;
  },
  logout()     { sessionStorage.removeItem('admin_ok'); },
  isLoggedIn() { return sessionStorage.getItem('admin_ok') === '1'; }
};

// ── NAVBAR SCROLL ──
const navbar = document.querySelector('.navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  });
}

// ── HAMBURGER ──
const hamburger = document.querySelector('.nav-hamburger');
const navLinks  = document.querySelector('.nav-links');
if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
}

// ── ENLACE ACTIVO ──
const currentPage = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-links a').forEach(a => {
  if (a.getAttribute('href') === currentPage) a.classList.add('active');
});

// ── ANIMACIONES SCROLL ──
const observer = new IntersectionObserver((entries) => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) {
      setTimeout(() => e.target.classList.add('visible'), i * 80);
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });
document.querySelectorAll('.animate-up').forEach(el => observer.observe(el));

// ── HELPERS ──
export function formatDate(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleDateString('es-BO', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function showToast(msg, type = 'success') {
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3000);
}

export function renderMarkdown(texto) {
  if (!texto) return '';
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.*?)__/g, '<u>$1</u>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    .split(/\n\n+/)
    .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
    .join('');
}