-- ═══════════════════════════════════════════════════════
-- 006 RECURRING RESERVATIONS (STAMMTISCH)
-- Standing bookings that repeat on the same day weekly.
-- Does NOT auto-generate rows in reservations table.
-- Rendered as an overlay on the timeline UI.
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS recurring_reservations (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id    uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  table_id         uuid REFERENCES restaurant_tables(id) ON DELETE SET NULL,
  guest_name       text NOT NULL,
  guest_email      text,
  guest_phone      text,
  party_size       integer NOT NULL,
  day_of_week      integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time       time NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 120,
  label            text,
  notes            text,
  is_active        boolean NOT NULL DEFAULT true,
  effective_from   date NOT NULL DEFAULT CURRENT_DATE,
  effective_until  date,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE recurring_reservations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'recurring_reservations' AND policyname = 'tenant_isolation'
  ) THEN
    CREATE POLICY "tenant_isolation" ON recurring_reservations
      FOR ALL USING (
        restaurant_id IN (
          SELECT restaurant_id FROM profiles
          WHERE id = auth.uid() AND is_active = true
        )
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_recurring_day ON recurring_reservations (
  restaurant_id, day_of_week, is_active
);
