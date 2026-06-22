# Dokumentasi Basis Data — PustaRasa

Basis data `pustarasa` memodelkan sebuah ruang baca yang menggabungkan **perpustakaan** (sirkulasi buku) dan **kantin** (pemesanan makanan), beserta pencatatan **kunjungan**. Logika bisnis sengaja diletakkan **di dalam basis data** (trigger, function, procedure, view) sehingga aplikasi tidak pernah melewati aturan tersebut — backend memanggil objek-objek ini, bukan menduplikasi logikanya.

---

## 1. Tabel & Relasi

### Tabel inti (sesuai ERD)

| Tabel | PK | Ringkasan |
|---|---|---|
| `Pengunjung` | `NIK_k` CHAR(16) | Anggota/pengunjung |
| `Pustakawan` | `NIK_pt` CHAR(16) | Petugas perpustakaan (punya shift) |
| `Penjual` | `NIK_pj` CHAR(16) | Petugas kantin |
| `Buku` | `ID_b` CHAR(6) | Koleksi; `Keterangan_b` = flag sirkulasi (Dipinjam / Tidak Dipinjam) |
| `Makanan` | `ID_mk` CHAR(6) | Menu; `Status_Ketersediaan_mk` = Ada / Habis; `Penjual_NIK_pj` = pemilik menu (FK → `Penjual`) |
| `Metode_pembayaran` | `ID_mp` CHAR(6) | Cara bayar kantin |
| `Waktu_kunjung` | `ID_wk` CHAR(6) | Sesi kunjungan (masuk/keluar) |
| `Peminjaman` | `ID_pm` CHAR(6) | Header transaksi pinjam |
| `Detail_Peminjaman` | `ID_dpm` CHAR(6) | Baris per buku; menyimpan denda/hari & tanggal kembali |
| `Pemesanan` | `ID_ps` CHAR(6) | Header transaksi pesan |
| `Detail_Pemesanan` | `ID_dps` CHAR(6) | Baris per item; menyimpan **snapshot** harga satuan |

### Tabel tambahan (di luar ERD — lihat Asumsi)

| Tabel | Fungsi |
|---|---|
| `app_account` | Akun login aplikasi (username, hash bcrypt, peran, tautan ke NIK staf). Peran: `admin`, `pustakawan`, `penjual`, dan `pengunjung` (mode lihat-saja) |

### Relasi (foreign key)

```
Pengunjung 1───∞ Waktu_kunjung
Pengunjung 1───∞ Peminjaman ∞───1 Pustakawan
Peminjaman 1───∞ Detail_Peminjaman ∞───1 Buku
Penjual    1───∞ Makanan
Pengunjung 1───∞ Pemesanan ∞───1 Penjual
Pemesanan  ∞───1 Metode_pembayaran
Pemesanan  1───∞ Detail_Pemesanan ∞───1 Makanan
```

Konvensi kunci bisnis: `Buku` = `B` + 5 digit (B00001); tabel lain = 2 huruf + 4 digit (`PM0001`, `DS0007`, …). `NIK` = 16 digit. ID transaksi dibuat berurutan oleh `MAX(...)+1` di dalam transaksi (lihat `idGenerator.js` dan prosedur).

---

## 2. Stored Functions (8)

Semua dideklarasikan `NOT DETERMINISTIC READS SQL DATA` karena membaca tabel.

| Fungsi | Mengembalikan | Kegunaan |
|---|---|---|
| `sf_cek_ketersediaan_buku(id_b)` | VARCHAR | Status pinjam buku ("Tersedia"/"Sedang Dipinjam") dari flag sirkulasi |
| `sf_total_pengeluaran_pengunjung(nik)` | DECIMAL | Total belanja kantin seumur hidup pengunjung |
| `sf_hitung_denda_peminjaman(id_dpm)` | DECIMAL | Denda satu baris pinjam = hari telat × denda/hari |
| `sf_hitung_total_pemesanan(id_ps)` | DECIMAL | Total satu pesanan = Σ(kuantitas × harga satuan) |
| `sf_cek_status_pengunjung(nik)` | VARCHAR | "Terdaftar"/"Tidak Terdaftar" berdasarkan keberadaan NIK di tabel `Pengunjung` |
| `sf_total_denda_pengunjung(nik)` | DECIMAL | Akumulasi denda seluruh peminjaman pengunjung |
| `sf_rekomendasi_buku(jenis, judul_exclude)` | VARCHAR | Judul paling sering dipinjam pada genre sama, mengecualikan `judul_exclude` (buku itu sendiri) |
| `sf_durasi_kunjungan_rata_rata(nik)` | DECIMAL | Rata-rata durasi kunjungan (menit) |

