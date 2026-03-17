-- ============================================================
-- FIX RLS: ALLOW ADMIN TO VIEW PROFILES (NON-RECURSIVE)
-- ============================================================

-- 1. Create a security definer function to check role without recursion
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid());
END;
$$;

-- 2. Apply fixed policy to profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (get_my_role() = 'ADMIN');

-- 3. Ensure other policies exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
