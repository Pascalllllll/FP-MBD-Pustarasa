'use strict';

const { query, pool } = require('../config/db');

const COLS = `NIK_k, Nama_k, No_Telp_k, Email_k, Alamat_k`;

async function findAll(search) {
  if (search) {
    const like = `%${search}%`;
    return query(
      `SELECT ${COLS} FROM Pengunjung
        WHERE NIK_k LIKE ? OR Nama_k LIKE ? OR Email_k LIKE ?
        ORDER BY Nama_k`,
      [like, like, like]
    );
  }
  return query(`SELECT ${COLS} FROM Pengunjung ORDER BY Nama_k`);
}

async function findById(nik) {
  const rows = await query(`SELECT ${COLS} FROM Pengunjung WHERE NIK_k = ?`, [nik]);
  return rows[0] || null;
}

/** Profile = base row + derived metrics from 4 stored functions (see SELECT below). */
async function findProfile(nik) {
  const rows = await query(
    `SELECT
        p.NIK_k, p.Nama_k, p.No_Telp_k, p.Email_k, p.Alamat_k,
        sf_cek_status_pengunjung(p.NIK_k)         AS status_pengunjung,
        sf_total_pengeluaran_pengunjung(p.NIK_k)  AS total_pengeluaran,
        sf_total_denda_pengunjung(p.NIK_k)        AS total_denda,
        sf_durasi_kunjungan_rata_rata(p.NIK_k)    AS durasi_kunjungan_rata2
       FROM Pengunjung p
      WHERE p.NIK_k = ?`,
    [nik]
  );
  return rows[0] || null;
}

async function create(data) {
  await query(
    `INSERT INTO Pengunjung (NIK_k, Nama_k, No_Telp_k, Email_k, Alamat_k)
     VALUES (?, ?, ?, ?, ?)`,
    [data.NIK_k, data.Nama_k, data.No_Telp_k, data.Email_k, data.Alamat_k]
  );
  return findById(data.NIK_k);
}

/**
 * NIK_k stays in the SET clause so trg_validasi_update_nik can reject the
 * change (unless admin); @app_role must be set on this same connection, hence
 * the dedicated connection instead of the shared `query()` helper.
 */
async function update(nik, data, role) {
  const conn = await pool.getConnection();
  try {
    await conn.query('SET @app_role = ?', [role || '']);
    await conn.execute(
      `UPDATE Pengunjung
          SET NIK_k = ?, Nama_k = ?, No_Telp_k = ?, Email_k = ?, Alamat_k = ?
        WHERE NIK_k = ?`,
      [data.NIK_k, data.Nama_k, data.No_Telp_k, data.Email_k, data.Alamat_k, nik]
    );
  } finally {
    conn.release();
  }
  return findById(data.NIK_k);
}

async function remove(nik) {
  const res = await query(`DELETE FROM Pengunjung WHERE NIK_k = ?`, [nik]);
  return res.affectedRows > 0;
}

module.exports = {
  findAll, findById, findProfile, create, update, remove,
};
