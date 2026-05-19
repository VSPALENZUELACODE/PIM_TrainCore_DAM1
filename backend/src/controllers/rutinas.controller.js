// src/controllers/rutinas.controller.js
const db           = require('../config/db');
const { ok, fail } = require('../utils/response');

// ── Listar rutinas (sistema + propias) ────────────────────────────────────────
async function list(req, res) {
  const userId  = req.user.id;
  const { nivel, musculo } = req.query;

  try {
    let query = `
      SELECT r.*, GROUP_CONCAT(rm.musculo ORDER BY rm.musculo SEPARATOR ',') AS musculos
      FROM rutinas r
      LEFT JOIN rutina_musculos rm ON rm.rutina_id = r.id
      WHERE (r.user_id IS NULL OR r.user_id = ? OR r.es_publica = 1)
    `;
    const params = [userId];

    if (nivel) {
      query += ' AND r.nivel = ?';
      params.push(nivel);
    }

    query += ' GROUP BY r.id ORDER BY r.user_id IS NULL DESC, r.id ASC';

    const [rows] = await db.query(query, params);

    // Filtrar por músculo si se pide
    let result = rows.map(r => ({
      ...r,
      musculos: r.musculos ? r.musculos.split(',') : [],
    }));

    if (musculo) {
      result = result.filter(r => r.musculos.includes(musculo));
    }

    return ok(res, { rutinas: result });
  } catch (err) {
    console.error('list rutinas error:', err);
    return fail(res);
  }
}

// ── Obtener una rutina completa (con grupos y ejercicios) ─────────────────────
async function getOne(req, res) {
  const { id } = req.params;
  const userId  = req.user.id;

  try {
    const [rutinas] = await db.query(
      `SELECT r.*, GROUP_CONCAT(rm.musculo ORDER BY rm.musculo SEPARATOR ',') AS musculos
       FROM rutinas r
       LEFT JOIN rutina_musculos rm ON rm.rutina_id = r.id
       WHERE r.id = ? AND (r.user_id IS NULL OR r.user_id = ? OR r.es_publica = 1)
       GROUP BY r.id`,
      [id, userId]
    );

    if (rutinas.length === 0) return fail(res, 'Rutina no encontrada', 404);

    const rutina = { ...rutinas[0], musculos: rutinas[0].musculos ? rutinas[0].musculos.split(',') : [] };

    // Obtener grupos con sus ejercicios
    const [grupos] = await db.query(
      'SELECT * FROM grupos_ejercicios WHERE rutina_id = ? ORDER BY orden',
      [id]
    );

    for (const grupo of grupos) {
      const [ejercicios] = await db.query(
        'SELECT * FROM ejercicios WHERE grupo_id = ? ORDER BY orden',
        [grupo.id]
      );
      grupo.ejercicios = ejercicios;
    }

    rutina.grupos = grupos;

    return ok(res, { rutina });
  } catch (err) {
    console.error('getOne rutina error:', err);
    return fail(res);
  }
}

// ── Crear rutina ──────────────────────────────────────────────────────────────
async function create(req, res) {
  const { nombre, descripcion, icono, color, nivel, duracion_min, es_publica, musculos, grupos } = req.body;
  const userId = req.user.id;

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [r] = await conn.query(
      `INSERT INTO rutinas (user_id, nombre, descripcion, icono, color, nivel, duracion_min, es_publica)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, nombre, descripcion || null, icono || '💪', color || 'rgba(255,107,64,.15)',
       nivel || 'Todos', duracion_min || null, es_publica ? 1 : 0]
    );
    const rutinaId = r.insertId;

    // Músculos
    if (Array.isArray(musculos) && musculos.length > 0) {
      for (const m of musculos) {
        await conn.query('INSERT INTO rutina_musculos (rutina_id, musculo) VALUES (?, ?)', [rutinaId, m]);
      }
    }

    // Grupos y ejercicios
    if (Array.isArray(grupos)) {
      for (let gi = 0; gi < grupos.length; gi++) {
        const g = grupos[gi];
        const [gr] = await conn.query(
          'INSERT INTO grupos_ejercicios (rutina_id, nombre, orden) VALUES (?, ?, ?)',
          [rutinaId, g.nombre, gi]
        );
        const grupoId = gr.insertId;

        if (Array.isArray(g.ejercicios)) {
          for (let ei = 0; ei < g.ejercicios.length; ei++) {
            const e = g.ejercicios[ei];
            await conn.query(
              `INSERT INTO ejercicios (grupo_id, nombre, detalle, series, repeticiones, descanso_seg, orden)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [grupoId, e.nombre, e.detalle || null, e.series || null,
               e.repeticiones || null, e.descanso_seg || null, ei]
            );
          }
        }
      }
    }

    await conn.commit();

    // Logro: primera rutina propia
    await _checkLogro(userId, 'routine_creator');

    return ok(res, { id: rutinaId, message: 'Rutina creada correctamente' }, 201);
  } catch (err) {
    await conn.rollback();
    console.error('create rutina error:', err);
    return fail(res, 'Error al crear rutina');
  } finally {
    conn.release();
  }
}

