-- ==========================================
-- ADD NEW DRIVER VERIFICATION DOCUMENTS
-- ==========================================

-- 1. Add new columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS vehicle_front_url TEXT,
ADD COLUMN IF NOT EXISTS stnk_url TEXT,
ADD COLUMN IF NOT EXISTS tnkb_url TEXT;

-- 2. Update the register_driver RPC to handle new fields
CREATE OR REPLACE FUNCTION public.register_driver(
  p_user_id UUID,
  p_full_name TEXT,
  p_phone_number TEXT,
  p_vehicle_type TEXT,
  p_selfie_url TEXT,
  p_ktp_url TEXT,
  p_sim_url TEXT,
  p_vehicle_front_url TEXT,
  p_stnk_url TEXT,
  p_tnkb_url TEXT
)
RETURNS void AS $$
BEGIN
  -- Insert/update profile (bypass RLS)
  INSERT INTO public.profiles (
    id, 
    full_name, 
    phone_number, 
    role, 
    vehicle_type, 
    selfie_url, 
    ktp_url, 
    sim_url, 
    vehicle_front_url,
    stnk_url,
    tnkb_url,
    is_verified, 
    verification_status
  )
  VALUES (
    p_user_id, 
    p_full_name, 
    p_phone_number, 
    'DRIVER', 
    p_vehicle_type, 
    p_selfie_url, 
    p_ktp_url, 
    p_sim_url, 
    p_vehicle_front_url,
    p_stnk_url,
    p_tnkb_url,
    false, 
    'PENDING'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone_number = EXCLUDED.phone_number,
    vehicle_type = EXCLUDED.vehicle_type,
    selfie_url = EXCLUDED.selfie_url,
    ktp_url = EXCLUDED.ktp_url,
    sim_url = EXCLUDED.sim_url,
    vehicle_front_url = EXCLUDED.vehicle_front_url,
    stnk_url = EXCLUDED.stnk_url,
    tnkb_url = EXCLUDED.tnkb_url,
    verification_status = 'PENDING',
    is_verified = false;

  -- Create wallet (bypass RLS)
  INSERT INTO public.wallets (user_id, balance)
  VALUES (p_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
