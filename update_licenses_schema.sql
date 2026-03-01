-- Jalankan script ini di Supabase SQL Editor untuk menambahkan kolom yang kurang
-- tanpa menghapus data lisensi yang sudah ada

ALTER TABLE licenses ADD COLUMN IF NOT EXISTS package_name TEXT;
