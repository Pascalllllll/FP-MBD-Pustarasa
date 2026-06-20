'use strict';

const { query } = require('../config/db');

const COLS = `NIK_pj, Nama_pj, Tanggal_Lahir_pj, No_Telp_pj, Email_pj, Alamat_pj`;

async function findAll(search) {
  if (search) {
    const like = `%${search}%`;
    return query(
      `SELECT ${COLS} FROM Penjual
        WHERE NIK_pj LIKE ? OR Nama_pj LIKE ?
        ORDER BY Nama_pj`,
      [like, like]
    );
  }
  return query(`SELECT ${COLS} FROM Penjual ORDER BY Nama_pj`);
}

async function findById(nik) {
  const rows = await query(`SELECT ${COLS} FROM Penjual WHERE NIK_pj = ?`, [nik]);
  return rows[0] || null;
}

async function create(data) {
  await query(
    `INSERT INTO Penjual
      (NIK_pj, Nama_pj, Tanggal_Lahir_pj, No_Telp_pj, Email_pj, Alamat_pj)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [data.NIK_pj, data.Nama_pj, data.Tanggal_Lahir_pj,
     data.No_Telp_pj, data.Email_pj, data.Alamat_pj]
  );
  return findById(data.NIK_pj);
}

async function update(nik, data) {
  await query(
    `UPDATE Penjual
        SET Nama_pj = ?, Tanggal_Lahir_pj = ?, No_Telp_pj = ?, Email_pj = ?, Alamat_pj = ?
      WHERE NIK_pj = ?`,
    [data.Nama_pj, data.Tanggal_Lahir_pj, data.No_Telp_pj,
     data.Email_pj, data.Alamat_pj, nik]
  );
  return findById(nik);
}

async function remove(nik) {
  const res = await query(`DELETE FROM Penjual WHERE NIK_pj = ?`, [nik]);
  return res.affectedRows > 0;
}

const sales = () => query(`SELECT * FROM vw_penjualan_per_penjual`);

module.exports = { findAll, findById, create, update, remove, sales };
