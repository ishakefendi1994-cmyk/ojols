-- ============================================================
-- DRIVER RENTAL (SEWA DRIVER) - DATABASE SCHEMA
-- ============================================================

-- 1. Rute Sewa Driver
CREATE TABLE IF NOT EXISTS rental_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  base_price NUMERIC NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Pesanan Sewa Driver
CREATE TABLE IF NOT EXISTS rental_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  route_id UUID REFERENCES rental_routes(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  pickup_date DATE NOT NULL,
  pickup_time TIME NOT NULL,
  car_description TEXT NOT NULL, -- Info mobil customer (misal: Avanza Putih BH 1234 XX)
  total_price NUMERIC NOT NULL,
  app_fee NUMERIC NOT NULL, -- 10% dari total_price
  driver_share NUMERIC NOT NULL, -- 90% dari total_price
  payment_method TEXT CHECK (payment_method IN ('saldo', 'cash')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'cancelled')),
  status TEXT DEFAULT 'searching' CHECK (status IN ('searching', 'assigned', 'on_way', 'active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================

ALTER TABLE rental_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Rental routes readable by everyone" ON rental_routes FOR SELECT USING (true);

CREATE POLICY "Admins can manage rental routes" ON rental_routes
  FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ADMIN');

CREATE POLICY "Users can view their own rental bookings" ON rental_bookings
  FOR SELECT USING (auth.uid() = user_id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ADMIN');

CREATE POLICY "Users can create rental bookings" ON rental_bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update rental bookings" ON rental_bookings
  FOR UPDATE USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ADMIN');

CREATE POLICY "Drivers can view assigned rental bookings" ON rental_bookings
  FOR SELECT USING (auth.uid() = driver_id);

-- ============================================================
-- RPC: Proses Pembayaran Sewa Driver (Transaction Safe)
-- ============================================================

CREATE OR REPLACE FUNCTION process_rental_payment(
    p_booking_id UUID,
    p_user_id UUID,
    p_driver_id UUID,
    p_amount NUMERIC,
    p_driver_share NUMERIC,
    p_app_fee NUMERIC
) RETURNS JSON AS $$
DECLARE
    v_user_balance NUMERIC;
BEGIN
    -- 1. Cek saldo user
    SELECT balance INTO v_user_balance FROM wallets WHERE user_id = p_user_id;
    IF v_user_balance < p_amount THEN
        RETURN json_build_object('success', false, 'message', 'Saldo tidak cukup');
    END IF;

    -- 2. Potong saldo user
    UPDATE wallets SET balance = balance - p_amount WHERE user_id = p_user_id;
    INSERT INTO wallet_transactions (user_id, amount, type, description)
    VALUES (p_user_id, -p_amount, 'RENTAL_PAYMENT', 'Pembayaran Sewa Driver');

    -- 3. Tambah saldo driver
    UPDATE wallets SET balance = balance + p_driver_share WHERE user_id = p_driver_id;
    INSERT INTO wallet_transactions (user_id, amount, type, description)
    VALUES (p_driver_id, p_driver_share, 'RENTAL_EARNING', 'Pendapatan Sewa Driver');

    -- 4. Update status booking
    UPDATE rental_bookings SET payment_status = 'paid' WHERE id = p_booking_id;

    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql;
