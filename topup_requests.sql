-- Tabel untuk Request Top-up Manual
CREATE TYPE topup_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE public.topup_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    proof_url TEXT NOT NULL, -- URL gambar bukti bayar (Cloudinary/Supabase Storage)
    status topup_status DEFAULT 'PENDING' NOT NULL,
    admin_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS untuk topup_requests
ALTER TABLE public.topup_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own topup requests"
ON public.topup_requests FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own topup requests"
ON public.topup_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Trigger untuk otomatis update balance saat APPROVED
CREATE OR REPLACE FUNCTION public.handle_topup_approval()
RETURNS TRIGGER AS $$
DECLARE
    v_wallet_id UUID;
BEGIN
    IF (OLD.status = 'PENDING' AND NEW.status = 'APPROVED') THEN
        -- 1. Ambil Wallet ID
        SELECT id INTO v_wallet_id FROM public.wallets WHERE user_id = NEW.user_id;

        -- 2. Tambah Saldo Wallet
        UPDATE public.wallets
        SET balance = balance + NEW.amount
        WHERE id = v_wallet_id;

        -- 3. Catat di Tabel Transactions
        INSERT INTO public.transactions (wallet_id, type, amount, description)
        VALUES (v_wallet_id, 'TOPUP', NEW.amount, 'Top up saldo manual (Approved)');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_handle_topup_approval
    AFTER UPDATE ON public.topup_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_topup_approval();
