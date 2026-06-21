# Panduan Instalasi — PustaRasa

Sistem terpadu **Perpustakaan & Kantin PustaRasa**. Dokumen ini menjelaskan cara menyiapkan basis data, menjalankan backend (Node/Express), dan frontend (React/Vite) di mesin lokal.

## 1. Prasyarat

| Komponen | Versi minimum | Catatan |
|---|---|---|
| MySQL | 8.0 | Wajib 8.x — sistem memakai JSON, CTE, `SIGNAL`, dan stored routine |
| Node.js | 18 LTS | Untuk backend dan frontend |
| npm | 9+ | Terpasang bersama Node |

## 1a. Setup Otomatis (disarankan)

Dari root proyek (bukan `backend/` atau `frontend/`):

```bash
npm run setup   # instal dependensi backend+frontend, lalu impor basis data
npm run dev     # jalankan backend (:4000) & frontend (:5173) bersamaan
```

Kedua perintah berjalan lewat Node.js, jadi identik di Windows (cmd.exe atau PowerShell), macOS, dan Linux — tidak ada langkah tambahan untuk Windows di jalur ini.

`npm run setup` akan:
1. Membuat `backend/.env` dan `frontend/.env` dari `.env.example` bila belum ada.
2. Menjalankan `npm install` di `backend/` dan `frontend/`.
3. Mengecek koneksi MySQL; bila gagal, menanyakan sandi root secara interaktif (lalu menyimpannya ke `backend/.env`).
4. Mengimpor ketujuh file SQL **hanya jika** basis data `pustarasa` belum ada.

Perintah terkait lainnya:

| Perintah | Kegunaan |
|---|---|
| `npm run db:setup` | Hanya bagian basis data (skip jika `pustarasa` sudah ada) |
| `npm run db:reset` | Impor ulang dari nol — **menimpa seluruh data** (skrip `01_schema.sql` melakukan `DROP DATABASE` lebih dulu) |
| `npm run seed:accounts` | Reset akun login tanpa menjalankan SQL |

Bagian 2–4 di bawah ini menjelaskan langkah manual yang setara, untuk dijalankan satu per satu bila diperlukan (mis. debugging).

## 2. Menyiapkan Basis Data (manual)

Jalankan ketujuh skrip SQL **secara berurutan**. Urutan penting: skema dulu, lalu objek, lalu **data**, baru **trigger** (data sengaja dimuat sebelum trigger agar trigger tidak ikut memvalidasi data historis).

```bash
cd database

mysql -u root -p < 01_schema.sql          # 11 tabel inti + 2 tabel app
mysql -u root -p < 02_functions.sql        # 8 stored function (sf_*)
mysql -u root -p < 03_procedures.sql       # 3 stored procedure (sp_*)
mysql -u root -p < 04_views.sql            # 20 view analitis (vw_*)
mysql -u root -p < 05_seed_data.sql        # data contoh (dari file SQL Anda)
mysql -u root -p < 06_triggers.sql         # 14 trigger (dipasang SETELAH data)
mysql -u root -p < 07_seed_accounts.sql    # akun login (bcrypt)
```

> Alternatif satu baris (Linux/macOS):
> ```bash
> for f in 0*.sql; do mysql -u root -p < "$f" || break; done
> ```
> (skrip `01_schema.sql` sudah `CREATE DATABASE pustarasa` dan `USE`-nya.)

> Alternatif satu baris (Windows — PowerShell): operator `<` tidak didukung PowerShell, jadi pipe-kan isi file lewat `Get-Content`:
> ```powershell
> Get-ChildItem -Filter "0*.sql" | Sort-Object Name | ForEach-Object { Get-Content $_.FullName | mysql -u root -p }
> ```
> Alternatif (Windows — Command Prompt): `cmd.exe` mendukung `<` seperti bash, jadi ketujuh baris `mysql -u root -p < 0X_*.sql` di atas bisa dipakai langsung tanpa perubahan.

Verifikasi:

