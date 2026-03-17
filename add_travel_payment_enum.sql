-- Menambahkan tipe 'TRAVEL_PAYMENT' ke dalam enum trx_type di Supabase
ALTER TYPE public.trx_type ADD VALUE IF NOT EXISTS 'TRAVEL_PAYMENT';
