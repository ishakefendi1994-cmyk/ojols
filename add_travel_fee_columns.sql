-- Add admin_fee_percentage to travel_schedules with default 10
ALTER TABLE travel_schedules ADD COLUMN IF NOT EXISTS admin_fee_percentage DECIMAL DEFAULT 10;

-- Add app_fee and driver_share to travel_bookings
ALTER TABLE travel_bookings ADD COLUMN IF NOT EXISTS app_fee DECIMAL;
ALTER TABLE travel_bookings ADD COLUMN IF NOT EXISTS driver_share DECIMAL;
