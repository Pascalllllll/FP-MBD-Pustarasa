'use strict';

const { query } = require('../config/db');

/** Registry of every stored function, keyed by name; call() only uses a name already looked up here, never raw user input, so it stays injection-safe. */
const FUNCTION_REGISTRY = {
  sf_cek_ketersediaan_buku: {
    label: 'Cek Ketersediaan Buku',
    params: [{ name: 'id_b', label: 'ID Buku', placeholder: 'B00001' }],
  },
  sf_rekomendasi_buku: {
    label: 'Rekomendasi Buku',
    params: [
      { name: 'jenis', label: 'Jenis / Genre', placeholder: 'Fiksi - Drama' },
      { name: 'judul_exclude', label: 'Judul yang Dikecualikan', placeholder: '1984' },
    ],
  },
  sf_hitung_denda_peminjaman: {
    label: 'Hitung Denda Peminjaman',
    params: [{ name: 'id_dpm', label: 'ID Detail Peminjaman', placeholder: 'DP0001' }],
  },
  sf_hitung_total_pemesanan: {
    label: 'Hitung Total Pemesanan',
    params: [{ name: 'id_ps', label: 'ID Pemesanan', placeholder: 'PS0001' }],
  },
  sf_total_pengeluaran_pengunjung: {
    label: 'Total Pengeluaran Pengunjung',
    params: [{ name: 'nik', label: 'NIK Pengunjung', placeholder: '1234567890123456' }],
  },
  sf_total_denda_pengunjung: {
    label: 'Total Denda Pengunjung',
    params: [{ name: 'nik', label: 'NIK Pengunjung', placeholder: '1234567890123456' }],
  },
  sf_cek_status_pengunjung: {
    label: 'Cek Status Pengunjung',
    params: [{ name: 'nik', label: 'NIK Pengunjung', placeholder: '1234567890123456' }],
  },
  sf_durasi_kunjungan_rata_rata: {
    label: 'Durasi Kunjungan Rata-rata',
    params: [{ name: 'nik', label: 'NIK Pengunjung', placeholder: '1234567890123456' }],
  },
};

function list() {
  return Object.entries(FUNCTION_REGISTRY).map(([name, meta]) => ({
    name,
    label: meta.label,
    params: meta.params,
  }));
}

async function call(name, values) {
  const meta = FUNCTION_REGISTRY[name];
  if (!meta) return undefined;
  const placeholders = meta.params.map(() => '?').join(', ');
  const args = meta.params.map((p) => values[p.name] ?? null);
  const rows = await query(`SELECT ${name}(${placeholders}) AS result`, args);
  return rows[0] ? rows[0].result : null;
}

module.exports = { FUNCTION_REGISTRY, list, call };
