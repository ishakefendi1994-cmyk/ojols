-- 1. Cabut keharusan NOT NULL jika ada
ALTER TABLE public.transactions ALTER COLUMN order_id DROP NOT NULL;

-- 2. Hapus constraint lama dan buat baru yang lebih toleran
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_order_id_fkey;

-- 3. Tambahkan kembali dengan eksplisit mendukung NULL
-- Secara default PostgreSQL memperbolehkan NULL di FK, 
-- tapi ini meyakinkan state tabel.
ALTER TABLE public.transactions 
ADD CONSTRAINT transactions_order_id_fkey 
FOREIGN KEY (order_id) 
REFERENCES public.orders(id) 
ON DELETE SET NULL;
