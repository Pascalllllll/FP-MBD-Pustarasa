'use strict';

const { pool } = require('../config/db');

/**
 * Generates the next sequential business key for a table, mirroring the
 * format used by the seed data and stored procedures.
 *
 *   Most tables: <2-letter prefix><4 digits>   e.g. PM0007, WK0013
 *   Buku:        <1-letter prefix><5 digits>    e.g. B00011
 *
 * The numeric part is derived from MAX(SUBSTRING(col, prefixLen+1)).
 * Runs inside the caller's transaction when a connection is supplied,
 * so concurrent inserts stay consistent.
 */
async function nextId(table, column, prefix, width, conn = pool) {
  const sql =
    `SELECT IFNULL(MAX(CAST(SUBSTRING(${column}, ${prefix.length + 1}) AS UNSIGNED)), 0) + 1 AS n ` +
    `FROM ${table}`;
  const [rows] = await conn.execute(sql);
  const n = rows[0].n;
  return `${prefix}${String(n).padStart(width, '0')}`;
}

// Convenience wrappers per entity ------------------------------------
const generators = {
  buku: (c) => nextId('Buku', 'ID_b', 'B', 5, c),
  makanan: (c) => nextId('Makanan', 'ID_mk', 'MK', 4, c),
  pengunjung: null, // visitors use NIK (16 digit national id), not generated
  metodePembayaran: (c) => nextId('Metode_pembayaran', 'ID_mp', 'MP', 4, c),
  waktuKunjung: (c) => nextId('Waktu_kunjung', 'ID_wk', 'WK', 4, c),
  peminjaman: (c) => nextId('Peminjaman', 'ID_pm', 'PM', 4, c),
  detailPeminjaman: (c) => nextId('Detail_Peminjaman', 'ID_dpm', 'DP', 4, c),
  pemesanan: (c) => nextId('Pemesanan', 'ID_ps', 'PS', 4, c),
  detailPemesanan: (c) => nextId('Detail_Pemesanan', 'ID_dps', 'DS', 4, c),
};

module.exports = { nextId, generators };
