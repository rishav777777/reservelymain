-- Migration 022: Waitlist system
-- Run in Supabase SQL Editor → enables guests to join a waitlist when a
-- time slot is fully booked. Dashboard owners manage entries at /dashboard/waitlist.

CREATE TABLE IF NOT EXISTS waitlist_entries (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id  UUID        NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  guest_name     TEXT        NOT NULL,
  guest_email    TEXT        NOT NULL,
  guest_phone    TEXT,
  party_size     INT         NOT NULL,
  requested_date DATE        NOT NULL,
  requested_time TIME,
  notes          TEXT,
  status         TEXT        NOT NULL DEFAULT 'waiting'
                             CHECK (status IN ('waiting','notified','booked','cancelled')),
  notified_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_waitlist_restaurant_date
  ON waitlist_entries(restaurant_id, requested_date, status);

-- RLS: owners can read their own waitlist; guests can only insert (join)
ALTER TABLE waitlist_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners read their waitlist" ON waitlist_entries
  FOR SELECT USING (
    restaurant_id IN (
      SELECT restaurant_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Owners update their waitlist" ON waitlist_entries
  FOR UPDATE USING (
    restaurant_id IN (
      SELECT restaurant_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Guests join waitlist" ON waitlist_entries
  FOR INSERT WITH CHECK (true);
