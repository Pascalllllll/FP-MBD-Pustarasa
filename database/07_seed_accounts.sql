-- =====================================================================
--  PustaRasa · 07_seed_accounts.sql — akun login (bcrypt, cost 10).
--  Default (GANTI sebelum dipakai sungguhan!): admin/admin123, pustakawan
--  & penjual/staff123, pengunjung/lihat123 (peran pengunjung = lihat-saja).
-- =====================================================================
USE pustarasa;

INSERT INTO app_account (username, password_hash, full_name, role, staff_nik, is_active) VALUES
('admin', '$2a$10$/kJlQXXV1Y4qM.geBmUtguObwSaP0TpDiEJIPlFbCq12GL77AeAZK', 'Administrator Sistem', 'admin', NULL, 1),
('pustakawan', '$2a$10$uWhcnD4/21bJ6L9Y1z5ib.K9WRl6fvrUxAEzTaj2hCTQyMMOUoLJK', 'Adit Pratama', 'pustakawan', '5678901234567890', 1),
('penjual', '$2a$10$jsLZEek.Hmz5kqcefCdEhuvLZPAo89V9lv5z.ppd.JkF0RpAR2LCi', 'Agung Pratama', 'penjual', '4567890123456789', 1),
('pengunjung', '$2a$10$KOUTOdHO9s8T3s1wZfgDw.NQCGv6pjJz.K.N.D3LTopJMfYe9E2w2', 'Ahmad Zaki', 'pengunjung', '1234567890123456', 1);
