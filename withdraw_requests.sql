-- 0. Fix trx_type enum to include WITHDRAWAL and REFUND
-- Run this individually if it errors in a transaction block
DO $$ BEGIN
    ALTER TYPE public.trx_type ADD VALUE 'WITHDRAWAL';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TYPE public.trx_type ADD VALUE 'REFUND';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Create Status Enum for Withdrawals
DO $$ BEGIN
    CREATE TYPE public.withdraw_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create the withdraw_requests table
CREATE TABLE IF NOT EXISTS public.withdraw_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    account_name TEXT NOT NULL,
    status public.withdraw_status DEFAULT 'PENDING' NOT NULL,
    proof_url TEXT, -- Proof of transfer uploaded by admin
    admin_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RLS for withdraw_requests
ALTER TABLE public.withdraw_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own withdraw requests" ON public.withdraw_requests;
CREATE POLICY "Users can view their own withdraw requests"
ON public.withdraw_requests FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own withdraw requests" ON public.withdraw_requests;
CREATE POLICY "Users can insert their own withdraw requests"
ON public.withdraw_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 4. Trigger to handle balance deduction and refunds
CREATE OR REPLACE FUNCTION public.handle_withdraw_request()
RETURNS TRIGGER AS $$
DECLARE
    v_wallet_id UUID;
    v_current_balance NUMERIC;
BEGIN
    -- [Case 1] NEW REQUEST - Deduct balance immediately
    IF (TG_OP = 'INSERT') THEN
        SELECT id, balance INTO v_wallet_id, v_current_balance 
        FROM public.wallets WHERE user_id = NEW.user_id;

        IF v_current_balance < NEW.amount THEN
            RAISE EXCEPTION 'Saldo tidak mencukupi untuk penarikan ini';
        END IF;

        -- Deduct from wallet
        UPDATE public.wallets
        SET balance = balance - NEW.amount
        WHERE id = v_wallet_id;

        -- Record transaction
        INSERT INTO public.transactions (wallet_id, type, amount, description)
        VALUES (v_wallet_id, 'WITHDRAWAL', -NEW.amount, 'Pengajuan penarikan saldo (Pending)');

    -- [Case 2] REJECTED - Refund balance
    ELSIF (TG_OP = 'UPDATE') THEN
        IF (OLD.status = 'PENDING' AND NEW.status = 'REJECTED') THEN
            SELECT id INTO v_wallet_id FROM public.wallets WHERE user_id = NEW.user_id;

            -- Refund to wallet
            UPDATE public.wallets
            SET balance = balance + NEW.amount
            WHERE id = v_wallet_id;

            -- Record refund transaction
            INSERT INTO public.transactions (wallet_id, type, amount, description)
            VALUES (v_wallet_id, 'REFUND', NEW.amount, 'Refund penarikan saldo (Ditolak)');
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_handle_withdraw_request ON public.withdraw_requests;
CREATE TRIGGER trg_handle_withdraw_request
    BEFORE INSERT OR UPDATE ON public.withdraw_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_withdraw_request();
