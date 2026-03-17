-- ============================================================
-- CONSOLIDATION & FIX SQL
-- ============================================================

-- 1. FIX RLS RECURSION
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid());
END;
$$;

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (get_my_role() = 'ADMIN');

-- 2. CONSOLIDATE ROUTES
-- Add distance_km to rental_routes if not exists
ALTER TABLE rental_routes ADD COLUMN IF NOT EXISTS distance_km NUMERIC;

-- Migrate data from travel_routes to rental_routes if missing
INSERT INTO rental_routes (origin, destination, distance_km, base_price, is_active, old_travel_id)
SELECT origin, destination, distance_km, 0, is_active, id 
FROM travel_routes t
WHERE NOT EXISTS (
    SELECT 1 FROM rental_routes r 
    WHERE r.origin = t.origin AND r.destination = t.destination
);

-- Note: We can't easily update travel_schedules.route_id automatically 
-- because the IDs will change. We might need to map them.
-- For a safe migration, we can add a temporary column to rental_routes to store the old travel_route_id.

ALTER TABLE rental_routes ADD COLUMN IF NOT EXISTS old_travel_id UUID;

UPDATE rental_routes r
SET old_travel_id = t.id
FROM travel_routes t
WHERE r.origin = t.origin AND r.destination = t.destination;

-- Update travel_schedules to point to rental_routes
-- First, drop the constraint
ALTER TABLE travel_schedules DROP CONSTRAINT IF EXISTS travel_schedules_route_id_fkey;

-- Update the route_id in travel_schedules
UPDATE travel_schedules s
SET route_id = r.id
FROM rental_routes r
WHERE s.route_id = r.old_travel_id;

-- Add the new constraint
ALTER TABLE travel_schedules 
ADD CONSTRAINT travel_schedules_route_id_fkey 
FOREIGN KEY (route_id) REFERENCES rental_routes(id) ON DELETE CASCADE;

-- Now we can safely remove old_travel_id and travel_routes table
-- ALTER TABLE rental_routes DROP COLUMN old_travel_id;
-- DROP TABLE travel_routes;
