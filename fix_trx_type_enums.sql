-- Menambahkan tipe transaksi baru ke dalam enum trx_type di Supabase
ALTER TYPE public.trx_type ADD VALUE IF NOT EXISTS 'RENTAL_PAYMENT';
ALTER TYPE public.trx_type ADD VALUE IF NOT EXISTS 'TRAVEL_PAYMENT';
ALTER TYPE public.trx_type ADD VALUE IF NOT EXISTS 'FEE_DEDUCTION';
ALTER TYPE public.trx_type ADD VALUE IF NOT EXISTS 'OFFLINE_PAYMENT';
