'use strict';

const { query, pool } = require('../config/db');
const { generators } = require('../utils/idGenerator');

async function findAll(activeOnly) {
  const where = activeOnly ? `WHERE w.Waktu_Keluar_wk IS NULL` : ``;
  return query(
    `SELECT w.ID_wk, w.Waktu_Masuk_wk, w.Waktu_Keluar_wk,
            w.Pengunjung_NIK_k, p.Nama_k
       FROM Waktu_kunjung w
       JOIN Pengunjung p ON p.NIK_k = w.Pengunjung_NIK_k
       ${where}
      ORDER BY w.Waktu_Masuk_wk DESC`
  );
}

async function findById(id) {
  const rows = await query(
    `SELECT w.ID_wk, w.Waktu_Masuk_wk, w.Waktu_Keluar_wk,
            w.Pengunjung_NIK_k, p.Nama_k
       FROM Waktu_kunjung w
       JOIN Pengunjung p ON p.NIK_k = w.Pengunjung_NIK_k
      WHERE w.ID_wk = ?`,
    [id]
  );
  return rows[0] || null;
}

/** Check a visitor in: open visit with NULL exit time. */
async function checkIn(nik, waktuMasuk) {
  const conn = await pool.getConnection();
  try {
    const id = await generators.waktuKunjung(conn);
    await conn.execute(
      `INSERT INTO Waktu_kunjung (ID_wk, Waktu_Masuk_wk, Waktu_Keluar_wk, Pengunjung_NIK_k)
       VALUES (?, ?, NULL, ?)`,
      [id, waktuMasuk ? new Date(waktuMasuk) : new Date(), nik]
    );
    return id;
  } finally {
    conn.release();
  }
}

/** Stamps exit time (wrapped in new Date() for mysql2); trg_validasi_waktu_kunjung rejects exit < entry. */
async function checkOut(id, waktuKeluar) {
  const res = await query(
    `UPDATE Waktu_kunjung
        SET Waktu_Keluar_wk = ?
      WHERE ID_wk = ? AND Waktu_Keluar_wk IS NULL`,
    [waktuKeluar ? new Date(waktuKeluar) : new Date(), id]
  );
  return res.affectedRows > 0;
}

async function remove(id) {
  const res = await query(`DELETE FROM Waktu_kunjung WHERE ID_wk = ?`, [id]);
  return res.affectedRows > 0;
}

const daily = () => query(`SELECT * FROM vw_kunjungan_harian`);
const peakHours = () => query(`SELECT * FROM vw_jam_ramai`);

module.exports = { findAll, findById, checkIn, checkOut, remove, daily, peakHours };
