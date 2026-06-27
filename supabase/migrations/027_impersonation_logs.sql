-- GDPR compliance: audit trail for every admin impersonation action
CREATE TABLE IF NOT EXISTS impersonation_logs (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  admin_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_email   TEXT        NOT NULL,
  target_email  TEXT        NOT NULL,
  reason        TEXT        NOT NULL,
  ip_address    TEXT
);

ALTER TABLE impersonation_logs ENABLE ROW LEVEL SECURITY;
-- No permissive policies — only service-role (admin client) can insert/select.

CREATE INDEX IF NOT EXISTS idx_impersonation_logs_admin_id   ON impersonation_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_impersonation_logs_created_at ON impersonation_logs(created_at DESC);
