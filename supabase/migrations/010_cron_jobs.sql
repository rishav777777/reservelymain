-- ═══════════════════════════════════════════════════════
-- 010 CRON JOBS (pg_cron + pg_net)
-- Requires both extensions enabled in Supabase dashboard BEFORE running.
-- Database → Extensions → search "pg_cron" → Enable
-- Database → Extensions → search "pg_net"  → Enable
-- If extensions are not enabled, this migration skips silently.
-- ═══════════════════════════════════════════════════════

DO $outer$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    RAISE NOTICE 'pg_cron not enabled — skipping cron job registration. Enable it in Database → Extensions, then re-run this file.';
    RETURN;
  END IF;

  -- Daily WhatsApp summary — 08:00 Berlin (07:00 UTC)
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-wa-summary') THEN
    PERFORM cron.schedule(
      'daily-wa-summary',
      '0 7 * * *',
      $sql$
      SELECT net.http_post(
        url     := 'https://reservely.app/api/notifications/daily-summary',
        headers := jsonb_build_object(
          'Authorization', 'Bearer ' || current_setting('app.cron_secret'),
          'Content-Type',  'application/json'
        )
      )
      $sql$
    );
  END IF;

  -- 24h reservation reminders — runs every hour
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'reservation-reminders') THEN
    PERFORM cron.schedule(
      'reservation-reminders',
      '0 * * * *',
      $sql$
      SELECT net.http_get(
        url     := 'https://reservely.app/api/reservations/reminder',
        headers := jsonb_build_object(
          'Authorization', 'Bearer ' || current_setting('app.cron_secret')
        )
      )
      $sql$
    );
  END IF;

  -- Clean up expired table holds — every 5 minutes
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-table-holds') THEN
    PERFORM cron.schedule(
      'cleanup-table-holds',
      '*/5 * * * *',
      $sql$ DELETE FROM table_holds WHERE held_until < now() $sql$
    );
  END IF;

  -- Clean up expired WhatsApp sessions — daily at 03:00 UTC
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-wa-sessions') THEN
    PERFORM cron.schedule(
      'cleanup-wa-sessions',
      '0 3 * * *',
      $sql$ DELETE FROM whatsapp_sessions WHERE expires_at < now() $sql$
    );
  END IF;

END $outer$;

-- ═══════════════════════════════════════════════════════
-- After enabling extensions, set the cron secret:
-- ALTER DATABASE postgres SET app.cron_secret = 'your-secret-here';
-- ═══════════════════════════════════════════════════════
