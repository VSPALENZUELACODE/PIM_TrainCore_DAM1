// src/utils/jwt.js
const jwt = require('jsonwebtoken');

const SECRET  = process.env.JWT_SECRET  || 'dev_secret_change_me';
const EXPIRES = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Genera un token firmado con el payload dado.
 * @param {object} payload  — datos a incluir (id, email, name…)
 * @returns {string} token JWT
 */
function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES });
}

/**
 * Verifica y decodifica un token.
 * @param {string} token
 * @returns {object} payload decodificado
 */
function verifyToken(token) {
  return jwt.verify(token, SECRET);
}

module.exports = { signToken, verifyToken };
