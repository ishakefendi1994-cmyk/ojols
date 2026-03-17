-- 1. Cek struktur kolom tabel transactions
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM 
    information_schema.columns 
WHERE 
    table_name = 'transactions' 
    AND table_schema = 'public';

-- 2. Cek semua constraint
SELECT 
    conname, 
    pg_get_constraintdef(c.oid) 
FROM 
    pg_constraint c 
JOIN 
    pg_namespace n ON n.oid = c.connamespace 
WHERE 
    contype IN ('f', 'p', 'c', 'u') 
    AND n.nspname = 'public' 
    AND conname LIKE '%transactions%';

-- 3. Cek SEMUA trigger di database
SELECT
    event_object_table AS table_name,
    trigger_name,
    event_manipulation AS event,
    action_timing AS timing
FROM information_schema.triggers
WHERE event_object_schema = 'public'
ORDER BY table_name, event;
