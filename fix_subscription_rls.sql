-- ==============================================================
-- Fix RLS for Driver Subscriptions & Transactions
-- ==============================================================

-- 1. Pastikan Driver bisa INNSERT ke driver_subscriptions miliknya sendiri
ALTER TABLE public.driver_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Drivers can insert their own subscriptions" ON public.driver_subscriptions;
CREATE POLICY "Drivers can insert their own subscriptions" ON public.driver_subscriptions
FOR INSERT WITH CHECK (driver_id = auth.uid());

-- 2. Pastikan Driver bisa UPDATE profilenya (subscription_end_date)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Drivers can update their own profile" ON public.profiles;
CREATE POLICY "Drivers can update their own profile" ON public.profiles
FOR UPDATE USING (id = auth.uid());

-- 3. Pastikan Driver bisa INSERT Transactions jenis apapun ke dompetnya
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.transactions;
CREATE POLICY "Users can insert their own transactions" ON public.transactions
FOR INSERT WITH CHECK (
    wallet_id IN (SELECT id FROM public.wallets WHERE user_id = auth.uid())
);
