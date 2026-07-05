-- ═══════════════════════════════════════════════════════
-- 033 MISSING PERFORMANCE INDEXES
-- Covers query patterns not addressed in 018.
-- ═══════════════════════════════════════════════════════

-- Cron: send-reminders filters on these two boolean columns
CREATE INDEX IF NOT EXISTS reservations_reminder_24h_idx
  ON reservations (restaurant_id, reservation_date)
  WHERE reminder_24h_sent = false;

CREATE INDEX IF NOT EXISTS reservations_reminder_2h_idx
  ON reservations (restaurant_id, reservation_date)
  WHERE reminder_2h_sent = false;

-- Cron: send-trial-emails filters subscription_status + deleted_at
CREATE INDEX IF NOT EXISTS restaurants_sub_status_deleted_idx
  ON restaurants (subscription_status)
  WHERE deleted_at IS NULL;

-- Guest CRM: look up by restaurant + email
CREATE INDEX IF NOT EXISTS guest_profiles_restaurant_email_idx
  ON guest_profiles (restaurant_id, email);

-- Recurring reservations: timeline overlay query
CREATE INDEX IF NOT EXISTS recurring_restaurant_day_idx
  ON recurring_reservations (restaurant_id, day_of_week)
  WHERE is_active = true;

-- WhatsApp sessions: active session lookup
CREATE INDEX IF NOT EXISTS wa_sessions_restaurant_status_idx
  ON whatsapp_sessions (restaurant_id, status, expires_at)
  WHERE status = 'awaiting_reply';

-- Availability check: confirmed/arrived reservations for a restaurant on a date
CREATE INDEX IF NOT EXISTS reservations_avail_check_idx
  ON reservations (restaurant_id, reservation_date, status)
  WHERE status IN ('confirmed', 'arrived');

-- Referrals: unconverted rows for the webhook query
CREATE INDEX IF NOT EXISTS referrals_referred_unconverted_idx
  ON referrals (referred_id)
  WHERE converted_at IS NULL;
