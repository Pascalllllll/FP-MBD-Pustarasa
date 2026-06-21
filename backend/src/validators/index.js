'use strict';

const { body } = require('express-validator');

const nik = (field, label) =>
  body(field)
    .trim()
    .matches(/^[0-9]{16}$/)
    .withMessage(`${label} harus berupa 16 digit angka`);

const requiredStr = (field, label) =>
  body(field).trim().notEmpty().withMessage(`${label} wajib diisi`);

const optionalEmail = (field) =>
  body(field).optional({ nullable: true, checkFalsy: true })
    .isEmail().withMessage('Format email tidak valid');

const login = [
  requiredStr('username', 'Username'),
  requiredStr('password', 'Kata sandi'),
];

// Email_k is NOT NULL in the schema and trg_validasi_email_pengunjung is
// the one that actually judges its format (must contain '@' and '.') — we
// only check it's non-empty here, not that it's a well-formed email, so
// the trigger (not .isEmail()) is what rejects a malformed address.
const visitorCreate = [
  nik('NIK_k', 'NIK'),
  requiredStr('Nama_k', 'Nama'),
  body('No_Telp_k').optional({ nullable: true, checkFalsy: true })
    .matches(/^[0-9+\-\s]{6,14}$/).withMessage('No. telepon tidak valid'),
  requiredStr('Email_k', 'Email'),
];
const visitorUpdate = [
  nik('NIK_k', 'NIK'),
  requiredStr('Nama_k', 'Nama'),
  requiredStr('Email_k', 'Email'),
];

const bookCreate = [
  requiredStr('Judul_b', 'Judul'),
  requiredStr('Jenis_b', 'Jenis'),
  requiredStr('Penulis_b', 'Penulis'),
  body('Tahun_Terbit_b').isInt({ min: 0, max: 2100 }).withMessage('Tahun terbit tidak valid'),
  requiredStr('Kualitas_b', 'Kualitas'),
];

const foodCreate = [
  requiredStr('Nama_mk', 'Nama makanan'),
  requiredStr('Jenis_mk', 'Jenis'),
  body('Harga_mk').isFloat({ min: 0 }).withMessage('Harga harus angka >= 0'),
  body('Status_Ketersediaan_mk').optional()
    .isIn(['Ada', 'Habis']).withMessage("Status harus 'Ada' atau 'Habis'"),
];

const librarianCreate = [
  nik('NIK_pt', 'NIK'),
  requiredStr('Nama_pt', 'Nama'),
  requiredStr('Jadwal_Shift_pt', 'Jadwal shift'),
  body('Tanggal_Lahir_pt').isISO8601().withMessage('Tanggal lahir tidak valid'),
  optionalEmail('Email_pt'),
];

const sellerCreate = [
  nik('NIK_pj', 'NIK'),
  requiredStr('Nama_pj', 'Nama'),
  body('Tanggal_Lahir_pj').isISO8601().withMessage('Tanggal lahir tidak valid'),
  optionalEmail('Email_pj'),
];

const paymentCreate = [
  requiredStr('Instansi_mp', 'Instansi'),
  requiredStr('Jenis_mp', 'Jenis'),
];

// waktuMasuk/waktuKeluar are optional — when omitted the server uses "now".
// When given (e.g. backdating a forgotten check-out), only the shape is
// checked here; trg_validasi_waktu_kunjung is what rejects an exit time
// earlier than the entry time.
const checkIn = [
  nik('nik', 'NIK pengunjung'),
  body('waktuMasuk').optional({ nullable: true, checkFalsy: true })
    .isISO8601().withMessage('Waktu masuk tidak valid'),
];
const checkOut = [
  body('waktuKeluar').optional({ nullable: true, checkFalsy: true })
    .isISO8601().withMessage('Waktu keluar tidak valid'),
];

const borrowingCreate = [
  nik('nik', 'NIK pengunjung'),
  nik('nikPt', 'NIK pustakawan'),
  body('waktuPinjam').isISO8601().withMessage('Tanggal pinjam tidak valid'),
  body('batasKembali').isISO8601().withMessage('Batas kembali tidak valid'),
  body('items').isArray({ min: 1 }).withMessage('Minimal satu buku'),
  body('items.*.id_b').trim().notEmpty().withMessage('ID buku wajib'),
];

const orderCheckout = [
  nik('nik', 'NIK pengunjung'),
  nik('nikPj', 'NIK penjual'),
  requiredStr('idMp', 'Metode pembayaran'),
  body('items').isArray({ min: 1 }).withMessage('Keranjang tidak boleh kosong'),
  body('items.*.id_mk').trim().notEmpty().withMessage('ID makanan wajib'),
  // No min here on purpose: trg_validasi_kuantitas_pesanan is the one that
  // rejects qty <= 0, not the app. Only the basic shape (must be an integer)
  // is checked here.
  body('items.*.qty').isInt().withMessage('Kuantitas harus berupa angka bulat'),
];

module.exports = {
  login,
  visitorCreate, visitorUpdate,
  bookCreate,
  foodCreate,
  librarianCreate,
  sellerCreate,
  paymentCreate,
  checkIn,
  checkOut,
  borrowingCreate,
  orderCheckout,
};
