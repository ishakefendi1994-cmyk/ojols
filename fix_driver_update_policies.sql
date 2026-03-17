-- ============================================================
-- FIX RLS: ALLOW DRIVERS TO UPDATE STATUS
-- ============================================================

-- 1. Rental Bookings: Allow assigned driver to update status
DROP POLICY IF EXISTS "Drivers can update their assigned bookings" ON rental_bookings;
CREATE POLICY "Drivers can update their assigned bookings" ON rental_bookings
  FOR UPDATE USING (
    auth.uid() = driver_id OR get_my_role() = 'ADMIN'
  );

-- 2. Travel Schedules: Allow assigned driver to update status
DROP POLICY IF EXISTS "Drivers can update their assigned schedules" ON travel_schedules;
CREATE POLICY "Drivers can update their assigned schedules" ON travel_schedules
  FOR UPDATE USING (
    auth.uid() = driver_id OR get_my_role() = 'ADMIN'
  );

-- Ensure authenticated users have the necessary permissions
GRANT UPDATE ON rental_bookings TO authenticated;
GRANT UPDATE ON travel_schedules TO authenticated;
