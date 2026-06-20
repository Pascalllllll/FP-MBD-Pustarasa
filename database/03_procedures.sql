-- =====================================================================
--  PustaRasa — Stored Procedures (3)
--  The source document only DESCRIBES these; the bodies below are
--  authored to match those descriptions and keep all logic in the DB.
-- =====================================================================
USE pustarasa;

DROP PROCEDURE IF EXISTS sp_checkout_pesanan;
DROP PROCEDURE IF EXISTS sp_pengembalian_buku;
DROP PROCEDURE IF EXISTS sp_rekap_harian;

DELIMITER //

-- ---------------------------------------------------------------------
-- 1. CHECKOUT PESANAN
--    Creates one Pemesanan header + N Detail_Pemesanan lines atomically.
--    Items arrive as JSON: '[{"id_mk":"MK0001","qty":2}, ...]'.
--    Harga_Satuan_dps is snapshotted from Makanan.Harga_mk at sale time.
--    The BEFORE-INSERT triggers on Detail_Pemesanan validate stock & qty;
--    any failure rolls back the whole order.
-- ---------------------------------------------------------------------
CREATE PROCEDURE sp_checkout_pesanan(
  IN  p_nik    CHAR(16),
  IN  p_nik_pj CHAR(16),
  IN  p_id_mp  CHAR(6),
  IN  p_items  JSON,
  OUT p_id_ps  CHAR(6),
  OUT p_total  DECIMAL(12,2)
)
BEGIN
  DECLARE v_num    INT;
  DECLARE v_count  INT DEFAULT 0;
  DECLARE i        INT DEFAULT 0;
  DECLARE v_id_mk  CHAR(6);
  DECLARE v_qty    INT;
  DECLARE v_harga  DECIMAL(12,2);
  DECLARE v_id_dps CHAR(6);

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  IF p_items IS NULL OR JSON_LENGTH(p_items) = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Kesalahan: Keranjang pesanan kosong!';
  END IF;

  START TRANSACTION;

    -- next Pemesanan id (PS####)
    SELECT IFNULL(MAX(CAST(SUBSTRING(ID_ps, 3) AS UNSIGNED)), 0) + 1
      INTO v_num FROM Pemesanan;
    SET p_id_ps = CONCAT('PS', LPAD(v_num, 4, '0'));

    INSERT INTO Pemesanan (ID_ps, Waktu_Pesan_ps, Penjual_NIK_pj, Pengunjung_NIK_k, Metode_pembayaran_ID_mp)
    VALUES (p_id_ps, NOW(), p_nik_pj, p_nik, p_id_mp);

    SET v_count = JSON_LENGTH(p_items);
    WHILE i < v_count DO
      SET v_id_mk = JSON_UNQUOTE(JSON_EXTRACT(p_items, CONCAT('$[', i, '].id_mk')));
      SET v_qty   = CAST(JSON_EXTRACT(p_items, CONCAT('$[', i, '].qty')) AS UNSIGNED);

      SELECT Harga_mk INTO v_harga FROM Makanan WHERE ID_mk = v_id_mk;
      IF v_harga IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Kesalahan: Makanan tidak ditemukan!';
      END IF;

      SELECT IFNULL(MAX(CAST(SUBSTRING(ID_dps, 3) AS UNSIGNED)), 0) + 1
        INTO v_num FROM Detail_Pemesanan;
      SET v_id_dps = CONCAT('DS', LPAD(v_num, 4, '0'));

      -- triggers trg_validasi_makanan_habis & trg_validasi_kuantitas_pesanan fire here
      INSERT INTO Detail_Pemesanan (ID_dps, Kuantitas_dps, Harga_Satuan_dps, Pemesanan_ID_ps, Makanan_ID_mk)
      VALUES (v_id_dps, v_qty, v_harga, p_id_ps, v_id_mk);

      SET i = i + 1;
    END WHILE;

    SET p_total = sf_hitung_total_pemesanan(p_id_ps);

  COMMIT;
END //

-- ---------------------------------------------------------------------
-- 2. PENGEMBALIAN BUKU
--    Stamps Waktu_Kembali_dpm on a borrowing line. The AFTER-UPDATE
--    trigger then flips the book back to 'Tidak Dipinjam'. Returns the
--    fine computed by sf_hitung_denda_peminjaman.
-- ---------------------------------------------------------------------
CREATE PROCEDURE sp_pengembalian_buku(
  IN  p_id_dpm   CHAR(6),
  IN  p_tanggal  DATE,
  OUT p_denda    DECIMAL(12,2)
)
BEGIN
  DECLARE v_exists INT DEFAULT 0;
  DECLARE v_done   DATE;

  SELECT COUNT(*), MAX(Waktu_Kembali_dpm) INTO v_exists, v_done
  FROM Detail_Peminjaman WHERE ID_dpm = p_id_dpm;

  IF v_exists = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Kesalahan: Detail peminjaman tidak ditemukan!';
  END IF;
  IF v_done IS NOT NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Kesalahan: Buku ini sudah dikembalikan!';
  END IF;

  UPDATE Detail_Peminjaman
     SET Waktu_Kembali_dpm = IFNULL(p_tanggal, CURDATE())
   WHERE ID_dpm = p_id_dpm;

  SET p_denda = sf_hitung_denda_peminjaman(p_id_dpm);
END //

-- ---------------------------------------------------------------------
-- 3. REKAP HARIAN
--    One-row daily summary: visits, borrowings, orders, canteen revenue.
-- ---------------------------------------------------------------------
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
