# Contoh Uji Coba — Uji Function, Uji Procedure, Uji Trigger

Semua nilai di bawah ini **sudah diverifikasi langsung** ke database (bukan dikira-kira) dan cocok dengan data dummy bawaan proyek. Jalankan via halaman terkait di sidebar setelah login sebagai `admin`.

> **Nilai yang bergantung tanggal hari ini** (ditandai 🕒) akan berubah seiring waktu karena dihitung dari `CURDATE()` — wajar, bukan bug. Nilai pada tabel adalah hasil saat dokumen ini diverifikasi.

---

## A. Uji Function (8)

Semua function aman dipanggil berkali-kali — murni baca data, tidak mengubah apa pun.

| # | Function | Parameter Input | Ekspektasi Output |
|---|---|---|---|
| 1 | `sf_cek_ketersediaan_buku` | `id_b` = `B00001` | `Dipinjam` |
| | | `id_b` = `B00002` | `Tidak Dipinjam` |
| 2 | `sf_rekomendasi_buku` | `jenis` = `Fiksi - Petualangan`, `judul_exclude` = *(kosongkan)* | `Shantaram` |
| | | `jenis` = `Fiksi - Petualangan`, `judul_exclude` = `Shantaram` | `The Jungle Book` |
| 3 🕒 | `sf_hitung_denda_peminjaman` | `id_dpm` = `DP0001` (belum dikembalikan, lewat tenggat) | `32000.00` |
| | | `id_dpm` = `DP0165` (sudah dikembalikan tepat waktu) | `4000.00` (tetap, tidak berubah lagi) |
| 4 | `sf_hitung_total_pemesanan` | `id_ps` = `PS0001` | `99000.00` |
| 5 | `sf_total_pengeluaran_pengunjung` | `nik` = `1234567890123456` | `225000.00` |
| 6 🕒 | `sf_total_denda_pengunjung` | `nik` = `1234567890123456` | `120000.00` (bertambah bila ada pinjaman lewat tenggat yang belum kembali) |
| 7 | `sf_cek_status_pengunjung` | `nik` = `1234567890123456` | `Terdaftar` |
| | | `nik` = `0000000000000000` (tidak ada di tabel) | `Tidak Terdaftar` |
| 8 | `sf_durasi_kunjungan_rata_rata` | `nik` = `1234567890123456` | `75.17` (menit) |

---

## B. Uji Procedure (3)

⚠️ **Berbeda dari Uji Function/Trigger — operasi ini berjalan sungguhan dan permanen, tidak ada rollback.** Pilih ID uji yang belum pernah dipakai supaya tidak mengubah data riwayat yang sudah ada.

| # | Procedure | Parameter Input | Ekspektasi Output | Catatan |
|---|---|---|---|---|
| 1 | Checkout Pesanan | `idPs`=`PS9001`, `nik`=`1234567890123456`, `penjual`=`4567890123456789`, `metode`=`MP0001` | `{ "executed": true }` | Membuat baris baru di `Pemesanan`. Pakai ID `PS####` yang belum ada (cek dulu di Laporan/Kasir bila ragu). |
| 2 | Pengembalian Buku | `idDpm`=`ZZZZZZ` (tidak ada) | Ditolak: `Data peminjaman tidak ditemukan!` | Aman, tidak mengubah apa pun. |
| | | `idDpm`=`DP0165` (sudah dikembalikan) | Ditolak: `Buku sudah dikembalikan!` | Aman, tidak mengubah apa pun. |
| | | `idDpm`=`DP0010` (belum dikembalikan) | `{ "denda": 30000 }` (perkiraan 🕒) | **Mengubah data permanen** — `DP0010` akan benar-benar tercatat kembali. Pakai ID lain bila ingin coba ulang, atau jalankan `npm run db:reset` setelahnya. |
| 3 | Rekap Harian | `tanggal`=`2026-06-01` | `{"Tanggal":"2026-06-01","Jumlah_Kunjungan":217,"Jumlah_Peminjaman":21,"Jumlah_Pemesanan":5,"Total_Penjualan":648000}` | Aman, hanya `SELECT`. |

---

## C. Uji Trigger (13)

Semua trigger di bawah **otomatis di-ROLLBACK** apa pun hasilnya — aman dicoba berkali-kali, tidak ada data yang berubah permanen.

