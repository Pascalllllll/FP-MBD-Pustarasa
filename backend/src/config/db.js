'use strict';

const mysql = require('mysql2/promise');
const env = require('./env');

/** Shared connection pool; parameterised queries everywhere, namedPlaceholders for readable CALL/SELECT. */
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
