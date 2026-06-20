-- =====================================================================
--  PustaRasa — Views (20)
--  Every analytical query from the source is exposed as a view so the
--  reporting layer can simply `SELECT * FROM vw_...`. GROUP BY lists were
--  tightened to satisfy ONLY_FULL_GROUP_BY.
-- =====================================================================
USE pustarasa;

-- 1. Book circulation status board.
CREATE OR REPLACE VIEW vw_status_buku AS
SELECT ID_b, Judul_b, Penulis_b, Jenis_b, Kualitas_b, Keterangan_b
FROM Buku;

-- 2. Most-borrowed books.
CREATE OR REPLACE VIEW vw_buku_terpopuler AS
SELECT b.ID_b, b.Judul_b, COUNT(dp.Buku_ID_b) AS Jumlah_Dipinjam
FROM Buku b
JOIN Detail_Peminjaman dp ON b.ID_b = dp.Buku_ID_b
GROUP BY b.ID_b, b.Judul_b
ORDER BY Jumlah_Dipinjam DESC;

-- 3. Borrowing volume per day.
CREATE OR REPLACE VIEW vw_peminjaman_harian AS
SELECT p.Waktu_Pinjam_pm AS Tanggal,
       COUNT(DISTINCT p.ID_pm)  AS Jumlah_Transaksi,
       COUNT(dp.Buku_ID_b)      AS Jumlah_Buku
FROM Peminjaman p
JOIN Detail_Peminjaman dp ON p.ID_pm = dp.Peminjaman_ID_pm
GROUP BY p.Waktu_Pinjam_pm
ORDER BY Tanggal;

-- 4. Every book each visitor has borrowed.
CREATE OR REPLACE VIEW vw_buku_per_pengunjung AS
SELECT pg.NIK_k, pg.Nama_k AS Nama_Pengunjung, p.ID_pm,
       b.Judul_b AS Judul_Buku, dp.ID_dpm,
       p.Waktu_Pinjam_pm, p.Batas_Kembali_pm, dp.Waktu_Kembali_dpm
FROM Pengunjung pg
JOIN Peminjaman p        ON pg.NIK_k = p.Pengunjung_NIK_k
JOIN Detail_Peminjaman dp ON p.ID_pm = dp.Peminjaman_ID_pm
JOIN Buku b              ON dp.Buku_ID_b = b.ID_b
ORDER BY Nama_Pengunjung, p.Waktu_Pinjam_pm;

-- 5. Books still out (not returned).
CREATE OR REPLACE VIEW vw_buku_belum_kembali AS
SELECT p.ID_pm, dp.ID_dpm, pg.Nama_k AS Nama_Peminjam, b.Judul_b,
       p.Waktu_Pinjam_pm, p.Batas_Kembali_pm
FROM Detail_Peminjaman dp
JOIN Peminjaman p  ON dp.Peminjaman_ID_pm = p.ID_pm
JOIN Pengunjung pg ON p.Pengunjung_NIK_k = pg.NIK_k
JOIN Buku b        ON dp.Buku_ID_b = b.ID_b
WHERE dp.Waktu_Kembali_dpm IS NULL;

-- 6. Visits per day.
CREATE OR REPLACE VIEW vw_kunjungan_harian AS
SELECT DATE(Waktu_Masuk_wk) AS Tanggal_Kunjung, COUNT(ID_wk) AS Jumlah_Kunjungan
FROM Waktu_kunjung
GROUP BY DATE(Waktu_Masuk_wk)
ORDER BY Tanggal_Kunjung;

-- 7. Busiest hours of the day.
CREATE OR REPLACE VIEW vw_jam_ramai AS
SELECT HOUR(Waktu_Masuk_wk) AS Jam_Masuk, COUNT(ID_wk) AS Total_Kunjungan
FROM Waktu_kunjung
GROUP BY HOUR(Waktu_Masuk_wk)
ORDER BY Total_Kunjungan DESC;

-- 8. Food availability board.
CREATE OR REPLACE VIEW vw_status_makanan AS
SELECT ID_mk, Nama_mk, Jenis_mk, Harga_mk, Status_Ketersediaan_mk
FROM Makanan
ORDER BY Status_Ketersediaan_mk, Nama_mk;

-- 9. Best-selling foods (by quantity).
CREATE OR REPLACE VIEW vw_makanan_favorit AS
SELECT m.ID_mk, m.Nama_mk, SUM(dp.Kuantitas_dps) AS Total_Terjual
FROM Makanan m
JOIN Detail_Pemesanan dp ON m.ID_mk = dp.Makanan_ID_mk
GROUP BY m.ID_mk, m.Nama_mk
ORDER BY Total_Terjual DESC;

-- 10. Sales by food category.
CREATE OR REPLACE VIEW vw_penjualan_per_jenis AS
SELECT m.Jenis_mk,
       SUM(dp.Kuantitas_dps)                          AS Total_Item_Terjual,
       SUM(dp.Kuantitas_dps * dp.Harga_Satuan_dps)    AS Total_Pendapatan
FROM Makanan m
JOIN Detail_Pemesanan dp ON m.ID_mk = dp.Makanan_ID_mk
GROUP BY m.Jenis_mk
ORDER BY Total_Pendapatan DESC;

-- 11. Canteen revenue per day.
CREATE OR REPLACE VIEW vw_penjualan_harian AS
SELECT DATE(p.Waktu_Pesan_ps) AS Tanggal,
       SUM(dp.Kuantitas_dps * dp.Harga_Satuan_dps) AS Total_Pendapatan
