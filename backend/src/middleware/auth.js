'use strict';

const jwt = require('jsonwebtoken');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

/**
 * Verifies the Bearer token and attaches { id, username, role, staffNik }
 * to req.user. Rejects with 401 when missing/invalid.
 */
function authenticate(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) return next(ApiError.unauthorized('Token tidak ditemukan'));

  try {
    const payload = jwt.verify(token, env.jwt.secret);
    req.user = {
      id: payload.sub,
      username: payload.username,
      role: payload.role,
      staffNik: payload.staffNik || null,
    };
    return next();
  } catch (_err) {
    return next(ApiError.unauthorized('Token tidak valid atau kedaluwarsa'));
  }
}

/**
 * Restricts a route to one or more roles. Usage:
 *   router.post('/', requireRole('admin', 'pustakawan'), handler)
 */
function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('Peran Anda tidak memiliki akses ke fitur ini'));
    }
    return next();
  };
}

module.exports = { authenticate, requireRole };
