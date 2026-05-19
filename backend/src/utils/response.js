// src/utils/response.js

/**
 * Respuesta de éxito estándar.
 */
function ok(res, data = {}, statusCode = 200) {
  return res.status(statusCode).json({ ok: true, ...data });
}

/**
 * Respuesta de error estándar.
 */
function fail(res, message = 'Error interno', statusCode = 500, errors = null) {
  const body = { ok: false, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
}

module.exports = { ok, fail };
