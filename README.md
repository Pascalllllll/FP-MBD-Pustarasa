# PustaRasa

Sistem informasi terpadu **Perpustakaan + Kantin PustaRasa**. Seluruh logika bisnis berada di dalam basis data (14 trigger, 8 function, 3 procedure, 20 view) dan dipanggil oleh aplikasi — bukan ditiru di kode.

**Stack:** MySQL 8 · Node/Express · React + Vite + Tailwind.

---

## Setup Cepat

Butuh **MySQL 8** dan **Node.js 18+**. Berlaku untuk Linux, macOS, dan Windows.

### Opsi A — Otomatis

```bash
npm run setup   # instal dependensi backend+frontend & impor basis data (akan minta sandi MySQL bila perlu)
npm run dev     # jalankan backend (:4000) & frontend (:5173) sekaligus
```

Kedua perintah ini lewat Node.js sepenuhnya, jadi identik di Windows (cmd/PowerShell), macOS, dan Linux — tidak perlu langkah tambahan. `npm run setup` aman dijalankan ulang: jika basis data `pustarasa` sudah ada, impor akan dilewati. Untuk memuat ulang dari nol (timpa data): `npm run db:reset`.

### Opsi B — Manual (tiga langkah)

#### 1. Basis data — jalankan 7 file SQL berurutan

**Linux/macOS (bash/zsh):**
```bash
cd database
for f in 0*.sql; do mysql -u root -p < "$f" || break; done
```

**Windows — Command Prompt:** sintaks di atas (`mysql -u root -p < file.sql`) berfungsi sama persis, cukup jalankan ketujuh baris satu per satu (lihat tabel di `docs/SETUP.md`).

**Windows — PowerShell:** `<` redirection tidak didukung, gunakan pipe:
```powershell
cd database
Get-ChildItem -Filter "0*.sql" | Sort-Object Name | ForEach-Object { Get-Content $_.FullName | mysql -u root -p }
```

> Urutan **wajib** 01 → 07. Data contoh (`05`) sengaja dimuat **sebelum** trigger (`06`) agar trigger tidak ikut memvalidasi data lama.

| # | File | Isi |
|---|------|-----|
| 01 | `01_schema.sql` | 11 tabel inti + 2 tabel app (login & log alamat) |
| 02 | `02_functions.sql` | 8 function (`sf_*`) |
| 03 | `03_procedures.sql` | 3 procedure (`sp_*`) |
| 04 | `04_views.sql` | 20 view (`vw_*`) |
| 05 | `05_seed_data.sql` | **data contoh dari file SQL Anda** |
| 06 | `06_triggers.sql` | 14 trigger |
| 07 | `07_seed_accounts.sql` | akun login |

#### 2. Backend

```bash
cd backend
cp .env.example .env      # isi DB_PASSWORD sesuai MySQL Anda
npm install
npm run dev               # http://localhost:4000
```

> Windows: ganti `cp` dengan `copy .env.example .env` (Command Prompt) atau `Copy-Item .env.example .env` (PowerShell).

#### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev               # http://localhost:5173
```

> Windows: sama seperti langkah Backend di atas — pakai `copy` atau `Copy-Item`.

Buka **http://localhost:5173** lalu login.

---

## Akun Login

| Username | Sandi | Peran | Akses |
|---|---|---|---|
| `admin` | `admin123` | Administrator | Semua |
| `pustakawan` | `staff123` | Pustakawan | Perpustakaan, pengunjung, kunjungan, laporan |
| `penjual` | `staff123` | Penjual | Kantin, kasir, pengunjung, kunjungan, laporan |
| `pengunjung` | `lihat123` | Pengunjung | **Lihat-saja**: katalog, menu, dasbor, laporan |

Mode **pengunjung** hanya bisa melihat (tidak ada tombol tambah/ubah/hapus, semua aksi tulis ditolak backend).

---

## Pemetaan Function, Procedure, Trigger, dan View → Fitur

Setiap objek basis data benar-benar dipanggil oleh backend (lihat `backend/src/repositories/*.js`) — tidak ada yang dibuat tapi tidak dipakai. Detail tanda tangan & perilaku lengkap ada di [`docs/DATABASE.md`](docs/DATABASE.md); tabel di bawah ini fokus ke **dipakai di mana**.

### Function (8)

| Function | Dipanggil dari (repository) | Dipakai di fitur |
|---|---|---|
| `sf_cek_ketersediaan_buku` | `book.repository.js` | **Katalog Buku** → modal detail buku |
| `sf_rekomendasi_buku` | `book.repository.js` | **Katalog Buku** → modal detail, bagian "Rekomendasi genre serupa" |
| `sf_hitung_denda_peminjaman` | `borrowing.repository.js` | **Peminjaman** (kolom denda) & hasil **Pengembalian** |
| `sf_hitung_total_pemesanan` | `order.repository.js` | **Kasir & Pesanan** (daftar & detail, kolom total) |
| `sf_total_pengeluaran_pengunjung` | `visitor.repository.js` | **Pengunjung** → drawer profil |
| `sf_total_denda_pengunjung` | `visitor.repository.js` | **Pengunjung** → drawer profil |
| `sf_cek_status_keanggotaan` | `visitor.repository.js` | **Pengunjung** → badge status (Aktif/Tidak Aktif) |
| `sf_durasi_kunjungan_rata_rata` | `visitor.repository.js` | **Pengunjung** → drawer profil |

### Procedure (3)

| Procedure | Dipanggil dari | Dipakai di fitur |
|---|---|---|
| `sp_checkout_pesanan` | `order.repository.js` → `order.service.checkout` | **Kasir & Pesanan** → tombol "Proses Pesanan" (transaksional, snapshot harga per item) |
| `sp_pengembalian_buku` | `borrowing.repository.js` → `borrowing.service` | **Pengembalian** → "Konfirmasi Pengembalian" |
| `sp_rekap_harian` | `report.repository.js` | **Dasbor** (kartu Rekap Harian) & **Laporan** (pemilih tanggal) |

### Trigger (14)

| Trigger | Waktu/Tabel | Dipakai di fitur |
|---|---|---|
| `trg_update_buku_dipinjam` | AFTER INSERT · Detail_Peminjaman | Otomatis saat membuat **Peminjaman** — status buku jadi "Dipinjam" |
| `trg_update_buku_dikembalikan` | AFTER UPDATE · Detail_Peminjaman | Otomatis saat **Pengembalian** — status buku jadi "Tidak Dipinjam" |
| `trg_validasi_makanan_habis` | BEFORE INSERT · Detail_Pemesanan | Menjaga **Kasir** — menu "Habis" tetap bisa dipilih di UI, ditolak saat checkout |
| `trg_validasi_kuantitas_pesanan` | BEFORE INSERT · Detail_Pemesanan | Menjaga **Kasir** — kuantitas ≤ 0 tetap bisa diketik di keranjang, ditolak saat checkout |
| `trg_validasi_buku_sedang_dipinjam` | BEFORE INSERT · Detail_Peminjaman | Menjaga **Peminjaman** — buku "Sedang Dipinjam" tetap muncul di pemilih, ditolak saat disimpan |
| `trg_validasi_batas_kembali` | BEFORE INSERT · Peminjaman | Menjaga **Peminjaman** (batas kembali harus setelah tgl pinjam) |
| `trg_validasi_waktu_kunjung` | BEFORE INSERT · Waktu_kunjung | Menjaga **Buku Tamu** saat check-in (Waktu_Keluar di-set sekaligus) |
| `trg_validasi_waktu_kunjung_update` | BEFORE UPDATE · Waktu_kunjung | Menjaga **Buku Tamu** saat check-out manual (lihat catatan di bawah) |
| `trg_validasi_umur_pustakawan` | BEFORE INSERT · Pustakawan | Menjaga **Pustakawan** saat membuat data baru (usia ≥ 18 th) |
| `trg_validasi_umur_pustakawan_update` | BEFORE UPDATE · Pustakawan | Menjaga **Pustakawan** saat mengubah tanggal lahir data yang sudah ada |
| `trg_validasi_email_pengunjung` | BEFORE INSERT · Pengunjung | Menjaga **Pengunjung** saat membuat data baru (format email) |
| `trg_validasi_email_pengunjung_update` | BEFORE UPDATE · Pengunjung | Menjaga **Pengunjung** saat mengubah email data yang sudah ada |
| `trg_validasi_update_nik` | BEFORE UPDATE · Pengunjung | Menjaga **Pengunjung** — NIK tak bisa diubah, **kecuali oleh peran `admin`** |
| `trg_log_perubahan_alamat` | AFTER UPDATE · Pengunjung | Mengisi log → tampil di **Pengunjung** (riwayat alamat) |

Setiap trigger yang menolak aksi (SIGNAL SQLSTATE 45000) otomatis memunculkan **pop-up notifikasi** di kanan-atas layar (lihat `frontend/src/lib/toast.js` + `errorHandler.js`), bukan cuma pesan error inline. Semua trigger validasi di atas benar-benar bisa dipicu lewat web — UI sengaja **tidak** menyembunyikan pilihan yang akan ditolak (menu habis, buku sedang dipinjam, dst.) supaya trigger-nya, bukan kode aplikasi, yang memutuskan.

> **Mengapa ada `_update` terpisah untuk waktu_kunjung/umur_pustakawan/email_pengunjung?** Tiga trigger ini awalnya hanya `BEFORE INSERT`, sehingga tidak pernah aktif saat data yang **sudah ada** diubah lewat web — check-out memakai `UPDATE`, begitu juga edit tanggal lahir pustakawan atau edit email pengunjung. Trigger pendamping `BEFORE UPDATE` dengan logika identik ditambahkan agar aturan benar-benar berlaku di kedua jalur, bukan cuma saat data baru dibuat.

> **Mengapa `trg_validasi_update_nik` bisa membedakan admin?** Backend memakai satu pool koneksi MySQL bersama untuk semua peran, jadi trigger tidak otomatis tahu siapa pemanggilnya. Untuk itu, tepat sebelum `UPDATE Pengunjung`, backend menjalankan `SET @app_role = '<peran>'` pada koneksi yang sama (`visitor.repository.js`), dan trigger membaca variabel sesi ini sebelum memutuskan SIGNAL atau tidak. Keputusan izin tetap berada **di dalam trigger** — aplikasi hanya melapor konteks peran, tidak meniru aturannya. Karena semua FK ke `Pengunjung.NIK_k` memakai `ON UPDATE CASCADE`, perubahan NIK oleh admin otomatis merambat ke `Waktu_kunjung`, `Peminjaman`, `Pemesanan`, dan `Log_Perubahan_Alamat`.

### View (20)

Semua diakses lewat endpoint generik `/api/laporan/:slug` dan dirender di halaman **Laporan** (`frontend/src/pages/Reports.jsx`); dua di antaranya juga dipakai langsung di halaman lain.

| View | Dipakai di fitur |
|---|---|
| `vw_status_buku` | **Laporan** › Status Semua Buku |
| `vw_buku_terpopuler` | **Laporan** › Buku Terpopuler |
| `vw_peminjaman_harian` | **Laporan** › Peminjaman per Hari |
| `vw_buku_per_pengunjung` | **Laporan** › Riwayat Pinjam per Pengunjung |
| `vw_buku_belum_kembali` | **Pengembalian** (daftar utama, via `borrowing.repository.js`) **+ Laporan** |
| `vw_performa_pustakawan` | **Laporan** › Performa Pustakawan |
| `vw_peminjaman_tanpa_kunjungan` | **Laporan** › Peminjaman Tanpa Kunjungan |
| `vw_pengunjung_belum_meminjam` | **Laporan** › Pengunjung Belum Meminjam |
| `vw_buku_terbaru` | **Laporan** › Buku Terbaru |
| `vw_kunjungan_harian` | **Laporan** › Kunjungan per Hari |
| `vw_jam_ramai` | **Laporan** › Jam Ramai |
| `vw_pengunjung_tanpa_pemesanan` | **Laporan** › Pengunjung Tanpa Pemesanan |
| `vw_status_makanan` | **Laporan** › Status Ketersediaan Makanan |
| `vw_makanan_favorit` | **Laporan** › Makanan Favorit |
| `vw_penjualan_per_jenis` | **Laporan** › Penjualan per Jenis |
| `vw_penjualan_harian` | **Laporan** › Penjualan per Hari |
| `vw_penjualan_per_penjual` | **Laporan** › Penjualan per Penjual |
| `vw_penjualan_per_metode` | **Laporan** › Penjualan per Metode Bayar |
| `vw_makanan_belum_dipesan` | **Laporan** › Makanan Belum Pernah Dipesan |
| `vw_makanan_diatas_rata` | **Laporan** › Makanan di Atas Harga Rata-rata |

---

## Panduan Memicu Pop-up Trigger Lewat Web

Setiap langkah di bawah ini sengaja memilih input yang **akan ditolak**, supaya pop-up oranye berjudul "DITOLAK OLEH TRIGGER BASIS DATA" muncul di kanan-atas layar. UI tidak menyembunyikan pilihan tersebut (menu habis, buku sedang dipinjam, dst.) — ditolak betul-betul oleh trigger di MySQL, bukan oleh kode aplikasi.

### Kasir & Pesanan

**`trg_validasi_makanan_habis`**
- Akun: `admin` atau `penjual`
- Langkah: Jika belum ada menu berstatus Habis, buka **Menu Makanan** → **Ubah** salah satu menu → set "Status Ketersediaan" ke `Habis` → **Simpan**. Lalu buka **Kasir & Pesanan**, klik menu yang bertanda merah "Habis" untuk memasukkannya ke keranjang, pilih Pengunjung/Penjual/Metode Pembayaran, klik **Proses Pesanan**.
- Hasil: *"Kesalahan: Makanan/Minuman ini sedang habis dan tidak dapat dipesan!"*

**`trg_validasi_kuantitas_pesanan`**
- Akun: `admin` atau `penjual`
- Langkah: Di **Kasir & Pesanan**, tambahkan menu apa saja ke keranjang, lalu ubah kolom kuantitas di keranjang menjadi `0` (atau klik tombol "−" sampai 0). Lengkapi Pengunjung/Penjual/Metode Pembayaran, klik **Proses Pesanan**.
- Hasil: *"Kesalahan: Kuantitas item yang dipesan minimal harus 1!"*

### Peminjaman

**`trg_validasi_buku_sedang_dipinjam`**
- Akun: `admin` atau `pustakawan`
- Langkah: Buka **Peminjaman** → **Pinjam Buku**. Di "Tambah Buku", pilih buku yang labelnya berakhiran "— Sedang Dipinjam". Lengkapi Pengunjung & Pustakawan Petugas, klik **Pinjamkan**.
- Hasil: *"Kesalahan: Buku ini sedang dipinjam oleh pengunjung lain!"*

**`trg_validasi_batas_kembali`**
- Akun: `admin` atau `pustakawan`
- Langkah: Di form **Pinjam Buku** yang sama, set "Batas Kembali" ke tanggal yang **sama atau lebih awal** dari "Tanggal Pinjam". Pilih satu buku tersedia, klik **Pinjamkan**.
- Hasil: *"Kesalahan: Batas waktu pengembalian harus diset setelah tanggal peminjaman!"*

### Buku Tamu

**`trg_validasi_waktu_kunjung_update`** (jalur check-out — lihat catatan di bawah untuk versi INSERT-nya)
- Akun: `admin`, `pustakawan`, atau `penjual`
- Langkah: Buka **Buku Tamu** → **Check-in**. Isi NIK pengunjung, lalu isi "Waktu Masuk (opsional)" dengan waktu di **masa depan**, mis. besok 10:00 → **Catat Masuk**. Pada baris yang baru dibuat, klik **Check-out**, isi "Waktu Keluar (opsional)" dengan waktu **sebelum** waktu masuk tadi, mis. besok 09:00 → **Catat Keluar**.
- Hasil: *"Kesalahan: Waktu keluar tidak boleh lebih awal daripada waktu masuk!"*

### Pustakawan (khusus admin)

**`trg_validasi_umur_pustakawan`** (data baru)
- Akun: `admin`
- Langkah: Buka **Pustakawan** → **Tambah**. Isi NIK, Nama, Jadwal Shift, dan "Tanggal Lahir" dengan tanggal yang membuat usia **< 18 tahun** (mis. 10 tahun lalu). **Simpan**.
- Hasil: *"Kesalahan: Umur pustakawan tidak boleh kurang dari 18 tahun!"*

**`trg_validasi_umur_pustakawan_update`** (data lama)
- Akun: `admin`
- Langkah: Di **Pustakawan**, klik **Ubah** pada data yang sudah ada, ubah "Tanggal Lahir" menjadi tanggal yang membuat usia < 18 tahun. **Simpan**.
- Hasil: sama seperti di atas.

### Pengunjung

**`trg_validasi_email_pengunjung`** (data baru)
- Akun: `admin`, `pustakawan`, atau `penjual`
- Langkah: Buka **Pengunjung** → **Tambah**. Isi NIK & Nama, lalu isi Email dengan teks yang **tidak** memuat `@` dan `.` sekaligus, misalnya `abc@def` (tanpa titik). **Simpan**.
- Hasil: *"Kesalahan: Format penulisan alamat email pengunjung tidak valid!"*

**`trg_validasi_email_pengunjung_update`** (data lama)
- Akun: sama
- Langkah: Klik **Ubah** pada pengunjung yang sudah ada, ubah Email menjadi format yang sama tidak validnya. **Simpan**.
- Hasil: sama seperti di atas.

**`trg_validasi_update_nik`**
- Akun untuk **menguji penolakan**: `pustakawan` atau `penjual`. Akun untuk **menguji keberhasilan**: `admin`.
- Langkah: Buka **Pengunjung** → klik **Ubah** pada salah satu data → ubah isi field NIK menjadi 16 digit lain → **Simpan**.
- Hasil sebagai `pustakawan`/`penjual`: *"Kesalahan: NIK Pengunjung tidak boleh diubah! Hanya admin yang dapat mengubah NIK (mis. memperbaiki salah input)."* Hasil sebagai `admin`: tersimpan tanpa pop-up — NIK benar-benar berubah, dan semua data terkait (kunjungan, peminjaman, pemesanan) ikut mengikuti otomatis (`ON UPDATE CASCADE`).

### Trigger otomatis (tanpa pop-up — bekerja diam-diam)

Tiga trigger ini tidak pernah menolak apa pun, jadi tidak ada pop-up. Cara memverifikasinya adalah dengan melihat efeknya:

| Trigger | Cara melihat efeknya |
|---|---|
| `trg_update_buku_dipinjam` | Pinjam sebuah buku lewat **Peminjaman**, lalu cek **Katalog Buku** — status buku itu otomatis berubah jadi "Dipinjam". |
| `trg_update_buku_dikembalikan` | Konfirmasi pengembalian buku tersebut lewat **Pengembalian** — status di **Katalog Buku** otomatis kembali "Tidak Dipinjam". |
| `trg_log_perubahan_alamat` | Ubah field Alamat pada **Pengunjung**, lalu klik nama pengunjung tersebut untuk membuka drawer profil — perubahan alamat lama→baru tercatat di "Riwayat Perubahan Alamat". |

> **Catatan soal `trg_validasi_waktu_kunjung` (versi INSERT, bukan `_update`).** Trigger ini hanya bisa dipicu oleh `INSERT` yang sudah menyertakan `Waktu_Keluar_wk` sejak baris dibuat — tapi jalur check-in di web selalu menyisipkan baris dengan `Waktu_Keluar_wk = NULL` (diisi belakangan saat check-out, lewat `UPDATE`). Karena itu versi INSERT ini **tidak bisa** dipicu dari web sama sekali; yang bisa dipicu dari web adalah pasangannya, `trg_validasi_waktu_kunjung_update`, di atas. Untuk menguji versi INSERT-nya, jalankan langsung lewat `mysql` CLI seperti contoh di bagian "Menampilkan Trigger" di bawah.

---

## Menampilkan Trigger (dan objek lain)

Setelah basis data dimuat, jalankan di MySQL:

```sql
USE pustarasa;

-- Daftar semua trigger
SHOW TRIGGERS;

-- Atau ringkas dari information_schema
SELECT TRIGGER_NAME, EVENT_MANIPULATION AS event, EVENT_OBJECT_TABLE AS tabel, ACTION_TIMING AS timing
FROM information_schema.TRIGGERS
WHERE TRIGGER_SCHEMA = 'pustarasa'
ORDER BY tabel, timing;

-- Lihat isi satu trigger
SHOW CREATE TRIGGER trg_update_buku_dipinjam\G

-- Objek lain
SHOW FUNCTION STATUS  WHERE Db = 'pustarasa';   -- 8 function
SHOW PROCEDURE STATUS WHERE Db = 'pustarasa';   -- 3 procedure
SHOW FULL TABLES IN pustarasa WHERE Table_type = 'VIEW';  -- 20 view
```

### Melihat & Menguji Function

```sql
-- Daftar singkat kedelapan function (nama, tipe, dll.)
SHOW FUNCTION STATUS WHERE Db = 'pustarasa';

-- Lihat definisi/isi lengkap (body) satu function
SHOW CREATE FUNCTION sf_hitung_denda_peminjaman\G

-- Panggil langsung lewat SELECT untuk melihat hasilnya (ganti ID sesuai data Anda)
SELECT sf_cek_ketersediaan_buku('B00001')            AS status_buku;
SELECT sf_hitung_total_pemesanan('PS0001')           AS total_pesanan;
SELECT sf_cek_status_keanggotaan('1234567890123456') AS status_keanggotaan;
```

Daftar lengkap kedelapan function ada di tabel **Function (8)** di atas; signature, parameter, dan deskripsi lengkap tiap function ada di [`docs/DATABASE.md`](docs/DATABASE.md) §2.

**Mencoba trigger bekerja** (contoh — masing-masing akan ditolak dengan pesan Bahasa Indonesia):

```sql
-- Pinjam buku yang sedang dipinjam → ditolak trg_validasi_buku_sedang_dipinjam
INSERT INTO Detail_Peminjaman VALUES ('DPX001', NULL, 2000, 'PM0001', 'B00001');

-- Ubah NIK pengunjung → ditolak trg_validasi_update_nik (kecuali peran admin — lihat "Pemetaan ... → Fitur" di atas)
UPDATE Pengunjung SET NIK_k = '0000000000000000' WHERE NIK_k = '1234567890123456';

-- Pesan via kasir lalu buku otomatis berubah status (trigger trg_update_buku_*)
```

Penjelasan lengkap tiap objek dan pemetaannya ke fitur ada di [`docs/DATABASE.md`](docs/DATABASE.md). Panduan pemakaian per peran ada di [`docs/USER_GUIDE.md`](docs/USER_GUIDE.md).
