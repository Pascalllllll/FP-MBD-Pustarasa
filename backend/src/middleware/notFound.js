'use strict';

const ApiError = require('../utils/ApiError');

/** Catch-all for unknown routes -> 404 JSON. */
module.exports = function notFound(req, _res, next) {
  next(ApiError.notFound(`Rute tidak ditemukan: ${req.method} ${req.originalUrl}`));
};
