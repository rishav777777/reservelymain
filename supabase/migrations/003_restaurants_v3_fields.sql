-- ═══════════════════════════════════════════════════════
-- 003 RESTAURANTS — v3.0 additional fields
-- All additive — no existing data lost.
-- Run this migration to enable WhatsApp + subscription features.
-- ═══════════════════════════════════════════════════════

ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS timezone              text NOT NULL DEFAULT 'Europe/Berlin',
  ADD COLUMN IF NOT EXISTS locale                text NOT NULL DEFAULT 'de',
  ADD COLUMN IF NOT EXISTS booking_enabled       boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS advance_booking_days  integer NOT NULL DEFAULT 90,
  ADD COLUMN IF NOT EXISTS min_party_size        integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS max_party_size        integer NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS default_duration_mins integer NOT NULL DEFAULT 90,
  ADD COLUMN IF NOT EXISTS slot_interval_mins    integer NOT NULL DEFAULT 15,
  -- WhatsApp
  ADD COLUMN IF NOT EXISTS owner_whatsapp        text,
  ADD COLUMN IF NOT EXISTS wa_notifications      boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS wa_daily_summary      boolean NOT NULL DEFAULT true,
  -- Onboarding
  ADD COLUMN IF NOT EXISTS setup_completed       boolean NOT NULL DEFAULT false,
  -- Subscription
  ADD COLUMN IF NOT EXISTS stripe_customer_id     text UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS subscription_status    text NOT NULL DEFAULT 'trialing'
    CHECK (subscription_status IN ('trialing','active','past_due','cancelled','paused')),
  ADD COLUMN IF NOT EXISTS subscription_plan      text NOT NULL DEFAULT 'direktbuchung',
  ADD COLUMN IF NOT EXISTS trial_ends_at          timestamptz DEFAULT (now() + interval '30 days'),
  ADD COLUMN IF NOT EXISTS subscribed_until       timestamptz;

-- Reservations: source tracking + automation timestamps
ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS source           text NOT NULL DEFAULT 'guest_portal'
    CHECK (source IN ('guest_portal','walk_in','phone','whatsapp','import')),
  ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS confirmed_at     timestamptz;

-- Profiles: locale preference
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS locale text NOT NULL DEFAULT 'de';

-- Auto-update updated_at on restaurants
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN new.updated_at = now(); RETURN new; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS restaurants_updated_at ON restaurants;
CREATE TRIGGER restaurants_updated_at
  BEFORE UPDATE ON restaurants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS reservations_updated_at ON reservations;
CREATE TRIGGER reservations_updated_at
  BEFORE UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
