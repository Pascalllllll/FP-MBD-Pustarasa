-- =====================================================================
--  PustaRasa — Stored Functions  (8)
--  These encapsulate read-only business calculations. The web app calls
--  them instead of re-implementing the maths in JavaScript.
--  NOTE: changed the source's `DETERMINISTIC` to the correct
--  `NOT DETERMINISTIC READS SQL DATA` (they read tables).
-- =====================================================================
USE pustarasa;

DROP FUNCTION IF EXISTS sf_cek_ketersediaan_buku;
DROP FUNCTION IF EXISTS sf_total_pengeluaran_pengunjung;
DROP FUNCTION IF EXISTS sf_hitung_denda_peminjaman;
DROP FUNCTION IF EXISTS sf_hitung_total_pemesanan;
DROP FUNCTION IF EXISTS sf_cek_status_keanggotaan;
DROP FUNCTION IF EXISTS sf_total_denda_pengunjung;
DROP FUNCTION IF EXISTS sf_rekomendasi_buku;
DROP FUNCTION IF EXISTS sf_durasi_kunjungan_rata_rata;

DELIMITER //

-- 1. Circulation status of one book (Dipinjam / Tidak Dipinjam).
CREATE FUNCTION sf_cek_ketersediaan_buku(p_id_b CHAR(6))
RETURNS VARCHAR(50) NOT DETERMINISTIC READS SQL DATA
BEGIN
  DECLARE v_status VARCHAR(50);
  SELECT Keterangan_b INTO v_status FROM Buku WHERE ID_b = p_id_b;
  RETURN IFNULL(v_status, 'Tidak Ditemukan');
END //

-- 2. Total amount a visitor has ever spent at the canteen.
CREATE FUNCTION sf_total_pengeluaran_pengunjung(p_nik CHAR(16))
RETURNS DECIMAL(12,2) NOT DETERMINISTIC READS SQL DATA
BEGIN
  DECLARE v_total DECIMAL(12,2);
  SELECT SUM(dp.Kuantitas_dps * dp.Harga_Satuan_dps) INTO v_total
  FROM Detail_Pemesanan dp
  JOIN Pemesanan p ON dp.Pemesanan_ID_ps = p.ID_ps
  WHERE p.Pengunjung_NIK_k = p_nik;
  RETURN IFNULL(v_total, 0);
END //

-- 3. Late-return fine for ONE borrowing line.
CREATE FUNCTION sf_hitung_denda_peminjaman(p_id_dpm CHAR(6))
RETURNS DECIMAL(12,2) NOT DETERMINISTIC READS SQL DATA
BEGIN
  DECLARE v_denda DECIMAL(12,2);
  SELECT IF(dp.Waktu_Kembali_dpm > p.Batas_Kembali_pm,
            DATEDIFF(dp.Waktu_Kembali_dpm, p.Batas_Kembali_pm) * dp.Denda_Per_Hari_dpm,
            0)
  INTO v_denda
  FROM Detail_Peminjaman dp
  JOIN Peminjaman p ON dp.Peminjaman_ID_pm = p.ID_pm
  WHERE dp.ID_dpm = p_id_dpm;
  RETURN IFNULL(v_denda, 0);
END //

-- 4. Grand total of ONE canteen order.
CREATE FUNCTION sf_hitung_total_pemesanan(p_id_ps CHAR(6))
RETURNS DECIMAL(12,2) NOT DETERMINISTIC READS SQL DATA
BEGIN
  DECLARE v_total DECIMAL(12,2);
  SELECT SUM(Kuantitas_dps * Harga_Satuan_dps) INTO v_total
  FROM Detail_Pemesanan WHERE Pemesanan_ID_ps = p_id_ps;
  RETURN IFNULL(v_total, 0);
END //

-- 5. Membership check used before allowing a transaction.
CREATE FUNCTION sf_cek_status_keanggotaan(p_nik CHAR(16))
RETURNS VARCHAR(20) NOT DETERMINISTIC READS SQL DATA
BEGIN
  RETURN IF((SELECT COUNT(*) FROM Pengunjung WHERE NIK_k = p_nik) > 0,
            'Aktif', 'Tidak Terdaftar');
END //

-- 6. Total accrued fine across ALL of a visitor's returned-late books.
CREATE FUNCTION sf_total_denda_pengunjung(p_nik CHAR(16))
RETURNS DECIMAL(12,2) NOT DETERMINISTIC READS SQL DATA
BEGIN
  DECLARE v_total DECIMAL(12,2);
  SELECT SUM(IF(dp.Waktu_Kembali_dpm > p.Batas_Kembali_pm,
                DATEDIFF(dp.Waktu_Kembali_dpm, p.Batas_Kembali_pm) * dp.Denda_Per_Hari_dpm,
                0))
  INTO v_total
  FROM Detail_Peminjaman dp
  JOIN Peminjaman p ON dp.Peminjaman_ID_pm = p.ID_pm
  WHERE p.Pengunjung_NIK_k = p_nik;
  RETURN IFNULL(v_total, 0);
END //

-- 7. Most-borrowed title within a genre (reading suggestion engine),
--    excluding the book's own title (a title may exist as several copies).
--    p_judul_exclude is optional: NULL/'' means "no exclusion" — a plain
--    `<> p_judul_exclude` would silently match zero rows here, because SQL
--    comparisons against NULL are NULL (neither true nor false), not TRUE.
--    GROUP BY is by title only (not ID_b): a title can have several physical
--    copies, and each copy's borrows must add up to that title's true total
--    instead of being split into several smaller per-copy counts. The
--    secondary ORDER BY key keeps the pick stable when two titles tie.
CREATE FUNCTION sf_rekomendasi_buku(p_jenis VARCHAR(50), p_judul_exclude VARCHAR(200))
RETURNS VARCHAR(200) NOT DETERMINISTIC READS SQL DATA
BEGIN
  DECLARE v_judul VARCHAR(200);
  SELECT b.Judul_b INTO v_judul
  FROM Buku b
  JOIN Detail_Peminjaman dp ON b.ID_b = dp.Buku_ID_b
  WHERE b.Jenis_b = p_jenis
    AND (p_judul_exclude IS NULL OR p_judul_exclude = '' OR b.Judul_b <> p_judul_exclude)
  GROUP BY b.Judul_b
  ORDER BY COUNT(*) DESC, b.Judul_b ASC
  LIMIT 1;
  RETURN IFNULL(v_judul, 'Belum ada rekomendasi');
END //

-- 8. Average visit duration (minutes) for a visitor.
CREATE FUNCTION sf_durasi_kunjungan_rata_rata(p_nik CHAR(16))
RETURNS DECIMAL(10,2) NOT DETERMINISTIC READS SQL DATA
BEGIN
  DECLARE v_rata DECIMAL(10,2);
  SELECT AVG(TIMESTAMPDIFF(MINUTE, Waktu_Masuk_wk, Waktu_Keluar_wk)) INTO v_rata
  FROM Waktu_kunjung
  WHERE Pengunjung_NIK_k = p_nik AND Waktu_Keluar_wk IS NOT NULL;
  RETURN IFNULL(v_rata, 0);
END //

DELIMITER ;
