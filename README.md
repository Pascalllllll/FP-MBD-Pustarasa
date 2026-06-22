# PustaRasa

Sistem informasi terpadu **Perpustakaan + Kantin PustaRasa**. Seluruh logika bisnis berada di dalam basis data (13 trigger, 8 function, 3 procedure, 20 view) dan dipanggil oleh aplikasi — bukan ditiru di kode.

**Stack:** MySQL 8 · Node/Express · React + Vite + Tailwind.

## Daftar Isi

1. [Setup Cepat](#setup-cepat)
2. [Akun Login](#akun-login)
3. [Objek Basis Data](#objek-basis-data)
4. [Menguji Trigger Lewat Web](#menguji-trigger-lewat-web)
5. [Eksplorasi Database (Opsional)](#eksplorasi-database-opsional)
6. [Dokumentasi Lengkap](#dokumentasi-lengkap)

---

## Setup Cepat

Butuh **MySQL 8** dan **Node.js 18+** — berlaku sama di Linux, macOS, dan Windows.

```bash
npm run setup   # instal dependensi backend+frontend & impor basis data
npm run dev     # jalankan backend (:4000) & frontend (:5173) sekaligus
```

Kedua perintah berjalan lewat Node.js sepenuhnya, jadi tidak ada langkah tambahan untuk Windows. `npm run setup` aman dijalankan ulang — bila basis data `pustarasa` sudah ada, impor dilewati. Untuk memuat ulang dari nol: `npm run db:reset`.

Lalu buka **http://localhost:5173** dan login.

> Butuh instalasi manual langkah-demi-langkah (termasuk perintah khusus Windows/PowerShell, variabel `.env`, dan build produksi)? Lihat [`docs/SETUP.md`](docs/SETUP.md).

---

## Akun Login

| Username | Sandi | Peran | Akses |
|---|---|---|---|
| `admin` | `admin123` | Administrator | Semua |
| `pustakawan` | `staff123` | Pustakawan | Perpustakaan, pengunjung, kunjungan, laporan |
| `penjual` | `staff123` | Penjual | Kantin, kasir, pengunjung, kunjungan, laporan |
| `pengunjung` | `lihat123` | Pengunjung | **Lihat-saja**: katalog, menu, dasbor, laporan |

Mode **pengunjung** hanya bisa melihat — tidak ada tombol tambah/ubah/hapus, dan setiap aksi tulis ditolak di backend.

---

## Objek Basis Data

Setiap function, procedure, trigger, dan view di bawah ini benar-benar dipanggil oleh backend (lihat `backend/src/repositories/*.js`) — tidak ada yang dibuat tapi tidak dipakai. Signature, parameter, dan rincian perilaku lengkap ada di [`docs/DATABASE.md`](docs/DATABASE.md).

Selain PK/FK (yang otomatis terindeks InnoDB), ada 2 index tambahan: `idx_dp_kembali` (`Detail_Peminjaman.Waktu_Kembali_dpm`, dipakai query/​view "buku belum kembali") dan `idx_makanan_harga` (`Makanan.Harga_mk`, dipakai query "makanan di atas harga rata-rata").

### Function (8)

| Function | Dipakai di |
|---|---|
| `sf_cek_ketersediaan_buku` | Katalog Buku → detail buku |
| `sf_rekomendasi_buku` | Katalog Buku → rekomendasi genre serupa |
| `sf_hitung_denda_peminjaman` | Peminjaman & Pengembalian → kolom denda |
| `sf_hitung_total_pemesanan` | Kasir & Pesanan → kolom total |
| `sf_total_pengeluaran_pengunjung` | Pengunjung → drawer profil |
| `sf_total_denda_pengunjung` | Pengunjung → drawer profil |
| `sf_cek_status_pengunjung` | Pengunjung → badge status |
| `sf_durasi_kunjungan_rata_rata` | Pengunjung → drawer profil |

Kedelapannya juga bisa dipanggil bebas dengan parameter sendiri lewat halaman **Uji Function** di sidebar (semua peran, termasuk `pengunjung` — murni baca data).

### Procedure (3)

| Procedure | Dipakai di |
|---|---|
| `sp_checkout_pesanan` | Kasir & Pesanan → "Proses Pesanan" (versi rekan satu tim — bikin header; item & validasi trigger ditangani backend dalam transaksi yang sama) |
| `sp_pengembalian_buku` | Pengembalian → "Konfirmasi Pengembalian" |
| `sp_rekap_harian` | Dasbor & Laporan → kartu Rekap Harian |

Ketiganya juga bisa dipanggil bebas lewat halaman **Uji Procedure** (admin) — objek yang sama persis, bukan salinan.

### Trigger (13)

| Trigger | Dipakai di |
|---|---|
| `trg_update_buku_dipinjam` | Otomatis saat **Peminjaman** dibuat — status buku jadi "Dipinjam" |
| `trg_update_buku_dikembalikan` | Otomatis saat **Pengembalian** — status buku jadi "Tidak Dipinjam" |
| `trg_validasi_makanan_habis` | **Kasir** — tolak menu berstatus "Habis" |
| `trg_validasi_kuantitas_pesanan` | **Kasir** — tolak kuantitas ≤ 0 |
| `trg_validasi_buku_sedang_dipinjam` | **Peminjaman** — tolak buku yang sedang dipinjam |
| `trg_validasi_batas_kembali` | **Peminjaman** — batas kembali harus setelah tgl pinjam |
| `trg_validasi_waktu_kunjung` + `_update` | **Buku Tamu** — waktu keluar tak boleh sebelum waktu masuk |
| `trg_validasi_umur_pustakawan` + `_update` | **Pustakawan** — usia minimal 18 tahun |
| `trg_validasi_email_pengunjung` + `_update` | **Pengunjung** — format email harus valid |
| `trg_validasi_update_nik` | **Pengunjung** — NIK terkunci, kecuali oleh peran `admin` |

Tiga aturan (waktu kunjung, umur pustakawan, email pengunjung) punya trigger kembar berakhiran `_update` agar aturannya tetap berlaku saat data lama diedit, tidak hanya saat dibuat baru — lihat [`docs/DATABASE.md`](docs/DATABASE.md) §4 untuk alasan lengkapnya.

Setiap trigger yang menolak aksi memunculkan **pop-up oranye** di kanan-atas layar (lihat `frontend/src/lib/toast.js`), bukan sekadar pesan error inline. UI sengaja **tidak** menyembunyikan pilihan yang akan ditolak (menu habis, buku sedang dipinjam, dst.) — keputusan tolak/terima benar-benar berasal dari trigger di MySQL, bukan dari kode aplikasi.

### View (20)

Semua diakses lewat endpoint generik `/api/laporan/:slug` dan dirender di halaman **Laporan**; dua di antaranya (`vw_buku_belum_kembali`) juga dipakai langsung di halaman **Pengembalian**.

- **Perpustakaan:** `vw_status_buku`, `vw_buku_terpopuler`, `vw_peminjaman_harian`, `vw_buku_per_pengunjung`, `vw_buku_belum_kembali`, `vw_performa_pustakawan`, `vw_peminjaman_tanpa_kunjungan`, `vw_pengunjung_belum_meminjam`, `vw_buku_terbaru`.
- **Kunjungan:** `vw_kunjungan_harian`, `vw_jam_ramai`, `vw_pengunjung_tanpa_pemesanan`.
- **Kantin:** `vw_status_makanan`, `vw_makanan_favorit`, `vw_penjualan_per_jenis`, `vw_penjualan_harian`, `vw_penjualan_per_penjual`, `vw_penjualan_per_metode`, `vw_makanan_belum_dipesan`, `vw_makanan_diatas_rata`.

---

## Menguji Trigger Lewat Web

Langkah-langkah berikut sengaja memilih input yang **akan ditolak**, supaya pop-up "DITOLAK OLEH TRIGGER BASIS DATA" muncul. Semua bisa dipicu sungguhan lewat web — bukan cuma lewat `mysql` CLI.

| Trigger | Akun | Cara memicu | Pesan yang muncul |
|---|---|---|---|
| `trg_validasi_makanan_habis` | admin / penjual | Menu Makanan → set salah satu menu ke "Habis" → Kasir & Pesanan → pilih menu itu → Proses Pesanan | "Makanan/Minuman ini sedang habis dan tidak dapat dipesan!" |
| `trg_validasi_kuantitas_pesanan` | admin / penjual | Kasir & Pesanan → tambah menu ke keranjang → set kuantitas ke 0 → Proses Pesanan | "Kuantitas item yang dipesan minimal harus 1!" |
| `trg_validasi_buku_sedang_dipinjam` | admin / pustakawan | Peminjaman → Pinjam Buku → pilih buku berlabel "Sedang Dipinjam" → Pinjamkan | "Buku ini sedang dipinjam oleh pengunjung lain!" |
| `trg_validasi_batas_kembali` | admin / pustakawan | Pinjam Buku → set Batas Kembali sama/sebelum Tanggal Pinjam → Pinjamkan | "Batas waktu pengembalian harus diset setelah tanggal peminjaman!" |
| `trg_validasi_waktu_kunjung_update` | admin / pustakawan / penjual | Buku Tamu → Check-in dengan waktu masuk besok → Check-out dengan waktu sebelum itu | "Waktu keluar tidak boleh lebih awal daripada waktu masuk!" |
| `trg_validasi_umur_pustakawan` (+`_update`) | admin | Pustakawan → Tambah/Ubah dengan Tanggal Lahir usia < 18 th | "Umur pustakawan tidak boleh kurang dari 18 tahun!" |
| `trg_validasi_email_pengunjung` (+`_update`) | admin / pustakawan / penjual | Pengunjung → Tambah/Ubah Email tanpa "@" dan "." sekaligus | "Format penulisan alamat email pengunjung tidak valid!" |
| `trg_validasi_update_nik` | pustakawan/penjual (ditolak) atau admin (berhasil) | Pengunjung → Ubah → ganti NIK | Ditolak: "NIK Pengunjung tidak boleh diubah!" — Admin: tersimpan, merambat otomatis ke data terkait |

Dua trigger lain bekerja diam-diam tanpa pop-up (tidak pernah menolak apa pun) — cek efeknya langsung: pinjam buku lewat **Peminjaman** lalu lihat status di **Katalog Buku** berubah jadi "Dipinjam" (`trg_update_buku_dipinjam`), dan konfirmasi **Pengembalian** untuk melihatnya kembali "Tidak Dipinjam" (`trg_update_buku_dikembalikan`).

> Satu trigger (`trg_validasi_waktu_kunjung`, versi `INSERT` murni) tidak bisa dipicu lewat web karena jalur check-in selalu menyisipkan `Waktu_Keluar_wk = NULL` — yang aktif lewat web adalah pasangannya, `trg_validasi_waktu_kunjung_update`, di atas. Untuk menguji versi `INSERT`-nya, gunakan halaman **Uji Trigger** di bawah, atau jalankan langsung lewat `mysql` CLI.

Halaman **Uji Trigger** (khusus `admin`) menjalankan ke-13 trigger di atas secara nyata — `INSERT`/`UPDATE` sungguhan ke tabel terkait — lalu selalu **ROLLBACK** apa pun hasilnya, jadi tidak ada data yang berubah permanen meski trigger menerima operasinya.

---

## Eksplorasi Database (Opsional)

**Lewat web:** tiga halaman di sidebar, urut sesuai kompleksitasnya — **Uji Function** (semua peran, baca-saja), **Uji Procedure** (admin, operasi sungguhan), **Uji Trigger** (admin, `INSERT`/`UPDATE` sungguhan + auto-rollback). Tiap objek tampil sebagai kartu dengan input parameter dan tombol **Jalankan**.

**Lewat `mysql` CLI:**

```sql
USE pustarasa;

SHOW TRIGGERS;
SHOW CREATE TRIGGER trg_update_buku_dipinjam\G

SHOW FUNCTION STATUS  WHERE Db = 'pustarasa';
SHOW PROCEDURE STATUS WHERE Db = 'pustarasa';
SHOW FULL TABLES IN pustarasa WHERE Table_type = 'VIEW';

SELECT sf_cek_ketersediaan_buku('B00001');
SELECT sf_hitung_total_pemesanan('PS0001');
SELECT sf_cek_status_pengunjung('1234567890123456');
```

---

## Dokumentasi Lengkap

| Dokumen | Isi |
|---|---|
| [`docs/SETUP.md`](docs/SETUP.md) | Instalasi manual langkah-demi-langkah, variabel `.env`, build produksi, pemecahan masalah |
| [`docs/DATABASE.md`](docs/DATABASE.md) | Skema tabel & relasi, signature lengkap tiap function/procedure/trigger/view, asumsi & penyesuaian dari sumber asli |
| [`docs/USER_GUIDE.md`](docs/USER_GUIDE.md) | Panduan pemakaian aplikasi per peran |
| [`docs/CONTOH_UJI_COBA.md`](docs/CONTOH_UJI_COBA.md) | Contoh input + ekspektasi output terverifikasi untuk Uji Function, Uji Procedure, dan Uji Trigger |
