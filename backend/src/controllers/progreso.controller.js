// src/controllers/progreso.controller.js
const db           = require('../config/db');
const { ok, fail } = require('../utils/response');

// ══════════════════════════════════════════════════════════════════════════════
// SESIONES
// ══════════════════════════════════════════════════════════════════════════════

// ── Crear sesión (registrar entrenamiento) ────────────────────────────────────
async function createSesion(req, res) {
  const { rutina_id, fecha, duracion_min, calorias_kcal, notas, completada, series } = req.body;
  const userId = req.user.id;

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [r] = await conn.query(
      `INSERT INTO sesiones (user_id, rutina_id, fecha, duracion_min, calorias_kcal, notas, completada)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, rutina_id || null, fecha, duracion_min || null,
       calorias_kcal || null, notas || null, completada ? 1 : 0]
    );
    const sesionId = r.insertId;

    // Registrar series individuales si se envían
    if (Array.isArray(series)) {
      for (const s of series) {
        await conn.query(
          `INSERT INTO sesion_series (sesion_id, ejercicio_id, serie_num, repeticiones, peso_kg, completada)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [sesionId, s.ejercicio_id, s.serie_num, s.repeticiones || null,
           s.peso_kg || null, s.completada !== false ? 1 : 0]
        );
      }

      // Actualizar récords personales automáticamente
      await _actualizarRecords(conn, userId, series, fecha);
    }

    await conn.commit();

    // Comprobar logros asíncronamente (no bloquear)
    _checkLogrosProgreso(userId).catch(() => {});

    return ok(res, { id: sesionId, message: 'Sesión registrada' }, 201);
  } catch (err) {
    await conn.rollback();
    console.error('createSesion error:', err);
    return fail(res, 'Error al registrar sesión');
  } finally {
    conn.release();
  }
}

// ── Listar sesiones del usuario ───────────────────────────────────────────────
async function listSesiones(req, res) {
  const userId = req.user.id;
  const { desde, hasta, limit = 20, offset = 0 } = req.query;

  try {
    let query = `
      SELECT s.*, r.nombre AS rutina_nombre, r.icono AS rutina_icono
      FROM sesiones s
      LEFT JOIN rutinas r ON r.id = s.rutina_id
      WHERE s.user_id = ?
    `;
    const params = [userId];

    if (desde) { query += ' AND s.fecha >= ?'; params.push(desde); }
    if (hasta) { query += ' AND s.fecha <= ?'; params.push(hasta); }

    query += ' ORDER BY s.fecha DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [rows] = await db.query(query, params);
    return ok(res, { sesiones: rows });
  } catch (err) {
    console.error('listSesiones error:', err);
    return fail(res);
  }
}

// ── Obtener sesión con sus series ──────────────────────────────────────────────
async function getSesion(req, res) {
  const { id } = req.params;
  const userId  = req.user.id;

  try {
    const [sesiones] = await db.query(
      `SELECT s.*, r.nombre AS rutina_nombre
       FROM sesiones s
       LEFT JOIN rutinas r ON r.id = s.rutina_id
       WHERE s.id = ? AND s.user_id = ?`,
      [id, userId]
    );
    if (sesiones.length === 0) return fail(res, 'Sesión no encontrada', 404);

    const [series] = await db.query(
      `SELECT ss.*, e.nombre AS ejercicio_nombre
       FROM sesion_series ss
       JOIN ejercicios e ON e.id = ss.ejercicio_id
       WHERE ss.sesion_id = ?
       ORDER BY ss.serie_num`,
      [id]
    );

    return ok(res, { sesion: { ...sesiones[0], series } });
  } catch (err) {
    console.error('getSesion error:', err);
    return fail(res);
  }
}

