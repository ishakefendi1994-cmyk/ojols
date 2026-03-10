-- Perbarui Foreign Key pada ppob_transactions agar mengarah ke profiles bukan auth.users
ALTER TABLE public.ppob_transactions DROP CONSTRAINT IF EXISTS ppob_transactions_user_id_fkey;
ALTER TABLE public.ppob_transactions ADD CONSTRAINT ppob_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
