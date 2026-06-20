'use strict';

const mysql = require('mysql2/promise');
const env = require('./env');

/**
 * Single shared connection pool. We enable multipleStatements:false
 * (default) for safety and rely on parameterised queries everywhere.
 *
 * `namedPlaceholders` lets repositories pass objects to CALL/SELECT,
 * which keeps stored-procedure calls readable.
 */
const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  waitForConnections: true,
  connectionLimit: env.db.connectionLimit,
  queueLimit: 0,
  namedPlaceholders: true,
  decimalNumbers: true,
  dateStrings: ['DATE'],
});

/** Thin helper so callers don't destructure [rows] everywhere. */
async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

/** Verify connectivity at boot; throws if the DB is unreachable. */
async function assertConnection() {
  const conn = await pool.getConnection();
  try {
    await conn.ping();
  } finally {
    conn.release();
  }
}

module.exports = { pool, query, assertConnection };
