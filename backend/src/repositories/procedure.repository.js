'use strict';

const { pool } = require('../config/db');

/**
 * outs: null = reads a result set; [] = confirms it ran; [...] = OUT params.
 * Checkout/Pengembalian here call the *_sederhana objects (a teammate's
 * version); the real app still calls the original ones, untouched.
 */
const PROCEDURE_REGISTRY = {
  sp_checkout_pesanan_sederhana: {
    label: 'Checkout Pesanan',
    params: [
      { name: 'idPs', label: 'ID Pemesanan baru (format PS####, belum dipakai)', placeholder: 'PS9001' },
      { name: 'nik', label: 'NIK Pengunjung', placeholder: '1234567890123456' },
      { name: 'penjual', label: 'NIK Penjual', placeholder: '4567890123456789' },
      { name: 'metode', label: 'ID Metode Pembayaran', placeholder: 'MP0001' },
    ],
    outs: [],
  },
  sp_pengembalian_buku_sederhana: {
    label: 'Pengembalian Buku',
    params: [
      { name: 'idDpm', label: 'ID Detail Peminjaman', placeholder: 'DP0001' },
      { name: 'tanggal', label: 'Tanggal Kembali (opsional)', type: 'date' },
    ],
    outs: ['denda'],
  },
  sp_rekap_harian: {
    label: 'Rekap Harian',
    params: [{ name: 'tanggal', label: 'Tanggal', type: 'date', placeholder: '2026-06-22' }],
    outs: null,
  },
};

function list() {
  return Object.entries(PROCEDURE_REGISTRY).map(([name, meta]) => ({
    name,
    label: meta.label,
    params: meta.params,
  }));
}

/** Runs for real — no rollback. */
async function call(name, values) {
  const meta = PROCEDURE_REGISTRY[name];
  if (!meta) return undefined;
  const inArgs = meta.params.map((p) => values[p.name] ?? null);
  const inPlaceholders = meta.params.map(() => '?').join(', ');

  const conn = await pool.getConnection();
  try {
    if (meta.outs === null) {
      const [resultSets] = await conn.query(`CALL ${name}(${inPlaceholders})`, inArgs);
      const rows = Array.isArray(resultSets[0]) ? resultSets[0] : resultSets;
      return rows[0] || null;
    }
    if (meta.outs.length === 0) {
      await conn.query(`CALL ${name}(${inPlaceholders})`, inArgs);
      return { executed: true };
    }
    const outVars = meta.outs.map((o) => `@${o}`);
    await conn.query(`CALL ${name}(${inPlaceholders}, ${outVars.join(', ')})`, inArgs);
    const [rows] = await conn.query(
      `SELECT ${outVars.map((v, i) => `${v} AS ${meta.outs[i]}`).join(', ')}`
    );
    return rows[0];
  } finally {
    conn.release();
  }
}

module.exports = { PROCEDURE_REGISTRY, list, call };
