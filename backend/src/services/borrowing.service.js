'use strict';

const ApiError = require('../utils/ApiError');
const repo = require('../repositories/borrowing.repository');
const visitorRepo = require('../repositories/visitor.repository');
const librarianRepo = require('../repositories/librarian.repository');

const DEFAULT_DENDA_PER_HARI = 1000;

const list = (search) => repo.findAll(search);

async function get(id) {
  const row = await repo.findById(id);
  if (!row) throw ApiError.notFound('Peminjaman tidak ditemukan');
  return row;
}

/** Validates refs then creates the loan; trigger errors surface as-is. */
async function create(payload) {
  const [visitor, librarian] = await Promise.all([
    visitorRepo.findById(payload.nik),
    librarianRepo.findById(payload.nikPt),
  ]);
  if (!visitor) throw ApiError.badRequest('NIK pengunjung tidak terdaftar');
  if (!librarian) throw ApiError.badRequest('NIK pustakawan tidak terdaftar');
  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    throw ApiError.badRequest('Minimal satu buku harus dipilih');
  }

  const items = payload.items.map((it) => ({
    id_b: it.id_b,
    denda_per_hari: it.denda_per_hari != null ? it.denda_per_hari : DEFAULT_DENDA_PER_HARI,
  }));

  const id = await repo.create({
    nik: payload.nik,
    nikPt: payload.nikPt,
    waktuPinjam: payload.waktuPinjam,
    batasKembali: payload.batasKembali,
    items,
  });
  return repo.findById(id);
}

/** Return one book line via sp_pengembalian_buku; returns the fine. */
async function returnBook(idDpm, tanggal) {
  const denda = await repo.returnBook(idDpm, tanggal);
  return { id_dpm: idDpm, denda };
}

const outstanding = () => repo.outstanding();
const daily = () => repo.daily();
const perVisitor = () => repo.perVisitor();
const withoutVisit = () => repo.withoutVisit();
const returned = (search) => repo.returned(search);

module.exports = {
  list, get, create, returnBook, outstanding, daily, perVisitor, withoutVisit, returned,
};
