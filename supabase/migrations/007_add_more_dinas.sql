-- Migration: Add more dinas for better routing
-- Date: 2025-12-10

-- Add new dinas entries (password is hashed version of 'demo2025')
INSERT INTO dinas (id, name, password_hash, categories, phone) VALUES
('dishub', 'Dinas Perhubungan Kota Bandung', '$2b$10$MZ7JjsTpRf66T0nN1.BX9uP9Mj9hubQ34je3DKg/.Z4OdsPZUzgEG', ARRAY['INFRA'], NULL),
('dinkes', 'Dinas Kesehatan Kota Bandung', '$2b$10$MZ7JjsTpRf66T0nN1.BX9uP9Mj9hubQ34je3DKg/.Z4OdsPZUzgEG', ARRAY['SOSIAL'], NULL),
('disperkimtan', 'Dinas Perumahan & Pertanahan Kota Bandung', '$2b$10$MZ7JjsTpRf66T0nN1.BX9uP9Mj9hubQ34je3DKg/.Z4OdsPZUzgEG', ARRAY['LAINNYA'], NULL),
('satpolpp', 'Satuan Polisi Pamong Praja Kota Bandung', '$2b$10$MZ7JjsTpRf66T0nN1.BX9uP9Mj9hubQ34je3DKg/.Z4OdsPZUzgEG', ARRAY['SOSIAL'], NULL),
('disdik', 'Dinas Pendidikan Kota Bandung', '$2b$10$MZ7JjsTpRf66T0nN1.BX9uP9Mj9hubQ34je3DKg/.Z4OdsPZUzgEG', ARRAY['LAINNYA'], NULL),
('pdam', 'PDAM Tirtawening Kota Bandung', '$2b$10$MZ7JjsTpRf66T0nN1.BX9uP9Mj9hubQ34je3DKg/.Z4OdsPZUzgEG', ARRAY['INFRA'], NULL),
('dispangtan', 'Dinas Pangan & Pertanian Kota Bandung', '$2b$10$MZ7JjsTpRf66T0nN1.BX9uP9Mj9hubQ34je3DKg/.Z4OdsPZUzgEG', ARRAY['LAINNYA'], NULL)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, categories = EXCLUDED.categories;
