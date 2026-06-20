'use strict';

const { query } = require('../config/db');

/** Look up an active account by username (for login). */
async function findByUsername(username) {
  const rows = await query(
    `SELECT id, username, password_hash, full_name, role, staff_nik, is_active
       FROM app_account
      WHERE username = ? AND is_active = 1
      LIMIT 1`,
    [username]
  );
  return rows[0] || null;
}

/** Fetch a sanitised account profile by id (no password hash). */
async function findProfileById(id) {
  const rows = await query(
    `SELECT id, username, full_name, role, staff_nik, created_at
       FROM app_account WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

module.exports = { findByUsername, findProfileById };