| # | Trigger | Skenario | Parameter Input | Ekspektasi Output |
|---|---|---|---|---|
| 1 | `trg_update_buku_dipinjam` | otomatis (tanpa pop-up) | `idPm`=`PM0040`, `idB`=`B00002`, `dendaPerHari`=`2000` | ✓ Diterima |
| 2 | `trg_update_buku_dikembalikan` | otomatis (tanpa pop-up) | `idDpm`=`DP0001` (belum kembali) | ✓ Diterima |
| 3 | `trg_validasi_makanan_habis` | menu masih Ada | `idPs`=`PS0003`, `idMk`=`MK0001`, `qty`=`1`, `harga`=`25000` | ✓ Diterima |
| | | menu Habis* | sama, tapi `idMk` menu yang statusnya "Habis" | ✕ `Makanan/Minuman ini sedang habis dan tidak dapat dipesan!` |
| 4 | `trg_validasi_kuantitas_pesanan` | qty valid | `idPs`=`PS0003`, `idMk`=`MK0001`, `qty`=`2`, `harga`=`25000` | ✓ Diterima |
| | | qty = 0 | sama, `qty`=`0` | ✕ `Kuantitas item yang dipesan minimal harus 1!` |
| 5 | `trg_validasi_buku_sedang_dipinjam` | buku tersedia | `idPm`=`PM0040`, `idB`=`B00002`, `dendaPerHari`=`2000` | ✓ Diterima |
| | | buku sedang dipinjam | sama, `idB`=`B00001` | ✕ `Buku ini sedang dipinjam oleh pengunjung lain!` |
| 6 | `trg_validasi_batas_kembali` | batas valid | `nik`=`1234567890123456`, `nikPt`=`5678901234567890`, `waktuPinjam`=`2026-06-22`, `batasKembali`=`2026-06-29` | ✓ Diterima |
| | | batas ≤ pinjam | sama, `batasKembali`=`2026-06-20` | ✕ `Batas waktu pengembalian harus diset setelah tanggal peminjaman!` |
| 7 | `trg_validasi_waktu_kunjung` (check-in, INSERT)** | keluar sesudah masuk | `nik`=`1234567890123456`, `waktuMasuk`=`2026-06-23T09:00`, `waktuKeluar`=`2026-06-23T11:00` | ✓ Diterima |
| | | keluar sebelum masuk | sama, `waktuKeluar`=`2026-06-23T08:00` | ✕ `Waktu keluar tidak boleh lebih awal daripada waktu masuk!` |
| 8 | `trg_validasi_waktu_kunjung_update` (check-out) | keluar sesudah masuk | `idWk`=`WK0072` (masuk `2026-06-01 13:37`), `waktuKeluar`=`2026-06-01T15:00` | ✓ Diterima |
| | | keluar sebelum masuk | sama, `waktuKeluar`=`2026-06-01T10:00` | ✕ `Waktu keluar tidak boleh lebih awal daripada waktu masuk!` |
| 9 | `trg_validasi_umur_pustakawan` (data baru) | usia ≥ 18 | `nikPt`=`9999999999999991`, `tanggalLahir`=`1990-01-01` | ✓ Diterima |
| | | usia < 18 | sama, `tanggalLahir`=`2015-01-01` | ✕ `Umur pustakawan tidak boleh kurang dari 18 tahun!` |
| 10 | `trg_validasi_umur_pustakawan_update` (data lama) | usia ≥ 18 | `nikPt`=`5678901234567890`, `tanggalLahir`=`1990-01-01` | ✓ Diterima |
| | | usia < 18 | sama, `tanggalLahir`=`2015-01-01` | ✕ `Umur pustakawan tidak boleh kurang dari 18 tahun!` |
| 11 | `trg_validasi_email_pengunjung` (data baru) | format valid | `nik`=`9999999999999992`, `email`=`benar@email.com` | ✓ Diterima |
| | | format salah | sama, `email`=`emailsalah` | ✕ `Format penulisan alamat email pengunjung tidak valid!` |
| 12 | `trg_validasi_email_pengunjung_update` (data lama) | format valid | `nik`=`1234567890123456`, `email`=`benar@email.com` | ✓ Diterima |
| | | format salah | sama, `email`=`emailsalah` | ✕ `Format penulisan alamat email pengunjung tidak valid!` |
| 13 | `trg_validasi_update_nik` | peran `admin` | `nikLama`=`1234567890123456`, `nikBaru`=`0000000000000099`, `peran`=`admin` | ✓ Diterima |
| | | peran `pustakawan`/`penjual` | sama, `peran`=`pustakawan` | ✕ `NIK Pengunjung tidak boleh diubah! Hanya admin yang dapat mengubah NIK (mis. memperbaiki salah input).` |

\* Belum ada menu berstatus "Habis" di data dummy bawaan — ubah salah satu dulu lewat **Menu Makanan**, jalankan ujinya, lalu kembalikan ke "Ada".

\*\* Versi `INSERT` murni ini **tidak bisa dipicu lewat alur normal di web** (check-in selalu menyisipkan `Waktu_Keluar_wk = NULL`) — Uji Trigger adalah satu-satunya cara mengujinya tanpa `mysql` CLI.
