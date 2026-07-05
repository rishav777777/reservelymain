-- Migration 032: Referral mechanism
-- Run this in Supabase SQL Editor.
-- Enables "Thomas refers Thomas" growth loop: both parties get 1 month free.

-- Add referral columns to restaurants
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS referral_code    VARCHAR(8)  UNIQUE,
  ADD COLUMN IF NOT EXISTS referral_credits NUMERIC     NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_restaurants_referral_code ON restaurants (referral_code);

-- Referrals tracking table
CREATE TABLE IF NOT EXISTS referrals (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id    UUID        NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  referred_id    UUID        REFERENCES restaurants(id) ON DELETE SET NULL,
  referral_code  VARCHAR(8)  NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  converted_at   TIMESTAMPTZ,
  reward_sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer  ON referrals (referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred  ON referrals (referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code      ON referrals (referral_code);

-- RLS: owners can read their own referral rows
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners_read_own_referrals"
  ON referrals FOR SELECT
  USING (
    referrer_id IN (
      SELECT restaurant_id FROM profiles WHERE id = auth.uid()
    )
  );
