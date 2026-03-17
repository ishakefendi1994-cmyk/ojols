-- Cek isi enum trx_type
SELECT n.nspname as schema, t.typname as type_name, e.enumlabel as value
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
WHERE t.typname = 'trx_type';

-- Cek apakah ada data di tabel transactions dengan type RENTAL_PAYMENT
SELECT count(*) FROM public.transactions WHERE type = 'RENTAL_PAYMENT';
SELECT * FROM public.transactions WHERE type = 'RENTAL_PAYMENT' LIMIT 5;
