-- ============================================================
-- RENTAL ROUTE DRIVERS - RELATION TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS rental_route_drivers (
  route_id UUID REFERENCES rental_routes(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (route_id, driver_id)
);

-- RLS
ALTER TABLE rental_route_drivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Rental route drivers readable by everyone" ON rental_route_drivers FOR SELECT USING (true);

CREATE POLICY "Admins can manage rental route drivers" ON rental_route_drivers
  FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ADMIN');

-- Grant permissions
GRANT ALL ON public.rental_route_drivers TO authenticated;
GRANT ALL ON public.rental_route_drivers TO anon;
GRANT ALL ON public.rental_route_drivers TO service_role;
