-- ============================================================
-- ADD SEWA DRIVER TO SERVICES TABLE
-- ============================================================

INSERT INTO public.services (name, is_active, base_price, price_per_km, admin_fee_percentage)
VALUES ('Sewa Driver', true, 0, 0, 10)
ON CONFLICT (name) DO UPDATE SET is_active = true;

-- Update RLS if needed (usually already handled)
GRANT ALL ON public.services TO authenticated;
GRANT ALL ON public.services TO anon;
