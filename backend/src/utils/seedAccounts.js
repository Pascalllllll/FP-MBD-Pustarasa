'use strict';

/** Idempotent seeder for app_account — `npm run seed:accounts` to (re)create default logins. */
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

const ACCOUNTS = [
  { username: 'admin', password: 'admin123', fullName: 'Administrator Sistem', role: 'admin', staffNik: null },
  { username: 'pustakawan', password: 'staff123', fullName: 'Adit Pratama', role: 'pustakawan', staffNik: '5678901234567890' },
  { username: 'penjual', password: 'staff123', fullName: 'Agung Pratama', role: 'penjual', staffNik: '4567890123456789' },
  { username: 'pengunjung', password: 'lihat123', fullName: 'Ahmad Zaki', role: 'pengunjung', staffNik: '1234567890123456' },
];

async function run() {
  for (const a of ACCOUNTS) {
    const hash = await bcrypt.hash(a.password, 10);
    await pool.execute(
      `INSERT INTO app_account (username, password_hash, full_name, role, staff_nik, is_active)
       VALUES (?, ?, ?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE
         password_hash = VALUES(password_hash),
         full_name     = VALUES(full_name),
         role          = VALUES(role),
         staff_nik     = VALUES(staff_nik),
         is_active     = 1`,
      [a.username, hash, a.fullName, a.role, a.staffNik]
    );
    // eslint-disable-next-line no-console
    console.log(`  seeded account: ${a.username} (${a.role})`);
  }
  // eslint-disable-next-line no-console
  console.log('Done. Sandi: admin=admin123, staf=staff123, pengunjung=lihat123.');
}

run()
  .then(() => pool.end())
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('seedAccounts failed:', err.message);
    pool.end();
    process.exit(1);
  });
