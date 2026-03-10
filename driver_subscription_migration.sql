-- ==============================================================
-- 1. Tambah kolom `subscription_end_date` ke tabel `profiles`
-- ==============================================================
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMPTZ;

-- ==============================================================
-- 2. Buat tabel `subscription_plans`
-- ==============================================================
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    duration_days INT NOT NULL,
    price NUMERIC NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================
-- 3. Insert default subscription plans (Opsional)
-- ==============================================================
INSERT INTO public.subscription_plans (name, duration_days, price)
VALUES 
  ('Paket 1 Hari', 1, 10000),
  ('Paket 3 Hari', 3, 25000),
  ('Paket 7 Hari', 7, 50000)
ON CONFLICT DO NOTHING;

-- ==============================================================
-- 4. Buat tabel `driver_subscriptions`
-- ==============================================================
CREATE TABLE IF NOT EXISTS public.driver_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    driver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
    price_paid NUMERIC NOT NULL,
    start_date TIMESTAMPTZ DEFAULT now(),
    end_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================
-- 5. Perbarui Fungsi `handle_order_settlement`
-- ==============================================================
CREATE OR REPLACE FUNCTION public.handle_order_settlement()
RETURNS TRIGGER AS $$
DECLARE
    v_customer_wallet_id UUID;
    v_driver_wallet_id   UUID;
    v_merchant_wallet_id UUID;
    v_driver_earning     NUMERIC;
    v_merchant_earning   NUMERIC;
    v_item_total         NUMERIC;
    v_delivery_fee       NUMERIC;
    v_merchant_comm      NUMERIC;
    v_admin_fee          NUMERIC;
    v_service_fee        NUMERIC;
    v_has_merchant       BOOLEAN;
    v_driver_sub_end     TIMESTAMPTZ;
