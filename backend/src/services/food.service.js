'use strict';

const ApiError = require('../utils/ApiError');
const repo = require('../repositories/food.repository');

const list = (search) => repo.findAll(search);
const available = () => repo.findAvailable();

async function get(id) {
  const row = await repo.findById(id);
  if (!row) throw ApiError.notFound('Makanan tidak ditemukan');
  return row;
}

const create = (data) => repo.create(data);

async function update(id, data) {
  const existing = await repo.findById(id);
  if (!existing) throw ApiError.notFound('Makanan tidak ditemukan');
  return repo.update(id, data);
}

async function remove(id) {
  const ok = await repo.remove(id);
  if (!ok) throw ApiError.notFound('Makanan tidak ditemukan');
}

const favorites = () => repo.favorites();

module.exports = { list, available, get, create, update, remove, favorites };
