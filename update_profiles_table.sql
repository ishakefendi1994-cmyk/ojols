-- Add email column to profiles table to support login by phone
ALTER TABLE IF EXISTS public.profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Update existing profiles with emails from auth.users (requires admin/superuser)
-- NOTE: This part might only work if run by a superuser in the SQL Editor.
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;

-- Ensure it's indexed for fast login lookups
CREATE INDEX IF NOT EXISTS idx_profiles_phone_number ON public.profiles(phone_number);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Add wa_verified column for 2FA tracking
ALTER TABLE IF EXISTS public.profiles 
ADD COLUMN IF NOT EXISTS wa_verified BOOLEAN DEFAULT FALSE;
