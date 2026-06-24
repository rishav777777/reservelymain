-- ═══════════════════════════════════════════════════════
-- 004 FLOOR ZONES — proper table for layout zones
-- Replaces JSON blob in layout API.
-- restaurant_tables gets zone_id + extra fields.
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS floor_zones (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  label         text NOT NULL,
  x             integer NOT NULL DEFAULT 0,
  y             integer NOT NULL DEFAULT 0,
  w             integer NOT NULL DEFAULT 200,
  h             integer NOT NULL DEFAULT 150,
  is_seasonal   boolean NOT NULL DEFAULT false,
  season_start  date,
  season_end    date,
  is_open       boolean NOT NULL DEFAULT true,
  sort_order    integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE floor_zones ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'floor_zones' AND policyname = 'tenant_isolation'
  ) THEN
    CREATE POLICY "tenant_isolation" ON floor_zones
      FOR ALL USING (
        restaurant_id IN (
          SELECT restaurant_id FROM profiles
          WHERE id = auth.uid() AND is_active = true
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'floor_zones' AND policyname = 'public_read_zones'
  ) THEN
    CREATE POLICY "public_read_zones" ON floor_zones
      FOR SELECT USING (true);
  END IF;
END $$;

-- restaurant_tables: add zone linkage + extra v3 fields
ALTER TABLE restaurant_tables
  ADD COLUMN IF NOT EXISTS zone_id       uuid REFERENCES floor_zones(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS min_capacity  integer,
  ADD COLUMN IF NOT EXISTS is_stammtisch boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notes         text;

CREATE INDEX IF NOT EXISTS idx_zones_restaurant ON floor_zones (restaurant_id);
CREATE INDEX IF NOT EXISTS idx_tables_zone       ON restaurant_tables (zone_id);
