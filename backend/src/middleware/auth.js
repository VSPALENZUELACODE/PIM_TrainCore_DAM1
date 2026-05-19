// src/middleware/auth.js
const { verifyToken } = require('../utils/jwt');
const { fail }        = require('../utils/response');

/**
 * Middleware que protege rutas privadas.
 * Espera cabecera: Authorization: Bearer <token>
 */
function authMiddleware(req, res, next) {
  const header = req.headers['authorization'];

  if (!header || !header.startsWith('Bearer ')) {
    return fail(res, 'Token no proporcionado', 401);
  }

  const token = header.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    req.user = decoded;   // { id, email, name, iat, exp }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return fail(res, 'Token expirado', 401);
    }
    return fail(res, 'Token inválido', 401);
  }
}

module.exports = authMiddleware;
