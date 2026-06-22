-- =====================================================================
--  PustaRasa — Triggers (13): the DB enforces its own rules; the app never
--  duplicates them. 3 rules also get a BEFORE UPDATE twin (suffixed _update)
--  since the INSERT-only original never fired on edits — see DATABASE.md §4.
-- =====================================================================
USE pustarasa;

DROP TRIGGER IF EXISTS trg_update_buku_dipinjam;
DROP TRIGGER IF EXISTS trg_update_buku_dikembalikan;
DROP TRIGGER IF EXISTS trg_validasi_makanan_habis;
DROP TRIGGER IF EXISTS trg_validasi_waktu_kunjung;
DROP TRIGGER IF EXISTS trg_validasi_waktu_kunjung_update;
DROP TRIGGER IF EXISTS trg_validasi_kuantitas_pesanan;
DROP TRIGGER IF EXISTS trg_validasi_buku_sedang_dipinjam;
DROP TRIGGER IF EXISTS trg_validasi_batas_kembali;
DROP TRIGGER IF EXISTS trg_validasi_umur_pustakawan;
DROP TRIGGER IF EXISTS trg_validasi_umur_pustakawan_update;
DROP TRIGGER IF EXISTS trg_validasi_email_pengunjung;
DROP TRIGGER IF EXISTS trg_validasi_email_pengunjung_update;
DROP TRIGGER IF EXISTS trg_validasi_update_nik;

DELIMITER //

-- 1. On borrow: mark the book 'Dipinjam'.
CREATE TRIGGER trg_update_buku_dipinjam
AFTER INSERT ON Detail_Peminjaman
FOR EACH ROW
BEGIN
  UPDATE Buku SET Keterangan_b = 'Dipinjam' WHERE ID_b = NEW.Buku_ID_b;
END //

-- 2. On return: mark the book 'Tidak Dipinjam'.
CREATE TRIGGER trg_update_buku_dikembalikan
AFTER UPDATE ON Detail_Peminjaman
FOR EACH ROW
BEGIN
  IF NEW.Waktu_Kembali_dpm IS NOT NULL AND OLD.Waktu_Kembali_dpm IS NULL THEN
    UPDATE Buku SET Keterangan_b = 'Tidak Dipinjam' WHERE ID_b = NEW.Buku_ID_b;
  END IF;
END //

-- 3. Block ordering a sold-out item.
CREATE TRIGGER trg_validasi_makanan_habis
BEFORE INSERT ON Detail_Pemesanan
FOR EACH ROW
BEGIN
  DECLARE v_status VARCHAR(20);
  SELECT Status_Ketersediaan_mk INTO v_status FROM Makanan WHERE ID_mk = NEW.Makanan_ID_mk;
  IF v_status = 'Habis' THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Kesalahan: Makanan/Minuman ini sedang habis dan tidak dapat dipesan!';
  END IF;
END //

-- 4. Visit exit time may not precede entry time.
CREATE TRIGGER trg_validasi_waktu_kunjung
BEFORE INSERT ON Waktu_kunjung
FOR EACH ROW
BEGIN
  IF NEW.Waktu_Keluar_wk IS NOT NULL AND NEW.Waktu_Keluar_wk < NEW.Waktu_Masuk_wk THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Kesalahan: Waktu keluar tidak boleh lebih awal daripada waktu masuk!';
  END IF;
END //

-- 4b. Same rule on UPDATE — check-out sets Waktu_Keluar_wk via UPDATE, not INSERT.
CREATE TRIGGER trg_validasi_waktu_kunjung_update
BEFORE UPDATE ON Waktu_kunjung
FOR EACH ROW
BEGIN
  IF NEW.Waktu_Keluar_wk IS NOT NULL AND NEW.Waktu_Keluar_wk < NEW.Waktu_Masuk_wk THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Kesalahan: Waktu keluar tidak boleh lebih awal daripada waktu masuk!';
  END IF;
END //

-- 5. Order quantity must be >= 1.
CREATE TRIGGER trg_validasi_kuantitas_pesanan
BEFORE INSERT ON Detail_Pemesanan
FOR EACH ROW
BEGIN
  IF NEW.Kuantitas_dps <= 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Kesalahan: Kuantitas item yang dipesan minimal harus 1!';
  END IF;
END //

-- 6. Cannot borrow a book that is already out.
CREATE TRIGGER trg_validasi_buku_sedang_dipinjam
BEFORE INSERT ON Detail_Peminjaman
FOR EACH ROW
BEGIN
  DECLARE v_ket VARCHAR(50);
  SELECT Keterangan_b INTO v_ket FROM Buku WHERE ID_b = NEW.Buku_ID_b;
  IF v_ket = 'Dipinjam' THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Kesalahan: Buku ini sedang dipinjam oleh pengunjung lain!';
  END IF;
END //

-- 7. Return deadline must be after the borrow date.
CREATE TRIGGER trg_validasi_batas_kembali
BEFORE INSERT ON Peminjaman
FOR EACH ROW
BEGIN
  IF NEW.Batas_Kembali_pm <= NEW.Waktu_Pinjam_pm THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Kesalahan: Batas waktu pengembalian harus diset setelah tanggal peminjaman!';
  END IF;
END //

-- 8. Librarian must be at least 18.
CREATE TRIGGER trg_validasi_umur_pustakawan
BEFORE INSERT ON Pustakawan
FOR EACH ROW
BEGIN
  IF TIMESTAMPDIFF(YEAR, NEW.Tanggal_Lahir_pt, CURDATE()) < 18 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Kesalahan: Umur pustakawan tidak boleh kurang dari 18 tahun!';
  END IF;
END //

-- 8b. Same rule on UPDATE — admin can edit an existing librarian's birthdate too.
CREATE TRIGGER trg_validasi_umur_pustakawan_update
BEFORE UPDATE ON Pustakawan
FOR EACH ROW
BEGIN
  IF TIMESTAMPDIFF(YEAR, NEW.Tanggal_Lahir_pt, CURDATE()) < 18 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Kesalahan: Umur pustakawan tidak boleh kurang dari 18 tahun!';
  END IF;
END //

-- 9. Visitor email must look like an email.
CREATE TRIGGER trg_validasi_email_pengunjung
BEFORE INSERT ON Pengunjung
FOR EACH ROW
BEGIN
  IF NEW.Email_k NOT LIKE '%@%' OR NEW.Email_k NOT LIKE '%.%' THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Kesalahan: Format penulisan alamat email pengunjung tidak valid!';
  END IF;
END //

-- 9b. Same rule on UPDATE — staff can edit an existing visitor's email too.
CREATE TRIGGER trg_validasi_email_pengunjung_update
BEFORE UPDATE ON Pengunjung
FOR EACH ROW
BEGIN
  IF NEW.Email_k NOT LIKE '%@%' OR NEW.Email_k NOT LIKE '%.%' THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Kesalahan: Format penulisan alamat email pengunjung tidak valid!';
  END IF;
END //

-- 10a. NIK is immutable except for admin. The app sets session var @app_role
-- right before this UPDATE; the trigger reads it and decides, so the rule
-- still lives in the DB, not in app code.
CREATE TRIGGER trg_validasi_update_nik
BEFORE UPDATE ON Pengunjung
FOR EACH ROW
BEGIN
  IF OLD.NIK_k <> NEW.NIK_k AND IFNULL(@app_role, '') <> 'admin' THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Kesalahan: NIK Pengunjung tidak boleh diubah! Hanya admin yang dapat mengubah NIK (mis. memperbaiki salah input).';
  END IF;
END //

DELIMITER ;
