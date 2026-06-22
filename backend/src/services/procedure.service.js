'use strict';

const ApiError = require('../utils/ApiError');
const repo = require('../repositories/procedure.repository');

const list = () => repo.list();

async function call(name, values) {
  const result = await repo.call(name, values);
  if (result === undefined) throw ApiError.notFound('Procedure tidak ditemukan');
  return result;
}

module.exports = { list, call };
