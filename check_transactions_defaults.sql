-- Cek secara spesifik default value dan nullability kolom order_id
SELECT 
    column_name, 
    is_nullable, 
    column_default,
    data_type
FROM 
    information_schema.columns 
WHERE 
    table_name = 'transactions' 
    AND column_name = 'order_id'
    AND table_schema = 'public';

-- Cek apakah ada data di tabel orders (pastikan tabelnya tidak kosong sama sekali)
SELECT count(*) as total_orders FROM public.orders;
