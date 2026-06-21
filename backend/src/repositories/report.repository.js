'use strict';

const { query, pool } = require('../config/db');

/**
 * Registry of every analytical VIEW in the schema, keyed by a stable slug
 * the frontend Reports page can request. This guarantees all 20 views are
 * reachable through the API. Grouped by service for the UI.
 */
const VIEW_REGISTRY = {
  status_buku: { view: 'vw_status_buku', title: 'Status Semua Buku', service: 'perpustakaan' },
  buku_terpopuler: { view: 'vw_buku_terpopuler', title: 'Buku Terpopuler', service: 'perpustakaan' },
  peminjaman_harian: { view: 'vw_peminjaman_harian', title: 'Peminjaman per Hari', service: 'perpustakaan' },
  buku_per_pengunjung: { view: 'vw_buku_per_pengunjung', title: 'Riwayat Pinjam per Pengunjung', service: 'perpustakaan' },
  buku_belum_kembali: { view: 'vw_buku_belum_kembali', title: 'Buku Belum Dikembalikan', service: 'perpustakaan' },
  performa_pustakawan: { view: 'vw_performa_pustakawan', title: 'Performa Pustakawan', service: 'perpustakaan' },
  peminjaman_tanpa_kunjungan: { view: 'vw_peminjaman_tanpa_kunjungan', title: 'Peminjaman Tanpa Kunjungan', service: 'perpustakaan' },
  pengunjung_belum_meminjam: { view: 'vw_pengunjung_belum_meminjam', title: 'Pengunjung Belum Meminjam', service: 'perpustakaan' },
  buku_terbaru: { view: 'vw_buku_terbaru', title: 'Buku Terbaru', service: 'perpustakaan' },

  kunjungan_harian: { view: 'vw_kunjungan_harian', title: 'Kunjungan per Hari', service: 'kunjungan' },
  jam_ramai: { view: 'vw_jam_ramai', title: 'Jam Ramai', service: 'kunjungan' },
  pengunjung_tanpa_pemesanan: { view: 'vw_pengunjung_tanpa_pemesanan', title: 'Pengunjung Tanpa Pemesanan', service: 'kunjungan' },

  status_makanan: { view: 'vw_status_makanan', title: 'Status Ketersediaan Makanan', service: 'kantin' },
  makanan_favorit: { view: 'vw_makanan_favorit', title: 'Makanan Favorit', service: 'kantin' },
  penjualan_per_jenis: { view: 'vw_penjualan_per_jenis', title: 'Penjualan per Jenis', service: 'kantin' },
  penjualan_harian: { view: 'vw_penjualan_harian', title: 'Penjualan per Hari', service: 'kantin' },
  penjualan_per_penjual: { view: 'vw_penjualan_per_penjual', title: 'Penjualan per Penjual', service: 'kantin' },
  penjualan_per_metode: { view: 'vw_penjualan_per_metode', title: 'Penjualan per Metode Bayar', service: 'kantin' },
  makanan_belum_dipesan: { view: 'vw_makanan_belum_dipesan', title: 'Makanan Belum Pernah Dipesan', service: 'kantin' },
  makanan_diatas_rata: { view: 'vw_makanan_diatas_rata', title: 'Makanan di Atas Harga Rata-rata', service: 'kantin' },
};

function listReports() {
  return Object.entries(VIEW_REGISTRY).map(([slug, meta]) => ({
    slug, title: meta.title, service: meta.service,
  }));
}

async function getReport(slug) {
  const meta = VIEW_REGISTRY[slug];
  if (!meta) return null;
  const rows = await query(`SELECT * FROM ${meta.view}`);
  return { slug, title: meta.title, service: meta.service, rows };
}

/** Daily recap via the stored procedure sp_rekap_harian (single-row set). */
async function dailyRecap(tanggal) {
  const conn = await pool.getConnection();
  try {
    const [resultSets] = await conn.query(`CALL sp_rekap_harian(?)`, [tanggal]);
    // CALL returns [ [rows], okPacket ]; first element holds our result rows
    const rows = Array.isArray(resultSets[0]) ? resultSets[0] : resultSets;
    return rows[0] || null;
  } finally {
    conn.release();
  }
}

/** Headline KPIs for the dual-service dashboard. */
async function dashboardSummary() {
  const rows = await query(
    `SELECT
       (SELECT COUNT(*) FROM Buku)                                              AS total_buku,
       (SELECT COUNT(*) FROM Buku WHERE Keterangan_b = 'Dipinjam')              AS buku_dipinjam,
       (SELECT COUNT(*) FROM Detail_Peminjaman WHERE Waktu_Kembali_dpm IS NULL) AS buku_belum_kembali,
       (SELECT COUNT(*) FROM Pengunjung)                                        AS total_pengunjung,
       (SELECT COUNT(*) FROM Pustakawan)                                        AS total_pustakawan,
       (SELECT COUNT(*) FROM Makanan)                                           AS total_makanan,
       (SELECT COUNT(*) FROM Makanan WHERE Status_Ketersediaan_mk = 'Ada')      AS makanan_tersedia,
       (SELECT COUNT(*) FROM Makanan WHERE Status_Ketersediaan_mk = 'Habis')    AS makanan_habis,
       (SELECT COUNT(*) FROM Waktu_kunjung WHERE Waktu_Keluar_wk IS NULL)       AS kunjungan_aktif,
       (SELECT COUNT(*) FROM Waktu_kunjung WHERE DATE(Waktu_Masuk_wk) = CURDATE()) AS kunjungan_hari_ini,
       (SELECT IFNULL(SUM(d.Kuantitas_dps * d.Harga_Satuan_dps), 0)
          FROM Pemesanan p JOIN Detail_Pemesanan d ON p.ID_ps = d.Pemesanan_ID_ps
         WHERE DATE(p.Waktu_Pesan_ps) = CURDATE())                              AS pendapatan_hari_ini,
       (SELECT IFNULL(SUM(d.Kuantitas_dps * d.Harga_Satuan_dps), 0)
          FROM Detail_Pemesanan d)                                             AS pendapatan_total`
  );
  return rows[0];
}

module.exports = { listReports, getReport, dailyRecap, dashboardSummary, VIEW_REGISTRY };
