from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
import psycopg2.extras
import os

app = Flask(__name__)

CORS(app, resources={
    r"/*": {
        "origins": [
            "https://ayllon-tributaria.netlify.app",
            "http://localhost",
            "http://127.0.0.1:5500",
            "null"
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "X-Admin-Key"]
    }
})

@app.after_request
def add_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    return response

ADMIN_KEY   = os.environ.get('ADMIN_KEY', 'ayllon-admin-2026')
DATABASE_URL = os.environ.get('DATABASE_URL', '')

def require_admin(f):
    from functools import wraps
    @wraps(f)
    def decorated(*args, **kwargs):
        key = request.headers.get('X-Admin-Key', '')
        if key != ADMIN_KEY:
            return jsonify({'ok': False, 'error': 'No autorizado'}), 401
        return f(*args, **kwargs)
    return decorated

def get_conn():
    conn = psycopg2.connect(DATABASE_URL)
    return conn

def query(sql, params=(), fetchone=False, fetchall=False, commit=False):
    conn = get_conn()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(sql, params)
        result = None
        if fetchone:
            row = cur.fetchone()
            result = dict(row) if row else None
        elif fetchall:
            rows = cur.fetchall()
            result = [dict(r) for r in rows]
        if commit:
            conn.commit()
        return result
    finally:
        conn.close()

def init_db():
    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute('''CREATE TABLE IF NOT EXISTS blogs (
            id SERIAL PRIMARY KEY,
            titulo TEXT NOT NULL,
            categoria TEXT DEFAULT 'Tributación',
            autor TEXT,
            resumen TEXT,
            contenido TEXT,
            contenido2 TEXT,
            contenido3 TEXT,
            imagen_portada TEXT,
            imagen_medio TEXT,
            imagen_medio_caption TEXT,
            imagen_final TEXT,
            imagen_final_caption TEXT,
            fecha TIMESTAMPTZ DEFAULT NOW()
        )''')
        cur.execute('''CREATE TABLE IF NOT EXISTS cursos (
            id SERIAL PRIMARY KEY,
            titulo TEXT NOT NULL,
            resumen TEXT,
            descripcion TEXT,
            contenido TEXT,
            imagen TEXT,
            modalidad TEXT DEFAULT 'Presencial',
            precio TEXT,
            duracion TEXT,
            estado TEXT DEFAULT 'activo',
            fecha TIMESTAMPTZ DEFAULT NOW()
        )''')
        cur.execute('''ALTER TABLE cursos ADD COLUMN IF NOT EXISTS resumen TEXT''')
        cur.execute('''ALTER TABLE cursos ADD COLUMN IF NOT EXISTS contenido TEXT''')
        cur.execute('''ALTER TABLE cursos ADD COLUMN IF NOT EXISTS imagen TEXT''')
        cur.execute('''CREATE TABLE IF NOT EXISTS mensajes (
            id SERIAL PRIMARY KEY,
            nombre TEXT,
            email TEXT,
            telefono TEXT,
            servicio TEXT,
            mensaje TEXT,
            leido BOOLEAN DEFAULT FALSE,
            fecha TIMESTAMPTZ DEFAULT NOW()
        )''')
        cur.execute('''CREATE TABLE IF NOT EXISTS redes (
            id SERIAL PRIMARY KEY,
            whatsapp TEXT,
            facebook TEXT,
            instagram TEXT,
            tiktok TEXT
        )''')
        cur.execute('''CREATE TABLE IF NOT EXISTS config (
            id TEXT PRIMARY KEY,
            foto TEXT
        )''')
        conn.commit()
    finally:
        conn.close()

# ── BLOGS ──
@app.route('/api/blogs', methods=['GET'])
def get_blogs():
    blogs = query('SELECT * FROM blogs ORDER BY fecha DESC', fetchall=True)
    return jsonify(blogs or [])

@app.route('/api/blogs/<int:id>', methods=['GET'])
def get_blog(id):
    blog = query('SELECT * FROM blogs WHERE id = %s', (id,), fetchone=True)
    if not blog:
        return jsonify({'error': 'No encontrado'}), 404
    return jsonify(blog)

@app.route('/api/blogs', methods=['POST'])
@require_admin
def create_blog():
    d = request.json
    query('''INSERT INTO blogs
        (titulo, categoria, autor, resumen, contenido, contenido2, contenido3,
         imagen_portada, imagen_medio, imagen_medio_caption, imagen_final, imagen_final_caption)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)''',
        (d.get('titulo'), d.get('categoria','Tributación'), d.get('autor'),
         d.get('resumen'), d.get('contenido'), d.get('contenido2'), d.get('contenido3'),
         d.get('imagen_portada'), d.get('imagen_medio'), d.get('imagen_medio_caption'),
         d.get('imagen_final'), d.get('imagen_final_caption')),
        commit=True)
    return jsonify({'ok': True})

@app.route('/api/blogs/<int:id>', methods=['PUT'])
@require_admin
def update_blog(id):
    d = request.json
    query('''UPDATE blogs SET
        titulo=%s, categoria=%s, autor=%s, resumen=%s, contenido=%s,
        contenido2=%s, contenido3=%s, imagen_portada=%s, imagen_medio=%s,
        imagen_medio_caption=%s, imagen_final=%s, imagen_final_caption=%s
        WHERE id=%s''',
        (d.get('titulo'), d.get('categoria'), d.get('autor'), d.get('resumen'),
         d.get('contenido'), d.get('contenido2'), d.get('contenido3'),
         d.get('imagen_portada'), d.get('imagen_medio'), d.get('imagen_medio_caption'),
         d.get('imagen_final'), d.get('imagen_final_caption'), id),
        commit=True)
    return jsonify({'ok': True})

