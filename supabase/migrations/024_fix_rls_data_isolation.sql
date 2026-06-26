-- Migration 024: Fix cross-tenant data leakage via over-permissive RLS
--
-- Problem: "public_read_confirmed" allowed ANY authenticated user to read
-- confirmed/arrived reservations from ALL restaurants. Combined with a
-- client-supplied restaurantId URL param this is a cross-tenant GDPR breach.
--
-- Fix: Remove that policy. The booking-portal conflict check (/api/reservations/tables)
-- is now handled by the service-role admin client in application code, which is
-- already scoped with .eq('restaurant_id', restaurantId) from the restaurant slug.

DROP POLICY IF EXISTS "public_read_confirmed" ON reservations;

-- Also tighten table_holds: public hold was FOR ALL (read + write).
-- Guests only need INSERT (create a hold) and SELECT on their own session.
-- We can't scope by session_id in RLS easily, so use the admin client there too.
DROP POLICY IF EXISTS "public_hold" ON table_holds;

-- Re-create a minimal guest_insert for reservations (keeps booking portal working)
-- This was already in 015 but make sure it exists.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'reservations' AND policyname = 'guest_insert'
  ) THEN
    CREATE POLICY "guest_insert" ON reservations
      FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Allow guests to INSERT a hold (3-min TTL, anonymous booking flow)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'table_holds' AND policyname = 'guest_insert_hold'
  ) THEN
    CREATE POLICY "guest_insert_hold" ON table_holds
      FOR INSERT WITH CHECK (true);
  END IF;
END $$;
