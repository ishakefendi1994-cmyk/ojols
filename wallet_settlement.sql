-- ==========================================
-- WALLET SETTLEMENT SISTEM LENGKAP v3
-- Termasuk payout merchant untuk Food/Shop
-- ==========================================

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
BEGIN
    IF (OLD.status != 'COMPLETED' AND NEW.status = 'COMPLETED') THEN

        -- Ambil Wallet IDs
        SELECT id INTO v_customer_wallet_id FROM public.wallets WHERE user_id = NEW.customer_id;
        SELECT id INTO v_driver_wallet_id   FROM public.wallets WHERE user_id = NEW.driver_id;

        -- Cek apakah ada merchant (Food/Shop order)
        v_has_merchant := (NEW.merchant_id IS NOT NULL);

        IF v_has_merchant THEN
            SELECT id INTO v_merchant_wallet_id FROM public.wallets WHERE user_id = NEW.merchant_id;
        END IF;

        -- Ambil nilai-nilai dari order
        v_item_total    := COALESCE(NEW.item_total, 0);
        v_delivery_fee  := COALESCE(NEW.delivery_fee_amount, 0);
        v_merchant_comm := COALESCE(NEW.merchant_commission, 0);
        v_admin_fee     := COALESCE(NEW.admin_fee, 0);    -- 10% dari ongkir
        v_service_fee   := COALESCE(NEW.service_fee, 0);  -- biaya layanan app

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
            UPDATE public.wallets
            SET balance = balance - v_admin_fee
            WHERE id = v_driver_wallet_id;

            INSERT INTO public.transactions (wallet_id, order_id, type, amount, description)
            VALUES (v_driver_wallet_id, NEW.id, 'FEE_DEDUCTION', -v_admin_fee,
                    'Potongan fee platform order tunai #' || NEW.id);

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