---

## 3. Stored Procedures (3)

| Prosedur | Tanda tangan | Perilaku |
|---|---|---|
| `sp_checkout_pesanan` | `(IN nik, IN nik_pj, IN id_mp, IN items JSON, OUT id_ps, OUT total)` | **Transaksional.** Membuat header `Pemesanan`, lalu untuk tiap item JSON `{id_mk, qty}` mengunci **snapshot** `Harga_mk` ke `Harga_Satuan_dps` dan menyisipkan `Detail_Pemesanan`. Trigger stok & kuantitas tervalidasi per baris; kegagalan apa pun me-`ROLLBACK` seluruh pesanan. Mengembalikan ID & total. |
| `sp_pengembalian_buku` | `(IN id_dpm, IN tanggal, OUT denda)` | Mencap `Waktu_Kembali_dpm`; trigger AFTER-UPDATE lalu melepas status buku. Mengembalikan denda dari `sf_hitung_denda_peminjaman`. Menolak bila baris tak ada / sudah dikembalikan. |
| `sp_rekap_harian` | `(IN tanggal)` | Satu baris ringkasan: jumlah kunjungan, peminjaman, pemesanan, dan total penjualan pada tanggal tsb. |

---

## 4. Triggers (13)

Trigger memakai `SIGNAL SQLSTATE '45000'` dengan pesan Bahasa Indonesia; backend menampilkannya apa adanya ke pengguna. Semua trigger validasi di bawah benar-benar bisa dipicu lewat web — frontend sengaja tidak menyembunyikan pilihan yang akan ditolak (menu "Habis" tetap muncul di kasir, buku "Sedang Dipinjam" tetap muncul di pemilih, kuantitas ≤ 0 tetap bisa diketik), supaya keputusan tolak/terima benar-benar berasal dari trigger, bukan dari kode aplikasi.

| Trigger | Waktu / Tabel | Aturan yang ditegakkan |
|---|---|---|
| `trg_update_buku_dipinjam` | AFTER INSERT · Detail_Peminjaman | Set `Buku.Keterangan_b = 'Dipinjam'` otomatis |
| `trg_update_buku_dikembalikan` | AFTER UPDATE · Detail_Peminjaman | Saat `Waktu_Kembali_dpm` terisi → set buku 'Tidak Dipinjam' |
| `trg_validasi_makanan_habis` | BEFORE INSERT · Detail_Pemesanan | Tolak pemesanan makanan berstatus 'Habis' |
| `trg_validasi_waktu_kunjung` | BEFORE INSERT · Waktu_kunjung | `Waktu_Keluar` tidak boleh mendahului `Waktu_Masuk` (jalur check-in) |
| `trg_validasi_waktu_kunjung_update` | BEFORE UPDATE · Waktu_kunjung | Aturan yang sama, untuk jalur check-out (lihat catatan di bawah) |
| `trg_validasi_kuantitas_pesanan` | BEFORE INSERT · Detail_Pemesanan | Kuantitas harus > 0 |
| `trg_validasi_buku_sedang_dipinjam` | BEFORE INSERT · Detail_Peminjaman | Tolak meminjam buku yang sedang 'Dipinjam' |
| `trg_validasi_batas_kembali` | BEFORE INSERT · Peminjaman | `Batas_Kembali` harus setelah `Waktu_Pinjam` |
| `trg_validasi_umur_pustakawan` | BEFORE INSERT · Pustakawan | Usia ≥ 18 tahun (saat membuat data baru) |
| `trg_validasi_umur_pustakawan_update` | BEFORE UPDATE · Pustakawan | Aturan yang sama, saat mengubah data yang sudah ada |
| `trg_validasi_email_pengunjung` | BEFORE INSERT · Pengunjung | Format email harus valid (saat membuat data baru) |
| `trg_validasi_email_pengunjung_update` | BEFORE UPDATE · Pengunjung | Aturan yang sama, saat mengubah data yang sudah ada |
| `trg_validasi_update_nik` | BEFORE UPDATE · Pengunjung | NIK **immutable**, kecuali untuk peran `admin` (lihat catatan di bawah) |

