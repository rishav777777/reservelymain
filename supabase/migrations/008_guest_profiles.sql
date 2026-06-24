-- ═══════════════════════════════════════════════════════
-- 008 GUEST CRM — Stammgast recognition
-- Auto-built from completed reservations.
-- Upserted on reservation.status → 'completed'.
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS guest_profiles (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  email         text NOT NULL,
  name          text,
  phone         text,
  visit_count   integer NOT NULL DEFAULT 0,
  first_visit   date,
  last_visit    date,
  is_stammgast  boolean NOT NULL DEFAULT false,
  preferences   jsonb NOT NULL DEFAULT '{}',
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (restaurant_id, email)
);

ALTER TABLE guest_profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'guest_profiles' AND policyname = 'tenant_isolation'
  ) THEN
    CREATE POLICY "tenant_isolation" ON guest_profiles
      FOR ALL USING (
        restaurant_id IN (
          SELECT restaurant_id FROM profiles
          WHERE id = auth.uid() AND is_active = true
        )
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_guest_email       ON guest_profiles (restaurant_id, email);
CREATE INDEX IF NOT EXISTS idx_guest_visit_count ON guest_profiles (restaurant_id, visit_count DESC);