```sql
USE pustarasa;
SHOW TABLES;                 -- 13 tabel (11 inti + Log_Perubahan_Alamat + app_account)
SHOW FUNCTION STATUS WHERE Db = 'pustarasa';   -- 8 baris
SHOW PROCEDURE STATUS WHERE Db = 'pustarasa';  -- 3 baris
SHOW TRIGGERS;                                  -- 14 baris
SELECT COUNT(*) FROM information_schema.VIEWS WHERE TABLE_SCHEMA='pustarasa';  -- 20
```

Untuk **menampilkan & menguji trigger** lebih lengkap, lihat bagian "Menampilkan Trigger" di `README.md`.

## 3. Menjalankan Backend

```bash
cd backend
cp .env.example .env          # lalu sesuaikan kredensial MySQL
npm install
npm run dev                   # mode pengembangan (auto-reload), atau: npm start
```

> Windows: ganti `cp .env.example .env` dengan `copy .env.example .env` (Command Prompt) atau `Copy-Item .env.example .env` (PowerShell). Sisa perintah (`npm install`, `npm run dev`) sama persis.

Variabel `.env` penting:

```
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=          # isi sesuai MySQL Anda
DB_NAME=pustarasa
JWT_SECRET=ganti-dengan-string-acak-panjang
PORT=4000
```

Backend berjalan di `http://localhost:4000`. Cek kesehatan: buka `http://localhost:4000/health`.

Jika perlu membuat ulang akun login (mis. reset sandi) tanpa menjalankan SQL:

```bash
npm run seed:accounts
```

## 4. Menjalankan Frontend

```bash
cd frontend
cp .env.example .env          # default sudah benar (VITE_API_BASE=/api)
npm install
npm run dev
```

> Windows: ganti `cp` dengan `copy .env.example .env` (Command Prompt) atau `Copy-Item .env.example .env` (PowerShell).

Frontend berjalan di `http://localhost:5173`. Permintaan `/api/*` otomatis diteruskan (proxy) ke backend `:4000`, jadi tidak ada masalah CORS saat pengembangan.

## 5. Akun Default

| Username | Kata sandi | Peran | Akses |
|---|---|---|---|
| `admin` | `admin123` | Administrator | Semua modul |
| `pustakawan` | `staff123` | Pustakawan | Perpustakaan, pengunjung, kunjungan, laporan |
| `penjual` | `staff123` | Penjual Kantin | Kantin, kasir, pengunjung, kunjungan, laporan |
| `pengunjung` | `lihat123` | Pengunjung | **Lihat-saja**: katalog buku, menu, dasbor, laporan |

> **Ganti kata sandi ini sebelum dipakai di lingkungan nyata.** Hash disimpan dengan bcrypt; akun bukan bagian dari ERD asli (lihat `DATABASE.md` → Asumsi).

## 6. Build Produksi (opsional)

```bash
# Frontend
cd frontend && npm run build      # hasil di frontend/dist

# Backend
cd backend && npm start           # NODE_ENV=production disarankan
```

Sajikan isi `frontend/dist` lewat web server statis, dan arahkan `VITE_API_BASE` (atau reverse proxy) ke host backend.

## 7. Pemecahan Masalah

| Gejala | Penyebab umum | Solusi |
|---|---|---|
| `ER_ACCESS_DENIED_ERROR` saat start backend | Kredensial `.env` salah | Sesuaikan `DB_USER` / `DB_PASSWORD` |
| `Unknown database 'pustarasa'` | Skrip belum dijalankan | Jalankan `01_schema.sql` lebih dulu |
| Login gagal terus | `07_seed_accounts.sql` belum dijalankan | Jalankan skrip akun, atau `npm run seed:accounts` |
| `This function has none of DETERMINISTIC…` saat impor | Variabel `log_bin_trust_function_creators` mati | Sudah ditangani: fungsi dideklarasikan `READS SQL DATA` (lihat DATABASE.md) |
| Frontend tak bisa memuat data | Backend belum jalan / port beda | Pastikan backend di `:4000` |
| `The '<' operator is reserved for future use` (Windows) | PowerShell tak mendukung redirection `<` | Pakai `Get-Content file.sql \| mysql -u root -p`, atau jalankan dari Command Prompt (cmd.exe) yang mendukung `<` |