> **Mengapa 3 trigger punya pasangan `_update`?** `trg_validasi_waktu_kunjung`, `trg_validasi_umur_pustakawan`, dan `trg_validasi_email_pengunjung` semula hanya `BEFORE INSERT`. Itu cukup untuk data baru, tapi tidak pernah aktif saat data yang **sudah ada** diubah — check-out memakai `UPDATE Waktu_kunjung`, bukan `INSERT`, dan web juga mengizinkan admin mengubah tanggal lahir pustakawan atau email pengunjung yang sudah ada. Tanpa pasangan `BEFORE UPDATE` dengan logika identik, ketiga aturan itu bisa dilewati begitu saja lewat jalur edit. Ditemukan saat memverifikasi setiap trigger benar-benar teruji dari web (bukan cuma dari `mysql` CLI), lalu diperbaiki dengan menambah 3 trigger pendamping.

> **`trg_validasi_update_nik` & peran admin.** Backend memakai satu pool koneksi MySQL bersama (bukan satu user DB per peran), jadi trigger tidak otomatis tahu peran pemanggil. Solusinya: tepat sebelum `UPDATE Pengunjung`, backend menjalankan `SET @app_role = '<peran-pemanggil>'` pada koneksi yang sama (lihat `visitor.repository.js`). Trigger membaca variabel sesi ini — `IF OLD.NIK_k <> NEW.NIK_k AND IFNULL(@app_role,'') <> 'admin' THEN SIGNAL ...` — sehingga **keputusan tetap di trigger**, aplikasi cuma melapor siapa yang memanggil. Akibatnya: pustakawan/penjual yang mencoba mengubah NIK selalu ditolak; admin boleh mengubahnya (mis. memperbaiki salah input NIK oleh pengunjung). Karena semua FK ke `Pengunjung.NIK_k` memakai `ON UPDATE CASCADE`, perubahan NIK oleh admin otomatis merambat ke `Waktu_kunjung`, `Peminjaman`, dan `Pemesanan`.

---

## 5. Views (20)

Dikelompokkan menurut layanan; semua diakses lewat endpoint `/api/laporan/:slug`.

**Perpustakaan:** `vw_status_buku`, `vw_buku_terpopuler`, `vw_peminjaman_harian`, `vw_buku_per_pengunjung`, `vw_buku_belum_kembali`, `vw_performa_pustakawan`, `vw_peminjaman_tanpa_kunjungan`, `vw_pengunjung_belum_meminjam`, `vw_buku_terbaru`.

**Kunjungan:** `vw_kunjungan_harian`, `vw_jam_ramai`, `vw_pengunjung_tanpa_pemesanan`.

**Kantin:** `vw_status_makanan`, `vw_makanan_favorit`, `vw_penjualan_per_jenis`, `vw_penjualan_harian`, `vw_penjualan_per_penjual`, `vw_penjualan_per_metode`, `vw_makanan_belum_dipesan`, `vw_makanan_diatas_rata`.

---

## 6. Pemetaan Objek Basis Data → Fitur Aplikasi

Tabel ini menjawab persyaratan inti: **setiap** objek basis data benar-benar dipakai oleh sebuah fitur.

