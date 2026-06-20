'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { readEnvFile, setEnvValue, promptHidden } = require('./lib');

const ROOT = path.join(__dirname, '..');
const BACKEND_ENV = path.join(ROOT, 'backend', '.env');
const SQL_DIR = path.join(ROOT, 'database');
const DB_NAME = 'pustarasa';

function mysqlArgs({ host, port, user }) {
  return ['-h', host, '-P', String(port), '-u', user];
}

function mysqlAvailable() {
  return !spawnSync('mysql', ['--version']).error;
}

function tryConnect(creds) {
  const res = spawnSync('mysql', [...mysqlArgs(creds), '-e', 'SELECT 1;'], {
    env: { ...process.env, MYSQL_PWD: creds.password || '' },
    encoding: 'utf8',
  });
  return res.status === 0;
}

function databaseExists(creds) {
  const res = spawnSync(
    'mysql',
    [...mysqlArgs(creds), '-N', '-e', `SHOW DATABASES LIKE '${DB_NAME}';`],
    { env: { ...process.env, MYSQL_PWD: creds.password || '' }, encoding: 'utf8' }
  );
  return res.status === 0 && res.stdout.trim() === DB_NAME;
}

function importFile(creds, filePath) {
  const sql = fs.readFileSync(filePath);
  const res = spawnSync('mysql', mysqlArgs(creds), {
    input: sql,
    env: { ...process.env, MYSQL_PWD: creds.password || '' },
    stdio: ['pipe', 'inherit', 'inherit'],
  });
  return res.status === 0;
}

async function resolveCredentials() {
  const env = readEnvFile(BACKEND_ENV);
  const base = {
    host: env.DB_HOST || '127.0.0.1',
    port: env.DB_PORT || '3306',
    user: env.DB_USER || 'root',
    password: env.DB_PASSWORD || '',
  };

  if (tryConnect(base)) return base;

  console.log(`\nTidak bisa konek ke MySQL sebagai '${base.user}'@'${base.host}:${base.port}'.`);
  const password = await promptHidden(`Masukkan sandi MySQL untuk user '${base.user}': `);
  const withPassword = { ...base, password };
  if (!tryConnect(withPassword)) {
    console.error('Gagal konek ke MySQL dengan sandi tersebut. Periksa kredensial lalu jalankan ulang `npm run db:setup`.');
    process.exit(1);
  }

  if (fs.existsSync(BACKEND_ENV)) {
    setEnvValue(BACKEND_ENV, 'DB_PASSWORD', password);
    console.log('[env] DB_PASSWORD disimpan ke backend/.env untuk pemakaian berikutnya.');
  }
  return withPassword;
}

async function run({ force = false } = {}) {
  if (!mysqlAvailable()) {
    console.error('Klien `mysql` tidak ditemukan di PATH. Pasang MySQL/MariaDB client lalu coba lagi.');
    process.exit(1);
  }

  const creds = await resolveCredentials();

  if (!force && databaseExists(creds)) {
    console.log(`[db] Database '${DB_NAME}' sudah ada — lewati impor. Jalankan \`npm run db:reset\` untuk impor ulang.`);
    return;
  }

  const files = fs
    .readdirSync(SQL_DIR)
    .filter((f) => /^0\d.*\.sql$/.test(f))
    .sort();

  for (const file of files) {
    console.log(`[db] menjalankan ${file} ...`);
    if (!importFile(creds, path.join(SQL_DIR, file))) {
      console.error(`[db] gagal pada ${file}. Hentikan.`);
      process.exit(1);
    }
  }
  console.log('[db] selesai — skema, data, dan akun login sudah dimuat.');
}

if (require.main === module) {
  run({ force: process.argv.includes('--force') }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { run };
