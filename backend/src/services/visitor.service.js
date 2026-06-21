'use strict';

const ApiError = require('../utils/ApiError');
const repo = require('../repositories/visitor.repository');

const list = (search) => repo.findAll(search);

async function get(nik) {
  const row = await repo.findProfile(nik);
  if (!row) throw ApiError.notFound('Pengunjung tidak ditemukan');
  return row;
}

async function create(data) {
  const existing = await repo.findById(data.NIK_k);
  if (existing) throw ApiError.conflict('NIK pengunjung sudah terdaftar');
  return repo.create(data);
}

async function update(nik, data, role) {
  const existing = await repo.findById(nik);
  if (!existing) throw ApiError.notFound('Pengunjung tidak ditemukan');
  return repo.update(nik, data, role);
}

async function remove(nik) {
  const ok = await repo.remove(nik);
  if (!ok) throw ApiError.notFound('Pengunjung tidak ditemukan');
}

module.exports = { list, get, create, update, remove };
