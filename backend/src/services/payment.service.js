'use strict';

const ApiError = require('../utils/ApiError');
const repo = require('../repositories/payment.repository');

const list = () => repo.findAll();

async function get(id) {
  const row = await repo.findById(id);
  if (!row) throw ApiError.notFound('Metode pembayaran tidak ditemukan');
  return row;
}

const create = (data) => repo.create(data);

async function update(id, data) {
  const existing = await repo.findById(id);
  if (!existing) throw ApiError.notFound('Metode pembayaran tidak ditemukan');
  return repo.update(id, data);
}

async function remove(id) {
  const ok = await repo.remove(id);
  if (!ok) throw ApiError.notFound('Metode pembayaran tidak ditemukan');
}

const salesByMethod = () => repo.salesByMethod();

module.exports = { list, get, create, update, remove, salesByMethod };
