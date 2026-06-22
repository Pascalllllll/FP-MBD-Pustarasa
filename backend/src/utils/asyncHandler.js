'use strict';

/** Forwards a rejected async-handler promise to Express's error middleware. */
module.exports = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
