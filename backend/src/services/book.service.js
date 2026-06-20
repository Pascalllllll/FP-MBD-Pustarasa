'use strict';

const ApiError = require('../utils/ApiError');
const repo = require('../repositories/book.repository');

const list = (search) => repo.findAll(search);

async function get(id) {
  const row = await repo.findById(id);
  if (!row) throw ApiError.notFound('Buku tidak ditemukan');
  // enrich with live availability + same-genre recommendations
  const [ketersediaan, rekomendasi] = await Promise.all([
    repo.checkAvailability(id),
    repo.recommendByGenre(row.Jenis_b),
  ]);
  return { ...row, ketersediaan, rekomendasi };
}

const create = (data) => repo.create(data);

async function update(id, data) {
  const existing = await repo.findById(id);
  if (!existing) throw ApiError.notFound('Buku tidak ditemukan');
  return repo.update(id, data);
}

async function remove(id) {
  const ok = await repo.remove(id);
  if (!ok) throw ApiError.notFound('Buku tidak ditemukan');
}

const genres = () => repo.genres();
const popular = () => repo.popular();
const newest = () => repo.newest();

module.exports = { list, get, create, update, remove, genres, popular, newest };
