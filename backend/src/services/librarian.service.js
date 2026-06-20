'use strict';

const ApiError = require('../utils/ApiError');
const repo = require('../repositories/librarian.repository');

const list = (search) => repo.findAll(search);

async function get(nik) {
  const row = await repo.findById(nik);
  if (!row) throw ApiError.notFound('Pustakawan tidak ditemukan');
  return row;
}

async function create(data) {
  const existing = await repo.findById(data.NIK_pt);
  if (existing) throw ApiError.conflict('NIK pustakawan sudah terdaftar');
  return repo.create(data);
}

async function update(nik, data) {
  const existing = await repo.findById(nik);
  if (!existing) throw ApiError.notFound('Pustakawan tidak ditemukan');
  return repo.update(nik, data);
}

async function remove(nik) {
  const ok = await repo.remove(nik);
  if (!ok) throw ApiError.notFound('Pustakawan tidak ditemukan');
}

const performance = () => repo.performance();

module.exports = { list, get, create, update, remove, performance };
