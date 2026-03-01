-- ==========================================
-- FIX RLS: Buat RPC function register_driver
-- Jalankan di Supabase SQL Editor
-- ==========================================

CREATE OR REPLACE FUNCTION public.register_driver(
  p_user_id UUID,
  p_full_name TEXT,
  p_phone_number TEXT,
  p_vehicle_type TEXT,
  p_selfie_url TEXT,
  p_ktp_url TEXT,
  p_sim_url TEXT
)
RETURNS void AS $$
BEGIN
  -- Insert/update profile (bypass RLS)
  INSERT INTO public.profiles (id, full_name, phone_number, role, vehicle_type, selfie_url, ktp_url, sim_url, is_verified, verification_status)
  VALUES (p_user_id, p_full_name, p_phone_number, 'DRIVER', p_vehicle_type, p_selfie_url, p_ktp_url, p_sim_url, false, 'PENDING')
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone_number = EXCLUDED.phone_number,
    vehicle_type = EXCLUDED.vehicle_type,
    selfie_url = EXCLUDED.selfie_url,
    ktp_url = EXCLUDED.ktp_url,
    sim_url = EXCLUDED.sim_url,
    verification_status = 'PENDING',
    is_verified = false;

  -- Create wallet (bypass RLS)
  INSERT INTO public.wallets (user_id, balance)
  VALUES (p_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
