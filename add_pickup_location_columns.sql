-- ============================================================
-- ADD PICKUP LOCATION TO RENTAL AND TRAVEL BOOKINGS
-- ============================================================

-- 1. Add columns to rental_bookings
ALTER TABLE rental_bookings 
ADD COLUMN IF NOT EXISTS pickup_address TEXT,
ADD COLUMN IF NOT EXISTS pickup_lat DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS pickup_lng DOUBLE PRECISION;

-- 2. Add columns to travel_bookings
ALTER TABLE travel_bookings 
ADD COLUMN IF NOT EXISTS pickup_address TEXT,
ADD COLUMN IF NOT EXISTS pickup_lat DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS pickup_lng DOUBLE PRECISION;
