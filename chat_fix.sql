-- ==========================================
-- FIX RLS CHATS: Izinkan User Membuat Record Chat
-- ==========================================

-- Izinkan user (Customer/Driver) membuat record chat baru
-- Syarat: Dia harus salah satu dari participant_a atau participant_b
DROP POLICY IF EXISTS "Users can insert their own chats" ON public.chats;
CREATE POLICY "Users can insert their own chats" 
ON public.chats FOR INSERT 
WITH CHECK (
    auth.uid() = participant_a OR auth.uid() = participant_b
);

-- Pastikan policy SELECT juga sudah benar (re-apply agar yakin)
DROP POLICY IF EXISTS "Users can only see their own chats" ON public.chats;
CREATE POLICY "Users can only see their own chats" 
ON public.chats FOR SELECT 
USING (auth.uid() = participant_a OR auth.uid() = participant_b);

-- Tambahkan policy DELETE untuk jaga-jaga kalau mau dibersihkan nanti
DROP POLICY IF EXISTS "Users can delete their own chats" ON public.chats;
CREATE POLICY "Users can delete their own chats" 
ON public.chats FOR DELETE 
USING (auth.uid() = participant_a OR auth.uid() = participant_b);
