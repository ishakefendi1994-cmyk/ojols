-- ============================================================
-- FIX RLS: RENTAL BOOKINGS & ROUTES
-- ============================================================

-- 0. Drop old overloads to avoid "Multiple Choices" (PGRST203) error
DROP FUNCTION IF EXISTS public.process_rental_payment(UUID);
DROP FUNCTION IF EXISTS public.process_rental_payment(UUID, BOOLEAN);

-- 1. Rental Routes
DROP POLICY IF EXISTS "Admins can manage rental routes" ON rental_routes;
CREATE POLICY "Admins can manage rental routes" ON rental_routes
  FOR ALL USING (get_my_role() = 'ADMIN');

-- 2. Rental Bookings
DROP POLICY IF EXISTS "Users can view their own rental bookings" ON rental_bookings;
CREATE POLICY "Users can view their own rental bookings" ON rental_bookings
  FOR SELECT USING (auth.uid() = user_id OR get_my_role() = 'ADMIN' OR auth.uid() = driver_id);

DROP POLICY IF EXISTS "Admins can update rental bookings" ON rental_bookings;
CREATE POLICY "Admins can update rental bookings" ON rental_bookings
  FOR UPDATE USING (get_my_role() = 'ADMIN');

-- 3. Travel Bookings
DROP POLICY IF EXISTS "User can read own bookings" ON travel_bookings;
CREATE POLICY "User can read own bookings" ON travel_bookings
  FOR SELECT USING (auth.uid() = user_id OR get_my_role() = 'ADMIN');

-- 4. Travel Schedules (Admins might need management access)
DROP POLICY IF EXISTS "Admins can manage schedules" ON travel_schedules;
CREATE POLICY "Admins can manage schedules" ON travel_schedules
  FOR ALL USING (get_my_role() = 'ADMIN');

-- 5. RPC: Flexible Process Rental Payment
-- Function to handle Driver Payout (Always adds Net Share to Wallet if not manual)
CREATE OR REPLACE FUNCTION public.process_rental_payment(
    p_booking_id UUID,
    p_manual_settlement BOOLEAN DEFAULT false
)
RETURNS JSON AS $$
DECLARE
    v_booking RECORD;
    v_wallet_id UUID;
BEGIN
    -- Get booking details from public.rental_bookings
    SELECT * INTO v_booking FROM public.rental_bookings WHERE id = p_booking_id;
    
    IF v_booking.id IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Booking tidak ditemukan');
    END IF;

    IF v_booking.driver_id IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Driver belum ditentukan');
    END IF;

    -- Driver settlement logic
    SELECT id INTO v_wallet_id FROM public.wallets WHERE user_id = v_booking.driver_id;

    IF v_wallet_id IS NOT NULL THEN
        IF p_manual_settlement = false AND v_booking.payment_method = 'saldo' THEN
            -- WALLET: Add driver share to wallet
            UPDATE public.wallets 
            SET balance = balance + v_booking.driver_share 
            WHERE id = v_wallet_id;

            INSERT INTO public.transactions (wallet_id, amount, type, description)
            VALUES (
                v_wallet_id, 
                v_booking.driver_share, 
                'RENTAL_PAYMENT', 
                'Pendapatan Sewa Mobil (ID: ' || p_booking_id || ')'
            );
        ELSE
            -- CASH atau Manual: Deduct platform fee (10%) from driver's wallet
            -- Assuming driver already received the full amount in cash
            DECLARE
                v_app_fee NUMERIC := COALESCE(v_booking.app_fee, v_booking.total_price * 0.1);
            BEGIN
                UPDATE public.wallets 
                SET balance = balance - v_app_fee 
                WHERE id = v_wallet_id;

                INSERT INTO public.transactions (wallet_id, amount, type, description)
                VALUES (
                    v_wallet_id, 
                    -v_app_fee, 
                    'FEE_DEDUCTION', 
                    'Potongan Fee Sewa Mobil (Cash): ' || v_booking.customer_id || ' (ID: ' || p_booking_id || ')'
                );
            END;
        END IF;
    END IF;

    -- Update payment status anyway in public.rental_bookings
    UPDATE public.rental_bookings SET payment_status = 'paid' WHERE id = p_booking_id;

    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Granting access
GRANT ALL ON rental_bookings TO authenticated;
GRANT ALL ON rental_routes TO authenticated;
GRANT ALL ON travel_bookings TO authenticated;
GRANT ALL ON travel_schedules TO authenticated;
GRANT ALL ON travel_vehicles TO authenticated;
GRANT ALL ON travel_routes TO authenticated;
GRANT EXECUTE ON FUNCTION process_rental_payment(UUID, BOOLEAN) TO authenticated;
