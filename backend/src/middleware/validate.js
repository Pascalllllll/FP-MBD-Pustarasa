'use strict';

const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

/** Collects express-validator errors and throws a 400 with field-keyed details. */
module.exports = function validate(req, _res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const details = {};
  for (const err of result.array()) {
    details[err.path || err.param] = err.msg;
  }
  return next(ApiError.badRequest('Validasi gagal', details));
};