// ── Eliminar sesión ───────────────────────────────────────────────────────────
async function deleteSesion(req, res) {
  const { id } = req.params;
  const userId  = req.user.id;

  try {
    const [check] = await db.query('SELECT id FROM sesiones WHERE id = ? AND user_id = ?', [id, userId]);
    if (check.length === 0) return fail(res, 'Sesión no encontrada', 404);

    await db.query('DELETE FROM sesiones WHERE id = ?', [id]);
    return ok(res, { message: 'Sesión eliminada' });
  } catch (err) {
    console.error('deleteSesion error:', err);
    return fail(res);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// ESTADÍSTICAS
// ══════════════════════════════════════════════════════════════════════════════

async function getStats(req, res) {
  const userId = req.user.id;
  const { periodo = '30d' } = req.query; // '7d' | '30d' | '90d' | 'all'

  try {
    const desde = _desdeByPeriodo(periodo);
    const params = desde ? [userId, desde] : [userId];
    const filtroFecha = desde ? 'AND fecha >= ?' : '';

    // Total sesiones
    const [[{ total_sesiones }]] = await db.query(
      `SELECT COUNT(*) AS total_sesiones FROM sesiones WHERE user_id = ? AND completada = 1 ${filtroFecha}`,
      params
    );

    // Minutos totales
    const [[{ minutos_total }]] = await db.query(
      `SELECT COALESCE(SUM(duracion_min), 0) AS minutos_total FROM sesiones WHERE user_id = ? ${filtroFecha}`,
      params
    );

    // Calorías totales
    const [[{ calorias_total }]] = await db.query(
      `SELECT COALESCE(SUM(calorias_kcal), 0) AS calorias_total FROM sesiones WHERE user_id = ? ${filtroFecha}`,
      params
    );

    // Sesiones por día de semana (para el gráfico de barras)
    const [porDia] = await db.query(
      `SELECT DAYOFWEEK(fecha) AS dia, COUNT(*) AS sesiones
       FROM sesiones WHERE user_id = ? AND completada = 1 ${filtroFecha}
       GROUP BY dia ORDER BY dia`,
      params
    );

    // Volumen total (series × reps × peso) — métrica de fuerza
    const [[{ volumen_total }]] = await db.query(
      `SELECT COALESCE(SUM(ss.repeticiones * ss.peso_kg), 0) AS volumen_total
       FROM sesion_series ss
       JOIN sesiones s ON s.id = ss.sesion_id
       WHERE s.user_id = ? ${filtroFecha ? 'AND s.fecha >= ?' : ''}`,
      params
    );

    // Racha actual (días consecutivos)
    const racha = await _calcularRacha(userId);

    // Rutina más usada
    const [[rutinaMasUsada]] = await db.query(
      `SELECT r.nombre, COUNT(*) AS veces
       FROM sesiones s
       JOIN rutinas r ON r.id = s.rutina_id
       WHERE s.user_id = ? AND s.rutina_id IS NOT NULL ${filtroFecha}
       GROUP BY s.rutina_id ORDER BY veces DESC LIMIT 1`,
      params
    );

    return ok(res, {
      stats: {
        total_sesiones,
        minutos_total,
        calorias_total,
        volumen_total: Math.round(volumen_total),
        racha_actual: racha,
        sesiones_por_dia: porDia,
        rutina_favorita: rutinaMasUsada || null,
      }
    });
  } catch (err) {
    console.error('getStats error:', err);
    return fail(res);
  }
}

// ── Heatmap de actividad (26 semanas) ─────────────────────────────────────────
async function getHeatmap(req, res) {
  const userId = req.user.id;

  try {
    const desde = new Date();
    desde.setDate(desde.getDate() - 182); // 26 semanas

    const [rows] = await db.query(
      `SELECT fecha, COUNT(*) AS sesiones
       FROM sesiones
       WHERE user_id = ? AND fecha >= ? AND completada = 1
       GROUP BY fecha ORDER BY fecha`,
      [userId, desde.toISOString().split('T')[0]]
    );

    // Convertir a mapa fecha → sesiones
    const mapa = {};
    rows.forEach(r => { mapa[r.fecha] = r.sesiones; });

    return ok(res, { heatmap: mapa });
  } catch (err) {
    console.error('getHeatmap error:', err);
    return fail(res);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// RÉCORDS PERSONALES
// ══════════════════════════════════════════════════════════════════════════════

async function getRecords(req, res) {
  const userId = req.user.id;

  try {
    const [rows] = await db.query(
      `SELECT rp.*, e.nombre AS ejercicio_nombre
       FROM records_personales rp
       JOIN ejercicios e ON e.id = rp.ejercicio_id
       WHERE rp.user_id = ?
       ORDER BY rp.fecha DESC`,
      [userId]
    );
    return ok(res, { records: rows });
  } catch (err) {
    console.error('getRecords error:', err);
    return fail(res);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// LOGROS
// ══════════════════════════════════════════════════════════════════════════════

async function getLogros(req, res) {
  const userId = req.user.id;

  try {
    const [rows] = await db.query(
      `SELECT l.*, ul.obtenido_en
       FROM logros l
       LEFT JOIN user_logros ul ON ul.logro_id = l.id AND ul.user_id = ?
       ORDER BY ul.obtenido_en DESC, l.id`,
      [userId]
    );

    return ok(res, {
      logros: rows.map(l => ({
        ...l,
        desbloqueado: !!l.obtenido_en,
      }))
    });
  } catch (err) {
    console.error('getLogros error:', err);
    return fail(res);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// HELPERS PRIVADOS
// ══════════════════════════════════════════════════════════════════════════════

function _desdeByPeriodo(periodo) {
  if (periodo === 'all') return null;
  const d = new Date();
  const days = { '7d': 7, '30d': 30, '90d': 90 }[periodo] || 30;
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

async function _calcularRacha(userId) {
  const [rows] = await db.query(
    `SELECT DISTINCT fecha FROM sesiones
     WHERE user_id = ? AND completada = 1
     ORDER BY fecha DESC LIMIT 365`,
    [userId]
  );

  if (rows.length === 0) return 0;

  let racha = 0;
  let expected = new Date();
  expected.setHours(0, 0, 0, 0);

  for (const row of rows) {
    const fecha = new Date(row.fecha);
    fecha.setHours(0, 0, 0, 0);
    const diff = Math.round((expected - fecha) / 86400000);

    if (diff <= 1) {
      racha++;
      expected = fecha;
    } else {
      break;
    }
  }

  return racha;
}

async function _actualizarRecords(conn, userId, series, fecha) {
  // Agrupar la serie más pesada por ejercicio en esta sesión
  const maxPorEjercicio = {};
  for (const s of series) {
    if (!s.ejercicio_id || !s.peso_kg) continue;
    const key = s.ejercicio_id;
    if (!maxPorEjercicio[key] || s.peso_kg > maxPorEjercicio[key].peso_kg) {
      maxPorEjercicio[key] = s;
    }
  }

  for (const [ejId, s] of Object.entries(maxPorEjercicio)) {
    const [existing] = await conn.query(
      'SELECT id, peso_kg FROM records_personales WHERE user_id = ? AND ejercicio_id = ?',
      [userId, ejId]
    );

    if (existing.length === 0) {
      await conn.query(
        'INSERT INTO records_personales (user_id, ejercicio_id, peso_kg, repeticiones, fecha) VALUES (?,?,?,?,?)',
        [userId, ejId, s.peso_kg, s.repeticiones || 1, fecha]
      );
    } else if (s.peso_kg > existing[0].peso_kg) {
      await conn.query(
        'UPDATE records_personales SET peso_kg = ?, repeticiones = ?, fecha = ? WHERE id = ?',
        [s.peso_kg, s.repeticiones || 1, fecha, existing[0].id]
      );
    }
  }
}

async function _checkLogrosProgreso(userId) {
  const [[{ total }]] = await db.query(
    'SELECT COUNT(*) AS total FROM sesiones WHERE user_id = ? AND completada = 1',
    [userId]
  );

  const hitos = [
    { min: 1,   clave: 'first_workout' },
    { min: 10,  clave: 'sessions_10' },
    { min: 50,  clave: 'sessions_50' },
    { min: 100, clave: 'sessions_100' },
  ];

  for (const h of hitos) {
    if (total >= h.min) await _grantLogro(userId, h.clave);
  }

  // Racha
  const racha = await _calcularRacha(userId);
  if (racha >= 7)  await _grantLogro(userId, 'streak_7');
  if (racha >= 30) await _grantLogro(userId, 'streak_30');

  // PR
  const [[{ prs }]] = await db.query(
    'SELECT COUNT(*) AS prs FROM records_personales WHERE user_id = ?',
    [userId]
  );
  if (prs >= 1) await _grantLogro(userId, 'pr_first');
}

async function _grantLogro(userId, clave) {
  const [logros] = await db.query('SELECT id FROM logros WHERE clave = ?', [clave]);
  if (logros.length === 0) return;
  await db.query(
    'INSERT IGNORE INTO user_logros (user_id, logro_id) VALUES (?, ?)',
    [userId, logros[0].id]
  );
}

module.exports = {
  createSesion, listSesiones, getSesion, deleteSesion,
  getStats, getHeatmap,
  getRecords,
  getLogros,
};
