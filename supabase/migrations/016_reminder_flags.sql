-- ═══════════════════════════════════════════════════════
-- 016 REMINDER FLAGS + EMAIL CONFIRMATION
-- ═══════════════════════════════════════════════════════

ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS reminder_24h_sent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reminder_2h_sent  boolean NOT NULL DEFAULT false;
