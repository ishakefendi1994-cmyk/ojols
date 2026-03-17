-- Add image_url to travel_vehicles
ALTER TABLE travel_vehicles ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Opsi: Tambahkan kolom yang sama ke travel_bookings jika ingin menyimpan snapshot (opsional, tapi bagus untuk riwayat)
-- ALTER TABLE travel_bookings ADD COLUMN IF NOT EXISTS vehicle_image_snapshot TEXT;
