'use strict';

const { query, pool } = require('../config/db');
const { generators } = require('../utils/idGenerator');

/** Header rows joined with visitor + librarian names. */
async function findAll(search) {
  const where = search ? `WHERE pm.ID_pm LIKE ? OR pg.Nama_k LIKE ?` : ``;
  const params = search ? [`%${search}%`, `%${search}%`] : [];
  return query(
    `SELECT pm.ID_pm, pm.Waktu_Pinjam_pm, pm.Batas_Kembali_pm,
            pm.Pengunjung_NIK_k, pg.Nama_k,
            pm.Pustakawan_NIK_pt, pt.Nama_pt,
            (SELECT COUNT(*) FROM Detail_Peminjaman d WHERE d.Peminjaman_ID_pm = pm.ID_pm) AS jumlah_buku
       FROM Peminjaman pm
       JOIN Pengunjung pg ON pg.NIK_k = pm.Pengunjung_NIK_k
       JOIN Pustakawan pt ON pt.NIK_pt = pm.Pustakawan_NIK_pt
       ${where}
      ORDER BY pm.Waktu_Pinjam_pm DESC, pm.ID_pm DESC`,
    params
  );
}

/** Full loan with its book lines and per-line live fine. */
async function findById(id) {
  const header = await query(
    `SELECT pm.ID_pm, pm.Waktu_Pinjam_pm, pm.Batas_Kembali_pm,
            pm.Pengunjung_NIK_k, pg.Nama_k,
            pm.Pustakawan_NIK_pt, pt.Nama_pt
       FROM Peminjaman pm
       JOIN Pengunjung pg ON pg.NIK_k = pm.Pengunjung_NIK_k
       JOIN Pustakawan pt ON pt.NIK_pt = pm.Pustakawan_NIK_pt
      WHERE pm.ID_pm = ?`,
    [id]
  );
  if (!header[0]) return null;

  const lines = await query(
    `SELECT d.ID_dpm, d.Buku_ID_b, b.Judul_b,
            d.Waktu_Kembali_dpm, d.Denda_Per_Hari_dpm,
            sf_hitung_denda_peminjaman(d.ID_dpm) AS denda
       FROM Detail_Peminjaman d
       JOIN Buku b ON b.ID_b = d.Buku_ID_b
      WHERE d.Peminjaman_ID_pm = ?
      ORDER BY d.ID_dpm`,
    [id]
  );
  return { ...header[0], items: lines };
}

/**
 * Create a borrowing header plus one Detail_Peminjaman row per book, in a
 * single transaction. The AFTER-INSERT trigger trg_update_buku_dipinjam
 * flips each book to 'Dipinjam'; trg_validasi_buku_sedang_dipinjam blocks
 * double-lending and trg_validasi_batas_kembali enforces the date rule.
 *
 * @param {object} data { nik, nikPt, waktuPinjam, batasKembali,
 *                        items: [{ id_b, denda_per_hari }] }
 */
async function create(data) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const idPm = await generators.peminjaman(conn);
    await conn.execute(
      `INSERT INTO Peminjaman
        (ID_pm, Waktu_Pinjam_pm, Batas_Kembali_pm, Pengunjung_NIK_k, Pustakawan_NIK_pt)
       VALUES (?, ?, ?, ?, ?)`,
      [idPm, data.waktuPinjam, data.batasKembali, data.nik, data.nikPt]
    );

    for (const item of data.items) {
      const idDpm = await generators.detailPeminjaman(conn);
      await conn.execute(
        `INSERT INTO Detail_Peminjaman
          (ID_dpm, Waktu_Kembali_dpm, Denda_Per_Hari_dpm, Peminjaman_ID_pm, Buku_ID_b)
         VALUES (?, NULL, ?, ?, ?)`,
        [idDpm, item.denda_per_hari, idPm, item.id_b]
      );
    }

    await conn.commit();
    return idPm;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Return a single borrowed book by calling sp_pengembalian_buku. The
 * procedure stamps Waktu_Kembali_dpm (firing trg_update_buku_dikembalikan
 * to free the book) and returns the fine from sf_hitung_denda_peminjaman.
 */
async function returnBook(idDpm, tanggal) {
  const conn = await pool.getConnection();
  try {
    await conn.query(`SET @denda = 0`);
    await conn.query(`CALL sp_pengembalian_buku(?, ?, @denda)`, [idDpm, tanggal || null]);
    const [rows] = await conn.query(`SELECT @denda AS denda`);
    return rows[0].denda;
  } finally {
    conn.release();
  }
}

// View-backed reads ---------------------------------------------------
const daily = () => query(`SELECT * FROM vw_peminjaman_harian`);
const outstanding = () => query(`SELECT * FROM vw_buku_belum_kembali`);
const perVisitor = () => query(`SELECT * FROM vw_buku_per_pengunjung`);
const withoutVisit = () => query(`SELECT * FROM vw_peminjaman_tanpa_kunjungan`);

module.exports = {
  findAll, findById, create, returnBook,
  daily, outstanding, perVisitor, withoutVisit,
};
