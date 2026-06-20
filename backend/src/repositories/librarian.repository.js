'use strict';

const { query } = require('../config/db');

const COLS = `NIK_pt, Nama_pt, Jadwal_Shift_pt, Tanggal_Lahir_pt, No_Telp_pt, Email_pt, Alamat_pt`;

async function findAll(search) {
  if (search) {
    const like = `%${search}%`;
    return query(
      `SELECT ${COLS} FROM Pustakawan
        WHERE NIK_pt LIKE ? OR Nama_pt LIKE ?
        ORDER BY Nama_pt`,
      [like, like]
    );
  }
  return query(`SELECT ${COLS} FROM Pustakawan ORDER BY Nama_pt`);
}

async function findById(nik) {
  const rows = await query(`SELECT ${COLS} FROM Pustakawan WHERE NIK_pt = ?`, [nik]);
  return rows[0] || null;
}

/**
 * trg_validasi_umur_pustakawan enforces age >= 18 on insert/update, so an
 * underage Tanggal_Lahir_pt will be rejected at the DB layer.
 */
async function create(data) {
  await query(
    `INSERT INTO Pustakawan
      (NIK_pt, Nama_pt, Jadwal_Shift_pt, Tanggal_Lahir_pt, No_Telp_pt, Email_pt, Alamat_pt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [data.NIK_pt, data.Nama_pt, data.Jadwal_Shift_pt, data.Tanggal_Lahir_pt,
     data.No_Telp_pt, data.Email_pt, data.Alamat_pt]
  );
  return findById(data.NIK_pt);
}

async function update(nik, data) {
  await query(
    `UPDATE Pustakawan
        SET Nama_pt = ?, Jadwal_Shift_pt = ?, Tanggal_Lahir_pt = ?,
            No_Telp_pt = ?, Email_pt = ?, Alamat_pt = ?
      WHERE NIK_pt = ?`,
    [data.Nama_pt, data.Jadwal_Shift_pt, data.Tanggal_Lahir_pt,
     data.No_Telp_pt, data.Email_pt, data.Alamat_pt, nik]
  );
  return findById(nik);
}

async function remove(nik) {
  const res = await query(`DELETE FROM Pustakawan WHERE NIK_pt = ?`, [nik]);
  return res.affectedRows > 0;
}

const performance = () => query(`SELECT * FROM vw_performa_pustakawan`);

module.exports = { findAll, findById, create, update, remove, performance };
