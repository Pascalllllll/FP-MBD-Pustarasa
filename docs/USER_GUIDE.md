# Panduan Pengguna — PustaRasa

Panduan singkat penggunaan aplikasi per peran. Masuk di `http://localhost:5173` dengan akun pada tabel di `SETUP.md`.

Aplikasi memakai **penanda warna layanan** secara konsisten: **ungu = Perpustakaan**, **kuning = Kantin**, ungu muda = Kunjungan, abu = Manajemen. Penanda ini muncul di sidebar dan judul halaman agar Anda selalu tahu sedang berada di "dunia" mana.

---

## Untuk Semua Peran

### Dasbor
Halaman pertama setelah login. Terbagi dua dunia berdampingan:
- **Perpustakaan** — total buku, sedang dipinjam, belum kembali, total pengunjung.
- **Kantin** — menu tersedia, pendapatan hari ini & total.

Di bawahnya ada strip **Kunjungan** dan kartu **Rekap Harian** (dihitung oleh prosedur basis data untuk tanggal hari ini).

### Pengunjung
- Klik **Tambah** untuk mendaftarkan pengunjung (butuh NIK 16 digit; email divalidasi oleh basis data).
- Klik **nama** pengunjung untuk membuka profil: total belanja, total denda, rata-rata durasi kunjungan, dan status keanggotaan. Semua angka dihitung langsung oleh fungsi basis data.
- Saat mengubah data, **NIK tidak bisa diganti** (dikunci basis data). Jika alamat diubah, perubahannya tercatat otomatis.

### Buku Tamu (Kunjungan)
- **Check-in**: masukkan NIK pengunjung terdaftar; waktu masuk terisi otomatis.
- **Check-out**: tekan tombol pada baris yang masih "di dalam". Sistem menolak waktu keluar yang lebih awal dari waktu masuk.
- Centang **"Hanya yang masih di dalam"** untuk menyaring sesi aktif.

### Laporan
- Pilih salah satu dari 20 laporan di panel kiri (terkelompok per layanan). Tabel akan menyesuaikan kolomnya secara dinamis.
- Kartu **Rekap Harian** di atas menerima pilihan tanggal untuk meninjau hari mana pun.

### Uji Function
Panggil langsung kedelapan stored function basis data dengan parameter Anda sendiri. Tiap function tampil sebagai kartu — isi kolom parameternya (mis. NIK atau ID Buku), tekan **Jalankan**, dan hasilnya muncul apa adanya dari MySQL. Berguna untuk memverifikasi function tanpa harus membuka `mysql` CLI.

### Metode Pembayaran
Daftar opsi pembayaran kantin. (Menambah/menghapus hanya untuk Administrator.)

---

## Untuk Pustakawan (dan Administrator)

### Katalog Buku
- **Tambah/Ubah** buku. Status pinjam (Dipinjam/Tersedia) **tidak** diisi manual — basis data mengaturnya otomatis.
- Klik judul untuk melihat detail, termasuk **rekomendasi buku** bergenre serupa.

### Peminjaman
1. Klik **Pinjam Buku**.
2. Pilih **pengunjung** dan **pustakawan** petugas, atur tanggal pinjam & batas kembali.
3. Tambahkan satu atau lebih buku dari daftar (hanya buku tersedia yang muncul). Atur denda/hari bila perlu.
4. Tekan **Pinjamkan**. Bila ada buku yang ternyata sedang dipinjam atau tanggal tak valid, basis data menolak seluruh transaksi dengan pesan jelas.
5. Klik ID transaksi untuk melihat rincian dan **denda berjalan** tiap buku.

### Pengembalian
- Halaman menampilkan semua buku yang **belum kembali** (yang lewat tenggat ditandai merah).
- Tekan **Kembalikan**, konfirmasi tanggal, dan sistem akan mencatat pengembalian, melepas status buku, lalu menampilkan **denda** yang dihitung otomatis.

### Pustakawan (Manajemen)
Kelola data petugas perpustakaan. Usia di bawah 18 tahun ditolak basis data.

---

## Untuk Penjual Kantin (dan Administrator)

### Menu Makanan
- **Tambah/Ubah** menu dan harga. Set status **Habis** untuk menutup item dari penjualan — basis data akan menolak pemesanannya.

### Kasir & Pesanan
Tab **Kasir**:
1. Klik kartu menu di kiri untuk menambah ke keranjang; atur kuantitas di kanan.
2. Pilih **pengunjung**, **penjual** (terisi otomatis bila akun Anda tertaut), dan **metode pembayaran**.
3. Tekan **Proses Pesanan**. Seluruh pesanan diproses sebagai satu transaksi; bila ada item habis/kuantitas tak sah, pesanan dibatalkan utuh.
4. Struk muncul dengan rincian dan total.

Tab **Riwayat**: telusuri pesanan lampau; klik ID untuk melihat rincian (harga satuan yang dipakai adalah harga **saat transaksi**, bukan harga terkini).

### Penjual (Manajemen)
Kelola data penjual kantin.

---

## Mode Pengunjung (Lihat-saja)

Login `pengunjung` / `lihat123` membuka **mode lihat-saja**. Peran ini ditujukan bagi pengunjung yang ingin menelusuri tanpa mengubah data:

- Yang **terlihat**: Dasbor, Katalog Buku (termasuk detail & rekomendasi), Menu Makanan, Laporan, dan Uji Function.
- Yang **disembunyikan**: peminjaman, pengembalian, kasir, buku tamu, dan seluruh menu manajemen.
- **Tidak ada** tombol tambah/ubah/hapus di mana pun, dan setiap percobaan operasi tulis akan ditolak oleh backend. Akses benar-benar terbatas pada melihat.

---

## Catatan Penting

- **Pesan kesalahan berasal dari aturan basis data.** Jika muncul peringatan seperti "Stok makanan habis" atau "Buku sedang dipinjam", itu aturan bisnis yang ditegakkan basis data, bukan sekadar validasi tampilan.
- **Hak akses dibatasi peran.** Menu yang tak relevan untuk peran Anda tidak ditampilkan, dan mencoba membukanya akan dialihkan ke Dasbor.
