'use strict';

const { pool } = require('../config/db');

/**
 * Registry of every stored PROCEDURE in the schema. `outs: null` means the
 * procedure returns a result set (a plain SELECT inside it) instead of OUT params.
 */
const PROCEDURE_REGISTRY = {
  sp_checkout_pesanan: {
    label: 'Checkout Pesanan',
    params: [
      { name: 'nik', label: 'NIK Pengunjung', placeholder: '1234567890123456' },
      { name: 'nikPj', label: 'NIK Penjual', placeholder: '4567890123456789' },
      { name: 'idMp', label: 'ID Metode Pembayaran', placeholder: 'MP0001' },
      { name: 'items', label: 'Items (JSON)', type: 'textarea', placeholder: '[{"id_mk":"MK0001","qty":2}]' },
    ],
    outs: ['id_ps', 'total'],
  },
  sp_pengembalian_buku: {
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

/** These run for real (same procedures the live Kasir/Pengembalian features call) — no rollback. */
async function call(name, values) {
  const meta = PROCEDURE_REGISTRY[name];
  if (!meta) return undefined;
  const inArgs = meta.params.map((p) => values[p.name] ?? null);
  const inPlaceholders = meta.params.map(() => '?').join(', ');

  const conn = await pool.getConnection();
  try {
    if (!meta.outs) {
      const [resultSets] = await conn.query(`CALL ${name}(${inPlaceholders})`, inArgs);
      const rows = Array.isArray(resultSets[0]) ? resultSets[0] : resultSets;
      return rows[0] || null;
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
