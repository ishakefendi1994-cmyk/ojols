-- Menambahkan status/tipe 'SUBSCRIPTION' ke dalam koleksi enum trx_type di Supabase
ALTER TYPE public.trx_type ADD VALUE IF NOT EXISTS 'SUBSCRIPTION';
