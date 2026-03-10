-- ===================================================
-- PPOB SCHEMA (Pulsa & Token PLN)
-- ===================================================

-- 1. Tabel Produk PPOB (Untuk Cache/Daftar tampilan)
CREATE TABLE IF NOT EXISTS public.ppob_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_code VARCHAR(50) UNIQUE NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'pulsa', 'pln', 'data', dll
    brand VARCHAR(50) NOT NULL, -- 'telkomsel', 'indosat', dll (dari digiflazz)
    type VARCHAR(50), -- 'Umum', 'Promo', dll
    seller_name VARCHAR(100),
    provider_price NUMERIC NOT NULL DEFAULT 0, -- Harga asli digiflazz
    markup NUMERIC NOT NULL DEFAULT 0, -- Keuntungan kita
    price NUMERIC NOT NULL DEFAULT 0, -- provider_price + markup
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabel Transaksi PPOB
CREATE TABLE IF NOT EXISTS public.ppob_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    ref_id VARCHAR(100) UNIQUE NOT NULL, -- ID dari aplikasi (idempotensi)
    product_code VARCHAR(50) NOT NULL,
    customer_no VARCHAR(50) NOT NULL, -- Nomor HP atau ID Pelanggan PLN
    amount NUMERIC NOT NULL, -- Harga beli oleh user
    status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'SUCCESS', 'FAILED'
    serial_number VARCHAR(255), -- SN dari provider
    provider_ref_id VARCHAR(100), -- ID dari Digiflazz
    notes TEXT, -- Pesan dari Digiflazz
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Aktifkan RLS
ALTER TABLE public.ppob_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ppob_transactions ENABLE ROW LEVEL SECURITY;

-- 4. Kebijakan RLS
-- Produk bisa dilihat oleh semua pengguna terautentikasi
DROP POLICY IF EXISTS "Anyone can view active products" ON public.ppob_products;
CREATE POLICY "Anyone can view active products" 
ON public.ppob_products FOR SELECT 
USING (is_active = true);

-- Transaksi hanya bisa dilihat oleh pemiliknya atau admin
DROP POLICY IF EXISTS "Users can view own ppob transactions" ON public.ppob_transactions;
CREATE POLICY "Users can view own ppob transactions" 
ON public.ppob_transactions FOR SELECT 
USING (auth.uid() = user_id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ADMIN');

-- 5. Fungsi Atomik untuk Order PPOB
-- Fungsi ini akan: Cek saldo -> Buat record transaksi -> Potong saldo
CREATE OR REPLACE FUNCTION public.create_ppob_order(
    p_product_code VARCHAR,
    p_customer_no VARCHAR,
    p_amount NUMERIC,
    p_ref_id VARCHAR
) RETURNS UUID AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_wallet_id UUID;
    v_balance NUMERIC;
    v_transaction_id UUID;
BEGIN
    -- 1. Dapatkan Wallet ID dan Balance
    SELECT id, balance INTO v_wallet_id, v_balance 
    FROM public.wallets 
    WHERE user_id = v_user_id
    FOR UPDATE; -- Lock row untuk konsistensi

    -- 2. Validasi Saldo
    IF v_balance < p_amount THEN
        RAISE EXCEPTION 'Saldo tidak cukup';
    END IF;

    -- 3. Masukkan record transaksi PPOB
    INSERT INTO public.ppob_transactions (user_id, ref_id, product_code, customer_no, amount, status)
    VALUES (v_user_id, p_ref_id, p_product_code, p_customer_no, p_amount, 'PENDING')
    RETURNING id INTO v_transaction_id;

    -- 4. Potong saldo wallet
    UPDATE public.wallets 
    SET balance = balance - p_amount 
    WHERE id = v_wallet_id;

    -- 5. Catat ke tabel history transaksi umum (jika diperlukan)
    -- Asumsi ada tabel public.transactions untuk history umum
    INSERT INTO public.transactions (wallet_id, amount, type, description, reference_id)
    VALUES (v_wallet_id, -p_amount, 'PPOB', 'Pembelian PPOB: ' || p_product_code || ' (' || p_customer_no || ')', v_transaction_id);

    RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Grant Access
GRANT SELECT ON public.ppob_products TO authenticated;
GRANT SELECT ON public.ppob_transactions TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_ppob_order TO authenticated;
