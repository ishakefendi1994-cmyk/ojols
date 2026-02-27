-- Fungsi untuk menambah saldo secara aman (Atomic Increment)
CREATE OR REPLACE FUNCTION public.increment_wallet_balance(wallet_id UUID, amount NUMERIC)
RETURNS VOID AS $$
BEGIN
    UPDATE public.wallets
    SET balance = balance + amount
    WHERE id = wallet_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
