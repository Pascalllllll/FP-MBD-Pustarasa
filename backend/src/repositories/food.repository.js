'use strict';

const { query, pool } = require('../config/db');
const { generators } = require('../utils/idGenerator');

const COLS = `m.ID_mk, m.Nama_mk, m.Jenis_mk, m.Harga_mk, m.Status_Ketersediaan_mk, m.Penjual_NIK_pj, pj.Nama_pj`;
const FROM = `Makanan m JOIN Penjual pj ON pj.NIK_pj = m.Penjual_NIK_pj`;

async function findAll(search) {
  if (search) {
    const like = `%${search}%`;
    return query(
      `SELECT ${COLS} FROM ${FROM}
        WHERE m.Nama_mk LIKE ? OR m.Jenis_mk LIKE ? OR m.ID_mk LIKE ?
        ORDER BY m.Nama_mk`,
      [like, like, like]
    );
  }
  return query(`SELECT ${COLS} FROM ${FROM} ORDER BY m.Nama_mk`);
}

async function findById(id) {
  const rows = await query(`SELECT ${COLS} FROM ${FROM} WHERE m.ID_mk = ?`, [id]);
  return rows[0] || null;
}

/** Only items currently 'Ada' — used to populate the POS / order screen. */
async function findAvailable() {
  return query(
    `SELECT ${COLS} FROM ${FROM}
      WHERE m.Status_Ketersediaan_mk = 'Ada'
      ORDER BY m.Jenis_mk, m.Nama_mk`
  );
}

async function create(data) {
  const conn = await pool.getConnection();
  try {
    const id = await generators.makanan(conn);
    await conn.execute(
      `INSERT INTO Makanan (ID_mk, Nama_mk, Jenis_mk, Harga_mk, Status_Ketersediaan_mk, Penjual_NIK_pj)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, data.Nama_mk, data.Jenis_mk, data.Harga_mk,
       data.Status_Ketersediaan_mk || 'Ada', data.Penjual_NIK_pj]
    );
    return findById(id);
  } finally {
    conn.release();
  }
}

async function update(id, data) {
  await query(
    `UPDATE Makanan
        SET Nama_mk = ?, Jenis_mk = ?, Harga_mk = ?, Status_Ketersediaan_mk = ?, Penjual_NIK_pj = ?
      WHERE ID_mk = ?`,
    [data.Nama_mk, data.Jenis_mk, data.Harga_mk, data.Status_Ketersediaan_mk, data.Penjual_NIK_pj, id]
  );
  return findById(id);
}

async function remove(id) {
  const res = await query(`DELETE FROM Makanan WHERE ID_mk = ?`, [id]);
  return res.affectedRows > 0;
}

const favorites = () => query(`SELECT * FROM vw_makanan_favorit`);
const aboveAverage = () => query(`SELECT * FROM vw_makanan_diatas_rata`);
const neverOrdered = () => query(`SELECT * FROM vw_makanan_belum_dipesan`);
const statusList = () => query(`SELECT * FROM vw_status_makanan`);

module.exports = {
  findAll, findById, findAvailable, create, update, remove,
  favorites, aboveAverage, neverOrdered, statusList,
};
