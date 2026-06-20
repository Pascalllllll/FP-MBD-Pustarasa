'use strict';

const { query, pool } = require('../config/db');
const { generators } = require('../utils/idGenerator');

const COLS = `ID_mk, Nama_mk, Jenis_mk, Harga_mk, Status_Ketersediaan_mk`;

async function findAll(search) {
  if (search) {
    const like = `%${search}%`;
    return query(
      `SELECT ${COLS} FROM Makanan
        WHERE Nama_mk LIKE ? OR Jenis_mk LIKE ? OR ID_mk LIKE ?
        ORDER BY Nama_mk`,
      [like, like, like]
    );
  }
  return query(`SELECT ${COLS} FROM Makanan ORDER BY Nama_mk`);
}

async function findById(id) {
  const rows = await query(`SELECT ${COLS} FROM Makanan WHERE ID_mk = ?`, [id]);
  return rows[0] || null;
}

/** Only items currently 'Ada' — used to populate the POS / order screen. */
async function findAvailable() {
  return query(
    `SELECT ${COLS} FROM Makanan
      WHERE Status_Ketersediaan_mk = 'Ada'
      ORDER BY Jenis_mk, Nama_mk`
  );
}

async function create(data) {
  const conn = await pool.getConnection();
  try {
    const id = await generators.makanan(conn);
    await conn.execute(
      `INSERT INTO Makanan (ID_mk, Nama_mk, Jenis_mk, Harga_mk, Status_Ketersediaan_mk)
       VALUES (?, ?, ?, ?, ?)`,
      [id, data.Nama_mk, data.Jenis_mk, data.Harga_mk,
       data.Status_Ketersediaan_mk || 'Ada']
    );
    const [rows] = await conn.execute(`SELECT ${COLS} FROM Makanan WHERE ID_mk = ?`, [id]);
    return rows[0];
  } finally {
    conn.release();
  }
}

async function update(id, data) {
  await query(
    `UPDATE Makanan
        SET Nama_mk = ?, Jenis_mk = ?, Harga_mk = ?, Status_Ketersediaan_mk = ?
      WHERE ID_mk = ?`,
    [data.Nama_mk, data.Jenis_mk, data.Harga_mk, data.Status_Ketersediaan_mk, id]
  );
  return findById(id);
}

async function remove(id) {
  const res = await query(`DELETE FROM Makanan WHERE ID_mk = ?`, [id]);
  return res.affectedRows > 0;
}

// View-backed reads ---------------------------------------------------
const favorites = () => query(`SELECT * FROM vw_makanan_favorit`);
const aboveAverage = () => query(`SELECT * FROM vw_makanan_diatas_rata`);
const neverOrdered = () => query(`SELECT * FROM vw_makanan_belum_dipesan`);
const statusList = () => query(`SELECT * FROM vw_status_makanan`);

module.exports = {
  findAll, findById, findAvailable, create, update, remove,
  favorites, aboveAverage, neverOrdered, statusList,
};
