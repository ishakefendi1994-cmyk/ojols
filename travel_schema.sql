-- ============================================================
-- TRAVEL BOOKING - DATABASE SCHEMA
-- Jalankan SQL ini di Supabase SQL Editor
-- ============================================================

-- 1. Rute Travel (Asal → Tujuan)
CREATE TABLE IF NOT EXISTS travel_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  distance_km NUMERIC,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Armada / Kendaraan Travel
CREATE TABLE IF NOT EXISTS travel_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  plate_number TEXT UNIQUE,
  seat_count INT NOT NULL DEFAULT 7,
  vehicle_type TEXT DEFAULT 'minibus',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Jadwal Keberangkatan
CREATE TABLE IF NOT EXISTS travel_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID REFERENCES travel_routes(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES travel_vehicles(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  departure_time TIMESTAMPTZ NOT NULL,
  price_per_seat NUMERIC NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'full', 'departed', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Pemesanan Tiket Travel
CREATE TABLE IF NOT EXISTS travel_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  schedule_id UUID REFERENCES travel_schedules(id) ON DELETE CASCADE,
  seat_number INT NOT NULL,
  passenger_name TEXT NOT NULL,
  passenger_phone TEXT,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('saldo', 'cash')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'cancelled')),
  total_price NUMERIC NOT NULL,
  qr_code TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::TEXT,
  ticket_status TEXT DEFAULT 'unused' CHECK (ticket_status IN ('unused', 'used', 'expired')),
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  -- Satu kursi per jadwal tidak boleh dipesan dua kali
  UNIQUE (schedule_id, seat_number)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE travel_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE travel_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE travel_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE travel_bookings ENABLE ROW LEVEL SECURITY;

-- Routes & Vehicles & Schedules: bisa dibaca semua user terautentikasi
CREATE POLICY "Travel routes readable by all" ON travel_routes FOR SELECT USING (true);
CREATE POLICY "Travel vehicles readable by all" ON travel_vehicles FOR SELECT USING (true);
CREATE POLICY "Travel schedules readable by all" ON travel_schedules FOR SELECT USING (true);

-- Bookings: user hanya bisa lihat tiket miliknya sendiri
CREATE POLICY "User can read own bookings" ON travel_bookings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "User can insert own bookings" ON travel_bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin bisa melakukan segalanya (via service_role di Next.js)
CREATE POLICY "Service role full access routes" ON travel_routes USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access vehicles" ON travel_vehicles USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access schedules" ON travel_schedules USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access bookings" ON travel_bookings USING (true) WITH CHECK (true);

-- ============================================================
-- INDEX untuk performa
-- ============================================================
CREATE INDEX idx_travel_schedules_route ON travel_schedules(route_id);
CREATE INDEX idx_travel_schedules_driver ON travel_schedules(driver_id);
CREATE INDEX idx_travel_bookings_user ON travel_bookings(user_id);
CREATE INDEX idx_travel_bookings_schedule ON travel_bookings(schedule_id);
CREATE INDEX idx_travel_bookings_qr ON travel_bookings(qr_code);
