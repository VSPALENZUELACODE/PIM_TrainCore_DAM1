/**
 * TrainCore — Servidor local con SQLite
 * BD guardada en: traincore.db (mismo directorio)
 *
 * Instalar dependencias: npm install
 * Arrancar:             node server.js
 * Puerto:               http://localhost:3001
 */

const http   = require('http');
const crypto = require('crypto');
const path   = require('path');
const fs     = require('fs');

// ── Inicializar SQLite (sql.js, puro JavaScript, sin compilar) ────
const initSqlJs = require('sql.js');
const DB_FILE   = path.join(__dirname, 'traincore.db');

let db; // instancia global de la BD

async function initDB() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_FILE)) {
    const fileBuffer = fs.readFileSync(DB_FILE);
    db = new SQL.Database(fileBuffer);
    console.log('  BD cargada desde traincore.db');
  } else {
    db = new SQL.Database();
    console.log('  BD nueva creada (traincore.db)');
  }

  // Crear tablas si no existen
  db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id         TEXT PRIMARY KEY,
      nombre     TEXT NOT NULL,
      email      TEXT UNIQUE NOT NULL,
      pass_hash  TEXT NOT NULL,
      creado_en  TEXT NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS logins (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id TEXT NOT NULL,
      email      TEXT NOT NULL,
      nombre     TEXT NOT NULL,
      fecha      TEXT NOT NULL,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS rutinas (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id  TEXT NOT NULL,
      nombre      TEXT NOT NULL,
      nivel       TEXT,
      duracion    TEXT,
      icono       TEXT,
      musculos    TEXT,
      grupos      TEXT,
      creado_en   TEXT NOT NULL,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    );
  `);

  // Índices para optimizar consultas frecuentes
  db.run(`CREATE INDEX IF NOT EXISTS idx_usuarios_email     ON usuarios(email);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_logins_usuario_id  ON logins(usuario_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_logins_fecha       ON logins(fecha);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_rutinas_usuario_id ON rutinas(usuario_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_rutinas_creado_en  ON rutinas(creado_en);`);

  saveDB();
}

// Guardar BD en disco después de cada escritura
function saveDB() {
  const data = db.export();
  fs.writeFileSync(DB_FILE, Buffer.from(data));
}

function hashPassword(pass) {
  return crypto.createHash('sha256').update(pass).digest('hex');
}

// ── Servidor HTTP ─────────────────────────────────────────────────

function sendJSON(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try { resolve(JSON.parse(body || '{}')); }
      catch { reject(new Error('JSON inválido')); }
    });
  });
}

const server = http.createServer(async (req, res) => {

  // Preflight CORS
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  // ── POST /register ──────────────────────────────────────────────
  if (req.method === 'POST' && req.url === '/register') {
    try {
      const { name, email, password } = await readBody(req);

      if (!name || !email || !password)
        return sendJSON(res, 400, { error: 'Faltan campos obligatorios.' });
      if (password.length < 8)
        return sendJSON(res, 400, { error: 'La contraseña debe tener mínimo 8 caracteres.' });

      // Comprobar si el email ya existe
      const existe = db.exec(`SELECT id FROM usuarios WHERE email = '${email.toLowerCase().replace(/'/g,"''")}' LIMIT 1`);
      if (existe.length > 0 && existe[0].values.length > 0)
        return sendJSON(res, 409, { error: 'Ya existe una cuenta con ese email.' });

      const id       = crypto.randomUUID();
      const passHash = hashPassword(password);
      const ahora    = new Date().toISOString();

      db.run(
        `INSERT INTO usuarios (id, nombre, email, pass_hash, creado_en) VALUES (?, ?, ?, ?, ?)`,
        [id, name.trim(), email.trim().toLowerCase(), passHash, ahora]
      );
      saveDB();

      console.log(`[REGISTRO] ${name} <${email}> — ${ahora}`);
      return sendJSON(res, 201, { user: { id, name: name.trim(), email: email.trim().toLowerCase() } });

    } catch (e) {
      console.error(e);
      return sendJSON(res, 500, { error: 'Error interno del servidor.' });
    }
  }

  // ── POST /login ─────────────────────────────────────────────────
  if (req.method === 'POST' && req.url === '/login') {
    try {
      const { email, password } = await readBody(req);

      if (!email || !password)
        return sendJSON(res, 400, { error: 'Faltan campos obligatorios.' });

      const emailClean = email.trim().toLowerCase().replace(/'/g, "''");
      const resultado  = db.exec(`SELECT id, nombre, email, pass_hash FROM usuarios WHERE email = '${emailClean}' LIMIT 1`);

      if (resultado.length === 0 || resultado[0].values.length === 0)
        return sendJSON(res, 401, { error: 'No existe ninguna cuenta con ese email.' });

      const [uid, nombre, emailDB, passHash] = resultado[0].values[0];

      if (passHash !== hashPassword(password))
        return sendJSON(res, 401, { error: 'Contraseña incorrecta.' });

      const ahora = new Date().toISOString();
      db.run(
        `INSERT INTO logins (usuario_id, email, nombre, fecha) VALUES (?, ?, ?, ?)`,
        [uid, emailDB, nombre, ahora]
      );
      saveDB();

      console.log(`[LOGIN] ${nombre} <${emailDB}> — ${ahora}`);
      return sendJSON(res, 200, { user: { id: uid, name: nombre, email: emailDB } });

    } catch (e) {
      console.error(e);
      return sendJSON(res, 500, { error: 'Error interno del servidor.' });
    }
  }

  // ── POST /rutinas — guardar rutina de un usuario ────────────────
  if (req.method === 'POST' && req.url === '/rutinas') {
    try {
      const { userId, nombre, nivel, duracion, icono, musculos, grupos } = await readBody(req);

      if (!userId || !nombre)
        return sendJSON(res, 400, { error: 'Faltan campos obligatorios.' });

      const ahora = new Date().toISOString();
      db.run(
        `INSERT INTO rutinas (usuario_id, nombre, nivel, duracion, icono, musculos, grupos, creado_en)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, nombre, nivel || '', duracion || '', icono || '', JSON.stringify(musculos || []), JSON.stringify(grupos || []), ahora]
      );
      saveDB();

      console.log(`[RUTINA GUARDADA] ${nombre} — usuario ${userId}`);
      return sendJSON(res, 201, { ok: true, mensaje: 'Rutina guardada.' });

    } catch (e) {
      console.error(e);
      return sendJSON(res, 500, { error: 'Error interno del servidor.' });
    }
  }

  // ── GET /rutinas?userId=xxx — obtener rutinas de un usuario ─────
  if (req.method === 'GET' && req.url.startsWith('/rutinas')) {
    try {
      const userId = new URL('http://x' + req.url).searchParams.get('userId');
      if (!userId) return sendJSON(res, 400, { error: 'Falta userId.' });

      const resultado = db.exec(
        `SELECT id, nombre, nivel, duracion, icono, musculos, grupos, creado_en
         FROM rutinas WHERE usuario_id = '${userId.replace(/'/g,"''")}' ORDER BY creado_en DESC`
      );

      const rutinas = resultado.length > 0
        ? resultado[0].values.map(([id, nombre, nivel, duracion, icono, musculos, grupos, creado_en]) => ({
            id, nombre, nivel, duracion, icono,
            musculos: JSON.parse(musculos || '[]'),
            grupos:   JSON.parse(grupos   || '[]'),
            creado_en
          }))
        : [];

      return sendJSON(res, 200, { rutinas });
    } catch (e) {
      console.error(e);
      return sendJSON(res, 500, { error: 'Error interno del servidor.' });
    }
  }

  // ── GET /bd — ver toda la BD (para desarrollo) ──────────────────
  if (req.method === 'GET' && req.url === '/bd') {
    const usuarios = db.exec(`SELECT id, nombre, email, creado_en FROM usuarios`);
    const logins   = db.exec(`SELECT nombre, email, fecha FROM logins ORDER BY fecha DESC LIMIT 50`);
    const rutinas  = db.exec(`SELECT nombre, nivel, duracion, creado_en FROM rutinas`);

    const toRows = (r) => r.length > 0
      ? r[0].values.map(row => Object.fromEntries(r[0].columns.map((c, i) => [c, row[i]])))
      : [];

    return sendJSON(res, 200, {
      usuarios:  toRows(usuarios),
      logins:    toRows(logins),
      rutinas:   toRows(rutinas)
    });
  }

  sendJSON(res, 404, { error: 'Ruta no encontrada.' });
});

// ── Arrancar ──────────────────────────────────────────────────────
initDB().then(() => {
  server.listen(3001, () => {
    console.log('');
    console.log('  ╔══════════════════════════════════════╗');
    console.log('  ║   TrainCore — Servidor local         ║');
    console.log('  ╠══════════════════════════════════════╣');
    console.log('  ║  http://localhost:3001               ║');
    console.log('  ║  BD: traincore.db                   ║');
    console.log('  ╠══════════════════════════════════════╣');
    console.log('  ║  POST /register   → Crear cuenta     ║');
    console.log('  ║  POST /login      → Iniciar sesión   ║');
    console.log('  ║  POST /rutinas    → Guardar rutina   ║');
    console.log('  ║  GET  /rutinas    → Obtener rutinas  ║');
    console.log('  ║  GET  /bd         → Ver toda la BD   ║');
    console.log('  ╚══════════════════════════════════════╝');
    console.log('');
    console.log('  Ctrl+C para parar');
    console.log('');
  });
});
