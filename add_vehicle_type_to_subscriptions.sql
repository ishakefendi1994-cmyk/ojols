-- ==============================================================
-- Update `subscription_plans` to support vehicle separation
-- ==============================================================
ALTER TABLE public.subscription_plans
ADD COLUMN IF NOT EXISTS vehicle_type VARCHAR(50); -- 'MOTOR', 'CAR', or NULL (All)

-- (Opsional) Update data lama jika ingin di-set default menjadi null (Bisa dibeli semua orang)
-- UPDATE public.subscription_plans SET vehicle_type = NULL WHERE vehicle_type IS NULL;