| Objek DB | Tipe | Dipakai di (halaman / aksi) |
|---|---|---|
| `sp_checkout_pesanan` | Procedure | **Kasir & Pesanan** → tombol "Proses Pesanan" |
| `sp_pengembalian_buku` | Procedure | **Pengembalian** → "Konfirmasi Pengembalian" |
| `sp_rekap_harian` | Procedure | **Dasbor** (kartu Rekap Harian) & **Laporan** (pemilih tanggal) |
| `sf_cek_ketersediaan_buku` | Function | **Katalog Buku** → modal detail buku |
| `sf_rekomendasi_buku` | Function | **Katalog Buku** → bagian "Rekomendasi genre serupa" |
| `sf_hitung_denda_peminjaman` | Function | **Peminjaman** (detail, kolom denda) & hasil **Pengembalian** |
| `sf_hitung_total_pemesanan` | Function | **Kasir** (daftar & detail pesanan, kolom total) |
| `sf_total_pengeluaran_pengunjung` | Function | **Pengunjung** → drawer profil |
| `sf_total_denda_pengunjung` | Function | **Pengunjung** → drawer profil |
| `sf_cek_status_pengunjung` | Function | **Pengunjung** → badge status (Terdaftar/Tidak Terdaftar) |
| `sf_durasi_kunjungan_rata_rata` | Function | **Pengunjung** → drawer profil |
| `trg_update_buku_dipinjam` | Trigger | Otomatis saat membuat **Peminjaman** |
| `trg_update_buku_dikembalikan` | Trigger | Otomatis saat **Pengembalian** |
| `trg_validasi_makanan_habis` | Trigger | Menjaga **Kasir** — menu "Habis" tetap terpilih di UI, ditolak saat checkout |
| `trg_validasi_kuantitas_pesanan` | Trigger | Menjaga **Kasir** — qty ≤ 0 tetap bisa diketik, ditolak saat checkout |
| `trg_validasi_buku_sedang_dipinjam` | Trigger | Menjaga **Peminjaman** — buku "Sedang Dipinjam" tetap muncul di pemilih, ditolak saat disimpan |
| `trg_validasi_batas_kembali` | Trigger | Menjaga **Peminjaman** (tanggal valid) |
| `trg_validasi_waktu_kunjung` | Trigger | Menjaga **Buku Tamu** saat check-in |
| `trg_validasi_waktu_kunjung_update` | Trigger | Menjaga **Buku Tamu** saat check-out manual (waktu keluar < waktu masuk ditolak) |
| `trg_validasi_umur_pustakawan` | Trigger | Menjaga **Pustakawan** saat membuat data baru (≥ 18 th) |
| `trg_validasi_umur_pustakawan_update` | Trigger | Menjaga **Pustakawan** saat mengubah tanggal lahir data yang sudah ada |
| `trg_validasi_email_pengunjung` | Trigger | Menjaga **Pengunjung** saat membuat data baru (email valid) |
| `trg_validasi_email_pengunjung_update` | Trigger | Menjaga **Pengunjung** saat mengubah email data yang sudah ada |
| `trg_validasi_update_nik` | Trigger | Menjaga **Pengunjung** (NIK tak bisa diubah, kecuali oleh admin) — pop-up trigger di UI bila ditolak |
| `vw_status_buku` | View | **Laporan** › Status Semua Buku |
| `vw_buku_terpopuler` | View | **Laporan** › Buku Terpopuler |
| `vw_peminjaman_harian` | View | **Laporan** › Peminjaman per Hari |
| `vw_buku_per_pengunjung` | View | **Laporan** › Riwayat Pinjam per Pengunjung |
| `vw_buku_belum_kembali` | View | **Pengembalian** (daftar utama) & **Laporan** |
| `vw_performa_pustakawan` | View | **Laporan** › Performa Pustakawan |
| `vw_peminjaman_tanpa_kunjungan` | View | **Laporan** › Peminjaman Tanpa Kunjungan |
| `vw_pengunjung_belum_meminjam` | View | **Laporan** › Pengunjung Belum Meminjam |
| `vw_buku_terbaru` | View | **Laporan** › Buku Terbaru |
| `vw_kunjungan_harian` | View | **Laporan** › Kunjungan per Hari |
| `vw_jam_ramai` | View | **Laporan** › Jam Ramai |
| `vw_pengunjung_tanpa_pemesanan` | View | **Laporan** › Pengunjung Tanpa Pemesanan |
| `vw_status_makanan` | View | **Laporan** › Status Ketersediaan Makanan |
| `vw_makanan_favorit` | View | **Laporan** › Makanan Favorit |
| `vw_penjualan_per_jenis` | View | **Laporan** › Penjualan per Jenis |
| `vw_penjualan_harian` | View | **Laporan** › Penjualan per Hari |
| `vw_penjualan_per_penjual` | View | **Laporan** › Penjualan per Penjual |
| `vw_penjualan_per_metode` | View | **Laporan** › Penjualan per Metode Bayar |
| `vw_makanan_belum_dipesan` | View | **Laporan** › Makanan Belum Pernah Dipesan |
| `vw_makanan_diatas_rata` | View | **Laporan** › Makanan di Atas Harga Rata-rata |

