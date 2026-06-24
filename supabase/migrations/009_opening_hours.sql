-- ═══════════════════════════════════════════════════════
-- 009 OPENING HOURS
-- Per-day configuration for each restaurant.
-- day_of_week: 0=Mon, 1=Tue, ..., 6=Sun
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS opening_hours (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  day_of_week   integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  is_open       boolean NOT NULL DEFAULT true,
  open_time     time,
  close_time    time,
  last_booking  time,
  UNIQUE (restaurant_id, day_of_week)
);

ALTER TABLE opening_hours ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'opening_hours' AND policyname = 'tenant_isolation'
  ) THEN
    CREATE POLICY "tenant_isolation" ON opening_hours
      FOR ALL USING (
        restaurant_id IN (
          SELECT restaurant_id FROM profiles
          WHERE id = auth.uid() AND is_active = true
        )
      );
  END IF;
END $$;

-- Public read — guest portal needs to show available times
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'opening_hours' AND policyname = 'public_read_hours'
  ) THEN
    CREATE POLICY "public_read_hours" ON opening_hours
      FOR SELECT USING (true);
  END IF;
END $$;
