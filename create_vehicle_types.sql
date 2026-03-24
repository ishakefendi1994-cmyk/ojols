-- Create vehicle_types table
CREATE TABLE IF NOT EXISTS vehicle_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    type_code TEXT NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,
    base_price_override NUMERIC,
    price_per_km_override NUMERIC,
    icon_name TEXT,
    capacity INT DEFAULT 4,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(service_id, type_code)
);

-- Add index
CREATE INDEX IF NOT EXISTS idx_vehicle_types_service_id ON vehicle_types(service_id);

-- Enable RLS
ALTER TABLE vehicle_types ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Allow public read access for vehicle_types"
ON vehicle_types FOR SELECT
TO public
USING (true);

-- Sample Data for Ride (1b138804-d450-482d-8b43-7080e227003c)
INSERT INTO vehicle_types (service_id, type_code, display_name, description, base_price_override, price_per_km_override, icon_name, capacity)
VALUES 
('1b138804-d450-482d-8b43-7080e227003c', 'REGULAR', 'Motor Biasa', 'Motor standar harian', 15000, 3000, 'motorcycle', 1),
('1b138804-d450-482d-8b43-7080e227003c', 'BIG_MATIC', 'Motor Big Matic', 'PCX, NMAX, XMAX', 20000, 4000, 'motorcycle', 1);

-- Sample Data for Car (fb786e24-9646-4993-9ca4-9f44ba18f029)
INSERT INTO vehicle_types (service_id, type_code, display_name, description, base_price_override, price_per_km_override, icon_name, capacity)
VALUES 
('fb786e24-9646-4993-9ca4-9f44ba18f029', 'HEMAT', 'Mobil Hemat', 'Mobil 2 baris (Max 4 org)', 25000, 5000, 'car', 4),
('fb786e24-9646-4993-9ca4-9f44ba18f029', 'XL', 'Mobil XL', 'Mobil 3 baris (Max 6 org)', 40000, 8000, 'car', 6);
