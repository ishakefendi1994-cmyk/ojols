-- ==============================================================
-- Fix Admin Edit/Delete / Create Subscription Plans
-- ==============================================================

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Memberikan izin kepada siapapun (termasuk Admin di web) untuk menambah/edit/hapus paket
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.subscription_plans;
CREATE POLICY "Enable insert for authenticated users only" ON public.subscription_plans FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.subscription_plans;
CREATE POLICY "Enable update for authenticated users only" ON public.subscription_plans FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.subscription_plans;
CREATE POLICY "Enable delete for authenticated users only" ON public.subscription_plans FOR DELETE USING (true);
