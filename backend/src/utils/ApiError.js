'use strict';

/**
 * Operational error with an attached HTTP status code. Thrown anywhere
 * in the stack and translated to a JSON response by errorHandler.
 */
class ApiError extends Error {
  constructor(statusCode, message, details = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(msg, details) { return new ApiError(400, msg, details); }
  static unauthorized(msg = 'Tidak terautentikasi') { return new ApiError(401, msg); }
  static forbidden(msg = 'Akses ditolak') { return new ApiError(403, msg); }
  static notFound(msg = 'Data tidak ditemukan') { return new ApiError(404, msg); }
  static conflict(msg) { return new ApiError(409, msg); }
}

module.exports = ApiError;