BEGIN
    IF (OLD.status != 'COMPLETED' AND NEW.status = 'COMPLETED') THEN

        -- Ambil Wallet IDs
        SELECT id INTO v_customer_wallet_id FROM public.wallets WHERE user_id = NEW.customer_id;
        SELECT id INTO v_driver_wallet_id   FROM public.wallets WHERE user_id = NEW.driver_id;

        -- Ambil masa aktif langganan driver
        SELECT subscription_end_date INTO v_driver_sub_end FROM public.profiles WHERE id = NEW.driver_id;

        -- Cek apakah ada merchant (Food/Shop order)
        v_has_merchant := (NEW.merchant_id IS NOT NULL);

        IF v_has_merchant THEN
            SELECT id INTO v_merchant_wallet_id FROM public.wallets WHERE user_id = NEW.merchant_id;
        END IF;

        -- Ambil nilai-nilai dari order
        v_item_total    := COALESCE(NEW.item_total, 0);
        v_delivery_fee  := COALESCE(NEW.delivery_fee_amount, 0);
        v_merchant_comm := COALESCE(NEW.merchant_commission, 0);
        v_service_fee   := COALESCE(NEW.service_fee, 0);  -- biaya layanan app
        
        -- Cek Langganan Driver untuk Fee Admin
        -- Jika langganan masih aktif (> NOW()), set admin_fee = 0
        IF v_driver_sub_end IS NOT NULL AND v_driver_sub_end > NOW() THEN
            v_admin_fee := 0;
        ELSE
            v_admin_fee := COALESCE(NEW.admin_fee, 0);    -- default potongan admin
        END IF;

        -- Fallback: Jika ongkir 0 dan bukan merchant (ojek/mobil), hitung dari total_price
        IF v_delivery_fee = 0 AND NOT v_has_merchant THEN
            v_delivery_fee := NEW.total_price - v_service_fee;
        END IF;

        -- Hitung pendapatan bersih driver (ongkir - fee platform)
        v_driver_earning := v_delivery_fee - v_admin_fee;
        IF v_driver_earning < 0 THEN v_driver_earning := 0; END IF;

        -- Hitung pendapatan bersih merchant (item total - komisi)
        v_merchant_earning := v_item_total - v_merchant_comm;
        IF v_merchant_earning < 0 THEN v_merchant_earning := 0; END IF;

        -- ============================================================
        -- METODE PEMBAYARAN: WALLET
        -- ============================================================
        IF NEW.payment_method = 'WALLET' THEN

            -- 1. Potong saldo Customer (total tagihan)
            UPDATE public.wallets
            SET balance = balance - NEW.total_price
            WHERE id = v_customer_wallet_id;

            INSERT INTO public.transactions (wallet_id, order_id, type, amount, description)
            VALUES (v_customer_wallet_id, NEW.id, 'PAYMENT', -NEW.total_price,
                    'Pembayaran order #' || NEW.id);

            -- 2. Tambah saldo Driver (ongkir bersih setelah fee)
            UPDATE public.wallets
            SET balance = balance + v_driver_earning
            WHERE id = v_driver_wallet_id;

            INSERT INTO public.transactions (wallet_id, order_id, type, amount, description)
            VALUES (v_driver_wallet_id, NEW.id, 'PAYMENT', v_driver_earning,
                    'Pendapatan ongkir order #' || NEW.id);

            -- 3. Tambah saldo Merchant jika ada (item total - komisi)
            IF v_has_merchant AND v_merchant_wallet_id IS NOT NULL AND v_merchant_earning > 0 THEN
                UPDATE public.wallets
                SET balance = balance + v_merchant_earning
                WHERE id = v_merchant_wallet_id;

                INSERT INTO public.transactions (wallet_id, order_id, type, amount, description)
                VALUES (v_merchant_wallet_id, NEW.id, 'PAYMENT', v_merchant_earning,
                        'Pendapatan penjualan order #' || NEW.id);
            END IF;

        -- ============================================================
        -- METODE PEMBAYARAN: TUNAI (CASH)
        -- ============================================================
        ELSE
            -- Driver terima uang cash → setor admin_fee ke platform
            IF v_admin_fee > 0 THEN
                UPDATE public.wallets
                SET balance = balance - v_admin_fee
                WHERE id = v_driver_wallet_id;

                INSERT INTO public.transactions (wallet_id, order_id, type, amount, description)
                VALUES (v_driver_wallet_id, NEW.id, 'FEE_DEDUCTION', -v_admin_fee,
                        'Potongan fee platform order tunai #' || NEW.id);
            END IF;

            -- Merchant terima cash → setor komisi ke platform
            IF v_has_merchant AND v_merchant_wallet_id IS NOT NULL AND v_merchant_comm > 0 THEN
                UPDATE public.wallets
                SET balance = balance - v_merchant_comm
                WHERE id = v_merchant_wallet_id;

                INSERT INTO public.transactions (wallet_id, order_id, type, amount, description)
                VALUES (v_merchant_wallet_id, NEW.id, 'FEE_DEDUCTION', -v_merchant_comm,
                        'Komisi platform order tunai #' || NEW.id);
            END IF;

        END IF;

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Buat ulang trigger
DROP TRIGGER IF EXISTS trg_order_settlement ON public.orders;
CREATE TRIGGER trg_order_settlement
    AFTER UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_order_settlement();

-- ==============================================================
-- 6. Setup RLS (Bypass for trigger safety, read for public)
-- ==============================================================
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Subscription Plans are viewable by everyone" ON public.subscription_plans;
CREATE POLICY "Subscription Plans are viewable by everyone" ON public.subscription_plans FOR SELECT USING (true);

ALTER TABLE public.driver_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Drivers can view their own subscriptions" ON public.driver_subscriptions;
DROP POLICY IF EXISTS "Everyone can view subscriptions" ON public.driver_subscriptions;
CREATE POLICY "Everyone can view subscriptions" ON public.driver_subscriptions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service Role can insert subscriptions" ON public.driver_subscriptions;
CREATE POLICY "Service Role can insert subscriptions" ON public.driver_subscriptions FOR INSERT WITH CHECK (true);

-- ==============================================================
-- 7. Fix RLS for Wallet & Transactions for Purchases
-- ==============================================================
DROP POLICY IF EXISTS "Users can update their own wallet" ON public.wallets;
CREATE POLICY "Users can update their own wallet" ON public.wallets 
   FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.transactions;
CREATE POLICY "Users can insert their own transactions" ON public.transactions
   FOR INSERT WITH CHECK (
       wallet_id IN (SELECT id FROM public.wallets WHERE user_id = auth.uid())
   );
