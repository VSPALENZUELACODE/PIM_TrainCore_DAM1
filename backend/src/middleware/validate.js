// src/middleware/validate.js
const { validationResult } = require('express-validator');
const { fail } = require('../utils/response');

/**
 * Middleware para recoger errores de express-validator.
 * Colocarlo DESPUÉS de los arrays de validación.
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return fail(res, 'Datos de entrada inválidos', 422, errors.array());
  }
  next();
}

module.exports = validate;
