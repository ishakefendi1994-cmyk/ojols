-- ==========================================
-- ENABLE REALTIME FOR CHAT TABLES
-- ==========================================

-- Pastikan tabel masuk ke publikasi supabase_realtime
-- Agar listen postgres_changes berfungsi
ALTER PUBLICATION supabase_realtime ADD TABLE chats;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- Set replica identity to FULL to ensure all columns are available in payload
-- (Sangat disarankan jika melakukan filter pada kolom non-primary key)
ALTER TABLE public.chats REPLICA IDENTITY FULL;
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
