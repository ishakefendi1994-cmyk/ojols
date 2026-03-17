-- Cek kolom di tabel travel_vehicles
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'travel_vehicles';

-- Cek apakah ada data kendaraan yang sudah punya image
SELECT * FROM travel_vehicles LIMIT 5;
