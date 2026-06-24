-- ═══════════════════════════════════════════════════════
-- 013 SOURCE CONSTRAINT + PLAN TIERS + ADD-ONS
-- ═══════════════════════════════════════════════════════
-- Fixes:
--   1. 'dashboard' and 'quick_book' were missing from source CHECK
--      → POST /api/reservations inserts source='dashboard' → would fail at DB
--   2. Adds plan_tier + addon_* flags for the new pricing model

-- Expand source CHECK to include all real values the app produces
ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_source_check;
ALTER TABLE reservations
  ADD CONSTRAINT reservations_source_check
    CHECK (source IN ('guest_portal','walk_in','phone','whatsapp','import','dashboard','quick_book'));

-- Pricing model columns on restaurants
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS plan_tier           text    NOT NULL DEFAULT 'pro'
    CHECK (plan_tier IN ('starter','pro','growth')),
  ADD COLUMN IF NOT EXISTS addon_whatsapp      boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS addon_analytics_pro boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS addon_extra_seats   integer NOT NULL DEFAULT 0;
