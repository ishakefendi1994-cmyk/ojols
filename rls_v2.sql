-- ==========================================
-- SQL FIX RLS V2: TOPUP REQUESTS & TRANSACTIONS
-- Jalankan di SQL Editor Supabase
-- ==========================================

-- 1. Aktifkan RLS
ALTER TABLE public.topup_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- 2. Kebijakan untuk TOPUP_REQUESTS
DROP POLICY IF EXISTS "Users can view their own topup requests" ON public.topup_requests;
CREATE POLICY "Users can view their own topup requests"
ON public.topup_requests FOR SELECT
USING (auth.uid() = user_id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ADMIN');

DROP POLICY IF EXISTS "Users can insert their own topup requests" ON public.topup_requests;
CREATE POLICY "Users can insert their own topup requests"
ON public.topup_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 3. Kebijakan untuk TRANSACTIONS (PENTING!)
-- User bisa melihat transaksi miliknya sendiri melalui kepemilikan Wallet
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
CREATE POLICY "Users can view own transactions"
ON public.transactions FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.wallets
        WHERE wallets.id = transactions.wallet_id
        AND wallets.user_id = auth.uid()
    )
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ADMIN'
);

-- 4. Kebijakan untuk WALLETS
DROP POLICY IF EXISTS "Users can view own wallet" ON public.wallets;
CREATE POLICY "Users can view own wallet"
ON public.wallets FOR SELECT
USING (auth.uid() = user_id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ADMIN');

-- Pastikan tabel topup_requests bisa dibuat requestnya
GRANT ALL ON public.topup_requests TO authenticated;
GRANT ALL ON public.transactions TO authenticated;
GRANT ALL ON public.wallets TO authenticated;
