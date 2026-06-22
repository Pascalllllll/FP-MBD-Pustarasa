-- =====================================================================
--  PustaRasa · 01_schema.sql — 11 tabel inti (sesuai sumber) + app_account
--  (tabel login, tambahan aplikasi). Lihat docs/DATABASE.md.
-- =====================================================================

DROP database IF EXISTS pustarasa;
create database pustarasa;

use pustarasa;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS Detail_Pemesanan;
DROP TABLE IF EXISTS Detail_Peminjaman;
DROP TABLE IF EXISTS Pemesanan;
DROP TABLE IF EXISTS Peminjaman;
DROP TABLE IF EXISTS Waktu_kunjung;
DROP TABLE IF EXISTS Metode_pembayaran;
DROP TABLE IF EXISTS Makanan;
DROP TABLE IF EXISTS Buku;
DROP TABLE IF EXISTS Penjual;
DROP TABLE IF EXISTS Pustakawan;
DROP TABLE IF EXISTS Pengunjung;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE Pengunjung (
    NIK_k CHAR(16) NOT NULL,
    Nama_k VARCHAR(100) NOT NULL,
    No_Telp_k VARCHAR(15) NOT NULL,
    Email_k VARCHAR(100) NOT NULL,
    Alamat_k TEXT NOT NULL,
    PRIMARY KEY (NIK_k)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Pustakawan (
    NIK_pt CHAR(16) NOT NULL,
    Nama_pt VARCHAR(100) NOT NULL,
    Jadwal_Shift_pt VARCHAR(10) NOT NULL,
    Tanggal_Lahir_pt DATE NOT NULL,
    No_Telp_pt VARCHAR(15) NOT NULL,
    Email_pt VARCHAR(100) NOT NULL,
    Alamat_pt TEXT NOT NULL,
    PRIMARY KEY (NIK_pt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Penjual (
    NIK_pj CHAR(16) NOT NULL,
    Nama_pj VARCHAR(100) NOT NULL,
    Tanggal_Lahir_pj DATE NOT NULL,
    No_Telp_pj VARCHAR(15) NOT NULL,
    Email_pj VARCHAR(100) NOT NULL,
    Alamat_pj TEXT NOT NULL,
    PRIMARY KEY (NIK_pj)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Buku (
    ID_b CHAR(6) NOT NULL,
    Judul_b VARCHAR(200) NOT NULL,
    Penulis_b VARCHAR(100) NOT NULL,
    Sinopsis_b TEXT,
    Tahun_Terbit_b INT NOT NULL,
    Jenis_b VARCHAR(50) NOT NULL,
    Kualitas_b VARCHAR(50) NOT NULL,
    Keterangan_b VARCHAR(50) NOT NULL,
    PRIMARY KEY (ID_b)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Makanan (
    ID_mk CHAR(6) NOT NULL,
    Nama_mk VARCHAR(100) NOT NULL,
    Jenis_mk VARCHAR(50) NOT NULL,
    Harga_mk DECIMAL(12,2) NOT NULL,
    Status_Ketersediaan_mk VARCHAR(20) NOT NULL,
    Penjual_NIK_pj CHAR(16) NOT NULL,
    PRIMARY KEY (ID_mk),
    CONSTRAINT fk_makanan_penjual
        FOREIGN KEY (Penjual_NIK_pj)
        REFERENCES Penjual (NIK_pj)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Metode_pembayaran (
    ID_mp CHAR(6) NOT NULL,
    Jenis_mp VARCHAR(50) NOT NULL,
    Instansi_mp VARCHAR(50) NOT NULL,
    PRIMARY KEY (ID_mp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Waktu_kunjung (
    ID_wk CHAR(6) NOT NULL,
    Waktu_Masuk_wk DATETIME NOT NULL,
    Waktu_Keluar_wk DATETIME NULL,
    Pengunjung_NIK_k CHAR(16) NOT NULL,
    PRIMARY KEY (ID_wk),
    CONSTRAINT fk_waktu_kunjung_pengunjung
        FOREIGN KEY (Pengunjung_NIK_k)
        REFERENCES Pengunjung (NIK_k)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Peminjaman (
    ID_pm CHAR(6) NOT NULL,
    Waktu_Pinjam_pm DATE NOT NULL,
    Batas_Kembali_pm DATE NOT NULL,
    Pengunjung_NIK_k CHAR(16) NOT NULL,
    Pustakawan_NIK_pt CHAR(16) NOT NULL,
    PRIMARY KEY (ID_pm),
    CONSTRAINT fk_peminjaman_pengunjung
        FOREIGN KEY (Pengunjung_NIK_k)
        REFERENCES Pengunjung (NIK_k)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_peminjaman_pustakawan
        FOREIGN KEY (Pustakawan_NIK_pt)
        REFERENCES Pustakawan (NIK_pt)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Detail_Peminjaman (
    ID_dpm CHAR(6) NOT NULL,
    Waktu_Kembali_dpm DATE NULL,
    Denda_Per_Hari_dpm DECIMAL(12,2) NOT NULL,
    Peminjaman_ID_pm CHAR(6) NOT NULL,
    Buku_ID_b CHAR(6) NOT NULL,
    PRIMARY KEY (ID_dpm),
    UNIQUE KEY uq_detail_peminjaman_item (Peminjaman_ID_pm, Buku_ID_b),
    CONSTRAINT fk_detail_peminjaman_peminjaman
        FOREIGN KEY (Peminjaman_ID_pm)
        REFERENCES Peminjaman (ID_pm)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_detail_peminjaman_buku
        FOREIGN KEY (Buku_ID_b)
        REFERENCES Buku (ID_b)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Pemesanan (
    ID_ps CHAR(6) NOT NULL,
    Waktu_Pesan_ps DATETIME NOT NULL,
    Pengunjung_NIK_k CHAR(16) NOT NULL,
    Penjual_NIK_pj CHAR(16) NOT NULL,
    Metode_pembayaran_ID_mp CHAR(6) NOT NULL,
    PRIMARY KEY (ID_ps),
    CONSTRAINT fk_pemesanan_pengunjung
        FOREIGN KEY (Pengunjung_NIK_k)
        REFERENCES Pengunjung (NIK_k)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_pemesanan_penjual
        FOREIGN KEY (Penjual_NIK_pj)
        REFERENCES Penjual (NIK_pj)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_pemesanan_metode
        FOREIGN KEY (Metode_pembayaran_ID_mp)
        REFERENCES Metode_pembayaran (ID_mp)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Detail_Pemesanan (
    ID_dps CHAR(6) NOT NULL,
    Kuantitas_dps INT NOT NULL,
    Harga_Satuan_dps DECIMAL(12,2) NOT NULL,
    Pemesanan_ID_ps CHAR(6) NOT NULL,
    Makanan_ID_mk CHAR(6) NOT NULL,
    PRIMARY KEY (ID_dps),
    UNIQUE KEY uq_detail_pemesanan_item (Pemesanan_ID_ps, Makanan_ID_mk),
    CONSTRAINT fk_detail_pemesanan_pemesanan
        FOREIGN KEY (Pemesanan_ID_ps)
        REFERENCES Pemesanan (ID_ps)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_detail_pemesanan_makanan
        FOREIGN KEY (Makanan_ID_mk)
        REFERENCES Makanan (ID_mk)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- Tabel pendukung aplikasi (di luar ERD sumber): akun login; role
-- 'pengunjung' = lihat-saja, staff_nik opsional menaut ke Pustakawan/Penjual.
CREATE TABLE app_account (
    id            INT          NOT NULL AUTO_INCREMENT,
    username      VARCHAR(50)  NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(100) NOT NULL,
    role          ENUM('admin','pustakawan','penjual','pengunjung') NOT NULL,
    staff_nik     CHAR(16)     NULL,
    is_active     TINYINT(1)   NOT NULL DEFAULT 1,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_account_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
