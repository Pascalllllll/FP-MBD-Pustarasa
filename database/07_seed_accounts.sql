-- =====================================================================
--  PustaRasa  ·  07_seed_accounts.sql
--  Akun login aplikasi (hash bcrypt, cost 10).
--
--  Kredensial default (GANTI sebelum dipakai sungguhan!):
--    +-------------+-----------+-------------+---------------------------+
--    | username    | sandi     | peran       | tertaut ke (NIK)          |
--    +-------------+-----------+-------------+---------------------------+
--    | admin       | admin123  | admin       | -                         |
--    | pustakawan  | staff123  | pustakawan  | 5678901234567890 Adit     |
--    | penjual     | staff123  | penjual     | 4567890123456789 Agung    |
--    | pengunjung  | lihat123  | pengunjung  | 1234567890123456 Ahmad    |
--    +-------------+-----------+-------------+---------------------------+
--
--  Peran 'pengunjung' = MODE LIHAT-SAJA (read-only): bisa menelusuri
--  katalog buku, menu kantin, dasbor, dan laporan; tidak bisa menambah,
--  mengubah, atau menghapus apa pun.
-- =====================================================================
USE pustarasa;

INSERT INTO app_account (username, password_hash, full_name, role, staff_nik, is_active) VALUES
('admin', '$2a$10$/kJlQXXV1Y4qM.geBmUtguObwSaP0TpDiEJIPlFbCq12GL77AeAZK', 'Administrator Sistem', 'admin', NULL, 1),
('pustakawan', '$2a$10$uWhcnD4/21bJ6L9Y1z5ib.K9WRl6fvrUxAEzTaj2hCTQyMMOUoLJK', 'Adit Pratama', 'pustakawan', '5678901234567890', 1),
('penjual', '$2a$10$jsLZEek.Hmz5kqcefCdEhuvLZPAo89V9lv5z.ppd.JkF0RpAR2LCi', 'Agung Pratama', 'penjual', '4567890123456789', 1),
('pengunjung', '$2a$10$KOUTOdHO9s8T3s1wZfgDw.NQCGv6pjJz.K.N.D3LTopJMfYe9E2w2', 'Ahmad Zaki', 'pengunjung', '1234567890123456', 1);
