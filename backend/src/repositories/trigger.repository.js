'use strict';

const { pool } = require('../config/db');

/** Each entry builds the real INSERT/UPDATE that fires it; call() always rolls back. */
const TRIGGER_REGISTRY = {
  trg_update_buku_dipinjam: {
    label: 'Update Buku Dipinjam (otomatis)',
    table: 'Detail_Peminjaman',
    operation: 'INSERT',
    params: [
      { name: 'idPm', label: 'ID Peminjaman (sudah ada)', placeholder: 'PM0001' },
      { name: 'idB', label: 'ID Buku', placeholder: 'B00001' },
      { name: 'dendaPerHari', label: 'Denda per Hari', placeholder: '2000' },
    ],
    buildSql: (v) => ({
      sql: `INSERT INTO Detail_Peminjaman (ID_dpm, Waktu_Kembali_dpm, Denda_Per_Hari_dpm, Peminjaman_ID_pm, Buku_ID_b)
            VALUES ('TRGTS1', NULL, ?, ?, ?)`,
      args: [v.dendaPerHari || 2000, v.idPm, v.idB],
    }),
  },
  trg_update_buku_dikembalikan: {
    label: 'Update Buku Dikembalikan (otomatis)',
    table: 'Detail_Peminjaman',
    operation: 'UPDATE',
    params: [{ name: 'idDpm', label: 'ID Detail Peminjaman (belum kembali)', placeholder: 'DP0001' }],
    buildSql: (v) => ({
      sql: `UPDATE Detail_Peminjaman SET Waktu_Kembali_dpm = CURDATE() WHERE ID_dpm = ?`,
      args: [v.idDpm],
    }),
  },
  trg_validasi_makanan_habis: {
    label: 'Validasi Makanan Habis',
    table: 'Detail_Pemesanan',
    operation: 'INSERT',
    params: [
      { name: 'idPs', label: 'ID Pemesanan (sudah ada)', placeholder: 'PS0001' },
      { name: 'idMk', label: 'ID Makanan', placeholder: 'MK0001' },
      { name: 'qty', label: 'Kuantitas', placeholder: '1' },
      { name: 'harga', label: 'Harga Satuan', placeholder: '25000' },
    ],
    buildSql: (v) => ({
      sql: `INSERT INTO Detail_Pemesanan (ID_dps, Kuantitas_dps, Harga_Satuan_dps, Pemesanan_ID_ps, Makanan_ID_mk)
            VALUES ('TRGTS2', ?, ?, ?, ?)`,
      args: [v.qty || 1, v.harga || 0, v.idPs, v.idMk],
    }),
  },
  trg_validasi_kuantitas_pesanan: {
    label: 'Validasi Kuantitas Pesanan',
    table: 'Detail_Pemesanan',
    operation: 'INSERT',
    params: [
      { name: 'idPs', label: 'ID Pemesanan (sudah ada)', placeholder: 'PS0001' },
      { name: 'idMk', label: 'ID Makanan', placeholder: 'MK0001' },
      { name: 'qty', label: 'Kuantitas (coba 0)', placeholder: '0' },
      { name: 'harga', label: 'Harga Satuan', placeholder: '25000' },
    ],
    buildSql: (v) => ({
      sql: `INSERT INTO Detail_Pemesanan (ID_dps, Kuantitas_dps, Harga_Satuan_dps, Pemesanan_ID_ps, Makanan_ID_mk)
            VALUES ('TRGTS3', ?, ?, ?, ?)`,
      args: [v.qty ?? 0, v.harga || 0, v.idPs, v.idMk],
    }),
  },
  trg_validasi_buku_sedang_dipinjam: {
    label: 'Validasi Buku Sedang Dipinjam',
    table: 'Detail_Peminjaman',
    operation: 'INSERT',
    params: [
      { name: 'idPm', label: 'ID Peminjaman (sudah ada)', placeholder: 'PM0001' },
      { name: 'idB', label: 'ID Buku (coba yang "Dipinjam")', placeholder: 'B00001' },
      { name: 'dendaPerHari', label: 'Denda per Hari', placeholder: '2000' },
    ],
    buildSql: (v) => ({
      sql: `INSERT INTO Detail_Peminjaman (ID_dpm, Waktu_Kembali_dpm, Denda_Per_Hari_dpm, Peminjaman_ID_pm, Buku_ID_b)
            VALUES ('TRGTS4', NULL, ?, ?, ?)`,
      args: [v.dendaPerHari || 2000, v.idPm, v.idB],
    }),
  },
  trg_validasi_batas_kembali: {
    label: 'Validasi Batas Kembali',
    table: 'Peminjaman',
    operation: 'INSERT',
    params: [
      { name: 'nik', label: 'NIK Pengunjung (sudah ada)', placeholder: '1234567890123456' },
      { name: 'nikPt', label: 'NIK Pustakawan (sudah ada)', placeholder: '5678901234567890' },
      { name: 'waktuPinjam', label: 'Waktu Pinjam', type: 'date', placeholder: '2026-06-22' },
      { name: 'batasKembali', label: 'Batas Kembali (coba <= Waktu Pinjam)', type: 'date', placeholder: '2026-06-20' },
    ],
    buildSql: (v) => ({
      sql: `INSERT INTO Peminjaman (ID_pm, Waktu_Pinjam_pm, Batas_Kembali_pm, Pengunjung_NIK_k, Pustakawan_NIK_pt)
            VALUES ('TRGTS5', ?, ?, ?, ?)`,
      args: [v.waktuPinjam, v.batasKembali, v.nik, v.nikPt],
    }),
  },
  trg_validasi_waktu_kunjung: {
    label: 'Validasi Waktu Kunjung (check-in)',
    table: 'Waktu_kunjung',
    operation: 'INSERT',
    params: [
      { name: 'nik', label: 'NIK Pengunjung (sudah ada)', placeholder: '1234567890123456' },
      { name: 'waktuMasuk', label: 'Waktu Masuk', type: 'datetime-local' },
      { name: 'waktuKeluar', label: 'Waktu Keluar (coba sebelum Waktu Masuk)', type: 'datetime-local' },
    ],
    buildSql: (v) => ({
      sql: `INSERT INTO Waktu_kunjung (ID_wk, Waktu_Masuk_wk, Waktu_Keluar_wk, Pengunjung_NIK_k)
            VALUES ('TRGTS6', ?, ?, ?)`,
      args: [v.waktuMasuk, v.waktuKeluar || null, v.nik],
    }),
  },
  trg_validasi_waktu_kunjung_update: {
    label: 'Validasi Waktu Kunjung (check-out)',
    table: 'Waktu_kunjung',
    operation: 'UPDATE',
    params: [
      { name: 'idWk', label: 'ID Waktu Kunjung (sudah ada)', placeholder: 'WK0001' },
      { name: 'waktuKeluar', label: 'Waktu Keluar baru', type: 'datetime-local' },
    ],
    buildSql: (v) => ({
      sql: `UPDATE Waktu_kunjung SET Waktu_Keluar_wk = ? WHERE ID_wk = ?`,
      args: [v.waktuKeluar, v.idWk],
    }),
  },
  trg_validasi_umur_pustakawan: {
    label: 'Validasi Umur Pustakawan (data baru)',
    table: 'Pustakawan',
    operation: 'INSERT',
    params: [
      { name: 'nikPt', label: 'NIK Pustakawan baru', placeholder: '9999999999999991' },
      { name: 'tanggalLahir', label: 'Tanggal Lahir (coba usia < 18 th)', type: 'date' },
    ],
    buildSql: (v) => ({
      sql: `INSERT INTO Pustakawan (NIK_pt, Nama_pt, Jadwal_Shift_pt, Tanggal_Lahir_pt, No_Telp_pt, Email_pt, Alamat_pt)
            VALUES (?, 'Test Trigger', 'Pagi', ?, '0000000000', 'test@trigger.local', 'Test')`,
      args: [v.nikPt, v.tanggalLahir],
    }),
  },
  trg_validasi_umur_pustakawan_update: {
    label: 'Validasi Umur Pustakawan (data lama)',
    table: 'Pustakawan',
    operation: 'UPDATE',
    params: [
      { name: 'nikPt', label: 'NIK Pustakawan (sudah ada)', placeholder: '5678901234567890' },
      { name: 'tanggalLahir', label: 'Tanggal Lahir baru (coba usia < 18 th)', type: 'date' },
    ],
    buildSql: (v) => ({
      sql: `UPDATE Pustakawan SET Tanggal_Lahir_pt = ? WHERE NIK_pt = ?`,
      args: [v.tanggalLahir, v.nikPt],
    }),
  },
  trg_validasi_email_pengunjung: {
    label: 'Validasi Email Pengunjung (data baru)',
    table: 'Pengunjung',
    operation: 'INSERT',
    params: [
      { name: 'nik', label: 'NIK Pengunjung baru', placeholder: '9999999999999992' },
      { name: 'email', label: 'Email (coba tanpa "@" / ".")', placeholder: 'emailsalah' },
    ],
    buildSql: (v) => ({
      sql: `INSERT INTO Pengunjung (NIK_k, Nama_k, No_Telp_k, Email_k, Alamat_k)
            VALUES (?, 'Test Trigger', '0000000000', ?, 'Test')`,
      args: [v.nik, v.email],
    }),
  },
  trg_validasi_email_pengunjung_update: {
    label: 'Validasi Email Pengunjung (data lama)',
    table: 'Pengunjung',
    operation: 'UPDATE',
    params: [
      { name: 'nik', label: 'NIK Pengunjung (sudah ada)', placeholder: '1234567890123456' },
      { name: 'email', label: 'Email baru (coba tanpa "@" / ".")', placeholder: 'emailsalah' },
    ],
    buildSql: (v) => ({
      sql: `UPDATE Pengunjung SET Email_k = ? WHERE NIK_k = ?`,
      args: [v.email, v.nik],
    }),
  },
  trg_validasi_update_nik: {
    label: 'Validasi Update NIK',
    table: 'Pengunjung',
    operation: 'UPDATE',
    needsAppRole: true,
    params: [
      { name: 'nikLama', label: 'NIK Pengunjung lama (sudah ada)', placeholder: '1234567890123456' },
      { name: 'nikBaru', label: 'NIK baru', placeholder: '0000000000000000' },
      {
        name: 'peran',
        label: 'Simulasikan peran pemanggil',
        type: 'select',
        options: [
          { value: 'pustakawan', label: 'pustakawan (harus ditolak)' },
          { value: 'penjual', label: 'penjual (harus ditolak)' },
          { value: 'admin', label: 'admin (harus berhasil)' },
        ],
      },
    ],
    buildSql: (v) => ({
      sql: `UPDATE Pengunjung SET NIK_k = ? WHERE NIK_k = ?`,
      args: [v.nikBaru, v.nikLama],
    }),
  },
};

function list() {
  return Object.entries(TRIGGER_REGISTRY).map(([name, meta]) => ({
    name,
    label: meta.label,
    table: meta.table,
    operation: meta.operation,
    params: meta.params,
  }));
}

async function call(name, values) {
  const meta = TRIGGER_REGISTRY[name];
  if (!meta) return undefined;
  const { sql, args } = meta.buildSql(values);

  const conn = await pool.getConnection();
  let result;
  try {
    await conn.beginTransaction();
    if (meta.needsAppRole) {
      await conn.query('SET @app_role = ?', [values.peran || '']);
    }
    await conn.query(sql, args);
    result = { accepted: true, message: 'Operasi diterima — tidak ditolak oleh trigger.' };
  } catch (err) {
    result = { accepted: false, message: err.sqlMessage || err.message };
  }
  try {
    await conn.rollback();
  } finally {
    conn.release();
  }
  return result;
}

module.exports = { TRIGGER_REGISTRY, list, call };
