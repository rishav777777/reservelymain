-- ═══════════════════════════════════════════════════════
-- 015 RLS SECURITY FIXES
-- ═══════════════════════════════════════════════════════
-- Fixes two overly-permissive policies from 002:
--   1. demo_requests USING (true)   → superadmin only
--   2. guest_insert  WITH CHECK (true) → active booking-enabled restaurants only

-- 1. demo_requests: restrict to superadmins only
DROP POLICY IF EXISTS "platform_admin_requests" ON demo_requests;
CREATE POLICY "superadmin_demo_requests" ON demo_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_superadmin = true
    )
  );

-- Guests still need to INSERT demo requests (unauthenticated POST from landing page)
-- That goes through an API route using the service role key, not the anon key.
-- The anon key must NOT have direct insert access here — confirmed: no anon INSERT policy.

-- 2. guest reservation insert: only for active, booking-enabled restaurants
DROP POLICY IF EXISTS "guest_insert" ON reservations;
CREATE POLICY "guest_insert" ON reservations
  FOR INSERT WITH CHECK (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE booking_enabled = true
    )
  );
