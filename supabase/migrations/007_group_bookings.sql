-- ═══════════════════════════════════════════════════════
-- 007 GROUP BOOKINGS (Weihnachtsfeier etc.)
-- Large-party event inquiries separate from normal flow.
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS group_bookings (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id    uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  organizer_name   text NOT NULL,
  organizer_email  text NOT NULL,
  organizer_phone  text,
  group_name       text,
  party_size       integer NOT NULL,
  event_date       date NOT NULL,
  start_time       time NOT NULL,
  end_time         time,
  menu_type        text
    CHECK (menu_type IN ('set_menu','a_la_carte','buffet')),
  special_requests text,
  deposit_required boolean NOT NULL DEFAULT false,
  deposit_amount   numeric(10,2),
  deposit_paid_at  timestamptz,
  status           text NOT NULL DEFAULT 'inquiry'
    CHECK (status IN ('inquiry','confirmed','cancelled','completed')),
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE group_bookings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'group_bookings' AND policyname = 'tenant_isolation'
  ) THEN
    CREATE POLICY "tenant_isolation" ON group_bookings
      FOR ALL USING (
        restaurant_id IN (
          SELECT restaurant_id FROM profiles
          WHERE id = auth.uid() AND is_active = true
        )
      );
  END IF;
END $$;

-- Guests can submit group inquiries without auth
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'group_bookings' AND policyname = 'guest_insert_group'
  ) THEN
    CREATE POLICY "guest_insert_group" ON group_bookings
      FOR INSERT WITH CHECK (true);
  END IF;
END $$;
