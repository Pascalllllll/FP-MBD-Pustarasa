'use strict';

const ApiError = require('../utils/ApiError');
const repo = require('../repositories/seller.repository');

const list = (search) => repo.findAll(search);

async function get(nik) {
  const row = await repo.findById(nik);
  if (!row) throw ApiError.notFound('Penjual tidak ditemukan');
  return row;
}

async function create(data) {
  const existing = await repo.findById(data.NIK_pj);
  if (existing) throw ApiError.conflict('NIK penjual sudah terdaftar');
  return repo.create(data);
}

async function update(nik, data) {
  const existing = await repo.findById(nik);
  if (!existing) throw ApiError.notFound('Penjual tidak ditemukan');
  return repo.update(nik, data);
}

async function remove(nik) {
  const ok = await repo.remove(nik);
  if (!ok) throw ApiError.notFound('Penjual tidak ditemukan');
}

const sales = () => repo.sales();

module.exports = { list, get, create, update, remove, sales };
