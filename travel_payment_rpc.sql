-- Drop old overloads to avoid "Multiple Choices" (PGRST203) error
DROP FUNCTION IF EXISTS public.process_travel_payment(UUID);
DROP FUNCTION IF EXISTS public.process_travel_payment(UUID, BOOLEAN);

CREATE OR REPLACE FUNCTION public.process_travel_payment(
    p_booking_id UUID,
    p_is_admin_confirm BOOLEAN DEFAULT false
)
RETURNS JSON AS $$
DECLARE
    v_booking RECORD;
    v_schedule RECORD;
    v_user_wallet_id UUID;
    v_driver_wallet_id UUID;
    v_route_info TEXT;
    v_full_price NUMERIC;
    v_driver_amount NUMERIC;
    v_app_fee NUMERIC;
    v_description TEXT;
BEGIN
    -- 1. Ambil detail booking
    SELECT * INTO v_booking FROM public.travel_bookings WHERE id = p_booking_id;
    IF v_booking.id IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Booking tidak ditemukan');
    END IF;

    -- 2. Ambil detail jadwal & rute
    SELECT ts.*, 
           COALESCE(tr.origin, rr.origin, 'Unknown') as route_origin, 
           COALESCE(tr.destination, rr.destination, 'Unknown') as route_destination
    INTO v_schedule 
    FROM public.travel_schedules ts
    LEFT JOIN public.travel_routes tr ON ts.route_id = tr.id
    LEFT JOIN public.rental_routes rr ON ts.route_id = rr.id
    WHERE ts.id = v_booking.schedule_id;

    IF v_schedule.id IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Jadwal travel tidak ditemukan');
    END IF;

    v_route_info := v_schedule.route_origin || ' - ' || v_schedule.route_destination;
    v_full_price := v_booking.total_price;
    v_driver_amount := COALESCE(v_booking.driver_share, v_full_price * 0.9);
    v_app_fee := COALESCE(v_booking.app_fee, v_full_price * 0.1);

    -- 3. Proses Pembayaran (Hanya jika belum lunas)
    IF v_booking.payment_status = 'pending' THEN
        
        -- A. Potong Saldo User (Jika Bayar Pakai Saldo & Otomatis)
        IF v_booking.payment_method = 'saldo' AND p_is_admin_confirm = false THEN
            SELECT id INTO v_user_wallet_id FROM public.wallets WHERE user_id = v_booking.user_id;
            
            IF v_user_wallet_id IS NULL THEN
                 RETURN json_build_object('success', false, 'message', 'Wallet user tidak ditemukan');
            END IF;

            IF (SELECT balance FROM public.wallets WHERE id = v_user_wallet_id) < v_full_price THEN
                RETURN json_build_object('success', false, 'message', 'Saldo user tidak cukup');
            END IF;

            UPDATE public.wallets SET balance = balance - v_full_price WHERE id = v_user_wallet_id;
            
            INSERT INTO public.transactions (wallet_id, amount, type, description)
            VALUES (v_user_wallet_id, -v_full_price, 'PAYMENT', 'Pembayaran Travel ' || v_route_info || ' (#' || p_booking_id || ')');
        END IF;

        -- B. Alur Driver (Payout)
        IF v_schedule.driver_id IS NOT NULL THEN
            SELECT id INTO v_driver_wallet_id FROM public.wallets WHERE user_id = v_schedule.driver_id;
            
            IF v_driver_wallet_id IS NOT NULL THEN
                -- LOGIKA UTAMA: 
                -- Jika Admin Konfirmasi (CASH/SALDO) atau User bayar via SALDO, 
                -- maka sistem yang pegang uang dan harus ditransfer ke wallet driver.
                IF p_is_admin_confirm = true OR v_booking.payment_method = 'saldo' THEN
                    
                    -- Masukkan Saldo Bersih ke Wallet Driver
                    UPDATE public.wallets SET balance = balance + v_driver_amount WHERE id = v_driver_wallet_id;
                    
                    -- Log 1: Pendapatan Kotor (Informasi Masuk) - POSITIF
                    INSERT INTO public.transactions (wallet_id, amount, type, description)
                    VALUES (
                        v_driver_wallet_id, 
                        v_full_price, 
                        'TRAVEL_PAYMENT', 
                        'Pendapatan Travel: ' || COALESCE(v_booking.passenger_name, 'Passenger') || ' (' || v_route_info || ') (#' || p_booking_id || ')'
                    );
                    
                    -- Log 2: Potongan Komisi (Informasi Keluar) - NEGATIF
                    INSERT INTO public.transactions (wallet_id, amount, type, description)
                    VALUES (
                        v_driver_wallet_id, 
                        -v_app_fee, 
                        'FEE_DEDUCTION', 
                        'Komisi Platform (10%) - Order #' || p_booking_id
                    );
                ELSE
                    -- Alur Cash Biasa (Driver terima uang langsung dari penumpang)
                    -- Potong fee dari wallet driver
                    UPDATE public.wallets SET balance = balance - v_app_fee WHERE id = v_driver_wallet_id;
                    
                    INSERT INTO public.transactions (wallet_id, amount, type, description)
                    VALUES (
                        v_driver_wallet_id, 
                        -v_app_fee, 
                        'FEE_DEDUCTION', 
                        'Potongan Fee Travel (Cash): ' || COALESCE(v_booking.passenger_name, 'Passenger') || ' (#' || p_booking_id || ')'
                    );
                END IF;
            END IF;
        END IF;

        -- 4. Update Status Pembayaran
        UPDATE public.travel_bookings SET payment_status = 'paid' WHERE id = p_booking_id;
        
        RETURN json_build_object('success', true);
    ELSE
        RETURN json_build_object('success', false, 'message', 'Pesanan travel ini sudah berstatus LUNAS');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access
GRANT EXECUTE ON FUNCTION public.process_travel_payment(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_travel_payment(UUID, BOOLEAN) TO service_role;
