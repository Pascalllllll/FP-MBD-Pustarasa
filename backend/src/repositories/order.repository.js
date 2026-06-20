'use strict';

const { query, pool } = require('../config/db');

/** Header rows with seller / visitor / payment + computed total. */
async function findAll(search) {
  const where = search ? `WHERE ps.ID_ps LIKE ? OR pg.Nama_k LIKE ?` : ``;
  const params = search ? [`%${search}%`, `%${search}%`] : [];
  return query(
    `SELECT ps.ID_ps, ps.Waktu_Pesan_ps,
            ps.Pengunjung_NIK_k, pg.Nama_k,
            ps.Penjual_NIK_pj, pj.Nama_pj,
            ps.Metode_pembayaran_ID_mp, mp.Instansi_mp, mp.Jenis_mp,
            sf_hitung_total_pemesanan(ps.ID_ps) AS total
       FROM Pemesanan ps
       JOIN Pengunjung pg ON pg.NIK_k = ps.Pengunjung_NIK_k
       JOIN Penjual pj ON pj.NIK_pj = ps.Penjual_NIK_pj
       JOIN Metode_pembayaran mp ON mp.ID_mp = ps.Metode_pembayaran_ID_mp
       ${where}
      ORDER BY ps.Waktu_Pesan_ps DESC, ps.ID_ps DESC`,
    params
  );
}

/** Full order with line items (price snapshot from Harga_Satuan_dps). */
async function findById(id) {
  const header = await query(
    `SELECT ps.ID_ps, ps.Waktu_Pesan_ps,
            ps.Pengunjung_NIK_k, pg.Nama_k,
            ps.Penjual_NIK_pj, pj.Nama_pj,
            ps.Metode_pembayaran_ID_mp, mp.Instansi_mp, mp.Jenis_mp,
            sf_hitung_total_pemesanan(ps.ID_ps) AS total
       FROM Pemesanan ps
       JOIN Pengunjung pg ON pg.NIK_k = ps.Pengunjung_NIK_k
       JOIN Penjual pj ON pj.NIK_pj = ps.Penjual_NIK_pj
       JOIN Metode_pembayaran mp ON mp.ID_mp = ps.Metode_pembayaran_ID_mp
      WHERE ps.ID_ps = ?`,
    [id]
  );
  if (!header[0]) return null;

  const lines = await query(
    `SELECT d.ID_dps, d.Makanan_ID_mk, m.Nama_mk,
            d.Kuantitas_dps, d.Harga_Satuan_dps,
            (d.Kuantitas_dps * d.Harga_Satuan_dps) AS subtotal
       FROM Detail_Pemesanan d
       JOIN Makanan m ON m.ID_mk = d.Makanan_ID_mk
      WHERE d.Pemesanan_ID_ps = ?
      ORDER BY d.ID_dps`,
    [id]
  );
  return { ...header[0], items: lines };
}

/**
 * Place an order by delegating entirely to sp_checkout_pesanan. The
 * procedure runs its own transaction: it inserts the header, snapshots
 * each food price into Harga_Satuan_dps, and lets triggers
 * trg_validasi_makanan_habis + trg_validasi_kuantitas_pesanan validate
 * each line. Returns the generated id and total.
 *
 * @param {object} data { nik, nikPj, idMp, items: [{ id_mk, qty }] }
 */
async function checkout(data) {
  const conn = await pool.getConnection();
  try {
    await conn.query(`SET @id_ps = ''`);
    await conn.query(`SET @total = 0`);
    // The procedure parameter is typed JSON; passing the JSON string
    // directly works on both MySQL 8 (implicit string->JSON) and MariaDB.
    await conn.query(
      `CALL sp_checkout_pesanan(?, ?, ?, ?, @id_ps, @total)`,
      [data.nik, data.nikPj, data.idMp, JSON.stringify(data.items)]
    );
    const [rows] = await conn.query(`SELECT @id_ps AS id_ps, @total AS total`);
    return rows[0];
  } finally {
    conn.release();
  }
}

// View-backed reads ---------------------------------------------------
const daily = () => query(`SELECT * FROM vw_penjualan_harian`);
const byType = () => query(`SELECT * FROM vw_penjualan_per_jenis`);

module.exports = { findAll, findById, checkout, daily, byType };