@app.route('/api/blogs/<int:id>', methods=['DELETE'])
@require_admin
def delete_blog(id):
    query('DELETE FROM blogs WHERE id = %s', (id,), commit=True)
    return jsonify({'ok': True})

# ── CURSOS ──
@app.route('/api/cursos', methods=['GET'])
def get_cursos():
    cursos = query('SELECT * FROM cursos ORDER BY fecha DESC', fetchall=True)
    return jsonify(cursos or [])

@app.route('/api/cursos', methods=['POST'])
@require_admin
def create_curso():
    d = request.json
    query('''INSERT INTO cursos (titulo, resumen, descripcion, contenido, imagen, modalidad, precio, duracion, estado)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)''',
        (d.get('titulo'), d.get('resumen'), d.get('descripcion'), d.get('contenido'),
         d.get('imagen'), d.get('modalidad','Presencial'),
         d.get('precio'), d.get('duracion'), d.get('estado','activo')),
        commit=True)
    return jsonify({'ok': True})

@app.route('/api/cursos/<int:id>', methods=['PUT'])
@require_admin
def update_curso(id):
    d = request.json
    query('''UPDATE cursos SET titulo=%s, resumen=%s, descripcion=%s, contenido=%s,
        imagen=%s, modalidad=%s, precio=%s, duracion=%s, estado=%s WHERE id=%s''',
        (d.get('titulo'), d.get('resumen'), d.get('descripcion'), d.get('contenido'),
         d.get('imagen'), d.get('modalidad'),
         d.get('precio'), d.get('duracion'), d.get('estado'), id),
        commit=True)
    return jsonify({'ok': True})

@app.route('/api/cursos/<int:id>', methods=['DELETE'])
@require_admin
def delete_curso(id):
    query('DELETE FROM cursos WHERE id = %s', (id,), commit=True)
    return jsonify({'ok': True})

# ── MENSAJES ──
@app.route('/api/mensajes', methods=['GET'])
@require_admin
def get_mensajes():
    mensajes = query('SELECT * FROM mensajes ORDER BY fecha DESC', fetchall=True)
    return jsonify(mensajes or [])

@app.route('/api/mensajes', methods=['POST'])
def create_mensaje():
    d = request.json
    query('''INSERT INTO mensajes (nombre, email, telefono, servicio, mensaje)
        VALUES (%s,%s,%s,%s,%s)''',
        (d.get('nombre'), d.get('email'), d.get('telefono'),
         d.get('servicio'), d.get('mensaje')),
        commit=True)
    return jsonify({'ok': True})

@app.route('/api/mensajes/<int:id>', methods=['PUT'])
@require_admin
def update_mensaje(id):
    d = request.json
    query('UPDATE mensajes SET leido=%s WHERE id=%s', (d.get('leido'), id), commit=True)
    return jsonify({'ok': True})

@app.route('/api/mensajes/<int:id>', methods=['DELETE'])
@require_admin
def delete_mensaje(id):
    query('DELETE FROM mensajes WHERE id = %s', (id,), commit=True)
    return jsonify({'ok': True})

# ── REDES ──
@app.route('/api/redes', methods=['GET'])
def get_redes():
    rows = query('SELECT * FROM redes', fetchall=True)
    return jsonify(rows[0] if rows else {})

@app.route('/api/redes', methods=['POST'])
@require_admin
def save_redes():
    d = request.json
    rows = query('SELECT id FROM redes', fetchall=True)
    if not rows:
        query('INSERT INTO redes (whatsapp, facebook, instagram, tiktok) VALUES (%s,%s,%s,%s)',
            (d.get('whatsapp'), d.get('facebook'), d.get('instagram'), d.get('tiktok')),
            commit=True)
    else:
        query('UPDATE redes SET whatsapp=%s, facebook=%s, instagram=%s, tiktok=%s WHERE id=%s',
            (d.get('whatsapp'), d.get('facebook'), d.get('instagram'), d.get('tiktok'), rows[0]['id']),
            commit=True)
    return jsonify({'ok': True})

# ── CONFIG / PERFIL ──
@app.route('/api/perfil', methods=['GET'])
def get_perfil():
    row = query("SELECT * FROM config WHERE id = 'perfil'", fetchone=True)
    return jsonify(row or {})

@app.route('/api/perfil', methods=['POST'])
@require_admin
def save_perfil():
    d = request.json
    existing = query("SELECT id FROM config WHERE id = 'perfil'", fetchone=True)
    if existing:
        query("UPDATE config SET foto=%s WHERE id='perfil'", (d.get('foto'),), commit=True)
    else:
        query("INSERT INTO config (id, foto) VALUES ('perfil', %s)", (d.get('foto'),), commit=True)
    return jsonify({'ok': True})

# ── HEALTH ──
@app.route('/')
def index():
    return jsonify({'status': 'Ayllón Tributaria API OK'})

init_db()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)