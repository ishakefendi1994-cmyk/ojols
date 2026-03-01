-- ==========================================
-- FIX: Auto-create wallet saat profil dibuat
-- Jalankan di Supabase SQL Editor
-- ==========================================

-- Fungsi: Buat wallet otomatis saat ada profile baru
CREATE OR REPLACE FUNCTION public.handle_new_profile_wallet()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert wallet jika belum ada
    INSERT INTO public.wallets (user_id, balance)
    VALUES (NEW.id, 0)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pada tabel profiles
DROP TRIGGER IF EXISTS trg_create_wallet_on_profile ON public.profiles;
CREATE TRIGGER trg_create_wallet_on_profile
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_profile_wallet();
