-- ==========================================
-- MIGRASI: Tambah kolom verifikasi driver
-- Jalankan SEKALI di Supabase SQL Editor
-- ==========================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ktp_url TEXT,
  ADD COLUMN IF NOT EXISTS sim_url TEXT,
  ADD COLUMN IF NOT EXISTS selfie_url TEXT,
  ADD COLUMN IF NOT EXISTS vehicle_type TEXT DEFAULT 'MOTOR',
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS accepted_services TEXT[] DEFAULT '{}';
