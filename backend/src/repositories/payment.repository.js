'use strict';

const { query, pool } = require('../config/db');
const { generators } = require('../utils/idGenerator');

const COLS = `ID_mp, Instansi_mp, Jenis_mp`;

async function findAll() {
  return query(`SELECT ${COLS} FROM Metode_pembayaran ORDER BY Instansi_mp`);
}

async function findById(id) {
  const rows = await query(`SELECT ${COLS} FROM Metode_pembayaran WHERE ID_mp = ?`, [id]);
  return rows[0] || null;
}

async function create(data) {
  const conn = await pool.getConnection();
  try {
    const id = await generators.metodePembayaran(conn);
    await conn.execute(
      `INSERT INTO Metode_pembayaran (ID_mp, Instansi_mp, Jenis_mp) VALUES (?, ?, ?)`,
      [id, data.Instansi_mp, data.Jenis_mp]
    );
    const [rows] = await conn.execute(`SELECT ${COLS} FROM Metode_pembayaran WHERE ID_mp = ?`, [id]);
    return rows[0];
  } finally {
    conn.release();
  }
}

async function update(id, data) {
  await query(
    `UPDATE Metode_pembayaran SET Instansi_mp = ?, Jenis_mp = ? WHERE ID_mp = ?`,
    [data.Instansi_mp, data.Jenis_mp, id]
  );
  return findById(id);
}

async function remove(id) {
  const res = await query(`DELETE FROM Metode_pembayaran WHERE ID_mp = ?`, [id]);
  return res.affectedRows > 0;
}

const salesByMethod = () => query(`SELECT * FROM vw_penjualan_per_metode`);

module.exports = { findAll, findById, create, update, remove, salesByMethod };
