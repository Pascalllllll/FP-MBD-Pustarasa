'use strict';

const env = require('../config/env');
const ApiError = require('../utils/ApiError');

/**
 * Final error middleware. Converts thrown errors — including MySQL errors
 * raised by triggers / SIGNAL inside stored procedures — into a uniform
 * JSON shape: { success:false, message, details? }.
 *
 * Triggers in this project SIGNAL SQLSTATE '45000' with a human-readable
 * Indonesian message (e.g. "Stok makanan habis"). We surface that text
 * directly so the UI can show the business-rule violation to staff.
 */
// eslint-disable-next-line no-unused-vars
module.exports = function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Terjadi kesalahan pada server';
  let details = err.details;
  let isTrigger = false;

  // MySQL user-raised errors (SIGNAL) and common constraint failures
  if (!err.isOperational && err.code) {
    switch (err.code) {
      case 'ER_SIGNAL_EXCEPTION':
        statusCode = 409;
        isTrigger = true;
        break;
      case 'ER_DUP_ENTRY':
        statusCode = 409;
        break;
      case 'ER_NO_REFERENCED_ROW_2':
      case 'ER_ROW_IS_REFERENCED_2':
        statusCode = 409;
        message = 'Operasi melanggar relasi data (foreign key).';
        break;
      case 'ER_CHECK_CONSTRAINT_VIOLATED':
        statusCode = 400;
        break;
      default:
        break;
    }
    // sqlMessage carries the trigger's MESSAGE_TEXT
    if (err.sqlMessage && statusCode !== 500) message = err.sqlMessage;
  }

  if (statusCode === 500) {
    // eslint-disable-next-line no-console
    console.error('[ERROR]', err);
  }

  const body = { success: false, message };
  if (isTrigger) body.trigger = true;
  if (details) body.details = details;
  if (env.nodeEnv !== 'production' && statusCode === 500) body.stack = err.stack;

  res.status(statusCode).json(body);
};
