-- TABEL UNTUK MENYIMPAN POI LOKAL (HEMAT BIAYA GOOGLE MAPS)

CREATE TABLE IF NOT EXISTS public.local_pois (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    place_id TEXT UNIQUE,               -- ID unik dari Google/OSM untuk deduping
    name TEXT NOT NULL,                 -- Nama tempat
    address TEXT,                       -- Alamat lengkap
    latitude DOUBLE PRECISION NOT NULL, -- Koordinat Lat
    longitude DOUBLE PRECISION NOT NULL, -- Koordinat Lng
    category TEXT,                      -- Kategori (sekolah, masjid, dll)
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- OPTIMALISASI PENCARIAN (FULL TEXT SEARCH)
-- Menambahkan kolom FTS otomatis yang menggabungkan Nama dan Alamat
ALTER TABLE public.local_pois ADD COLUMN IF NOT EXISTS fts tsvector 
GENERATED ALWAYS AS (to_tsvector('indonesian', name || ' ' || coalesce(address, ''))) STORED;

-- Index GIN agar pencarian teks sangat cepat
CREATE INDEX IF NOT EXISTS local_pois_fts_idx ON public.local_pois USING GIN (fts);

-- Index Lat/Lng untuk query berbasis jarak jika dibutuhkan nanti
CREATE INDEX IF NOT EXISTS local_pois_lat_lng_idx ON public.local_pois (latitude, longitude);

-- KEAMANAN (RLS)
-- Aktifkan RLS dan izinkan aplikasi user menarik data (READ ONLY)
ALTER TABLE public.local_pois ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" 
ON public.local_pois 
FOR SELECT 
USING (true);
