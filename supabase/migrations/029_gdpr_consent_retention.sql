-- GDPR compliance: profiling consent, marketing consent, and PII retention on reservations

ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS profiling_consent    BOOLEAN     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS profiling_consent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS marketing_consent    BOOLEAN     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS marketing_consent_at TIMESTAMPTZ,
  -- Auto-calculated at insert time: reservation_date + 60 days.
  -- After this date the purge cron anonymizes name/email/phone.
  ADD COLUMN IF NOT EXISTS pii_purge_after      TIMESTAMPTZ;

-- Partial index for the daily purge cron — only rows that need action
CREATE INDEX IF NOT EXISTS idx_reservations_pii_purge
  ON reservations (pii_purge_after)
  WHERE pii_purge_after IS NOT NULL;

-- Also add profiling_consent index so the guest_profile upsert can filter cheaply
CREATE INDEX IF NOT EXISTS idx_reservations_profiling_consent
  ON reservations (restaurant_id, guest_email, profiling_consent)
  WHERE profiling_consent = true;
