-- Cek 10 transaksi terakhir untuk melihat apa yang tersimpan
SELECT 
    t.created_at, 
    t.amount, 
    t.type, 
    t.description, 
    w.user_id,
    p.full_name as owner_name
FROM public.transactions t
JOIN public.wallets w ON t.wallet_id = w.id
JOIN public.profiles p ON w.user_id = p.id
ORDER BY t.created_at DESC
LIMIT 10;

-- Cek status booking travel yang baru saja diproses
SELECT id, passenger_name, payment_method, payment_status, total_price, driver_share, app_fee
FROM public.travel_bookings
ORDER BY created_at DESC
LIMIT 5;
