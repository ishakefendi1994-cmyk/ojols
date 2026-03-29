-- Update Trigger untuk membedakan Top Up Manual dan Otomatis (Duitku)
CREATE OR REPLACE FUNCTION public.handle_topup_approval()
RETURNS TRIGGER AS $$
DECLARE
    v_wallet_id UUID;
    v_desc TEXT;
BEGIN
    IF (OLD.status = 'PENDING' AND NEW.status = 'APPROVED') THEN
        SELECT id INTO v_wallet_id FROM public.wallets WHERE user_id = NEW.user_id;
        
        UPDATE public.wallets
        SET balance = balance + NEW.amount
        WHERE id = v_wallet_id;

        IF NEW.payment_url IS NOT NULL THEN
            v_desc := 'Topup Otomatis (Duitku)';
        ELSE
            v_desc := 'Top Up Manual (Approved)';
        END IF;

        INSERT INTO public.transactions (wallet_id, type, amount, description)
        VALUES (v_wallet_id, 'TOPUP', NEW.amount, v_desc);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
