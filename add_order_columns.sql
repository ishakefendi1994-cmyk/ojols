-- ==========================================
-- MIGRASI: Tambah kolom ke tabel orders
-- Jalankan SEKALI di Supabase SQL Editor
-- ==========================================
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS item_total NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivery_fee_amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS merchant_commission NUMERIC DEFAULT 0;
