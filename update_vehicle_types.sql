-- Update type_codes to match existing driver vehicle_type conventions where applicable
-- but keep them distinct for the new tiers.
-- Existing drivers likely use 'MOTOR' and 'MOBIL'.

-- If you want 'Motor Biasa' to be the default 'MOTOR':
UPDATE vehicle_types SET type_code = 'MOTOR' WHERE type_code = 'REGULAR';

-- If you want 'Mobil Hemat' to be the default 'MOBIL':
UPDATE vehicle_types SET type_code = 'MOBIL' WHERE type_code = 'HEMAT';
