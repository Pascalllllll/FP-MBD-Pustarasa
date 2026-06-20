'use strict';

const ApiError = require('../utils/ApiError');
const repo = require('../repositories/visit.repository');
const visitorRepo = require('../repositories/visitor.repository');

const list = (activeOnly) => repo.findAll(activeOnly);

async function checkIn(nik, waktuMasuk) {
  const visitor = await visitorRepo.findById(nik);
  if (!visitor) throw ApiError.badRequest('NIK pengunjung tidak terdaftar');
  const id = await repo.checkIn(nik, waktuMasuk);
  return repo.findById(id);
}

async function checkOut(id, waktuKeluar) {
  const existing = await repo.findById(id);
  if (!existing) throw ApiError.notFound('Data kunjungan tidak ditemukan');
  if (existing.Waktu_Keluar_wk) throw ApiError.conflict('Kunjungan ini sudah selesai');
  const ok = await repo.checkOut(id, waktuKeluar);
  if (!ok) throw ApiError.conflict('Gagal menyelesaikan kunjungan');
  return repo.findById(id);
}

async function remove(id) {
  const ok = await repo.remove(id);
  if (!ok) throw ApiError.notFound('Data kunjungan tidak ditemukan');
}

const daily = () => repo.daily();
const peakHours = () => repo.peakHours();

module.exports = { list, checkIn, checkOut, remove, daily, peakHours };
