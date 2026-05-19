// src/controllers/ejercicios.controller.js
const db           = require('../config/db');
const { ok, fail } = require('../utils/response');

// ── Listar ejercicios de un grupo ─────────────────────────────────────────────
async function listByGrupo(req, res) {
  const { grupoId } = req.params;
  const userId = req.user.id;

  try {
    // Verificar que el grupo pertenece a una rutina accesible
    const [check] = await db.query(
      `SELECT ge.id FROM grupos_ejercicios ge
       JOIN rutinas r ON r.id = ge.rutina_id
       WHERE ge.id = ? AND (r.user_id IS NULL OR r.user_id = ? OR r.es_publica = 1)`,
      [grupoId, userId]
    );
    if (check.length === 0) return fail(res, 'Grupo no encontrado', 404);

    const [rows] = await db.query(
      'SELECT * FROM ejercicios WHERE grupo_id = ? ORDER BY orden',
      [grupoId]
    );
    return ok(res, { ejercicios: rows });
  } catch (err) {
    console.error('listByGrupo error:', err);
    return fail(res);
  }
}

// ── Crear ejercicio en un grupo ───────────────────────────────────────────────
async function create(req, res) {
  const { grupoId } = req.params;
  const { nombre, detalle, series, repeticiones, descanso_seg } = req.body;
  const userId = req.user.id;

  try {
    // El grupo debe pertenecer a una rutina del usuario
    const [check] = await db.query(
      `SELECT ge.id FROM grupos_ejercicios ge
       JOIN rutinas r ON r.id = ge.rutina_id
       WHERE ge.id = ? AND r.user_id = ?`,
      [grupoId, userId]
    );
    if (check.length === 0) return fail(res, 'Grupo no encontrado o sin permisos', 403);

    // Calcular nuevo orden
    const [[{ maxOrden }]] = await db.query(
      'SELECT COALESCE(MAX(orden), -1) AS maxOrden FROM ejercicios WHERE grupo_id = ?',
      [grupoId]
    );

    const [r] = await db.query(
      `INSERT INTO ejercicios (grupo_id, nombre, detalle, series, repeticiones, descanso_seg, orden)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [grupoId, nombre, detalle || null, series || null, repeticiones || null, descanso_seg || null, maxOrden + 1]
    );

    return ok(res, { id: r.insertId, message: 'Ejercicio creado' }, 201);
  } catch (err) {
    console.error('create ejercicio error:', err);
    return fail(res);
  }
}

// ── Actualizar ejercicio ──────────────────────────────────────────────────────
async function update(req, res) {
  const { id } = req.params;
  const { nombre, detalle, series, repeticiones, descanso_seg, orden } = req.body;
  const userId = req.user.id;

  try {
    // Verificar propiedad
    const [check] = await db.query(
      `SELECT e.id FROM ejercicios e
       JOIN grupos_ejercicios ge ON ge.id = e.grupo_id
       JOIN rutinas r ON r.id = ge.rutina_id
       WHERE e.id = ? AND r.user_id = ?`,
      [id, userId]
    );
    if (check.length === 0) return fail(res, 'Ejercicio no encontrado o sin permisos', 403);

    await db.query(
      `UPDATE ejercicios SET
        nombre       = COALESCE(?, nombre),
        detalle      = COALESCE(?, detalle),
        series       = COALESCE(?, series),
        repeticiones = COALESCE(?, repeticiones),
        descanso_seg = COALESCE(?, descanso_seg),
        orden        = COALESCE(?, orden)
       WHERE id = ?`,
      [nombre, detalle, series, repeticiones, descanso_seg, orden, id]
    );

    return ok(res, { message: 'Ejercicio actualizado' });
  } catch (err) {
    console.error('update ejercicio error:', err);
    return fail(res);
  }
}

// ── Eliminar ejercicio ────────────────────────────────────────────────────────
async function remove(req, res) {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const [check] = await db.query(
      `SELECT e.id FROM ejercicios e
       JOIN grupos_ejercicios ge ON ge.id = e.grupo_id
       JOIN rutinas r ON r.id = ge.rutina_id
       WHERE e.id = ? AND r.user_id = ?`,
      [id, userId]
    );
    if (check.length === 0) return fail(res, 'Ejercicio no encontrado o sin permisos', 403);

    await db.query('DELETE FROM ejercicios WHERE id = ?', [id]);
    return ok(res, { message: 'Ejercicio eliminado' });
  } catch (err) {
    console.error('remove ejercicio error:', err);
    return fail(res);
  }
}

module.exports = { listByGrupo, create, update, remove };
