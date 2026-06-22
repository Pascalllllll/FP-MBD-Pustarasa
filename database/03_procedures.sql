-- =====================================================================
--  PustaRasa — Stored Procedures (3), authored to match the source's
--  descriptions, keeping all logic in the DB.
-- =====================================================================
USE pustarasa;

DROP PROCEDURE IF EXISTS sp_checkout_pesanan;
DROP PROCEDURE IF EXISTS sp_pengembalian_buku;
DROP PROCEDURE IF EXISTS sp_rekap_harian;

DELIMITER //

-- 1. CHECKOUT PESANAN — versi rekan satu tim: insert header Pemesanan saja
--    (tanpa item/JSON/OUT); p_id_ps digenerate backend sebelum dipanggil.
CREATE PROCEDURE sp_checkout_pesanan(
  IN p_id_ps CHAR(6),
  IN p_nik CHAR(16),
  IN p_penjual CHAR(16),
  IN p_metode CHAR(6)
)
BEGIN
  INSERT INTO Pemesanan (ID_ps, Pengunjung_NIK_k, Penjual_NIK_pj, Metode_pembayaran_ID_mp, Waktu_Pesan_ps)
  VALUES (p_id_ps, p_nik, p_penjual, p_metode, NOW());
END //

-- 2. PENGEMBALIAN BUKU — versi rekan satu tim; ROW_COUNT() setelah
--    SELECT...INTO terbukti benar di MariaDB ini (0 = tak ditemukan).
CREATE PROCEDURE sp_pengembalian_buku(
  IN p_id_dpm CHAR(6),
  IN p_tanggal DATE,
  OUT p_denda DECIMAL(12,2)
)
BEGIN
  DECLARE v_status DATE;

  SELECT Waktu_Kembali_dpm INTO v_status
  FROM Detail_Peminjaman WHERE ID_dpm = p_id_dpm;

  IF v_status IS NULL AND ROW_COUNT() = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Data peminjaman tidak ditemukan!';
  END IF;

  IF v_status IS NOT NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Buku sudah dikembalikan!';
  END IF;

  UPDATE Detail_Peminjaman
     SET Waktu_Kembali_dpm = IFNULL(p_tanggal, CURDATE())
   WHERE ID_dpm = p_id_dpm;

  SET p_denda = sf_hitung_denda_peminjaman(p_id_dpm);
END //

-- 3. REKAP HARIAN — one-row daily summary: visits, loans, orders, revenue.
CREATE PROCEDURE sp_rekap_harian(IN p_tanggal DATE)
BEGIN
  SELECT
    p_tanggal AS Tanggal,
    (SELECT COUNT(*) FROM Waktu_kunjung
      WHERE DATE(Waktu_Masuk_wk) = p_tanggal)                       AS Jumlah_Kunjungan,
    (SELECT COUNT(*) FROM Peminjaman
      WHERE Waktu_Pinjam_pm = p_tanggal)                            AS Jumlah_Peminjaman,
    (SELECT COUNT(*) FROM Pemesanan
      WHERE DATE(Waktu_Pesan_ps) = p_tanggal)                       AS Jumlah_Pemesanan,
    (SELECT IFNULL(SUM(dp.Kuantitas_dps * dp.Harga_Satuan_dps), 0)
       FROM Pemesanan ps
       JOIN Detail_Pemesanan dp ON ps.ID_ps = dp.Pemesanan_ID_ps
      WHERE DATE(ps.Waktu_Pesan_ps) = p_tanggal)                    AS Total_Penjualan;
END //

DELIMITER ;
