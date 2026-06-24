-- ═══════════════════════════════════════════════════════
-- 017 STRIPE SUBSCRIPTION COLUMNS
-- ═══════════════════════════════════════════════════════

ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS stripe_customer_id      text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id  text,
  ADD COLUMN IF NOT EXISTS stripe_price_id         text,
  ADD COLUMN IF NOT EXISTS subscription_status     text         NOT NULL DEFAULT 'trialing',
  ADD COLUMN IF NOT EXISTS subscription_plan       text         NOT NULL DEFAULT 'pro',
  ADD COLUMN IF NOT EXISTS trial_ends_at           timestamptz,
  ADD COLUMN IF NOT EXISTS subscribed_until        timestamptz;

-- Index for webhook lookups by stripe customer / subscription IDs
CREATE INDEX IF NOT EXISTS restaurants_stripe_customer_id_idx
  ON restaurants (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS restaurants_stripe_subscription_id_idx
  ON restaurants (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;
