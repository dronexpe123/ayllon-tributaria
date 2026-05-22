// ── SUPABASE CONFIG ──
const SUPABASE_URL = 'https://devrxybkakzijnrvnxcv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRldnJ4eWJrYWt6aWpucnZueGN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzOTQyMTgsImV4cCI6MjA5NDk3MDIxOH0.Veh-oqpCI4wDUp_kbfnBWsCDAVFD0_A2mcfelSIW998';

async function supabase(method, table, options = {}) {
  const { data, match, order, limit } = options;
  let url = `${SUPABASE_URL}/rest/v1/${table}`;
  const params = [];
  if (order) params.push(`order=${order}`);
  if (limit) params.push(`limit=${limit}`);
  if (match) {
    Object.entries(match).forEach(([k, v]) => params.push(`${k}=eq.${encodeURIComponent(v)}`));
  }
  if (params.length) url += '?' + params.join('&');

  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase ${res.status}: ${err}`);
  }

  const text = await res.text();
  if (!text) return [];
  return JSON.parse(text);
}

// ── API ──
export const db = {
  async getBlogs() {
    return await supabase('GET', 'blogs', { order: 'fecha.desc' });
  },
  async getBlog(id) {
    const rows = await supabase('GET', 'blogs', { match: { id } });
    return rows[0] || null;
  },
  async addBlog(data) {
    return await supabase('POST', 'blogs', { data });
  },
  async updateBlog(id, data) {
    return await supabase('PATCH', `blogs?id=eq.${id}`, { data });
  },
  async deleteBlog(id) {
    await fetch(`${SUPABASE_URL}/rest/v1/blogs?id=eq.${id}`, {
      method: 'DELETE',
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
  },
  async getCursos() {
    return await supabase('GET', 'cursos', { order: 'fecha.desc' });
  },
  async addCurso(data) {
    return await supabase('POST', 'cursos', { data });
  },
  async updateCurso(id, data) {
    return await supabase('PATCH', `cursos?id=eq.${id}`, { data });
  },
  async deleteCurso(id) {
    await fetch(`${SUPABASE_URL}/rest/v1/cursos?id=eq.${id}`, {
      method: 'DELETE',
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
  },
  async getMensajes() {
    return await supabase('GET', 'mensajes', { order: 'fecha.desc' });
  },
  async addMensaje(data) {
    return await supabase('POST', 'mensajes', { data });
  },
  async updateMensaje(id, data) {
    return await supabase('PATCH', `mensajes?id=eq.${id}`, { data });
  },
  async deleteMensaje(id) {
    await fetch(`${SUPABASE_URL}/rest/v1/mensajes?id=eq.${id}`, {
      method: 'DELETE',
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
  },
  async getRedes() {
    const rows = await supabase('GET', 'redes', {});
    return rows[0] || null;
  },
  async saveRedes(data) {
    const rows = await supabase('GET', 'redes', {});
    if (rows.length === 0) return await supabase('POST', 'redes', { data });
    return await supabase('PATCH', `redes?id=eq.${rows[0].id}`, { data });
  },
  async getPerfil() {
    const rows = await supabase('GET', 'config', { match: { id: 'perfil' } });
    return rows[0] || null;
  },
  async savePerfil(foto) {
    const rows = await supabase('GET', 'config', { match: { id: 'perfil' } });
    if (rows.length === 0) return await supabase('POST', 'config', { data: { id: 'perfil', foto } });
    return await supabase('PATCH', `config?id=eq.perfil`, { data: { foto } });
  }
};

// ── AUTH SIMPLE (sin Firebase) ──
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
  logout() {
    sessionStorage.removeItem('admin_ok');
  },
  isLoggedIn() {
    return sessionStorage.getItem('admin_ok') === '1';
  }
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