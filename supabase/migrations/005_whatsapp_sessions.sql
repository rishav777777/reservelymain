-- ═══════════════════════════════════════════════════════
-- 005 WHATSAPP SESSIONS
-- Tracks pending owner replies for reservation approvals.
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS whatsapp_sessions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id   uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  reservation_id  uuid NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  meta_message_id text,
  message_number  integer NOT NULL DEFAULT 1,
  status          text NOT NULL DEFAULT 'awaiting_reply'
    CHECK (status IN ('awaiting_reply','confirmed','declined','expired')),
  expires_at      timestamptz NOT NULL DEFAULT (now() + interval '2 hours'),
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE whatsapp_sessions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'whatsapp_sessions' AND policyname = 'tenant_isolation'
  ) THEN
    CREATE POLICY "tenant_isolation" ON whatsapp_sessions
      FOR ALL USING (
        restaurant_id IN (
          SELECT restaurant_id FROM profiles
          WHERE id = auth.uid() AND is_active = true
        )
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_wa_sessions_active ON whatsapp_sessions (
  restaurant_id, status, expires_at
);

-- pg_cron: clean up expired sessions daily at 03:00 UTC
-- Uncomment after pg_cron extension is enabled in Supabase
-- SELECT cron.schedule('cleanup-wa-sessions', '0 3 * * *',
--   $$ DELETE FROM whatsapp_sessions WHERE expires_at < now() $$
-- );
