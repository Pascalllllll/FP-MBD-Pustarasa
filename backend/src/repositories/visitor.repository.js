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

/**
 * Rich profile: base row + derived metrics computed by stored FUNCTIONS.
 * - sf_cek_status_keanggotaan : Aktif / Tidak Aktif membership label
 * - sf_total_pengeluaran_pengunjung : lifetime canteen spend
 * - sf_total_denda_pengunjung : lifetime library fines
 * - sf_durasi_kunjungan_rata_rata : average visit duration (minutes)
 */
async function findProfile(nik) {
  const rows = await query(
    `SELECT
        p.NIK_k, p.Nama_k, p.No_Telp_k, p.Email_k, p.Alamat_k,
        sf_cek_status_keanggotaan(p.NIK_k)        AS status_keanggotaan,
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
 * NIK_k is included in the SET clause on purpose: if the caller changes it,
 * trg_validasi_update_nik fires and rejects the whole statement (SIGNAL
 * 45000) — unless the caller is admin. @app_role is a connection-scoped
 * session variable the trigger reads; it must be set on the same
 * connection right before the UPDATE, hence the dedicated pool connection
 * instead of the shared `query()` helper. Address changes are recorded
 * automatically by trg_log_perubahan_alamat into Log_Perubahan_Alamat.
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

/** Address-change audit trail produced by the log trigger. */
async function addressHistory(nik) {
  return query(
    `SELECT ID_log, Alamat_Lama, Alamat_Baru, Waktu_Ubah
       FROM Log_Perubahan_Alamat
      WHERE Pengunjung_NIK = ?
      ORDER BY Waktu_Ubah DESC`,
    [nik]
  );
}

module.exports = {
  findAll, findById, findProfile, create, update, remove, addressHistory,
};
