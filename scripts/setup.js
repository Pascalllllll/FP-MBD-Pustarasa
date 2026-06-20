'use strict';

const path = require('path');
const { ensureEnvFile, run } = require('./lib');
const dbSetup = require('./db-setup');

const ROOT = path.join(__dirname, '..');
const BACKEND_DIR = path.join(ROOT, 'backend');
const FRONTEND_DIR = path.join(ROOT, 'frontend');

async function main() {
  console.log('== PustaRasa setup ==\n');

  if (ensureEnvFile(BACKEND_DIR)) console.log('[env] backend/.env dibuat dari .env.example');
  if (ensureEnvFile(FRONTEND_DIR)) console.log('[env] frontend/.env dibuat dari .env.example');

  console.log('\n[npm] instal dependensi backend...');
  run('npm', ['install'], { cwd: BACKEND_DIR });

  console.log('\n[npm] instal dependensi frontend...');
  run('npm', ['install'], { cwd: FRONTEND_DIR });

  console.log('\n[db] menyiapkan basis data...');
  await dbSetup.run({ force: process.argv.includes('--force') });

  console.log('\nSetup selesai. Jalankan `npm run dev` untuk memulai backend + frontend sekaligus.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
