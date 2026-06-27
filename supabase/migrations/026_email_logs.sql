-- Migration 026: Email delivery log
-- Tracks every outbound email so super admins can diagnose delivery issues.

CREATE TABLE IF NOT EXISTS email_logs (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  type          TEXT        NOT NULL,           -- e.g. 'reservation_confirmation', 'approval'
  to_email      TEXT        NOT NULL,
  subject       TEXT        NOT NULL,
  restaurant_id UUID        REFERENCES restaurants(id) ON DELETE SET NULL,
  status        TEXT        NOT NULL DEFAULT 'sent', -- 'sent' | 'failed'
  error         TEXT
);

CREATE INDEX IF NOT EXISTS idx_email_logs_created_at   ON email_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_restaurant_id ON email_logs(restaurant_id) WHERE restaurant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_logs_status        ON email_logs(status) WHERE status = 'failed';

ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Only service-role (admin client) can read/write — no direct user access
