-- FIX for "no unique constraint matching ON CONFLICT"
-- Run this in Supabase SQL Editor

-- 1. Fix otp_verifications table
-- Hapus constraint lama jika ada (optional)
-- Lalu tambahkan UNIQUE constraint pada kolom phone agar UPSERT bisa mengenali mana yang harus diupdate
ALTER TABLE IF EXISTS public.otp_verifications 
ADD CONSTRAINT otp_verifications_phone_unique UNIQUE (phone);

-- 2. Pastikan tabel profiles punya kolom wa_verified
ALTER TABLE IF EXISTS public.profiles 
ADD COLUMN IF NOT EXISTS wa_verified BOOLEAN DEFAULT FALSE;

-- 3. Pastikan profiles.id adalah primary key atau unik (biasanya sudah otomatis)
-- Tapi jika error berlanjut, jalankan:
-- ALTER TABLE public.profiles ADD PRIMARY KEY (id); 

-- 4. Tambahan: Beri izin publik untuk insert ke otp_verifications agar user anon/login bisa minta OTP
-- (Karena OTP generation butuh akses sebelum session admin terbentuk kadang-kadang)
-- Namun di backend kita pakai service_role (supabaseAdmin), jadi RLS ini opsional jika backend sudah full akses.