FROM Pemesanan p
JOIN Detail_Pemesanan dp ON p.ID_ps = dp.Pemesanan_ID_ps
GROUP BY DATE(p.Waktu_Pesan_ps)
ORDER BY Tanggal;

-- 12. Sales per seller.
CREATE OR REPLACE VIEW vw_penjualan_per_penjual AS
SELECT pj.NIK_pj, pj.Nama_pj,
       COUNT(DISTINCT p.ID_ps)                       AS Total_Transaksi,
       IFNULL(SUM(dp.Kuantitas_dps * dp.Harga_Satuan_dps), 0) AS Total_Pendapatan
FROM Penjual pj
LEFT JOIN Pemesanan p        ON pj.NIK_pj = p.Penjual_NIK_pj
LEFT JOIN Detail_Pemesanan dp ON p.ID_ps = dp.Pemesanan_ID_ps
GROUP BY pj.NIK_pj, pj.Nama_pj
ORDER BY Total_Pendapatan DESC;

-- 13. Sales per payment method.
CREATE OR REPLACE VIEW vw_penjualan_per_metode AS
SELECT mp.ID_mp, mp.Jenis_mp, mp.Instansi_mp,
       COUNT(DISTINCT p.ID_ps)                       AS Total_Transaksi,
       IFNULL(SUM(dp.Kuantitas_dps * dp.Harga_Satuan_dps), 0) AS Total_Pendapatan
FROM Metode_pembayaran mp
LEFT JOIN Pemesanan p        ON mp.ID_mp = p.Metode_pembayaran_ID_mp
LEFT JOIN Detail_Pemesanan dp ON p.ID_ps = dp.Pemesanan_ID_ps
GROUP BY mp.ID_mp, mp.Jenis_mp, mp.Instansi_mp
ORDER BY Total_Pendapatan DESC;

-- 14. Visitors who came but never ordered food.
CREATE OR REPLACE VIEW vw_pengunjung_tanpa_pemesanan AS
SELECT DISTINCT pg.NIK_k, pg.Nama_k
FROM Pengunjung pg
JOIN Waktu_kunjung wk ON pg.NIK_k = wk.Pengunjung_NIK_k
LEFT JOIN Pemesanan p ON pg.NIK_k = p.Pengunjung_NIK_k
WHERE p.ID_ps IS NULL;

-- 15. Foods never sold.
CREATE OR REPLACE VIEW vw_makanan_belum_dipesan AS
SELECT m.ID_mk, m.Nama_mk, m.Jenis_mk
FROM Makanan m
LEFT JOIN Detail_Pemesanan dp ON m.ID_mk = dp.Makanan_ID_mk
WHERE dp.ID_dps IS NULL;

-- 16. Librarian workload.
CREATE OR REPLACE VIEW vw_performa_pustakawan AS
SELECT pt.NIK_pt, pt.Nama_pt, COUNT(p.ID_pm) AS Jumlah_Transaksi_Diproses
FROM Pustakawan pt
LEFT JOIN Peminjaman p ON pt.NIK_pt = p.Pustakawan_NIK_pt
GROUP BY pt.NIK_pt, pt.Nama_pt
ORDER BY Jumlah_Transaksi_Diproses DESC;

-- 17. Borrowings with no same-day visit (data-quality check).
CREATE OR REPLACE VIEW vw_peminjaman_tanpa_kunjungan AS
SELECT p.ID_pm, pg.NIK_k, pg.Nama_k AS Nama_Pengunjung, p.Waktu_Pinjam_pm
FROM Peminjaman p
JOIN Pengunjung pg ON p.Pengunjung_NIK_k = pg.NIK_k
LEFT JOIN Waktu_kunjung wk
       ON pg.NIK_k = wk.Pengunjung_NIK_k
      AND DATE(wk.Waktu_Masuk_wk) = p.Waktu_Pinjam_pm
WHERE wk.ID_wk IS NULL
ORDER BY p.Waktu_Pinjam_pm, pg.Nama_k;

-- 18. Visitors who never borrowed a book.
CREATE OR REPLACE VIEW vw_pengunjung_belum_meminjam AS
SELECT pg.NIK_k, pg.Nama_k AS Nama_Pengunjung, pg.No_Telp_k, pg.Email_k
FROM Pengunjung pg
LEFT JOIN Peminjaman p ON pg.NIK_k = p.Pengunjung_NIK_k
WHERE p.ID_pm IS NULL
ORDER BY pg.Nama_k;

-- 19. Newest titles (top 10 by publish year).
CREATE OR REPLACE VIEW vw_buku_terbaru AS
SELECT Judul_b, Penulis_b, Tahun_Terbit_b, Jenis_b, COUNT(ID_b) AS Jumlah_Eksemplar
FROM Buku
GROUP BY Judul_b, Penulis_b, Tahun_Terbit_b, Jenis_b
ORDER BY Tahun_Terbit_b DESC, Judul_b
LIMIT 10;

-- 20. Foods priced above the menu average.
CREATE OR REPLACE VIEW vw_makanan_diatas_rata AS
SELECT ID_mk, Nama_mk, Jenis_mk, Harga_mk
FROM Makanan
WHERE Harga_mk > (SELECT AVG(Harga_mk) FROM Makanan)
ORDER BY Harga_mk DESC;
