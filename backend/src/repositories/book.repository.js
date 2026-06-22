'use strict';

const { query, pool } = require('../config/db');
const { generators } = require('../utils/idGenerator');

const COLS = `ID_b, Judul_b, Jenis_b, Penulis_b, Sinopsis_b, Tahun_Terbit_b, Kualitas_b, Keterangan_b`;

async function findAll(search) {
  if (search) {
    const like = `%${search}%`;
    return query(
      `SELECT ${COLS} FROM Buku
        WHERE Judul_b LIKE ? OR Penulis_b LIKE ? OR Jenis_b LIKE ? OR ID_b LIKE ?
        ORDER BY Judul_b`,
      [like, like, like, like]
    );
  }
  return query(`SELECT ${COLS} FROM Buku ORDER BY Judul_b`);
}

async function findById(id) {
  const rows = await query(`SELECT ${COLS} FROM Buku WHERE ID_b = ?`, [id]);
  return rows[0] || null;
}

/** Live availability via sf_cek_ketersediaan_buku (reads circulation flag). */
async function checkAvailability(id) {
  const rows = await query(
    `SELECT sf_cek_ketersediaan_buku(?) AS ketersediaan`,
    [id]
  );
  return rows[0] ? rows[0].ketersediaan : null;
}

/** Most-borrowed title in the genre via sf_rekomendasi_buku, excluding the book's own title. */
async function recommendByGenre(jenis, judul) {
  const rows = await query(`SELECT sf_rekomendasi_buku(?, ?) AS rekomendasi`, [jenis, judul]);
  return rows[0] ? rows[0].rekomendasi : null;
}

/** Distinct genres for filter dropdowns. */
async function genres() {
  const rows = await query(
    `SELECT DISTINCT Jenis_b FROM Buku WHERE Jenis_b IS NOT NULL ORDER BY Jenis_b`
  );
  return rows.map((r) => r.Jenis_b);
}

async function create(data) {
  const conn = await pool.getConnection();
  try {
    const id = await generators.buku(conn);
    await conn.execute(
      `INSERT INTO Buku
        (ID_b, Judul_b, Jenis_b, Penulis_b, Sinopsis_b, Tahun_Terbit_b, Kualitas_b, Keterangan_b)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Tidak Dipinjam')`,
      [id, data.Judul_b, data.Jenis_b, data.Penulis_b, data.Sinopsis_b || null,
       data.Tahun_Terbit_b, data.Kualitas_b]
    );
    const [rows] = await conn.execute(`SELECT ${COLS} FROM Buku WHERE ID_b = ?`, [id]);
    return rows[0];
  } finally {
    conn.release();
  }
}

/** Keterangan_b is maintained by triggers, so it's excluded from manual edits. */
async function update(id, data) {
  await query(
    `UPDATE Buku
        SET Judul_b = ?, Jenis_b = ?, Penulis_b = ?, Sinopsis_b = ?,
            Tahun_Terbit_b = ?, Kualitas_b = ?
      WHERE ID_b = ?`,
    [data.Judul_b, data.Jenis_b, data.Penulis_b, data.Sinopsis_b || null,
     data.Tahun_Terbit_b, data.Kualitas_b, id]
  );
  return findById(id);
}

async function remove(id) {
  const res = await query(`DELETE FROM Buku WHERE ID_b = ?`, [id]);
  return res.affectedRows > 0;
}

const popular = () => query(`SELECT * FROM vw_buku_terpopuler`);
const newest = () => query(`SELECT * FROM vw_buku_terbaru`);
const statusList = () => query(`SELECT * FROM vw_status_buku`);

module.exports = {
  findAll, findById, checkAvailability, recommendByGenre, genres,
  create, update, remove, popular, newest, statusList,
};
