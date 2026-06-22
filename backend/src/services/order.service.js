'use strict';

const ApiError = require('../utils/ApiError');
const repo = require('../repositories/order.repository');
const visitorRepo = require('../repositories/visitor.repository');
const sellerRepo = require('../repositories/seller.repository');
const paymentRepo = require('../repositories/payment.repository');
const foodRepo = require('../repositories/food.repository');

const list = (search) => repo.findAll(search);

async function get(id) {
  const row = await repo.findById(id);
  if (!row) throw ApiError.notFound('Pemesanan tidak ditemukan');
  return row;
}

/** Validates refs, snapshots each item's current price server-side, then delegates to repo.checkout. */
async function checkout(payload) {
  const [visitor, seller, method] = await Promise.all([
    visitorRepo.findById(payload.nik),
    sellerRepo.findById(payload.nikPj),
    paymentRepo.findById(payload.idMp),
  ]);
  if (!visitor) throw ApiError.badRequest('NIK pengunjung tidak terdaftar');
  if (!seller) throw ApiError.badRequest('NIK penjual tidak terdaftar');
  if (!method) throw ApiError.badRequest('Metode pembayaran tidak valid');
  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    throw ApiError.badRequest('Keranjang pesanan kosong');
  }

  const items = [];
  for (const it of payload.items) {
    const food = await foodRepo.findById(it.id_mk);
    if (!food) throw ApiError.badRequest(`Makanan ${it.id_mk} tidak ditemukan`);
    items.push({ id_mk: it.id_mk, qty: it.qty, harga: food.Harga_mk });
  }

  const result = await repo.checkout({ nik: payload.nik, nikPj: payload.nikPj, idMp: payload.idMp, items });
  return get(result.id_ps);
}

const daily = () => repo.daily();
const byType = () => repo.byType();

module.exports = { list, get, checkout, daily, byType };
