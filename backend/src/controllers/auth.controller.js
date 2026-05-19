// src/controllers/auth.controller.js
const bcrypt     = require('bcryptjs');
const db         = require('../config/db');
const { signToken } = require('../utils/jwt');
const { ok, fail }  = require('../utils/response');

// ── Registro ─────────────────────────────────────────────────────────────────
async function register(req, res) {
  const { name, email, password, nivel, peso_kg, altura_cm, objetivo } = req.body;

  try {
    // Comprobar si el email ya existe
    const [rows] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (rows.length > 0) {
      return fail(res, 'El email ya está registrado', 409);
    }

    const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
    const password_hash = await bcrypt.hash(password, rounds);

    const [result] = await db.query(
      `INSERT INTO users (name, email, password_hash, nivel, peso_kg, altura_cm, objetivo)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, email, password_hash, nivel || 'Principiante', peso_kg || null, altura_cm || null, objetivo || null]
    );

    const userId = result.insertId;
    const token  = signToken({ id: userId, email, name });

    return ok(res, { token, user: { id: userId, name, email, nivel: nivel || 'Principiante' } }, 201);
  } catch (err) {
    console.error('register error:', err);
    return fail(res, 'Error al registrar usuario');
  }
}

// ── Login ─────────────────────────────────────────────────────────────────────
async function login(req, res) {
  const { email, password } = req.body;

  try {
    const [rows] = await db.query(
      'SELECT id, name, email, password_hash, nivel, avatar_url FROM users WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      return fail(res, 'Credenciales incorrectas', 401);
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return fail(res, 'Credenciales incorrectas', 401);
    }

    const token = signToken({ id: user.id, email: user.email, name: user.name });

    return ok(res, {
      token,
      user: {
        id:         user.id,
        name:       user.name,
        email:      user.email,
        nivel:      user.nivel,
        avatar_url: user.avatar_url,
      },
    });
  } catch (err) {
    console.error('login error:', err);
    return fail(res, 'Error al iniciar sesión');
  }
}

// ── Obtener perfil propio ──────────────────────────────────────────────────────
async function getMe(req, res) {
  try {
    const [rows] = await db.query(
      'SELECT id, name, email, nivel, avatar_url, peso_kg, altura_cm, objetivo, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (rows.length === 0) return fail(res, 'Usuario no encontrado', 404);

    return ok(res, { user: rows[0] });
  } catch (err) {
    console.error('getMe error:', err);
    return fail(res, 'Error al obtener perfil');
  }
}

// ── Actualizar perfil ──────────────────────────────────────────────────────────
async function updateMe(req, res) {
  const { name, nivel, peso_kg, altura_cm, objetivo, avatar_url } = req.body;

  try {
    await db.query(
      `UPDATE users SET
        name       = COALESCE(?, name),
        nivel      = COALESCE(?, nivel),
        peso_kg    = COALESCE(?, peso_kg),
        altura_cm  = COALESCE(?, altura_cm),
        objetivo   = COALESCE(?, objetivo),
        avatar_url = COALESCE(?, avatar_url)
       WHERE id = ?`,
      [name, nivel, peso_kg, altura_cm, objetivo, avatar_url, req.user.id]
    );

    return ok(res, { message: 'Perfil actualizado correctamente' });
  } catch (err) {
    console.error('updateMe error:', err);
    return fail(res, 'Error al actualizar perfil');
  }
}

// ── Cambiar contraseña ────────────────────────────────────────────────────────
async function changePassword(req, res) {
  const { current_password, new_password } = req.body;

  try {
    const [rows] = await db.query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
    if (rows.length === 0) return fail(res, 'Usuario no encontrado', 404);

    const valid = await bcrypt.compare(current_password, rows[0].password_hash);
    if (!valid) return fail(res, 'Contraseña actual incorrecta', 401);

    const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
    const password_hash = await bcrypt.hash(new_password, rounds);

    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash, req.user.id]);

    return ok(res, { message: 'Contraseña actualizada' });
  } catch (err) {
    console.error('changePassword error:', err);
    return fail(res, 'Error al cambiar contraseña');
  }
}

module.exports = { register, login, getMe, updateMe, changePassword };