// ── Actualizar rutina ─────────────────────────────────────────────────────────
async function update(req, res) {
  const { id } = req.params;
  const userId  = req.user.id;
  const { nombre, descripcion, icono, color, nivel, duracion_min, es_publica, musculos, grupos } = req.body;

  const conn = await db.getConnection();
  try {
    // Verificar que es del usuario
    const [check] = await conn.query('SELECT id FROM rutinas WHERE id = ? AND user_id = ?', [id, userId]);
    if (check.length === 0) return fail(res, 'Rutina no encontrada o sin permisos', 403);

    await conn.beginTransaction();

    await conn.query(
      `UPDATE rutinas SET
        nombre       = COALESCE(?, nombre),
        descripcion  = COALESCE(?, descripcion),
        icono        = COALESCE(?, icono),
        color        = COALESCE(?, color),
        nivel        = COALESCE(?, nivel),
        duracion_min = COALESCE(?, duracion_min),
        es_publica   = COALESCE(?, es_publica)
       WHERE id = ?`,
      [nombre, descripcion, icono, color, nivel, duracion_min, es_publica !== undefined ? (es_publica ? 1 : 0) : null, id]
    );

    // Reconstruir músculos si se envían
    if (Array.isArray(musculos)) {
      await conn.query('DELETE FROM rutina_musculos WHERE rutina_id = ?', [id]);
      for (const m of musculos) {
        await conn.query('INSERT INTO rutina_musculos (rutina_id, musculo) VALUES (?, ?)', [id, m]);
      }
    }

    // Reconstruir grupos/ejercicios si se envían
    if (Array.isArray(grupos)) {
      // Borrar grupos (en cascada borra ejercicios)
      await conn.query('DELETE FROM grupos_ejercicios WHERE rutina_id = ?', [id]);

      for (let gi = 0; gi < grupos.length; gi++) {
        const g = grupos[gi];
        const [gr] = await conn.query(
          'INSERT INTO grupos_ejercicios (rutina_id, nombre, orden) VALUES (?, ?, ?)',
          [id, g.nombre, gi]
        );
        const grupoId = gr.insertId;

        if (Array.isArray(g.ejercicios)) {
          for (let ei = 0; ei < g.ejercicios.length; ei++) {
            const e = g.ejercicios[ei];
            await conn.query(
              `INSERT INTO ejercicios (grupo_id, nombre, detalle, series, repeticiones, descanso_seg, orden)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [grupoId, e.nombre, e.detalle || null, e.series || null,
               e.repeticiones || null, e.descanso_seg || null, ei]
            );
          }
        }
      }
    }

    await conn.commit();
    return ok(res, { message: 'Rutina actualizada' });
  } catch (err) {
    await conn.rollback();
    console.error('update rutina error:', err);
    return fail(res, 'Error al actualizar rutina');
  } finally {
    conn.release();
  }
}

// ── Eliminar rutina ───────────────────────────────────────────────────────────
async function remove(req, res) {
  const { id } = req.params;
  const userId  = req.user.id;

  try {
    const [check] = await db.query('SELECT id FROM rutinas WHERE id = ? AND user_id = ?', [id, userId]);
    if (check.length === 0) return fail(res, 'Rutina no encontrada o sin permisos', 403);

    await db.query('DELETE FROM rutinas WHERE id = ?', [id]);
    return ok(res, { message: 'Rutina eliminada' });
  } catch (err) {
    console.error('remove rutina error:', err);
    return fail(res);
  }
}

// ── Helper interno: desbloquear logro si no lo tiene ─────────────────────────
async function _checkLogro(userId, clave) {
  try {
    const [logros] = await db.query('SELECT id FROM logros WHERE clave = ?', [clave]);
    if (logros.length === 0) return;
    await db.query(
      'INSERT IGNORE INTO user_logros (user_id, logro_id) VALUES (?, ?)',
      [userId, logros[0].id]
    );
  } catch (_) { /* no bloquear el flujo principal */ }
}

module.exports = { list, getOne, create, update, remove };
