-- ═══════════════════════════════════════════════════════
-- 012 NOTICES + MESSAGES — MISSING COLUMNS + RLS POLICIES
-- ═══════════════════════════════════════════════════════
-- notices: GET handler filters on is_active / expires_at (columns were missing).
-- notices + messages: RLS was enabled but NO policies existed → all access denied.

ALTER TABLE notices
  ADD COLUMN IF NOT EXISTS is_active  boolean     NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;

-- Tenant isolation: staff/manager/owner can read+write their restaurant's notices
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'notices' AND policyname = 'tenant_isolation'
  ) THEN
    CREATE POLICY "tenant_isolation" ON notices
      FOR ALL USING (
        restaurant_id IN (
          SELECT restaurant_id FROM profiles
          WHERE id = auth.uid() AND is_active = true
        )
      );
  END IF;
END $$;

-- Tenant isolation for messages: messages have no restaurant_id — join via reservation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'tenant_isolation'
  ) THEN
    CREATE POLICY "tenant_isolation" ON messages
      FOR ALL USING (
        reservation_id IN (
          SELECT id FROM reservations
          WHERE restaurant_id IN (
            SELECT restaurant_id FROM profiles
            WHERE id = auth.uid() AND is_active = true
          )
        )
      );
  END IF;
END $$;

-- profiles: authenticated users read/write their own row only.
-- This is the root of all tenant_isolation subqueries; without it every
-- other tenant_isolation policy returns an empty set.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'own_profile'
  ) THEN
    CREATE POLICY "own_profile" ON profiles
      FOR ALL USING (id = auth.uid());
  END IF;
END $$;

-- restaurants: owners/staff can read+write their own restaurant row
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'restaurants' AND policyname = 'tenant_isolation'
  ) THEN
    CREATE POLICY "tenant_isolation" ON restaurants
      FOR ALL USING (
        id IN (
          SELECT restaurant_id FROM profiles
          WHERE id = auth.uid() AND is_active = true
        )
      );
  END IF;
END $$;

-- table_holds: tenant isolation for dashboard (authenticated staff/manager/owner)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'table_holds' AND policyname = 'tenant_isolation'
  ) THEN
    CREATE POLICY "tenant_isolation" ON table_holds
      FOR ALL USING (
        restaurant_id IN (
          SELECT restaurant_id FROM profiles
          WHERE id = auth.uid() AND is_active = true
        )
      );
  END IF;
END $$;

-- table_holds: public access for anonymous booking-portal guests.
-- Holds are ephemeral (3-min TTL) and non-sensitive; app layer enforces session_id scoping.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'table_holds' AND policyname = 'public_hold'
  ) THEN
    CREATE POLICY "public_hold" ON table_holds
      FOR ALL USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- reservations: public SELECT for confirmed/arrived rows only.
-- Required so anonymous guests can check table conflicts during the booking flow
-- (hold route and tables route both do .in('status', ['confirmed','arrived'])).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'reservations' AND policyname = 'public_read_confirmed'
  ) THEN
    CREATE POLICY "public_read_confirmed" ON reservations
      FOR SELECT USING (status IN ('confirmed', 'arrived'));
  END IF;
END $$;