---

## 7. Asumsi & Penyesuaian

Demi sistem yang dapat dijalankan, beberapa keputusan diambil dan dinyatakan terbuka di sini:

1. **Lapisan autentikasi ditambahkan.** ERD asli tidak memuat kredensial pada staf. Ditambahkan tabel `app_account` (username + hash bcrypt + peran + tautan opsional ke `NIK` staf) **tanpa** mengubah tabel inti. Tersedia empat peran: `admin`, `pustakawan`, `penjual`, dan `pengunjung`. Peran **`pengunjung` bersifat lihat-saja (read-only)** — dapat menelusuri katalog, menu, dasbor, dan laporan, tetapi seluruh operasi tulis ditolak di backend.
2. **Data contoh berasal dari file SQL Anda.** Isi `05_seed_data.sql` diambil persis dari file sumber (±790 buku, ±870 kunjungan, ±860 baris pemesanan, dll.). File ini dimuat **sebelum** `06_triggers.sql` sehingga data historis (yang sudah konsisten) tidak ikut divalidasi trigger; trigger hanya menjaga operasi baru dari aplikasi.
3. **Deklarasi determinisme fungsi diperbaiki.** Sumber awal menandai sebagian fungsi `DETERMINISTIC`. Karena membaca tabel, ini salah secara semantik dan dapat ditolak saat `log_bin_trust_function_creators=OFF`. Semua fungsi diperbaiki menjadi `NOT DETERMINISTIC READS SQL DATA`.
4. **Trigger ke-10 pada sumber berjudul "Log Perubahan Alamat" namun berisi kode validasi NIK.** Awalnya kedua perilaku dipertahankan sebagai dua trigger terpisah: `trg_validasi_update_nik` (mengunci NIK) dan `trg_log_perubahan_alamat` (mencatat histori alamat ke tabel `Log_Perubahan_Alamat`). Trigger pencatatan histori alamat beserta tabel pendukungnya kemudian **dihapus** atas permintaan proyek — fitur "Riwayat Perubahan Alamat" di profil Pengunjung tidak lagi ada. Yang dipertahankan hanya `trg_validasi_update_nik` (penguncian NIK), sesuai judul aslinya pada sumber.
5. **Isi prosedur ditulis lengkap.** Sumber hanya mendeskripsikan perilaku prosedur; implementasinya (termasuk penanganan JSON, snapshot harga, dan `ROLLBACK`) ditulis sesuai deskripsi tersebut.
6. **Backend tidak pernah melewati logika DB.** Pemesanan, pengembalian, denda, rekomendasi, total, dan rekap semuanya memanggil function/procedure/view — bukan menghitung ulang di lapisan aplikasi. Trigger menangani pembaruan status otomatis.
7. **Relasi `Penjual`–`Makanan` (1‑ke‑banyak).** `Makanan.Penjual_NIK_pj` (FK → `Penjual.NIK_pj`, `ON UPDATE CASCADE ON DELETE RESTRICT`) menandai menu tersebut **dimiliki** oleh satu penjual; satu penjual bisa punya banyak menu. Ini terpisah dari `Pemesanan.Penjual_NIK_pj`, yang menandai penjual mana yang **memproses** transaksi kasir — seorang kasir boleh menjual menu milik penjual lain. Karena `Nama_mk` tidak diberi constraint UNIQUE, dua penjual berbeda boleh punya menu dengan nama yang sama; masing-masing tetap baris (`ID_mk`) tersendiri di tabel `Makanan`.
