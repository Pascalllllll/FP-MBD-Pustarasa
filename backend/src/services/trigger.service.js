'use strict';

const ApiError = require('../utils/ApiError');
const repo = require('../repositories/trigger.repository');

const list = () => repo.list();

async function call(name, values) {
  const result = await repo.call(name, values);
  if (result === undefined) throw ApiError.notFound('Trigger tidak ditemukan');
  return result;
}

module.exports = { list, call };
