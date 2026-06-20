'use strict';

const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

/**
 * Runs after a chain of express-validator rules. Collects any errors and
 * throws a 400 with a field-keyed details object.
 */
module.exports = function validate(req, _res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const details = {};
  for (const err of result.array()) {
    details[err.path || err.param] = err.msg;
  }
  return next(ApiError.badRequest('Validasi gagal', details));
};
