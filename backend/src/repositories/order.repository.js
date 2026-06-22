'use strict';

const { query, pool } = require('../config/db');
const { generators } = require('../utils/idGenerator');

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

/** Header via sp_checkout_pesanan (no items), then one Detail_Pemesanan insert per item — same transaction, so stock/qty triggers can still roll back the whole order. */
async function checkout(data) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const idPs = await generators.pemesanan(conn);
    await conn.execute(`CALL sp_checkout_pesanan(?, ?, ?, ?)`, [idPs, data.nik, data.nikPj, data.idMp]);

    for (const item of data.items) {
      const idDps = await generators.detailPemesanan(conn);
      await conn.execute(
        `INSERT INTO Detail_Pemesanan (ID_dps, Kuantitas_dps, Harga_Satuan_dps, Pemesanan_ID_ps, Makanan_ID_mk)
         VALUES (?, ?, ?, ?, ?)`,
        [idDps, item.qty, item.harga, idPs, item.id_mk]
      );
    }

    await conn.commit();
    return { id_ps: idPs };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

const daily = () => query(`SELECT * FROM vw_penjualan_harian`);
const byType = () => query(`SELECT * FROM vw_penjualan_per_jenis`);

module.exports = { findAll, findById, checkout, daily, byType };
